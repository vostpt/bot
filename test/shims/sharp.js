/**
 * Test-only stub: the native sharp binary is not needed by the command tests
 * that import services/index.js, and may be unavailable in the local runner.
 */
// Minimal 1x1 PNG so image workflows can assert a real PNG signature
// without requiring the native sharp binary in the test runner.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
);

const processor = () => {
  const chain = {
    resize: () => chain,
    composite: () => chain,
    png: () => chain,
    jpeg: () => chain,
    toBuffer: async () => PNG_1X1,
    toFile: async () => ({}),
    metadata: async () => ({}),
  };

  return chain;
};

module.exports = processor;
module.exports.versions = { sharp: 'test-stub', vips: 'test-stub' };
