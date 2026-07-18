function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

function buildCbtReflection(thought, evidence, assumption, insight) {
  const facts = evidence || 'Žádný konkrétní důkaz zatím není zaznamenán.';
  const assumptions = assumption || 'Předpoklad bez podpory v datech.';
  const alternative = insight || 'Zkus najít jiný, méně negativní výklad situace.';

  return {
    summary: `Přerámování myšlenky: ${thought}`,
    facts: `Skutečné fakta: ${facts}`,
    assumptions: `Domněnka: ${assumptions}`,
    alternative: `Alternativní pohled: ${alternative}`
  };
}

function findJournalMatches(entries, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  return entries
    .map((entry) => {
      const text = normalize(`${entry.content || ''} ${entry.title || ''}`);
      const matchedWords = words.filter((word) => text.includes(word));
      let score = matchedWords.length * 3;
      score += matchedWords.reduce((total, word) => total + (text.match(new RegExp(word, 'g')) || []).length, 0);
      if (matchedWords.length > 1) {
        const joined = matchedWords.join(' ');
        score += text.includes(joined) ? 2 : 0;
      }
      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (a.createdAt || '').localeCompare(b.createdAt || ''));
}

function buildSimpleCbtReflection(emotion, trigger, automaticThought, evidence, balancedThought, alternative, action) {
  const balanced = balancedThought || 'Kdybych to viděl vyváženěji, řekl bych si…';
  const reframe = alternative || balanced;
  return {
    title: `CBT pro ${emotion || 'emoce'}`,
    trigger: trigger || 'Situace, která vyvolala emoci.',
    automaticThought: automaticThought || 'Automatická myšlenka.',
    evidence: evidence || 'Co je skutečně pravda?',
    balancedThought: balanced,
    alternative: reframe,
    action: action || 'Vyber jeden malý krok, který pomůže v praxi.'
  };
}

if (typeof window !== 'undefined') {
  window.journalUtils = {
    buildCbtReflection,
    buildSimpleCbtReflection,
    findJournalMatches
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildCbtReflection,
    buildSimpleCbtReflection,
    findJournalMatches
  };
}
