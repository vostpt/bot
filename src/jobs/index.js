const schedule = require('node-schedule');
const moment = require('moment');
const {
  Fires,
  Earthquakes,
  Warnings,
  Fuel,
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
const checkNotSentYet = event => !sentEarthquakesNotifications.has(event);

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

    Jobs.fuelStats();
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
   * Get stats from 'Já Não Dá Para Abastecer' website
   */
  static fuelStats() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = new schedule.Range(0, 23, 1);
    rule.minute = 0;
    rule.second = 0;

    schedule.scheduleJob(rule, async () => {
      const stats = await Fuel.getFuelStats();

      const actualTime = moment().format('H:mm');

      const strHeader = `Estado às ${actualTime}`;

      const strStatsTotal = `Total: ${stats.stations_total}`;

      const strGeneral = 'Visão geral';
      const strStatsNone = ` - Sem qualquer tipo de combustível: ${stats.stations_none}`;
      const strStatsPartial = ` - Com algum tipo de combustível: ${stats.stations_partial}`;
      const strStatsAll = ` - Com todos os tipos de combustível: ${stats.stations_all}`;

      const strFaultByType = 'Faltas por tipo de combustível';
      const strNoGasoline = ` - Sem gasolina: ${stats.stations_no_gasoline}`;
      const strNoDiesel = ` - Sem gasóleo: ${stats.stations_no_diesel}`;
      const strNoLpg = ` - Sem GPL: ${stats.stations_no_lpg}`;

      const strMessage = `${strHeader}\n${strStatsTotal}\n\n${strGeneral}\n${strStatsNone}\n${strStatsPartial}\n${strStatsAll}\n${strFaultByType}\n${strNoGasoline}\n${strNoDiesel}\n${strNoLpg}`;

      clientTwitter.post('statuses/update', { status: `️ℹ️⛽#JáNãoDáParaAbastecer\n\n${strMessage}\n\n⛽ℹ️` });
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
          .filter(event => eventAboveThreshold(event, threshold));

        const noticeableSensedEvents = eventsSensed
          .filter(checkNotSentYet)
          .filter(event => eventAboveThreshold(event, threshold));

        if (noticeableSensedEvents.length > 0) {
          const message = `***Sismo(s) sentido(s) dia ${today}:***\n${noticeableSensedEvents.join('\n')}`;
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(message);
          noticeableSensedEvents.forEach(event => sentEarthquakesNotifications.add(event));

          clientTwitter.post('statuses/update', { status: `ℹ️⚠️#ATerraTreme\n\n${noticeableSensedEvents.join('\n')}\n\nSentiste este sismo?⚠️ℹ️` });
        }

        if (noticeableEvents.length > 0) {
          const message = `***Sismo(s) de ${today}:***\n${noticeableEvents.join('\n')}`;
          this.client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(message);
          noticeableEvents.forEach(event => sentEarthquakesNotifications.add(event));

          clientTwitter.post('statuses/update', { status: `ℹ️⚠️#ATerraTreme\n\n${noticeableEvents.join('\n')}\n\nSentiste este sismo?⚠️ℹ️` });
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
