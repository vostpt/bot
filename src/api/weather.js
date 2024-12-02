const api = require('./api');
const { baseURL } = require('../../config/api');

// Constants
const LOG_PREFIX = '[Weather-API]';
const GITHUB_REPORT_URL = 'https://raw.githubusercontent.com/vostpt/daily_weather_report/main/daily_meteo_report_';
const REGIONS = ['pt', 'mad', 'az'];

const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error)
};

/**
 * Get weather data for a specific day
 * @param {number} day - Days offset (0 for today)
 * @returns {Promise<Object>} Weather data
 */
const getByDay = async (day = 0) => {
  try {
    const response = await api.get(`${baseURL}/getIPMA.php?day=${day}`);
    logger.info(`Retrieved weather data for day ${day}`);
    return response;
  } catch (error) {
    logger.error(`Failed to fetch weather data for day ${day}`, error);
    throw error;
  }
};

/**
 * Get URL for a region's daily report
 * @param {string} region - Region code
 * @returns {string} Report URL
 */
const dailyReportURL = (region) => `${GITHUB_REPORT_URL}${region}.png`;

/**
 * Get URLs for all regions' daily reports
 * @returns {Object} URLs keyed by region
 */
const getDailyReportURL = () => 
  REGIONS.reduce((acc, region) => ({
    ...acc,
    [region]: dailyReportURL(region)
  }), {});

/**
 * Get daily report images for all regions
 * @returns {Promise<Object>} Image streams keyed by region
 */
const getDailyReportImg = async () => {
  try {
    const reports = await Promise.all(
      REGIONS.map(async region => ({
        region,
        stream: await api.getFileStream(dailyReportURL(region))
      }))
    );

    logger.info('Retrieved all daily report images');
    return reports.reduce((acc, {region, stream}) => ({
      ...acc,
      [region]: stream
    }), {});
  } catch (error) {
    logger.error('Failed to fetch daily report images', error);
    throw error;
  }
};

module.exports = {
  getByDay,
  dailyReportURL,
  getDailyReportURL,
  getDailyReportImg
};
