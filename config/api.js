const baseURL = 'https://bot-api.vost.pt';

const baseFaqsURL = (id, gid) => `https://docs.google.com/spreadsheets/d/e/${id}/pub?gid=${gid}&single=true&output=csv`;

const coronaFaqRefs = {
  id: process.env.CORONAFAQID,
  gid: process.env.CORONAFAQGID,
};

const coronaFaqsURL = baseFaqsURL(coronaFaqRefs.id, coronaFaqRefs.gid);

const govFaqRefs = {
  id: process.env.GOVFAQID,
  gid: process.env.GOVFAQGID,
};

const govFaqsURL = baseFaqsURL(govFaqRefs.id, govFaqRefs.gid);

module.exports = {
  baseURL,
  coronaFaqsURL,
  govFaqsURL,
};
