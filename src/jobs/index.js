const schedule = require('node-schedule');
const moment = require('moment');
const {
  Fires,
  Earthquakes,
  MeteoAlarm,
  Twitter,
  Corona,
  Journal,
  Facebook,
  Ipma,
} = require('../services');
const { channels } = require('../../config/bot');
const { clientTwitter } = require('../services/Twitter');

/**
 * Check if the earthquake level above threshold
 *
 * @param {String} event
 * @param {Number} threshold
 */
const eventAboveThreshold = (event, threshold = 0) => {
  const regexp = /\*\*(\d\.\d)\*\*/;

  const matchs = event.match(regexp) || [];
  const [, intensity = 0] = matchs;

  return intensity >= threshold;
};

/**
 * In memory Set to track already sent notifications
 */
const sentEarthquakesNotifications = new Set();

/**
 * Check if notification has already been sent
 *
 * @param {String} event
 */
const checkNotSentYet = (event) => !sentEarthquakesNotifications.has(event);

class Jobs {
  constructor(client) {
    this.client = client;
  }

  /**
   * Start all production (non-beta) jobs
   */
  startProd() {
    this.forestFires();
    this.checkNewCoronaReports();
    this.checkUpdatesCoronaReports();
    this.warnings();
    this.fireRisk();
    this.getTweets();
    this.getFacebookPosts();
    this.checkNewDecrees();
    Jobs.clearDecreesDb();
    Jobs.warningsMeteoAlarm();
    Jobs.clearMeteoAlarmDb();
    Jobs.scheduleVostEuTweets();
  }

  /**
   * Start all beta jobs
   */
  startBeta() {
    this.earthquakes();
    this.noticeableEarthquakes({ threshold: 2.5 });

    Jobs.resetSentNotifications();
  }

  /**
   * Check for forest fires
   */
  forestFires() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(1, 56, 5);
    rule.second = 30;

