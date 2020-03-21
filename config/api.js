const baseURL = 'https://bot-api.vost.pt';

const coronaFaqRefs = {
  id: process.env.CORONAFAQID,
  gid: process.env.CORONAFAQGID,
};

const coronaFaqsURL = `https://docs.google.com/spreadsheets/d/e/${coronaFaqRefs.id}/pub?gid=${coronaFaqRefs.gid}&single=true&output=csv`;

const govFaqRefs = {
  id: process.env.GOVFAQID,
  gid: process.env.GOVFAQGID,
};

const govFaqsURL = `https://docs.google.com/spreadsheets/d/e/${govFaqRefs.id}/pub?gid=${govFaqRefs.gid}&single=true&output=csv`;

module.exports = {
  baseURL,
  coronaFaqsURL,
  govFaqsURL,
};
