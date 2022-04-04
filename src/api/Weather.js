const api = require('./api');
const { baseURL } = require('../../config/api');

const getByDay = (day = 0) => api.get(`${baseURL}/getIPMA.php?day=${day}`);

const dailyReportURL = (region) => `https://raw.githubusercontent.com/vostpt/daily_weather_report/main/daily_meteo_report_${region}.png`;

const getDailyReportURL = () => {
  return {
    pt: dailyReportURL('pt'),
    mad: dailyReportURL('mad'),
    az: dailyReportURL('az'),
  }
};

const getDailyReportImg = async () => {
  const reportPt = await api.getFileStream(dailyReportURL('pt'));
  const reportMad = await api.getFileStream(dailyReportURL('mad'));
  const reportAz = await api.getFileStream(dailyReportURL('az'));

  return {
    pt: reportPt,
    mad: reportMad,
    az: reportAz,
  };
};

module.exports = {
  getByDay,
  dailyReportURL,
  getDailyReportURL,
  getDailyReportImg,
};
