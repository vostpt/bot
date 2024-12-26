require('dotenv').config();

const isServiceEnabled = (serviceName) => {
  const envVar = process.env[`${serviceName}_ENABLED`];
  return envVar === undefined || envVar.toLowerCase() === 'true';
};

const hasRequiredKeys = (keys) => {
  return keys.every(key => process.env[key] && process.env[key].length > 0);
};

const getTwitterAccountConfig = (prefix) => {
  const requiredKeys = [
    `${prefix}_CONSUMER_KEY`,
    `${prefix}_CONSUMER_SECRET`,
    `${prefix}_ACCESS_TOKEN_KEY`,
    `${prefix}_ACCESS_TOKEN_SECRET`
  ];

  if (hasRequiredKeys(requiredKeys)) {
    return {
      consumer_key: process.env[`${prefix}_CONSUMER_KEY`],
      consumer_secret: process.env[`${prefix}_CONSUMER_SECRET`],
      access_token: process.env[`${prefix}_ACCESS_TOKEN_KEY`],
      access_token_secret: process.env[`${prefix}_ACCESS_TOKEN_SECRET`]
    };
  }
  return null;
};

const config = {
  app: {
    environment: process.env.NODE_ENV || 'development',
    beta: process.env.BETA_MODE === 'true',
    cooldown: parseInt(process.env.COOLDOWN, 10) || 10
  },

  discord: {
    enabled: isServiceEnabled('DISCORD') && hasRequiredKeys(['BOT_TOKEN']),
    token: process.env.BOT_TOKEN,
    channels: {
      main: process.env.MAIN_CHANNEL_ID,
      earthquakes: process.env.EARTHQUAKES_CHANNEL_ID,
      fires: process.env.FIRES_CHANNEL_ID,
      warnings: process.env.WARNINGS_CHANNEL_ID,
      warnings_az: process.env.WARNINGS_AZ_CHANNEL_ID,
      warnings_md: process.env.WARNINGS_MD_CHANNEL_ID,
      triggers: process.env.TRIGGERS_CHANNEL_ID,
      management: process.env.MGMT_CHANNEL_ID,
      volunteers: process.env.VOLUNTEERS_CHANNEL_ID,
      twitter_feed: process.env.TWFEED_CHANNEL_ID,
      facebook_feed: process.env.FBFEED_CHANNEL_ID,
      journal: process.env.JOURNAL_CHANNEL_ID,
      travel_guidelines: process.env.TRAVEL_GUIDELINES
    },
    permissions: {
      corona: {
        roles: process.env.CORONAUPDATEROLES?.split(',') || [],
        users: process.env.CORONAUPDATEUSERS?.split(',') || []
      },
      rally: {
        roles: process.env.RALLYUPDATEROLES?.split(',') || [],
        users: process.env.RALLYUPDATEUSERS?.split(',') || []
      }
    }
  },

  twitter: {
    enabled: isServiceEnabled('TWITTER') && hasRequiredKeys([
      'TWITTER_CONSUMER_KEY',
      'TWITTER_CONSUMER_SECRET',
      'TWITTER_ACCESS_TOKEN_KEY',
      'TWITTER_ACCESS_TOKEN_SECRET'
    ]),
    accounts: {
      main: getTwitterAccountConfig('TWITTER'),
      azores: getTwitterAccountConfig('TWITTER_AZ'),
      europe: getTwitterAccountConfig('TWITTER_EU'),
      ia: getTwitterAccountConfig('TWITTER_IA'),
      dre: getTwitterAccountConfig('TWITTER_DRE'),
      rally: getTwitterAccountConfig('TWITTER_RALLY')
    }
  },

  facebook: {
    enabled: isServiceEnabled('FACEBOOK') && hasRequiredKeys(['FACEBOOK_TOKEN_VOSTPT']),
    tokens: {
      vostpt: process.env.FACEBOOK_TOKEN_VOSTPT,
      rally: process.env.FACEBOOK_TOKEN_RALLY
    }
  },

  telegram: {
    enabled: isServiceEnabled('TELEGRAM') && hasRequiredKeys(['TELEGRAM_API_KEY', 'TELEGRAM_CHAT_ID']),
    main: {
      api_key: process.env.TELEGRAM_API_KEY,
      chat_id: process.env.TELEGRAM_CHAT_ID
    },
    rally: {
      api_key: process.env.TELEGRAM_RALLY_API_KEY,
      chat_id: process.env.TELEGRAM_RALLY_CHAT_ID
    }
  },

  mastodon: {
    enabled: isServiceEnabled('MASTODON') && hasRequiredKeys(['VOSTPT_ACCESS_TOKEN']),
    tokens: {
      vostpt: process.env.VOSTPT_ACCESS_TOKEN,
      ptdre: process.env.PTDRE_ACCESS_TOKEN
    }
  },

  bluesky: {
    enabled: isServiceEnabled('BLUESKY') && hasRequiredKeys(['BSKY_HANDLE', 'BSKY_PASS', 'BSKY_REPOHANDLE']),
    handle: process.env.BSKY_HANDLE,
    password: process.env.BSKY_PASS,
    repohandle: process.env.BSKY_REPOHANDLE
  },

  ftp: {
    enabled: isServiceEnabled('FTP') && hasRequiredKeys(['FTPSERVER', 'FTPUSER', 'FTPPASSWORD']),
    server: process.env.FTPSERVER,
    user: process.env.FTPUSER,
    password: process.env.FTPPASSWORD
  },

  dgs: {
    enabled: isServiceEnabled('DGS') && hasRequiredKeys(['DGSRESUMESID', 'DGSRESUMESGID', 'DGSRESUMESDATAGID']),
    resume: {
      sid: process.env.DGSRESUMESID,
      gid: process.env.DGSRESUMESGID,
      datagid: process.env.DGSRESUMESDATAGID
    }
  },

  firebase: {
    enabled: isServiceEnabled('FIREBASE') && hasRequiredKeys(['FBASEKEY']),
    key: process.env.FBASEKEY,
    warningAppKey: process.env.WARNINGAPPKEY
  },

  rally: {
    enabled: isServiceEnabled('RALLY') && hasRequiredKeys(['RALLYFILEPATH']),
    filePath: process.env.RALLYFILEPATH
  }
};

const validateConfig = () => {
  if (config.app.environment !== 'production') return;

  const requiredServices = {
    discord: ['token', 'channels.volunteers'],
    twitter: ['accounts.main'],
    telegram: ['main.api_key', 'main.chat_id']
  };

  for (const [service, requiredFields] of Object.entries(requiredServices)) {
    if (!config[service].enabled) continue;

    for (const field of requiredFields) {
      const value = field.split('.').reduce((obj, key) => obj && obj[key], config[service]);
      if (!value) {
        throw new Error(`Missing required configuration for ${service}: ${field}`);
      }
    }
  }
};

const logServiceStatus = () => {
  console.log('\nService Status:');
  console.log('---------------');
  
  // Log main services
  Object.entries(config)
    .filter(([_, value]) => typeof value === 'object' && 'enabled' in value)
    .forEach(([service, value]) => {
      console.log(`${service}: ${value.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      
      // Special handling for Twitter accounts
      if (service === 'twitter' && value.enabled) {
        console.log('  Twitter Accounts:');
        Object.entries(value.accounts)
          .forEach(([account, config]) => {
            console.log(`    ${account}: ${config ? '✅ Configured' : '❌ Not Configured'}`);
          });
      }
    });
  console.log('---------------\n');
};

validateConfig();
if (config.app.environment !== 'test') {
  logServiceStatus();
}

module.exports = config;
