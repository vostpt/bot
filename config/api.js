const baseURL = 'https://bot-api.vost.pt';

const baseFaqsURL = (id, gid) => `https://spreadsheets.google.com/feeds/list/${id}/${gid}/public/values?alt=json`;

const coronaFaqRefs = {
  id: process.env.CORONAFAQID,
  gid: process.env.CORONAFAQGID,
};

const coronaFaqsURL = baseFaqsURL(coronaFaqRefs.id, coronaFaqRefs.gid);

module.exports = {
  baseURL,
  coronaFaqsURL,
};
