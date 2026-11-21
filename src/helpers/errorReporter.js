let discordClient = null;
let reporting = false;

const redact = (value) => String(value)
  .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
  .replace(/(token|secret|password|authorization)(["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi,
    '$1$2[REDACTED]');

const describeError = (error) => {
  if (error instanceof Error) return redact(error.stack || error.message);

  try {
    return redact(JSON.stringify(error, (key, value) => (
      /token|secret|password|authorization|cookie/i.test(key) ? '[REDACTED]' : value
    )));
  } catch (_error) {
    return redact(error);
  }
};

const configureErrorReporter = (client) => {
  discordClient = client;
};

const resetErrorReporter = () => {
  discordClient = null;
  reporting = false;
};

const reportCriticalError = async (source, error, details) => {
  const channelId = process.env.ERRORS_CHANNEL_ID?.trim();
  if (!discordClient || !channelId) return { sent: false, reason: 'not-configured' };
  if (reporting) return { sent: false, reason: 'already-reporting' };

  reporting = true;

  try {
    const channel = discordClient.channels.cache?.get(channelId)
      || await discordClient.channels.fetch(channelId);
    if (!channel) return { sent: false, reason: 'channel-not-found' };

    const detailText = details === undefined ? '' : `\n**Details:** ${describeError(details)}`;
    const content = [
      '🚨 **Bot critical error**',
      `**Source:** ${redact(source)}`,
      `**Time:** ${new Date().toISOString()}`,
      `\`\`\`text\n${describeError(error)}\n\`\`\`${detailText}`,
    ].join('\n').slice(0, 1950);

    await channel.send({
      content,
      allowedMentions: { parse: [] },
    });

    return { sent: true };
  } catch (reportingError) {
    console.error('[ErrorReporter] Failed to send Discord alert:', reportingError.message);
    return { sent: false, reason: 'send-failed' };
  } finally {
    reporting = false;
  }
};

module.exports = {
  configureErrorReporter,
  describeError,
  reportCriticalError,
  resetErrorReporter,
};
