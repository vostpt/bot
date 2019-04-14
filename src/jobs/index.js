const schedule = require('node-schedule');
const Services = require('../services');

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

    schedule.scheduleJob(rule, () => Services.getForestFires(this.client));
  }

  warnings() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(0, 59, 10);

    schedule.scheduleJob(rule, () => Services.getWarnings(this.client));
  }

  fireRisk() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 7;

    schedule.scheduleJob(rule, () => {
      try {
        this.client.channels
          .get('559384838306529311')
          .send(
            `http://www.ipma.pt/resources.www/transf/clientes/11000.anpc/risco_incendio/fwi/FWI24_conc.jpg`,
          );
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

    schedule.scheduleJob(rule, () => Services.getEarthquakes(this.client));
  }
}

module.exports = Jobs;
