const MAX_ANSWER_CHARS = 1900;


const SOURCES = [
  {
    label: 'Protecção Civil e fogos — API VOST (bot-api.vost.pt)',
    tools: [
      ['vost_prociv.get_all', 'ocorrências atuais'],
      ['vost_prociv.get_by_id', 'ocorrência por ID'],
      ['vost_prociv.get_by_city', 'ocorrências por localidade'],
      ['vost_prociv.filter_by_status', 'ocorrências por estado'],
      ['vost_fires.get_important', 'incêndios importantes'],
      ['vost_fires.get_by_district', 'incêndios por distrito'],
      ['vost_http.fire_risk_map', 'mapa de risco de incêndio do IPMA'],
    ],
  },
  {
    label: 'Sismos — API VOST (bot-api.vost.pt)',
    tools: [
      ['vost_earthquakes.get_by_date', 'sismos de uma data'],
    ],
  },
  {
    label: 'Tempo e avisos — IPMA, MeteoAlarm e GitHub',
    tools: [
      ['vost_ipma.get_current_warnings', 'avisos meteorológicos do IPMA'],
      ['vost_meteoalarm.get_current', 'avisos meteorológicos na Europa'],
      ['vost_weather.get_by_day', 'previsão para hoje ou amanhã'],
      ['vost_http.weather_report_pt', 'extremos diários do Continente'],
      ['vost_http.weather_report_mad', 'extremos diários da Madeira'],
      ['vost_http.weather_report_az', 'extremos diários dos Açores'],
    ],
  },
  {
    label: 'Saúde — SNS24 e DGS',
    tools: [
      ['vost_sns.get_alerts', 'alertas do SNS24'],
      ['vost_corona.get_all', 'relatórios COVID guardados'],
      ['vost_corona.get_resume', 'resumo DGS por data'],
    ],
  },
  {
    label: 'Diário da República — RSS dre.pt',
    tools: [
      ['vost_journal.get_recent', 'decretos e despachos dos últimos 7 dias'],
    ],
  },
  {
    label: 'Acrónimos — API VOST (api.vost.pt)',
    tools: [
      ['vost_acronyms.get_exact', 'definição de um acrónimo'],
      ['vost_http.acronym_lookup', 'definição de um acrónimo (consulta direta)'],
    ],
  },
  {
    label: 'Documentação da VOST — ficheiros Markdown em `rag/` (ex.: `rag/vost.md`)',
    tools: [],
  },
];

const SELF_TERMS = /\b(?:tu|te|tua|tuas|teu|vais|usas|usa|uses|consegues|consegue|podes|pode|tens|tem|consultas|buscas|buscar|sabes|sabe|trabalhas|vem|vêm)\b/i;
const SOURCE_TERMS = /\b(?:fontes?|apis?|ferramentas?|integra[cç][oõ]es?|integracoes|origens?|capacidades|dados|informa[cç][aã]o|informacao)\b/i;
const ABOUT_SELF = /\b(?:o\s+que\s+sabes\s+fazer|como\s+trabalhas)\b/i;

const isCapabilityQuestion = (question) => {
  const text = String(question || '');

  return ABOUT_SELF.test(text) || (SELF_TERMS.test(text) && SOURCE_TERMS.test(text));
};

const answer = (maxChars = MAX_ANSWER_CHARS) => {
  const lines = ['Posso ir buscar dados a estas fontes (todas só de leitura):', ''];

  SOURCES.forEach(({ label, tools }) => {
    lines.push(`• ${label}`);
    tools.forEach(([name, description]) => {
      lines.push(`  - ${description} (\`${name}\`)`);
    });
  });

  lines.push('');
  lines.push('Fora do `!chat`, o bot também usa Twitter/X, Facebook, Telegram, Mastodon, Bluesky, Google Sheets, FTP, MEDEA e o Portal das Comunidades, sobretudo para publicar ou em jobs agendados.');
  lines.push('Não publico nem escrevo nada; só consulto dados.');

  const text = lines.join('\n');

  return text.length <= maxChars
    ? text
    : `${text.slice(0, maxChars - 1)}…`;
};

const result = () => ({ answer: answer(), sources: [] });

module.exports = {
  SOURCES,
  isCapabilityQuestion,
  answer,
  result,
};
