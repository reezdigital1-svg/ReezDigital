document.addEventListener("DOMContentLoaded", () => {
  /* ---------- preloader ---------- */
  const preloader = document.getElementById("preloader");
  const preFill = document.getElementById("pre-fill");
  const preCount = document.getElementById("pre-count");
  if (preloader && preFill && preCount) {
    let pct = 0;
    const tick = setInterval(() => {
      pct = Math.min(100, pct + Math.random() * 16 + 6);
      preFill.style.width = pct + "%";
      preCount.textContent = Math.floor(pct) + "%";
      if (pct >= 100) {
        clearInterval(tick);
        setTimeout(() => preloader.classList.add("done"), 250);
      }
    }, 110);
    setTimeout(() => preloader.classList.add("done"), 3500);
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
  function openMenu() { mobileMenu.classList.remove("hidden"); mobileMenu.classList.add("flex"); }
  function shutMenu() { mobileMenu.classList.add("hidden"); mobileMenu.classList.remove("flex"); }
  if (menuToggle) menuToggle.addEventListener("click", (e) => { e.stopPropagation(); openMenu(); });
  if (closeMenu) closeMenu.addEventListener("click", shutMenu);
  document.addEventListener("click", (e) => {
    if (mobileMenu && !mobileMenu.contains(e.target) && e.target !== menuToggle) shutMenu();
  });
  mobileMenu.addEventListener("click", (e) => e.stopPropagation());
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
        const dur = 1600;
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

  /* ---------- card spotlight ---------- */
  document.querySelectorAll(".glass-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - rect.left + "px");
      card.style.setProperty("--my", e.clientY - rect.top + "px");
    });
  });

  /* ================= 3D COIN (three.js) ================= */
  const canvas = document.getElementById("coin-canvas");
  if (canvas && window.THREE) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0, 4.4);

    /* coin face texture drawn on a canvas */
    function faceTexture() {
      const c = document.createElement("canvas");
      c.width = c.height = 512;
      const g = c.getContext("2d");

      const grad = g.createRadialGradient(200, 180, 40, 256, 256, 260);
      grad.addColorStop(0, "#ffe9a3");
      grad.addColorStop(0.55, "#f5c542");
      grad.addColorStop(1, "#b97f10");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(256, 256, 254, 0, Math.PI * 2);
      g.fill();

      g.strokeStyle = "rgba(120, 78, 6, 0.85)";
      g.lineWidth = 10;
      g.beginPath();
      g.arc(256, 256, 232, 0, Math.PI * 2);
      g.stroke();

      g.strokeStyle = "rgba(255, 240, 190, 0.65)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(256, 256, 214, 0, Math.PI * 2);
      g.stroke();

      /* ridged edge ticks */
      g.strokeStyle = "rgba(120, 78, 6, 0.5)";
      g.lineWidth = 4;
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        g.beginPath();
        g.moveTo(256 + Math.cos(a) * 236, 256 + Math.sin(a) * 236);
        g.lineTo(256 + Math.cos(a) * 252, 256 + Math.sin(a) * 252);
        g.stroke();
      }

      g.fillStyle = "rgba(110, 70, 5, 0.9)";
      g.font = "700 240px 'Syne', sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("N", 256, 268);

      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      return tex;
    }

    const goldFace = new THREE.MeshStandardMaterial({
      map: faceTexture(),
      metalness: 0.75,
      roughness: 0.32,
    });
    const goldEdge = new THREE.MeshStandardMaterial({
      color: 0xd9a92f,
      metalness: 0.85,
      roughness: 0.38,
    });

    const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.16, 96), [
      goldEdge,
      goldFace,
      goldFace,
    ]);
    coin.rotation.x = Math.PI / 2;
    coin.rotation.z = -0.12;
    scene.add(coin);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.035, 24, 120),
      new THREE.MeshStandardMaterial({ color: 0xffe08a, metalness: 0.9, roughness: 0.22 })
    );
    rim.rotation.x = Math.PI / 2;
    coin.add(rim);

    /* orbiting particles */
    const pCount = 220;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 1.9 + Math.random() * 1.6;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 0.028,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(particles);

    /* lights: gold key + cyan/violet neon rims */
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff3c4, 1.6);
    key.position.set(3, 4, 5);
    scene.add(key);
    const cyanRim = new THREE.PointLight(0x00f0ff, 2.2, 12);
    cyanRim.position.set(-4, 1.5, -2);
    scene.add(cyanRim);
    const violetRim = new THREE.PointLight(0x7c3aed, 2.0, 12);
    violetRim.position.set(4, -2, -3);
    scene.add(violetRim);
    const magentaRim = new THREE.PointLight(0xff2e9a, 1.4, 12);
    magentaRim.position.set(0, 3.5, -4);
    scene.add(magentaRim);

    /* mouse parallax */
    let targetX = 0, targetY = 0;
    window.addEventListener("mousemove", (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.55;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.35;
    });

    function resize() {
      const w = canvas.clientWidth || canvas.parentElement.clientWidth;
      const h = canvas.clientHeight || canvas.parentElement.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      coin.rotation.y = t * 0.55 + targetX * 1.6;
      coin.rotation.x = Math.PI / 2 + targetY * 0.9 + Math.sin(t * 0.7) * 0.06;
      coin.position.y = Math.sin(t * 1.1) * 0.09;

      particles.rotation.y = t * 0.08;
      particles.rotation.x = Math.sin(t * 0.2) * 0.12;

      cyanRim.position.x = Math.cos(t * 0.4) * 4;
      violetRim.position.x = Math.sin(t * 0.4) * 4;

      renderer.render(scene, camera);
    }

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      animate();
    }
  }
});
