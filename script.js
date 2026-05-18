// Cursor glow
const glow = document.querySelector(".cursor-glow");
document.addEventListener("mousemove", (e) => {
  glow.style.left = e.clientX + "px";
  glow.style.top = e.clientY + "px";
});

// Reveal on scroll
const revealItems = document.querySelectorAll(".reveal");
const revealOnScroll = () => {
  revealItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      item.classList.add("show");
    }
  });
};
window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

// Accordion
const accordionItems = document.querySelectorAll(".accordion-item");
accordionItems.forEach((item) => {
  const btn = item.querySelector(".accordion-btn");
  const content = item.querySelector(".accordion-content");
  btn.addEventListener("click", () => {
    const isActive = item.classList.contains("active");

    accordionItems.forEach((other) => {
      other.classList.remove("active");
      other.querySelector(".accordion-content").style.maxHeight = null;
    });

    if (!isActive) {
      item.classList.add("active");
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});

// Service dropdown
const serviceCards = document.querySelectorAll(".service-card");
serviceCards.forEach((card) => {
  const btn = card.querySelector(".service-detail-btn");
  const dropdown = card.querySelector(".service-dropdown");

  btn.addEventListener("click", () => {
    const isActive = card.classList.contains("active");

    serviceCards.forEach((other) => {
      other.classList.remove("active");
      other.querySelector(".service-dropdown").style.maxHeight = null;
      other.querySelector(".service-detail-btn").innerText =
        "Xem chi tiết dịch vụ";
    });

    if (!isActive) {
      card.classList.add("active");
      dropdown.style.maxHeight = dropdown.scrollHeight + "px";
      btn.innerText = "Thu gọn nội dung";
    }
  });
});

// Modal
const consultModal = document.getElementById("consultModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navLinks = document.querySelector(".nav-links");

if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("active"));
  });
}

if (openModalBtn) {
  openModalBtn.addEventListener("click", () => {
    consultModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });
}

closeModalBtn.addEventListener("click", () => {
  consultModal.classList.remove("active");
  document.body.style.overflow = "";
});

consultModal.addEventListener("click", (e) => {
  if (e.target === consultModal) {
    consultModal.classList.remove("active");
    document.body.style.overflow = "";
  }
});

// Form submit
function submitContact(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  alert(
    `Cảm ơn ${name}! KYFAN đã ghi nhận thông tin của bạn và sẽ liên hệ sớm.`,
  );
  event.target.reset();
}

function submitModalForm(event) {
  event.preventDefault();
  const name = document.getElementById("modalName").value.trim();
  alert(`Cảm ơn ${name}! Yêu cầu tư vấn nhanh đã được ghi nhận.`);
  consultModal.classList.remove("active");
  document.body.style.overflow = "";
  event.target.reset();
}
