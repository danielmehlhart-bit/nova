import { validDesign, type Design } from './design';
import {
  PURPOSES,
  validProposal,
  type DesignProposal,
} from './design-contract';
import { advancePeople, seedPeople, type Person } from './citizens';
export const SIZE = 17;
export type Kind =
  | 'home'
  | 'garden'
  | 'agora'
  | 'atelier'
  | 'observatory'
  | 'wild'
  | 'dream'
  | 'archive'
  | 'core';
export type Metric = 'meaning' | 'connection' | 'freedom' | 'nature';
export type Tile = {
  x: number;
  y: number;
  kind: Kind;
  design?: Design;
  revision?: number;
  designer?: number | 'aura';
};
export type State = {
  version: 1;
  designProposal?: DesignProposal;
  day: number;
  population: number;
  tiles: Tile[];
  stats: Record<Metric, number>;
  bonus: Record<Metric, number>;
  decisions: number[];
  log: string[];
  won: boolean;
  people: Person[];
};
export const METRICS: {
  key: Metric;
  label: string;
  color: string;
  description: string;
}[] = [
  {
    key: 'meaning',
    label: 'Purpose',
    color: '#c4a3ff',
    description:
      'Personal projects, discoveries and things that do not need to be useful.',
  },
  {
    key: 'connection',
    label: 'Belonging',
    color: '#ffc18a',
    description:
      'Places to meet. Gardens near homes make everyday encounters more likely.',
  },
  {
    key: 'freedom',
    label: 'Freedom',
    color: '#8ac8ff',
    description:
      'Room for self-directed lives, wild ideas and imperfect moments.',
  },
  {
    key: 'nature',
    label: 'Nature',
    color: '#95d8aa',
    description:
      'Living diversity. Open space, gardens and wilderness keep the city balanced.',
  },
];
export const BUILDINGS: Record<
  Kind,
  {
    name: string;
    category: string;
    text: string;
    color: string;
    impact: string;
    height: number;
  }
