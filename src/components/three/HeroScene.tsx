import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const ORANGE = 0xf97316;
const NEUTRALS = [0xe4e4e7, 0xd4d4d8, 0xa1a1aa, 0x71717a, 0x52525b];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSpriteTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function HeroScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 16, 34);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const camBase = new THREE.Vector3(8.5, 5.5, 12);
    camera.position.copy(camBase);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xdcd5cf, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(6, 10, 4);
    scene.add(key);
    const warm = new THREE.PointLight(ORANGE, 42, 30);
    warm.position.set(-5, 4.5, 3);
    scene.add(warm);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(x: T): T => {
      disposables.push(x);
      return x;
    };

    const city = new THREE.Group();
    scene.add(city);

    const rand = mulberry32(2082);
    const addBuilding = (
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: number,
      emissive: number,
    ) => {
      const geo = track(new RoundedBoxGeometry(w, h, d, 3, 0.07));
      const mat = track(
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.38,
          metalness: 0.08,
          emissive: ORANGE,
          emissiveIntensity: emissive,
        }),
      );
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2 - 1.6, z);
      mesh.userData.float = {
        phase: rand() * Math.PI * 2,
        speed: 0.5 + rand() * 0.6,
        amp: 0.08 + rand() * 0.14,
        baseY: h / 2 - 1.6,
      };
      city.add(mesh);
    };

    addBuilding(0.2, -0.5, 1.5, 5.1, 1.5, ORANGE, 0.14);
    addBuilding(-2.4, 0.8, 1.05, 2.6, 1.05, NEUTRALS[3], 0);
    addBuilding(2.3, 0.6, 1.15, 3.1, 1.15, NEUTRALS[2], 0);
    addBuilding(3.4, -1.6, 0.9, 1.9, 0.9, NEUTRALS[1], 0);
    addBuilding(-1.4, -2.3, 0.85, 2.2, 0.85, NEUTRALS[0], 0);
    addBuilding(-3.3, -1.4, 1.0, 1.5, 1.0, NEUTRALS[2], 0);
    addBuilding(1.5, 2.4, 0.8, 1.3, 0.8, ORANGE, 0.1);
    addBuilding(-2.2, 3.0, 0.95, 2.0, 0.95, NEUTRALS[4], 0);
    addBuilding(2.9, 3.2, 0.7, 1.1, 0.7, NEUTRALS[1], 0);
    addBuilding(-0.9, 3.4, 0.75, 1.6, 0.75, NEUTRALS[2], 0);
    addBuilding(0.4, -3.2, 0.9, 2.4, 0.9, NEUTRALS[1], 0);
    addBuilding(-4.2, 0.4, 0.7, 1.0, 0.7, NEUTRALS[0], 0);
    addBuilding(4.3, 1.4, 0.65, 1.4, 0.65, NEUTRALS[3], 0);

    const orbitGeo = track(new THREE.TorusGeometry(4.9, 0.015, 8, 128));
    const orbitMat = track(
      new THREE.MeshBasicMaterial({
        color: 0xd4d4d8,
        transparent: true,
        opacity: 0.55,
      }),
    );
    const orbit = new THREE.Mesh(orbitGeo, orbitMat);
    orbit.rotation.x = Math.PI / 2.25;
    orbit.position.y = -0.4;
    scene.add(orbit);

    const satGeo = track(new THREE.IcosahedronGeometry(0.16, 0));
    const satMat = track(
      new THREE.MeshStandardMaterial({
        color: ORANGE,
        roughness: 0.3,
        metalness: 0.2,
      }),
    );
    const satellite = new THREE.Mesh(satGeo, satMat);
    scene.add(satellite);

    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext("2d")!;
    const sg = sctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    sg.addColorStop(0, "rgba(24,24,27,0.28)");
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
    const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(13, 13)), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -2.35;
    scene.add(shadow);

    const dustCount = 200;
    const dustPos = new Float32Array(dustCount * 3);
    const dustSpeed = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (rand() - 0.5) * 18;
      dustPos[i * 3 + 1] = rand() * 8 - 2;
      dustPos[i * 3 + 2] = (rand() - 0.5) * 14;
      dustSpeed[i] = 0.15 + rand() * 0.35;
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustTex = track(makeSpriteTexture("rgba(113,113,122,0.9)", "rgba(113,113,122,0)"));
    const dustMat = track(
      new THREE.PointsMaterial({
        size: 0.1,
        map: dustTex,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const sparkCount = 36;
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkSpeed = new Float32Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = (rand() - 0.5) * 14;
      sparkPos[i * 3 + 1] = rand() * 7 - 2;
      sparkPos[i * 3 + 2] = (rand() - 0.5) * 10;
      sparkSpeed[i] = 0.2 + rand() * 0.4;
    }
    const sparkGeo = track(new THREE.BufferGeometry());
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
    const sparkTex = track(makeSpriteTexture("rgba(249,115,22,1)", "rgba(249,115,22,0)"));
    const sparkMat = track(
      new THREE.PointsMaterial({
        size: 0.16,
        map: sparkTex,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

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

      city.rotation.y += dt * 0.07;
      orbit.rotation.z += dt * 0.05;

      for (const child of city.children) {
        const f = child.userData.float as {
          phase: number;
          speed: number;
          amp: number;
          baseY: number;
        };
        if (f) {
          child.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * f.amp;
        }
      }

      const sa = t * 0.35;
      satellite.position.set(
        Math.cos(sa) * 4.9,
        Math.sin(sa) * 4.9 * Math.sin(Math.PI / 2.25) - 0.4,
        Math.sin(sa) * 4.9 * Math.cos(Math.PI / 2.25),
      );
      satellite.rotation.x += dt;
      satellite.rotation.y += dt * 1.4;

      const dp = dust.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = dp.getY(i) + dustSpeed[i] * dt;
        if (y > 6) y = -2;
        dp.setY(i, y);
      }
      dp.needsUpdate = true;

      const sp = sparks.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < sparkCount; i++) {
        let y = sp.getY(i) + sparkSpeed[i] * dt;
        if (y > 5.5) y = -1.5;
        sp.setY(i, y);
      }
      sp.needsUpdate = true;

      camera.position.x += (camBase.x + pointer.x * 0.9 - camera.position.x) * 0.04;
      camera.position.y += (camBase.y - pointer.y * 0.6 - camera.position.y) * 0.04;
      camera.lookAt(0, 0.4, 0);

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
