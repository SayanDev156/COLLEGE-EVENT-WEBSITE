const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const navLinks = document.querySelectorAll(".main-nav a");
const sections = document.querySelectorAll("main section");
const backTop = document.getElementById("backTop");
const yearEl = document.getElementById("year");

const announcementBar = document.getElementById("announcementBar");
const highlightGrid = document.getElementById("highlightGrid");
const speakerGrid = document.getElementById("speakerGrid");

const joinNowBtn = document.getElementById("joinNowBtn");
const heroRegisterBtn = document.getElementById("heroRegisterBtn");
const infoModal = document.getElementById("infoModal");
const closeModal = document.getElementById("closeModal");
const modalRegister = document.getElementById("modalRegister");
const modalText = document.getElementById("modalText");

const daySwitcher = document.getElementById("daySwitcher");
const dayButtons = document.querySelectorAll(".day-btn");
const scheduleDays = document.querySelectorAll(".schedule-day");

const form = document.getElementById("registrationForm");
const formSuccess = document.getElementById("formSuccess");

const revealEls = document.querySelectorAll(".reveal");

function showGlobalError(message) {
  modalText.textContent = message;
  setModalState(true);
}

window.addEventListener("error", () => {
  showGlobalError("A temporary issue occurred. Please retry in a moment.");
});

