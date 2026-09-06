'use client';
import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { isLand, type State, type Tile } from './simulation';
import { spec, tileKey, type Life } from './community';
import { profile } from './citizens';
const UNIT = 3.2;
const xy = (x: number, y: number) =>
  new T.Vector3((x - 8) * UNIT, 0, (y - 8) * UNIT);
const hash = (i: number) => {
  const n = Math.sin(i * 91.7) * 43758.545;
  return n - Math.floor(n);
};
export default function CommunityWorld({
  state,
  selected,
  focus,
  building,
  night,
  quality,
  onPick,
  onPerson,
  onHighlight,
}: {
  state: State;
  selected: number | null;
  focus: { key: number; serial: number } | null;
  building: boolean;
  night: boolean;
  quality: 'low' | 'high';
  onPick: (x: number, y: number) => void;
  onPerson: (id: number) => void;
  onHighlight: (key: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    latest = useRef({
      state,
      selected,
      building,
      night,
      quality,
      onPick,
      onPerson,
      onHighlight,
    });
  useEffect(() => {
    latest.current = {
      state,
      selected,
      building,
      night,
      quality,
      onPick,
      onPerson,
      onHighlight,
    };
  }, [
    state,
    selected,
    building,
    night,
    quality,
    onPick,
    onPerson,
    onHighlight,
  ]);
  const controlsRef = useRef<OrbitControls | null>(null),
    cameraRef = useRef<T.OrthographicCamera | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!focus || !controlsRef.current) return;
    const p = xy(focus.key % 17, Math.floor(focus.key / 17));
    const controls = controlsRef.current,
      camera = cameraRef.current!;
    const delta = p.clone().sub(controls.target);
    camera.position.add(delta);
    controls.target.copy(p);
    camera.zoom = Math.max(camera.zoom, 2.8);
    camera.updateProjectionMatrix();
    controls.update();
  }, [focus]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        canvas: element,
        antialias: true,
        powerPreference: 'default',
      });
    } catch {
      queueMicrotask(() =>
        setError(
          '3D is unavailable on this device. You can still build, manage places and follow residents through the controls.',
        ),
      );
      return;
    }
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, latest.current.quality === 'low' ? 1 : 1.6),
    );
    renderer.shadowMap.enabled = latest.current.quality === 'high';
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    const scene = new T.Scene();
    scene.background = new T.Color('#bfd7d6');
    scene.fog = new T.Fog('#bfd7d6', 65, 150);
    const camera = new T.OrthographicCamera(-25, 25, 20, -20, 0.1, 220);
    camera.position.set(39, 47, 43);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1.05;
    cameraRef.current = camera;
    const controls = new OrbitControls(camera, element);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.minZoom = 0.65;
    controls.maxZoom = 6;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI * 0.44;
    controls.maxDistance = 95;
    controls.target.set(0, 0, 0);
    controls.mouseButtons.LEFT = T.MOUSE.PAN;
    controls.mouseButtons.RIGHT = T.MOUSE.ROTATE;
    controls.touches.ONE = T.TOUCH.PAN;
    controls.touches.TWO = T.TOUCH.DOLLY_ROTATE;
    const hemi = new T.HemisphereLight('#fff2d9', '#607e62', 2.3);
    scene.add(hemi);
    const sun = new T.DirectionalLight('#fff0cb', 3.1);
    sun.position.set(-18, 40, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -30,
      right: 30,
      top: 30,
      bottom: -30,
      near: 0.5,
      far: 100,
    });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.05;
    scene.add(sun);
    const materials = new Map<string, T.MeshStandardMaterial>();
    const mat = (color: string, roughness = 0.8) => {
      const key = color + roughness;
      if (!materials.has(key))
        materials.set(key, new T.MeshStandardMaterial({ color, roughness }));
      return materials.get(key)!;
    };
    const resources = new Set<T.BufferGeometry>();
    const geo = <G extends T.BufferGeometry>(g: G) => {
      resources.add(g);
      return g;
    };
    const rounded = geo(new RoundedBoxGeometry(1, 1, 1, 2, 0.07)),
      boxGeo = geo(new T.BoxGeometry(1, 1, 1)),
      ball = geo(new T.SphereGeometry(1, 12, 8)),
      cylinder = geo(new T.CylinderGeometry(1, 1, 1, 12));
    function block(
      parent: T.Object3D,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string,
      round = true,
    ) {
      const m = new T.Mesh(round ? rounded : boxGeo, mat(color));
      m.position.set(x, y, z);
      m.scale.set(w, h, d);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    function sphere(
      parent: T.Object3D,
      x: number,
      y: number,
      z: number,
      r: number,
      color: string,
    ) {
      const m = new T.Mesh(ball, mat(color));
      m.position.set(x, y, z);
      m.scale.setScalar(r);
      m.castShadow = true;
      parent.add(m);
      return m;
    }
    function cyl(
      parent: T.Object3D,
      x: number,
      y: number,
      z: number,
      r: number,
      h: number,
      color: string,
    ) {
      const m = new T.Mesh(cylinder, mat(color));
      m.position.set(x, y, z);
      m.scale.set(r, h, r);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    const sea = new T.Mesh(
      geo(new T.PlaneGeometry(250, 250)),
      new T.MeshStandardMaterial({
        color: '#7eafb5',
        roughness: 0.38,
        metalness: 0.08,
      }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -0.9;
    scene.add(sea);
    const shape = new T.Shape();
    for (let i = 0; i <= 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      let r = 29.8 + Math.sin(a * 3) * 0.5;
      if (a > 1.9 && a < 2.7) r -= 2.2;
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      if (i) shape.lineTo(x, y);
      else shape.moveTo(x, y);
    }
    const terrainGeo = geo(
      new T.ExtrudeGeometry(shape, {
        depth: 0.6,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.45,
        bevelThickness: 0.25,
        curveSegments: 48,
      }),
    );
    terrainGeo.rotateX(-Math.PI / 2);
    const land = new T.Mesh(terrainGeo, [mat('#9eb889'), mat('#ddd0a5')]);
    land.position.y = -0.85;
    land.receiveShadow = true;
    land.userData.land = true;
    scene.add(land);
    // Shared tree geometry and materials keep the landscape inexpensive.
    const treeSites: { x: number; y: number }[] = [];
    for (let i = 0; i < 150; i++) {
      const a = hash(i + 10) * Math.PI * 2,
        r = 17 + hash(i + 51) * 12;
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (Math.hypot(x, z) > 29) continue;
      treeSites.push({ x, y: z });
    }
    const trunks = new T.InstancedMesh(
        cylinder,
        mat('#837555'),
        treeSites.length,
      ),
      crowns = new T.InstancedMesh(ball, mat('#69895c'), treeSites.length),
      tips = new T.InstancedMesh(ball, mat('#a9ba7b'), treeSites.length);
    const dummy = new T.Object3D();
    treeSites.forEach((p, i) => {
      const h = 1.4 + hash(i) * 1.6;
      dummy.position.set(p.x, h / 2, p.y);
      dummy.scale.set(0.12, h, 0.12);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.y = h;
      dummy.scale.set(0.75 + hash(i) * 0.4, h * 0.55, 0.8);
      dummy.updateMatrix();
      crowns.setMatrixAt(i, dummy.matrix);
      dummy.position.y = h + 0.25;
      dummy.position.x += 0.25;
      dummy.scale.multiplyScalar(0.62);
      dummy.updateMatrix();
      tips.setMatrixAt(i, dummy.matrix);
    });
    const originalTrees = [trunks, crowns, tips].map((mesh) =>
      treeSites.map((_, i) => {
        const m = new T.Matrix4();
        mesh.getMatrixAt(i, m);
        return m;
      }),
    );
    trunks.castShadow = crowns.castShadow = tips.castShadow = true;
    scene.add(trunks, crowns, tips);
    const buildings = new T.Group();
    scene.add(buildings);
    let signature = '';
    let framedCommunity = false;
    const buildingMeshes: T.Object3D[] = [];
    const waterMeshes: T.Mesh[] = [];
    const staticBatches: T.InstancedMesh[] = [];
    function bench(g: T.Group, x: number, z: number, rotation = 0) {
      const b = new T.Group();
      b.position.set(x, 0, z);
      b.rotation.y = rotation;
      block(b, 0, 0.32, 0, 0.8, 0.12, 0.3, '#b4946a');
      block(b, 0, 0.57, -0.13, 0.8, 0.35, 0.07, '#b4946a');
      for (const k of [-0.28, 0.28])
        block(b, k, 0.15, 0, 0.07, 0.3, 0.2, '#617262');
      g.add(b);
    }
    function tree(g: T.Group, x: number, z: number) {
      cyl(g, x, 0.65, z, 0.09, 1.3, '#877c5e');
      const s = sphere(g, x, 1.5, z, 0.6, '#789861');
      s.scale.y = 1.25;
    }
    const dynamicGeometries = new Set<T.BufferGeometry>();
    const dynamicGeo = <G extends T.BufferGeometry>(g: G) => {
      dynamicGeometries.add(g);
      return geo(g);
    };
    function tent(g: T.Group, x: number, z: number, color: string) {
      const geometry = dynamicGeo(new T.CylinderGeometry(0, 0.7, 1.05, 3, 1));
      geometry.rotateY(Math.PI / 2);
      const roof = new T.Mesh(geometry, mat(color));
      roof.position.set(x, 0.55, z);
      roof.scale.z = 1.45;
      roof.castShadow = true;
      g.add(roof);
      block(g, x, 0.06, z, 1.2, 0.1, 1.4, '#c7bd97');
      block(g, x + 0.02, 0.27, z + 0.55, 0.34, 0.48, 0.035, '#655746', false);
    }
    function home(g: T.Group, x: number, z: number, wood = false) {
      block(g, x, 0.65, z, 1.7, 1.25, 1.5, wood ? '#c0a580' : '#f0ead7');
      block(g, x, 1.35, z, 1.9, 0.2, 1.7, wood ? '#7b8e68' : '#a0af83');
      block(g, x - 0.35, 0.65, z + 0.77, 0.65, 0.55, 0.035, '#779fa3');
      block(g, x + 0.4, 0.48, z + 0.77, 0.38, 0.93, 0.035, '#9e7953');
      block(g, x, 0.1, z + 1, 1.9, 0.18, 0.55, '#c2aa81');
    }
    function renderPlace(t: Tile) {
      const g = new T.Group(),
        p = xy(t.x, t.y),
        q = spec(t);
      g.position.copy(p);
      g.userData.key = tileKey(t);
      buildingMeshes.push(g);
      buildings.add(g);
      block(
        g,
        0,
        0.01,
        0,
        3,
        0.08,
        3,
        q.form === 'wetland' ? '#859b71' : '#cbd0a7',
      );
      if (t.design) {
        for (const part of t.design.parts) {
          const geometry =
            part.curve === 'dome'
              ? dynamicGeo(
                  new T.SphereGeometry(
                    1,
                    16,
                    8,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI / 2,
                  ),
                )
              : dynamicGeo(
                  new T.CylinderGeometry(part.taper, 1, 1, part.sides),
                );
          const mesh = new T.Mesh(geometry, mat(part.color));
          mesh.position.set(
            (part.x - 0.5) * 3,
            part.elevation * 0.04 +
              (part.curve === 'dome' ? 0 : part.height * 0.02),
            (part.y - 0.5) * 3,
          );
          mesh.scale.set(
            part.width * 1.5,
            part.height * 0.04,
            part.depth * 1.5,
          );
          mesh.rotation.y = (part.rotation * Math.PI) / 180;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          g.add(mesh);
        }
        return;
      }
      switch (q.form) {
        case 'customhome': {
          const floors = Math.min(10, Math.max(1, Math.ceil(q.capacity / 12)));
          const wings = q.privacy >= 70 ? 3 : 2;
          for (let wing = 0; wing < wings; wing++) {
            const x = wing === 0 ? -0.9 : wing === 1 ? 0.9 : 0,
              z = wing === 2 ? -1.0 : 0;
            const width = wing === 2 ? 1.1 : 0.72,
              depth = wing === 2 ? 0.7 : 1.9;
            for (let floor = 0; floor < floors; floor++) {
              block(g, x, 0.45 + floor * 0.8, z, width, 0.72, depth, '#ece5d1');
              block(
                g,
                x,
                0.88 + floor * 0.8,
                z,
                width + 0.15,
                0.11,
                depth + 0.15,
                '#9eae87',
              );
              block(
                g,
                x,
                0.47 + floor * 0.8,
                z + depth / 2 + 0.02,
                width * 0.6,
                0.35,
                0.035,
                '#83adb3',
              );
            }
          }
          bench(g, 0, 0.6);
          cyl(g, 0, 0.45, -0.2, 0.25, 0.12, '#b89d77');
          if (q.quiet >= 65) tree(g, -1.15, 1.1);
          if (q.quiet >= 85) tree(g, 1.15, 1.1);
          break;
        }
        case 'camp':
          tent(g, -0.7, -0.55, '#e6be82');
          tent(g, 0.7, -0.45, '#b3c6aa');
          tent(g, 0.65, 0.85, '#cc946f');
          cyl(g, -0.6, 0.08, 0.8, 0.35, 0.13, '#b4a184');
          break;
        case 'cottage':
          home(g, 0, -0.3);
          tree(g, -1.1, 1);
          bench(g, 0.65, 1.2);
          break;
        case 'woodland':
          home(g, 0, 0, true);
          tree(g, -1.1, -1);
          tree(g, 1.1, 0.9);
          break;
        case 'tower':
          block(g, 0, 2.7, 0, 1.7, 5.4, 1.6, '#ece9d9');
          for (let floor = 0; floor < 6; floor++) {
            block(g, 0, 0.6 + floor * 0.78, 0, 2.05, 0.14, 1.95, '#b6c9b8');
            for (const side of [-1, 1]) {
              block(
                g,
                0.86,
                0.92 + floor * 0.78,
                side * 0.4,
                0.025,
                0.48,
                0.5,
                '#82a6aa',
              );
              block(
                g,
                side * 0.42,
                0.92 + floor * 0.78,
                0.81,
                0.52,
                0.48,
                0.025,
                '#82a6aa',
              );
            }
          }
          block(g, 0, 5.48, 0, 2.05, 0.17, 1.9, '#92aa76');
          sphere(g, 0.5, 5.65, 0.4, 0.25, '#789562');
          bench(g, -1.2, 0.8, Math.PI / 2);
          break;
        case 'pool':
          block(g, 0, 0.12, 0, 2.9, 0.22, 2.6, '#efe4ce');
          {
            const w = block(g, -0.15, 0.24, -0.2, 2.3, 0.03, 1.8, '#65bac5');
            w.material = mat('#63b9c5', 0.16);
            waterMeshes.push(w);
          }
          bench(g, 0.5, 1.15);
          bench(g, -0.55, 1.15);
          cyl(g, 1.25, 0.65, -1, 0.025, 1.3, '#a98d63');
          const umbrella = new T.Mesh(
            dynamicGeo(new T.ConeGeometry(0.55, 0.22, 20)),
            mat('#e4b68a'),
          );
          umbrella.position.set(1.25, 1.35, -1);
          g.add(umbrella);
          break;
        case 'pavilion':
          for (const x of [-1, 1])
            for (const z of [-0.85, 0.85])
              cyl(g, x, 0.8, z, 0.08, 1.6, '#d7c7a6');
          block(g, 0, 1.65, 0, 2.7, 0.17, 2.4, '#cdb28c');
          block(g, 0, 0.46, 0, 1.25, 0.1, 0.7, '#a78965');
          for (const x of [-0.8, 0.8])
            bench(g, x, 0, x < 0 ? Math.PI / 2 : -Math.PI / 2);
          break;
        case 'workshop':
        case 'learning':
          home(g, 0, -0.25);
          block(g, 0, 0.5, 1.05, 1.1, 0.12, 0.5, '#b39069');
          for (let i = 0; i < 3; i++)
            block(
              g,
              -0.3 + i * 0.3,
              0.65,
              1,
              0.15,
              0.2,
              0.15,
              ['#d1907e', '#8bafbd', '#d4be74'][i],
            );
          break;
        case 'sanctuary':
          cyl(g, 0, 0.75, 0, 1.08, 1.5, '#ede8d7');
          const dome = new T.Mesh(
            dynamicGeo(
              new T.SphereGeometry(
                1.18,
                20,
                12,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2,
              ),
            ),
            mat('#b3bfa7'),
          );
          dome.position.y = 1.5;
          g.add(dome);
          block(g, 0, 0.5, 1.09, 0.45, 1, 0.02, '#778778');
          bench(g, -1.15, 1);
          break;
        case 'observatory':
          cyl(g, 0, 0.6, 0, 1, 0.9, '#e4e1d4');
          {
            const dome = new T.Mesh(
              dynamicGeo(
                new T.SphereGeometry(
                  1.05,
                  20,
                  12,
                  0,
                  Math.PI * 2,
                  0,
                  Math.PI / 2,
                ),
              ),
              mat('#9fbac3'),
            );
            dome.position.y = 1.04;
            g.add(dome);
            const tube = cyl(g, 0.3, 1.8, 0.2, 0.16, 1.2, '#ede7d1');
            tube.rotation.z = 0.55;
          }
          break;
        case 'wetland':
          block(g, 0, 0.1, 0, 2.3, 0.07, 1.8, '#83b3a3');
          for (let i = 0; i < 14; i++)
            cyl(
              g,
              (hash(i + 11) - 0.5) * 2.6,
              0.4,
              (hash(i + 52) - 0.5) * 2.4,
              0.035,
              0.65,
              '#647f50',
            );
          bench(g, 0.3, 1.3);
          break;
        case 'garden':
          for (const x of [-0.8, 0.8]) tree(g, x, -0.55);
          bench(g, 0, 0.9);
          for (let i = 0; i < 8; i++)
            sphere(
              g,
              (hash(i + 31) - 0.5) * 2.7,
              0.15,
              (hash(i + 44) - 0.5) * 2.7,
              0.12,
              ['#e5bd8d', '#f0e6ca', '#b793bb'][i % 3],
            );
          break;
      }
      for (const child of g.children) child.userData.key = tileKey(t);
    }
    const max = 200;
    const parts = [
      'body',
      'head',
      'hair',
      'leftLeg',
      'rightLeg',
      'leftArm',
      'rightArm',
    ] as const;
    const humans = Object.fromEntries(
      parts.map((part) => {
        const mesh = new T.InstancedMesh(
          part === 'head' || part === 'hair' ? ball : rounded,
          mat('#ffffff'),
          max,
        );
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.frustumCulled = false;
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.userData.people = true;
        scene.add(mesh);
        return [part, mesh];
      }),
    ) as unknown as Record<(typeof parts)[number], T.InstancedMesh>;
    const positions = new Map<number, T.Vector3>();
    const badges: T.Sprite[] = [];
    let badgeSignature = '';
    const clearBadges = () => {
      for (const badge of badges) {
        scene.remove(badge);
        badge.material.map?.dispose();
        badge.material.dispose();
      }
      badges.length = 0;
    };
    const makeBadge = (id: number, label: string, concern: boolean) => {
      const surface = document.createElement('canvas');
      surface.width = 384;
      surface.height = 112;
      const ctx = surface.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = concern ? '#fff0ce' : '#f5f7e8';
      ctx.beginPath();
      ctx.roundRect(1, 1, 382, 96, 24);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(180, 94);
      ctx.lineTo(192, 110);
      ctx.lineTo(204, 94);
      ctx.fill();
      ctx.fillStyle = '#355340';
      ctx.font = 'bold 27px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 192, 58);
      const texture = new T.CanvasTexture(surface);
      texture.colorSpace = T.SRGBColorSpace;
      const sprite = new T.Sprite(
        new T.SpriteMaterial({ map: texture, depthTest: false }),
      );
      sprite.scale.set(3.2, 0.94, 1);
      sprite.userData.person = id;
      sprite.renderOrder = 10;
      badges.push(sprite);
      scene.add(sprite);
    };
    const orientation = new T.Quaternion(),
      axis = new T.Vector3(0, 1, 0),
      color = new T.Color();
    const offset = new T.Vector3();
    const ring = new T.Mesh(
      geo(new T.RingGeometry(1.55, 1.63, 48)),
      new T.MeshBasicMaterial({ color: '#ffdf8d', side: T.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.14;
    ring.visible = false;
    scene.add(ring);
    const hover = new T.Mesh(
      geo(new T.PlaneGeometry(3, 3)),
      new T.MeshBasicMaterial({
        color: '#e5f1bd',
        transparent: true,
        opacity: 0.3,
        side: T.DoubleSide,
      }),
    );
    hover.rotation.x = -Math.PI / 2;
    hover.position.y = 0.17;
    hover.visible = false;
    scene.add(hover);
    const raycaster = new T.Raycaster(),
      pointer = new T.Vector2(),
      plane = new T.Plane(new T.Vector3(0, 1, 0), 0),
      intersection = new T.Vector3();
    let down = { x: 0, y: 0, time: 0 };
    const point = (e: PointerEvent) => {
      const r = element.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    };
    const pointers = new Set<number>();
    let gesture = false;
    const start = (e: PointerEvent) => {
      pointers.add(e.pointerId);
      gesture = pointers.size > 1 || (pointers.size > 0 && gesture);
      down = { x: e.clientX, y: e.clientY, time: performance.now() };
    };
    const move = (e: PointerEvent) => {
      if (!latest.current.building) return;
      point(e);
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        const x = Math.round(intersection.x / UNIT + 8),
          y = Math.round(intersection.z / UNIT + 8);
        hover.visible = isLand(x, y);
        hover.position.set((x - 8) * UNIT, 0.17, (y - 8) * UNIT);
      }
    };
    const end = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (gesture || e.button !== 0) {
        if (!pointers.size) gesture = false;
        return;
      }
      if (
        Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7 ||
        performance.now() - down.time > 600
      )
        return;
      point(e);
      if (!latest.current.building) {
        const bubbles = raycaster.intersectObjects(badges);
        if (bubbles[0]) {
          latest.current.onPerson(bubbles[0].object.userData.person);
          return;
        }
        const hits = raycaster.intersectObjects(Object.values(humans));
        if (hits[0]?.instanceId !== undefined) {
          latest.current.onPerson(hits[0].instanceId);
          return;
        }
      }
      const hits = raycaster.intersectObjects(buildingMeshes, true);
      if (!latest.current.building && hits.length) {
        const first = hits[0];
        if (first.instanceId !== undefined && first.object.userData.keys) {
          const key = first.object.userData.keys[first.instanceId];
          if (key !== undefined) {
            latest.current.onPick(key % 17, Math.floor(key / 17));
            return;
          }
        }
        let object: T.Object3D | null = hits[0].object;
        while (object && object.userData.key === undefined)
          object = object.parent;
        if (object) {
          const key = object.userData.key as number;
          latest.current.onPick(key % 17, Math.floor(key / 17));
          return;
        }
      }
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        const x = Math.round(intersection.x / UNIT + 8),
          y = Math.round(intersection.z / UNIT + 8);
        latest.current.onPick(x, y);
      }
    };
    const keyDown = (e: KeyboardEvent) => {
      const current = latest.current.selected ?? 144;
      let x = current % 17,
        y = Math.floor(current / 17);
      if (e.key === 'ArrowLeft') x--;
      else if (e.key === 'ArrowRight') x++;
      else if (e.key === 'ArrowUp') y--;
      else if (e.key === 'ArrowDown') y++;
      else if (e.key === 'Enter') {
        latest.current.onPick(x, y);
        e.preventDefault();
        return;
      } else if (e.key === 'Home') {
        controls.target.set(0, 0, 0);
        camera.position.set(39, 47, 43);
        camera.zoom = 1.05;
        camera.updateProjectionMatrix();
        return;
      } else return;
      e.preventDefault();
      if (isLand(x, y)) {
        ring.position.copy(xy(x, y));
        ring.position.y = 0.14;
        ring.visible = true;
        latest.current.onHighlight(y * 17 + x);
      }
    };
    element.addEventListener('pointerdown', start);
    element.addEventListener('pointermove', move);
    const cancel = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (!pointers.size) gesture = false;
    };
    element.addEventListener('pointercancel', cancel);
    element.addEventListener('pointerup', end);
    element.addEventListener('keydown', keyDown);
    const resize = () => {
      const r = element.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      const aspect = r.width / r.height;
      const h = r.width < 700 ? 31 : 24;
      camera.left = -h * aspect;
      camera.right = h * aspect;
      camera.top = h;
      camera.bottom = -h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    let frame = 0,
      last = 0,
      nightWas = false,
      qualityWas = latest.current.quality;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (
        document.hidden ||
        now - last < 1000 / (qualityWas === 'low' ? 30 : 60)
      )
        return;
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      const { state: s, selected, night, quality } = latest.current;
      if (quality !== qualityWas) {
        qualityWas = quality;
        renderer.setPixelRatio(
          Math.min(devicePixelRatio, quality === 'low' ? 1 : 1.6),
        );
        renderer.shadowMap.enabled = quality === 'high';
      }
      if (night !== nightWas) {
        nightWas = night;
        scene.background = new T.Color(night ? '#223e56' : '#bfd7d6');
        scene.fog = new T.Fog(night ? '#223e56' : '#bfd7d6', 65, 150);
        hemi.intensity = night ? 1.2 : 2.3;
        sun.intensity = night ? 0.8 : 3.1;
        sun.color.set(night ? '#b0c9e5' : '#fff0cb');
      }
      const nextSignature = JSON.stringify(s.tiles);
      if (nextSignature !== signature) {
        signature = nextSignature;
        if (!framedCommunity && s.tiles.length) {
          framedCommunity = true;
          const center = xy(s.tiles[0].x, s.tiles[0].y),
            delta = center.clone().sub(controls.target);
          camera.position.add(delta);
          controls.target.copy(center);
          camera.zoom = 2.8;
          camera.updateProjectionMatrix();
        }
        staticBatches.forEach((mesh) => mesh.dispose());
        staticBatches.length = 0;
        buildings.clear();
        dynamicGeometries.forEach((g) => {
          g.dispose();
          resources.delete(g);
        });
        dynamicGeometries.clear();
        buildingMeshes.length = 0;
        waterMeshes.length = 0;
        // Narrow paths connect neighboring places; walking remains a lightweight visual interpolation.
        s.tiles.forEach((t, index) => {
          if (!index) return;
          const near = s.tiles
            .slice(0, index)
            .reduce((a, b) =>
              Math.hypot(a.x - t.x, a.y - t.y) <
              Math.hypot(b.x - t.x, b.y - t.y)
                ? a
                : b,
            );
          const from = xy(t.x, t.y),
            to = xy(near.x, near.y),
            length = from.distanceTo(to);
          const path = block(
            buildings,
            (from.x + to.x) / 2,
            0.11,
            (from.z + to.z) / 2,
            0.5,
            0.03,
            length,
            '#d6c8a8',
          );
          path.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
        });
        s.tiles.forEach(renderPlace);
        // Batch repeated geometry/materials across the city into a few GPU draw calls.
        buildings.updateMatrixWorld(true);
        const batches = new Map<
          string,
          {
            geometry: T.BufferGeometry;
            material: T.Material | T.Material[];
            items: { matrix: T.Matrix4; key: number | undefined }[];
          }
        >();
        buildings.traverse((object) => {
          if (!(object instanceof T.Mesh)) return;
          const material = object.material,
            id =
              object.geometry.uuid +
              (Array.isArray(material)
                ? material.map((m) => m.uuid).join()
                : material.uuid);
          let owner: T.Object3D | null = object;
          while (owner && owner.userData.key === undefined)
            owner = owner.parent;
          if (!batches.has(id))
            batches.set(id, { geometry: object.geometry, material, items: [] });
          batches
            .get(id)!
            .items.push({
              matrix: object.matrixWorld.clone(),
              key: owner?.userData.key,
            });
        });
        buildings.clear();
        buildingMeshes.length = 0;
        for (const batch of batches.values()) {
          const mesh = new T.InstancedMesh(
            batch.geometry,
            batch.material,
            batch.items.length,
          );
          batch.items.forEach((item, i) => mesh.setMatrixAt(i, item.matrix));
          mesh.userData.keys = batch.items.map((item) => item.key);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          staticBatches.push(mesh);
          buildingMeshes.push(mesh);
          buildings.add(mesh);
        }
        const visibleTrees = treeSites.map(
          (p) =>
            !s.tiles.some(
              (t) =>
                Math.abs((t.x - 8) * UNIT - p.x) < 1.6 &&
                Math.abs((t.y - 8) * UNIT - p.y) < 1.6,
            ),
        );
        for (let i = 0; i < visibleTrees.length; i++) {
          [trunks, crowns, tips].forEach((mesh, index) => {
            dummy.matrix.copy(originalTrees[index][i]);
            if (!visibleTrees[i])
              dummy.matrix.scale(new T.Vector3(0.0001, 0.0001, 0.0001));
            mesh.setMatrixAt(i, dummy.matrix);
            mesh.instanceMatrix.needsUpdate = true;
          });
        }
      }
      ring.visible = selected !== null;
      if (selected !== null) {
        ring.position.copy(xy(selected % 17, Math.floor(selected / 17)));
        ring.position.y = 0.14;
      }
      hover.visible = hover.visible && latest.current.building;
      const lives = s.community?.lives || [];
      const badgeNext = `${s.community?.clock}-${signature}`;
      if (badgeNext !== badgeSignature) {
        badgeSignature = badgeNext;
        clearBadges();
        const worried = lives
          .filter((l) => l.comfort < 42 || l.belonging < 42)
          .slice(0, 2);
        worried.forEach((l) =>
          makeBadge(
            l.id,
            l.comfort < 42 ? 'Need a better home' : 'Could use company',
            true,
          ),
        );
        const gathering = s.community?.groups.find(
          (g) =>
            lives.filter(
              (l) =>
                g.members.includes(l.id) &&
                l.target === g.venue &&
                l.activity === g.activity,
            ).length >= 2,
        );
        if (gathering)
          makeBadge(gathering.founder, 'Our circle is meeting', false);
      }
      const n = Math.min(lives.length, max);
      Object.values(humans).forEach((mesh) => (mesh.count = n));
      for (let i = 0; i < n; i++) {
        const l: Life = lives[i],
          target = xy(l.target % 17, Math.floor(l.target / 17));
        target.x += (hash(i + 21) - 0.5) * 2.2;
        target.z += (hash(i + 47) - 0.5) * 2.2;
        const position =
          positions.get(i) || xy(l.home % 17, Math.floor(l.home / 17));
        const distance = position.distanceTo(target),
          walking = distance > 0.08;
        const angle = walking
          ? Math.atan2(target.x - position.x, target.z - position.z)
          : hash(i) * 6.28;
        position.lerp(target, Math.min(1, dt * (walking ? 1.3 : 4)));
        positions.set(i, position);
        orientation.setFromAxisAngle(axis, angle);
        const swimming = l.activity === 'swim' && !walking,
          dancing = l.activity === 'dance' && !walking;
        const phase = reduced ? 0 : now * 0.006 + i;
        const swing = walking
          ? Math.sin(phase) * 0.26
          : dancing
            ? Math.sin(phase * 1.8) * 0.16
            : 0;
        const bounce = dancing ? Math.abs(swing) * 0.35 : 0;
        const data: Record<
          (typeof parts)[number],
          {
            x: number;
            y: number;
            z: number;
            w: number;
            h: number;
            d: number;
            color: string;
          }
        > = {
          body: {
            x: 0,
            y: 0.48,
            z: 0,
            w: 0.24,
            h: 0.35,
            d: 0.16,
            color: profile(i).color,
          },
          head: {
            x: 0,
            y: 0.77,
            z: 0,
            w: 0.115,
            h: 0.14,
            d: 0.11,
            color: ['#edc9a7', '#b88461', '#815d49', '#d6a381'][i % 4],
          },
          hair: {
            x: 0,
            y: 0.85,
            z: -0.015,
            w: 0.118,
            h: 0.085,
            d: 0.115,
            color: ['#52463b', '#372f2b', '#c1a375', '#807c73'][i % 4],
          },
          leftLeg: {
            x: -0.065,
            y: 0.19 + Math.max(0, swing) * 0.15,
            z: swing,
            w: 0.075,
            h: 0.32,
            d: 0.085,
            color: '#637a78',
          },
          rightLeg: {
            x: 0.065,
            y: 0.19 + Math.max(0, -swing) * 0.15,
            z: -swing,
            w: 0.075,
            h: 0.32,
            d: 0.085,
            color: '#637a78',
          },
          leftArm: {
            x: -0.17,
            y: 0.48 + (dancing ? 0.12 : 0),
            z: -swing * 0.6,
            w: 0.065,
            h: 0.3,
            d: 0.075,
            color: profile(i).color,
          },
          rightArm: {
            x: 0.17,
            y: 0.48 + (dancing ? 0.12 : 0),
            z: swing * 0.6,
            w: 0.065,
            h: 0.3,
            d: 0.075,
            color: profile(i).color,
          },
        };
        for (const part of parts) {
          const d = data[part];
          offset
            .set(d.x, swimming ? d.y * 0.42 + 0.14 : d.y + bounce, d.z)
            .applyQuaternion(orientation);
          dummy.position.copy(position).add(offset);
          dummy.quaternion.copy(orientation);
          dummy.scale.set(d.w, d.h, d.d);
          dummy.updateMatrix();
          humans[part].setMatrixAt(i, dummy.matrix);
          humans[part].setColorAt(i, color.set(d.color));
        }
      }
      badges.forEach((badge) => {
        const position = positions.get(badge.userData.person);
        if (position)
          badge.position
            .copy(position)
            .add(
              new T.Vector3(
                badges.indexOf(badge) % 2 ? 1.8 : -1.2,
                1.9 + badges.indexOf(badge) * 0.55,
                0,
              ),
            );
        badge.visible = camera.zoom >= 1.25;
      });
      Object.values(humans).forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      });
      for (const water of waterMeshes) {
        const material = water.material as T.MeshStandardMaterial;
        material.color.set(night ? '#468d9e' : '#65bac5');
      }
      controls.update();
      const bounded = controls.target
        .clone()
        .clamp(new T.Vector3(-26, 0, -26), new T.Vector3(26, 0, 26));
      camera.position.add(bounded.clone().sub(controls.target));
      controls.target.copy(bounded);
      renderer.render(scene, camera);
      element.dataset.drawCalls = String(renderer.info.render.calls);
      element.dataset.triangles = String(renderer.info.render.triangles);
    };
    const loss = (e: Event) => {
      e.preventDefault();
      setError(
        'The 3D view paused. Reload to restore graphics; your city is saved.',
      );
    };
    element.addEventListener('webglcontextlost', loss);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      clearBadges();
      staticBatches.forEach((mesh) => mesh.dispose());
      controls.dispose();
      element.removeEventListener('pointerdown', start);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', end);
      element.removeEventListener('pointercancel', cancel);
      element.removeEventListener('keydown', keyDown);
      element.removeEventListener('webglcontextlost', loss);
      resources.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      [...Object.values(humans), trunks, crowns, tips].forEach((mesh) =>
        mesh.dispose(),
      );
      renderer.dispose();
      controlsRef.current = null;
      cameraRef.current = null;
    };
  }, []);
  return (
    <>
      <canvas
        ref={canvas}
        className="community-world"
        tabIndex={0}
        aria-label="NOVA 3D landscape. Drag to pan, pinch to zoom, right drag to rotate. Select a resident or a plot. Arrow keys select land, Enter chooses it."
      />
      {error && <output className="world-error">{error}</output>}
    </>
  );
}
