import { useEffect, useRef } from "react";
import * as THREE from "three";

const ORANGE = 0xf97316;

type FacadeVariant = {
  base: string;
  cols: number;
  rows: number;
  litChance: number;
};

const FACADES: FacadeVariant[] = [
  { base: "#efece8", cols: 3, rows: 3, litChance: 0.4 },
  { base: "#e2ddd6", cols: 3, rows: 4, litChance: 0.35 },
  { base: "#d9d4ce", cols: 4, rows: 3, litChance: 0.3 },
  { base: "#c7c1b9", cols: 3, rows: 3, litChance: 0.3 },
  { base: "#b6b0a8", cols: 5, rows: 7, litChance: 0.3 },
  { base: "#d9d4ce", cols: 4, rows: 8, litChance: 0.28 },
  { base: "#6b6660", cols: 5, rows: 14, litChance: 0.34 },
  { base: "#4b4742", cols: 5, rows: 12, litChance: 0.36 },
];

const ROOF_COLORS = [0xc2410c, 0x9a3412, 0x7c2d12, 0x57534e, 0x3f3f46];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function facadeTextures(v: FacadeVariant, rand: () => number) {
  const W = 256;
  const H = 512;
  const albedo = document.createElement("canvas");
  albedo.width = W;
  albedo.height = H;
  const a = albedo.getContext("2d")!;
  const glow = document.createElement("canvas");
  glow.width = W;
  glow.height = H;
  const g = glow.getContext("2d")!;
  a.fillStyle = v.base;
  a.fillRect(0, 0, W, H);
  g.fillStyle = "#000000";
  g.fillRect(0, 0, W, H);
  const mx = W * 0.1;
  const my = H * 0.05;
  const cw = (W - mx * 2) / v.cols;
  const ch = (H - my * 2) / v.rows;
  for (let r = 0; r < v.rows; r++) {
    for (let c = 0; c < v.cols; c++) {
      const wx = mx + c * cw + cw * 0.22;
      const wy = my + r * ch + ch * 0.24;
      const ww = cw * 0.56;
      const wh = ch * 0.48;
      const lit = rand() < v.litChance;
      a.fillStyle = lit ? "#ffd9a3" : "#3b3f4a";
      a.fillRect(wx, wy, ww, wh);
      if (lit) {
        g.fillStyle = "#ffc37a";
        g.fillRect(wx, wy, ww, wh);
      }
    }
  }
  a.fillStyle = "#2d2a26";
  a.fillRect(W / 2 - W * 0.07, H - my - ch * 0.92, W * 0.14, ch * 0.92);
  const map = new THREE.CanvasTexture(albedo);
  const emissiveMap = new THREE.CanvasTexture(glow);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

function makeSpriteTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function HeroScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = mulberry32(2082);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 15, 32);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const camBase = new THREE.Vector3(8.8, 5.6, 12.2);
    camera.position.copy(camBase);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2cb, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(7, 11, 5);
    scene.add(key);
    const warm = new THREE.PointLight(ORANGE, 30, 26);
    warm.position.set(-5, 4.5, 4);
    scene.add(warm);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(x: T): T => {
      disposables.push(x);
      return x;
    };

    const town = new THREE.Group();
    scene.add(town);

    const plinthGeo = track(new THREE.CylinderGeometry(6.7, 6.7, 0.24, 64));
    const plinthMat = track(new THREE.MeshStandardMaterial({ color: 0xf3f1ee, roughness: 0.9 }));
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.12;
    town.add(plinth);

    const roadMat = track(new THREE.MeshStandardMaterial({ color: 0xd8d4cf, roughness: 1 }));
    const roadNS = new THREE.Mesh(track(new THREE.BoxGeometry(0.95, 0.02, 13.4)), roadMat);
    roadNS.position.y = 0.011;
    town.add(roadNS);
    const roadEW = new THREE.Mesh(track(new THREE.BoxGeometry(13.4, 0.02, 0.95)), roadMat);
    roadEW.position.y = 0.011;
    town.add(roadEW);

    const plaza = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.15, 1.15, 0.03, 40)),
      track(new THREE.MeshStandardMaterial({ color: 0xfcd9b0, roughness: 0.95 })),
    );
    plaza.position.y = 0.016;
    town.add(plaza);

    const facadeMats = FACADES.map((v) => {
      const { map, emissiveMap } = facadeTextures(v, rand);
      track(map);
      track(emissiveMap);
      return track(
        new THREE.MeshStandardMaterial({
          map,
          emissiveMap,
          emissive: 0xffffff,
          emissiveIntensity: 0.55,
          roughness: 0.65,
          metalness: 0.04,
        }),
      );
    });
    const roofMats = ROOF_COLORS.map((c) =>
      track(new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.05 })),
    );
    const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x35322e, roughness: 0.9 }));
    const awningMat = track(new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.6 }));
    const trunkMat = track(new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: 1 }));
    const leafMats = [
      track(new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.95 })),
      track(new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.95 })),
    ];
    const poleMat = track(
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6, metalness: 0.3 }),
    );

    const antennaTips: THREE.MeshStandardMaterial[] = [];

    const addStructure = (
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      variant: number,
    ) => {
      const geo = track(new THREE.BoxGeometry(w, h, d));
      const fm = facadeMats[variant];
      const roof = roofMats[Math.floor(rand() * roofMats.length)];
      const mesh = new THREE.Mesh(geo, [fm, fm, roof, darkMat, fm, fm]);
      mesh.position.set(x, h / 2, z);
      mesh.rotation.y = (rand() - 0.5) * 0.14;
      town.add(mesh);

      if (variant <= 1) {
        const roofH = 0.42 + rand() * 0.25;
        const rGeo = track(new THREE.ConeGeometry(Math.max(w, d) * 0.74, roofH, 4));
        const rMesh = new THREE.Mesh(rGeo, roof);
        rMesh.position.set(x, h + roofH / 2 - 0.02, z);
        rMesh.rotation.y = Math.PI / 4 + mesh.rotation.y;
        town.add(rMesh);
      } else if (variant <= 3) {
        const aGeo = track(new THREE.BoxGeometry(w * 0.92, 0.05, 0.3));
        const awning = new THREE.Mesh(aGeo, awningMat);
        awning.position.set(x, h * 0.72, z + d / 2 + 0.13);
        awning.rotation.x = 0.28;
        town.add(awning);
      } else {
        const pGeo = track(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6));
        const pole = new THREE.Mesh(pGeo, poleMat);
        pole.position.set(x, h + 0.25, z);
        town.add(pole);
        const tipGeo = track(new THREE.SphereGeometry(0.032, 8, 8));
        const tipMat = track(
          new THREE.MeshStandardMaterial({
            color: ORANGE,
            emissive: ORANGE,
            emissiveIntensity: 1.4,
          }),
        );
        antennaTips.push(tipMat);
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(x, h + 0.52, z);
        town.add(tip);
      }
    };

    const addTree = (x: number, z: number, s: number) => {
      const trunk = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.045 * s, 0.06 * s, 0.22 * s, 6)),
        trunkMat,
      );
      trunk.position.set(x, 0.11 * s, z);
      town.add(trunk);
      const lower = new THREE.Mesh(
        track(new THREE.ConeGeometry(0.27 * s, 0.5 * s, 7)),
        leafMats[0],
      );
      lower.position.set(x, 0.22 * s + 0.25 * s, z);
      town.add(lower);
      const upper = new THREE.Mesh(
        track(new THREE.ConeGeometry(0.18 * s, 0.36 * s, 7)),
        leafMats[1],
      );
      upper.position.set(x, 0.22 * s + 0.55 * s, z);
      town.add(upper);
    };

    const addStreetlight = (x: number, z: number) => {
      const pole = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.016, 0.022, 0.55, 6)),
        poleMat,
      );
      pole.position.set(x, 0.28, z);
      town.add(pole);
      const lamp = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.055, 10, 10)),
        track(
          new THREE.MeshStandardMaterial({
            color: 0xffe3b3,
            emissive: 0xffc37a,
            emissiveIntensity: 1.8,
          }),
        ),
      );
      lamp.position.set(x, 0.58, z);
      town.add(lamp);
    };

    for (let gx = -3; gx <= 3; gx++) {
      for (let gz = -3; gz <= 3; gz++) {
        if (gx === 0 || gz === 0) continue;
        const x = gx * 1.62 + (rand() - 0.5) * 0.34;
        const z = gz * 1.62 + (rand() - 0.5) * 0.34;
        const dist = Math.sqrt(x * x + z * z);
        if (dist > 5.6) continue;
        if (dist < 1.9) {
          if (rand() < 0.5) addTree(x, z, 0.9 + rand() * 0.4);
          continue;
        }
        const roll = rand();
        if (dist < 3.1 && roll < 0.62) {
          addStructure(
            x,
            z,
            0.95 + rand() * 0.35,
            2.7 + rand() * 1.9,
            0.95 + rand() * 0.35,
            6 + Math.floor(rand() * 2),
          );
        } else if (dist < 4.2 && roll < 0.55) {
          addStructure(
            x,
            z,
            0.9 + rand() * 0.3,
            1.7 + rand() * 1.0,
            0.9 + rand() * 0.3,
            4 + Math.floor(rand() * 2),
          );
        } else if (roll < 0.72) {
          addStructure(
            x,
            z,
            0.8 + rand() * 0.3,
            0.85 + rand() * 0.5,
            0.8 + rand() * 0.3,
            Math.floor(rand() * 4),
          );
        } else {
          addTree(x, z, 0.9 + rand() * 0.5);
        }
      }
    }

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      addStreetlight(Math.cos(a) * 1.55, Math.sin(a) * 1.55);
    }
    addTree(2.6, 2.2, 1.1);
    addTree(-3.1, -1.6, 1.0);
    addTree(-1.4, 3.4, 1.2);
    addTree(4.4, -2.6, 0.9);

    const cloudGroup = new THREE.Group();
    const cloudMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xe7ebf2,
        roughness: 1,
        transparent: true,
        opacity: 0.95,
      }),
    );
    const cloudSpecs: [number, number, number, number][] = [
      [4.6, 5.6, -2.5, 1.0],
      [-4.2, 6.3, 2.8, 0.8],
      [1.5, 6.8, 5.2, 1.15],
      [-5.8, 5.2, -4.6, 0.7],
    ];
    for (const [cx, cy, cz, s] of cloudSpecs) {
      const cloud = new THREE.Group();
      for (const [ox, oy, r] of [
        [-0.45, 0, 0.5],
        [0.05, 0.14, 0.62],
        [0.5, -0.02, 0.42],
      ] as [number, number, number][]) {
        const puff = new THREE.Mesh(track(new THREE.SphereGeometry(r * s, 12, 12)), cloudMat);
        puff.position.set(ox * s, oy * s, 0);
        cloud.add(puff);
      }
      cloud.position.set(cx, cy, cz);
      cloudGroup.add(cloud);
    }
    scene.add(cloudGroup);

    const balloon = new THREE.Group();
    const envelope = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.42, 18, 18)),
      track(new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.45 })),
    );
    envelope.scale.set(1, 1.14, 1);
    balloon.add(envelope);
    const basket = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.17, 0.13, 0.17)),
      track(new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.9 })),
    );
    basket.position.y = -0.62;
    balloon.add(basket);
    balloon.position.set(6.3, 4.9, 0);
    scene.add(balloon);

    const dustCount = 200;
    const dustPos = new Float32Array(dustCount * 3);
    const dustSpeed = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (rand() - 0.5) * 18;
      dustPos[i * 3 + 1] = rand() * 8 - 1;
      dustPos[i * 3 + 2] = (rand() - 0.5) * 14;
      dustSpeed[i] = 0.12 + rand() * 0.3;
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustTex = track(makeSpriteTexture("rgba(113,113,122,0.9)", "rgba(113,113,122,0)"));
    const dustMat = track(
      new THREE.PointsMaterial({
        size: 0.09,
        map: dustTex,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    );
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const sparkCount = 40;
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkSpeed = new Float32Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = (rand() - 0.5) * 14;
      sparkPos[i * 3 + 1] = rand() * 7 - 1;
      sparkPos[i * 3 + 2] = (rand() - 0.5) * 10;
      sparkSpeed[i] = 0.18 + rand() * 0.35;
    }
    const sparkGeo = track(new THREE.BufferGeometry());
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparkTex = track(makeSpriteTexture("rgba(249,115,22,1)", "rgba(249,115,22,0)"));
    const sparkMat = track(
      new THREE.PointsMaterial({
        size: 0.15,
        map: sparkTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext("2d")!;
    const sg = sctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    sg.addColorStop(0, "rgba(24,24,27,0.26)");
    sg.addColorStop(1, "rgba(24,24,27,0)");
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, 256, 256);
    const shadowTex = track(new THREE.CanvasTexture(shadowCanvas));
    const shadowMat = track(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(15.5, 15.5)), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.5;
    scene.add(shadow);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const clock = new THREE.Clock();
    let raf = 0;
    let playing = false;
    let onScreen = true;
    let tabVisible = true;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      town.rotation.y += dt * 0.06;
      town.position.y = Math.sin(t * 0.6) * 0.045;
      cloudGroup.rotation.y -= dt * 0.02;

      const glow = 0.55 + Math.sin(t * 1.3) * 0.12;
      for (const fm of facadeMats) fm.emissiveIntensity = glow;
      const blink = 1.2 + Math.sin(t * 2.6) * 1.1;
      for (const tm of antennaTips) tm.emissiveIntensity = blink;

      const ba = t * 0.11;
      balloon.position.set(Math.cos(ba) * 6.3, 4.9 + Math.sin(t * 0.7) * 0.2, Math.sin(ba) * 6.3);
      balloon.rotation.y = -ba;

      const dp = dust.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = dp.getY(i) + dustSpeed[i] * dt;
        if (y > 6.5) y = -1;
        dp.setY(i, y);
      }
      dp.needsUpdate = true;

      const sp = sparks.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < sparkCount; i++) {
        let y = sp.getY(i) + sparkSpeed[i] * dt;
        if (y > 5.5) y = -1.2;
        sp.setY(i, y);
      }
      sp.needsUpdate = true;

      camera.position.x += (camBase.x + pointer.x * 0.9 - camera.position.x) * 0.04;
      camera.position.y += (camBase.y - pointer.y * 0.55 - camera.position.y) * 0.04;
      camera.lookAt(0, 0.7, 0);

      renderer.render(scene, camera);
    };

    const setPlaying = (v: boolean) => {
      if (v && !playing) {
        playing = true;
        clock.getDelta();
        raf = requestAnimationFrame(tick);
      } else if (!v && playing) {
        playing = false;
        cancelAnimationFrame(raf);
      }
    };

    const setSize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      if (!playing) renderer.render(scene, camera);
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(mount);
    setSize();

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      setPlaying(onScreen && tabVisible && !reducedMotion);
    });
    io.observe(mount);

    const onVis = () => {
      tabVisible = document.visibilityState === "visible";
      setPlaying(onScreen && tabVisible && !reducedMotion);
    };
    document.addEventListener("visibilitychange", onVis);

    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove);
      setPlaying(true);
    }

    return () => {
      setPlaying(false);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onPointerMove);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