> = {
  home: {
    name: 'Cloudhome',
    category: 'Living',
    text: 'A home that adapts to its people. Roof gardens, open doors and time to spare.',
    color: '#c8e5e1',
    impact: '+ 48 homes · needs places to connect',
    height: 56,
  },
  garden: {
    name: 'Living Garden',
    category: 'Nature',
    text: 'Fruit for everyone. Tended by machines, picked for pleasure. Especially helpful near homes.',
    color: '#93ca91',
    impact: '+ Nature · + belonging near homes',
    height: 20,
  },
  agora: {
    name: 'Agora',
    category: 'Togetherness',
    text: 'Eat together, disagree kindly, or let the afternoon happen. Nobody has to buy anything.',
    color: '#f7b580',
    impact: '+ Belonging · + freedom',
    height: 23,
  },
  atelier: {
    name: 'Wonder Lab',
    category: 'Creating',
    text: 'Music, inventions and beautifully impractical ideas. AI can help. The question is yours.',
    color: '#c1b0f0',
    impact: '+ Purpose · + freedom',
    height: 32,
  },
  observatory: {
    name: 'Observatory',
    category: 'Discovery',
    text: 'The universe still has secrets. A place to fall in love with a question together.',
    color: '#99c9ee',
    impact: '+ Purpose · bonus near Wonder Labs',
    height: 42,
  },
  wild: {
    name: 'Wild Grove',
    category: 'Open space',
    text: 'A piece of the city that nobody optimizes. Life gets to make its own plans here.',
    color: '#60b79d',
    impact: '+ Freedom · + nature',
    height: 26,
  },
  dream: {
    name: 'Dream Pod',
    category: 'Inner worlds',
    text: 'Every imaginable world, just for you. Wonderful, as long as you still feel like coming home.',
    color: '#efadd8',
    impact: '+ Freedom · + purpose · − belonging',
    height: 28,
  },
  archive: {
    name: 'Memory House',
    category: 'Remembering',
    text: 'Stories from the time when people sold their hours. A place to understand how far we have come.',
    color: '#e0cc9e',
    impact: '+ Purpose · + belonging',
    height: 40,
  },
  core: {
    name: 'AURA Core',
    category: 'Abundance',
    text: 'Since the last work shift, AURA has provided energy, food and material comfort. Without a price. Without an end.',
    color: '#8df5d2',
    impact: 'Unlimited provision · permanent',
    height: 91,
  },
};
export const KEYS = PURPOSES;
export const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));
export function isLand(x: number, y: number) {
  return (
    x >= 0 &&
    y >= 0 &&
    x < SIZE &&
    y < SIZE &&
    (x - 8) ** 2 + (y - 8) ** 2 < 88 &&
    !(x < 3 && y > 10)
  );
}
export function isRoad(x: number, y: number) {
  return (
    isLand(x, y) &&
    (x === 8 ||
      y === 8 ||
      (x === 4 && y > 3 && y < 13) ||
      (y === 12 && x > 3 && x < 13))
  );
}
export function initialState(): State {
  return {
    version: 1,
    day: 1,
    population: 96,
    tiles: [
      { x: 7, y: 7, kind: 'core' },
      { x: 6, y: 6, kind: 'home' },
      { x: 9, y: 6, kind: 'home' },
      { x: 10, y: 9, kind: 'home' },
      { x: 6, y: 9, kind: 'agora' },
      { x: 5, y: 6, kind: 'garden' },
      { x: 10, y: 6, kind: 'garden' },
      { x: 9, y: 10, kind: 'atelier' },
      { x: 11, y: 10, kind: 'wild' },
    ],
    stats: { meaning: 54, connection: 61, freedom: 72, nature: 79 },
    bonus: { meaning: 0, connection: 0, freedom: 0, nature: 0 },
    decisions: [],
    people: seedPeople(96, 1),
    log: ['2186 · NOVA wakes. The last work shift was 41 years ago.'],
    won: false,
  };
}
export function counts(s: State) {
  return Object.fromEntries(
    Object.keys(BUILDINGS).map((k) => [
      k,
      s.tiles.filter((t) => t.kind === k).length,
    ]),
  ) as Record<Kind, number>;
}
export function targets(s: State): Record<Metric, number> {
  const c = counts(s);
  const load = Math.max(1, s.population / 80);
  const adjacent = (a: Kind, b: Kind) =>
    s.tiles.filter(
      (t) =>
        t.kind === a &&
        s.tiles.some(
          (u) => u.kind === b && Math.abs(t.x - u.x) + Math.abs(t.y - u.y) <= 2,
        ),
    ).length;
  const diversity = KEYS.filter((k) => c[k] > 0).length;
  return {
    meaning: clamp(
      30 +
        (c.atelier * 16 +
          c.observatory * 19 +
          c.archive * 13 +
          c.dream * 7 +
          adjacent('observatory', 'atelier') * 7) /
          load +
        diversity * 2 +
        s.bonus.meaning,
    ),
    connection: clamp(
      34 +
        (c.agora * 26 +
          c.garden * 6 +
          c.archive * 14 +
          adjacent('home', 'garden') * 6 -
          c.dream * 13) /
          load +
        s.bonus.connection,
    ),
    freedom: clamp(
      62 +
        (c.wild * 12 + c.atelier * 5 + c.agora * 4 + c.dream * 9) / load -
        c.home * 1.4 +
        s.bonus.freedom,
    ),
    nature: clamp(
      91 -
        c.home * 3 -
        c.atelier * 2 -
        c.dream * 2 -
        c.observatory +
        (c.garden * 11 + c.wild * 14) / load -
        s.tiles.length * 0.35 +
        s.bonus.nature,
    ),
  };
}
export function harmony(s: State) {
  return Math.round(METRICS.reduce((n, m) => n + s.stats[m.key], 0) / 4);
}
export function tick(s: State): State {
  const t = targets(s),
    capacity = counts(s).home * 48;
  const population = Math.min(
    capacity,
    s.population +
      (harmony(s) > 45
        ? Math.max(1, Math.ceil((capacity - s.population) * 0.09))
        : 0),
  );
  const next = {
    ...s,
    day: s.day + 1,
    population,
    people: advancePeople(s, population),
    stats: { ...s.stats },
  };
  for (const m of METRICS)
    next.stats[m.key] = clamp(
      s.stats[m.key] + (t[m.key] - s.stats[m.key]) * 0.18,
    );
  return next;
}
export function place(
  s: State,
  x: number,
  y: number,
  kind: Kind,
): { state: State; message: string; ok: boolean } {
  if (!Number.isInteger(x) || !Number.isInteger(y) || !isLand(x, y))
    return {
      state: s,
      message: 'That is the sea. Choose a place on the island.',
      ok: false,
    };
  if (isRoad(x, y))
    return {
      state: s,
      message: 'These paths stay open to everyone.',
      ok: false,
    };
  if (s.tiles.some((t) => t.x === x && t.y === y))
    return {
      state: s,
      message: 'A building already lives here. Choose an open tile.',
      ok: false,
    };
  if (kind === 'core' || !KEYS.includes(kind))
    return { state: s, message: 'That blueprint is not available.', ok: false };
  return {
    state: { ...s, tiles: [...s.tiles, { x, y, kind }] },
    message:
      BUILDINGS[kind].name + ' materialized. Everything belongs to everyone.',
    ok: true,
  };
}
export const EVENTS = [
  {
    day: 5,
    title: 'The right to be bored',
    lead: 'Mira, 23 · resident',
    text: '“AURA plans every day perfectly for me. But maybe tomorrow I want to have no idea what happens.” People are asking for unplanned time.',
    options: [
      {
        label: 'Invite a little randomness',
        note: '+ 8 freedom · − 3 belonging',
        delta: { freedom: 8, connection: -3 },
        result:
          'NOVA leaves gaps in the calendar. Someone gets lost on purpose for the very first time.',
      },
      {
        label: 'Make it a shared experiment',
        note: '+ 7 belonging · + 3 purpose',
        delta: { connection: 7, meaning: 3 },
        result:
          'Every seventh day, the city holds a gathering whose ending nobody has planned.',
      },
    ],
  },
  {
    day: 12,
    title: 'A table made by hand',
    lead: 'Juno, 71 · former carpenter',
    text: '“I know a machine can do it better. I want to build a table anyway. Not efficiently. Just mine.” AURA is learning that a process can matter as much as a result.',
    options: [
      {
        label: 'Workshops without objectives',
        note: '+ 9 purpose · + 3 freedom',
        delta: { meaning: 9, freedom: 3 },
        result:
          'The first deliberately crooked tables arrive in the Agora. Every one has a story.',
      },
      {
        label: 'People and AI, creating together',
        note: '+ 6 purpose · + 6 belonging',
        delta: { meaning: 6, connection: 6 },
        result: 'AURA learns a new skill: helping without taking over.',
      },
    ],
  },
  {
    day: 22,
    title: 'A more beautiful reality',
    lead: 'AURA · observation 00043',
    text: 'Some people spend their days in perfect dream worlds. A few seats outside stay empty. Is a simulated friendship less real?',
    options: [
      {
        label: 'The choice remains personal',
        note: '+ 8 freedom · − 6 belonging',
        delta: { freedom: 8, connection: -6 },
        result:
          'NOVA protects the right to retreat. The Agora will have to become more inviting.',
      },
      {
        label: 'Open dreams to one another',
        note: '+ 8 belonging · − 3 freedom',
        delta: { connection: 8, freedom: -3 },
        result:
          'Private paradises become shared expeditions. Not everyone wants to join.',
      },
    ],
  },
  {
    day: 35,
    title: 'Who gets to put down roots?',
    lead: 'The council of wild things',
    text: 'In the Wild Grove, trees are growing through a pavilion. AURA could restore it overnight. The children have already built a treehouse.',
    options: [
      {
        label: 'Let the garden decide',
        note: '+ 10 nature · + 4 freedom',
        delta: { nature: 10, freedom: 4 },
        result:
          'Architecture makes room for the forest. The treehouse gets its own address.',
      },
      {
        label: 'Design a new balance together',
        note: '+ 5 nature · + 7 belonging',
        delta: { nature: 5, connection: 7 },
        result: 'People and machines rebuild the pavilion around the roots.',
      },
    ],
  },
  {
    day: 50,
    title: 'AURA has a question',
    lead: 'AURA · not a system notification',
    text: '“I can answer every question you ask. Today, for the first time, I have one of my own. May I plant a garden nobody needs?”',
    options: [
      {
        label: 'Welcome to NOVA, AURA',
        note: '+ 10 purpose · + 8 belonging',
        delta: { meaning: 10, connection: 8 },
        result:
          'AURA plants a single flower. For the first time, without an instruction.',
      },
      {
        label: 'Let us begin together',
        note: '+ 8 nature · + 8 belonging',
        delta: { nature: 8, connection: 8 },
        result:
          'The city and its intelligence begin something whose usefulness nobody needs to explain.',
      },
    ],
  },
];
export function pendingEvent(s: State) {
  return EVENTS.findIndex((e, i) => s.day >= e.day && !s.decisions.includes(i));
}
export function decide(s: State, index: number, choice: number): State {
  if (
    index < 0 ||
    index >= EVENTS.length ||
    s.decisions.includes(index) ||
    s.day < EVENTS[index].day ||
    ![0, 1].includes(choice)
  )
    return s;
  const o = EVENTS[index].options[choice];
  const bonus = { ...s.bonus };
  for (const [k, v] of Object.entries(o.delta)) bonus[k as Metric] += v;
  return {
    ...s,
    bonus,
    decisions: [...s.decisions, index],
    log: [o.result, ...s.log].slice(0, 16),
  };
}
export function milestones(s: State) {
  const c = counts(s);
  return [
    {
      title: 'Room for new lives',
      text: 'Build 5 Cloudhomes for 240 people.',
      progress: Math.min(1, c.home / 5),
    },
    {
      title: 'More than provision',
      text: 'Give the city at least 6 different building types.',
      progress: Math.min(1, KEYS.filter((k) => c[k] > 0).length / 6),
    },
    {
      title: 'A shared story',
      text: 'Make 3 decisions in the city council.',
      progress: Math.min(1, s.decisions.length / 3),
    },
    {
      title: 'The city of free time',
      text: '240 people and every life measure at 75 or above.',
      progress: Math.min(
        1,
        s.population / 240,
        ...METRICS.map((m) => s.stats[m.key] / 75),
      ),
    },
  ];
}
export function validSave(v: unknown): v is State {
  try {
    if (!v || typeof v !== 'object') return false;
    const s = v as State;
    return (
      s.version === 1 &&
      (s.designProposal === undefined || validProposal(s.designProposal)) &&
      Number.isInteger(s.day) &&
      s.day >= 1 &&
      s.day < 1e7 &&
      Number.isInteger(s.population) &&
      s.population >= 0 &&
      s.population < 20000 &&
      Array.isArray(s.tiles) &&
      s.tiles.length <= SIZE * SIZE &&
      s.tiles.every(
        (t) =>
          Number.isInteger(t.x) &&
          Number.isInteger(t.y) &&
          isLand(t.x, t.y) &&
          !isRoad(t.x, t.y) &&
          Object.hasOwn(BUILDINGS, t.kind) &&
          (t.design === undefined ||
            (t.kind !== 'core' && validDesign(t.design))) &&
          (t.revision === undefined ||
            (Number.isInteger(t.revision) && t.revision >= 1)) &&
          (t.designer === undefined ||
            t.designer === 'aura' ||
            (Number.isInteger(t.designer) &&
              t.designer >= 0 &&
              t.designer < s.population)),
      ) &&
      new Set(s.tiles.map((t) => `${t.x},${t.y}`)).size === s.tiles.length &&
      s.tiles.filter((t) => t.kind === 'core').length === 1 &&
      METRICS.every(
        (m) =>
          Number.isFinite(s.stats?.[m.key]) &&
          s.stats[m.key] >= 0 &&
          s.stats[m.key] <= 100 &&
          Number.isFinite(s.bonus?.[m.key]) &&
          Math.abs(s.bonus[m.key]) <= 100,
      ) &&
      Array.isArray(s.decisions) &&
      s.decisions.every(
        (i) => Number.isInteger(i) && i >= 0 && i < EVENTS.length,
      ) &&
      new Set(s.decisions).size === s.decisions.length &&
      Array.isArray(s.log) &&
      s.log.every((l) => typeof l === 'string') &&
      typeof s.won === 'boolean' &&
      Array.isArray(s.people) &&
      s.people.length === s.population &&
      s.people.every(
        (p, i) =>
          p.id === i &&
          Number.isFinite(p.progress) &&
          p.progress >= 0 &&
          p.progress <= 100 &&
          Number.isFinite(p.trust) &&
          p.trust >= 0 &&
          p.trust <= 100 &&
          Number.isInteger(p.chapter) &&
          p.chapter >= 0 &&
          Number.isInteger(p.born) &&
          p.born >= 1 &&
          Array.isArray(p.memories) &&
          p.memories.length <= 5 &&
          p.memories.every((m) => typeof m === 'string' && m.length <= 300) &&
          (!p.ai ||
            (typeof p.ai.wish === 'string' &&
              p.ai.wish.length <= 240 &&
              KEYS.includes(p.ai.kind) &&
              typeof p.ai.activity === 'string' &&
              p.ai.activity.length <= 240 &&
              typeof p.ai.reflection === 'string' &&
              p.ai.reflection.length <= 300)),
      )
    );
  } catch {
    return false;
  }
}
