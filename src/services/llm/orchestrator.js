const { withMeasuredSpan } = require('../../telemetry');
const { chat } = require('./index');
const utcp = require('./utcp/client');
const { isAllowed } = require('./utcp/allowlist');
const prompts = require('./prompts/vostptia');

const MAX_TOOL_CALLS = 4;
const MAX_SEARCH_TOOLS = 8;
const MAX_PLANNING_STEPS = 2;
const MAX_ANSWER_CHARS = 1900;
const MAX_RESULT_CHARS = 800;
const PLANNING_MAX_TOKENS = 1800;
const FINAL_MAX_TOKENS = 1600;
const EMPTY_RESPONSE_RETRY_TOKENS = 800;

const truncate = (text, limit) => {
  const value = String(text || '');

  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
};

const extractJson = (text) => {
  const fenced = String(text || '').match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : String(text || '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');

  if (start < 0 || end <= start) {
    throw new Error('Plano do agente não é JSON válido');
  }

  return JSON.parse(raw.slice(start, end + 1));
};

const parsePlan = (text) => {
  const plan = extractJson(text);
  const calls = plan && (plan.calls || plan.tools || plan.tool_calls);

  if (!Array.isArray(calls)) {
    throw new Error('Plano do agente sem chamadas de ferramentas');
  }

  if (calls.length > MAX_TOOL_CALLS) {
    throw new Error('Plano do agente ultrapassa o limite de ferramentas');
  }

  return calls;
};

const validateCalls = (calls, candidateNames) => calls.map((call) => {
  if (!call || typeof call.name !== 'string') {
    throw new Error('Chamada de ferramenta inválida');
  }

  if (!isAllowed(call.name) || !candidateNames.includes(call.name)) {
    throw new Error(`Ferramenta não autorizada: ${call.name}`);
  }

  const args = call.arguments === undefined ? {} : call.arguments;

  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Argumentos de ferramenta inválidos');
  }

  return { name: call.name, args };
});

const messagesFor = (system, userContent) => [
  { role: 'system', content: system },
  { role: 'user', content: userContent },
];

/**
 * Tool results are summarized instead of pasted verbatim: reasoning models
 * would otherwise spend the whole token budget before writing an answer.
 */
const serializeResults = (results, { minimal = false } = {}) => results.map(({ name, result }) => {
  const isObject = result && typeof result === 'object';
  const summary = isObject ? {
    source: result.source,
    retrievedAt: result.retrievedAt,
    available: 'available' in result ? result.available : true,
    reason: result.reason,
    count: Array.isArray(result.data) ? result.data.length : undefined,
    samples: minimal ? undefined : (Array.isArray(result.data) ? result.data.slice(0, 2) : undefined),
    note: result.note,
  } : { value: result };

  return {
    name,
    available: summary.available === undefined ? true : summary.available,
    result: truncate(JSON.stringify(summary), MAX_RESULT_CHARS),
  };
});

/** Retry once with more room when a reasoning model returns no answer text. */
const askLlm = async (chatFn, messages, maxTokens, phase = 'llm') => withMeasuredSpan(`llm.${phase}`, {
  attributes: { 'llm.phase': phase },
  countKey: 'llmCalls',
  durationKey: 'llmDuration',
  metricAttributes: { phase },
}, async () => {
  try {
    return await chatFn({ messages, maxTokens });
  } catch (error) {
    if (!error || error.code !== 'EMPTY_RESPONSE') {
      throw error;
    }

    return chatFn({
      messages,
      maxTokens: maxTokens + EMPTY_RESPONSE_RETRY_TOKENS,
    });
  }
});

/**
 * Single orchestrator: plans tool calls, executes validated read-only tools
 * through UTCP, then asks the LLM for a short grounded answer.
 *
 * Any failure is propagated to the command layer, which owns the error reply.
 */
const runChat = async ({
  question,
  history = [],
  dateContext = null,
  tools = null,
  deps = {},
} = {}) => {
  if (typeof question !== 'string' || question.trim() === '') {
    throw new Error('Pergunta inválida');
  }

  const chatFn = deps.chat || chat;
  const searchTools = deps.searchTools || utcp.searchTools;
  const callTool = deps.callTool || utcp.callTool;

  const candidates = Array.isArray(tools)
    ? tools
    : await searchTools(question, MAX_SEARCH_TOOLS);

  const allowedCandidates = candidates.filter((tool) => tool && isAllowed(tool.name));
  const system = prompts.systemPrompt();

  // Step 1 of at most 2 LLM steps: choose tools.
  const planText = await askLlm(chatFn, messagesFor(system, prompts.planningPrompt({
    question,
    history,
    dateContext,
    tools: allowedCandidates,
  })), PLANNING_MAX_TOKENS, 'plan');

  const calls = validateCalls(parsePlan(planText), allowedCandidates.map(({ name }) => name));

  const results = await Promise.all(calls.map(async ({ name, args }) => ({
    name,
    args,
    result: await callTool(name, args),
  })));

  // Step 2 of at most 2 LLM steps: final answer grounded in the tool results.
  const finalMessages = serializedResults => messagesFor(system, prompts.finalPrompt({
    question,
    history,
    dateContext,
    results: serializedResults,
  }));

  let finalText;

  try {
    finalText = await askLlm(chatFn, finalMessages(serializeResults(results)), FINAL_MAX_TOKENS, 'answer');
  } catch (error) {
    if (!error || error.code !== 'EMPTY_RESPONSE') {
      throw error;
    }

    // Last resort: only sources, availability and counts, with more room.
    finalText = await withMeasuredSpan('llm.answer-retry', {
      attributes: { 'llm.phase': 'answer-retry' },
      countKey: 'llmCalls',
      durationKey: 'llmDuration',
      metricAttributes: { phase: 'answer-retry' },
    }, () => chatFn({
      messages: finalMessages(serializeResults(results, { minimal: true })),
      maxTokens: FINAL_MAX_TOKENS + (EMPTY_RESPONSE_RETRY_TOKENS * 2),
    }));
  }

  const answer = truncate(String(finalText || '').trim(), MAX_ANSWER_CHARS);

  if (answer === '') {
    throw new Error('Resposta final vazia');
  }

  const sources = [...new Set(results
    .map(({ result }) => result && result.source)
    .filter((source) => typeof source === 'string' && source !== ''))];

  return { answer, sources };
};

module.exports = {
  runChat,
  parsePlan,
  validateCalls,
  serializeResults,
  askLlm,
  truncate,
  MAX_TOOL_CALLS,
  MAX_SEARCH_TOOLS,
  MAX_PLANNING_STEPS,
  MAX_ANSWER_CHARS,
  PLANNING_MAX_TOKENS,
  FINAL_MAX_TOKENS,
};
