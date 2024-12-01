const warningTypes = {
  'Tempo Frio': {
    strType: 'TempoFrio',
    emoji: '❄🌡',
    emojiDiscord: ':snowflake:️:thermometer:',
  },
  'Tempo Quente': {
    strType: 'TempoQuente',
    emoji: '☀🌡',
    emojiDiscord: ':sunny:️:thermometer:',
  },
  'Precipitação': {
    strType: 'Chuva',
    emoji: '🌧',
    emojiDiscord: ':cloud_rain:',
  },
  'Nevoeiro': {
    strType: 'Nevoeiro',
    emoji: '🌫',
    emojiDiscord: ':fog:',
  },
  'Neve': {
    strType: 'Neve',
    emoji: '❄',
    emojiDiscord: ':snowflake:',
  },
  'Agitação Marítima': {
    strType: 'AgitaçãoMarítima',
    emoji: '🌊',
    emojiDiscord: ':ocean:',
  },
  'Trovoada': {
    strType: 'Trovoada',
    emoji: '⛈',
    emojiDiscord: ':thunder_cloud_rain:',
  },
  'Vento': {
    strType: 'Vento',
    emoji: '🌬️',
    emojiDiscord: ':dash:',
  },
};

const regionsData = {
  ACE: {
    strRegion: 'GrupoCentral',
    zone: 'azores',
  },
  // ... rest of regionsData
};

const warningSeverities = {
  yellow: 'Amarelo',
  orange: 'Laranja',
  red: 'Vermelho',
};

const DATE_FORMATS = {
  first: 'YYYY-MM-DD H:mm',
};

module.exports = {
  warningTypes,
  regionsData,
  warningSeverities,
  DATE_FORMATS,
};
