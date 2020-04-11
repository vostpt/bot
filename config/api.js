const baseURL = 'https://bot-api.vost.pt';

const baseFaqsURL = (id, gid) => `https://spreadsheets.google.com/feeds/list/${id}/${gid}/public/values?alt=json`;

const coronaFaqRefs = {
  id: process.env.CORONAFAQID,
  gid: process.env.CORONAFAQGID,
};

const coronaFaqsURL = baseFaqsURL(coronaFaqRefs.id, coronaFaqRefs.gid);

const coronaFaqDgsRefs = {
  id: process.env.CORONAFAQDGSID,
  gid: process.env.CORONAFAQDGSGID,
};

const coronaFaqsDgsURL = baseFaqsURL(coronaFaqDgsRefs.id, coronaFaqDgsRefs.gid);

module.exports = {
  baseURL,
  coronaFaqsURL,
  coronaFaqsDgsURL,
};
