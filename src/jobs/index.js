import schedule from 'node-schedule';
import moment from 'moment';
import config from '../config/services';
import * as services from '../services';
const { channels } = require('../config/bot');

const LOG_PREFIX = '[JobScheduler]';
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

class JobScheduler {
  constructor(client) {
    this.client = client;
    this.sentNotifications = new Set();
    logger.info('Initializing job scheduler');
  }

  scheduleJob(config, callback) {
    if (!config.enabled) {
      logger.debug(`Skipping disabled job: ${config.name}`);
      return;
    }

    try {
      if (config.scheduleTime) {
        const [hour, minute] = config.scheduleTime.split(':');
        const rule = new schedule.RecurrenceRule();
        rule.hour = parseInt(hour);
        rule.minute = parseInt(minute);
        schedule.scheduleJob(rule, () => {
          logger.debug(`Running scheduled job at ${config.scheduleTime}`);
          callback();
        });
        logger.info(`Scheduled job for ${config.scheduleTime}`);
      }

      if (config.interval) {
        const rule = new schedule.RecurrenceRule();
        rule.minute = new schedule.Range(0, 59, config.interval);
        schedule.scheduleJob(rule, () => {
          logger.debug(`Running interval job every ${config.interval} minutes`);
          callback();
        });
        logger.info(`Scheduled interval job every ${config.interval} minutes`);
      }
    } catch (error) {
      logger.error(`Failed to schedule job`, error);
    }
  }

  scheduleServices() {
    logger.info('Starting service scheduling');

    // Fire related services
    /**
     * Check for forest fires
     */
    this.scheduleJob({ ...config.FIRES, name: 'Fires-Monitor' }, 
      () => services.Fires.getForestFires(this.client));

    /**
     * Check for fire risk and send map to discord
     */
    this.scheduleJob({ ...config.FIRES, name: 'Fires-Risk' }, () => {
      try {
        const map = services.Fires.getMap();
        this.client?.channels.get(channels.FIRES_CHANNEL_ID)
          ?.send('Risco de Incêndio para hoje', { files: [map] });
      } catch (error) {
        logger.error('Failed to send fire risk map', error);
      }
    });

    // Weather services
    this.scheduleJob({ ...config.WEATHER, name: 'Weather-Report' }, 
      () => services.Weather.getDailyReport(this.client));
    this.scheduleJob({ ...config.WARNINGS, name: 'IPMA-Warnings' }, 
      () => services.Ipma.getWarnings(this.client));
    this.scheduleJob({ ...config.METEOALARM, name: 'MeteoAlarm' }, 
      () => services.MeteoAlarm.getWarnings());

    // Health services
    this.scheduleJob({ ...config.CORONA, name: 'Corona-New' }, 
      () => services.Corona.checkNewReports(this.client));
    this.scheduleJob({ ...config.CORONA, name: 'Corona-Updates' }, 
      () => services.Corona.checkOldReports(this.client));
    this.scheduleJob({ ...config.MEDEA, name: 'Medea' }, 
      () => services.Medea.getMessages());

    // Government and travel
    this.scheduleJob({ ...config.JOURNAL, name: 'Journal' }, 
      () => services.Journal.checkNewDecrees(this.client));
    this.scheduleJob({ ...config.VIAJAR, name: 'Travel' }, 
      () => services.Viajar.checkNewTravelAdvices(this.client));

    if (config.FACEBOOK.enabled) {
      logger.info('Scheduling Facebook updates');
      this.scheduleFacebookUpdates();
    }

    if (config.TWITTER.enabled) {
      logger.info('Scheduling Twitter updates');
      this.scheduleTwitterUpdates();
    }

    if (config.EARTHQUAKES.enabled) {
      logger.info('Scheduling earthquake monitoring');
      this.scheduleEarthquakeMonitoring();
    }

    this.scheduleCleanupJobs();
  }

  scheduleFacebookUpdates() {
    try {
      logger.debug('Initializing Facebook posts fetch');
      services.Facebook.getVostPostsAndSendToDiscord(this.client);
      
      const rule = new schedule.RecurrenceRule();
      rule.minute = new schedule.Range(1, 59, 2);
      
      schedule.scheduleJob(rule, () => {
        logger.debug('Fetching Facebook posts');
        services.Facebook.getVostPostsAndSendToDiscord(this.client);
      });
      
      logger.info('Facebook updates scheduled successfully');
    } catch (error) {
      logger.error('Failed to schedule Facebook updates', error);
    }
  }

  // scheduleTwitterUpdates() {
  //   try {
  //     const scheduleVostTweet = (hour, tweetType) => {
  //       const rule = new schedule.RecurrenceRule();
  //       rule.hour = hour;
  //       rule.minute = 0;
  //       
  //       schedule.scheduleJob(rule, () => {
  //         logger.debug(`Sending VOST tweet type ${tweetType}`);
  //         services.Twitter.tweetVostEu(tweetType);
  //       });
  //       
  //       logger.info(`Scheduled VOST tweet type ${tweetType} for ${hour}:00`);
  //     };
  //
  //     scheduleVostTweet(8, 1); // Morning warning
  //     scheduleVostTweet(12, 2); // Noon echo
  //   } catch (error) {
  //     logger.error('Failed to schedule Twitter updates', error);
  //   }
  // }

