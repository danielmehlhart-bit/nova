import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const dir = await mkdtemp(join(tmpdir(), 'nova-tests-'));
for (const name of [
  'journey',
  'design',
  'design-contract',
  'design-actions',
  'simulation',
  'citizens',
  'conversation',
  'ai-contract',
  'ai-actions',
]) {
  const source = await readFile(
    new URL('../app/' + name + '.ts', import.meta.url),
    'utf8',
  );
  const compiled = ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replace(
      /from ['"]\.\/(journey|simulation|citizens|conversation|ai-contract|ai-actions|design|design-contract|design-actions)['"]/g,
      "from './$1.mjs'",
    );
  await writeFile(join(dir, name + '.mjs'), compiled);
}
const {
  initialState,
  validSave,
  place,
  tick,
  counts,
  decide,
  pendingEvent,
  milestones,
  targets,
  isLand,
  isRoad,
} = await import(pathToFileURL(join(dir, 'simulation.mjs')));
const { converse, autoBuild } = await import(
  pathToFileURL(join(dir, 'conversation.mjs'))
);
const { profile } = await import(pathToFileURL(join(dir, 'citizens.mjs')));
const { journeyOf, journeyAction, reconcileJourney, journeyCommand, CHAPTERS } =
  await import(pathToFileURL(join(dir, 'journey.mjs')));
test.after(() => rm(dir, { recursive: true, force: true }));
test('initial world has a valid persistent resident for every person', () => {
  const s = initialState();
  assert.ok(validSave(s));
  assert.equal(s.people.length, s.population);
  assert.equal(
    new Set(s.people.map((p) => profile(p.id).name)).size,
    s.population,
  );
});
test('spoken building quantities and home adjacency create valid structures', () => {
  const s = initialState();
  const r = converse(s, 'Please build two gardens near homes', 'aura');
  assert.equal(counts(r.state).garden, counts(s).garden + 2);
  assert.ok(r.built);
  for (const t of r.state.tiles.slice(-2))
    assert.ok(
      r.state.tiles.some(
        (u) =>
          u.kind === 'home' && Math.abs(u.x - t.x) + Math.abs(u.y - t.y) <= 2,
      ),
    );
  assert.ok(validSave(r.state));
});
test('plural blueprints, polite phrasing and multiword names resolve correctly', () => {
  for (const [input, kind, n] of [
    ['Could you build three observatories', 'observatory', 3],
    ['Build a Memory House', 'archive', 1],
    ['Please plant two Wild Groves', 'wild', 2],
    ['Build two Cloudhomes', 'home', 2],
    ['Build a Dream Pod', 'dream', 1],
  ]) {
    const s = initialState(),
      r = converse(s, input, 'aura');
    assert.equal(counts(r.state)[kind], counts(s)[kind] + n, input);
  }
});
test('negation, advisory questions and ambiguous multi-builds do not mutate the city', () => {
  for (const command of [
    "Don't build a garden",
    'Should I build a garden?',
    'Build two gardens and three homes',
    'Build zero gardens',
    'Build 20 homes',
    'Build -3 homes',
  ]) {
    const s = initialState(),
      r = converse(s, command, 'aura');
    assert.ok(r.state === s, command);
  }
});
test('water, roads, occupied tiles and invalid blueprints reject placement', () => {
  const s = initialState();
  for (const [x, y, k] of [
    [-1, 0, 'home'],
    [8, 8, 'home'],
    [7, 7, 'garden'],
    [5, 5, 'core'],
    [5.2, 5, 'home'],
  ]) {
    const r = place(s, x, y, k);
    assert.equal(r.ok, false);
    assert.equal(r.state, s);
  }
});
test('free questions about people stay in conversation; explicit introductions open residents', () => {
  const s = initialState();
  for (const message of [
    'AURA, what could make tomorrow meaningful for people who already have everything? Give me one surprising idea, without building anything.',
    'What can people show us about living well?',
    'How do citizens who disagree learn from each other?',
  ]) {
    const reply = converse(s, message, 'aura');
    assert.equal(reply.action, undefined, message);
    assert.equal(reply.state, s, message);
  }
  for (const message of [
    'Meet the people',
    'Show me the residents',
    'Please introduce me to the citizens',
    'AURA, could you show me the people in NOVA?',
    'Who lives here?',
  ]) {
    assert.equal(converse(s, message, 'aura').action, 'people', message);
  }
});
test('residents remember conversations and distinguish dreams from fears', () => {
  const s = initialState();
  const r = converse(s, 'What does Mira dream about?', 'aura');
  assert.equal(r.speaker, 0);
  assert.match(r.text, /sound/);
  assert.equal(r.state.people[0].memories.length, 1);
  const next = converse(r.state, 'What worries you?', 0);
  assert.match(next.text, /surprise myself/);
  const recalled = converse(next.state, 'Do you remember our conversation?', 0);
  assert.match(recalled.text, /you asked about fear/);
  assert.ok(recalled.state.people[0].trust > s.people[0].trust);
});
test('a resident’s project advances only with a place to pursue it', () => {
  const s = initialState();
  assert.equal(tick(s).people[3].progress, 0);
  const built = autoBuild(s, 'dream', 1).state;
  assert.ok(tick(built).people[3].progress > 0);
  assert.ok(tick(s).people[0].progress > 0);
});
test('council decisions unlock by date, apply once and accept speech choices', () => {
  let s = initialState();
  assert.equal(decide(s, 0, 0), s);
  while (s.day < 5) s = tick(s);
  assert.equal(pendingEvent(s), 0);
  const r = converse(s, 'Choose option one', 'aura');
  assert.equal(r.state.decisions.length, 1);
  assert.equal(r.state.bonus.freedom, 8);
  assert.equal(decide(r.state, 0, 1), r.state);
  assert.ok(validSave(r.state));
});
test('balanced city can reach the complete playable objective', () => {
  let s = initialState();
  for (const [k, n] of [
    ['home', 2],
    ['agora', 4],
    ['garden', 5],
    ['atelier', 4],
    ['observatory', 3],
    ['wild', 4],
    ['archive', 2],
    ['dream', 1],
  ])
    s = autoBuild(s, k, n).state;
  for (let i = 0; i < 150; i++) {
    s = tick(s);
    const e = pendingEvent(s);
    if (e >= 0) s = decide(s, e, 1);
  }
  assert.equal(s.population, 240);
  assert.ok(
    milestones(s).every((g) => g.progress >= 1),
    JSON.stringify({ stats: s.stats, goals: milestones(s) }),
  );
  assert.ok(validSave(s));
  assert.ok(s.people.some((p) => p.progress >= 100));
});
test('dream-heavy planning produces a meaningful social tradeoff', () => {
  const s = initialState(),
    r = autoBuild(s, 'dream', 8).state;
  assert.ok(targets(r).connection < targets(s).connection);
  assert.ok(targets(r).freedom >= targets(s).freedom);
});
test('filled island stops building and gives a useful result', () => {
  let s = initialState();
  for (let x = 0; x < 17; x++)
    for (let y = 0; y < 17; y++)
      if (
        isLand(x, y) &&
        !isRoad(x, y) &&
        !s.tiles.some((t) => t.x === x && t.y === y)
      )
        s = place(s, x, y, 'garden').state;
  const r = converse(s, 'Build a garden', 'aura');
  assert.equal(r.state, s);
  assert.equal(r.built, false);
  assert.match(r.text, /no open/);
});
test('save validation handles malformed, duplicate and corrupted data without throwing', () => {
  for (const broken of [
    null,
    {},
    { ...initialState(), people: [null] },
    { ...initialState(), population: 2.4 },
    {
      ...initialState(),
      tiles: [...initialState().tiles, initialState().tiles[0]],
    },
    { ...initialState(), stats: { meaning: NaN } },
    { ...initialState(), people: [] },
  ])
    assert.equal(validSave(broken), false);
  assert.ok(validSave(JSON.parse(JSON.stringify(initialState()))));
});
const { contextFor, validAIContext, validAIReply, residentProfile } =
  await import(pathToFileURL(join(dir, 'ai-contract.mjs')));
const { applyAIReply } = await import(
  pathToFileURL(join(dir, 'ai-actions.mjs'))
);
test('AI receives bounded world context without secrets or the entire population', () => {
  const ctx = contextFor(
    initialState(),
    'What comes after a finished dream?',
    0,
    [],
  );
  assert.ok(validAIContext(ctx));
  assert.equal(ctx.resident.name, 'Mira Chen');
  assert.ok(!JSON.stringify(ctx).includes('OPENAI_API_KEY'));
  assert.ok(JSON.stringify(ctx).length < 6000);
  assert.equal(validAIContext({ ...ctx, message: 'x'.repeat(601) }), false);
});
test('AI resident plans change simulated behavior and persist as memories', () => {
  const s = initialState(),
    reply = {
      reply: 'I would like to listen to the stars with Ada.',
      memory: 'We discussed changing the direction of my next song.',
      plan: {
        wish: 'compose with the rhythms of distant stars',
        kind: 'observatory',
        activity: 'listening to distant stars with Ada',
        reflection: 'A question can be a kind of music.',
      },
      builds: [],
    };
  assert.ok(validAIReply(reply));
  const next = applyAIReply(s, 0, reply).state;
  assert.equal(residentProfile(next.people[0]).kind, 'observatory');
  assert.equal(tick(next).people[0].progress, 0);
  assert.ok(next.people[0].memories[0].includes('next song'));
  assert.ok(validSave(next));
  assert.ok(
    tick(autoBuild(next, 'observatory', 1).state).people[0].progress > 0,
  );
});
test('AI proposals obey placement and quantity limits and residents cannot build', () => {
  const s = initialState(),
    reply = {
      reply: 'Let us make room for more nature.',
      memory: '',
      plan: null,
      builds: [{ kind: 'garden', count: 2, near: 'home' }],
    };
  assert.ok(validAIReply(reply));
  assert.equal(applyAIReply(s, 'aura', reply).built, 2);
  assert.equal(applyAIReply(s, 0, reply).built, 0);
  assert.equal(
    validAIReply({
      ...reply,
      builds: [{ kind: 'core', count: 1, near: null }],
    }),
    false,
  );
  assert.equal(
    validAIReply({
      ...reply,
      builds: [{ kind: 'garden', count: 100, near: null }],
    }),
    false,
  );
});

const { validDesign, geometry } = await import(
  pathToFileURL(join(dir, 'design.mjs'))
);
const { proposeDesign, buildDesign, designIntent } = await import(
  pathToFileURL(join(dir, 'design-actions.mjs'))
);
const blueprint = {
  name: 'The Listening Garden',
  description: 'A round shelter and a planted roof.',
  parts: [
    {
      x: 0.5,
      y: 0.5,
      width: 0.8,
      depth: 0.7,
      elevation: 0,
      height: 20,
      sides: 16,
      rotation: 0,
      taper: 1,
      curve: 'straight',
      color: '#adc9e0',
    },
    {
      x: 0.5,
      y: 0.5,
      width: 0.7,
      depth: 0.6,
      elevation: 20,
      height: 8,
      sides: 16,
      rotation: 0,
      taper: 0,
      curve: 'dome',
      color: '#83b68d',
    },
  ],
};
const request = { blueprint, kind: 'garden', near: 'home', target: null };
test('procedural volumes are bounded, cached and visibly differ with dimensions', () => {
  assert.ok(validDesign(blueprint));
  const mesh = geometry(blueprint);
  assert.ok(mesh.length > 15 && mesh.length < 200);
  assert.equal(mesh, geometry(blueprint));
  for (const face of mesh)
    for (const p of face.points) {
      assert.ok(
        Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z),
      );
      assert.ok(
        p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 && p.z >= 0 && p.z <= 110,
      );
    }
  const taller = structuredClone(blueprint);
  taller.parts[0].height = 40;
  assert.notDeepEqual(geometry(taller), mesh);
  for (const field of [
    'x',
    'y',
    'width',
    'depth',
    'height',
    'elevation',
    'sides',
    'rotation',
    'taper',
  ]) {
    const bad = structuredClone(blueprint);
    bad.parts[0][field] = Infinity;
    assert.equal(validDesign(bad), false);
  }
  const outside = structuredClone(blueprint);
  outside.parts[0].x = 0.95;
  assert.equal(validDesign(outside), false);
  assert.equal(
    validDesign({ ...blueprint, parts: Array(13).fill(blueprint.parts[0]) }),
    false,
  );
  assert.equal(
    validDesign({
      ...blueprint,
      parts: [{ ...blueprint.parts[0], color: 'url(https://example.com)' }],
    }),
    false,
  );
});
test('resident designs are proposals; approved geometry uses real placement and save rules', () => {
  const original = initialState();
  const proposed = proposeDesign(original, request, 0).state;
  assert.equal(proposed.tiles, original.tiles);
  assert.equal(proposed.designProposal.author, 0);
  assert.ok(validSave(JSON.parse(JSON.stringify(proposed))));
  const built = buildDesign(proposed);
  assert.ok(built.tile);
  assert.equal(built.state.tiles.length, original.tiles.length + 1);
  assert.equal(built.tile.design.name, blueprint.name);
  assert.equal(built.tile.designer, 0);
  assert.equal(built.tile.revision, 1);
  assert.equal(built.state.designProposal, undefined);
  assert.ok(validSave(JSON.parse(JSON.stringify(built.state))));
  assert.equal(counts(built.state).garden, counts(original).garden + 1);
});
test('redesign revises a chosen place without changing capacity or other buildings', () => {
  const s = initialState();
  const target = s.tiles.find((t) => t.kind === 'home');
  const proposed = proposeDesign(
    s,
    { ...request, kind: 'home', target: { x: target.x, y: target.y } },
    'aura',
  ).state;
  const built = buildDesign(proposed);
  assert.equal(built.state.tiles.length, s.tiles.length);
  assert.equal(counts(built.state).home, counts(s).home);
  assert.equal(built.state.population, s.population);
  const edited = structuredClone(blueprint);
  edited.name = 'A smaller home';
  edited.parts[0].height = 12;
  const next = buildDesign(
    proposeDesign(
      built.state,
      { ...request, kind: 'home', target, blueprint: edited },
      'aura',
    ).state,
  );
  assert.equal(next.tile.revision, 2);
  assert.equal(
    built.tile.design.name,
    blueprint.name,
    'previous immutable tiles support undo',
  );
  assert.deepEqual(
    next.state.tiles.filter((t) => t.x !== target.x || t.y !== target.y),
    s.tiles.filter((t) => t.x !== target.x || t.y !== target.y),
  );
});
test('stale previews, protected core, purpose changes and invalid plots cannot overwrite the city', () => {
  const s = initialState(),
    home = s.tiles.find((t) => t.kind === 'home');
  assert.ok(proposeDesign(s, { ...request, target: home }, 'aura').error);
  assert.ok(
    proposeDesign(s, { ...request, target: { x: 7, y: 7 } }, 'aura').error,
  );
  const proposed = proposeDesign(
    s,
    { ...request, target: home, kind: 'home' },
    'aura',
  ).state;
  const changed = {
    ...proposed,
    tiles: proposed.tiles.map((t) => (t === home ? { ...t, revision: 2 } : t)),
  };
  assert.equal(buildDesign(changed).tile, null);
  for (const target of [
    { x: 8, y: 9 },
    { x: 0, y: 0 },
  ]) {
    const p = proposeDesign(s, { ...request, target }, 'aura').state;
    assert.equal(buildDesign(p).tile, null);
    assert.equal(buildDesign(p).state, p);
  }
});
test('descriptive commands preserve architectural intent rather than falling into catalog builds', () => {
  for (const text of [
    'Build a round garden',
    'Build a garden with a waterfall',
    'Make it taller',
    'Design a music pavilion',
    'Give this building a green roof',
    'Repaint this house blue',
  ])
    assert.ok(designIntent(text));
  assert.equal(designIntent('Build two homes'), false);
});

