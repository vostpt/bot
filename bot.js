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

		axios.get('https://api.wazepce.tech/getIF.php', {
		}).then(res => {
			var respnovos = "";
			var respatualizados = "";
			var respnovosimportantes = "";
			var respatualizadosimportantes = "";
			res.data.forEach(function (element) {
				if (element['tipo'] == "1") {
					if (element['o'] > 20 || (element['t'] + element['a']) > 5) {
						respnovosimportantes = respnovosimportantes + "\n";
						respnovosimportantes = respnovosimportantes + "__**" + element['d'] + " - ";
						respnovosimportantes = respnovosimportantes + element['id'] + " - ";
						respnovosimportantes = respnovosimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
						respnovosimportantes = respnovosimportantes + element['o'] + ":man_with_gua_pi_mao: ";
						respnovosimportantes = respnovosimportantes + element['t'] + ":fire_engine: ";
						respnovosimportantes = respnovosimportantes + element['a'] + ":helicopter:";
						respnovosimportantes = respnovosimportantes + element['e'] + "**__";
					}
					else {
						respnovos = respnovos + "\n";
						respnovos = respnovos + element['d'] + " - ";
						respnovos = respnovos + element['id'] + " - ";
						respnovos = respnovos + "#IF" + element['l'] + "," + element['s'] + " - ";
						respnovos = respnovos + element['o'] + ":man_with_gua_pi_mao: ";
						respnovos = respnovos + element['t'] + ":fire_engine: ";
						respnovos = respnovos + element['a'] + ":helicopter: - ";
						respnovos = respnovos + element['e'];
					}
				}
				else if (element['tipo'] == "2") {
					respatualizados = respatualizados + "\n";
					respatualizados = respatualizados + element['id'] + " - ";
					respatualizados = respatualizados + "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizados = respatualizados + element['ea'] + " :track_next: " + element['e'];
				}
				else if (element['tipo'] == "3") {
					respatualizadosimportantes = respatualizadosimportantes + "\n";
					respatualizadosimportantes = respatualizadosimportantes + "__**" + element['id'] + " - ";
					respatualizadosimportantes = respatualizadosimportantes + "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizadosimportantes = respatualizadosimportantes + element['ea'] + " :track_next: " + element['e'] + "**__";
				}
				else if (element['tipo'] == "4") {
					respatualizadosimportantes = respatualizadosimportantes + "\n";
					respatualizadosimportantes = respatualizadosimportantes + "__**" + element['id'] + " - ";
					respatualizadosimportantes = respatualizadosimportantes + "#IF" + element['l'] + "," + element['s'] + " - Subiu para ";
					respatualizadosimportantes = respatualizadosimportantes + element['o'] + ":man_with_gua_pi_mao: ";
					respatualizadosimportantes = respatualizadosimportantes + element['t'] + ":fire_engine: ";
					respatualizadosimportantes = respatualizadosimportantes + element['a'] + ":helicopter:" + "**__";
				}
				else if (element['tipo'] == "5") {
					respatualizadosimportantes = respatualizadosimportantes + "\n";
					respatualizadosimportantes = respatualizadosimportantes + "__**" + element['id'] + " - ";
					respatualizadosimportantes = respatualizadosimportantes + "#IF" + element['l'] + "," + element['s'] + " - Desceu para ";
					respatualizadosimportantes = respatualizadosimportantes + element['o'] + ":man_with_gua_pi_mao: ";
					respatualizadosimportantes = respatualizadosimportantes + element['t'] + ":fire_engine: ";
					respatualizadosimportantes = respatualizadosimportantes + element['a'] + ":helicopter:" + "**__";
				}
				else if (element['tipo'] == "6") {
					var respatualizarimportancia = "";
					respatualizarimportancia = respatualizarimportancia + "\n";
					respatualizarimportancia = respatualizarimportancia + "__**" + element['id'] + " - ";
					respatualizarimportancia = respatualizarimportancia + "#IF" + element['l'] + "," + element['s'] + " -  ";
					respatualizarimportancia = respatualizarimportancia + element['o'] + ":man_with_gua_pi_mao: ";
					respatualizarimportancia = respatualizarimportancia + element['t'] + ":fire_engine: ";
					respatualizarimportancia = respatualizarimportancia + element['a'] + ":helicopter:" + "**__";
					client.channels.get("559054697944580098").send(":warning: :fire: ***Ocorrência importante:***\n" + respatualizarimportancia)
				}
				else if (element['tipo'] == "7") {
					var respatualizarimportancia = "";
					respatualizarimportancia = respatualizarimportancia + "\n";
					respatualizarimportancia = respatualizarimportancia + "__**" + element['id'] + " - ";
					respatualizarimportancia = respatualizarimportancia + "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizarimportancia = respatualizarimportancia + element['o'] + ":man_with_gua_pi_mao: ";
					respatualizarimportancia = respatualizarimportancia + element['t'] + ":fire_engine: ";
					respatualizarimportancia = respatualizarimportancia + element['a'] + ":helicopter:" + "**__";
					client.channels.get("559054697944580098").send("@here :warning: :fire: ***Ocorrência importante:***\n" + respatualizarimportancia)
				}
				else if (element['tipo'] == "8") {
					var respatualizarimportancia = "";
					respatualizarimportancia = respatualizarimportancia + "\n";
					respatualizarimportancia = respatualizarimportancia + "__**" + element['id'] + " - ";
					respatualizarimportancia = respatualizarimportancia + "#IF" + element['l'] + "," + element['s'] + " - ";
					respatualizarimportancia = respatualizarimportancia + element['ea'] + " :track_next: " + element['e'] + "**__";
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
		axios.get('https://api.wazepce.tech/getAvisos.php', {
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


				respnovos = respnovos + ":information_source: :warning: " + element['icon'] + " ";
				respnovos = respnovos + "#Aviso" + element['nivel'] + " devido a ";
				respnovos = respnovos + "#" + tipo + " entre as ";
				respnovos = respnovos + inicio + " e as ";
				respnovos = respnovos + fim + " para os distritos de ";

				resptwitter = resptwitter + "ℹ️⚠️" + iconTipo + " ";
				resptwitter = resptwitter + "#Aviso" + element['nivel'] + " devido a ";
				resptwitter = resptwitter + "#" + tipo + " entre as ";
				resptwitter = resptwitter + inicio + " e as ";
				resptwitter = resptwitter + fim + " para os distritos de ";

				element['locais'].forEach(function (local) {
					if (primeiro == 0) {
						respnovos = respnovos + "#" + local['local'];
						resptwitter = resptwitter + "#" + local['local'];
					}
					else if ((element['locais'].length - 1) == primeiro) {
						respnovos = respnovos + ", e #" + local['local'];
						resptwitter = resptwitter + ", e #" + local['local'];
					}
					else {
						respnovos = respnovos + ", #" + local['local'];
						resptwitter = resptwitter + ", #" + local['local'];
					}
					primeiro = primeiro + 1;
				})
				respnovos = respnovos + " " + element['icon'] + " :warning: :information_source:\n\n";
				resptwitter = resptwitter + " " + iconTipo + "⚠️ℹ️";
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
		axios.get('https://api.wazepce.tech/getSismos.php', {
		}).then(res => {
			res.data.forEach(function (element) {
				if (moment(element['time']).format('L') == date) {
					if (element['sensed'] == true) {
						respsentido = respsentido + moment(element['time']).format('LT') + "h - ";
						respsentido = respsentido + "M" + element['magType'] + " ";
						respsentido = respsentido + "**" + element['magnitud'] + "** em ";
						respsentido = respsentido + element['obsRegion'] + " a ";
						respsentido = respsentido + element['depth'] + "Km prof. ";
						respsentido = respsentido + "**Sentido em " + element['local'] + " com Int. " + element['degree'] + "** " + element['shakemapref'];
						respsentido = respsentido + " // " + element['lat'] + "," + element['lon'] + "\n";
					}
					else {
						resp = resp + moment(element['time']).format('LT') + "h - ";
						resp = resp + "M" + element['magType'] + " ";
						resp = resp + "**" + element['magnitud'] + "** em ";
						resp = resp + element['obsRegion'] + " a ";
						resp = resp + element['depth'] + "Km prof. // ";
						resp = resp + element['lat'] + "," + element['lon'] + "\n";
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

client.on('message', msg => {
	var prefix = "!";
	var prefix_help = "?";

	if (msg.content.toLowerCase().indexOf("bom dia") != -1 && !msg.author.bot) {
		msgString = `Bom Dia ${msg.author}, `;
		switch (msg.author.discriminator) {
			case '1318':
				msgString = msgString + "aqui tens o teu chá verde :tea:";
				break;
			case '5850':
				msgString = msgString + "aqui tens o teu chá verde quentinho :tea:";
				break;
			case '2458':
				msgString = msgString + "já sei que não bebes café. Aceita antes um chá :tea:";
				break;
			case '7744':
				msgString = msgString + "aqui está o teu chá! :tea:";
				break;
			case '2908':
				msgString = msgString + "duplo curto, como gostas, certo? :coffee:";
				break;
			default:
				msgString = msgString + "aqui tens o teu café :coffee:";
				break;
		}

		msg.channel.send(msgString)
	}

	if (msg.content.toLowerCase().indexOf("merda") != -1 && !msg.author.bot) {
		msg.channel.send(`Hey ${msg.ahtor} https://media1.tenor.com/images/ff97f5136e14b88c76ea8e8488e23855/tenor.gif?itemid=13286953`)
	}
	if (msg.content.toLowerCase().indexOf("boa tarde") != -1 && !msg.author.bot) {
		msg.channel.send(`Boa tarde, ${msg.author}, vai um lanchinho? :milk: :cake:`)
	}

	if (msg.content.toLowerCase().indexOf("Benfica") != -1 && !msg.author.bot) {
		msg.channel.send(`${msg.author} :eagle:  SLB! SLB! SLB! SLB! SLB! Glorioso SLB! Glorioso SLB! :eagle:`)
	}

	if (msg.content.toLowerCase().indexOf("boa noite") != -1 && !msg.author.bot) {
		msg.channel.send(`Boa noite, ${msg.author}, café a esta hora não! Ou estamos activados e ninguém me disse nada? :thinking:`)
	}

	if (msg.content === "!coffee") {
		msg.channel.send(`@everyone A pedido de ${msg.author} tomem lá um café! :coffee:`);
	}

	if (msg.content === "!champagne") {
		msg.channel.send(`@everyone A pedido de ${msg.author} vamos todos celebrar :champagne: :champagne_glass:`);
	}

	if (msg.content.startsWith(prefix_help) && !msg.author.bot) {
		const args = msg.content.slice(prefix_help.length).split(' ');
		const command = args.shift().toLowerCase();

		if (command === 'commands') {
			var resp = "\n";

			resp = resp + "**!coffee** - *Manda vir café para todos.*\n";
			resp = resp + "**!champagne** - *Se há algo para festejar, serve champagne a todos*\n";
			resp = resp + "**!all** - *Mostra todas as ocorrências em estado de despacho, em curso ou em resolução.*\n";
			resp = resp + "**!all [human|ground|air] [numero_filtrar]** - *Igual ao anterior mas com filtro.*\n";
			resp = resp + "**!all links** - *Mostra todas as ocorrências e o link para o fogos.pt em estado de despacho, em curso ou em resolução.*\n";
			resp = resp + "**!all important** - *Mostra todas as ocorrências marcadas como importantes na ProCiv.*\n";
			resp = resp + "**!op id [numero_id]** - *Mostra os dados relativos à ocorrência com esse id.*\n";
			resp = resp + "**!op if [#IFConcelho]** - *Mostra os dados relativos à ocorrência com esse #IF.*\n";
			resp = resp + "**!op status [Despacho|Curso|Resolução|Conclusão|Vigilância]** - *Mostra as ocorrências com o estado indicado.*\n";
			resp = resp + "**!op distrito [nome_distrito]** - *Mostra as ocorrências no distrito indicado. NOTA: Distrito deve ser introduzido sem espaço e em minúsculas*\n";
			resp = resp + "**!weather** - *Mostra a meteorologia do dia atual.*\n";
			resp = resp + "**!weather tomorrow** - *Mostra a meteorologia do dia seguinte.*\n";
			resp = resp + "**!acronimo *acronimo* - *Mostra a definição de qualquer acronimo na base de dados, por ex. ANPC*\n";



			msg.channel.send("***Comandos:***\n" + resp);
		}

		if (command === 'acronimo') {
			if (args.length < 1) {
				return msg.channel.send(`Falta dados!, ${msg.author}!`);
			}
			const argumento = args[0].toLowerCase();
			axios.get('https://vost.mariosantos.net/api/acronym/' + argumento, {
			}).then(res => {
				var resp = "";
				resp = resp + "\n";
				resp = resp + res.data['acronym'] + " - ";
				resp = resp + res.data['description'];
				msg.channel.send(resp);
			})
				.catch(error => {
					msg.reply("O acrónimo não consta na base de dados!");
				});
		}
	}

	if (msg.content.startsWith(prefix) && !msg.author.bot) {
		const args = msg.content.slice(prefix.length).split(' ');
		const command = args.shift().toLowerCase();

		if (command === 'all') {
			if (args.length == 0) {
				axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
							resp = resp + "\n";
							resp = resp + element['d'] + " - ";
							resp = resp + element['id'] + " - ";
							resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
							resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
							resp = resp + element['t'] + ":fire_engine: ";
							resp = resp + element['a'] + ":helicopter: - ";
							resp = resp + element['e'];
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
					axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
								resp = resp + "\n";
								resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
								resp = resp + "https://fogos.pt/fogo/2019" + element['id'];
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
						axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
										resp = resp + "\n";
										resp = resp + element['d'] + " - ";
										resp = resp + element['id'] + " - ";
										resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
										resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
										resp = resp + element['t'] + ":fire_engine: ";
										resp = resp + element['a'] + ":helicopter: - ";
										resp = resp + element['e'];
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
							axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
											resp = resp + "\n";
											resp = resp + element['d'] + " - ";
											resp = resp + element['id'] + " - ";
											resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
											resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
											resp = resp + element['t'] + ":fire_engine: ";
											resp = resp + element['a'] + ":helicopter: - ";
											resp = resp + element['e'];
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
								axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
												resp = resp + "\n";
												resp = resp + element['d'] + " - ";
												resp = resp + element['id'] + " - ";
												resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
												resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
												resp = resp + element['t'] + ":fire_engine: ";
												resp = resp + element['a'] + ":helicopter: - ";
												resp = resp + element['e'];
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
					axios.get('https://api.wazepce.tech/getImportantIF.php', {
					}).then(res => {
						var resp = "";
						res.data.forEach(function (element) {
							resp = resp + "\n__**";
							resp = resp + element['id'] + " - ";
							resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
							resp = resp + element['i'];
							if (element['ps'] != "")
								resp = resp + " - " + element['ps'];
							resp = resp + "**__";
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
				axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
								resp = resp + "\n";
								resp = resp + element['d'] + " - ";
								resp = resp + element['id'] + " - ";
								resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
								resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
								resp = resp + element['t'] + ":fire_engine: ";
								resp = resp + element['a'] + ":helicopter: - ";
								resp = resp + element['e'];
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
				axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
								resp = resp + "\n";
								resp = resp + element['d'] + " - ";
								resp = resp + element['id'] + " - ";
								resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
								resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
								resp = resp + element['t'] + ":fire_engine: ";
								resp = resp + element['a'] + ":helicopter: - ";
								resp = resp + element['e'];
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
				axios.get('https://api.wazepce.tech/getWindy.php?id=' + id, {
				}).then(res => {
					var resp = "";
					resp = resp + "\n";
					resp = resp + res.data['id'] + " - ";
					resp = resp + "#IF" + res.data['l'] + "," + res.data['s'] + " - ";
					resp = resp + res.data['velocidade'] + " KM/H ";
					resp = resp + res.data['sentido'];
					if (resp != "")
						msg.channel.send(":wind_blowing_face: :fire: ***Ocorrência:***\n" + resp);
					else
						msg.channel.send(":wind_blowing_face: :fire: ***Sem Ocorrência***");
				})
			}
			if (argumento == "status") {
				axios.get('https://api.wazepce.tech/getAllProciv.php', {
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
								resp = resp + "\n";
								resp = resp + element['d'] + " - ";
								resp = resp + element['id'] + " - ";
								resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
								resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
								resp = resp + element['t'] + ":fire_engine: ";
								resp = resp + element['a'] + ":helicopter: - ";
								resp = resp + element['e'];
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
							resp = resp + "\n";
							resp = resp + element['d'] + " - ";
							resp = resp + element['id'] + " - ";
							resp = resp + "#IF" + element['l'] + "," + element['s'] + " - ";
							resp = resp + element['o'] + ":man_with_gua_pi_mao: ";
							resp = resp + element['t'] + ":fire_engine: ";
							resp = resp + element['a'] + ":helicopter: - ";
							resp = resp + element['e'];
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
				axios.get('https://api.wazepce.tech/getIPMA.php?day=0', {
				}).then(res => {
					var count = 0;
					res.data.forEach(function (element) {
						count = count + 1;
						resp = resp + "\n";
						resp = resp + "**" + element['local'] + "** ";
						resp = resp + ":thermometer:" + element['tMin'] + "-";
						resp = resp + element['tMax'] + "ºC / ";
						resp = resp + element['descIdWeatherTypePT'] + " / ";
						resp = resp + ":umbrella: " + element['precipitaProb'] + "% / ";
						resp = resp + ":dash: " + element['vento'] + " " + element['predWindDir'];
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
					axios.get('https://api.wazepce.tech/getIPMA.php?day=1', {
					}).then(res => {
						var count = 0;
						res.data.forEach(function (element) {
							count = count + 1;
							resp = resp + "\n";
							resp = resp + "**" + element['local'] + "** ";
							resp = resp + ":thermometer:" + element['tMin'] + "-";
							resp = resp + element['tMax'] + "ºC / ";
							resp = resp + element['descIdWeatherTypePT'] + " / ";
							resp = resp + ":umbrella: " + element['precipitaProb'] + "% / ";
							resp = resp + ":dash: " + element['vento'] + " " + element['predWindDir'];
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
			axios.get('https://api.wazepce.tech/getSismos.php', {
			}).then(res => {
				res.data.forEach(function (element) {
					if (moment(element['time']).format('L') == date) {
						if (element['sensed'] == true) {
							respsentido = respsentido + moment(element['time']).format('LT') + "h - ";
							respsentido = respsentido + "M" + element['magType'] + " ";
							respsentido = respsentido + "**" + element['magnitud'] + "** em ";
							respsentido = respsentido + element['obsRegion'] + " a ";
							respsentido = respsentido + element['depth'] + "Km prof. ";
							respsentido = respsentido + "**Sentido em " + element['local'] + " com Int. " + element['degree'] + "** " + element['shakemapref'];
							respsentido = respsentido + " // " + element['lat'] + "," + element['lon'] + "\n";
						}
						else {
							resp = resp + moment(element['time']).format('LT') + "h - ";
							resp = resp + "M" + element['magType'] + " ";
							resp = resp + "**" + element['magnitud'] + "** em ";
							resp = resp + element['obsRegion'] + " a ";
							resp = resp + element['depth'] + "Km prof. // ";
							resp = resp + element['lat'] + "," + element['lon'] + "\n";
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
			axios.get('https://api.wazepce.tech/getAlertas.php', {
			}).then(res => {
				res.data.forEach(function (element) {
					resp = resp + element['local'] + "\n";
					element['alertas'].forEach(function (alerta) {
						resp = resp + "**" + alerta['nivel'] + "** // ";
						resp = resp + alerta['icon'] + alerta['tipo'] == "Precipitação" ? "Chuva" : alerta['tipo'] + " // ";
						resp = resp + alerta['inicio'] + " :arrow_right: ";
						resp = resp + alerta['fim'] + "\n";
					})
					resp = resp + "\n";
				})
				if (resp != "")
					msg.channel.send("***Alertas:***\n" + resp);
			})
		}
	}
});

client.login(process.env.KEY_DISCORD);