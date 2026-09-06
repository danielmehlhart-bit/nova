import type { Kind, State, Tile } from './simulation';
import { profile } from './citizens';

export type Phase =
  | 'invitation'
  | 'choose'
  | 'place'
  | 'neighbor'
  | 'ready'
  | 'celebration';
export type Journey = {
  chapter: number;
  phase: Phase;
  freePlay: boolean;
  path?: 0 | 1;
  agreement?: 0 | 1;
  venue?: { x: number; y: number; kind: Kind };
};
export type Moment = {
  id: string;
  day: number;
  person: number;
  title: string;
  text: string;
  venue?: { x: number; y: number; kind: Kind };
};
export type JourneyAction =
  | 'begin'
  | 'path-0'
  | 'path-1'
  | 'use'
  | 'agreement-0'
  | 'agreement-1'
  | 'host'
  | 'next'
  | 'explore';
export const CHAPTERS = [
  {
    person: 0,
    title: 'The first shared evening',
    keepsake: 'A song with room for silence',
    invitation:
      '“I have a little unfinished song. I could keep polishing it forever… or play it for a few neighbors. Will you help me make a place for a first listening?”',
    paths: [
      {
        kind: 'agora' as Kind,
        name: 'An open stage',
        description:
          'A lively little gathering. Strangers can drift in and add a sound.',
      },
      {
        kind: 'garden' as Kind,
        name: 'A listening garden',
        description:
          'A smaller circle, with leaves and pauses becoming part of the music.',
      },
    ],
    neighbor:
      'Juno wants to come, but some neighbors enjoy quiet evenings. “Can I hear Mira without making everyone else listen?”',
    agreements: ['Meet before sunset', 'Make room for quiet listeners'],
    consequences: [
      'The gathering ends early. The evening afterwards belongs to everyone again.',
      'The group leaves pauses between sounds. Joining in and sitting quietly are equally welcome.',
    ],
    outcomes: [
      'Mira plays her unfinished melody before sunset. Juno taps a crooked rhythm; Sol brings someone who almost stayed home.',
      'Mira leaves a space in her melody. Someone answers with a leaf, someone with a laugh. Juno listens without saying a word.',
    ],
    thanks:
      '“You didn’t finish the song for me. You made it possible to share it.” — Mira',
    next: 'Juno has an idea for what those neighbors could make together.',
  },
  {
    person: 1,
    title: 'Perfectly imperfect',
    keepsake: 'The table that wobbles',
    invitation:
      '“A machine could make a perfect table. I want to make a crooked one with someone who has never tried. Could we leave a place for that?”',
    paths: [
      {
        kind: 'atelier' as Kind,
        name: 'A welcoming workshop',
        description:
          'A place to try, get it wrong and try again, with tools close at hand.',
      },
      {
        kind: 'agora' as Kind,
        name: 'A table in the commons',
        description:
          'Make it where people meet. Passersby can lend a hand or just watch.',
      },
    ],
    neighbor:
      'A first-time maker asks AURA to steady the wood. Another wants to discover each step unaided. Juno asks how to welcome both.',
    agreements: ['Offer help when asked', 'Set aside a time to try unaided'],
    consequences: [
      'AURA waits to be invited. Each maker chooses how much help feels right.',
      'The session begins with an unhurried attempt by hand; help remains available afterwards.',
    ],
    outcomes: [
      'One person holds the wood, another invites AURA to guide a tool. Their table wobbles. Six neighbors eat at it anyway.',
      'The first joint comes apart. The second holds. Six neighbors sit around an imperfect table and remember how it was made.',
    ],
    thanks:
      '“Nobody needed this table. That is why making it meant so much.” — Juno',
    next: 'Ada wonders what this new circle of neighbors might discover together.',
  },
  {
    person: 5,
    title: 'A question worth keeping',
    keepsake: 'Our unfinished sky map',
    invitation:
      '“AURA can name every star we can see. I want a night where we choose our own questions. Could we invite people to look up together?”',
    paths: [
      {
        kind: 'observatory' as Kind,
        name: 'A shared sky watch',
        description: 'Let a telescope bring a distant world into reach.',
      },
      {
        kind: 'wild' as Kind,
        name: 'A clearing under the stars',
        description:
          'Start with your eyes, a patch of darkness and somebody else’s question.',
      },
    ],
    neighbor:
      'One visitor loves instant explanations. Another worries that answers will arrive before their questions. Ada wants both to feel welcome.',
    agreements: [
      'Begin with everyone’s questions',
      'Let AURA offer optional clues',
    ],
    consequences: [
      'The group collects questions before choosing which ones to explore.',
      'Clues are offered to anyone who wants them. Wonder needs no permission or test.',
    ],
    outcomes: [
      'Ada writes down a question nobody expected. The group leaves a blank space on its sky map for the next visitor.',
      'AURA offers one clue. Three people take it in three different directions. Ada keeps all three paths on the map.',
    ],
    thanks:
      '“We came home with more questions. I count that as a very good night.” — Ada',
    next: 'Your city now has a song, a table and a shared question. Other residents are still imagining their first step.',
  },
];
export const journeyOf = (s: State): Journey =>
  s.journey || { chapter: 0, phase: 'invitation', freePlay: false };
