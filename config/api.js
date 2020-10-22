const baseURL = 'https://bot-api.vost.pt';

const baseFaqsURL = (id, gid) => `https://spreadsheets.google.com/feeds/list/${id}/${gid}/public/values?alt=json`;

const dgsResumes = {
  id: process.env.DGSRESUMESID,
  resumeGid: process.env.DGSRESUMESGID,
  dataGid: process.env.DGSRESUMESDATAGID,
};

const dgsResumesURL = baseFaqsURL(dgsResumes.id, dgsResumes.resumeGid);

module.exports = {
  baseURL,
  dgsResumes,
  dgsResumesURL,
};