test('valid generated geometry fits the plot without another model request', async () => {
  const { fitDesign } = await import(pathToFileURL(join(dir, 'design.mjs')));
  const overflow = structuredClone(blueprint);
  overflow.parts[0].x = 0.94;
  overflow.parts[0].elevation = 80;
  overflow.parts[0].height = 70;
  assert.equal(validDesign(overflow), false);
  const fitted = fitDesign(overflow);
  assert.ok(validDesign(fitted));
  assert.equal(fitted.name, overflow.name);
  assert.equal(fitted.parts[0].sides, overflow.parts[0].sides);
  assert.equal(fitted.parts[0].color, overflow.parts[0].color);
  const unsafe = structuredClone(blueprint);
  unsafe.parts[0].color = 'url(evil)';
  assert.equal(fitDesign(unsafe), null);
  assert.equal(
    fitDesign({
      ...blueprint,
      parts: [{ ...blueprint.parts[0], height: Infinity }],
    }),
    null,
  );
});

test('model hex colors with missing prefix and short hex canonicalize safely', async () => {
  const { fitDesign } = await import(pathToFileURL(join(dir, 'design.mjs')));
  for (const [input, expected] of [
    ['efbe8e', '#efbe8e'],
    ['abc', '#aabbcc'],
    ['#abc', '#aabbcc'],
  ]) {
    const raw = structuredClone(blueprint);
    raw.parts[0].color = input;
    const fitted = fitDesign(raw);
    assert.ok(validDesign(fitted));
    assert.equal(fitted.parts[0].color, expected);
  }
});

