'use client';
import { geometry, shadeColor, type Design } from './design';
export default function DesignPreview({ design }: { design: Design }) {
  const faces = geometry(design);
  const project = (p: { x: number; y: number; z: number }) => ({
    x: (p.x - p.y) * 90,
    y: (p.x + p.y) * 46 - p.z * 1.65,
  });
  const points = faces.flatMap((f) => f.points.map(project));
  const minX = Math.min(...points.map((p) => p.x)),
    maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y)),
    maxY = Math.max(...points.map((p) => p.y));
  return (
    <svg
      className="design-preview"
      viewBox={`${minX - 22} ${minY - 22} ${maxX - minX + 44} ${maxY - minY + 44}`}
      aria-label={`Preview of ${design.name}: ${design.description}`}
    >
      <title>{design.name}</title>
      {faces.map((f, i) => (
        <polygon
          key={i}
          points={f.points
            .map((p) => {
              const q = project(p);
              return `${q.x},${q.y}`;
            })
            .join(' ')}
          fill={shadeColor(f.color, f.shade)}
          stroke={shadeColor(f.color, f.shade)}
          strokeWidth=".3"
        />
      ))}
    </svg>
  );
}
