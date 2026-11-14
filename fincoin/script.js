document.addEventListener("DOMContentLoaded", () => {
  /* ---------- preloader ---------- */
  const preloader = document.getElementById("preloader");
  if (preloader) {
    setTimeout(() => preloader.classList.add("done"), 900);
  }

  /* ---------- scroll progress + nav ---------- */
  const progress = document.getElementById("progress");
  const nav = document.getElementById("nav");
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const menuToggle = document.getElementById("menu-toggle");
  const closeMenu = document.getElementById("close-menu");
  const mobileMenu = document.getElementById("mobile-menu");
  function openMenu() { mobileMenu.classList.add("open"); }
  function shutMenu() { mobileMenu.classList.remove("open"); }
  if (menuToggle) menuToggle.addEventListener("click", (e) => { e.stopPropagation(); openMenu(); });
  if (closeMenu) closeMenu.addEventListener("click", shutMenu);
  document.addEventListener("click", (e) => {
    if (mobileMenu && !mobileMenu.contains(e.target) && e.target !== menuToggle) shutMenu();
  });
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", shutMenu));

  /* ---------- custom cursor ---------- */
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");
  if (dot && ring && window.matchMedia("(pointer: fine)").matches) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hovering"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hovering"));
    });
  }

  /* ---------- reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- count-up ---------- */
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10) || 0;
        const start = performance.now();
        const dur = 1500;
        (function step(now) {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased).toLocaleString("en-US");
          if (t < 1) requestAnimationFrame(step);
        })(start);
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll(".count").forEach((el) => countObserver.observe(el));

  /* ============ 3D IRIDESCENT RINGS (three.js) ============ */
  const canvas = document.getElementById("rings-canvas");
  if (canvas && window.THREE) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 0, 8.2);

    /* procedural iridescent environment for reflections */
    function envTexture() {
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 512;
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, c.width, c.height);
      grad.addColorStop(0.0, "#16215e");
      grad.addColorStop(0.22, "#3b4fd8");
      grad.addColorStop(0.42, "#7c3aed");
      grad.addColorStop(0.62, "#ff2e9a");
      grad.addColorStop(0.8, "#0e0e1c");
      grad.addColorStop(1.0, "#050505");
      g.fillStyle = grad;
      g.fillRect(0, 0, c.width, c.height);
      /* bright highlights to catch reflections */
      for (const [x, y, r, col] of [
        [180, 130, 90, "rgba(255,255,255,0.9)"],
        [640, 110, 60, "rgba(160,220,255,0.8)"],
        [880, 300, 110, "rgba(255,170,230,0.55)"],
        [420, 380, 70, "rgba(204,255,0,0.35)"],
      ]) {
        const rg = g.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, col);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = rg;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      return tex;
    }

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromEquirectangular(envTexture()).texture;
    scene.environment = envMap;

    /* shape helpers */
    function annulus(outerR, innerPath) {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
      shape.holes.push(innerPath);
      return shape;
    }
    function hexPath(r) {
      const p = new THREE.Path();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
      }
      p.closePath();
      return p;
    }
    function squarePath(cx, cy, s) {
      const p = new THREE.Path();
      p.moveTo(cx - s, cy - s);
      p.lineTo(cx + s, cy - s);
      p.lineTo(cx + s, cy + s);
      p.lineTo(cx - s, cy + s);
      p.closePath();
      return p;
    }
    function starPath(outer, inner) {
      const p = new THREE.Path();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
      }
      p.closePath();
      return p;
    }

    const extrude = {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 64,
    };

    function iridescent(tint) {
      return new THREE.MeshPhysicalMaterial({
        color: tint,
        metalness: 1.0,
        roughness: 0.24,
        envMap: envMap,
        envMapIntensity: 1.5,
        iridescence: 1.0,
        iridescenceIOR: 1.55,
        iridescenceThicknessRange: [120, 780],
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      });
    }

    const matA = iridescent(0x2a3a8f);
    const matB = iridescent(0x14161f);
    const matC = iridescent(0x5a2050);

    /* ring 1: hexagonal cutout */
    const ringA = new THREE.Mesh(
      new THREE.ExtrudeGeometry(annulus(1.12, hexPath(0.62)), extrude),
      matA
    );

    /* ring 2: dark ring + star inside */
    const ringB = new THREE.Group();
    ringB.add(new THREE.Mesh(new THREE.ExtrudeGeometry(annulus(1.12, new THREE.Path().absarc(0, 0, 0.66, 0, Math.PI * 2, true)), extrude), matB));
    const star = new THREE.Mesh(
      new THREE.ExtrudeGeometry(starPath(0.52, 0.22), { ...extrude, depth: 0.3 }),
      iridescent(0x3b4fd8)
    );
    star.position.z = 0.02;
    ringB.add(star);

    /* ring 3: four square cutouts */
    const shapeC = new THREE.Shape();
    shapeC.absarc(0, 0, 1.12, 0, Math.PI * 2, false);
    [[0, 0.78], [0, -0.78], [0.78, 0], [-0.78, 0]].forEach(([x, y]) => {
      shapeC.holes.push(squarePath(x, y, 0.17));
    });
    const ringC = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeC, extrude), matC);

    ringA.position.x = -3.1;
    ringC.position.x = 3.1;
    scene.add(ringA, ringB, ringC);

    /* lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 6);
    scene.add(key);
    const lime = new THREE.PointLight(0xccff00, 1.1, 20);
    lime.position.set(-5, -2, 4);
    scene.add(lime);
    const violet = new THREE.PointLight(0x7c3aed, 1.6, 20);
    violet.position.set(5, 2, -3);
    scene.add(violet);

    /* mouse parallax */
    let targetX = 0, targetY = 0;
    window.addEventListener("mousemove", (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    });

    function resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const mobile = window.innerWidth < 768;
      ringA.position.x = mobile ? -2.35 : -3.1;
      ringC.position.x = mobile ? 2.35 : 3.1;
      const s = mobile ? 0.72 : 1;
      [ringA, ringB, ringC].forEach((r) => r.scale.setScalar(s));
    }
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      ringA.rotation.z = t * 0.16;
      ringA.rotation.y = Math.sin(t * 0.4) * 0.35 + targetX * 0.5;
      ringA.position.y = Math.sin(t * 0.9) * 0.14;

      ringB.rotation.z = -t * 0.12;
      star.rotation.z = t * 0.5;
      ringB.rotation.y = Math.sin(t * 0.35 + 1) * 0.35 + targetX * 0.5;
      ringB.position.y = Math.sin(t * 0.9 + 1.3) * 0.14;

      ringC.rotation.z = t * 0.14;
      ringC.rotation.y = Math.sin(t * 0.38 + 2) * 0.35 + targetX * 0.5;
      ringC.position.y = Math.sin(t * 0.9 + 2.6) * 0.14;

      camera.position.x += (targetX * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-targetY * 0.6 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      animate();
    }
  }
});
