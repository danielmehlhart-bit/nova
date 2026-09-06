'use client';
import { useEffect, useRef } from 'react';
import { geometry, shadeColor } from './design';
import {
  BUILDINGS,
  isLand,
  isRoad,
  SIZE,
  type Kind,
  type State,
} from './simulation';
type Props = {
  state: State;
  tool: Kind | 'inspect' | 'remove';
  zoom: number;
  night: boolean;
  grid: boolean;
  onTile: (x: number, y: number) => void;
  onZoom: (z: number) => void;
  focusTile: { x: number; y: number } | null;
};
type Pt = { x: number; y: number };
export default function CityCanvas(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    live = useRef(props),
    pan = useRef({ x: 0, y: 0 }),
    hover = useRef<Pt | null>(null),
    keyboard = useRef({ x: 7, y: 9 });
  useEffect(() => {
    live.current = props;
  }, [props]);
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const c = ctx;
    let w = 0,
      h = 0,
      frame = 0,
      active = true,
      scale = 1,
      origin = { x: 0, y: 0 };
    let lastTime = 0;
    let lastFocus = '';
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const resize = () => {
      const rect = el.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      el.width = w * dpr;
      el.height = h * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    const iso = (x: number, y: number, z = 0): Pt => ({
      x: origin.x + (x - y) * 27 * scale,
      y: origin.y + (x + y - 16) * 14 * scale - z * scale,
    });
    const poly = (p: Pt[], fill: string, stroke?: string) => {
      c.beginPath();
      p.forEach((v, i) => (i ? c.lineTo(v.x, v.y) : c.moveTo(v.x, v.y)));
      c.closePath();
      c.fillStyle = fill;
      c.fill();
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = 0.65 * scale;
        c.stroke();
      }
    };
    const tile = (
      x: number,
      y: number,
      z: number,
      color: string,
      line?: string,
    ) =>
      poly(
        [
          iso(x, y, z),
          iso(x + 1, y, z),
          iso(x + 1, y + 1, z),
          iso(x, y + 1, z),
        ],
        color,
        line,
      );
    const box = (
      x: number,
      y: number,
      bw: number,
      bd: number,
      z: number,
      bh: number,
      top: string,
      left: string,
      right: string,
    ) => {
      poly(
        [
          iso(x, y + bd, z),
          iso(x + bw, y + bd, z),
          iso(x + bw, y + bd, z + bh),
          iso(x, y + bd, z + bh),
        ],
        left,
      );
      poly(
        [
          iso(x + bw, y, z),
          iso(x + bw, y + bd, z),
          iso(x + bw, y + bd, z + bh),
          iso(x + bw, y, z + bh),
        ],
        right,
      );
      poly(
        [
          iso(x, y, z + bh),
          iso(x + bw, y, z + bh),
          iso(x + bw, y + bd, z + bh),
          iso(x, y + bd, z + bh),
        ],
        top,
      );
    };
    const ellipse = (
      p: Pt,
      rx: number,
      ry: number,
      fill: string,
      stroke?: string,
    ) => {
      c.beginPath();
      c.ellipse(p.x, p.y, rx * scale, ry * scale, 0, 0, Math.PI * 2);
      c.fillStyle = fill;
      c.fill();
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = 1 * scale;
        c.stroke();
      }
    };
    const line = (a: Pt, b: Pt, color: string, width = 1) => {
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.strokeStyle = color;
      c.lineWidth = width * scale;
      c.stroke();
    };
    const tree = (
      x: number,
      y: number,
      z: number,
      seed: number,
      night: boolean,
    ) => {
      const hh = 10 + seed * 8;
      line(iso(x, y, z), iso(x, y, z + hh), night ? '#3a7773' : '#578675', 2);
      ellipse(
        iso(x, y, z + hh),
        7,
        10,
        night ? '#286f61' : seed > 0.5 ? '#69b390' : '#87c89b',
      );
      ellipse(
        iso(x - 0.05, y - 0.05, z + hh + 2),
        4,
        6,
        night ? '#398674' : '#a9dab3',
      );
    };
    const drawBuilding = (
      x: number,
      y: number,
      kind: Kind,
      t: number,
      night: boolean,
      ghost = false,
    ) => {
      c.save();
      if (ghost) c.globalAlpha = 0.65;
      const k = BUILDINGS[kind];
      const base = 8,
        roof = night ? '#80aaa9' : '#f0f4e4',
        wall = night ? '#416f77' : '#afcbc8',
        side = night ? '#285660' : '#81a9ad';
      tile(x + 0.06, y + 0.06, base, k.color);
      box(x + 0.07, y + 0.07, 0.86, 0.86, base, 3, roof, wall, side);
      if (kind === 'home') {
        const height = 46 + ((x * 7 + y * 3) % 4) * 9;
        box(x + 0.22, y + 0.22, 0.56, 0.56, base + 3, height, roof, wall, side);
        for (let j = 8; j < height - 3; j += 8) {
          box(
            x + 0.2,
            y + 0.2,
            0.6,
            0.6,
            base + j,
            2,
            roof,
            night ? '#8ddacc' : '#dbe9db',
            side,
          );
          line(
            iso(x + 0.27, y + 0.783, base + j + 4),
            iso(x + 0.66, y + 0.783, base + j + 4),
            night ? '#a5edce' : '#63939c',
            2,
          );
          line(
            iso(x + 0.783, y + 0.29, base + j + 4),
            iso(x + 0.783, y + 0.65, base + j + 4),
            night ? '#b9dabb' : '#547f8e',
            2,
          );
        }
        tile(
          x + 0.27,
          y + 0.27,
          base + height + 3,
          night ? '#306c5c' : '#86b38b',
        );
        tree(x + 0.46, y + 0.47, base + height + 3, 0.15, night);
      }
      if (kind === 'core') {
        box(x + 0.25, y + 0.25, 0.5, 0.5, base + 3, 65, roof, wall, side);
        for (let i = 0; i < 6; i++) {
          box(
            x + 0.2,
            y + 0.2,
            0.6,
            0.6,
            base + 8 + i * 9,
            2,
            night ? '#91e4d0' : '#c3f9e7',
            wall,
            side,
          );
        }
        const p = iso(x + 0.5, y + 0.5, base + 90 + Math.sin(t) * 2);
        const glow = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 40 * scale);
        glow.addColorStop(0, '#8fffff65');
        glow.addColorStop(1, '#8fffff00');
        ellipse(p, 40, 40, glow as unknown as string);
        ellipse(p, 12, 18, '#a0f4dc');
        ellipse(p, 20, 6, '#00000000', '#b8ffe1');
        line(
          iso(x + 0.5, y + 0.5, base + 68),
          iso(x + 0.5, y + 0.5, base + 78),
          '#b6fce5',
          2,
        );
      }
      if (kind === 'garden' || kind === 'wild') {
        tile(x + 0.14, y + 0.14, base + 4, night ? '#285d50' : '#80b58a');
        const n = kind === 'wild' ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const xx = x + 0.22 + ((i * 37) % 57) / 100,
            yy = y + 0.18 + ((i * 23) % 60) / 100;
          tree(xx, yy, base + 5, ((i * 3 + x) % 7) / 7, night);
        }
        if (kind === 'garden')
          box(
            x + 0.2,
            y + 0.7,
            0.55,
            0.07,
            base + 4,
            3,
            '#e4c19c',
            '#bf9773',
            '#a67e61',
          );
      }
      if (kind === 'agora') {
        box(
          x + 0.15,
          y + 0.15,
          0.7,
          0.7,
          base + 3,
          8,
          '#e0be94',
          '#c6a286',
          '#a08677',
        );
        for (const [xx, yy] of [
          [0.2, 0.2],
          [0.7, 0.2],
          [0.2, 0.7],
          [0.7, 0.7],
        ])
          box(x + xx, y + yy, 0.07, 0.07, base + 11, 17, roof, wall, side);
        box(
          x + 0.08,
          y + 0.08,
          0.84,
          0.84,
          base + 28,
          3,
          night ? '#a97e63' : '#ffd1a0',
          '#dfad83',
          '#b58a72',
        );
        ellipse(iso(x + 0.5, y + 0.5, base + 33), 8, 4, '#f9e8bb');
      }
      if (kind === 'atelier') {
        box(
          x + 0.18,
          y + 0.15,
          0.63,
          0.7,
          base + 3,
          23,
          night ? '#9994b4' : '#c9c8e6',
          '#9999b6',
          '#737f9b',
        );
        box(x + 0.28, y + 0.28, 0.4, 0.42, base + 26, 10, roof, wall, side);
        line(
          iso(x + 0.2, y + 0.86, base + 12),
          iso(x + 0.76, y + 0.86, base + 12),
          night ? '#e5b7ff' : '#e7d4ff',
          4,
        );
        tile(x + 0.34, y + 0.34, base + 36, '#b5a5df');
      }
      if (kind === 'observatory') {
        box(x + 0.19, y + 0.19, 0.62, 0.62, base + 3, 18, roof, wall, side);
        const p = iso(x + 0.5, y + 0.5, base + 24);
        c.beginPath();
        c.ellipse(p.x, p.y, 17 * scale, 20 * scale, 0, Math.PI, Math.PI * 2);
        c.lineTo(p.x + 17 * scale, p.y);
        c.fillStyle = night ? '#729fab' : '#b5d9e0';
        c.fill();
        ellipse(p, 17, 8, night ? '#58899a' : '#90bdcc');
        line(
          iso(x + 0.5, y + 0.5, base + 35),
          iso(x + 0.8, y + 0.2, base + 46),
          roof,
          7,
        );
      }
      if (kind === 'dream') {
        const p = iso(x + 0.5, y + 0.5, base + 19);
        box(x + 0.25, y + 0.25, 0.5, 0.5, base + 3, 10, roof, wall, side);
        ellipse(p, 17, 19, night ? '#9576a0' : '#d9bbdf');
        ellipse(
          { x: p.x - 4 * scale, y: p.y - 5 * scale },
          9,
          10,
          night ? '#e0b2e7' : '#f3d9ea',
        );
        ellipse(
          iso(x + 0.5, y + 0.5, base + 14),
          20,
          6,
          '#00000000',
          '#fbc4ec',
        );
      }
      if (kind === 'archive') {
        for (let j = 0; j < 4; j++)
          box(
            x + 0.12 + j * 0.06,
            y + 0.12 + j * 0.06,
            0.76 - j * 0.12,
            0.76 - j * 0.12,
            base + 3 + j * 10,
            9,
            night ? '#bab18d' : '#e6dcc0',
            '#b7b097',
            '#919987',
          );
      }
      c.restore();
    };
    const render = (now: number) => {
      if (!active) return;
      frame = requestAnimationFrame(render);
      if (now - lastTime < 1000 / (reduced ? 12 : 30)) return;
      lastTime = now;
      const p = live.current,
        night = p.night,
        t = reduced ? 0 : now / 1000;
      scale =
        Math.min(w / (w < 720 ? 550 : 1030), h / (w < 720 ? 440 : 650)) *
        p.zoom;
      scale = Math.max(0.25, scale);
      const focusKey = p.focusTile ? `${p.focusTile.x},${p.focusTile.y}` : '';
      if (w < 720 && focusKey && focusKey !== lastFocus && p.focusTile) {
        pan.current = {
          x: -(p.focusTile.x - p.focusTile.y) * 27 * scale,
          y: -(p.focusTile.x + p.focusTile.y - 16) * 14 * scale,
        };
      }
      lastFocus = focusKey;
      origin = {
        x: w * 0.5 + pan.current.x,
        y: h * (w < 720 ? 0.43 : 0.55) + pan.current.y,
      };
      c.clearRect(0, 0, w, h);
      const bg = c.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, night ? '#071f2b' : '#15464c');
      bg.addColorStop(0.6, night ? '#0a2935' : '#236165');
      bg.addColorStop(1, night ? '#0b343b' : '#347878');
      c.fillStyle = bg;
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 48; i++) {
        const xx = (i * 173.3) % w,
          yy = (i * 91.7) % h;
        const dx = Math.sin(t * 0.4 + i) * 5;
        c.strokeStyle = night ? '#6bb7af0e' : '#b6e8d214';
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(xx + dx, yy, 18 + (i % 4) * 8, 3, 0, 0, Math.PI);
        c.stroke();
      }
      // The terrain is the actual game board. All structures below are rendered from simulation state.
      for (let sum = 0; sum < SIZE * 2; sum++)
        for (let x = 0; x < SIZE; x++) {
          const y = sum - x;
          if (!isLand(x, y)) continue;
          const corners = [
            iso(x, y, -6),
            iso(x + 1, y, -6),
            iso(x + 1, y + 1, -6),
            iso(x, y + 1, -6),
          ];
          poly(corners, night ? '#284b49' : '#6c9587');
          box(
            x,
            y,
            1,
            1,
            -4,
            11,
            night ? '#496e5f' : '#b4c5a0',
            night ? '#305954' : '#72958a',
            night ? '#254a48' : '#557b76',
          );
          const road = isRoad(x, y);
          tile(
            x + 0.025,
            y + 0.025,
            8,
            road
              ? night
                ? '#547473'
                : '#d5dfce'
              : night
                ? '#416759'
                : (x * 13 + y * 7) % 5 === 0
                  ? '#a7be94'
                  : '#adc59b',
            p.grid ? '#ffffff18' : undefined,
          );
          if (road) {
            if (x === 8 || x === 4)
              line(
                iso(x + 0.5, y + 0.1, 8.2),
                iso(x + 0.5, y + 0.9, 8.2),
                night ? '#a9bca85c' : '#fbfff166',
                0.7,
              );
            else
              line(
                iso(x + 0.1, y + 0.5, 8.2),
                iso(x + 0.9, y + 0.5, 8.2),
                night ? '#a9bca85c' : '#fbfff166',
                0.7,
              );
          }
        }
      const focus = hover.current || p.focusTile;
      if (focus && isLand(focus.x, focus.y)) {
        const occupied = p.state.tiles.some(
            (t) => t.x === focus.x && t.y === focus.y,
          ),
          bad = isRoad(focus.x, focus.y) || occupied;
        tile(
          focus.x,
          focus.y,
          9,
          p.tool === 'inspect'
            ? '#d7fff050'
            : p.tool === 'remove'
              ? '#ff8a765a'
              : bad
                ? '#ff8a7655'
                : '#c5ffb590',
          p.tool === 'remove' ? '#ff9b88' : '#efffe5',
        );
      }
      for (let sum = 0; sum < SIZE * 2; sum++)
        for (let x = 0; x < SIZE; x++) {
          const y = sum - x;
          if (!isLand(x, y)) continue;
          const b = p.state.tiles.find((b) => b.x === x && b.y === y);
          if (b?.design) {
            tile(x + 0.03, y + 0.03, 8, night ? '#426c65' : '#bcd5bb');
            for (const f of geometry(b.design))
              poly(
                f.points.map((q) => iso(x + q.x, y + q.y, 10 + q.z)),
                shadeColor(f.color, f.shade * (night ? 0.64 : 1)),
              );
          } else if (b) drawBuilding(x, y, b.kind, t, night);
          else if (
            !isRoad(x, y) &&
            ((x * 37 + y * 13) % 7 === 0 || x < 3 || y < 2 || x > 14 || y > 14)
          )
            tree(x + 0.5, y + 0.5, 8, ((x * 17 + y * 11) % 10) / 10, night);
          if (
            focus &&
            focus.x === x &&
            focus.y === y &&
            !b &&
            !isRoad(x, y) &&
            p.tool !== 'inspect' &&
            p.tool !== 'remove'
          )
            drawBuilding(x, y, p.tool, t, night, true);
        }
      // Residents stroll along the car-free avenues; delivery drones belong to the automated economy.
      for (let i = 0; i < Math.min(60, p.state.population / 4); i++) {
        const travel = ((t * 0.12 + i * 1.23) % 14) + 1;
        const a =
          i % 2
            ? iso(8.3 + (i % 3) * 0.15, travel, 9)
            : iso(travel, 8.2 + (i % 4) * 0.15, 9);
        ellipse({ ...a, y: a.y + 2 * scale }, 1.8, 1, '#27474740');
        line(
          a,
          { x: a.x, y: a.y - 3 * scale },
          ['#f5d7b3', '#fcf5d8', '#9e7bc2', '#305e60'][i % 4],
          1.8,
        );
      }
      for (let i = 0; i < 4; i++) {
        const travel = (t * 0.32 + i * 4) % 16;
        const q = iso(travel, 4 + i * 3, 60 + Math.sin(t + i) * 2);
        ellipse(iso(travel, 4 + i * 3, 8), 6, 2, '#203c4230');
        ellipse(q, 5, 2, night ? '#bbfce6' : '#f3fae6');
        line(
          { x: q.x - 8 * scale, y: q.y },
          { x: q.x + 8 * scale, y: q.y },
          '#bdddd2',
          1,
        );
      }
      // A quiet orbital ring marks the core without obscuring building interaction.
      const cp = iso(7.5, 7.5, 112);
      c.setLineDash([2 * scale, 7 * scale]);
      ellipse(cp, 30, 10, '#00000000', night ? '#c7ffe966' : '#ceffdf55');
      c.setLineDash([]);
    };
    const hit = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect(),
        xx = (clientX - r.left - origin.x) / (27 * scale),
        yy = (clientY - r.top - origin.y + 8 * scale) / (14 * scale) + 16;
      return { x: Math.floor((xx + yy) / 2), y: Math.floor((yy - xx) / 2) };
    };
    const pointers = new Map<number, Pt>();
    let start: Pt | null = null,
      last: Pt | null = null,
      moved = false,
      pinch = 0;
    const down = (e: PointerEvent) => {
      el.focus({ preventScroll: true });
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
      start = last = { x: e.clientX, y: e.clientY };
      moved = false;
      if (pointers.size === 2) {
        const a = [...pointers.values()];
        pinch = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        moved = true;
      }
    };
    const move = (e: PointerEvent) => {
      hover.current = hit(e.clientX, e.clientY);
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const a = [...pointers.values()],
          d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        if (pinch > 0)
          live.current.onZoom(
            Math.max(0.6, Math.min(2.4, (live.current.zoom * d) / pinch)),
          );
        pinch = d;
        moved = true;
      } else if (last && start) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6)
          moved = true;
        if (moved) {
          pan.current.x = Math.max(
            -w,
            Math.min(w, pan.current.x + e.clientX - last.x),
          );
          pan.current.y = Math.max(
            -h,
            Math.min(h, pan.current.y + e.clientY - last.y),
          );
        }
        last = { x: e.clientX, y: e.clientY };
      }
    };
    const up = (e: PointerEvent) => {
      if (!moved && pointers.size === 1) {
        const q = hit(e.clientX, e.clientY);
        live.current.onTile(q.x, q.y);
      }
      pointers.delete(e.pointerId);
      if (pointers.size) {
        moved = true;
        start = null;
        last = null;
      } else {
        start = last = null;
        pinch = 0;
      }
      if (e.pointerType !== 'mouse') hover.current = null;
    };
    const cancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      start = last = null;
      moved = true;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      live.current.onZoom(
        Math.max(0.6, Math.min(2.4, live.current.zoom - e.deltaY * 0.001)),
      );
    };
    const key = (e: KeyboardEvent) => {
      let used = true;
      const q = keyboard.current;
      if (e.key === 'ArrowRight') q.x = Math.min(16, q.x + 1);
      else if (e.key === 'ArrowLeft') q.x = Math.max(0, q.x - 1);
      else if (e.key === 'ArrowUp') q.y = Math.max(0, q.y - 1);
      else if (e.key === 'ArrowDown') q.y = Math.min(16, q.y + 1);
      else if (e.key === 'Enter') live.current.onTile(q.x, q.y);
      else if (e.key === 'Home') {
        pan.current = { x: 0, y: 0 };
        live.current.onZoom(1);
      } else used = false;
      if (used) {
        hover.current = { ...q };
        e.preventDefault();
      }
    };
    const leave = () => {
      hover.current = null;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('keydown', key);
    frame = requestAnimationFrame(render);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('keydown', key);
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className="city-canvas"
      tabIndex={0}
      aria-label="Interactive city map. Choose a building and an open tile. Arrow keys move selection, Enter builds, Home centers the map. Drag to move."
    />
  );
}
