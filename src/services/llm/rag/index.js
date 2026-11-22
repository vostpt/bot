const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../..');
const RAG_DIR = path.join(ROOT_DIR, 'rag');
const MAX_CHUNK_CHARS = 900;
const DEFAULT_LIMIT = 3;

const STOPWORDS = new Set([
  'a', 'as', 'ao', 'aos', 'de', 'da', 'das', 'do', 'dos', 'e', 'em', 'para', 'com',
  'que', 'quando', 'qual', 'quais', 'quem', 'onde', 'como', 'foi', 'foram', 'ser',
  'sao', 'era', 'este', 'esta', 'esse', 'essa', 'mais', 'muito', 'tem', 'ter', 'ha',
  'um', 'uma', 'uns', 'umas', 'pelo', 'pela', 'pelos', 'pelas', 'sobre',
  'segundo', 'tambem', 'ja', 'the', 'and', 'for', 'with', 'from', 'what', 'when', 'who',
]);

let cache = null;

const normalize = (text) => String(text || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const tokenize = (text) => normalize(text)
  .split(/[^a-z0-9]+/)
  .filter(word => word.length > 2 && !STOPWORDS.has(word));

const isHeading = (paragraph) => (
  /^\d+\.\s/.test(paragraph)
  || /^[A-C]\.\s/.test(paragraph)
  || /^(O que faz|O que NÃO faz|Modelo de Financiamento|Ecossistema Tecnológico|Integrações e Extensões Municipais|Rede Internacional VOST|Principais Parcerias Institucionais)/i.test(paragraph)
);

const splitIntoChunks = (markdown) => {
  const paragraphs = markdown.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let heading = '';
  let current = [];
  let length = 0;

  const flush = () => {
    if (current.length === 0) {
      return;
    }

    chunks.push({
      heading,
      text: current.join('\n\n'),
    });
    current = [];
    length = 0;
  };

  paragraphs.forEach((paragraph) => {
    if (isHeading(paragraph)) {
      const hadContent = current.length > 0;
      flush();
      heading = hadContent || !heading ? paragraph : `${heading}\n${paragraph}`;
      return;
    }

    const block = heading && current.length === 0 ? `${heading}\n\n${paragraph}` : paragraph;

    if (length + block.length > MAX_CHUNK_CHARS && current.length > 0) {
      flush();
      current.push(heading ? `${heading}\n\n${paragraph}` : paragraph);
      length = current[0].length;
      return;
    }

    current.push(block);
    length += block.length;
  });

  flush();
  return chunks;
};

const loadDocuments = () => {
  if (!fs.existsSync(RAG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(RAG_DIR).filter(file => file.endsWith('.md')).sort();
  const signature = files.map((file) => {
    const stat = fs.statSync(path.join(RAG_DIR, file));
    return `${file}:${stat.mtimeMs}:${stat.size}`;
  }).join('|');

  if (cache && cache.signature === signature) {
    return cache.documents;
  }

  const documents = files.map((file) => {
    const absolutePath = path.join(RAG_DIR, file);
    const markdown = fs.readFileSync(absolutePath, 'utf8');

    return {
      source: path.relative(ROOT_DIR, absolutePath),
      chunks: splitIntoChunks(markdown).map((chunk, index) => ({
        ...chunk,
        id: `${file}:${index}`,
        source: path.relative(ROOT_DIR, absolutePath),
      })),
    };
  });

  cache = { signature, documents };
  return documents;
};

const containsTerm = (tokens, term) => tokens.some((candidate) => {
  if (candidate === term) {
    return true;
  }

  if (candidate === `${term}s` || term === `${candidate}s`) {
    return true;
  }

  if (term.length >= 6 && candidate.length >= 6) {
    return candidate.slice(0, 5) === term.slice(0, 5);
  }

  return false;
});

const matches = (weightedTerms, chunk) => {
  const headingTokens = tokenize(chunk.heading);
  const bodyTokens = tokenize(chunk.text);
  let score = 0;
  let matched = 0;

  weightedTerms.forEach(({ term, weight }) => {
    const inHeading = containsTerm(headingTokens, term);
    const inBody = containsTerm(bodyTokens, term);

    if (inHeading || inBody) {
      matched += 1;
      score += inHeading ? weight * 2 : weight;
    }
  });

  return { score, matched };
};

const search = (question, { limit = DEFAULT_LIMIT } = {}) => {
  const queryTerms = [...new Set(tokenize(question))];

  if (queryTerms.length === 0) {
    return [];
  }

  const chunks = loadDocuments().reduce((all, document) => all.concat(document.chunks), []);

  if (chunks.length === 0) {
    return [];
  }

  const weightedTerms = queryTerms.map((term) => {
    const frequency = chunks.filter((chunk) => (
      containsTerm(tokenize(`${chunk.heading} ${chunk.text}`), term)
    )).length;
    const idf = 1 + Math.log((chunks.length + 1) / (frequency + 1));

    return { term, weight: idf * (term.length >= 6 ? 1.2 : 1) };
  });

  const minMatched = queryTerms.length === 1 ? 1 : 2;
  const results = [];

  chunks.forEach((chunk) => {
    const { score, matched } = matches(weightedTerms, chunk);

    if (matched >= minMatched && score > 0) {
      results.push({ ...chunk, score });
    }
  });

  return results
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
};

const buildContext = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    return [];
  }

  return results.map(({ source, heading, text }) => ({
    fonte: source,
    seccao: heading,
    trecho: text,
  }));
};

module.exports = {
  RAG_DIR,
  loadDocuments,
  splitIntoChunks,
  tokenize,
  search,
  buildContext,
};
