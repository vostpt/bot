const HELP_TEXT = [
  '**Agentes VOSTPTia**',
  '**!agent create --name "<nome>" --prompt "<pergunta>" --now** — executa uma vez, imediatamente.',
  '**!agent create --name "<nome>" --prompt "<pergunta>" --in "30m"** — executa uma vez daqui a 30 minutos.',
  '**!agent create --name "<nome>" --prompt "<pergunta>" --at "2026-12-25T10:00"** — executa uma vez nessa data.',
  '**!agent create --name "<nome>" --prompt "<pergunta>" --rrule "FREQ=DAILY;BYHOUR=13;BYMINUTE=0"** — executa repetidamente.',
  '**!agent create --name "<nome>" --prompt "<pergunta>" --cron "0 13 * * *"** — executa repetidamente com Cron.',
  '**--once** com `--rrule` ou `--cron` executa apenas a próxima ocorrência.',
  '**!agent list** — mostra os teus agentes.',
  '**!agents** — mostra os agentes do servidor.',
  '**!agent update --name "<nome>" [--prompt "<pergunta>"] [--now | --in "30m" | --at "2026-12-25T10:00" | --rrule "FREQ=DAILY;BYHOUR=13;BYMINUTE=0"]** — altera um agente.',
  '**!agent cancel --name "<nome>"** — apaga o agente permanentemente (equivalentes: `delete`, `remove`).',
  '**!agent --help** — mostra esta ajuda.',
  'Uma criação aceita apenas uma opção de agendamento: `--now`, `--in`, `--at`, `--rrule` ou `--cron`.',
  'Referências: RRULE https://jkbrzt.github.io/rrule/ · Cron https://crontab.guru/',
].join('\n');

const ownerOf = (agent) => {
  if (!agent) {
    return null;
  }

  if (agent.ownerId) {
    return agent.ownerId;
  }

  if (agent.owner && typeof agent.owner === 'object') {
    return agent.owner.id || null;
  }

  return typeof agent.owner === 'string' ? agent.owner : null;
};

const dateLabel = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('pt-PT', {
    timeZone: 'Europe/Lisbon',
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const scheduleLabel = (agent) => {
  const schedule = agent.schedule || {};
  const kind = schedule.kind || agent.scheduleKind || agent.kind;
  const when = dateLabel(agent.nextRunAt || agent.nextRun || agent.runAt || schedule.runAt);

  switch (kind) {
    case 'now':
      return 'imediato';
    case 'in':
      return 'agendado';
    case 'at':
      return `em ${when || 'data por definir'}`;
    case 'rrule': {
      const rule = schedule.rrule || agent.rrule;

      return rule ? `recorrente (${rule})` : 'recorrente';
    }
    default:
      return kind ? String(kind) : 'agendado';
  }
};

const mayShowPrompt = (agent, options) => {
  if (options.isLocal || options.isAdmin) {
    return true;
  }

  const ownerId = ownerOf(agent);

  return !!ownerId && !!options.viewerId && String(ownerId) === String(options.viewerId);
};

const formatAgentLine = (agent, options = {}) => {
  const ownerId = ownerOf(agent);
  const owner = ownerId ? `<@${ownerId}>` : 'desconhecido';
  const status = agent.status || 'ativo';
  const nextRun = dateLabel(agent.nextRunAt || agent.nextRun);
  const schedule = scheduleLabel(agent);
  const next = nextRun && !schedule.includes(nextRun) ? ` · próxima: ${nextRun}` : '';
  const prompt = agent.prompt
    ? String(agent.prompt).replace(/\s+/g, ' ').trim()
    : '(sem pergunta)';
  const visiblePrompt = mayShowPrompt(agent, options) ? prompt : '(privado)';

  return `• **${agent.name || agent.nameKey || 'agente'}** · dono ${owner} · ${schedule} · ${status}${next} · pergunta: ${visiblePrompt}`;
};

const formatAgentList = (agents, options = {}) => {
  const lines = (Array.isArray(agents) ? agents : []).map(agent => formatAgentLine(agent, options));

  return [
    HELP_TEXT,
    '',
    ...(lines.length > 0 ? lines : ['_Sem agentes criados neste servidor._']),
  ].join('\n');
};

module.exports = {
  HELP_TEXT,
  formatAgentList,
  formatAgentLine,
};
