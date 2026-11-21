const ALLOWED_TOOLS = Object.freeze([
  'vost_prociv.get_all',
  'vost_prociv.get_by_id',
  'vost_prociv.get_by_city',
  'vost_prociv.filter_by_status',
  'vost_fires.get_important',
  'vost_fires.get_by_district',
  'vost_ipma.get_current_warnings',
  'vost_meteoalarm.get_current',
  'vost_earthquakes.get_by_date',
  'vost_weather.get_by_day',
  'vost_acronyms.get_exact',
  'vost_sns.get_alerts',
  'vost_corona.get_all',
  'vost_corona.get_resume',
  'vost_journal.get_recent',
  'vost_http.acronym_lookup',
  'vost_http.fire_risk_map',
  'vost_http.weather_report_pt',
  'vost_http.weather_report_mad',
  'vost_http.weather_report_az',
]);

const isAllowed = (name) => typeof name === 'string' && ALLOWED_TOOLS.includes(name);

module.exports = {
  ALLOWED_TOOLS,
  isAllowed,
};
