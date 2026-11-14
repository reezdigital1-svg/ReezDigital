document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const closeMenu = document.getElementById("close-menu");
  const mobileMenu = document.getElementById("mobile-menu");
  const splineViewer = document.querySelector("spline-viewer");
  const mobileGif = document.getElementById("mobile-gif");

  function handleResize() {
    if (window.innerWidth < 768) {
      if (splineViewer) splineViewer.style.display = "none";
      if (mobileGif) mobileGif.style.display = "block";
      if (mobileMenu && mobileMenu.classList.contains("flex")) {
        mobileMenu.classList.add("hidden");
        mobileMenu.classList.remove("flex");
      }
    } else {
      if (splineViewer) splineViewer.style.display = "block";
      if (mobileGif) mobileGif.style.display = "none";
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("flex");
    }
  }

  handleResize();
  window.addEventListener("resize", handleResize);

  function openMenu() {
    mobileMenu.classList.remove("hidden");
    mobileMenu.classList.add("flex");
  }
  function shutMenu() {
    mobileMenu.classList.add("hidden");
    mobileMenu.classList.remove("flex");
  }

  if (menuToggle) menuToggle.addEventListener("click", (e) => { e.stopPropagation(); openMenu(); });
  if (closeMenu) closeMenu.addEventListener("click", shutMenu);
  document.addEventListener("click", (e) => {
    if (mobileMenu && !mobileMenu.contains(e.target) && e.target !== menuToggle) shutMenu();
  });
  mobileMenu.addEventListener("click", (e) => e.stopPropagation());
  mobileMenu.querySelectorAll("a").forEach((item) => item.addEventListener("click", shutMenu));

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

  /* ---------- custom cursor ---------- */
  const dot = document.getElementById("cursor-dot");
  const ring = document.getElementById("cursor-ring");

  if (dot && ring && window.matchMedia("(pointer: fine)").matches) {
    let mx = -100, my = -100, rx = -100, ry = -100;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
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

  /* ---------- manifesto word-by-word ---------- */
  const manifesto = document.getElementById("manifesto");
  if (manifesto) {
    const accents = new Set(["move,", "breathe", "react.", "remember."]);
    const words = manifesto.textContent.trim().split(/\s+/);
    manifesto.innerHTML = words
      .map((w) => `<span class="manifesto-word${accents.has(w) ? " accent" : ""}">${w}</span>`)
      .join(" ");

    const wordEls = manifesto.querySelectorAll(".manifesto-word");
    const manifestoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          manifestoObserver.disconnect();
          wordEls.forEach((el, i) => setTimeout(() => el.classList.add("lit"), i * 55));
        });
      },
      { threshold: 0.3 }
    );
    manifestoObserver.observe(manifesto);
  }

  /* ---------- count-up stats ---------- */
  const counters = document.querySelectorAll(".count");
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
          el.textContent = Math.round(target * eased);
          if (t < 1) requestAnimationFrame(step);
        })(start);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => countObserver.observe(el));

  /* ---------- card spotlight + tilt ---------- */
  document.querySelectorAll(".glass-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mx", x + "px");
      card.style.setProperty("--my", y + "px");
      const rx = ((y / rect.height) - 0.5) * -4;
      const ry = ((x / rect.width) - 0.5) * 4;
      card.style.transform = `translateY(-6px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
});
