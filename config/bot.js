const prefix = '!';
const channels = {
  MAIN_CHANNEL_ID: process.env.MAIN_CHANNEL_ID,
  EARTHQUAKES_CHANNEL_ID: process.env.EARTHQUAKES_CHANNEL_ID,
  FIRES_CHANNEL_ID: process.env.FIRES_CHANNEL_ID,
  WARNINGS_CHANNEL_ID: process.env.WARNINGS_CHANNEL_ID,
  WARNINGS_AZ_CHANNEL_ID: process.env.WARNINGS_AZ_CHANNEL_ID,
  WARNINGS_MD_CHANNEL_ID: process.env.WARNINGS_MD_CHANNEL_ID,
  TRIGGERS_CHANNEL_ID: process.env.TRIGGERS_CHANNEL_ID,
  MGMT_CHANNEL_ID: process.env.MGMT_CHANNEL_ID,
  VOLUNTEERS_CHANNEL_ID: process.env.VOLUNTEERS_CHANNEL_ID,
  TWFEED_CHANNEL_ID: process.env.TWFEED_CHANNEL_ID,
  FBFEED_CHANNEL_ID: process.env.FBFEED_CHANNEL_ID,
  DGSCORONA_CHANNEL_ID: process.env.DGSCORONA_CHANNEL_ID,
  CORONAFAQ_CHANNEL_ID: process.env.CORONAFAQ_CHANNEL_ID,
  JOURNAL_CHANNEL_ID: process.env.JOURNAL_CHANNEL_ID,
  TRAVEL_GUIDELINES: process.env.TRAVEL_GUIDELINES,
  COPERNICUS_CHANNEL_ID: process.env.COPERNICUS_CHANNEL_ID,
  ERRORS_CHANNEL_ID: process.env.ERRORS_CHANNEL_ID,
};

const coronaUpdateUsers = process.env.CORONAUPDATEUSERS;
const rallyUpdateUsers = process.env.RALLYUPDATEUSERS;

const userLists = {
  coronaUpdate: typeof coronaUpdateUsers !== 'undefined'
    ? coronaUpdateUsers.split(',')
    : [],
  rallyUpdate: typeof rallyUpdateUsers !== 'undefined'
    ? rallyUpdateUsers.split(',')
    : [],
};

const coronaUpdateRoles = process.env.CORONAUPDATEROLES;
const rallyUpdateRoles = process.env.RALLYUPDATEROLES;

const roleLists = {
  coronaUpdate: typeof coronaUpdateRoles !== 'undefined'
    ? coronaUpdateRoles.split(',')
    : [],
  rallyUpdate: typeof rallyUpdateRoles !== 'undefined'
    ? rallyUpdateRoles.split(',')
    : [],
};

const { COOLDOWN = '' } = process.env;

const cooldown = COOLDOWN.length === 0 ? 10 : COOLDOWN;

const betaMode = (/true/i).test(process.env.BETA_MODE);

// Temporary operational switch: only !chat is active; no triggers, other
// commands or scheduled jobs. It also implies the chat adapter is enabled.
const chatOnlyMode = (/true/i).test(process.env.LLM_CHAT_ONLY);

const llmChatEnabled = chatOnlyMode
  || (process.env.LLM_CHAT_ENABLED !== undefined
    && (/true/i).test(process.env.LLM_CHAT_ENABLED));

const llmChatChannels = (process.env.LLM_ALLOWED_CHANNELS || '')
  .split(',')
  .map(channel => channel.trim())
  .filter(channel => channel.length > 0);

// Terminal input for direct questions in the bot pane (no Discord roundtrip).
const llmChatLocalInput = (/true/i).test(process.env.LLM_CHAT_LOCAL_INPUT);

module.exports = {
  prefix,
  channels,
  userLists,
  roleLists,
  cooldown,
  betaMode,
  llmChatEnabled,
  llmChatChannels,
  chatOnlyMode,
  llmChatLocalInput,
};
