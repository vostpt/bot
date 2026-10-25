jest.mock('../../src/services', () => ({
  Warnings: { getAll: jest.fn() },
  Prociv: { getAll: jest.fn() },
  Fires: { getImportantForestFires: jest.fn() },
  Earthquakes: { getAll: jest.fn(), getByDate: jest.fn() },
}));

const { Warnings, Prociv, Fires, Earthquakes } = require('../../src/services');
const alerts = require('../../src/slashCommands/Alerts');
const sismos = require('../../src/slashCommands/sismos');
const resumo = require('../../src/slashCommands/resumo');
const reportar = require('../../src/slashCommands/reportar');
const cafe = require('../../src/slashCommands/cafe');
const dica = require('../../src/slashCommands/dica');

const interactionFor = (subcommand, options = {}) => ({
  deferReply: jest.fn().mockResolvedValue(),
  editReply: jest.fn().mockResolvedValue(),
  reply: jest.fn().mockResolvedValue(),
  followUp: jest.fn().mockResolvedValue(),
  options: {
    getString: jest.fn((name) => options[name] || null),
    getInteger: jest.fn((name) => options[name] || null),
    getSubcommand: jest.fn(() => subcommand),
  },
});

describe('additional slash command workflows', () => {
  beforeEach(() => jest.clearAllMocks());

  test('/alerts filters region names without being case or accent sensitive', async () => {
    Warnings.getAll.mockResolvedValue({
      continente: [
        { local: 'Lisboa', alertas: [{ nivel: 'Laranja', tipo: 'Calor', inicio: 'hoje', fim: 'amanhã' }] },
        { local: 'Porto', alertas: [{ nivel: 'Amarelo', tipo: 'Chuva', inicio: 'hoje', fim: 'amanhã' }] },
      ],
      madeira: [],
      acores: [],
    });
    const interaction = interactionFor(null, { local: 'lisbóa' });

    await alerts.execute(interaction);

    const embed = interaction.editReply.mock.calls[0][0].embeds[0];
    expect(embed.data.fields.map((field) => field.name)).toEqual(['Lisboa']);
  });

  test('/sismos recentes respects the selected time window', async () => {
    const recent = { time: new Date().toISOString(), magType: 'ML', magnitud: 2.1,
      obsRegion: 'Lisboa', depth: 5, local: '', sensed: false, lat: 38, lon: -9 };
    Earthquakes.getAll.mockResolvedValue([recent]);
    const interaction = interactionFor('recentes', { horas: 6 });

    await sismos.execute(interaction);

    expect(Earthquakes.getAll).toHaveBeenCalledTimes(1);
    expect(interaction.editReply.mock.calls[0][0].embeds[0].data.title)
      .toContain('últimas 6 hora(s)');
  });

  test('/sismos data preserves strict date validation and lookup', async () => {
    const interaction = interactionFor('data', { data: '31/02/2026' });
    await sismos.execute(interaction);
    expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
    expect(Earthquakes.getByDate).not.toHaveBeenCalled();
  });

  test('/resumo shows source failures separately while presenting available data', async () => {
    Warnings.getAll.mockResolvedValue({ continente: [], madeira: [], acores: [] });
    Prociv.getAll.mockRejectedValue(new Error('offline'));
    Fires.getImportantForestFires.mockResolvedValue([]);
    Earthquakes.getAll.mockResolvedValue([]);
    const interaction = interactionFor(null);

    await resumo.execute(interaction);

    const fields = interaction.editReply.mock.calls[0][0].embeds[0].data.fields;
    expect(fields.find((field) => field.name === 'Ocorrências ProCiv').value)
      .toContain('temporariamente indisponível');
    expect(fields.find((field) => field.name === 'Avisos IPMA').value)
      .toContain('Sem avisos');
  });

  test('/reportar clearly directs emergencies to official numbers and says it does not forward reports', async () => {
    const interaction = interactionFor(null);
    await reportar.execute(interaction);
    const description = interaction.reply.mock.calls[0][0].embeds[0].data.description;
    expect(description).toContain('112');
    expect(description).toContain('117');
    expect(description).toContain('não encaminha');
  });

  test('/cafe is explicitly an unofficial ephemeral joke', async () => {
    const interaction = interactionFor(null);
    await cafe.execute(interaction);
    expect(interaction.reply.mock.calls[0][0]).toEqual(expect.objectContaining({ ephemeral: true }));
    expect(interaction.reply.mock.calls[0][0].content).toContain('não oficial');
  });

  test('/dica includes a preparedness tip and official source', async () => {
    const interaction = interactionFor(null);
    await dica.execute(interaction);
    const embed = interaction.reply.mock.calls[0][0].embeds[0].data;
    expect(embed.description).toBeTruthy();
    expect(embed.fields[0].value).toContain('prociv.gov.pt');
  });
});
