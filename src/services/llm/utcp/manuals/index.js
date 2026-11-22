const vostManual = require('./vost.json');
const httpManual = require('./http.json');

const DIRECT_CALL = 'direct-call';
const HTTP = 'http';

const groupOf = (toolName) => toolName.split('.')[0];

const directGroups = [...new Set(vostManual.tools.map(({ name }) => groupOf(name)))];

/**
 * Builds the manual returned by a direct-call manual callable. Tool names are
 * short here: the UTCP client adds the manual prefix during registration.
 */
const getDirectManual = (group) => ({
  utcp_version: vostManual.utcp_version,
  manual_version: vostManual.manual_version,
  tools: vostManual.tools
    .filter(({ name }) => groupOf(name) === group)
    .map((tool) => ({
      ...tool,
      name: tool.name.slice(group.length + 1),
      tool_call_template: { ...tool.tool_call_template },
    })),
});

const getManualCallTemplates = () => [
  ...directGroups.map((group) => ({
    call_template_type: DIRECT_CALL,
    name: group,
    callable_name: `${group}.__manual__`,
    allowed_communication_protocols: [DIRECT_CALL],
  })),
  {
    call_template_type: 'text',
    name: 'vost_http',
    content: JSON.stringify(httpManual),
    allowed_communication_protocols: [HTTP],
  },
];

const getAllToolNames = () => [
  ...vostManual.tools.map(({ name }) => name),
  ...httpManual.tools.map(({ name }) => name),
];

module.exports = {
  getDirectManual,
  getManualCallTemplates,
  getAllToolNames,
  directGroups,
  vostManual,
  httpManual,
};
