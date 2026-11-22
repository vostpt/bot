const path = require('path');
const { createClient, isAllowed } = require('utcp-vost');

const services = require('../../services');
const apis = require('../../api');
const { withMeasuredSpan, emitLog } = require('../../telemetry');

const options = {
  rootDir: path.resolve(__dirname, '../../..'),
  services,
  apis,
  telemetry: { withMeasuredSpan, emitLog },
};

let clientPromise = null;

const getInstance = async () => {
  if (!clientPromise) {
    clientPromise = createClient(options).catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
};

const getClient = async () => {
  const instance = await getInstance();

  return instance.getClient();
};

const searchTools = async (...args) => {
  const instance = await getInstance();

  return instance.searchTools(...args);
};

const callTool = async (...args) => {
  const instance = await getInstance();

  return instance.callTool(...args);
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