window.addEventListener("unhandledrejection", () => {
  showGlobalError("Network issue detected. Please check your connection and try again.");
});

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
  });
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 500) {
    backTop.classList.add("show");
  } else {
    backTop.classList.remove("show");
  }

  const scrollPosition = window.scrollY + 110;
  sections.forEach((section) => {
    if (
      scrollPosition >= section.offsetTop &&
      scrollPosition < section.offsetTop + section.offsetHeight
    ) {
      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${section.id}`) {
          link.classList.add("active");
        }
      });
    }
  });
});

if (backTop) {
  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setModalState(open) {
  infoModal.classList.toggle("open", open);
  infoModal.setAttribute("aria-hidden", String(!open));
}

joinNowBtn.addEventListener("click", () => {
  modalText.textContent = "Limited seats left for early-bird participants. Register in under 2 minutes.";
  setModalState(true);
});

heroRegisterBtn.addEventListener("click", () => {
  modalText.textContent = "Reserve your seat now and unlock all competition tracks at CampusFest 2026.";
  setModalState(true);
});

closeModal.addEventListener("click", () => setModalState(false));

infoModal.addEventListener("click", (event) => {
  if (event.target === infoModal) {
    setModalState(false);
  }
});

modalRegister.addEventListener("click", () => {
  setModalState(false);
});

function attachHighlightHandlers() {
  const highlightButtons = document.querySelectorAll(".mini-btn[data-action='highlight']");
  highlightButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modalText.textContent =
        "Detailed event brochures will be shared on your registered email address.";
      setModalState(true);
    });
  });
}

function attachSpeakerTilt() {
  const speakerCards = document.querySelectorAll(".speaker-card.tilt");

  speakerCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -10;
      const rotateY = ((x / rect.width) - 0.5) * 10;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseenter", () => {
      card.style.transition = "transform 0.06s linear";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transition = "transform 0.25s ease";
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

if (daySwitcher) {
  daySwitcher.addEventListener("click", (event) => {
    const clicked = event.target.closest(".day-btn");
    if (!clicked) {
      return;
    }

    dayButtons.forEach((btn) => btn.classList.remove("active"));
    clicked.classList.add("active");

    const selectedDay = clicked.dataset.day;
    scheduleDays.forEach((day) => {
      day.classList.toggle("active", day.id === selectedDay);
    });
  });
}

const countdownContainer = document.getElementById("countdown");
const targetDate = new Date("2026-08-17T09:00:00").getTime();

function renderCountdown() {
  const now = Date.now();
  const distance = targetDate - now;

  if (distance <= 0) {
    countdownContainer.innerHTML = "<strong>CampusFest is live now!</strong>";
    return;
  }

  const day = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hour = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const min = Math.floor((distance / (1000 * 60)) % 60);
  const sec = Math.floor((distance / 1000) % 60);

  countdownContainer.innerHTML = `
    <div class="countdown-item"><span>${day}</span>Days</div>
    <div class="countdown-item"><span>${hour}</span>Hrs</div>
    <div class="countdown-item"><span>${min}</span>Min</div>
    <div class="countdown-item"><span>${sec}</span>Sec</div>
  `;
}

renderCountdown();
setInterval(renderCountdown, 1000);

function setError(input, message) {
  const field = input.closest(".field");
  const errorEl = field?.querySelector(".error-msg");
  if (errorEl) {
    errorEl.textContent = message;
  }
}

function clearErrors() {
  document.querySelectorAll(".error-msg").forEach((el) => {
    el.textContent = "";
  });
}

function validateForm() {
  clearErrors();
  formSuccess.textContent = "";

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const college = form.college.value.trim();
  const phone = form.phone.value.trim();
  const eventType = form.eventType.value;
  const terms = form.terms.checked;

  let isValid = true;

  if (name.length < 3) {
    setError(form.name, "Please enter at least 3 characters.");
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError(form.email, "Please enter a valid email address.");
    isValid = false;
  }

  if (college.length < 2) {
    setError(form.college, "Please provide your college name.");
    isValid = false;
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    setError(form.phone, "Enter a valid 10-digit phone number.");
    isValid = false;
  }

  if (!eventType) {
    setError(form.eventType, "Please select a preferred track.");
    isValid = false;
  }

  const checkboxError = document.querySelector(".checkbox-error");
  if (!terms) {
    checkboxError.textContent = "You must agree before submitting.";
    isValid = false;
  }

  return isValid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    college: form.college.value.trim(),
    phone: form.phone.value.trim(),
    eventType: form.eventType.value,
    message: form.message.value.trim(),
    termsAccepted: form.terms.checked
  };

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      formSuccess.textContent = data.message || "Registration failed. Please try again.";
      formSuccess.style.color = "#ff5f5f";
      return;
    }

    formSuccess.textContent = "Registration submitted successfully. Check your email for confirmation.";
    formSuccess.style.color = "#27d3af";
    form.reset();
  } catch (_error) {
    formSuccess.textContent = "Could not submit right now. Please try again in a moment.";
    formSuccess.style.color = "#ff5f5f";
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealEls.forEach((el) => revealObserver.observe(el));

function renderAnnouncement(announcement) {
  if (!announcement?.enabled || !announcement?.message) {
    announcementBar.classList.remove("show");
    announcementBar.textContent = "";
    return;
  }

  announcementBar.textContent = announcement.message;
  announcementBar.classList.add("show");
}

function renderHighlights(highlights = []) {
  highlightGrid.innerHTML = highlights
    .map(
      (item) => `
      <div class="highlight-card">
        <i class="bx ${item.icon || "bx-bulb"}"></i>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <button class="mini-btn" data-action="highlight">Know More</button>
      </div>
    `
    )
    .join("");

  attachHighlightHandlers();
}

function renderSpeakers(speakers = []) {
  speakerGrid.innerHTML = speakers
    .map(
      (item) => `
      <article class="speaker-card tilt">
        <div class="avatar">${item.initials || "CF"}</div>
        <h3>${item.name}</h3>
        <p>${item.role}</p>
      </article>
    `
    )
    .join("");

  attachSpeakerTilt();
}

function renderSchedule(schedule = {}) {
  ["day1", "day2", "day3"].forEach((dayId) => {
    const dayEl = document.getElementById(dayId);
    const entries = schedule[dayId] || [];

    dayEl.innerHTML = entries
      .map((entry) => {
        const splitAt = entry.indexOf("-");
        const time = splitAt > -1 ? entry.slice(0, splitAt).trim() : "";
        const activity = splitAt > -1 ? entry.slice(splitAt + 1).trim() : entry;

        return `<p><strong>${time}:</strong> ${activity}</p>`;
      })
      .join("");
  });
}

async function loadDynamicContent() {
  const fallback = {
    announcement: {
      enabled: true,
      message:
        "Registration closes soon. Early-bird entries get priority in workshop seat allocation."
    },
    highlights: [
      {
        icon: "bx-code-block",
        title: "24-Hour Code Sprint",
        description: "Team up and build impactful solutions on real-world challenges."
      },
      {
        icon: "bx-joystick",
        title: "Esports Championship",
        description: "Compete in university-level gaming tournaments and win prizes."
      },
      {
        icon: "bx-palette",
        title: "Creative Design Jam",
        description: "Rapid-fire design rounds judged by industry UI/UX professionals."
      },
      {
        icon: "bx-microphone",
        title: "Inspiring Keynotes",
        description: "Learn from founders, creators, and technology leaders."
      }
    ],
    speakers: [
      { initials: "AR", name: "Arjun Roy", role: "AI Product Lead, Nova Labs" },
      { initials: "SP", name: "Sneha Pal", role: "Founder, Creatify Studio" },
      { initials: "DM", name: "Dev Mehra", role: "Principal Engineer, PixelStack" },
      { initials: "NT", name: "Niharika Tiwari", role: "Career Mentor & Startup Coach" }
    ],
    schedule: {
      day1: [
        "09:30 AM - Opening Ceremony & Welcome Address",
        "11:00 AM - AI Innovation Expo",
        "02:00 PM - Code Sprint Begins",
        "06:30 PM - Cultural Night - Band Showcase"
      ],
      day2: [
        "09:00 AM - Startup Pitch Bootcamp",
        "12:30 PM - Design Jam Live",
        "03:00 PM - Esports Quarter Finals",
        "07:00 PM - Open Mic & Talent Spotlight"
      ],
      day3: [
        "10:00 AM - Final Coding Presentations",
        "01:00 PM - Founder Panel Discussion",
        "04:00 PM - Awards and Closing Ceremony",
        "05:30 PM - Networking Mixer"
      ]
    }
  };

  try {
    const response = await fetch("/api/content");
    const payload = await response.json();

    if (!payload.success) {
      renderAnnouncement(fallback.announcement);
      renderHighlights(fallback.highlights);
      renderSpeakers(fallback.speakers);
      renderSchedule(fallback.schedule);
      return;
    }

    const content = payload.data || {};

    renderAnnouncement(content.announcement);
    renderHighlights(content.highlights);
    renderSpeakers(content.speakers);
    renderSchedule(content.schedule);
  } catch (_error) {
    renderAnnouncement(fallback.announcement);
    renderHighlights(fallback.highlights);
    renderSpeakers(fallback.speakers);
    renderSchedule(fallback.schedule);
  }
}

loadDynamicContent();
attachSpeakerTilt();
