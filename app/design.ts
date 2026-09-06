// Declarative geometry only: no renderer or simulation dependencies.
export type DesignPart = {
  x: number;
  y: number;
  width: number;
  depth: number;
  elevation: number;
  height: number;
  sides: number;
  rotation: number;
  taper: number;
  curve: 'straight' | 'dome';
  color: string;
};
export type Design = { name: string; description: string; parts: DesignPart[] };
export type DesignPoint = { x: number; y: number; z: number };
export type DesignFace = {
  points: DesignPoint[];
  color: string;
  shade: number;
};
const finite = (v: unknown, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
export function validDesign(v: unknown): v is Design {
  if (!v || typeof v !== 'object') return false;
  const d = v as Design;
  return (
    typeof d.name === 'string' &&
    d.name.trim().length > 0 &&
    d.name.length <= 70 &&
    typeof d.description === 'string' &&
    d.description.length <= 260 &&
    Array.isArray(d.parts) &&
    d.parts.length >= 1 &&
    d.parts.length <= 12 &&
    d.parts.every(
      (p) =>
        p &&
        finite(p.x, 0.04, 0.96) &&
        finite(p.y, 0.04, 0.96) &&
        finite(p.width, 0.04, 0.9) &&
        finite(p.depth, 0.04, 0.9) &&
        finite(p.elevation, 0, 100) &&
        finite(p.height, 1, 100) &&
        p.elevation + p.height <= 110 &&
        Number.isInteger(p.sides) &&
        p.sides >= 3 &&
        p.sides <= 24 &&
        finite(p.rotation, -180, 180) &&
        finite(p.taper, 0, 1) &&
        ['straight', 'dome'].includes(p.curve) &&
        /^#[0-9a-f]{6}$/i.test(p.color) &&
        ring(p, 0, 1).every(
          (q) => q.x >= 0.01 && q.x <= 0.99 && q.y >= 0.01 && q.y <= 0.99,
        ),
    )
  );
}
function ring(p: DesignPart, z: number, radius: number): DesignPoint[] {
  return Array.from({ length: p.sides }, (_, i) => {
    const a = (i * Math.PI * 2) / p.sides + Math.PI / 4;
    const rotation = (p.rotation * Math.PI) / 180;
    const dx = ((Math.cos(a) * p.width) / 2) * radius;
    const dy = ((Math.sin(a) * p.depth) / 2) * radius;
    return {
      x: p.x + dx * Math.cos(rotation) - dy * Math.sin(rotation),
      y: p.y + dx * Math.sin(rotation) + dy * Math.cos(rotation),
      z: p.elevation + z,
    };
  });
}
const cache = new WeakMap<Design, DesignFace[]>();
export function geometry(d: Design): DesignFace[] {
  const cached = cache.get(d);
  if (cached) return cached;
  const faces: DesignFace[] = [];
  for (const p of d.parts) {
    const steps = p.curve === 'dome' ? 6 : 1;
    for (let s = 0; s < steps; s++) {
      const radius = (f: number) =>
        p.curve === 'dome'
          ? Math.sqrt(Math.max(0, 1 - f * f))
          : 1 + (p.taper - 1) * f;
      const bottom = ring(p, (p.height * s) / steps, radius(s / steps));
      const top = ring(
        p,
        (p.height * (s + 1)) / steps,
        radius((s + 1) / steps),
      );
      for (let i = 0; i < p.sides; i++) {
        const j = (i + 1) % p.sides;
        // Camera sees the positive X/Y sides. Cull the back faces.
        const dx = bottom[j].x - bottom[i].x,
          dy = bottom[j].y - bottom[i].y;
        if (dy - dx > 0)
          faces.push({
            points: [bottom[i], bottom[j], top[j], top[i]],
            color: p.color,
            shade: 0.66 + 0.2 * (dy / Math.max(0.001, Math.hypot(dx, dy))),
          });
      }
      if (s === steps - 1)
        faces.push({ points: top, color: p.color, shade: 1 });
    }
  }
  faces.sort((a, b) => depth(a) - depth(b));
  cache.set(d, faces);
  return faces;
}
function depth(f: DesignFace) {
  return (
    f.points.reduce((n, p) => n + p.x + p.y + p.z / 100, 0) / f.points.length
  );
}
export function shadeColor(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * amount)).join(',')})`;
}
const num = (minimum: number, maximum: number) => ({
  type: 'number',
  minimum,
  maximum,
});
export const designSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'description', 'parts'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    parts: {
      type: 'array',
      minItems: 1,
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'x',
          'y',
          'width',
          'depth',
          'elevation',
          'height',
          'sides',
          'rotation',
          'taper',
          'curve',
          'color',
        ],
        properties: {
          x: num(0.04, 0.96),
          y: num(0.04, 0.96),
          width: num(0.04, 0.9),
          depth: num(0.04, 0.9),
          elevation: num(0, 100),
          height: num(1, 100),
          sides: { type: 'integer', minimum: 3, maximum: 24 },
          rotation: num(-180, 180),
          taper: num(0, 1),
          curve: { type: 'string', enum: ['straight', 'dome'] },
          color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        },
      },
    },
  },
};

export function designIssue(value: unknown) {
  const d = value as Design;
  if (!d || !Array.isArray(d.parts))
    return 'The design is incomplete. Please ask for a simpler version.';
  if (typeof d.name !== 'string' || d.name.length > 70)
    return 'The design name is too long. Try a shorter name.';
  if (typeof d.description !== 'string' || d.description.length > 260)
    return 'The design description is too long. Ask for a shorter description.';
  for (const p of d.parts) {
    if (!p)
      return 'The design has an incomplete part. Ask for a simpler version.';
    if (p.elevation + p.height > 110)
      return 'The design is too tall for this plot. Ask for a lower version.';
    if (!validDesign({ name: 'Part', description: '', parts: [p] }))
      return 'A part extends beyond the plot or has unsupported dimensions. Ask for a more compact design.';
  }
  return 'The design has too many parts. Ask for a simpler version.';
}

// Fit otherwise valid generated parts to their plot before final validation.
// This is deterministic geometry adaptation, not a second paid model request.
export function fitDesign(value: unknown): Design | null {
  const d = value as Design;
  if (
    !d ||
    !Array.isArray(d.parts) ||
    d.parts.length < 1 ||
    d.parts.length > 12
  )
    return null;
  const parts: DesignPart[] = [];
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  for (const raw of d.parts) {
    if (
      !raw ||
      ![
        raw.x,
        raw.y,
        raw.width,
        raw.depth,
        raw.elevation,
        raw.height,
        raw.sides,
        raw.rotation,
        raw.taper,
      ].every((v) => Number.isFinite(v) && Math.abs(v) <= 10000) ||
      !['straight', 'dome'].includes(raw.curve) ||
      typeof raw.color !== 'string'
    )
      return null;
    const hex = raw.color.startsWith('#') ? raw.color : '#' + raw.color;
    const color = /^#[0-9a-f]{3}$/i.test(hex)
      ? '#' +
        hex
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
    if (!/^#[0-9a-f]{6}$/i.test(color)) return null;
    const p: DesignPart = {
      ...raw,
      color,
      x: clamp(raw.x, 0.04, 0.96),
      y: clamp(raw.y, 0.04, 0.96),
      width: clamp(raw.width, 0.04, 0.9),
      depth: clamp(raw.depth, 0.04, 0.9),
      elevation: clamp(raw.elevation, 0, 100),
      height: clamp(raw.height, 1, 100),
      sides: Math.round(clamp(raw.sides, 3, 24)),
      rotation: clamp(raw.rotation, -180, 180),
      taper: clamp(raw.taper, 0, 1),
    };
    const points = ring(p, 0, 1);
    const minX = Math.min(...points.map((q) => q.x)),
      maxX = Math.max(...points.map((q) => q.x));
    const minY = Math.min(...points.map((q) => q.y)),
      maxY = Math.max(...points.map((q) => q.y));
    const scale = Math.min(1, 0.96 / (maxX - minX), 0.96 / (maxY - minY));
    const width = p.width * scale,
      depth = p.depth * scale;
    const halfX = ((maxX - minX) * scale) / 2,
      halfY = ((maxY - minY) * scale) / 2;
    const centerX = p.x + ((maxX + minX) / 2 - p.x) * scale,
      centerY = p.y + ((maxY + minY) / 2 - p.y) * scale;
    const x =
      p.x + Math.max(0.02 + halfX, Math.min(0.98 - halfX, centerX)) - centerX;
    const y =
      p.y + Math.max(0.02 + halfY, Math.min(0.98 - halfY, centerY)) - centerY;
    parts.push({ ...p, x, y, width, depth });
  }
  const high = Math.max(...parts.map((p) => p.elevation + p.height));
  const fitted = {
    ...d,
    parts: parts.map((p) =>
      high > 110
        ? {
            ...p,
            elevation: (p.elevation * 110) / high,
            height: Math.max(1, (p.height * 110) / high),
          }
        : p,
    ),
  };
  return validDesign(fitted) ? fitted : null;
}
