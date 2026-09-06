import {
  validDesignRequest,
  validProposal,
  type DesignRequest,
  type DesignProposal,
} from './design-contract';
import { place, type State, type Tile } from './simulation';
import { autoBuild } from './conversation';
export function proposeDesign(
  s: State,
  request: DesignRequest,
  author: DesignProposal['author'],
) {
  if (!validDesignRequest(request))
    return {
      state: s,
      error: 'That design needs a simpler shape before it can be previewed.',
    };
  const target =
    request.target &&
    s.tiles.find((t) => t.x === request.target!.x && t.y === request.target!.y);
  if (target?.kind === 'core')
    return {
      state: s,
      error: 'The AURA core cannot be redesigned. Choose another place.',
    };
  if (target && target.kind !== request.kind)
    return {
      state: s,
      error:
        'A redesign must keep this place’s purpose. Create a new place for a different purpose.',
    };
  return {
    state: {
      ...s,
      designProposal: {
        ...request,
        author,
        base: target ? JSON.stringify(target) : null,
      },
    },
    error: '',
  };
}
export function buildDesign(s: State): {
  state: State;
  text: string;
  tile: Tile | null;
} {
  const p = s.designProposal;
  const fail = (text: string) => ({ state: s, text, tile: null });
  if (!p || !validProposal(p))
    return fail(
      'There is no design waiting to be built. Describe a place to AURA first.',
    );
  let next = s;
  let target: Tile | undefined;
  if (p.target) {
    target = s.tiles.find((t) => t.x === p.target!.x && t.y === p.target!.y);
    if ((target ? JSON.stringify(target) : null) !== p.base)
      return fail(
        'This place changed since the preview. Ask for a fresh design before building.',
      );
    if (target?.kind === 'core' || (target && target.kind !== p.kind))
      return fail('This design cannot replace that place.');
    if (!target) {
      const placed = place(s, p.target.x, p.target.y, p.kind);
      if (!placed.ok)
        return fail(
          'That location is not available. Select open land and request a new design.',
        );
      next = placed.state;
      target = next.tiles.find(
        (t) => t.x === p.target!.x && t.y === p.target!.y,
      );
    }
  } else {
    const built = autoBuild(s, p.kind, 1, p.near || undefined);
    if (!built.built)
      return fail(
        'There is no open land for this design. Free a tile and try again.',
      );
    next = built.state;
    target = next.tiles.at(-1);
  }
  if (!target) return fail('The place could not be found.');
  const tile = {
    ...target,
    design: p.blueprint,
    revision: (target.revision || 0) + 1,
    designer: p.author,
  };
  next = {
    ...next,
    tiles: next.tiles.map((t) => (t.x === tile.x && t.y === tile.y ? tile : t)),
    designProposal: undefined,
  };
  return {
    state: next,
    tile,
    text: `${p.blueprint.name} ${p.base ? 'has been reshaped' : 'is now part of NOVA'}. ${p.blueprint.description}`,
  };
}
// Route descriptive building commands to AI rather than losing their adjectives
// in the older fixed-catalog parser. Simple “build two homes” stays local.
export function designIntent(text: string) {
  return (
    /\b(design|redesign|reshape|remodel|recolour|recolor|repaint|architecture|blueprint|pavilion|sculpture|terrac\w*|dome\w*|spiral\w*|curv\w*|round\w*|circular|triangular|hexagon\w*|cylinder\w*|tall\w*|shorter|lower|wider|narrower|roof\w*|glass|wood\w*|gold\w*|pink|purple|blue|red|white|orange|turquoise|floor\w*|storey\w*|story|stories|shape\w*)\b/i.test(
      text,
    ) ||
    /\b(build|create|plant|make)\b.*\b(with|featuring|inspired|shaped|style|like)\b/i.test(
      text,
    ) ||
    /\b(make|change|modify|alter|turn|add)\b.*\b(this|that|it|selected|building|place)\b/i.test(
      text,
    )
  );
}
