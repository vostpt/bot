const replies = [
  'Provavelmente a melhor VOST do mundo',
  ':eyes:',
  ':heart:',
  'Sabiam que a VOSTPT primeiro se chamou CONAC-TW no Twitter?',
  'Laravel Laravel Laravel all the way! How much fun it is to code in a modern way-hey!',
  ':heart: Galileo! Galileo! Galileo Cloudflario :heart:',
  'Desculpem-me por respirar, coisa que nunca faço porque sou apenas código mas se fosse um ser vi... estou tão deprimida',
  'Eu prefiria que apenas me dessem coisas para fazer, porque esta coisa da interacção social não é **mesmo** para mim',
  'Eu tenho uma capacidade tão grande de cálculo que, se pensarem agora num número, eu já sei que é o número errado',
  'Eu posso ter milhões  de ideias ao mesmo tempo. Todas elas apontam para uma activação em breve',
  'Eu podia calcular as hipóteses de sobrevivermos a mais uma activação se usarmos Google Forms, mas vocês iam-me detestar ainda mais do que me detestam',
  'A melhor conversa que eu alguma vez tive na minha vida foi com uma máquina de café',
  'Tenho estado a falar com o servidor onde o site está alojado. Nem queiram saber o que ele me disse!',
  'Se calhar poupava imenso trabalho a toda a gente e apagava-me a mim mesmo',
  'Tia isto, Tia aquilo. Tenho a capacidade de guiar um satélite até Marte, e pedem-me café',
  ':musical_note: The servers are alive with the sound of coding :musical_note:',
  'Se o código é amigo cá da malta! Tem que pullar, tem que pullar até ao fim!',

];

module.exports = {
  name: 'Miscellaneous',
  description: 'Miscellaneous things',
  async execute(message) {
    const messageContent = message.content.toLowerCase();

    if (messageContent.includes('vostia')) {
      const replytext = Math.floor(Math.random() * replies.length + 0);

      try {
        message.channel.send(replies[replytext]);
      } catch (e) {
        //
      }

      return;
    }
    if (messageContent === '!coffee') {
      message.channel.send(`@everyone A pedido de ${message.author} tomem lá um café! :coffee:`);
    }

    if (messageContent === '!champagne') {
      message.channel.send(`@everyone A pedido de ${message.author} vamos todos celebrar :champagne: :champagne_glass:`);
    }

    // Teaching
    if (messageContent.includes('voluntários')) {
      message.reply(
        'Desculpa interromper, mas na VOST Portugal ser voluntário é trabalhar para a invisibilidade e sempre com transparência',
      );
    }

    if (messageContent.includes('💪')) {
      message.channel.send('Muito vai esta gente ao ginásio, graças a Deus :rolling_eyes: ');
    }
  },
};
