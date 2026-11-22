const path = require('path');

require('@utcp/sdk');
require('@utcp/direct-call');
require('@utcp/http');
require('@utcp/text');
require('@utcp/file');

const { UtcpClient } = require('@utcp/sdk');
const { DotEnvVariableLoader } = require('@utcp/dotenv-loader');

const { getManualCallTemplates, vostManual } = require('./manuals');
const { registerVostCallables } = require('./tools/vost');
const { isAllowed } = require('./allowlist');

const SENSITIVE_KEY = /token|secret|password|authorization|api[_-]?key|credential/i;
const DIRECT_TOOLS = new Set(vostManual.tools.map(({ name }) => name));

let clientPromise = null;

const noop = () => {};

const wrapTelemetry = (telemetry = {}) => {
  const withMeasuredSpan = telemetry.withMeasuredSpan
    || ((name, attrs, fn) => fn());
  const emitLog = telemetry.emitLog || noop;

  return { withMeasuredSpan, emitLog };
};

const createClient = async ({ rootDir, services, apis, telemetry = {} } = {}) => {
  const safeRootDir = rootDir || process.cwd();
  const { withMeasuredSpan, emitLog } = wrapTelemetry(telemetry);

  registerVostCallables({ services, apis });

  const client = await UtcpClient.create(safeRootDir, {
    variables: {},
    load_variables_from: [new DotEnvVariableLoader(path.join(safeRootDir, '.env'))],
    manual_call_templates: getManualCallTemplates(),
  });

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
    const found = await client.searchTools(String(query || ''), limit);

    return found.filter((tool) => isAllowed(tool.name));
  };

  const callTool = async (name, args = {}) => {
    if (!isAllowed(name)) {
      throw new Error(`Tool não permitida: ${name}`);
    }

    const safeArgs = sanitizeArgs(args);
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

  const getClient = () => client;

  return {
    getClient,
    searchTools,
    callTool,
    resetUtcpClient,
    isAllowed,
  };
};

const getClientSingleton = async (options) => {
  if (!clientPromise) {
    clientPromise = createClient(options).catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
};

module.exports = {
  createClient,
  getClient: getClientSingleton,
};
