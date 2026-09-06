import { proposeDesign } from './design-actions';
import { validAIReply, type AIReply } from './ai-contract';
import { autoBuild, type Speaker } from './conversation';
import type { State } from './simulation';
import { BUILDINGS } from './simulation';
export function applyAIReply(s: State, speaker: Speaker, reply: AIReply) {
  if (!validAIReply(reply)) throw new Error('Invalid AI reply');
  let next = s;
  let count = 0;
  const changes: string[] = [];
  if (speaker === 'aura' && !reply.design) {
    for (const b of reply.builds) {
      const built = autoBuild(next, b.kind, b.count, b.near || undefined);
      next = built.state;
      count += built.built;
      changes.push(
        built.built + ' / ' + b.count + ' ' + BUILDINGS[b.kind].name,
      );
    }
  } else if (speaker !== 'aura') {
    next = {
      ...s,
      people: s.people.map((p) => {
        if (p.id !== speaker) return p;
        const memory = reply.memory ? 'Day ' + s.day + ': ' + reply.memory : '';
        const changed = reply.plan && reply.plan.wish !== p.ai?.wish;
        return {
          ...p,
          trust: Math.min(100, p.trust + 4),
          memories: memory ? [memory, ...p.memories].slice(0, 5) : p.memories,
          ...(reply.plan
            ? {
                ai: reply.plan,
                progress: changed ? 0 : p.progress,
                chapter: p.chapter + (changed ? 1 : 0),
              }
            : {}),
        };
      }),
    };
  }
  if (reply.design) {
    const proposal = proposeDesign(next, reply.design, speaker);
    next = proposal.state;
    changes.push(
      proposal.error ||
        'Design ready to preview. Say “Build this design” to bring it to life, or describe a change.',
    );
  }
  return {
    state: next,
    built: count,
    text:
      reply.reply +
      (changes.length
        ? ' ' + changes.join('; ').replace(/[.]+$/, '') + '.'
        : ''),
  };
}