    schedule.scheduleJob(rule, () => Fires.getForestFires(this.client));
  }

  /**
   * Check for warnings
   */
  warnings() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(0, 59, 5);

    schedule.scheduleJob(rule, () => Ipma.getWarnings(this.client));
  }

  /**
   * Check for MeteoAlarm warnings
   */
  static warningsMeteoAlarm() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(3, 59, 10);

    schedule.scheduleJob(rule, () => MeteoAlarm.getWarnings());
  }

  /**
   * Clean MeteoAlarm DB
   */
  static clearMeteoAlarmDb() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = new schedule.Range(0, 23, 4);

    schedule.scheduleJob(rule, () => MeteoAlarm.clearDb());
  }

  /**
   * Schedule VOST Europe tweets
   */
  static scheduleVostEuTweets() {
    const ruleWarning = new schedule.RecurrenceRule();

    ruleWarning.hour = 8;
    ruleWarning.minute = 0;
    ruleWarning.second = 0;

    schedule.scheduleJob(ruleWarning, () => Twitter.tweetVostEu(1));

    const ruleEcho = new schedule.RecurrenceRule();

    ruleEcho.hour = 12;
    ruleEcho.minute = 0;
    ruleEcho.second = 0;

    schedule.scheduleJob(ruleEcho, () => Twitter.tweetVostEu(2));
  }

  /**
   * Check for fires probabilities for today
   */
  fireRisk() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 7;
    rule.minute = 0;
    rule.second = 0;

    schedule.scheduleJob(rule, () => {
      const map = Fires.getMap();

      try {
        this.client.channels.get(channels.FIRES_CHANNEL_ID).send('Risco de Incêndio para hoje', { files: [map] });
      } catch (e) {
        //
      }
    });
  }

  /**
   * Update new tweets made by VOST accounts
   */
  getTweets() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(1, 59, 1);

    schedule.scheduleJob(rule, () => {
      Twitter.getVostTweetsAndSendToDiscord(this.client);
    });
  }

  /**
   * Update new facebook posts made by VOST accounts
   */
  getFacebookPosts() {
    Facebook.getVostPostsAndSendToDiscord(this.client);

    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(1, 59, 2);

    schedule.scheduleJob(rule, () => {
      Facebook.getVostPostsAndSendToDiscord(this.client);
    });
  }

  /**
   * Update new DGS coronavirus reports and send to Discord
   */
  checkNewCoronaReports() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(1, 59, 3);
    rule.second = 30;

    schedule.scheduleJob(rule, () => {
      Corona.checkNewReports(this.client);
    });
  }

  /**
   * Update new DGS coronavirus reports and send to Discord
   */
  checkUpdatesCoronaReports() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 9;
    rule.minute = 0;
    rule.second = 0;

    schedule.scheduleJob(rule, () => {
      Corona.checkOldReports(this.client);
    });
  }

  /**
   * Update new Decrees and send to Discord
   */
  checkNewDecrees() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(0, 59, 2);
    rule.second = 40;

    schedule.scheduleJob(rule, () => {
      Journal.checkNewDecrees(this.client);
    });
  }

  /**
   * Update new Decrees and send to Discord
   */
  static clearDecreesDb() {
    const rule = new schedule.RecurrenceRule();

    rule.dayOfMonth = new schedule.Range(1, 28, 2);

    schedule.scheduleJob(rule, () => {
      Journal.clearDb();
    });
  }

  /**
   * Checks for yesterday's earthquakes
   */
  earthquakes() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 0;
    rule.minute = 0;
    rule.second = 10;

    try {
      schedule.scheduleJob(rule, () => {
        const yesterday = moment().subtract(1, 'days').format('L');
        const { events, eventsSensed } = Earthquakes.getEarthquakes(yesterday);

        if (eventsSensed.length > 0) {
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismo(s) sentido(s) dia ${yesterday}:***\n${eventsSensed.join('\n')}`);
        }

        if (events.length > 0) {
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismo(s) de ${yesterday}:***\n${events.join('\n')}`);
        }
      });
    } catch (e) {
      //
    }
  }

  /**
   * Checks for noticeable earthquakes worthing immediate annoucement
   *
   * @param {Object} config
   */
  noticeableEarthquakes({ threshold } = {}) {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(0, 59, 1); // every minute

    try {
      schedule.scheduleJob(rule, async () => {
        const today = moment().format('L');
        const { events, eventsSensed } = await Earthquakes.getEarthquakes(today);

        const noticeableEvents = events
          .filter(checkNotSentYet)
          .filter((event) => eventAboveThreshold(event, threshold));

        const noticeableSensedEvents = eventsSensed
          .filter(checkNotSentYet)
          .filter((event) => eventAboveThreshold(event, threshold));

        if (noticeableSensedEvents.length > 0) {
          const message = `***Sismo(s) sentido(s) dia ${today}:***\n${noticeableSensedEvents.join('\n')}`;
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(message);
          noticeableSensedEvents.forEach((event) => sentEarthquakesNotifications.add(event));

          clientTwitter.post('statuses/update', { status: `ℹ️⚠️#ATerraTreme\n\n(${noticeableSensedEvents.join('\n').replace('*', '')}\n\nSentiste este sismo?⚠️ℹ️` });
        }

        if (noticeableEvents.length > 0) {
          const message = `***Sismo(s) de ${today}:***\n${noticeableEvents.join('\n')}`;
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(message);
          noticeableEvents.forEach((event) => sentEarthquakesNotifications.add(event));

          clientTwitter.post('statuses/update', { status: `ℹ️⚠️#ATerraTreme\n\n${noticeableEvents.join('\n').replace('*', '')}\n\nSentiste este sismo?⚠️ℹ️` });
        }
      });
    } catch (e) {
      //
    }
  }

  /**
   * Clear yesterday's notifications
   */
  static resetSentNotifications() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 0;
    rule.minute = 0;

    schedule.scheduleJob(rule, () => sentEarthquakesNotifications.clear());
  }
}

module.exports = Jobs;
