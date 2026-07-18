const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildCbtReflection, findJournalMatches, buildSimpleCbtReflection } = require('../journal-utils');

test('buildCbtReflection returns a structured reframing summary', () => {
  const result = buildCbtReflection(
    'Mám pocit, že jsem neúspěšný.',
    'Dnes jsem nestihl několik úkolů.',
    'Přijdu si jako selhání.',
    'Mohu si vyhodnotit, co bylo skutečně těžké a co je jen moje interpretace.'
  );

  assert.match(result.summary, /přerámování/i);
  assert.match(result.facts, /Dnes jsem nestihl/i);
  assert.match(result.assumptions, /selhání/i);
  assert.match(result.alternative, /těžké/i);
});

test('findJournalMatches ranks entries by shared keywords', () => {
  const entries = [
    { id: 1, content: 'Dnes jsem se cítil klidně po dlouhé procházce.', createdAt: '2026-07-01' },
    { id: 2, content: 'Po práci jsem potřeboval ticho a chvíli bez zvuku.', createdAt: '2026-07-02' },
    { id: 3, content: 'Měl jsem velkou energii po ranním cvičení.', createdAt: '2026-07-03' }
  ];

  const matches = findJournalMatches(entries, 'klidný a ticho');

  assert.equal(matches[0].id, 2);
  assert.equal(matches[1].id, 1);
  assert.ok(matches[0].score >= matches[1].score);
});

test('buildSimpleCbtReflection creates a short cognitive reframe', () => {
  const result = buildSimpleCbtReflection(
    'úzkost',
    'Mám před meetingem pocit, že to zklamu.',
    'Když se něco pokazí, jsem neúspěšný.',
    'Včera se to povedlo dobře.',
    'Dnes je to jen jedna situace.',
    'Jedna chyba neznamená neúspěch.',
    'Udělat jeden malý krok a zkusit to poctivě.'
  );

  assert.match(result.title, /úzkost/i);
  assert.match(result.alternative, /neúspěch/i);
  assert.match(result.action, /jeden malý krok/i);
});

test('browser execution does not require module.exports', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'journal-utils.js'), 'utf8');
  const context = { window: {}, console };

  assert.doesNotThrow(() => {
    vm.runInNewContext(source, context);
  });
});
