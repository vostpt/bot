const { getChannel, sendMessageToChannel } = require("../services/Discord");
const { channels } = require("../../config/bot");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

module.exports = (client) => {
  app.post("/copernicus", async (req, res) => {
    console.log("📥 Incoming /copernicus request:");
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));

    const rawAuth = req.headers["authorization"];
    const token = process.env.COPERNICUS_WEBHOOK_SECRET;

    if (!rawAuth || (rawAuth !== token && rawAuth !== `Bearer ${token}`)) {
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
      return res.status(500).send({ error: "Internal server error." });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Webhook server listening on port ${PORT}`);
  });
};
