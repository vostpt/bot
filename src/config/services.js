module.exports = {
  // Social Networks - only enabled flag needed
  DISCORD: {
    enabled: true
  },
  FACEBOOK: {
    enabled: true
  },
  TWITTER: {
    enabled: true
  },
  MASTODON: {
    enabled: false
  },
  TELEGRAM: {
    enabled: true
  },
  BSKY: {
    enabled: false
  },

  // Data and Utility Services - both scheduleTime and interval included
  ACRONYMS: {
    enabled: true,
    scheduleTime: null,
    interval: null
  },
  FIRES: {
    enabled: true,
    scheduleTime: '10:00',
    interval: 5
  },
  EARTHQUAKES: {
    enabled: true,
    scheduleTime: null,
    interval: 1
  },
  CORONA: {
    enabled: true,
    scheduleTime: '12:00',
    interval: 3
  },
  IPMA: {
    enabled: true,
    scheduleTime: null,
    interval: 5
  },
  JOURNAL: {
    enabled: true,
    scheduleTime: '09:00',
    interval: 2
  },
  MEDEA: {
    enabled: true,
    scheduleTime: null,
    interval: 1
  },
  METEOALARM: {
    enabled: true,
    scheduleTime: null,
    interval: 10
  },
  PROCIV: {
    enabled: true,
    scheduleTime: null,
    interval: 5
  },
  RALLY: {
    enabled: false,
    scheduleTime: '08:00',
    interval: null
  },
  SNS: {
    enabled: true,
    scheduleTime: '14:00',
    interval: null
  },
  VIAJAR: {
    enabled: true,
    scheduleTime: '10:00',
    interval: null
  },
  WARNINGS: {
    enabled: true,
    scheduleTime: null,
    interval: 5
  },
  WEATHER: {
    enabled: true,
    scheduleTime: '10:15',
    interval: null
  },
  WINDS: {
    enabled: true,
    scheduleTime: '08:00',
    interval: null
  }
};
