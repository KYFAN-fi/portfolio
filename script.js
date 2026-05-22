(() => {
  "use strict";

  /* ══════════════════════════════════════════════════════════
     HELPER
  ══════════════════════════════════════════════════════════ */
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [
    ...parent.querySelectorAll(selector),
  ];

  function toNumber(value) {
    if (value === null || value === undefined) return 0;

    return parseFloat(String(value).replace(/\s/g, "").replace(",", ".")) || 0;
  }

  function setBodyLock(isLocked) {
    document.body.style.overflow = isLocked ? "hidden" : "";
  }

  /* ══════════════════════════════════════════════════════════
     1. ACCORDION
  ══════════════════════════════════════════════════════════ */
  const accordionItems = $$(".accordion-item");
  const navLinks = $$(".nav-link");
  const statNumbers = $$("[data-count]");

  function openAccordion(targetId) {
    if (!targetId) return;

    accordionItems.forEach((item) => {
      const isTarget = item.id === targetId;
      const btn = $(".accordion-head", item);

      item.classList.toggle("is-open", isTarget);

      if (btn) {
        btn.setAttribute("aria-expanded", String(isTarget));
      }
    });
  }

  accordionItems.forEach((item) => {
    const btn = $(".accordion-head", item);
    if (!btn) return;

    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      accordionItems.forEach((other) => {
        other.classList.remove("is-open");

        const otherBtn = $(".accordion-head", other);
        if (otherBtn) {
          otherBtn.setAttribute("aria-expanded", "false");
        }
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

      navLinks.forEach((item) => {
        item.classList.toggle("is-active", item === link);
      });

      if (target && target !== "home") {
        openAccordion(target);
      }
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

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          node.textContent = target + suffix;
        }
      }

      requestAnimationFrame(frame);
    });
  }

  const statsBox = $(".stats-count");

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

  /* ══════════════════════════════════════════════════════════
     4. SCROLL-BASED NAV HIGHLIGHT
  ══════════════════════════════════════════════════════════ */
  if ("IntersectionObserver" in window) {
    const sections = [
      "home",
      "about",
      "capacity",
      "news",
      "projects",
      "contact",
    ]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length) {
      const navObserver = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (!visible) return;

          const id = visible.target.id;

          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.dataset.target === id);
          });
        },
        {
          root: null,
          threshold: [0.2, 0.45, 0.7],
          rootMargin: "-18% 0px -65% 0px",
        },
      );

      sections.forEach((section) => navObserver.observe(section));
    }
  }

  /* ══════════════════════════════════════════════════════════
     5. SERVICE CAROUSEL
  ══════════════════════════════════════════════════════════ */
  const carouselTrack = $("#carouselTrack");
  const carouselPrev = $("#carouselPrev");
  const carouselNext = $("#carouselNext");
  const carouselPager = $("#carouselPager");
  const carouselDots = $$(".carousel-dots .dot");
  const carouselSlides = $$(".carousel-slide");

  let currentSlide = 0;
  const totalSlides = carouselSlides.length;
  let carouselAutoTimer = null;

  function goToSlide(index) {
    if (!totalSlides) return;

    currentSlide = (index + totalSlides) % totalSlides;

    if (carouselTrack) {
      carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    if (carouselPager) {
      carouselPager.textContent = `${currentSlide + 1} / ${totalSlides}`;
    }

    carouselDots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === currentSlide);
    });
  }

  function startCarouselAuto() {
    if (!totalSlides || totalSlides <= 1) return;

    clearInterval(carouselAutoTimer);
    carouselAutoTimer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 6000);
  }

  function resetCarouselAuto() {
    startCarouselAuto();
  }

  if (carouselPrev) {
    carouselPrev.addEventListener("click", () => {
      goToSlide(currentSlide - 1);
      resetCarouselAuto();
    });
  }

  if (carouselNext) {
    carouselNext.addEventListener("click", () => {
      goToSlide(currentSlide + 1);
      resetCarouselAuto();
    });
  }

  carouselDots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      goToSlide(i);
      resetCarouselAuto();
    });
  });

  let touchStartX = 0;

  if (carouselTrack) {
    carouselTrack.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true },
    );

    carouselTrack.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;

        if (Math.abs(dx) > 40) {
          if (dx < 0) {
            goToSlide(currentSlide + 1);
          } else {
            goToSlide(currentSlide - 1);
          }

          resetCarouselAuto();
        }
      },
      { passive: true },
    );
  }

  goToSlide(0);
  startCarouselAuto();

  /* ══════════════════════════════════════════════════════════
     6. NEWS POPUP
  ══════════════════════════════════════════════════════════ */
  const newsData = {
    1: {
      icon: "📰",
      tag: "Chương trình ưu đãi",
      date: "15/05/2026",
      cat: "Chương trình ưu đãi",
      title: "Chương Trình Lãi Suất Ưu Đãi Quý 2/2026",
      content: `
        <p>KYFAN chính thức triển khai <strong>gói vay thế chấp với lãi suất ưu đãi đặc biệt</strong> dành cho khách hàng mới trong quý 2 năm 2026.</p>
        <p>Chi tiết chương trình ưu đãi bao gồm:</p>
        <ul>
          <li>Lãi suất ưu đãi áp dụng cho 6 tháng đầu tiên của hợp đồng vay</li>
          <li>Miễn phí tư vấn và phân tích hồ sơ trong toàn bộ thời gian chương trình</li>
          <li>Hỗ trợ định giá tài sản ưu tiên — rút ngắn thời gian xét duyệt xuống còn 2–3 ngày làm việc</li>
          <li>Không thu phí thẩm định hồ sơ ban đầu</li>
          <li>Được hỗ trợ cơ cấu khoản vay linh hoạt theo nhu cầu thực tế</li>
        </ul>
        <p>Chương trình áp dụng cho các hồ sơ vay thế chấp sổ hồng, nâng hạn mức và đáo hạn khoản vay.</p>
      `,
    },
    2: {
      icon: "📋",
      tag: "Hướng dẫn",
      date: "08/05/2026",
      cat: "Kiến thức tài chính",
      title: "Hướng Dẫn Chuẩn Bị Hồ Sơ Vay Thế Chấp",
      content: `
        <p>Chuẩn bị hồ sơ đầy đủ và đúng quy cách là yếu tố then chốt giúp khoản vay thế chấp được duyệt nhanh hơn.</p>
        <p><strong>Nhóm tài liệu về tài sản thế chấp:</strong></p>
        <ul>
          <li>Sổ hồng/sổ đỏ bản gốc</li>
          <li>Hợp đồng mua bán hoặc giấy tờ chứng minh nguồn gốc tài sản</li>
          <li>Bản đồ địa chính và sơ đồ vị trí tài sản</li>
        </ul>
        <p><strong>Nhóm tài liệu cá nhân:</strong></p>
        <ul>
          <li>CCCD/CMND còn hiệu lực</li>
          <li>Hộ khẩu hoặc xác nhận thường trú</li>
          <li>Giấy đăng ký kết hôn/độc thân nếu có</li>
        </ul>
      `,
    },
    3: {
      icon: "🗓️",
      tag: "Dự án",
      date: "01/05/2026",
      cat: "Dự án triển khai",
      title: "Dự Án Hỗ Trợ Đáo Hạn Tháng 5/2026",
      content: `
        <p>KYFAN đang triển khai chương trình hỗ trợ khách hàng có khoản vay đến hạn trong tháng 5 và tháng 6 năm 2026.</p>
        <ul>
          <li>Tiếp nhận và phân tích hồ sơ đáo hạn</li>
          <li>Tư vấn phương án đáo hạn tối ưu</li>
          <li>Hỗ trợ xử lý thủ tục ngân hàng</li>
          <li>Cam kết xử lý theo tình trạng thực tế của hồ sơ</li>
        </ul>
      `,
    },
    4: {
      icon: "📊",
      tag: "Thị trường",
      date: "28/04/2026",
      cat: "Phân tích thị trường",
      title: "Thị Trường BĐS Hà Nội Tháng 5/2026",
      content: `
        <p>Thị trường bất động sản Hà Nội trong quý 2/2026 ghi nhận nhiều tín hiệu tích cực sau giai đoạn điều chỉnh.</p>
        <ul>
          <li>Bất động sản nội thành duy trì giá trị ổn định</li>
          <li>Khu vực Long Biên, Gia Lâm có tín hiệu tích cực nhờ hạ tầng</li>
          <li>Căn hộ chung cư tầm trung được đánh giá khả quan hơn</li>
        </ul>
      `,
    },
  };

  const newsOverlay = $("#newsOverlay");
  const newsPopupContent = $("#newsPopupContent");
  const newsPopupClose = $("#newsPopupClose");

  function openNews(id) {
    const data = newsData[id];

    if (!data || !newsOverlay || !newsPopupContent) return;

    newsPopupContent.innerHTML = `
      <div class="news-popup-hero">${data.icon}</div>

      <div class="news-popup-body">
        <span class="news-popup-tag">${data.tag}</span>

        <div class="news-popup-meta">
          <span class="news-popup-date">${data.date}</span>
          <span class="news-popup-cat">${data.cat}</span>
        </div>

        <h2 class="news-popup-title">${data.title}</h2>

        <div class="news-popup-divider"></div>

        <div class="news-popup-text">
          ${data.content}
        </div>
      </div>

      <div class="news-popup-footer">
        <a href="tel:0339123086" class="news-popup-cta">☎ Liên hệ tư vấn ngay</a>
        <span class="news-popup-share">KYFAN · Tài chính tối ưu</span>
      </div>
    `;

    newsOverlay.classList.add("is-open");
    setBodyLock(true);

    if (newsPopupClose) {
      newsPopupClose.focus();
    }
  }

  function closeNews() {
    if (!newsOverlay) return;

    newsOverlay.classList.remove("is-open");

    const calcOverlay = $("#calcOverlay");
    const calcIsOpen = calcOverlay && calcOverlay.classList.contains("is-open");

    if (!calcIsOpen) {
      setBodyLock(false);
    }
  }

  $$(".news-card[data-news]").forEach((card) => {
    function handleOpen() {
      openNews(parseInt(card.dataset.news, 10));
    }

    card.addEventListener("click", handleOpen);

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    });
  });

  if (newsPopupClose) {
    newsPopupClose.addEventListener("click", closeNews);
  }

  if (newsOverlay) {
    newsOverlay.addEventListener("click", (e) => {
      if (e.target === newsOverlay) {
        closeNews();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     7. LOAN CALCULATOR
  ══════════════════════════════════════════════════════════ */
  let barChart = null;
  let donutChart = null;
  let chartLoaderPromise = null;

  const calcMaxYear = 10;

  function getCalcElements() {
    return {
      overlay: $("#calcOverlay"),
      inputP: $("#calcP"),
      inputY: $("#calcY"),
      inputR: $("#calcR"),
      runBtn: $("#calcRunBtn"),
      resetBtn: $("#calcResetBtn"),
      resultArea: $("#calcResult"),
    };
  }

  function loadChartJs() {
    if (window.Chart) {
      return Promise.resolve(window.Chart);
    }

    if (chartLoaderPromise) {
      return chartLoaderPromise;
    }

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

  function getCalcInputs() {
    const { inputP, inputY, inputR } = getCalcElements();

    return {
      P: toNumber(inputP ? inputP.value : 0),
      Y: toNumber(inputY ? inputY.value : 0),
      R: toNumber(inputR ? inputR.value : 0),
    };
  }

  function destroyCharts() {
    if (barChart) {
      barChart.destroy();
      barChart = null;
    }

    if (donutChart) {
      donutChart.destroy();
      donutChart = null;
    }
  }

  function clearCalcResult() {
    const { resultArea } = getCalcElements();

    destroyCharts();

    if (resultArea) {
      resultArea.innerHTML = "";
    }
  }

  function renderCalcMessage(type, message) {
    const { resultArea } = getCalcElements();

    destroyCharts();

    if (!resultArea) return;

    resultArea.innerHTML = `
      <div class="calc-hint calc-hint-${type}">
        ${message}
      </div>
    `;
  }

  function updateCalcFieldStates() {
    const { inputP, inputY, inputR, runBtn } = getCalcElements();

    if (!inputP || !inputY || !inputR || !runBtn) return;

    const P = toNumber(inputP.value);
    const Y = toNumber(inputY.value);
    const R = toNumber(inputR.value);

    if (P > 0) {
      inputY.disabled = false;
      inputR.disabled = false;
    } else {
      inputY.disabled = true;
      inputR.disabled = true;

      inputY.value = "";
      inputR.value = "";
    }

    const isValid = P > 0 && Y > 0 && R > 0 && Y <= calcMaxYear;

    runBtn.disabled = !isValid;

    if (Y > calcMaxYear) {
      renderCalcMessage(
        "warning",
        `Thời hạn vay tối đa là ${calcMaxYear} năm. Vui lòng nhập lại thời hạn vay.`,
      );
    } else if (P <= 0 || Y <= 0 || R <= 0) {
      clearCalcResult();
    }
  }

  function fmt(v) {
    const number = Number(v) || 0;

    if (number >= 1000) {
      return (number / 1000).toFixed(3).replace(/\.?0+$/, "") + " tỷ";
    }

    return (Math.round(number * 10) / 10).toLocaleString("vi-VN") + " triệu";
  }

  function fmtPlain(v) {
    return (Math.round(v * 10) / 10).toLocaleString("vi-VN");
  }

  window.onPrincipalChange = function () {
    updateCalcFieldStates();
  };

  window.resetCalc = function () {
    const { inputP, inputY, inputR } = getCalcElements();

    if (inputP) inputP.value = "";
    if (inputY) inputY.value = "";
    if (inputR) inputR.value = "";

    clearCalcResult();
    updateCalcFieldStates();

    if (inputP) {
      inputP.focus();
    }
  };

  window.openCalc = function () {
    const { overlay, inputP } = getCalcElements();

    if (!overlay) return;

    overlay.classList.add("is-open");
    setBodyLock(true);

    updateCalcFieldStates();

    setTimeout(() => {
      if (inputP) inputP.focus();
    }, 120);
  };

  window.closeCalc = function () {
    const { overlay } = getCalcElements();

    if (!overlay) return;

    overlay.classList.remove("is-open");

    const newsIsOpen = newsOverlay && newsOverlay.classList.contains("is-open");

    if (!newsIsOpen) {
      setBodyLock(false);
    }
  };

  function bindCalcEvents() {
    const { overlay, inputP, inputY, inputR, runBtn, resetBtn } =
      getCalcElements();

    [inputP, inputY, inputR].forEach((input) => {
      if (!input) return;

      input.addEventListener("input", updateCalcFieldStates);
      input.addEventListener("change", updateCalcFieldStates);

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();

          const { runBtn } = getCalcElements();

          if (runBtn && !runBtn.disabled) {
            window.kfCalc();
          }
        }
      });
    });

    if (runBtn) {
      runBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.kfCalc();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.resetCalc();
      });
    }

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          window.closeCalc();
        }
      });
    }

    updateCalcFieldStates();
  }

  window.kfCalc = function () {
    const { P, Y, R } = getCalcInputs();
    const { resultArea, runBtn } = getCalcElements();

    if (!resultArea) return;

    if (P <= 0 || Y <= 0 || R <= 0) {
      clearCalcResult();
      updateCalcFieldStates();
      return;
    }

    if (Y > calcMaxYear) {
      if (runBtn) runBtn.disabled = true;

      renderCalcMessage(
        "warning",
        `Thời hạn vay tối đa là ${calcMaxYear} năm. Vui lòng nhập lại thời hạn vay.`,
      );
      return;
    }

    const years = Math.floor(Y);
    const months = years * 12;

    const monthlyInterest = P * (R / 100);
    const totalInterest = months * monthlyInterest;
    const totalPayment = P + totalInterest;

    const pPct = totalPayment > 0 ? Math.round((P / totalPayment) * 100) : 0;
    const iPct = 100 - pPct;

    const annualRate = R * 12;
    const annualInterest = monthlyInterest * 12;

    const yearLabels = Array.from(
      { length: years },
      (_, i) => "Năm " + (i + 1),
    );

    const interestPerYear = Array.from(
      { length: years },
      () => Math.round(annualInterest * 10) / 10,
    );

    const principalPerYear = Array.from(
      { length: years },
      () => Math.round((P / years) * 10) / 10,
    );

    resultArea.innerHTML = `
      <div class="calc-metrics">
        <div class="calc-metric">
          <div class="calc-metric-label">
            <span class="calc-metric-dot" style="background:#004fc4"></span>
            Lãi trả mỗi tháng
          </div>
          <div class="calc-metric-val blue">${fmt(monthlyInterest)}</div>
          <div class="calc-metric-sub">Cố định trong ${months} tháng</div>
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
            <span>
              <span class="calc-legend-sq" style="background:#004fc4"></span>
              Tiền lãi
            </span>

            <span>
              <span class="calc-legend-sq" style="background:#b5d4f4"></span>
              Tiền gốc quy đổi
            </span>
          </div>

          <div style="position:relative;width:100%;height:200px;">
            <canvas id="kfBarChart" role="img" aria-label="Biểu đồ cột lãi và gốc theo từng năm vay"></canvas>
          </div>
        </div>

        <div class="calc-chart-box">
          <div class="calc-chart-box-title">Tỷ lệ gốc / lãi</div>
          <div class="calc-chart-box-sub">Trên tổng số tiền phải trả</div>

          <div class="calc-legend">
            <span>
              <span class="calc-legend-sq" style="background:#004fc4"></span>
              Gốc ${pPct}%
            </span>

            <span>
              <span class="calc-legend-sq" style="background:#ef9f27"></span>
              Lãi ${iPct}%
            </span>
          </div>

          <div style="position:relative;width:100%;height:200px;">
            <canvas id="kfDonutChart" role="img" aria-label="Biểu đồ tròn tỷ lệ gốc và lãi"></canvas>
          </div>
        </div>
      </div>

      <div class="calc-breakdown">
        <div class="calc-breakdown-title">So sánh tỷ trọng các thành phần</div>

        <div class="calc-bar-row">
          <div class="calc-bar-info">
            <span class="calc-bar-name">Tiền gốc</span>
            <span class="calc-bar-amt">${fmt(P)}&nbsp;·&nbsp;${pPct}%</span>
          </div>

          <div class="calc-bar-track">
            <div class="calc-bar-fill" style="width:${pPct}%;background:#004fc4"></div>
          </div>
        </div>

        <div class="calc-bar-row">
          <div class="calc-bar-info">
            <span class="calc-bar-name">Tổng tiền lãi</span>
            <span class="calc-bar-amt">${fmt(totalInterest)}&nbsp;·&nbsp;${iPct}%</span>
          </div>

          <div class="calc-bar-track">
            <div class="calc-bar-fill" style="width:${iPct}%;background:#ef9f27"></div>
          </div>
        </div>

        <div class="calc-bar-row">
          <div class="calc-bar-info">
            <span class="calc-bar-name">Tổng phải trả</span>
            <span class="calc-bar-amt">${fmt(totalPayment)}&nbsp;·&nbsp;100%</span>
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
            <span class="calc-formula-val">= ${fmt(monthlyInterest)}</span>
          </div>

          <div class="calc-formula-row">
            <span class="calc-formula-eq">Tổng lãi = ${fmt(monthlyInterest)} × ${months} tháng</span>
            <span class="calc-formula-val">= ${fmt(totalInterest)}</span>
          </div>

          <div class="calc-formula-row">
            <span class="calc-formula-eq">Tổng trả = ${fmt(totalInterest)} + ${fmt(P)} gốc</span>
            <span class="calc-formula-val">= ${fmt(totalPayment)}</span>
          </div>

          <div class="calc-formula-row">
            <span class="calc-formula-eq">Lãi suất năm tương đương</span>
            <span class="calc-formula-val">${fmtPlain(annualRate)}%/năm</span>
          </div>
        </div>
      </div>
    `;

    destroyCharts();

    if (!window.Chart) {
      loadChartJs()
        .then(() => {
          buildCharts(
            yearLabels,
            interestPerYear,
            principalPerYear,
            P,
            totalInterest,
            pPct,
            iPct,
          );
        })
        .catch(() => {
          const chartBoxes = $$(".calc-chart-box", resultArea);

          chartBoxes.forEach((box) => {
            box.innerHTML += `
              <div class="calc-hint">
                Biểu đồ chưa tải được, nhưng số liệu phía trên vẫn có thể sử dụng.
              </div>
            `;
          });
        });

      return;
    }

    buildCharts(
      yearLabels,
      interestPerYear,
      principalPerYear,
      P,
      totalInterest,
      pPct,
      iPct,
    );
  };

  function buildCharts(
    yearLabels,
    interestPerYear,
    principalPerYear,
    P,
    totalInterest,
    pPct,
    iPct,
  ) {
    const barCanvas = $("#kfBarChart");
    const donutCanvas = $("#kfDonutChart");

    if (!barCanvas || !donutCanvas || !window.Chart) return;

    const isDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const gridCol = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
    const tickCol = isDark ? "#9ca3af" : "#6b7280";

    barChart = new Chart(barCanvas, {
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
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return ` ${context.dataset.label}: ${context.parsed.y} triệu`;
              },
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
            grid: {
              color: gridCol,
            },
            border: {
              display: false,
            },
          },
          y: {
            stacked: true,
            ticks: {
              color: tickCol,
              font: { size: 11 },
              callback: (value) => `${value} tr`,
            },
            grid: {
              color: gridCol,
            },
            border: {
              display: false,
            },
          },
        },
      },
    });

    donutChart = new Chart(donutCanvas, {
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
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const percent = context.label === "Tiền gốc" ? pPct : iPct;
                return ` ${context.label}: ${context.parsed} triệu (${percent}%)`;
              },
            },
          },
        },
      },
    });
  }

  /* ══════════════════════════════════════════════════════════
     8. GLOBAL KEYDOWN
  ══════════════════════════════════════════════════════════ */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeNews();

      if (typeof window.closeCalc === "function") {
        window.closeCalc();
      }
    }
  });

  /* ══════════════════════════════════════════════════════════
     9. INIT
  ══════════════════════════════════════════════════════════ */
  bindCalcEvents();
})();