test('every invitation path creates a real, unique keepsake only after a valid gathering', () => {
  for (const path of [0, 1])
    for (const agreement of [0, 1]) {
      let s = initialState();
      for (let chapter = 0; chapter < CHAPTERS.length; chapter++) {
        s = journeyAction(s, 'begin');
        s = journeyAction(s, `path-${path}`);
        assert.equal(journeyOf(s).phase, 'place');
        assert.equal(journeyAction(s, 'host'), s);
        const before = s;
        const built = autoBuild(s, CHAPTERS[chapter].paths[path].kind, 1);
        assert.equal(built.built, 1);
        s = reconcileJourney(before, built.state);
        assert.equal(journeyOf(s).phase, 'neighbor');
        s = journeyAction(s, `agreement-${agreement}`);
        s = journeyAction(s, 'host');
        assert.equal(journeyOf(s).phase, 'celebration');
        assert.equal(
          s.moments.filter((m) => m.id === 'gathering-' + chapter).length,
          1,
        );
        assert.equal(
          journeyAction(s, 'host'),
          s,
          'repeated hosting cannot farm memories or trust',
        );
        assert.ok(
          s.people[CHAPTERS[chapter].person].memories[0].includes('mayor'),
        );
        assert.ok(validSave(JSON.parse(JSON.stringify(s))));
        s = journeyAction(s, 'next');
      }
      assert.equal(s.moments.length, 3);
      assert.equal(journeyOf(s).chapter, 3);
      assert.equal(journeyAction(s, 'next'), s);
    }
});
test('existing venues, missing venues, undo and legacy saves remain playable', () => {
  let s = initialState();
  assert.equal(s.journey, undefined);
  assert.ok(validSave(s));
  s = journeyAction(journeyAction(s, 'begin'), 'path-0');
  s = journeyAction(s, 'use');
  assert.equal(s.tiles.length, 9, 'using an existing venue does not build');
  s = journeyAction(s, 'agreement-0');
  const venue = journeyOf(s).venue;
  const removed = {
    ...s,
    tiles: s.tiles.filter((t) => t.x !== venue.x || t.y !== venue.y),
  };
  assert.equal(
    journeyAction(removed, 'host'),
    removed,
    'stale venue cannot host',
  );
  const reconciled = reconcileJourney(s, removed);
  assert.equal(journeyOf(reconciled).phase, 'place');
  assert.equal(journeyOf(reconciled).agreement, undefined);
  assert.ok(validSave(reconciled));
  assert.equal(
    validSave({ ...s, journey: { ...s.journey, chapter: 500 } }),
    false,
  );
  assert.equal(
    validSave({ ...s, moments: [{ id: 'fake', text: 'x'.repeat(10000) }] }),
    false,
  );
});
test('dream rewards persist once and survive the next simulation tick', () => {
  let s = initialState();
  s = {
    ...s,
    people: s.people.map((p) => (p.id === 0 ? { ...p, progress: 99.9 } : p)),
  };
  s = tick(s);
  assert.equal(s.moments.filter((m) => m.id === 'dream-0-0').length, 1);
  const after = tick(JSON.parse(JSON.stringify(s)));
  assert.equal(after.moments.filter((m) => m.id === 'dream-0-0').length, 1);
  assert.ok(validSave(after));
});
test('story voice commands respect phases and do not turn advice or negation into actions', () => {
  let s = initialState();
  assert.equal(journeyCommand(s, 'What should I do first?'), 'open');
  assert.equal(journeyCommand(s, 'Host the gathering'), null);
  assert.equal(journeyCommand(s, 'Do not start the story'), null);
  s = journeyAction(s, 'begin');
  assert.equal(journeyCommand(s, 'An open stage'), 'path-0');
  assert.equal(journeyCommand(s, 'Would an open stage be a good idea?'), null);
  s = journeyAction(s, 'path-0');
  assert.equal(journeyCommand(s, 'Build my chosen place'), 'build');
  s = journeyAction(s, 'use');
  assert.equal(journeyCommand(s, 'Meet before sunset'), 'agreement-0');
  s = journeyAction(s, 'agreement-0');
  assert.equal(journeyCommand(s, 'Host the gathering'), 'host');
});
