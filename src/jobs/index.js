const schedule = require('node-schedule');
const { Fires, Earthquakes, Warnings } = require('../services');
const { channels } = require('../../config/bot');

class Jobs {
  constructor(client) {
    this.client = client;
  }

  startAll() {
    this.forestFires();
    this.earthquakes();
    this.warnings();
    this.fireRisk();
  }

  forestFires() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(1, 56, 5);
    rule.second = 30;

    schedule.scheduleJob(rule, () => Fires.getForestFires(this.client));
  }

  warnings() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(0, 59, 2);

    schedule.scheduleJob(rule, () => Warnings.getWarnings(this.client));
  }

  fireRisk() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 7;
    rule.minute = 0;
    rule.second = 0;

    schedule.scheduleJob(rule, () => {
      const map = Fires.getMap();

      try {
        this.client.channels.get(channels.FIRES_CHANNEL_ID).send(map);
      } catch (e) {
        //
      }
    });
  }

  earthquakes() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 0;
    rule.minute = 0;
    rule.second = 30;

    schedule.scheduleJob(rule, () => Earthquakes.getEarthquakes(this.client));
  }
}

module.exports = Jobs;