  scheduleEarthquakeMonitoring() {
    try {
      // Daily earthquake summary
      const dailyRule = new schedule.RecurrenceRule();
      dailyRule.hour = 0;
      dailyRule.minute = 0;

      schedule.scheduleJob(dailyRule, () => {
        logger.debug('Running daily earthquake summary');
        const yesterday = moment().subtract(1, 'days').format('L');
        const { events, eventsSensed } = services.Earthquakes.getEarthquakes(yesterday);
        this.sendEarthquakeReports(events, eventsSensed, yesterday);
      });

      // Real-time monitoring
      const monitoringRule = new schedule.RecurrenceRule();
      monitoringRule.minute = new schedule.Range(0, 59, config.EARTHQUAKES.interval);

      schedule.scheduleJob(monitoringRule, async () => {
        logger.debug('Checking for new earthquakes');
        const today = moment().format('L');
        const { events, eventsSensed } = await services.Earthquakes.getEarthquakes(today);
        await this.processNoticeableEarthquakes(events, eventsSensed, today);
      });

      logger.info('Earthquake monitoring scheduled successfully');
    } catch (error) {
      logger.error('Failed to schedule earthquake monitoring', error);
    }
  }

  async processNoticeableEarthquakes(events, eventsSensed, date, threshold = 2.5) {
    try {
      const isNoticeable = (event) => {
        const [, intensity = 0] = event.match(/\*\*(\d\.\d)\*\*/) || [];
        return intensity >= threshold;
      };

      const filterNew = (event) => !this.sentNotifications.has(event);

      const noticeableEvents = events.filter(filterNew).filter(isNoticeable);
      const noticeableSensed = eventsSensed.filter(filterNew).filter(isNoticeable);

      if (noticeableEvents.length || noticeableSensed.length) {
        logger.info(`Found ${noticeableEvents.length + noticeableSensed.length} noticeable earthquakes`);
        await this.sendEarthquakeReports(noticeableEvents, noticeableSensed, date);
        
        [...noticeableEvents, ...noticeableSensed].forEach(event => {
          this.sentNotifications.add(event);
          logger.debug(`Added earthquake to sent notifications: ${event}`);
        });
      }
    } catch (error) {
      logger.error('Failed to process noticeable earthquakes', error);
    }
  }

  scheduleCleanupJobs() {
    logger.info('Scheduling cleanup jobs');

    try {
      // Clear earthquake notifications daily
      const dailyRule = new schedule.RecurrenceRule();
      dailyRule.hour = 0;
      dailyRule.minute = 0;
      
      schedule.scheduleJob(dailyRule, () => {
        logger.info('Clearing earthquake notifications');
        this.sentNotifications.clear();
      });

      // Clear MeteoAlarm DB every 4 hours
      const meteorAlarmRule = new schedule.RecurrenceRule();
      meteorAlarmRule.hour = new schedule.Range(0, 23, 4);
      
      schedule.scheduleJob(meteorAlarmRule, () => {
        logger.info('Cleaning MeteoAlarm database');
        services.MeteoAlarm.clearDb();
      });

      // Clear Decrees DB every 2 days
      const decreesRule = new schedule.RecurrenceRule();
      decreesRule.dayOfMonth = new schedule.Range(1, 28, 2);
      
      schedule.scheduleJob(decreesRule, () => {
        logger.info('Cleaning Decrees database');
        services.Journal.clearDb();
      });

      logger.info('Cleanup jobs scheduled successfully');
    } catch (error) {
      logger.error('Failed to schedule cleanup jobs', error);
    }
  }

  async sendEarthquakeReports(events, eventsSensed, date) {
    try {
      const channel = this.client?.channels.get(channels.EARTHQUAKES_CHANNEL_ID);
      if (!channel) {
        logger.warning('Earthquake channel not found');
        return;
      }

      if (eventsSensed.length > 0) {
        logger.info(`Sending ${eventsSensed.length} sensed earthquake reports`);
        await channel.send(`***Sismo(s) sentido(s) dia ${date}:***\n${eventsSensed.join('\n')}`);
        await services.Twitter.sendEarthquakeAlert(eventsSensed);
      }

      if (events.length > 0) {
        logger.info(`Sending ${events.length} earthquake reports`);
        await channel.send(`***Sismo(s) de ${date}:***\n${events.join('\n')}`);
        await services.Twitter.sendEarthquakeAlert(events);
      }
    } catch (error) {
      logger.error('Failed to send earthquake reports', error);
    }
  }
}

export default JobScheduler;