export const chapterOf = (s: State) => CHAPTERS[journeyOf(s).chapter];
export const pathOf = (s: State) => chapterOf(s)?.paths[journeyOf(s).path ?? 0];
export const venueExists = (s: State) => {
  const v = journeyOf(s).venue;
  return (
    v && s.tiles.some((t) => t.x === v.x && t.y === v.y && t.kind === v.kind)
  );
};
const addMoments = (s: State, entries: Moment[]) => {
  const old = s.moments || [];
  return [
    ...entries.filter((m) => !old.some((o) => o.id === m.id)),
    ...old,
  ].slice(0, 48);
};
export function reconcileJourney(previous: State, next: State): State {
  const j = journeyOf(next);
  if (!CHAPTERS[j.chapter]) return next;
  if (j.venue && !venueExists(next) && j.phase !== 'celebration')
    return {
      ...next,
      journey: { ...j, phase: 'place', venue: undefined, agreement: undefined },
    };
  if (j.phase !== 'place') return next;
  const added = next.tiles.find(
    (t) =>
      t.kind === pathOf(next)?.kind &&
      !previous.tiles.some((o) => o.x === t.x && o.y === t.y),
  );
  return added
    ? {
        ...next,
        journey: {
          ...j,
          phase: 'neighbor',
          venue: { x: added.x, y: added.y, kind: added.kind },
        },
      }
    : next;
}
export function journeyAction(
  s: State,
  action: JourneyAction,
  selected?: Tile,
): State {
  const j = journeyOf(s),
    c = chapterOf(s);
  const set = (changes: Partial<Journey>) => ({
    ...s,
    journey: { ...j, ...changes },
  });
  if (action === 'explore') return set({ freePlay: true });
  if (!c) return s;
  if (action === 'begin' && j.phase === 'invitation')
    return set({ phase: 'choose' });
  if ((action === 'path-0' || action === 'path-1') && j.phase === 'choose')
    return set({ path: action === 'path-0' ? 0 : 1, phase: 'place' });
  if (action === 'use' && j.phase === 'place') {
    const tile =
      selected?.kind === pathOf(s)?.kind
        ? selected
        : s.tiles.find((t) => t.kind === pathOf(s)?.kind);
    if (
      !tile ||
      !s.tiles.some(
        (t) => t.x === tile.x && t.y === tile.y && t.kind === tile.kind,
      )
    )
      return s;
    return set({
      phase: 'neighbor',
      venue: { x: tile.x, y: tile.y, kind: tile.kind },
    });
  }
  if (
    (action === 'agreement-0' || action === 'agreement-1') &&
    j.phase === 'neighbor' &&
    venueExists(s)
  )
    return set({ agreement: action === 'agreement-0' ? 0 : 1, phase: 'ready' });
  if (action === 'host' && j.phase === 'ready' && venueExists(s)) {
    const text = c.outcomes[j.agreement ?? 0];
    const moment: Moment = {
      id: 'gathering-' + j.chapter,
      day: s.day,
      person: c.person,
      title: c.keepsake,
      text: text + ' ' + c.consequences[j.agreement ?? 0],
      venue: j.venue,
    };
    return {
      ...set({ phase: 'celebration' }),
      moments: addMoments(s, [moment]),
      people: s.people.map((p) =>
        p.id === c.person
          ? {
              ...p,
              trust: Math.min(100, p.trust + 8),
              memories: [
                `The mayor helped host ${c.title.toLowerCase()}. ${c.consequences[j.agreement ?? 0]}`,
                ...p.memories,
              ].slice(0, 5),
            }
          : p,
      ),
      log: [c.keepsake + ': ' + text, ...s.log].slice(0, 16),
    };
  }
  if (action === 'next' && j.phase === 'celebration')
    return {
      ...s,
      journey: {
        chapter: j.chapter + 1,
        phase: 'invitation',
        freePlay: j.freePlay,
      },
    };
  return s;
}
export function dreamMoments(previous: State, next: State): State {
  const entries = next.people
    .filter((p) => p.progress >= 100 && previous.people[p.id]?.progress < 100)
    .map((p) => ({
      id: `dream-${p.id}-${p.chapter}`,
      day: next.day,
      person: p.id,
      title: profile(p.id).name.split(' ')[0] + ' realized a dream',
      text: p.ai
        ? `${profile(p.id).name} completed a personal project: ${p.ai.wish}. There is room to pause before choosing another.`
        : profile(p.id).finished,
    }));
  return entries.length
    ? { ...next, moments: addMoments(next, entries) }
    : next;
}
export function journeyPrompt(s: State) {
  const j = journeyOf(s),
    c = chapterOf(s);
  if (!c)
    return {
      title: 'A city of unfinished dreams',
      text: 'Three shared memories. Who could use a place to begin next?',
      action: 'Meet your people',
      step: 'YOUR NEXT CHAPTER',
    };
  return {
    invitation: {
      title: c.title,
      text: `${profile(c.person).name.split(' ')[0]} has an invitation for you.`,
      action: j.chapter === 0 ? 'Meet Mira' : 'Hear the invitation',
      step: `CHAPTER ${j.chapter + 1} · 1 / 5`,
    },
    choose: {
      title: 'What kind of place?',
      text: 'Choose the atmosphere you want to make possible.',
      action: 'Choose a place',
      step: `CHAPTER ${j.chapter + 1} · 2 / 5`,
    },
    place: {
      title: `Make room for ${profile(c.person).name.split(' ')[0]}`,
      text: 'Build your chosen place, or give an existing one a new occasion.',
      action: 'Choose where',
      step: `CHAPTER ${j.chapter + 1} · 2 / 5`,
    },
    neighbor: {
      title: 'Another voice matters',
      text: 'Your place is ready. Hear a neighbor before you invite everyone.',
      action: 'Hear the neighbor',
      step: `CHAPTER ${j.chapter + 1} · 3 / 5`,
    },
    ready: {
      title: 'Time to bring it to life',
      text: 'The place and invitation are ready. You decide when to begin.',
      action: 'Host the gathering',
      step: `CHAPTER ${j.chapter + 1} · 4 / 5`,
    },
    celebration: {
      title: c.keepsake,
      text: 'A real shared moment, remembered by your city.',
      action: 'Enjoy this moment',
      step: `CHAPTER ${j.chapter + 1} · 5 / 5`,
    },
  }[j.phase];
}
export function journeyCommand(
  s: State,
  raw: string,
): JourneyAction | 'open' | 'memories' | 'build' | null {
  const text = raw.toLowerCase().replace(/[.!?]/g, '').trim();
  const j = journeyOf(s),
    c = chapterOf(s);
  if (
    /^(what should i do( next| first)?|what is my (role|goal)|am i the mayor|show (my )?(next step|invitation)|open (the )?invitation)$/.test(
      text,
    )
  )
    return 'open';
  if (/^(show|open)( my| our| the)? (memories|moments)$/.test(text))
    return 'memories';
  if (/^(explore freely|free play)$/.test(text)) return 'explore';
  if (!c) return null;
  if (
    j.phase === 'invitation' &&
    /^(start (the )?(story|chapter|invitation)|accept (the )?invitation|meet mira)$/.test(
      text,
    )
  )
    return 'begin';
  if (j.phase === 'choose') {
    const n = c.paths.findIndex(
      (p) =>
        text === p.name.toLowerCase() ||
        text === 'choose ' + p.name.toLowerCase(),
    );
    if (n >= 0) return n ? 'path-1' : 'path-0';
  }
  if (
    j.phase === 'place' &&
    /^(use (an |the )?existing (place|building)|use this place)$/.test(text)
  )
    return 'use';
  if (
    j.phase === 'place' &&
    /^(build (the |this |my )?(chosen place|story place)|build it here)$/.test(
      text,
    )
  )
    return 'build';
  if (j.phase === 'neighbor') {
    const n = c.agreements.findIndex(
      (p) => text === p.toLowerCase() || text === 'choose ' + p.toLowerCase(),
    );
    if (n >= 0) return n ? 'agreement-1' : 'agreement-0';
  }
  if (
    j.phase === 'ready' &&
    /^(host|start|begin)( the)? (gathering|concert|listening|workshop|sky watch)$/.test(
      text,
    )
  )
    return 'host';
  if (
    j.phase === 'celebration' &&
    /^(next (chapter|invitation)|continue (the )?story)$/.test(text)
  )
    return 'next';
  return null;
}
export function validJourney(value: unknown): value is Journey {
  if (!value || typeof value !== 'object') return false;
  const j = value as Journey;
  return (
    Number.isInteger(j.chapter) &&
    j.chapter >= 0 &&
    j.chapter <= CHAPTERS.length &&
    [
      'invitation',
      'choose',
      'place',
      'neighbor',
      'ready',
      'celebration',
    ].includes(j.phase) &&
    typeof j.freePlay === 'boolean' &&
    (j.path === undefined || j.path === 0 || j.path === 1) &&
    (j.agreement === undefined || j.agreement === 0 || j.agreement === 1) &&
    (j.venue === undefined || validVenue(j.venue)) &&
    (!['place', 'neighbor', 'ready', 'celebration'].includes(j.phase) ||
      j.path !== undefined) &&
    (!['neighbor', 'ready', 'celebration'].includes(j.phase) || !!j.venue) &&
    (!['ready', 'celebration'].includes(j.phase) || j.agreement !== undefined)
  );
}
function validVenue(v: Journey['venue']) {
  return (
    !!v &&
    Number.isInteger(v.x) &&
    v.x >= 0 &&
    v.x < 17 &&
    Number.isInteger(v.y) &&
    v.y >= 0 &&
    v.y < 17 &&
    CHAPTERS.some((c) => c.paths.some((p) => p.kind === v.kind))
  );
}
export function validMoments(value: unknown): value is Moment[] {
  return (
    Array.isArray(value) &&
    value.length <= 48 &&
    new Set(value.map((m) => m?.id)).size === value.length &&
    value.every(
      (m) =>
        m &&
        typeof m.id === 'string' &&
        m.id.length <= 80 &&
        typeof m.title === 'string' &&
        m.title.length <= 120 &&
        typeof m.text === 'string' &&
        m.text.length <= 800 &&
        Number.isInteger(m.day) &&
        m.day >= 1 &&
        Number.isInteger(m.person) &&
        m.person >= 0 &&
        m.person < 20000 &&
        (m.venue === undefined || validVenue(m.venue)),
    )
  );
}
