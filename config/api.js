const baseURL = 'https://bot-api.vost.pt';

const baseFaqsURL = (id, gid) => `https://spreadsheets.google.com/feeds/list/${id}/${gid}/public/values?alt=json`;

const dgsSentences = {
  id: process.env.DGSSENTENCESID,
  gid: process.env.DGSSENTENCESGID,
};

const dgsSentencesURL = baseFaqsURL(dgsSentences.id, dgsSentences.gid);

module.exports = {
  baseURL,
  dgsSentencesURL,
};
