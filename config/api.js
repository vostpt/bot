const baseURL = 'https://bot-api.vost.pt';

const baseFaqsURL = (id, gid) => `https://spreadsheets.google.com/feeds/list/${id}/${gid}/public/values?alt=json`;

const dgsResumes = {
  id: process.env.DGSRESUMESID,
  gid: process.env.DGSRESUMESGID,
};

const dgsResumesURL = baseFaqsURL(dgsResumes.id, dgsResumes.gid);

module.exports = {
  baseURL,
  dgsResumesURL,
};
