const path = require('path');

const { withMeasuredSpan, emitLog } = require('../../../telemetry');

require('@utcp/sdk');
require('@utcp/direct-call');
require('@utcp/http');
require('@utcp/text');
require('@utcp/file');

const { UtcpClient } = require('@utcp/sdk');
const { DotEnvVariableLoader } = require('@utcp/dotenv-loader');

const { getManualCallTemplates, vostManual } = require('./manuals');
const { registerCallables } = require('./tools/vost');
const { isAllowed } = require('./allowlist');

const ROOT_DIR = path.resolve(__dirname, '../../../..');
const SENSITIVE_KEY = /token|secret|password|authorization|api[_-]?key|credential/i;
const DIRECT_TOOLS = new Set(vostManual.tools.map(({ name }) => name));

let clientPromise = null;

const createClient = async () => {
  registerCallables();

  return UtcpClient.create(ROOT_DIR, {
    variables: {},
    load_variables_from: [new DotEnvVariableLoader(path.join(ROOT_DIR, '.env'))],
    manual_call_templates: getManualCallTemplates(),
  });
};

const getClient = () => {
  if (!clientPromise) {
    clientPromise = createClient().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
};

const sanitizeArgs = (args) => {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Argumentos de tool inválidos');
  }

  const keys = Object.keys(args);

  if (keys.some((key) => SENSITIVE_KEY.test(key))) {
    throw new Error('Argumentos de tool contêm dados sensíveis');
  }

  try {
    return JSON.parse(JSON.stringify(args));
  } catch (error) {
    throw new Error('Argumentos de tool não serializáveis');
  }
};

const searchTools = async (query, limit = 20) => {
  const client = await getClient();
  const found = await client.searchTools(String(query || ''), limit);

  return found.filter((tool) => isAllowed(tool.name));
};

const callTool = async (name, args = {}) => {
  if (!isAllowed(name)) {
    throw new Error(`Tool não permitida: ${name}`);
  }

  const safeArgs = sanitizeArgs(args);
  const client = await getClient();

  const payload = DIRECT_TOOLS.has(name) ? { options: safeArgs } : safeArgs;

  try {
    return await withMeasuredSpan('utcp.tool.call', {
      attributes: { 'utcp.tool.name': name },
      countKey: 'toolCalls',
      durationKey: 'toolDuration',
      metricAttributes: { tool: name },
    }, () => client.callTool(name, payload));
  } catch (error) {
    emitLog('utcp.tool.failed', {
      severity: 'ERROR',
      message: 'Falha ao chamar ferramenta UTCP',
      attributes: {
        'utcp.tool.name': name,
        'error.message': error && error.message ? String(error.message) : 'erro desconhecido',
      },
    });
    throw error;
  }
};

const resetUtcpClient = () => {
  clientPromise = null;
};

module.exports = {
  getClient,
  searchTools,
  callTool,
  resetUtcpClient,
  isAllowed,
};
