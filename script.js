(() => {
  /* ══════════════════════════════════════════════════════════
     1. ACCORDION
  ══════════════════════════════════════════════════════════ */
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

  /* ══════════════════════════════════════════════════════════
     2. NAV LINKS
  ══════════════════════════════════════════════════════════ */
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.target;
      navLinks.forEach((item) =>
        item.classList.toggle("is-active", item === link),
      );
      if (target && target !== "home") openAccordion(target);
    });
  });

  /* ══════════════════════════════════════════════════════════
     3. STATS COUNTER ANIMATION
  ══════════════════════════════════════════════════════════ */
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
        if (progress < 1) requestAnimationFrame(frame);
        else node.textContent = target + suffix;
      }
      requestAnimationFrame(frame);
    });
  }

  const statsBox = document.querySelector(".stats-count");
  if ("IntersectionObserver" in window && statsBox) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some((e) => e.isIntersecting)) {
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

  /* ══════════════════════════════════════════════════════════
     4. SCROLL-BASED NAV HIGHLIGHT
  ══════════════════════════════════════════════════════════ */
  if ("IntersectionObserver" in window) {
    const sections = ["home", "about", "capacity", "projects", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
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
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ══════════════════════════════════════════════════════════
     5. LOAN CALCULATOR
  ══════════════════════════════════════════════════════════ */
  let barChart = null;
  let donutChart = null;

  let chartLoaderPromise = null;

  function loadChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (chartLoaderPromise) return chartLoaderPromise;

    chartLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
      script.async = true;
      script.onload = () => resolve(window.Chart);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return chartLoaderPromise;
  }

  /* ── Open / Close ── */
  window.openCalc = function () {
    const overlay = document.getElementById("calcOverlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    // Run calculation immediately so result is visible on open
    kfCalc();
    // Focus first input for accessibility
    setTimeout(() => {
      const firstInput = document.getElementById("calcP");
      if (firstInput) firstInput.focus();
    }, 120);
  };

  window.closeCalc = function () {
    const overlay = document.getElementById("calcOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  // Close on overlay backdrop click
  const calcOverlayEl = document.getElementById("calcOverlay");
  if (calcOverlayEl) {
    calcOverlayEl.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) window.closeCalc();
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeCalc();
  });

  /* ── Formatter ── */
  function fmt(v) {
    if (v >= 1000) {
      return (v / 1000).toFixed(3).replace(/\.?0+$/, "") + " tỷ";
    }
    return (Math.round(v * 10) / 10).toLocaleString("vi-VN") + " triệu";
  }

  /* ── Main calculation & render ── */
  window.kfCalc = function () {
    const P = parseFloat(document.getElementById("calcP").value) || 0;
    const Y = parseFloat(document.getElementById("calcY").value) || 0;
    const R = parseFloat(document.getElementById("calcR").value) || 0;
    const resultArea = document.getElementById("calcResult");

    if (!resultArea) return;

    if (P <= 0 || Y <= 0 || R <= 0) {
      if (barChart) {
        barChart.destroy();
        barChart = null;
      }
      if (donutChart) {
        donutChart.destroy();
        donutChart = null;
      }
      resultArea.innerHTML = "";
      return;
    }

    const months = Y * 12;
    const monthlyInterest = P * (R / 100);
    const totalInterest = months * monthlyInterest;
    const totalPayment = totalInterest + P;
    const pPct = Math.round((P / totalPayment) * 100);
    const iPct = 100 - pPct;
    const annualRate = (R * 12).toFixed(1);
    const annualInterest = monthlyInterest * 12;

    const yearLabels = Array.from({ length: Y }, (_, i) => "Năm " + (i + 1));
    const interestPerYear = Array.from(
      { length: Y },
      () => Math.round(annualInterest * 10) / 10,
    );
    const principalPerYear = Array.from(
      { length: Y },
      () => Math.round((P / Y) * 10) / 10,
    );

    /* ── Render HTML ── */
    resultArea.innerHTML = `
      <div class="calc-metrics">
        <div class="calc-metric">
          <div class="calc-metric-label">
            <span class="calc-metric-dot" style="background:#004fc4"></span>
            Lãi trả mỗi tháng
          </div>
          <div class="calc-metric-val blue">${fmt(monthlyInterest)}</div>
          <div class="calc-metric-sub">Cố định suốt ${months} tháng</div>
        </div>
        <div class="calc-metric">
          <div class="calc-metric-label">
            <span class="calc-metric-dot" style="background:#e6a800"></span>
            Tổng tiền lãi
          </div>
          <div class="calc-metric-val amber">${fmt(totalInterest)}</div>
          <div class="calc-metric-sub">${months} tháng × ${fmt(monthlyInterest)}</div>
        </div>
        <div class="calc-metric">
          <div class="calc-metric-label">
            <span class="calc-metric-dot" style="background:#a32d2d"></span>
            Tổng phải trả
          </div>
          <div class="calc-metric-val red">${fmt(totalPayment)}</div>
          <div class="calc-metric-sub">Gốc + toàn bộ lãi</div>
        </div>
      </div>

      <div class="calc-charts-row">
        <div class="calc-chart-box">
          <div class="calc-chart-box-title">Lãi phát sinh theo từng năm</div>
          <div class="calc-chart-box-sub">Gốc quy đổi đều · lãi phẳng hằng năm</div>
          <div class="calc-legend">
            <span><span class="calc-legend-sq" style="background:#004fc4"></span>Tiền lãi</span>
            <span><span class="calc-legend-sq" style="background:#b5d4f4"></span>Tiền gốc quy đổi</span>
          </div>
          <div style="position:relative;width:100%;height:200px;">
            <canvas id="kfBarChart" role="img"
              aria-label="Biểu đồ cột lãi và gốc theo từng năm vay">
              Lãi và gốc theo từng năm.
            </canvas>
          </div>
        </div>

        <div class="calc-chart-box">
          <div class="calc-chart-box-title">Tỷ lệ gốc / lãi</div>
          <div class="calc-chart-box-sub">Trên tổng số tiền phải trả</div>
          <div class="calc-legend">
            <span><span class="calc-legend-sq" style="background:#004fc4"></span>Gốc ${pPct}%</span>
            <span><span class="calc-legend-sq" style="background:#ef9f27"></span>Lãi ${iPct}%</span>
          </div>
          <div style="position:relative;width:100%;height:200px;">
            <canvas id="kfDonutChart" role="img"
              aria-label="Biểu đồ tròn tỷ lệ gốc và lãi. Gốc ${pPct}%, Lãi ${iPct}%.">
              Gốc ${pPct}%, Lãi ${iPct}%.
            </canvas>
          </div>
        </div>
      </div>

      <div class="calc-breakdown">
        <div class="calc-breakdown-title">So sánh tỷ trọng các thành phần</div>
        <div class="calc-bar-row">
          <div class="calc-bar-info">
            <span class="calc-bar-name">Tiền gốc</span>
            <span class="calc-bar-amt">${fmt(P)} đ &nbsp;·&nbsp; ${pPct}%</span>
          </div>
          <div class="calc-bar-track">
            <div class="calc-bar-fill" style="width:${pPct}%;background:#004fc4"></div>
          </div>
        </div>
        <div class="calc-bar-row">
          <div class="calc-bar-info">
            <span class="calc-bar-name">Tổng tiền lãi</span>
            <span class="calc-bar-amt">${fmt(totalInterest)} đ &nbsp;·&nbsp; ${iPct}%</span>
          </div>
          <div class="calc-bar-track">
            <div class="calc-bar-fill" style="width:${iPct}%;background:#ef9f27"></div>
          </div>
        </div>
        <div class="calc-bar-row">
          <div class="calc-bar-info">
            <span class="calc-bar-name">Tổng phải trả</span>
            <span class="calc-bar-amt">${fmt(totalPayment)} đ &nbsp;·&nbsp; 100%</span>
          </div>
          <div class="calc-bar-track">
            <div class="calc-bar-fill" style="width:100%;background:#a32d2d"></div>
          </div>
        </div>
      </div>

      <div class="calc-formula">
        <div class="calc-formula-title">Công thức tính chi tiết</div>
        <div class="calc-formula-rows">
          <div class="calc-formula-row">
            <span class="calc-formula-eq">Lãi/tháng = ${fmt(P)} × ${R}%</span>
            <span class="calc-formula-val">= ${fmt(monthlyInterest)} đ</span>
          </div>
          <div class="calc-formula-row">
            <span class="calc-formula-eq">Tổng lãi = ${fmt(monthlyInterest)} × ${months} tháng</span>
            <span class="calc-formula-val">= ${fmt(totalInterest)} đ</span>
          </div>
          <div class="calc-formula-row">
            <span class="calc-formula-eq">Tổng trả = ${fmt(totalInterest)} + ${fmt(P)} (gốc)</span>
            <span class="calc-formula-val">= ${fmt(totalPayment)} đ</span>
          </div>
          <div class="calc-formula-row">
            <span class="calc-formula-eq">Lãi suất năm tương đương</span>
            <span class="calc-formula-val">${annualRate}%/năm</span>
          </div>
        </div>
      </div>
    `;

    /* ── Destroy old charts ── */
    if (barChart) {
      barChart.destroy();
      barChart = null;
    }
    if (donutChart) {
      donutChart.destroy();
      donutChart = null;
    }

    /* ── Lazy load Chart.js: trang chính load nhanh hơn, chỉ tải chart khi mở máy tính ── */
    if (!window.Chart) {
      loadChartJs()
        .then(() => window.kfCalc())
        .catch(() => {
          const chartBoxes = resultArea.querySelectorAll(".calc-chart-box");
          chartBoxes.forEach((box) => {
            box.innerHTML +=
              '<div class="calc-hint">Biểu đồ chưa tải được, số liệu phía trên vẫn có thể sử dụng.</div>';
          });
        });
      return;
    }

    /* ── Build new charts ── */
    const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const gridCol = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
    const tickCol = isDark ? "#9ca3af" : "#6b7280";

    barChart = new Chart(document.getElementById("kfBarChart"), {
      type: "bar",
      data: {
        labels: yearLabels,
        datasets: [
          {
            label: "Tiền lãi",
            data: interestPerYear,
            backgroundColor: "#004fc4",
            stack: "a",
          },
          {
            label: "Tiền gốc quy đổi",
            data: principalPerYear,
            backgroundColor: "#b5d4f4",
            stack: "a",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) =>
                " " + c.dataset.label + ": " + c.parsed.y + " triệu",
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: {
              color: tickCol,
              font: { size: 11 },
              autoSkip: false,
              maxRotation: 0,
            },
            grid: { color: gridCol },
            border: { display: false },
          },
          y: {
            stacked: true,
            ticks: {
              color: tickCol,
              font: { size: 11 },
              callback: (v) => v + " tr",
            },
            grid: { color: gridCol },
            border: { display: false },
          },
        },
      },
    });

    donutChart = new Chart(document.getElementById("kfDonutChart"), {
      type: "doughnut",
      data: {
        labels: ["Tiền gốc", "Tiền lãi"],
        datasets: [
          {
            data: [
              Math.round(P * 10) / 10,
              Math.round(totalInterest * 10) / 10,
            ],
            backgroundColor: ["#004fc4", "#ef9f27"],
            borderWidth: 3,
            borderColor: isDark ? "#1f2937" : "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) =>
                " " +
                c.label +
                ": " +
                c.parsed +
                " triệu (" +
                (c.label === "Tiền gốc" ? pPct : iPct) +
                "%)",
            },
          },
        },
      },
    });
  };
})();
