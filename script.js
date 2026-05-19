(() => {
  const accordionItems = [...document.querySelectorAll(".accordion-item")];
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const statNumbers = [...document.querySelectorAll("[data-count]")];

  function openAccordion(targetId) {
    accordionItems.forEach((item) => {
      const isTarget = item.id === targetId;
      const btn = item.querySelector(".accordion-head");

      item.classList.toggle("is-open", isTarget);
      if (btn) btn.setAttribute("aria-expanded", String(isTarget));
    });
  }

  accordionItems.forEach((item) => {
    const btn = item.querySelector(".accordion-head");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      accordionItems.forEach((other) => {
        other.classList.remove("is-open");
        const otherBtn = other.querySelector(".accordion-head");
        if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.target;
      navLinks.forEach((item) =>
        item.classList.toggle("is-active", item === link),
      );
      if (target && target !== "home") openAccordion(target);
    });
  });

  function animateNumbers() {
    statNumbers.forEach((node) => {
      if (node.dataset.done === "true") return;

      const target = Number(node.dataset.count || 0);
      const suffix = node.dataset.suffix || "";
      const start = performance.now();
      const duration = target > 1000 ? 1400 : 850;

      node.dataset.done = "true";

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = Math.round(target * eased) + suffix;

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          node.textContent = target + suffix;
        }
      }

      requestAnimationFrame(frame);
    });
  }

  const statsBox = document.querySelector(".stats-count");
  if ("IntersectionObserver" in window && statsBox) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animateNumbers();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    counterObserver.observe(statsBox);
  } else {
    window.addEventListener("load", animateNumbers, { once: true });
  }

  if ("IntersectionObserver" in window) {
    const sections = ["home", "about", "capacity", "projects", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const id = visible.target.id;
        navLinks.forEach((link) =>
          link.classList.toggle("is-active", link.dataset.target === id),
        );
      },
      {
        root: null,
        threshold: [0.2, 0.45, 0.7],
        rootMargin: "-18% 0px -65% 0px",
      },
    );

    sections.forEach((section) => navObserver.observe(section));
  }
})();
