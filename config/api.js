const baseURL = 'https://bot-api.vost.pt';

const coronaFaqRefs = {
  id: process.env.CORONAFAQID,
  gid: process.env.CORONAFAQGID,
};

const faqsURL = `https://docs.google.com/spreadsheets/d/e/${coronaFaqRefs.id}/pub?gid=${coronaFaqRefs.gid}&single=true&output=csv`;

module.exports = {
  baseURL,
  faqsURL,
};
