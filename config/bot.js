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
  DGSCORONA_CHANNEL_ID: process.env.DGSCORONA_CHANNEL_ID,
  CORONAFAQ_CHANNEL_ID: process.env.CORONAFAQ_CHANNEL_ID,
  JOURNAL_CHANNEL_ID: process.env.JOURNAL_CHANNEL_ID,
};

const coronaUpdateUsers = process.env.CORONAUPDATEUSERS;

const userLists = {
  coronaUpdate: typeof coronaUpdateUsers !== 'undefined'
    ? coronaUpdateUsers.split(',')
    : [],
};

const coronaUpdateRoles = process.env.CORONAUPDATEROLES;

const roleLists = {
  coronaUpdate: typeof coronaUpdateRoles !== 'undefined'
    ? coronaUpdateRoles.split(',')
    : [],
};

const { COOLDOWN = '' } = process.env;

const cooldown = COOLDOWN.length === 0 ? 10 : COOLDOWN;

const betaMode = (/true/i).test(process.env.BETA_MODE);

module.exports = {
  prefix,
  channels,
  userLists,
  roleLists,
  cooldown,
  betaMode,
};
