const axios = require('axios');
const Discord = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment');
moment.locale('pt');
const client = new Discord.Client();
var Twitter = require('twitter');
require('dotenv').config();

var client_twitter = new Twitter({
	consumer_key: process.env.CONSUMER_KEY,
	consumer_secret: process.env.CONSUMER_SECRET,
	access_token_key: process.env.ACCESS_TOKEN_KEY,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	var rule = new schedule.RecurrenceRule();

	rule.minute = new schedule.Range(1, 56, 5);
	rule.second = 30;

	schedule.scheduleJob(rule, function () {

		axios.get('https://bot-api.vost.pt/getIF.php', {
		}).then(res => {
			var respnovos = "";
			var respatualizados = "";
			var respnovosimportantes = "";
			var respatualizadosimportantes = "";
			res.data.forEach(function (element) {
				if (element['tipo'] == "1") {
					if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
						respnovosimportantes += "\n";
						respnovosimportantes += "__**" + element['d'] + " - ";
						respnovosimportantes += element['id'] + " - ";
						respnovosimportantes += "#IF" + element['l'] + "," + element['s'] + " - ";
						respnovosimportantes += element['o'] + ":man_with_gua_pi_mao: ";
						respnovosimportantes += element['t'] + ":fire_engine: ";
						respnovosimportantes += element['a'] + ":helicopter:";
						respnovosimportantes += element['e'] + "**__";
					}
					else {
						respnovos += "\n";
						respnovos += element['d'] + " - ";
						respnovos += element['id'] + " - ";
						respnovos += "#IF" + element['l'] + "," + element['s'] + " - ";
						respnovos += element['o'] + ":man_with_gua_pi_mao: ";
						respnovos += element['t'] + ":fire_engine: ";
						respnovos += element['a'] + ":helicopter: - ";
						respnovos += element['e'];
					}
				}
				else if (element['tipo'] == "2") {
					respatualizados += "\n";
					respatualizados += element['id'] + " - ";
					respatualizados += "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizados += element['ea'] + " :track_next: " + element['e'];
				}
				else if (element['tipo'] == "3") {
					respatualizadosimportantes += "\n";
					respatualizadosimportantes += "__**" + element['id'] + " - ";
					respatualizadosimportantes += "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizadosimportantes += element['ea'] + " :track_next: " + element['e'] + "**__";
				}
				else if (element['tipo'] == "4") {
					respatualizadosimportantes += "\n";
					respatualizadosimportantes += "__**" + element['id'] + " - ";
					respatualizadosimportantes += "#IF" + element['l'] + "," + element['s'] + " - Subiu para ";
					respatualizadosimportantes += element['o'] + ":man_with_gua_pi_mao: ";
					respatualizadosimportantes += element['t'] + ":fire_engine: ";
					respatualizadosimportantes += element['a'] + ":helicopter:" + "**__";
				}
				else if (element['tipo'] == "5") {
					respatualizadosimportantes += "\n";
					respatualizadosimportantes += "__**" + element['id'] + " - ";
					respatualizadosimportantes += "#IF" + element['l'] + "," + element['s'] + " - Desceu para ";
					respatualizadosimportantes += element['o'] + ":man_with_gua_pi_mao: ";
					respatualizadosimportantes += element['t'] + ":fire_engine: ";
					respatualizadosimportantes += element['a'] + ":helicopter:" + "**__";
				}
				else if (element['tipo'] == "6") {
					var respatualizarimportancia = "";
					respatualizarimportancia += "\n";
					respatualizarimportancia += "__**" + element['id'] + " - ";
					respatualizarimportancia += "#IF" + element['l'] + "," + element['s'] + " -  ";
					respatualizarimportancia += element['o'] + ":man_with_gua_pi_mao: ";
					respatualizarimportancia += element['t'] + ":fire_engine: ";
					respatualizarimportancia += element['a'] + ":helicopter:" + "**__";
					client.channels.get("559054697944580098").send(":warning: :fire: ***Ocorrência importante:***\n" + respatualizarimportancia)
				}
				else if (element['tipo'] == "7") {
					var respatualizarimportancia = "";
					respatualizarimportancia += "\n";
					respatualizarimportancia += "__**" + element['id'] + " - ";
					respatualizarimportancia += "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizarimportancia += element['o'] + ":man_with_gua_pi_mao: ";
					respatualizarimportancia += element['t'] + ":fire_engine: ";
					respatualizarimportancia += element['a'] + ":helicopter:" + "**__";
					client.channels.get("559054697944580098").send("@here :warning: :fire: ***Ocorrência importante:***\n" + respatualizarimportancia)
				}
				else if (element['tipo'] == "8") {
					var respatualizarimportancia = "";
					respatualizarimportancia += "\n";
					respatualizarimportancia += "__**" + element['id'] + " - ";
					respatualizarimportancia += "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizarimportancia += element['ea'] + " :track_next: " + element['e'] + "**__";
					client.channels.get("559054697944580098").send("@here :warning: :fire: ***Atualização importante:***\n" + respatualizarimportancia)
				}

			});
			if (respnovos != "" || respnovosimportantes != "")
				client.channels.get("559754081216757776").send(":fire: ***Novas Ocorrências:***\n" + respnovosimportantes + respnovos)
			if (respatualizados != "" || respatualizadosimportantes != "")
				client.channels.get("559754081216757776").send(":fire: ***Ocorrências actualizadas:***\n" + respatualizadosimportantes + respatualizados)
		})
	});


	var rule_alerts = new schedule.RecurrenceRule();

	rule_alerts.minute = new schedule.Range(0, 59, 10);

	schedule.scheduleJob(rule_alerts, function () {
		axios.get('https://bot-api.vost.pt/getAvisos.php', {
		}).then(res => {
			var respnovos = "";
			var resptwitter = "";
			res.data.forEach(function (element) {
				var primeiro = 0;
				resptwitter = "";
				var iconTipo = "";

				if (element['icon'] == ":dash:")
					iconTipo = "🌬";
				else if (element['icon'] == ":sunny:️:thermometer:")
					iconTipo = "☀🌡";
				else if (element['icon'] == ":snowflake:️:thermometer:")
					iconTipo = "❄🌡";
				else if (element['icon'] == ":cloud_rain:")
					iconTipo = "🌧";
				else if (element['icon'] == ":fog:")
					iconTipo = "🌫";
				else if (element['icon'] == ":snowflake:")
					iconTipo = "❄";
				else if (element['icon'] == ":ocean:")
					iconTipo = "🌊";
				else if (element['icon'] == ":thunder_cloud_rain:")
					iconTipo = "⛈";

				var tipo = "";

				if (element['tipo'] == "Precipitação")
					tipo = "Chuva";
				else
					tipo = element['tipo'].replace(" ", '');



				var inicio = "";
				var fim = "";

				if (moment(element['inicio'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD") == moment(element['fim'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD")) {
					if (moment(element['inicio'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD") == moment().format("YYYY-MM-DD")) {
						inicio = moment(element['inicio'], "YYYY-MM-DD H:mm").format("HH:mm") + "h";
						fim = moment(element['fim'], "YYYY-MM-DD H:mm").format("HH:mm") + "h de hoje,";
					}
					else if (moment(element['inicio'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD") == moment().add(1, 'days').format("YYYY-MM-DD")) {
						inicio = moment(element['inicio'], "YYYY-MM-DD H:mm").format("HH:mm") + "h";
						fim = moment(element['fim'], "YYYY-MM-DD H:mm").format("HH:mm") + "h de amanhã,";
					}
				}
				else {
					if (moment(element['inicio'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD") == moment().format("YYYY-MM-DD"))
						inicio = moment(element['inicio'], "YYYY-MM-DD H:mm").format("HH:mm") + "h de hoje";
					else if (moment(element['inicio'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD") == moment().add(1, 'days').format("YYYY-MM-DD"))
						inicio = moment(element['inicio'], "YYYY-MM-DD H:mm").format("HH:mm") + "h de amanhã";
					else
						inicio = moment(element['inicio'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD HH:mm");

					if (moment(element['fim'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD") == moment().format("YYYY-MM-DD"))
						fim = moment(element['fim'], "YYYY-MM-DD H:mm").format("HH:mm") + "h de hoje,";
					else if (moment(element['fim'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD") == moment().add(1, 'days').format("YYYY-MM-DD"))
						fim = moment(element['fim'], "YYYY-MM-DD H:mm").format("HH:mm") + "h de amanhã,";
					else
						fim = moment(element['fim'], "YYYY-MM-DD H:mm").format("YYYY-MM-DD HH:mm");
				}


				respnovos += ":information_source: :warning: " + element['icon'] + " ";
				respnovos += "#Aviso" + element['nivel'] + " devido a ";
				respnovos += "#" + tipo + " entre as ";
				respnovos += inicio + " e as ";
				respnovos += fim + " para os distritos de ";

				resptwitter += "ℹ️⚠️" + iconTipo + " ";
				resptwitter += "#Aviso" + element['nivel'] + " devido a ";
				resptwitter += "#" + tipo + " entre as ";
				resptwitter += inicio + " e as ";
				resptwitter += fim + " para os distritos de ";

				element['locais'].forEach(function (local) {
					if (primeiro == 0) {
						respnovos += "#" + local['local'];
						resptwitter += "#" + local['local'];
					}
					else if ((element['locais'].length - 1) == primeiro) {
						respnovos += ", e #" + local['local'];
						resptwitter += ", e #" + local['local'];
					}
					else {
						respnovos += ", #" + local['local'];
						resptwitter += ", #" + local['local'];
					}
					primeiro = primeiro + 1;
				})
				respnovos += " " + element['icon'] + " :warning: :information_source:\n\n";
				resptwitter += " " + iconTipo + "⚠️ℹ️";
				client_twitter.post('statuses/update', { status: resptwitter }, function (error, tweet, response) {
				});
			})
			if (respnovos != "")
				client.channels.get("501056125802905601").send("***Novos Alertas:***\n" + respnovos)
		});
	});


	schedule.scheduleJob({ hour: 0, minute: 0, second: 30 }, function () {
		var date = moment().subtract(1, 'days').format('L');
		var resp = "";
		var respsentido = "";
		axios.get('https://bot-api.vost.pt/getSismos.php', {
		}).then(res => {
			res.data.forEach(function (element) {
				if (moment(element['time']).format('L') == date) {
					if (element['sensed'] == true) {
						respsentido += moment(element['time']).format('LT') + "h - ";
						respsentido += "M" + element['magType'] + " ";
						respsentido += "**" + element['magnitud'] + "** em ";
						respsentido += element['obsRegion'] + " a ";
						respsentido += element['depth'] + "Km prof. ";
						respsentido += "**Sentido em " + element['local'] + " com Int. " + element['degree'] + "** " + element['shakemapref'];
						respsentido += " // " + element['lat'] + "," + element['lon'] + "\n";
					}
					else {
						resp += moment(element['time']).format('LT') + "h - ";
						resp += "M" + element['magType'] + " ";
						resp += "**" + element['magnitud'] + "** em ";
						resp += element['obsRegion'] + " a ";
						resp += element['depth'] + "Km prof. // ";
						resp += element['lat'] + "," + element['lon'] + "\n";
					}
				}
			})
			if (respsentido != "")
				client.channels.get("551435401697558528").send("***Sismos sentido dia " + date + ":***\n" + respsentido);
			if (resp != "")
				client.channels.get("551435401697558528").send("***Sismos de " + date + ":***\n" + resp);
		})
	});
});


// Here starts the fun part. 

client.on('message', msg => {
	var prefix = "!";
	var prefix_help = "?";


//catering 
	// Morning Routine

	if (msg.content.toLowerCase().indexOf("bom dia") != -1 && !msg.author.bot) {
		var hora = parseInt(moment(msg.createdTimestamp).format('H'));
		if (hora >= 13 && hora < 20) {
			msgString = `Para mim já é boa Tarde, ${msg.author}! `;
		}
		else if (hora >= 20) {
			msgString = `Para mim já é boa Noite, ${msg.author}! **Estás bem?**`;
		}
		else if (hora < 6) {
			msgString = `Já de pé a estas horas, ${msg.author}? **ALVORADA!!!!!!**`;
		}
		else {
			msgString = `Bom Dia ${msg.author}, `;
			switch (msg.author.discriminator) {
				case '1318':
					msgString += "aqui tens o teu chá verde :tea:";
					break;
				case '5850':
					msgString += "aqui tens o teu chá verde quentinho :tea:";
					break;
				case '2458':
					msgString += "já sei que não bebes café. Aceita antes um chá :tea:";
					break;
				case '7744':
					msgString += "aqui está o teu chá! :tea:";
					break;
				case '2908':
					msgString += "duplo curto, como gostas, certo? :coffee:";
					break;
				default:
					msgString += "aqui tens o teu café :coffee:";
					break;
			}
		}

		msg.channel.send(msgString)
	}
	
	// Good Afternoon routine 

	if (msg.content.toLowerCase().indexOf("boa tarde") != -1 && !msg.author.bot) {
		var hora = parseInt(moment(msg.createdTimestamp).format('H'));
		if (hora >= 12 && hora < 15) {
			msgString = `Boa tarde, ${msg.author}! Já almoçaste?`;
		}
		else if (hora >= 15 && hora <= 17) {
			msgString = `Muito boa tarde, ${msg.author}! Tudo bem contigo?`;
		}
		else if (hora > 17 && hora <= 19) {
			msgString = `Vai um lanchinho ${msg.author}? :milk: :cake:`;
		}
		else {
			msgString = `Boa tarde ${msg.author}, `;
			switch (msg.author.discriminator) {
				case '1318':
					msgString += "os voluntários estão a portar-se bem?";
					break;
				case '2908':
					msgString += "não me mandes abaixo outra vez, pá!";
					break;
				default:
					msgString += "como está o tempo por aí?";
					break;
			}
		}
		msg.channel.send(msgString)
	}


	// Good Night routine
	if (msgContent.toLowerCase().indexOf("boa noite") != -1 && !msg.author.bot) {
		var hora = parseInt(moment(msg.createdTimestamp).format('H'));
		if (hora < 19) {
			msgString = `Boa noite, ${msg.author}? Estás em que fuso horário?`
		}
		else if (hora >= 20 && hora <=23) {
			msgString = `Boa noite ${msg.author}, Já jantaste?`
		}
		else if (hora >23 && hora < 01) {
			msgString = `Boa noite ${msg.author}, como é que vai isso?`
		}
		else {
			msgString = `Por aqui a estas horas? Deves ser developer ou estamos activados e ninguém me disse :thinking:`
		}
		msg.channel.send(msgString)
	}	


	if (msg.content === "!coffee") {
		msg.channel.send(`@everyone A pedido de ${msg.author} tomem lá um café! :coffee:`);
	}

	if (msg.content === "!champagne") {
		msg.channel.send(`@everyone A pedido de ${msg.author} vamos todos celebrar :champagne: :champagne_glass:`);
	}

	// End Catering

	// Foul Language
	if (msg.content.toLowerCase().indexOf("merda") != -1 && !msg.author.bot) {
		msg.channel.send(`Hey ${msg.author} https://media1.tenor.com/images/ff97f5136e14b88c76ea8e8488e23855/tenor.gif?itemid=13286953`)
	}
	// End Foul Language

	// Teaching 
	if (msg.content.toLowerCase().indexOf("voluntários") != -1 && !msg.author.bot) {
		msg.channel.send(`Desculpa interromper, ${msg.author}, mas na VOST Portugal ser voluntário é trabalhar para a invisibilidade e sempre com transparência`)
	}

	if (msg.content.toLowerCase().indexOf("💪") != -1 && !msg.author.bot) {
		msg.channel.send(`Muito vai esta gente ao ginásio, graças a Deus :rolling_eyes: `)
	}

	// Football? No problem! (If you are in the US reading this code we mean real football, not the thing you play with pads and helmets)
	if (msg.content.toLowerCase().indexOf("benfica") != -1 && !msg.author.bot) {
		msg.channel.send(`:eagle: ${msg.author} :eagle: **SLB! SLB! SLB! SLB! SLB! SLB! Glorioso SLB! GLORIOSO SLB!** :eagle:`)
	}

	if (msg.content.toLowerCase().indexOf("sporting") != -1 && !msg.author.bot) {
		msg.channel.send(`:lion_face: ${msg.author} :lion_face: **Todo o mundo sabe porque não fico em casa!** :lion_face:`)
	}

	if (msg.content.toLowerCase().indexOf("fcp") != -1 && !msg.author.bot) {
		msg.channel.send(`:dragon: ${msg.author} :dragon: **E salta Porto! E salta Porto! Allez! Allez!** :dragon:`)
	}

	if (msg.content.toLowerCase().indexOf("fc porto") != -1 && !msg.author.bot) {
		msg.channel.send(`:dragon: ${msg.author} :dragon: **E salta Porto! E salta Porto! Allez! Allez!** :dragon:`)
	}

	if (msg.content.toLowerCase().indexOf("senhorim") != -1 && !msg.author.bot) {
		msg.channel.send(`:bear: ${msg.author} :bear: **SENHORIM! SENHORIM! QUEM AQUI VEM NÃO MANDA AQUI!** :bear:`)
	}

	if (msg.content.toLowerCase().indexOf("scb") != -1 && !msg.author.bot) {
		msg.channel.send(`${msg.author} **Braga Braga Braga, vamos para a frente!**`)
	}

	if (msg.content.toLowerCase().indexOf("sc braga") != -1 && !msg.author.bot) {
		msg.channel.send(`${msg.author} **Braga Braga Braga, vamos para a frente!**`)
	}
	// End Football
	//End just for fun 

	if (msg.content.startsWith(prefix_help) && !msg.author.bot) {
		const args = msg.content.slice(prefix_help.length).split(' ');
		const command = args.shift().toLowerCase();

		if (command === 'commands') {
			var resp = "\n";

			resp += "**!coffee** - *Manda vir café para todos.*\n";
			resp += "**!champagne** - *Se há algo para festejar, serve champagne a todos*\n";
			resp += "**!all** - *Mostra todas as ocorrências em estado de despacho, em curso ou em resolução.*\n";
			resp += "**!all [human|ground|air] [numero_filtrar]** - *Igual ao anterior mas com filtro.*\n";
			resp += "**!all links** - *Mostra todas as ocorrências e o link para o fogos.pt em estado de despacho, em curso ou em resolução.*\n";
			resp += "**!all important** - *Mostra todas as ocorrências marcadas como importantes na ProCiv.*\n";
			resp += "**!op id [numero_id]** - *Mostra os dados relativos à ocorrência com esse id.*\n";
			resp += "**!op if [#IFConcelho]** - *Mostra os dados relativos à ocorrência com esse #IF.*\n";
			resp += "**!op status [Despacho|Curso|Resolução|Conclusão|Vigilância]** - *Mostra as ocorrências com o estado indicado.*\n";
			resp += "**!op distrito [nome_distrito]** - *Mostra as ocorrências no distrito indicado. NOTA: Distrito deve ser introduzido sem espaço e em minúsculas*\n";
			resp += "**!weather** - *Mostra a meteorologia do dia atual.*\n";
			resp += "**!weather tomorrow** - *Mostra a meteorologia do dia seguinte.*\n";
			resp += "**!acronimo [acronimo]** - *Mostra a definição de qualquer acronimo na base de dados, por ex. !acronimo ANPC*\n";

			msg.channel.send("***Comandos:***\n" + resp);
		}

		if (command === 'acronimo') {
			if (args.length < 1) {
				return msg.channel.send(`*Give me more data* para eu poder trabalhar, ${msg.author}!`);
			}
			const argumento = args[0].toLowerCase();
			axios.get('https://vost.mariosantos.net/api/acronym/' + argumento, {
			}).then(res => {
				var resp = "";
				resp += "\n";
				resp += res.data['acronym'] + " - ";
				resp += res.data['description'];
				msg.channel.send(resp);
			})
				.catch(error => {
					msg.reply("Esse acrónimo não consta na base de dados!");
				});
		}
	}

	if (msg.content.startsWith(prefix) && !msg.author.bot) {
		const args = msg.content.slice(prefix.length).split(' ');
		const command = args.shift().toLowerCase();

		if (command === 'all') {
			if (args.length == 0) {
				axios.get('https://bot-api.vost.pt/getAllProciv.php', {
				}).then(res => {
					var resp = "";
					var respimportantes = "";
					res.data.forEach(function (element) {
						if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
							respimportantes = respimportantes + "\n";
							respimportantes = respimportantes + "__**" + element['d'] + " - ";
							respimportantes = respimportantes + element['id'] + " - ";
							respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
							respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
							respimportantes = respimportantes + element['t'] + ":fire_engine: ";
							respimportantes = respimportantes + element['a'] + ":helicopter: - ";
							respimportantes = respimportantes + element['e'] + "**__";
						}
						else {
							resp += "\n";
							resp += element['d'] + " - ";
							resp += element['id'] + " - ";
							resp += "#IF" + element['l'] + "," + element['s'] + " - ";
							resp += element['o'] + ":man_with_gua_pi_mao: ";
							resp += element['t'] + ":fire_engine: ";
							resp += element['a'] + ":helicopter: - ";
							resp += element['e'];
						}
					});
					if (respimportantes != "")
						msg.channel.send(":fire::fire: ***Ocorrências Importantes:***\n" + respimportantes);
					if (resp != "")
						msg.channel.send(":fire: ***Ocorrências:***\n" + resp);
					if (resp == "" && respimportantes == "")
						msg.channel.send(":fire: ***Sem Ocorrências***");
				})
			}
			else {
				const argumento = args[0].toLowerCase();
				if (argumento == "links") {
					axios.get('https://bot-api.vost.pt/getAllProciv.php', {
					}).then(res => {
						var resp = "";
						var respimportantes = "";
						res.data.forEach(function (element) {
							if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
								respimportantes = respimportantes + "\n";
								respimportantes = respimportantes + "__**" + "#IF" + element['l'] + "," + element['s'] + " - ";
								respimportantes = respimportantes + "https://fogos.pt/fogo/2019" + element['id'] + "**__";
							}
							else {
								resp += "\n";
								resp += "#IF" + element['l'] + "," + element['s'] + " - ";
								resp += "https://fogos.pt/fogo/2019" + element['id'];
							}
						});
						if (resp != "" || respimportantes != "")
							msg.channel.send(":fire: ***Ocorrências:***\n" + respimportantes + resp);
						else
							msg.channel.send(":fire: ***Sem Ocorrências***");
					})
				}
				else
					if (argumento == "human") {
						if (args.length < 2) {
							return msg.channel.send(`Falta o numero de operacionais, ${msg.author}!`);
						}
						axios.get('https://bot-api.vost.pt/getAllProciv.php', {
						}).then(res => {
							var resp = "";
							var respimportantes = "";
							res.data.forEach(function (element) {
								if (element['o'] > args[1]) {
									if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
										respimportantes = respimportantes + "\n";
										respimportantes = respimportantes + "__**" + element['d'] + " - ";
										respimportantes = respimportantes + element['id'] + " - ";
										respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
										respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
										respimportantes = respimportantes + element['t'] + ":fire_engine: ";
										respimportantes = respimportantes + element['a'] + ":helicopter: - ";
										respimportantes = respimportantes + element['e'] + "**__";
									}
									else {
										resp += "\n";
										resp += element['d'] + " - ";
										resp += element['id'] + " - ";
										resp += "#IF" + element['l'] + "," + element['s'] + " - ";
										resp += element['o'] + ":man_with_gua_pi_mao: ";
										resp += element['t'] + ":fire_engine: ";
										resp += element['a'] + ":helicopter: - ";
										resp += element['e'];
									}
								}
							});
							if (resp != "" || respimportantes != "")
								msg.channel.send(":fire: ***Ocorrências +" + args[1] + " Operacionais:***\n" + respimportantes + resp);
							else
								msg.channel.send(":fire: ***Sem Ocorrências***");
						})
					}
					else
						if (argumento == "ground") {
							if (args.length < 2) {
								return msg.channel.send(`Falta o numero de meios terrestres, ${msg.author}!`);
							}
							axios.get('https://bot-api.vost.pt/getAllProciv.php', {
							}).then(res => {
								var resp = "";
								var respimportantes = "";
								res.data.forEach(function (element) {
									if (element['t'] > args[1]) {
										if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
											respimportantes = respimportantes + "\n";
											respimportantes = respimportantes + "__**" + element['d'] + " - ";
											respimportantes = respimportantes + element['id'] + " - ";
											respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
											respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
											respimportantes = respimportantes + element['t'] + ":fire_engine: ";
											respimportantes = respimportantes + element['a'] + ":helicopter: - ";
											respimportantes = respimportantes + element['e'] + "**__";
										}
										else {
											resp += "\n";
											resp += element['d'] + " - ";
											resp += element['id'] + " - ";
											resp += "#IF" + element['l'] + "," + element['s'] + " - ";
											resp += element['o'] + ":man_with_gua_pi_mao: ";
											resp += element['t'] + ":fire_engine: ";
											resp += element['a'] + ":helicopter: - ";
											resp += element['e'];
										}
									}
								});
								if (resp != "" || respimportantes != "")
									msg.channel.send(":fire: ***Ocorrências +" + args[1] + " Meios Terrestres:***\n" + respimportantes + resp);
								else
									msg.channel.send(":fire: ***Sem Ocorrências***");
							})
						}
						else
							if (argumento == "air") {
								if (args.length < 2) {
									return msg.channel.send(`Falta o numero de meios aereos, ${msg.author}!`);
								}
								axios.get('https://bot-api.vost.pt/getAllProciv.php', {
								}).then(res => {
									var resp = "";
									var respimportantes = "";
									res.data.forEach(function (element) {
										if (element['a'] > args[1]) {
											if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
												respimportantes = respimportantes + "\n";
												respimportantes = respimportantes + "__**" + element['d'] + " - ";
												respimportantes = respimportantes + element['id'] + " - ";
												respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
												respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
												respimportantes = respimportantes + element['t'] + ":fire_engine: ";
												respimportantes = respimportantes + element['a'] + ":helicopter: - ";
												respimportantes = respimportantes + element['e'] + "**__";
											}
											else {
												resp += "\n";
												resp += element['d'] + " - ";
												resp += element['id'] + " - ";
												resp += "#IF" + element['l'] + "," + element['s'] + " - ";
												resp += element['o'] + ":man_with_gua_pi_mao: ";
												resp += element['t'] + ":fire_engine: ";
												resp += element['a'] + ":helicopter: - ";
												resp += element['e'];
											}
										}
									});
									if (resp != "" || respimportantes != "")
										msg.channel.send(":fire: ***Ocorrências +" + args[1] + " Meios Aereos:***\n" + respimportantes + resp);
									else
										msg.channel.send(":fire: ***Sem Ocorrências***");
								})
							}
				if (argumento == "important") {
					axios.get('https://bot-api.vost.pt/getImportantIF.php', {
					}).then(res => {
						var resp = "";
						res.data.forEach(function (element) {
							resp += "\n__**";
							resp += element['id'] + " - ";
							resp += "#IF" + element['l'] + "," + element['s'] + " - ";
							resp += element['i'];
							if (element['ps'] != "")
								resp += " - " + element['ps'];
							resp += "**__";
						});
						if (resp != "")
							msg.channel.send(":fire: ***Ocorrências:***\n" + resp);
						else
							msg.channel.send(":fire: ***Sem Ocorrências***");
					})
				}
			}
		}
		else if (command === 'op') {
			if (!args.length) {
				return msg.channel.send(`Falta o numero da ocorrência, ${msg.author}!`);
			}
			const argumento = args[0].toLowerCase();
			if (argumento == "id") {
				axios.get('https://bot-api.vost.pt/getAllProciv.php', {
				}).then(res => {
					var resp = "";
					var respimportantes = "";
					res.data.forEach(function (element) {
						if (element['id'] == args[1]) {
							if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
								respimportantes = respimportantes + "\n";
								respimportantes = respimportantes + "__**" + element['d'] + " - ";
								respimportantes = respimportantes + element['id'] + " - ";
								respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
								respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
								respimportantes = respimportantes + element['t'] + ":fire_engine: ";
								respimportantes = respimportantes + element['a'] + ":helicopter: - ";
								respimportantes = respimportantes + element['e'] + "**__";
							}
							else {
								resp += "\n";
								resp += element['d'] + " - ";
								resp += element['id'] + " - ";
								resp += "#IF" + element['l'] + "," + element['s'] + " - ";
								resp += element['o'] + ":man_with_gua_pi_mao: ";
								resp += element['t'] + ":fire_engine: ";
								resp += element['a'] + ":helicopter: - ";
								resp += element['e'];
							}
						}
					});
					if (resp != "" || respimportantes != "")
						msg.channel.send(":fire: ***Ocorrências:***\n" + respimportantes + resp);
					else
						msg.channel.send(":fire: ***Sem Ocorrências***");
				})
			}
			if (argumento == "if") {
				axios.get('https://bot-api.vost.pt/getAllProciv.php', {
				}).then(res => {
					var resp = "";
					var respimportantes = "";
					res.data.forEach(function (element) {
						if ("#IF" + element['l'] == args[1]) {
							if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
								respimportantes = respimportantes + "\n";
								respimportantes = respimportantes + "__**" + element['d'] + " - ";
								respimportantes = respimportantes + element['id'] + " - ";
								respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
								respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
								respimportantes = respimportantes + element['t'] + ":fire_engine: ";
								respimportantes = respimportantes + element['a'] + ":helicopter: - ";
								respimportantes = respimportantes + element['e'] + "**__";
							}
							else {
								resp += "\n";
								resp += element['d'] + " - ";
								resp += element['id'] + " - ";
								resp += "#IF" + element['l'] + "," + element['s'] + " - ";
								resp += element['o'] + ":man_with_gua_pi_mao: ";
								resp += element['t'] + ":fire_engine: ";
								resp += element['a'] + ":helicopter: - ";
								resp += element['e'];
							}
						}
					});
					if (resp != "" || respimportantes != "")
						msg.channel.send(":fire: ***Ocorrências:***\n" + respimportantes + resp);
					else
						msg.channel.send(":fire: ***Sem Ocorrências***");
				})
			}
			if (argumento == "vento") {
				const id = args[1].toLowerCase();
				axios.get('https://bot-api.vost.pt/getWindy.php?id=' + id, {
				}).then(res => {
					var resp = "";
					resp += "\n";
					resp += res.data['id'] + " - ";
					resp += "#IF" + res.data['l'] + "," + res.data['s'] + " - ";
					resp += res.data['velocidade'] + " KM/H ";
					resp += res.data['sentido'];
					if (resp != "")
						msg.channel.send(":wind_blowing_face: :fire: ***Ocorrência:***\n" + resp);
					else
						msg.channel.send(":wind_blowing_face: :fire: ***Sem Ocorrência***");
				})
			}
			if (argumento == "status") {
				axios.get('https://bot-api.vost.pt/getAllProciv.php', {
				}).then(res => {
					var resp = "";
					var respimportantes = "";
					var estado = "";
					if (args[1] == "Conclusão")
						estado = "8";
					if (args[1] == "Curso")
						estado = "5";
					if (args[1] == "Despacho")
						estado = "4";
					if (args[1] == "Resolução")
						estado = "7";
					if (args[1] == "Vigilância")
						estado = "9";
					res.data.forEach(function (element) {
						if (element['ide'] == estado) {
							if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
								respimportantes = respimportantes + "\n";
								respimportantes = respimportantes + "__**" + element['d'] + " - ";
								respimportantes = respimportantes + element['id'] + " - ";
								respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
								respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
								respimportantes = respimportantes + element['t'] + ":fire_engine: ";
								respimportantes = respimportantes + element['a'] + ":helicopter: - ";
								respimportantes = respimportantes + element['e'] + "**__";
							}
							else {
								resp += "\n";
								resp += element['d'] + " - ";
								resp += element['id'] + " - ";
								resp += "#IF" + element['l'] + "," + element['s'] + " - ";
								resp += element['o'] + ":man_with_gua_pi_mao: ";
								resp += element['t'] + ":fire_engine: ";
								resp += element['a'] + ":helicopter: - ";
								resp += element['e'];
							}
						}
					});
					if (resp != "" || respimportantes != "")
						msg.channel.send(":fire: ***Ocorrências:***\n" + respimportantes + resp);
					else
						msg.channel.send(":fire: ***Sem Ocorrências***");
				})
			}

			if (argumento == "distrito") {
				const distritos = args[1].toLowerCase();
				var estado = "";
				if (distritos == "aveiro")
					estado = "1";
				if (distritos == "beja")
					estado = "2";
				if (distritos == "braga")
					estado = "3";
				if (distritos == "bragança")
					estado = "4";
				if (distritos == "castelobranco")
					estado = "5";
				if (distritos == "coimbra")
					estado = "6";
				if (distritos == "évora" || args[1] == "evora")
					estado = "7";
				if (distritos == "faro")
					estado = "8";
				if (distritos == "faro")
					estado = "9";
				if (distritos == "guarda")
					estado = "10";
				if (distritos == "leiria")
					estado = "11";
				if (distritos == "lisboa")
					estado = "12";
				if (distritos == "portalegre")
					estado = "13";
				if (distritos == "porto")
					estado = "14";
				if (distritos == "santarém" || args[1] == "santarem")
					estado = "15";
				if (distritos == "setúbal" || args[1] == "setubal")
					estado = "16";
				if (distritos == "vianadocastelo")
					estado = "17";
				if (distritos == "vilareal")
					estado = "18";
				if (distritos == "viseu")
					estado = "19";
				axios.get('http://api.wazepce.tech/getIFDistrito.php?distrito=' + estado, {
				}).then(res => {
					var resp = "";
					var respimportantes = "";
					res.data.forEach(function (element) {
						if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
							respimportantes = respimportantes + "\n";
							respimportantes = respimportantes + "__**" + element['d'] + " - ";
							respimportantes = respimportantes + element['id'] + " - ";
							respimportantes = respimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
							respimportantes = respimportantes + element['o'] + ":man_with_gua_pi_mao: ";
							respimportantes = respimportantes + element['t'] + ":fire_engine: ";
							respimportantes = respimportantes + element['a'] + ":helicopter: - ";
							respimportantes = respimportantes + element['e'] + "**__";
						}
						else {
							resp += "\n";
							resp += element['d'] + " - ";
							resp += element['id'] + " - ";
							resp += "#IF" + element['l'] + "," + element['s'] + " - ";
							resp += element['o'] + ":man_with_gua_pi_mao: ";
							resp += element['t'] + ":fire_engine: ";
							resp += element['a'] + ":helicopter: - ";
							resp += element['e'];
						}
					});
					if (resp != "" || respimportantes != "")
						msg.channel.send(":fire: ***Ocorrências:***\n" + respimportantes + resp);
					else
						msg.channel.send(":fire: ***Sem Ocorrências***");
				})
			}
		}
		else if (command === 'weather') {
			if (args.length == 0) {
				var resp = "***Meteorologia:***";
				axios.get('https://bot-api.vost.pt/getIPMA.php?day=0', {
				}).then(res => {
					var count = 0;
					res.data.forEach(function (element) {
						count = count + 1;
						resp += "\n";
						resp += "**" + element['local'] + "** ";
						resp += ":thermometer:" + element['tMin'] + "-";
						resp += element['tMax'] + "ºC / ";
						resp += element['descIdWeatherTypePT'] + " / ";
						resp += ":umbrella: " + element['precipitaProb'] + "% / ";
						resp += ":dash: " + element['vento'] + " " + element['predWindDir'];
						if (count >= 15) {
							msg.channel.send(resp);
							count = 0;
							resp = "";
						}
					});
					if (resp == "" || resp == "***Meteorologia:***")
						msg.channel.send("***Sem Dados***");
					else
						msg.channel.send(resp);
				})
			}
			else {
				const argumento = args[0].toLowerCase();
				if (argumento === 'tomorrow') {
					var resp = "***Meteorologia:***";
					axios.get('https://bot-api.vost.pt/getIPMA.php?day=1', {
					}).then(res => {
						var count = 0;
						res.data.forEach(function (element) {
							count = count + 1;
							resp += "\n";
							resp += "**" + element['local'] + "** ";
							resp += ":thermometer:" + element['tMin'] + "-";
							resp += element['tMax'] + "ºC / ";
							resp += element['descIdWeatherTypePT'] + " / ";
							resp += ":umbrella: " + element['precipitaProb'] + "% / ";
							resp += ":dash: " + element['vento'] + " " + element['predWindDir'];
							if (count >= 15) {
								msg.channel.send(resp);
								count = 0;
								resp = "";
							}
						});
						if (resp == "" || resp == "***Meteorologia:***")
							msg.channel.send("***Sem Dados***");
						else
							msg.channel.send(resp);
					})
				}
			}
		}
		else if (command === 'sismos') {
			if (args.length < 1) {
				return msg.channel.send(`Falta a data, ${msg.author}!`);
			}
			const argumento = args[0].toLowerCase();
			var date = moment(argumento).format('L');
			var resp = "";
			var respsentido = "";
			axios.get('https://bot-api.vost.pt/getSismos.php', {
			}).then(res => {
				res.data.forEach(function (element) {
					if (moment(element['time']).format('L') == date) {
						if (element['sensed'] == true) {
							respsentido += moment(element['time']).format('LT') + "h - ";
							respsentido += "M" + element['magType'] + " ";
							respsentido += "**" + element['magnitud'] + "** em ";
							respsentido += element['obsRegion'] + " a ";
							respsentido += element['depth'] + "Km prof. ";
							respsentido += "**Sentido em " + element['local'] + " com Int. " + element['degree'] + "** " + element['shakemapref'];
							respsentido += " // " + element['lat'] + "," + element['lon'] + "\n";
						}
						else {
							resp += moment(element['time']).format('LT') + "h - ";
							resp += "M" + element['magType'] + " ";
							resp += "**" + element['magnitud'] + "** em ";
							resp += element['obsRegion'] + " a ";
							resp += element['depth'] + "Km prof. // ";
							resp += element['lat'] + "," + element['lon'] + "\n";
						}
					}
				})
				if (respsentido != "")
					msg.channel.send("***Sismos sentidos dia " + date + ":***\n" + respsentido);
				if (resp != "")
					msg.channel.send("***Sismos de " + date + ":***\n" + resp);
			})
		}
		else if (command === 'alerts') {
			var resp = "";
			axios.get('https://bot-api.vost.pt/getAlertas.php', {
			}).then(res => {
				res.data.forEach(function (element) {
					resp += element['local'] + "\n";
					element['alertas'].forEach(function (alerta) {
						resp += "**" + alerta['nivel'] + "** // ";
						resp += alerta['icon'] + alerta['tipo'] == "Precipitação" ? "Chuva" : alerta['tipo'] + " // ";
						resp += alerta['inicio'] + " :arrow_right: ";
						resp += alerta['fim'] + "\n";
					})
					resp += "\n";
				})
				if (resp != "")
					msg.channel.send("***Alertas:***\n" + resp);
			})
		}
	}
});

client.login(process.env.KEY_DISCORD);