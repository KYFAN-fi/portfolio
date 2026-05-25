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

  function hasOpenOverlay() {
    return $$(".calc-overlay, .news-overlay, .service-overlay").some(
      (overlay) => overlay.classList.contains("is-open"),
    );
  }

  function setBodyLock(isLocked) {
    const shouldLock = isLocked || hasOpenOverlay();

    document.body.classList.toggle("modal-open", shouldLock);
    document.body.style.overflow = shouldLock ? "hidden" : "";
  }

  /* ══════════════════════════════════════════════════════════
     1. ACCORDION
  ══════════════════════════════════════════════════════════ */
  const accordionItems = $$(".accordion-item");
  const navLinks = $$(".nav-link");
  const statNumbers = $$("[data-count]");
  const navTargetIds = [
    "home",
    "about",
    "capacity",
    "news",
    "projects",
    "contact",
  ];
  let navRaf = 0;
  let navScrollTimer = null;
  let navLockTimer = null;
  let navSettleTimer = null;
  let lockedNavTargetId = "";
  let isProgrammaticNavScroll = false;

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

  function closeAccordion(targetId) {
    if (!targetId) return;

    const item = document.getElementById(targetId);
    if (!item || !item.classList.contains("accordion-item")) return;

    item.classList.remove("is-open");

    const btn = $(".accordion-head", item);
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
    }
  }

  function getNavTargetId(value) {
    if (!value) return "";

    const hashIndex = value.indexOf("#");
    const hash = hashIndex >= 0 ? value.slice(hashIndex + 1) : value;

    try {
      return decodeURIComponent(hash);
    } catch {
      return hash;
    }
  }

  function isAccordionTarget(targetId) {
    return accordionItems.some((item) => item.id === targetId);
  }

  function getScrollOffset() {
    const mobileTopbar = $(".mobile-topbar");
    const hasMobileTopbar =
      window.matchMedia &&
      window.matchMedia("(max-width: 920px)").matches &&
      mobileTopbar;

    return hasMobileTopbar ? mobileTopbar.offsetHeight + 12 : 14;
  }

  function getScrollBehavior(behavior) {
    if (behavior) return behavior;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return reduceMotion ? "auto" : "smooth";
  }

  function getDocumentTop(element) {
    return element.getBoundingClientRect().top + window.pageYOffset;
  }

  function setActiveNav(targetId) {
    if (!targetId) return;

    navLinks.forEach((link) => {
      const isActive = link.dataset.target === targetId;

      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function lockActiveNav(targetId) {
    lockedNavTargetId = targetId;
    setActiveNav(targetId);
    clearTimeout(navLockTimer);

    navLockTimer = setTimeout(() => {
      if (lockedNavTargetId === targetId) {
        lockedNavTargetId = "";
        updateActiveNavFromScroll();
      }
    }, 1400);
  }

  function releaseActiveNavLock(targetId) {
    clearTimeout(navLockTimer);

    navLockTimer = setTimeout(() => {
      if (!targetId || lockedNavTargetId === targetId) {
        lockedNavTargetId = "";
        updateActiveNavFromScroll();
      }
    }, 180);
  }

  function markProgrammaticNavScroll() {
    isProgrammaticNavScroll = true;
    clearTimeout(navScrollTimer);

    navScrollTimer = setTimeout(() => {
      isProgrammaticNavScroll = false;
      updateActiveNavFromScroll();
    }, 220);
  }

  function scrollToSection(targetId, options = {}) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const top = getDocumentTop(target) - getScrollOffset();

    markProgrammaticNavScroll();

    window.scrollTo({
      top: Math.max(0, Math.round(top)),
      behavior: getScrollBehavior(options.behavior),
    });
  }

  function updateHash(targetId, shouldUpdate) {
    if (!shouldUpdate || !targetId || !history.pushState) return;

    const nextHash = `#${targetId}`;
    if (window.location.hash !== nextHash) {
      history.pushState(null, "", nextHash);
    }
  }

  function navigateToSection(targetId, options = {}) {
    if (!navTargetIds.includes(targetId)) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    lockActiveNav(targetId);

    if (targetId !== "home" && isAccordionTarget(targetId)) {
      openAccordion(targetId);
    }

    clearTimeout(navSettleTimer);

    requestAnimationFrame(() => {
      scrollToSection(targetId, {
        behavior: options.behavior,
      });

      navSettleTimer = setTimeout(
        () => {
          scrollToSection(targetId, { behavior: "auto" });
          setActiveNav(targetId);
          releaseActiveNavLock(targetId);
        },
        isAccordionTarget(targetId) ? 480 : 80,
      );
    });

    updateHash(targetId, options.updateHash !== false);
  }

  function updateActiveNavFromScroll() {
    if (lockedNavTargetId) {
      setActiveNav(lockedNavTargetId);
      return;
    }

    const targets = navTargetIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .sort((a, b) => getDocumentTop(a) - getDocumentTop(b));

    if (!targets.length) return;

    const pageBottom =
      window.pageYOffset + window.innerHeight >=
      document.documentElement.scrollHeight - 4;
    const marker = window.pageYOffset + getScrollOffset() + 36;
    let activeId = targets[0].id;

    if (pageBottom) {
      activeId = targets[targets.length - 1].id;
    } else {
      for (const target of targets) {
        const targetTop = getDocumentTop(target);
        if (targetTop <= marker) {
          activeId = target.id;
        } else {
          break;
        }
      }
    }

    setActiveNav(activeId);
  }

  function scheduleActiveNavUpdate() {
    if (lockedNavTargetId) {
      setActiveNav(lockedNavTargetId);
      return;
    }

    if (isProgrammaticNavScroll) {
      clearTimeout(navScrollTimer);
      navScrollTimer = setTimeout(() => {
        isProgrammaticNavScroll = false;
        updateActiveNavFromScroll();
      }, 160);
      return;
    }

    if (navRaf) return;

    navRaf = requestAnimationFrame(() => {
      navRaf = 0;
      updateActiveNavFromScroll();
    });
  }

  accordionItems.forEach((item) => {
    const btn = $(".accordion-head", item);
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (item.classList.contains("is-open")) {
        clearTimeout(navSettleTimer);
        clearTimeout(navLockTimer);
        lockedNavTargetId = "";
        closeAccordion(item.id);
        requestAnimationFrame(updateActiveNavFromScroll);
        return;
      }

      navigateToSection(item.id);
    });
  });

  /* ══════════════════════════════════════════════════════════
     2. NAV LINKS
  ══════════════════════════════════════════════════════════ */
  $$('a[href^="#"]').forEach((link) => {
    const targetId = getNavTargetId(link.getAttribute("href"));

    if (!navTargetIds.includes(targetId)) return;

    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToSection(targetId);
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
  window.addEventListener("scroll", scheduleActiveNavUpdate, { passive: true });
  window.addEventListener("resize", scheduleActiveNavUpdate);
  window.addEventListener("hashchange", () => {
    const targetId = getNavTargetId(window.location.hash);

    if (navTargetIds.includes(targetId)) {
      navigateToSection(targetId, { updateHash: false });
    }
  });

  const initialTargetId = getNavTargetId(window.location.hash);

  if (navTargetIds.includes(initialTargetId)) {
    requestAnimationFrame(() => {
      navigateToSection(initialTargetId, {
        behavior: "auto",
        updateHash: false,
      });
    });
  } else {
    updateActiveNavFromScroll();
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
      image: "./",
      fallbackIcon: "📌",
      tag: "Thông báo chính thức",
      date: "01/06/2026",
      cat: "Hỗ trợ hồ sơ khó",
      title: "KYFAN Chính Thức Nhận Hỗ Trợ Hồ Sơ Khó Từ 01/06/2026",
      content: `
        <p>Từ ngày <strong>01/06/2026</strong>, KYFAN chính thức tiếp nhận và hỗ trợ các trường hợp <strong>hồ sơ khó, hồ sơ cần xử lý chuyên sâu</strong> trong lĩnh vực tài chính thế chấp.</p>

        <p>Chương trình tập trung hỗ trợ khách hàng đang gặp vướng mắc trong quá trình vay vốn, nâng hạn mức, đáo hạn hoặc cần cơ cấu lại khoản vay theo tình trạng thực tế của hồ sơ.</p>

        <p>Các nhóm hồ sơ được KYFAN tiếp nhận hỗ trợ bao gồm:</p>

        <ul>
          <li>Hồ sơ vay thế chấp sổ hồng cần phân tích và định hướng lại phương án</li>
          <li>Hồ sơ cần nâng hạn mức nhưng chưa đạt điều kiện xét duyệt ban đầu</li>
          <li>Hồ sơ đáo hạn khoản vay cần xử lý đúng thời điểm, hạn chế phát sinh rủi ro</li>
          <li>Hồ sơ từng bị từ chối hoặc cần bổ sung lại chứng minh tài chính</li>
          <li>Hồ sơ cần bảo mật thông tin và có phương án xử lý riêng biệt</li>
        </ul>

        <p>KYFAN sẽ hỗ trợ kiểm tra tình trạng hồ sơ, phân tích khả năng xử lý và đề xuất hướng đi phù hợp trước khi khách hàng quyết định triển khai.</p>

        <p><strong>Thời gian bắt đầu tiếp nhận:</strong> từ ngày <strong>01/06/2026</strong>. Khách hàng có nhu cầu có thể liên hệ KYFAN để được tư vấn và hỗ trợ chi tiết.</p>
      `,
    },

    2: {
      image: "./noidungchuanbi.png",
      fallbackIcon: "📋",
      tag: "Hướng dẫn",
      date: "08/05/2026",
      cat: "Hồ sơ tài sản",
      title: "4 Thông Tin Cần Chuẩn Bị Khi Làm Hồ Sơ Vay Thế Chấp",
      content: `
        <p>Để quá trình tư vấn và phân tích hồ sơ vay thế chấp được nhanh, rõ ràng và sát với thực tế hơn, khách hàng nên chuẩn bị trước các thông tin cơ bản về tài sản.</p>

        <p><strong>1. Hình ảnh sổ hồng</strong></p>
        <ul>
          <li>Chụp rõ mặt chính của sổ hồng/sổ đỏ.</li>
          <li>Đảm bảo nhìn rõ thông tin thửa đất, diện tích, mục đích sử dụng và thời hạn sử dụng.</li>
          <li>Không cần gửi bản gốc ban đầu, chỉ cần hình ảnh rõ nét để KYFAN kiểm tra sơ bộ.</li>
          <li>Nên che bớt thông tin nhạy cảm nếu khách hàng chưa muốn chia sẻ đầy đủ ngay từ đầu.</li>
        </ul>

        <p><strong>2. Vị trí tài sản</strong></p>
        <ul>
          <li>Cung cấp vị trí tài sản trên bản đồ hoặc gửi định vị Google Maps/Zalo Maps.</li>
          <li>Thông tin vị trí giúp đánh giá khu vực, khả năng thanh khoản và giá trị tham khảo của tài sản.</li>
          <li>Nếu có thể, gửi thêm địa chỉ gần đúng gồm phường/xã, quận/huyện, tỉnh/thành phố.</li>
          <li>Vị trí càng rõ thì quá trình định hướng hạn mức vay càng nhanh và chính xác hơn.</li>
        </ul>

        <p><strong>3. Hiện trạng tài sản</strong></p>
        <ul>
          <li>Gửi hình ảnh thực tế của tài sản hiện tại.</li>
          <li>Nếu là đất trống, cần chụp rõ mặt tiền, khu đất và khu vực xung quanh.</li>
          <li>Nếu có nhà, cần chụp mặt ngoài, đường vào nhà và một số góc thể hiện tình trạng xây dựng.</li>
          <li>Hiện trạng tài sản giúp KYFAN đánh giá mức độ phù hợp khi tư vấn phương án vay.</li>
        </ul>

        <p><strong>4. Độ rộng đường trước nhà</strong></p>
        <ul>
          <li>Cung cấp thông tin đường trước nhà rộng khoảng bao nhiêu mét.</li>
          <li>Có thể chụp ảnh con đường phía trước tài sản để dễ đánh giá thực tế.</li>
          <li>Đường ô tô vào được, đường hẻm nhỏ, đường bê tông hay đường đất đều ảnh hưởng đến giá trị tài sản.</li>
          <li>Thông tin này giúp quá trình phân tích hồ sơ sát hơn với tiêu chí thẩm định.</li>
        </ul>

        <p>Chỉ cần chuẩn bị đủ 4 nhóm thông tin trên, KYFAN có thể hỗ trợ kiểm tra sơ bộ hồ sơ, đánh giá tình trạng tài sản và tư vấn hướng xử lý phù hợp trước khi triển khai các bước tiếp theo.</p>
      `,
    },

    3: {
      image: "./tongketquy12026.png",
      fallbackIcon: "📊",
      tag: "Tổng kết quý",
      date: "31/03/2026",
      cat: "Kết quả hỗ trợ khách hàng",
      title: "Tổng Kết Quý 1/2026: KYFAN Đã Hỗ Trợ 55+ Khách Hàng",
      content: `
        <p>Trong Quý 1/2026, KYFAN đã đồng hành và hỗ trợ thành công hơn <strong>55 khách hàng</strong> trong các nhu cầu liên quan đến vay thế chấp, nâng hạn mức, đáo hạn khoản vay và xử lý hồ sơ cần tư vấn chuyên sâu.</p>

        <p>Toàn bộ thông tin khách hàng đều được KYFAN bảo mật tuyệt đối. Dưới đây là phần tổng hợp theo dạng ẩn danh nhằm giúp khách hàng mới có thêm cơ sở tham khảo về năng lực xử lý hồ sơ thực tế.</p>

        <p><strong>Một số nhóm hồ sơ đã được KYFAN hỗ trợ trong Quý 1/2026:</strong></p>

        <ul>
          <li>Khách hàng N.T.H — khu vực Hà Nội — hỗ trợ phân tích hồ sơ vay thế chấp sổ hồng.</li>
          <li>Khách hàng P.V.M — khu vực Long Biên — tư vấn phương án nâng hạn mức vay theo giá trị tài sản.</li>
          <li>Khách hàng T.T.L — khu vực Hoàng Mai — hỗ trợ chuẩn bị hồ sơ đáo hạn khoản vay đúng thời điểm.</li>
          <li>Khách hàng H.M.K — khu vực Đống Đa — tư vấn xử lý hồ sơ từng gặp vướng mắc khi xét duyệt.</li>
          <li>Khách hàng L.A.P — khu vực Cầu Giấy — hỗ trợ đánh giá lại tài sản và định hướng phương án vay phù hợp.</li>
          <li>Khách hàng V.T.N — khu vực Hà Đông — tư vấn cơ cấu lại khoản vay để giảm áp lực dòng tiền.</li>
          <li>Khách hàng Đ.Q.A — khu vực Thanh Xuân — hỗ trợ rà soát hồ sơ tài sản trước khi gửi ngân hàng.</li>
        </ul>

        <p><strong>Kết quả nổi bật trong Quý 1/2026:</strong></p>

        <ul>
          <li>Hỗ trợ hơn <strong>55 khách hàng</strong> có nhu cầu vay thế chấp, nâng hạn mức và đáo hạn khoản vay.</li>
          <li>Tiếp nhận nhiều nhóm hồ sơ cần xử lý linh hoạt theo từng tình trạng cụ thể.</li>
          <li>Hỗ trợ khách hàng chuẩn bị thông tin tài sản gồm sổ hồng, vị trí, hiện trạng và độ rộng đường trước nhà.</li>
          <li>Tư vấn phương án theo hướng rõ ràng, dễ hiểu và phù hợp với nhu cầu thực tế.</li>
          <li>Bảo mật tuyệt đối thông tin cá nhân, thông tin tài sản và tình trạng tài chính của khách hàng.</li>
        </ul>

        <p>KYFAN luôn đặt yếu tố <strong>uy tín, minh bạch và bảo mật</strong> lên hàng đầu. Mỗi hồ sơ đều được xem xét theo tình trạng riêng, không áp dụng một phương án chung cho tất cả khách hàng.</p>

        <p>Trong các quý tiếp theo, KYFAN tiếp tục mở rộng hỗ trợ cho các khách hàng có nhu cầu vay thế chấp sổ hồng, nâng hạn mức, đáo hạn khoản vay và đặc biệt là các trường hợp hồ sơ khó cần phân tích chuyên sâu.</p>
      `,
    },

    4: {
      image: "./phantichcthitruong.png",
      fallbackIcon: "🏙️",
      tag: "Thị trường",
      date: "28/04/2026",
      cat: "Phân tích thị trường",
      title: "Phân Tích Thị Trường Bất Động Sản Miền Bắc 2026",
      content: `
        <p>Thị trường bất động sản miền Bắc trong năm 2026 tiếp tục có sự phân hóa rõ rệt giữa các khu vực trung tâm, vùng ven và các tỉnh đang phát triển mạnh về hạ tầng. Đây là giai đoạn khách hàng cần nhìn nhận kỹ hơn về giá trị tài sản, khả năng thanh khoản và phương án tài chính phù hợp trước khi vay thế chấp, nâng hạn mức hoặc cơ cấu lại khoản vay.</p>

        <p><strong>1. Khu vực Hà Nội vẫn giữ vai trò trung tâm</strong></p>
        <ul>
          <li>Bất động sản tại các quận nội thành như Đống Đa, Hai Bà Trưng, Cầu Giấy, Thanh Xuân vẫn duy trì giá trị ổn định nhờ nhu cầu ở thực cao.</li>
          <li>Các khu vực ven đô như Long Biên, Đông Anh, Gia Lâm, Hoài Đức và Hà Đông tiếp tục được quan tâm nhờ hạ tầng giao thông mở rộng.</li>
          <li>Tài sản có pháp lý rõ ràng, vị trí thuận tiện và đường trước nhà tốt vẫn có lợi thế khi xét duyệt hồ sơ thế chấp.</li>
        </ul>

        <p><strong>2. Các tỉnh vệ tinh miền Bắc có nhiều tín hiệu đáng chú ý</strong></p>
        <ul>
          <li>Bắc Ninh, Hưng Yên, Hải Phòng, Hải Dương, Thái Nguyên và Vĩnh Phúc tiếp tục hưởng lợi từ khu công nghiệp, giao thông liên vùng và dòng dịch chuyển dân cư.</li>
          <li>Những khu vực gần trục đường lớn, khu đô thị mới hoặc khu công nghiệp có khả năng được đánh giá tích cực hơn khi phân tích tài sản.</li>
          <li>Tuy nhiên, mức độ tăng giá không đồng đều, vì vậy khách hàng cần kiểm tra kỹ pháp lý, vị trí và hiện trạng trước khi quyết định sử dụng tài sản để vay vốn.</li>
        </ul>

        <p><strong>3. Giá trị tài sản phụ thuộc nhiều vào pháp lý và hiện trạng thực tế</strong></p>
        <ul>
          <li>Sổ hồng/sổ đỏ rõ ràng là yếu tố quan trọng đầu tiên khi xem xét hồ sơ vay thế chấp.</li>
          <li>Vị trí tài sản, độ rộng đường trước nhà, khả năng ô tô vào được hay không đều ảnh hưởng trực tiếp đến việc định hướng hạn mức.</li>
          <li>Tài sản có nhà ở, đất trống, đất trong ngõ nhỏ hoặc tài sản cần kiểm tra thêm quy hoạch sẽ có cách phân tích khác nhau.</li>
          <li>Khách hàng nên chuẩn bị hình ảnh sổ hồng, vị trí tài sản, hiện trạng thực tế và thông tin đường trước nhà để được tư vấn nhanh hơn.</li>
        </ul>

        <p><strong>4. Nhu cầu vay thế chấp và đáo hạn vẫn ở mức cao</strong></p>
        <ul>
          <li>Nhiều khách hàng có nhu cầu sử dụng tài sản để bổ sung vốn kinh doanh, cơ cấu dòng tiền hoặc xử lý khoản vay đến hạn.</li>
          <li>Các hồ sơ cần nâng hạn mức, đáo hạn khoản vay hoặc từng gặp vướng mắc khi xét duyệt cần được phân tích kỹ trước khi triển khai.</li>
          <li>Việc lựa chọn phương án tài chính phù hợp giúp khách hàng hạn chế rủi ro, tránh áp lực lãi vay và chủ động hơn trong kế hoạch tài chính.</li>
        </ul>

        <p><strong>Thông điệp từ KYFAN:</strong></p>
        <p>Thị trường có thể biến động, giá trị tài sản có thể thay đổi theo từng khu vực và từng thời điểm. Nhưng KYFAN luôn kiên định với mục tiêu đồng hành cùng khách hàng bằng những giải pháp rõ ràng, phù hợp và an toàn nhất.</p>

        <p><strong>Thị trường biến động, nhưng KYFAN luôn nỗ lực mang lại những giải pháp tài chính tốt nhất cho khách hàng.</strong> Mỗi hồ sơ đều được xem xét theo tình trạng riêng, phân tích dựa trên tài sản thực tế, nhu cầu vốn và khả năng xử lý phù hợp.</p>

        <p>KYFAN cam kết tư vấn minh bạch, bảo mật thông tin khách hàng và đồng hành trong các nhu cầu vay thế chấp sổ hồng, nâng hạn mức, đáo hạn khoản vay và xử lý hồ sơ khó tại khu vực miền Bắc.</p>
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
      <div class="news-popup-hero">
        <img class="news-popup-img" src="${data.image}" alt="${data.title}" loading="lazy" decoding="async"
          onerror="this.classList.add('is-error'); this.closest('.news-popup-hero').dataset.fallback='${data.fallbackIcon || "📰"}';">
      </div>

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
    setBodyLock(false);
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
      closeBtn: $(".calc-close-btn"),
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

    const hasValidTerm = Number.isInteger(Y) && Y > 0 && Y <= calcMaxYear;
    const isValid = P > 0 && R > 0 && hasValidTerm;

    runBtn.disabled = !isValid;

    if (Y > 0 && !Number.isInteger(Y)) {
      renderCalcMessage(
        "warning",
        "Thời hạn vay cần nhập theo số năm nguyên. Vui lòng nhập lại thời hạn vay.",
      );
    } else if (Y > calcMaxYear) {
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
    setBodyLock(false);
  };

  function bindCalcEvents() {
    const { overlay, inputP, inputY, inputR, runBtn, resetBtn, closeBtn } =
      getCalcElements();

    $$(".calc-trigger-btn, .cs-cta, .floating-cta__btn--calc").forEach(
      (btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          window.openCalc();
        });
      },
    );

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

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.closeCalc();
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

    if (!Number.isInteger(Y)) {
      if (runBtn) runBtn.disabled = true;

      renderCalcMessage(
        "warning",
        "Thời hạn vay cần nhập theo số năm nguyên. Vui lòng nhập lại thời hạn vay.",
      );
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
   SERVICE DETAIL POPUP
══════════════════════════════════════════════════════════ */
  const serviceOverlay = $("#serviceOverlay");
  const servicePopupContent = $("#servicePopupContent");
  const servicePopupClose = $("#servicePopupClose");
  const serviceCards = $$(".service-card");

  const serviceData = {
    1: {
      kicker: "DV 01",
      title: "Vay Thế Chấp Sổ Hồng",
      desc: "KYFAN hỗ trợ khách hàng tiếp cận khoản vay phù hợp dựa trên giá trị tài sản thực tế, định hướng hồ sơ rõ ràng, tối ưu hạn mức và đảm bảo quy trình xử lý minh bạch.",
      details: [
        {
          title: "Điểm mạnh",
          items: [
            "Định giá tài sản sát thực tế",
            "Tư vấn phương án vay phù hợp",
            "Hỗ trợ chuẩn bị hồ sơ rõ ràng",
            "Bảo mật thông tin khách hàng",
          ],
        },
        {
          title: "Phù hợp với",
          items: [
            "Khách hàng có sổ hồng/sổ đỏ",
            "Cần vốn kinh doanh hoặc xoay dòng tiền",
            "Muốn tối ưu hạn mức vay",
            "Cần giải ngân nhanh và an toàn",
          ],
        },
      ],
      note: "KYFAN kiểm tra hồ sơ sơ bộ trước khi tư vấn phương án triển khai phù hợp.",
    },

    2: {
      kicker: "DV 02",
      title: "Nâng Hạn Mức Vay",
      desc: "Dịch vụ giúp khách hàng đánh giá lại tài sản, hồ sơ tài chính và nhu cầu sử dụng vốn để đề xuất phương án nâng hạn mức phù hợp hơn.",
      details: [
        {
          title: "KYFAN hỗ trợ",
          items: [
            "Phân tích lại hồ sơ hiện tại",
            "Đánh giá khả năng tăng hạn mức",
            "Tư vấn phương án bổ sung hồ sơ",
            "Định hướng cách làm việc với ngân hàng",
          ],
        },
        {
          title: "Lợi ích",
          items: [
            "Tối ưu nguồn vốn đang có",
            "Tăng khả năng tiếp cận khoản vay",
            "Giảm áp lực dòng tiền",
            "Có phương án xử lý linh hoạt hơn",
          ],
        },
      ],
      note: "Phù hợp với khách hàng đã có khoản vay nhưng muốn tăng thêm hạn mức dựa trên tài sản.",
    },

    3: {
      kicker: "DV 03",
      title: "Đáo Hạn Khoản Vay",
      desc: "KYFAN đồng hành xử lý khoản vay đến hạn, giúp khách hàng giảm áp lực tài chính, tránh phát sinh rủi ro và có phương án cơ cấu phù hợp.",
      details: [
        {
          title: "Nội dung hỗ trợ",
          items: [
            "Kiểm tra thời điểm đáo hạn",
            "Tư vấn phương án xử lý trước hạn",
            "Hỗ trợ cơ cấu lại khoản vay",
            "Giảm rủi ro chậm thanh toán",
          ],
        },
        {
          title: "Phù hợp với",
          items: [
            "Khách hàng sắp đến hạn khoản vay",
            "Cần xoay dòng tiền đúng thời điểm",
            "Muốn duy trì lịch sử tín dụng tốt",
            "Cần phương án xử lý nhanh",
          ],
        },
      ],
      note: "Nên kiểm tra khoản vay trước hạn để có nhiều phương án xử lý an toàn hơn.",
    },
  };

  function renderServicePopup(service) {
    if (!servicePopupContent || !service) return;

    servicePopupContent.innerHTML = `
    <div class="service-popup-hero">
      <p class="service-popup-kicker">${service.kicker}</p>
      <h2 class="service-popup-title">${service.title}</h2>
    </div>

    <div class="service-popup-body">
      <p class="service-popup-desc">${service.desc}</p>

      <div class="service-detail-grid">
        ${service.details
          .map(
            (box) => `
              <div class="service-detail-box">
                <h4>${box.title}</h4>
                <ul>
                  ${box.items.map((item) => `<li>${item}</li>`).join("")}
                </ul>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="service-popup-note">
        ${service.note}
      </div>

      <div class="service-popup-actions">
        <a class="service-popup-cta" href="tel:0339123086">Gọi Hotline</a>
        <a class="service-popup-zalo" href="https://zalo.me/0339123086" target="_blank" rel="noopener">Nhắn Zalo</a>
      </div>
    </div>
  `;
  }

  function openService(serviceId) {
    const service = serviceData[serviceId];
    if (!service || !serviceOverlay) return;

    renderServicePopup(service);

    serviceOverlay.classList.add("is-open");
    setBodyLock(true);
  }

  function closeService() {
    if (!serviceOverlay) return;

    serviceOverlay.classList.remove("is-open");
    setBodyLock(false);
  }

  window.openService = openService;
  window.closeService = closeService;

  serviceCards.forEach((card) => {
    card.addEventListener("click", () => {
      openService(card.dataset.service);
    });
  });

  if (servicePopupClose) {
    servicePopupClose.addEventListener("click", closeService);
  }

  if (serviceOverlay) {
    serviceOverlay.addEventListener("click", (e) => {
      if (e.target === serviceOverlay) {
        closeService();
      }
    });
  }
  /* ══════════════════════════════════════════════════════════
     8. GLOBAL KEYDOWN
  ══════════════════════════════════════════════════════════ */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeService();
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
