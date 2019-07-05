const schedule = require('node-schedule');
const moment = require('moment');
const { Fires, Earthquakes, Warnings } = require('../services');
const { channels } = require('../../config/bot');

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
const checkAlreadySent = event => !sentEarthquakesNotifications.has(event);

class Jobs {
  constructor(client) {
    this.client = client;
  }

  /**
   * Start all jobs
   */
  startAll() {
    this.forestFires();
    this.earthquakes();
    this.noticeableEarthquakes({ threshold: 2.5 });
    this.warnings();
    this.fireRisk();

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

    rule.minute = new schedule.Range(0, 59, 10);

    schedule.scheduleJob(rule, () => Warnings.getWarnings(this.client));
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
          .filter(checkAlreadySent)
          .filter(event => eventAboveThreshold(event, threshold));

        const noticeableSensedEvents = eventsSensed
          .filter(checkAlreadySent)
          .filter(event => eventAboveThreshold(event, threshold));

        if (noticeableSensedEvents.length > 0) {
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismo(s) sentido(s) dia ${today}:***\n${noticeableSensedEvents.join('\n')}`);
          noticeableSensedEvents.forEach(event => sentEarthquakesNotifications.add(event));
        }

        if (noticeableEvents.length > 0) {
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismo(s) de ${today}:***\n${noticeableEvents.join('\n')}`);
          noticeableEvents.forEach(event => sentEarthquakesNotifications.add(event));
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
