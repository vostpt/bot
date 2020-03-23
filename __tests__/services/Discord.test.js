const Discord = require('discord.js');
const DiscordService = require('../../src/services/Discord');

const client = new Discord.Client();

const largeMessage = `
Large message | Large message | Large message | Large message | Large message | 
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message | 
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message | 
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message | 
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
Large message | Large message | Large message | Large message | Large message |
`;

describe('Send message to channel', () => {
  test('Message with < 2000 characters', () => {
    DiscordService.sendMessageToChannel(client.message.channel, 'Message w/o 2000 characters');

    expect(client.message.channel.send).toHaveBeenCalledTimes(1);
  });
  test('Message with > 2000 characters', () => {
    DiscordService.sendMessageToChannel(client.message.channel, largeMessage);

    expect(client.message.channel.send).toHaveBeenCalledTimes(2);
  });
  test('Message with > 4000 and < 6000 characters', () => {
    DiscordService.sendMessageToChannel(client.message.channel, largeMessage.concat(largeMessage));

    expect(client.message.channel.send).toHaveBeenCalledTimes(3);
  });
  test('Message with > 4000 and < 6000 characters without new line', () => {
    DiscordService.sendMessageToChannel(client.message.channel, largeMessage.concat(largeMessage).replace('\n', ''));

    expect(client.message.channel.send).toHaveBeenCalledTimes(3);
  });
});

describe('Answer message', () => {
  test('Message with < 2000 characters', () => {
    DiscordService.sendMessageAnswer(client.message, 'Message w/o 2000 characters');

    expect(client.message.reply).toHaveBeenCalledTimes(1);
  });
  test('Message with > 2000 and < 4000 characters', () => {
    DiscordService.sendMessageAnswer(client.message, largeMessage);

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.channel.send).toHaveBeenCalledTimes(1);
  });
  test('Message with > 4000 and < 6000 characters', () => {
    DiscordService.sendMessageAnswer(client.message, largeMessage.concat(largeMessage));

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.channel.send).toHaveBeenCalledTimes(2);
  });
  test('Message with > 4000 and < 6000 characters without new line', () => {
    DiscordService.sendMessageAnswer(client.message, largeMessage.concat(largeMessage).replace('\n', ''));

    expect(client.message.reply).toHaveBeenCalledTimes(1);
    expect(client.message.channel.send).toHaveBeenCalledTimes(2);
  });
});
