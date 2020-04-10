const schedule = require('node-schedule');
const moment = require('moment');
const {
  Fires,
  Earthquakes,
  Warnings,
  Fuel,
  Twitter,
  Corona,
} = require('../services');
const { channels } = require('../../config/bot');
const { uploadThreadTwitter } = require('../services/Twitter');

class Jobs {
  constructor(client) {
    this.client = client;
  }

  /**
   * Start all jobs
   */
  startJobs() {
    this.forestFires();
    this.getCoronaReports();
    this.warnings();
    this.fireRisk();
    this.getTweets();
    this.getCoronaFaqs();
    this.earthquakes();
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
      const {
        stations_all: stationsAll,
        stations_none: stationsNone,
        stations_no_diesel: stationsNoDiesel,
        stations_no_gasoline: stationsNoGasoline,
        stations_no_lpg: stationsNoLpg,
        stations_partial: stationsPartial,
        stations_total: stationsTotal,
      } = await Fuel.getFuelStats();

      const actualTime = moment().format('H:mm');

      const messages = [
        `Estado às ${actualTime}`,
        `Total postos na plataforma: ${stationsTotal}\n`,
        'Visão geral',
        ` ⛔ Sem combustível: ${stationsNone}`,
        ` ⚠ Com 1 tipo de combustível: ${stationsPartial}`,
        ` ✅ Sem restrições: ${stationsAll}`,
        'Faltas p/ tipo de combustível',
        ` - Gasolina: ${stationsNoGasoline}`,
        ` - Gasóleo: ${stationsNoDiesel}`,
        ` - GPL: ${stationsNoLpg}`,
      ];

      const messageStats = `ℹ️⛽#JáNãoDáParaAbastecer\n${messages.join('\n')}\n⛽ℹ️`;

      const messageDisclaimer = 'ℹ️⛽#JáNãoDáParaAbastecer Dados recolhidos via input dos utilizadores da plataforma, exceto os dados da rede #PRIO, #OZEnergia, #Ecobrent, #Bxpress, e #Tfuel, que são fornecidos pela marcas automaticamente.⛽ℹ️';

      const graphBufferArray = await Fuel.getFuelStatsGraphs();

      const twitterThreadData = [
        {
          status: messageStats,
          media: graphBufferArray,
        },
        {
          status: messageDisclaimer,
        },
      ];

      uploadThreadTwitter(twitterThreadData);
    });
  }

  /**
   * Update new tweets made by VOST accounts
   */
  getTweets() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(1, 59, 1);

    schedule.scheduleJob(rule, () => {
      Twitter.getVostTweets(this.client);
    });
  }

  /**
   * Update new DGS coronavirus reports and send to Discord
   */
  getCoronaReports() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(0, 59, 2);
    rule.second = 30;

    schedule.scheduleJob(rule, () => {
      Corona.updateReports(this.client);
    });
  }

  /**
   * Update new answered FAQS in Covid-19 spreadsheet
   */
  getCoronaFaqs() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(1, 57, 3);
    rule.second = 15;

    schedule.scheduleJob(rule, () => {
      Corona.getAnsweredFaqs(this.client);
    });
  }

  /**
   * Checks for new earthquakes
  */
  earthquakes() {
    const rule = new schedule.RecurrenceRule();

    rule.minute = new schedule.Range(5, 55, 1);

    try {
      schedule.scheduleJob(rule, () => {
        Earthquakes.getEarthquakes(this.client, 3);
        Earthquakes.getEarthquakes(this.client, 7);
      });
    } catch (e) {
      //
    }
  }

  /**
   * Checks for new earthquakes
  */
  deleteOldEarthquakes() {
    const rule = new schedule.RecurrenceRule();

    rule.hour = 0;

    try {
      schedule.scheduleJob(rule, () => {
        Earthquakes.deleteOldEarthquakes(this.client, 31);
      });
    } catch (e) {
      //
    }
  }
}

module.exports = Jobs;
