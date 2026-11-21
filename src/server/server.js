const { getChannel, sendMessageToChannel } = require("../services/Discord");
const { channels } = require("../../config/bot");
const express = require("express");
const bodyParser = require("body-parser");
const { reportCriticalError } = require("../helpers/errorReporter");

const getWebhookSecret = () => {
  const token = process.env.COPERNICUS_WEBHOOK_SECRET?.trim();
  return token || null;
};

const isAuthorized = (rawAuth, token) => rawAuth === token || rawAuth === `Bearer ${token}`;

const createWebhookHandler = (client, token) => {
  return async (req, res) => {
    console.log("📥 Incoming /copernicus request:");
    console.log("Body:", JSON.stringify(req.body, null, 2));

    const rawAuth = req.headers["authorization"];

    if (!rawAuth || !isAuthorized(rawAuth, token)) {
      return res
        .status(403)
        .send({ error: "Forbidden: Invalid or missing authorization header." });
    }

    const data = req.body;

    try {
      const {
        event_code,
        product_id,
        type,
        burnt_area_ha,
        acquisition_date,
        expected_delivery,
        aoi,
        download_link,
      } = data;

      const channel = await getChannel(client, channels.COPERNICUS_CHANNEL_ID);

      if (!channel) {
        return res.status(404).send({ error: "Discord channel not found." });
      }

      const formattedDate = acquisition_date
        ? new Date(acquisition_date).toLocaleString("pt-PT")
        : expected_delivery
        ? new Date(expected_delivery).toLocaleString("pt-PT")
        : "Data não disponível";

      let message = "";

      const isProductAvailable = download_link && download_link.trim() !== "";

      if (isProductAvailable) {
        // ✅ Product available
        message = `✅ **Novo produto disponível para AOI: ${aoi}!** ✅

**Código de Evento**: ${event_code}
**ID de Produto**: ${product_id}
**Tipo**: ${type}
**Área Ardida**: ${burnt_area_ha} ha
**Data de aquisição**: ${formattedDate}
**Download Link**: ${download_link}`;
      } else {
        // 🚨 Product announced
        message = `🚨 **Novo produto anunciado para a AOI: ${aoi}!** 🚨

**Codigo de Evento**: ${event_code}
**ID de Produto**: ${product_id}
**Tipo**: ${type}
**Data expectável de entrega**: ${formattedDate}
O link para download ainda não está disponível`;
      }

      await sendMessageToChannel(channel, message, "");

      return res
        .status(200)
        .send({ message: "Alert sent to Discord successfully." });
    } catch (error) {
      console.error(error);
      await reportCriticalError('webhook:copernicus', error);
      return res.status(500).send({ error: "Internal server error." });
    }
  };
};

const createApp = (client, token) => {
  const app = express();
  app.use(bodyParser.json());
  app.post("/copernicus", createWebhookHandler(client, token));

  return app;
};

const startHttpServer = (client) => {
  const token = getWebhookSecret();

  if (!token) {
    console.warn("⚠️ Copernicus webhook disabled: COPERNICUS_WEBHOOK_SECRET is not configured");
    return null;
  }

  const app = createApp(client, token);

  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Webhook server listening on port ${PORT}`);
  });
  server.on('error', async (error) => {
    console.error('[Copernicus] Webhook server error:', error);
    await reportCriticalError('webhook:server', error, { port: PORT });
  });
  return server;
};

module.exports = startHttpServer;
module.exports.createApp = createApp;
module.exports.createWebhookHandler = createWebhookHandler;
module.exports.getWebhookSecret = getWebhookSecret;
module.exports.isAuthorized = isAuthorized;
