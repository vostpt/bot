const schedule = require('node-schedule');
const moment = require('moment');
const IpmaApi = require('../api/Ipma');

// Tracks earthquake `time` values already sent today; cleared at midnight
const sentEarthquakesNotifications = new Set();

const {
  Fires,
  Earthquakes,
  MeteoAlarm,
//  Twitter,
  Journal,
  Facebook,
  Ipma,
  Weather,
  Medea,
  Viajar,
} = require('../services');

const { channels } = require('../../config/bot');
//const { clientTwitter } = require('../services/Twitter');

/**
 * Helper: safe channel send (v14)
 */
async function sendToChannel(client, channelId, content) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return console.warn(`Channel not found: ${channelId}`);

    return await channel.send(content);
  } catch (err) {
    console.error(`Failed sending to channel ${channelId}:`, err);
  }
}

/**
 * Helper: safe channel send with files
 */
async function sendFileToChannel(client, channelId, content, files) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return console.warn(`Channel not found: ${channelId}`);

    return await channel.send({
      content,
      files,
    });
  } catch (err) {
    console.error(`Failed sending file to channel ${channelId}:`, err);
  }
}

class Jobs {
  constructor(client) {
    this.client = client;
  }

  startProd() {
    this.forestFires();
    this.warnings();
    this.fireRisk();
    this.getFacebookPosts();
    this.sendWeatherReport();
    this.checkNewDecrees();
    Jobs.clearDecreesDb();
    Jobs.warningsMeteoAlarm();
    Jobs.clearMeteoAlarmDb();
    Jobs.scheduleVostEuTweets();
    Jobs.checkMedeaMessages();
    this.checkConselhoViajantes();
  }

  startBeta() {
    this.earthquakes();
    this.noticeableEarthquakes({ threshold: 2.5 });
    Jobs.resetSentNotifications();
  }

  forestFires() {
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(1, 56, 5);
    rule.second = 30;

    schedule.scheduleJob(rule, () => Fires.getForestFires(this.client));
  }

  warnings() {
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, 5);

    schedule.scheduleJob(rule, () => Ipma.getWarnings(this.client));
  }

  static warningsMeteoAlarm() {
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(3, 59, 10);

    schedule.scheduleJob(rule, () => MeteoAlarm.getWarnings());
  }

  static clearMeteoAlarmDb() {
    const rule = new schedule.RecurrenceRule();
    rule.hour = new schedule.Range(0, 23, 4);

    schedule.scheduleJob(rule, () => MeteoAlarm.clearDb());
  }

  static scheduleVostEuTweets() {
    const rule1 = new schedule.RecurrenceRule();
    rule1.hour = 8;
    rule1.minute = 0;

    schedule.scheduleJob(rule1, () => Twitter.tweetVostEu(1));

    const rule2 = new schedule.RecurrenceRule();
    rule2.hour = 12;
    rule2.minute = 0;

    schedule.scheduleJob(rule2, () => Twitter.tweetVostEu(2));
  }

  static checkMedeaMessages() {
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(1, 59, 1);

    schedule.scheduleJob(rule, () => Medea.getMessages());
  }

  fireRisk() {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 7;
    rule.minute = 0;

    schedule.scheduleJob(rule, async () => {
      const result = await IpmaApi.fetch();
      if (!result) return console.warn('fireRisk: falhou a gerar o mapa RCM');
      await sendFileToChannel(
        this.client,
        channels.FIRES_CHANNEL_ID,
        '🔥 Risco de Incêndio para hoje',
        [{ attachment: result.attachment, name: result.name }]
      );
    });
  }

  getFacebookPosts() {
    Facebook.getVostPostsAndSendToDiscord(this.client);

    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(1, 59, 2);

    schedule.scheduleJob(rule, () => {
      Facebook.getVostPostsAndSendToDiscord(this.client);
    });
  }

  sendWeatherReport() {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 10;
    rule.minute = 15;

    schedule.scheduleJob(rule, () => {
      Weather.getDailyReport(this.client);
    });
  }

  checkNewDecrees() {
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, 2);
    rule.second = 40;

    schedule.scheduleJob(rule, () => {
      Journal.checkNewDecrees(this.client);
    });
  }

  static clearDecreesDb() {
    const rule = new schedule.RecurrenceRule();
    rule.dayOfMonth = new schedule.Range(1, 28, 2);

    schedule.scheduleJob(rule, () => Journal.clearDb());
  }

  earthquakes() {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 0;
    rule.minute = 0;
    rule.second = 10;

    schedule.scheduleJob(rule, async () => {
      const yesterday = moment().subtract(1, 'days').format('L');
      const { events, eventsSensed } = Earthquakes.getEarthquakes(yesterday);

      if (eventsSensed.length > 0) {
        await sendToChannel(
          this.client,
          channels.EARTHQUAKES_CHANNEL_ID,
          `***Sismo(s) sentido(s) dia ${yesterday}:***\n${eventsSensed.join('\n')}`
        );
      }

      if (events.length > 0) {
        await sendToChannel(
          this.client,
          channels.EARTHQUAKES_CHANNEL_ID,
          `***Sismo(s) de ${yesterday}:***\n${events.join('\n')}`
        );
      }
    });
  }

  noticeableEarthquakes({ threshold } = {}) {
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, 1);

    schedule.scheduleJob(rule, async () => {
      const today = moment().format('L');
      const earthquakes = await Earthquakes.getByDate(today);

      const noticeable = earthquakes.filter(e => parseFloat(e.magnitud) >= threshold);

      for (const eq of noticeable) {
        // Use time as unique ID — skip if already sent today
        if (sentEarthquakesNotifications.has(eq.time)) continue;
        sentEarthquakesNotifications.add(eq.time);

        const formattedTime = moment(eq.time).format('LT');
        let msg;

        if (eq.sensed) {
          msg = `⚠️ **Sismo sentido**\n${formattedTime}h - M${eq.magType} **${eq.magnitud}** em ${eq.obsRegion} a ${eq.depth}Km prof.\n**Sentido em ${eq.local} com Int. ${eq.degree}** ${eq.shakemapref} // ${eq.lat},${eq.lon}`;
        } else {
          msg = `🔔 **Sismo M${eq.magnitud}**\n${formattedTime}h - M${eq.magType} **${eq.magnitud}** em ${eq.obsRegion} a ${eq.depth}Km prof. // ${eq.lat},${eq.lon}`;
        }

        await sendToChannel(this.client, channels.EARTHQUAKES_CHANNEL_ID, msg);
      }
    });
  }

  static resetSentNotifications() {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 0;
    rule.minute = 0;

    schedule.scheduleJob(rule, () => {
      sentEarthquakesNotifications.clear();
    });
  }

  checkConselhoViajantes() {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 10;
    rule.minute = 0;

    schedule.scheduleJob(rule, () => {
      Viajar.checkNewTravelAdvices(this.client);
    });
  }
}

module.exports = Jobs;