const { channels } = require("../../config/bot");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "Miscellaneous",
  description: "Miscellaneous things",
  limitToChannels: [
    channels.TRIGGERS_CHANNEL_ID,
    channels.VOLUNTEERS_CHANNEL_ID,
  ],

  /**
   * Send to Discord a custom message according to the trigger or the content of the message
   *
   * @async
   * @param {Message} message
   */
  async execute(message) {
    const messageContent = message.content.toLowerCase();

    if (
      messageContent === "!coffee" ||
      messageContent === "!cafe" ||
      messageContent === "!café"
    ) {
      message.channel.send(
        `@everyone A pedido de ${message.author} tomem lá um café! :coffee:`,
      );
      return true;
    }

    if (messageContent === "!champagne") {
      message.channel.send(
        `@everyone A pedido de ${message.author} vamos todos celebrar :champagne: :champagne_glass:`,
      );
      return true;
    }

    if (messageContent === "!bolo") {
      await message.channel.send({
        content: `A pedido de ${message.author}, aqui está o bolo! 🎂`,
        embeds: [
          new EmbedBuilder().setImage(
            "https://c.tenor.com/7xsfDcZcEZoAAAAC/tenor.gif"
          ),
        ],
      });

      return true;
    }

    if (messageContent === "!alheira") {
      await message.channel.send({
        content: `A pedido de ${message.author}, aqui está a alheira!`,
        embeds: [
          new EmbedBuilder().setImage(
            "https://www.teleculinaria.pt/wp-content/uploads/2016/01/alheiras-no-forno-com-grelos-e-batatas-cozidas.jpg",
          ),
        ],
      });

      return true;
    }

    // Teaching
    if (messageContent.includes("voluntários")) {
      message.reply(
        "Desculpa interromper, mas na VOST Portugal ser voluntário é trabalhar para a invisibilidade e sempre com transparência",
      );
      return true;
    }

    if (messageContent.includes("💪")) {
      message.channel.send(
        "Muito vai esta gente ao ginásio, graças a Deus :rolling_eyes: ",
      );
      return true;
    }
  },
};
