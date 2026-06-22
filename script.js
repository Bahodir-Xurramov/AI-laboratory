/* ============================================================
   Kutubxona AI — interactive holographic lab scene
   Cyan/blue wireframe data-city + a slowly turning "knowledge"
   globe, drifting particles, and a soft parallax tilt that
   follows the cursor.
   ============================================================ */

(function () {
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03050a, 0.045);

  const camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 6, 13);
  camera.lookAt(0, 1.5, 0);

  // ---------- groups ----------
  const rig = new THREE.Group();      // tilts with the mouse
  const cityGroup = new THREE.Group();
  const globeGroup = new THREE.Group();
  const particleGroup = new THREE.Group();
  rig.add(cityGroup, globeGroup, particleGroup);
  scene.add(rig);

  // ---------- colors ----------
  const CYAN = 0x5eead4;
  const BLUE = 0x38bdf8;
  const WHITE = 0xeafffb;

  // ---------- base light pad (the glowing platform the towers sit on) ----------
  const padGeo = new THREE.CircleGeometry(5.6, 64);
  const padMat = new THREE.MeshBasicMaterial({
    color: 0x0a3a40,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0;
  cityGroup.add(pad);

  const ringGeo = new THREE.RingGeometry(5.55, 5.7, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  cityGroup.add(ring);

  // ---------- the data-city: wireframe towers of varying height ----------
  const towers = [];
  const towerCount = 70;
  for (let i = 0; i < towerCount; i++) {
    const radius = Math.random() * 4.6;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const height = 0.4 + Math.random() * 3.4 * (1 - radius / 5.2);
    const w = 0.12 + Math.random() * 0.18;

    const geo = new THREE.BoxGeometry(w, height, w);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: Math.random() > 0.5 ? CYAN : BLUE,
      transparent: true,
      opacity: 0.85
    });
    const tower = new THREE.LineSegments(edges, mat);
    tower.position.set(x, height / 2, z);
    tower.userData = {
      baseY: height / 2,
      speed: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2
    };
    towers.push(tower);
    cityGroup.add(tower);
  }

  // ---------- the knowledge globe: a glowing wireframe sphere of "thought" ----------
  const globeGeo = new THREE.IcosahedronGeometry(1.5, 2);
  const globeEdges = new THREE.EdgesGeometry(globeGeo);
  const globeMat = new THREE.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.55 });
  const globe = new THREE.LineSegments(globeEdges, globeMat);
  globe.position.set(3.6, 3.4, -2.2);
  globeGroup.add(globe);

  const globeCoreMat = new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.12 });
  const globeCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), globeCoreMat);
  globeCore.position.copy(globe.position);
  globeGroup.add(globeCore);

  // small orbiting nodes around the globe (the "little things" that move)
  const orbiters = [];
  for (let i = 0; i < 14; i++) {
    const nodeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? CYAN : WHITE });
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    const radius = 1.9 + Math.random() * 0.6;
    node.userData = {
      radius,
      speed: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
      tilt: Math.random() * Math.PI
    };
    orbiters.push(node);
    globeGroup.add(node);
  }

  // ---------- floating particles (data motes drifting upward) ----------
  const particleCount = 220;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSpeeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const radius = Math.random() * 7;
    const angle = Math.random() * Math.PI * 2;
    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = Math.random() * 6;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius - 1;
    particleSpeeds[i] = 0.15 + Math.random() * 0.35;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x9beef0,
    size: 0.035,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  particleGroup.add(particles);

  // ---------- mouse tracking ----------
  let mouseX = 0, mouseY = 0;     // normalized -1..1
  let targetTiltX = 0, targetTiltY = 0;
  let targetCamX = 0, targetCamY = 6;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // touch support — gentle parallax on drag
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
    }
  }, { passive: true });

  // ---------- resize ----------
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- animation loop ----------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // gentle hologram-table tilt that follows the cursor
    targetTiltX = mouseY * 0.18;
    targetTiltY = mouseX * 0.32;
    rig.rotation.x += (targetTiltX - rig.rotation.x) * 0.04;
    rig.rotation.y += (targetTiltY - rig.rotation.y) * 0.04;

    // subtle camera parallax drift
    targetCamX = mouseX * 1.4;
    targetCamY = 6 - mouseY * 0.8;
    camera.position.x += (targetCamX - camera.position.x) * 0.03;
    camera.position.y += (targetCamY - camera.position.y) * 0.03;
    camera.lookAt(0, 1.5, 0);

    // towers gently pulse height / glow like data updating
    towers.forEach((tower) => {
      const s = 1 + Math.sin(t * tower.userData.speed + tower.userData.phase) * 0.05;
      tower.scale.y = s;
      tower.material.opacity = 0.55 + Math.sin(t * tower.userData.speed * 1.3 + tower.userData.phase) * 0.3;
    });

    // ring slow rotation
    ring.rotation.z += 0.0015;

    // globe slow continuous rotation + slight cursor influence
    globe.rotation.y += 0.0025;
    globe.rotation.x = Math.sin(t * 0.15) * 0.08;
    globeCore.rotation.copy(globe.rotation);

    // orbiting nodes around the globe
    orbiters.forEach((node) => {
      const { radius, speed, offset, tilt } = node.userData;
      const angle = t * speed + offset;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 0.7 + tilt) * radius * 0.4;
      node.position.set(
        globe.position.x + x,
        globe.position.y + y,
        globe.position.z + z
      );
    });

    // particles drifting upward, looping back down
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += particleSpeeds[i] * 0.01;
      if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = 0;
    }
    particleGeo.attributes.position.needsUpdate = true;
    particleGroup.rotation.y += 0.0006;

    renderer.render(scene, camera);
  }

  animate();
})();
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script src="script.js"></script>
<canvas id="scene"></canvas>
