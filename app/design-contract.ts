import { validDesign, type Design } from './design';
import type { Kind } from './simulation';
export const PURPOSES: Kind[] = [
  'home',
  'garden',
  'agora',
  'atelier',
  'observatory',
  'wild',
  'dream',
  'archive',
];
export type DesignRequest = {
  blueprint: Design;
  kind: Kind;
  near: Kind | null;
  target: { x: number; y: number } | null;
};
export type DesignProposal = DesignRequest & {
  author: number | 'aura';
  base: string | null;
};
export function validDesignRequest(v: unknown): v is DesignRequest {
  if (!v || typeof v !== 'object') return false;
  const d = v as DesignRequest;
  return (
    validDesign(d.blueprint) &&
    PURPOSES.includes(d.kind) &&
    (d.near === null || PURPOSES.includes(d.near)) &&
    (d.target === null ||
      (!!d.target &&
        Number.isInteger(d.target.x) &&
        Number.isInteger(d.target.y) &&
        d.target.x >= 0 &&
        d.target.x < 17 &&
        d.target.y >= 0 &&
        d.target.y < 17))
  );
}
export function validProposal(v: unknown): v is DesignProposal {
  if (!validDesignRequest(v)) return false;
  const p = v as DesignProposal;
  return (
    (p.author === 'aura' ||
      (Number.isInteger(p.author) && p.author >= 0 && p.author < 20000)) &&
    (p.base === null || (typeof p.base === 'string' && p.base.length <= 10000))
  );
}
