import type { AIPlan } from './ai-contract';
import type { Kind, State } from './simulation';
export type Person = {
  ai?: AIPlan;
  id: number;
  born: number;
  progress: number;
  chapter: number;
  trust: number;
  memories: string[];
};
export type Profile = {
  name: string;
  age: number;
  trait: string;
  color: string;
  initials: string;
  wish: string;
  why: string;
  fear: string;
  belief: string;
  kind: Kind;
  activity: string;
  finished: string;
};
const featured: Profile[] = [
  {
    name: 'Mira Chen',
    age: 23,
    trait: 'Curious · quietly rebellious',
    color: '#efbe8e',
    initials: 'MC',
    wish: 'Compose a song from sounds nobody has named',
    why: 'AURA can compose anything. I want to discover a sound before I know what it means.',
    fear: 'That being understood perfectly might leave no room to surprise myself.',
    belief:
      'A good life needs a little uncertainty. I am grateful for abundance; I just want to choose my own questions.',
    kind: 'atelier',
    activity: 'recording the sounds between conversations',
    finished:
      'My song is finished. Juno said the silence was his favorite part. I think that is a compliment.',
  },
  {
    name: 'Juno Okafor',
    age: 71,
    trait: 'Patient · maker of imperfect things',
    color: '#c7bce8',
    initials: 'JO',
    wish: 'Build a crooked table with someone who has never made one',
    why: 'I remember working because I had to. Now I get to discover which parts I actually loved.',
    fear: 'People confusing freedom from work with freedom from caring about anything.',
    belief:
      'Making something is not the same as having to earn your right to exist. No one owes the city productivity.',
    kind: 'atelier',
    activity: 'teaching a friend to follow the grain of wood',
    finished:
      'The table wobbles. Six people ate at it anyway. I have never been prouder of a piece of furniture.',
  },
  {
    name: 'Sol Rivera',
    age: 34,
    trait: 'Warm · collector of strangers’ stories',
    color: '#f0cc82',
    initials: 'SR',
    wish: 'Host a dinner where nobody knows everyone',
    why: 'We have enough of everything except those little accidents that turn strangers into friends.',
    fear: 'A city full of people who are comfortable but quietly lonely.',
    belief:
      'Belonging must be an invitation, never an obligation. An empty chair can mean loneliness or a wonderful day alone.',
    kind: 'agora',
    activity: 'leaving handwritten invitations at the Agora',
    finished:
      'Twelve people came. One stayed silent all evening, then asked when the next dinner would be.',
  },
  {
    name: 'Inez Sato',
    age: 42,
    trait: 'Reflective · explorer of inner worlds',
    color: '#e4acd2',
    initials: 'IS',
    wish: 'Create a dream ocean and invite a friend inside',
    why: 'A simulated place can hold a real conversation. I want to build a world that helps us understand each other.',
    fear: 'That people will decide which experiences count as real before listening to mine.',
    belief:
      'The feelings are real even when the ocean is not. Still, I want a way back, and people who notice when I return.',
    kind: 'dream',
    activity: 'sketching a coastline that changes with your mood',
    finished:
      'Sol visited my ocean. We disagreed about the sunset, which made it feel more real.',
  },
  {
    name: 'Theo Amari',
    age: 19,
    trait: 'Playful · defender of wild things',
    color: '#9fcca4',
    initials: 'TA',
    wish: 'Grow a garden even AURA cannot predict',
    why: 'Every seed is a small answer to the idea that everything has already been solved.',
    fear: 'That we will make the entire planet tidy and forget how to be guests in it.',
    belief:
      'Nature is not a service for humans. Sometimes the kindest design decision is to step back.',
    kind: 'wild',
    activity: 'mapping the unofficial paths made by beetles',
    finished: 'A flower appeared that nobody planted. I named it Permission.',
  },
  {
    name: 'Ada Nwosu',
    age: 58,
    trait: 'Thoughtful · asks the next question',
    color: '#a6cbe7',
    initials: 'AN',
    wish: 'Discover something that changes a question, not just an answer',
    why: 'The universe is still bigger than our ability to explain it. That feels like a promise.',
    fear: 'A world where knowing the answer is valued more than learning how to wonder.',
    belief:
      'Intelligence is not only solving problems. It is deciding which questions deserve care, and knowing when not to optimize.',
    kind: 'observatory',
    activity: 'listening to the ancient light of distant stars',
    finished:
      'We found a pattern AURA had filtered out as noise. It might be nothing. We are all wonderfully excited.',
  },
];
const first = [
  'Amal',
  'Robin',
  'Kai',
  'Nia',
  'Luca',
  'Zara',
  'Eli',
  'Sana',
  'Rowan',
  'Leila',
  'Noor',
  'Ash',
  'Eden',
  'Paz',
  'Remy',
  'Ari',
  'Yara',
  'Finn',
  'Lumi',
  'Sam',
];
const last = [
  'Park',
  'Mensah',
  'Silva',
  'Kim',
  'Patel',
  'Bennett',
  'Alvarez',
  'Singh',
  'Ibrahim',
  'Dubois',
  'Novak',
  'Okeke',
  'Santos',
  'Ali',
  'Costa',
  'Ito',
  'Reed',
  'Aziz',
  'Lind',
  'Wu',
];
const pursuits = [
  {
    kind: 'garden' as Kind,
    wish: 'plant a living library of forgotten flavors',
    why: 'Food is abundant, but discovering a taste with a friend is still a tiny adventure.',
    activity: 'exchanging seeds and stories in the garden',
  },
  {
    kind: 'archive' as Kind,
    wish: 'record the ordinary stories of the last working generation',
    why: 'Nobody should have to suffer for us to remember what freedom means.',
    activity: 'listening to a neighbor’s memories',
  },
  {
    kind: 'atelier' as Kind,
    wish: 'make an instrument that responds to laughter',
    why: 'Useful is a small word for everything a human can make.',
    activity: 'trying another beautifully unlikely design',
  },
  {
    kind: 'agora' as Kind,
    wish: 'start a club for people who do not like clubs',
    why: 'There should be a gentle way to belong without having to perform being social.',
    activity: 'sharing an unhurried afternoon with a new friend',
  },
  {
    kind: 'observatory' as Kind,
    wish: 'write a bedtime story for a planet we have not found',
    why: 'Looking at the stars makes the future feel open again.',
    activity: 'tracing constellations with a neighbor',
  },
  {
    kind: 'wild' as Kind,
    wish: 'learn the island by following its smallest creatures',
    why: 'An unplanned world can still be a caring world.',
    activity: 'following an unfamiliar trail through the grove',
  },
  {
    kind: 'dream' as Kind,
    wish: 'build a dream where people can exchange perspectives',
    why: 'Perhaps we can disagree more kindly after seeing through each other’s eyes.',
    activity: 'designing a dream with room for unexpected guests',
  },
];
export function profile(id: number): Profile {
  if (id < featured.length) return featured[id];
  const p = pursuits[id % pursuits.length],
    name =
      first[id % 20] +
      ' ' +
      last[Math.floor(id / 20) % 20] +
      (id >= 400
        ? '–' +
          last[(Math.floor(id / 400) - 1) % 20] +
          (id >= 8400 ? '–' + last[Math.floor(id / 8000) % 20] : '')
        : '');
  return {
    name,
    age: 18 + ((id * 17) % 75),
    trait: [
      'Thoughtful · independently curious',
      'Warm · attentive to small things',
      'Playful · willing to change their mind',
      'Reflective · comfortable with uncertainty',
    ][id % 4],
    color: ['#c5bbdf', '#a7ceaf', '#e7bb9b', '#a6cbe7'][id % 4],
    initials: name
      .split(' ')
      .map((s) => s[0])
      .join(''),
    ...p,
    wish:
      p.wish + (id >= 400 ? ' — chapter ' + (Math.floor(id / 400) + 1) : ''),
    fear: [
      'That comfort might make us stop listening to one another.',
      'That everyone will expect me to be happy in the same way.',
      'That a perfect answer might keep us from asking a better question.',
    ][id % 3],
    belief: [
      'We can be grateful for abundance and still ask for a more thoughtful way of living.',
      'Freedom includes changing your mind. A dream is a direction, not a contract.',
      'Nobody owes the world a masterpiece. Sometimes a good conversation is enough.',
    ][id % 3],
    finished:
      'It happened. And the best part was someone bringing an idea I had never considered.',
  };
}
export function seedPeople(n: number, day: number): Person[] {
  return Array.from({ length: n }, (_, id) => ({
    id,
    born: day,
    progress: 0,
    chapter: 0,
    trust: 30,
    memories: [],
  }));
}
export function advancePeople(s: State, population: number): Person[] {
  const available = new Set(s.tiles.map((t) => t.kind));
  const next = s.people.map((p) => {
    const pr = {
      ...profile(p.id),
      ...(p.ai
        ? { kind: p.ai.kind, wish: p.ai.wish, activity: p.ai.activity }
        : {}),
    };
    const conducive = available.has(pr.kind) && s.stats.freedom >= 40;
    return {
      ...p,
      progress: Math.min(
        100,
        p.progress + (conducive ? 1.2 + (p.id % 5) * 0.2 + p.trust / 100 : 0),
      ),
    };
  });
  for (let id = next.length; id < population; id++)
    next.push({
      id,
      born: s.day + 1,
      progress: 0,
      chapter: 0,
      trust: 30,
      memories: [],
    });
  return next;
}
export function feeling(s: State, p: Person) {
  const pr = {
    ...profile(p.id),
    ...(p.ai
      ? { kind: p.ai.kind, wish: p.ai.wish, activity: p.ai.activity }
      : {}),
  };
  if (p.progress >= 100) return 'Fulfilled, and wondering what comes next';
  if (!s.tiles.some((t) => t.kind === pr.kind))
    return 'Hopeful, looking for a place to begin';
  if (s.stats.connection < 45 && p.id % 3 === 0)
    return 'A little lonely, open to an invitation';
  if (s.stats.freedom < 45) return 'Wishing for more room to choose';
  return [
    'Quietly happy',
    'Inspired by an unfinished idea',
    'Curious about tomorrow',
    'Enjoying a slower day',
  ][Math.floor(s.day / 3 + p.id) % 4];
}
export function activity(s: State, p: Person) {
  const pr = {
    ...profile(p.id),
    ...(p.ai
      ? { kind: p.ai.kind, wish: p.ai.wish, activity: p.ai.activity }
      : {}),
  };
  if (p.progress >= 100)
    return 'sharing a finished dream, then taking a well-earned pause';
  if (!s.tiles.some((t) => t.kind === pr.kind))
    return 'wandering the island, imagining a place for a new project';
  if ((s.day + p.id) % 7 === 0) return 'doing absolutely nothing, by choice';
  return pr.activity;
}
export function remember(s: State, id: number, memory: string): State {
  return {
    ...s,
    people: s.people.map((p) =>
      p.id === id
        ? {
            ...p,
            trust: Math.min(100, p.trust + 5),
            memories: [memory, ...p.memories].slice(0, 5),
          }
        : p,
    ),
  };
}
