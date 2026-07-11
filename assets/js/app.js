import { hubConfig } from "./config.js";

const appShell = document.querySelector("#appShell");
const sidebarToggle = document.querySelector("#sidebarToggle");
const sidebarToggleIcon = document.querySelector("#sidebarToggleIcon");
const sidebarProjects = document.querySelector("#sidebarProjects");
const projectMenu = document.querySelector("#projectMenu");
const activeIndex = document.querySelector("#activeIndex");
const totalProjects = document.querySelector("#totalProjects");
const projectCount = document.querySelector("#projectCount");
const activeProjectName = document.querySelector("#activeProjectName");
const activeProjectDescription = document.querySelector("#activeProjectDescription");
const workspaceDate = document.querySelector("#workspaceDate");
const sidebarDate = document.querySelector("#sidebarDate");
const canvas = document.querySelector("#ambientCanvas");
const context = canvas.getContext("2d", { alpha: true });

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const projectTotal = hubConfig.projects.length;
const twoDigit = (value) => String(value).padStart(2, "0");
let selectedIndex = 0;
let sidebarCollapsed = false;
let animationFrame = 0;
let lastFrameTime = 0;
let elapsed = 0;

const state = {
  width: 0,
  height: 0,
  pixelRatio: 1,
  pointerX: 0,
  pointerY: 0,
  targetPointerX: 0,
  targetPointerY: 0,
  particles: []
};

document.documentElement.style.setProperty("--accent", hubConfig.accent);
totalProjects.textContent = twoDigit(projectTotal);
projectCount.textContent = twoDigit(projectTotal);

function formatDate(date) {
  return date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    })
    .toUpperCase();
}

const currentDate = formatDate(new Date());
workspaceDate.textContent = currentDate;
sidebarDate.textContent = currentDate;

function iconMarkup(type) {
  const icons = {
    binary: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M8 49V31M18 49V17M28 49V25M38 49V10M48 49V22M58 49V14" />
        <path d="M6 50H60" />
      </svg>`,
    galaxy: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <ellipse cx="32" cy="32" rx="24" ry="10" transform="rotate(-18 32 32)" />
        <ellipse cx="32" cy="32" rx="16" ry="6" transform="rotate(28 32 32)" />
        <circle cx="32" cy="32" r="3" />
        <circle cx="13" cy="19" r="1.5" />
        <circle cx="51" cy="15" r="1" />
        <circle cx="54" cy="45" r="1.5" />
      </svg>`,
    accelerator: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="21" />
        <circle cx="32" cy="32" r="11" />
        <path d="M32 4V18M32 46V60M4 32H18M46 32H60M12 12L22 22M42 42L52 52M52 12L42 22M22 42L12 52" />
        <circle cx="32" cy="32" r="3" />
      </svg>`,
    voxel: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 7L54 19V45L32 57L10 45V19Z" />
        <path d="M10 19L32 32L54 19M32 32V57M21 13L43 26V51M43 13L21 26V51" />
      </svg>`
  };

  return icons[type] ?? icons.binary;
}

function createProjectCard(project, index) {
  const card = document.createElement("a");
  card.className = "project-card";
  card.href = project.href;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.dataset.index = String(index);
  card.dataset.projectId = project.id;
  card.setAttribute("aria-label", `Open ${project.name}`);

  card.innerHTML = `
    <span class="project-card__number">${twoDigit(index + 1)}</span>
    <span class="project-card__glyph">${iconMarkup(project.visual)}</span>
    <span class="project-card__copy">
      <strong>${project.name}</strong>
      <small>${project.description}</small>
    </span>
    <span class="project-card__meta">
      <span>${project.category}</span>
      <span class="project-card__open" aria-hidden="true">↗</span>
    </span>
  `;

  card.addEventListener("pointerenter", () => selectProject(index, false));
  card.addEventListener("focus", () => selectProject(index, false));
  card.addEventListener("click", () => selectProject(index, false));

  return card;
}

function createSidebarLink(project, index) {
  const link = document.createElement("a");
  link.className = "sidebar-project-link";
  link.href = `#${project.id}`;
  link.dataset.index = String(index);
  link.innerHTML = `
    <span class="sidebar-project-link__number">${twoDigit(index + 1)}</span>
    <span class="sidebar-project-link__name">${project.shortName}</span>
    <span class="sidebar-project-link__indicator" aria-hidden="true"></span>
  `;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    selectProject(index, true);
    projectMenu.querySelector(`[data-index="${index}"]`)?.focus({ preventScroll: true });
  });

  return link;
}

function renderProjects() {
  const menuFragment = document.createDocumentFragment();
  const sidebarFragment = document.createDocumentFragment();

  hubConfig.projects.forEach((project, index) => {
    menuFragment.append(createProjectCard(project, index));
    sidebarFragment.append(createSidebarLink(project, index));
  });

  projectMenu.replaceChildren(menuFragment);
  sidebarProjects.replaceChildren(sidebarFragment);
  selectProject(0, false);
}

function selectProject(index, announce = false) {
  selectedIndex = (index + projectTotal) % projectTotal;
  const project = hubConfig.projects[selectedIndex];

  document.querySelectorAll(".project-card").forEach((card, cardIndex) => {
    const isActive = cardIndex === selectedIndex;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-current", isActive ? "true" : "false");
  });

  document.querySelectorAll(".sidebar-project-link").forEach((link, linkIndex) => {
    const isActive = linkIndex === selectedIndex;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  activeIndex.textContent = twoDigit(selectedIndex + 1);
  activeProjectName.textContent = project.name.toUpperCase();
  activeProjectDescription.textContent = project.description;
  document.body.dataset.activeProject = project.visual;

  if (announce) {
    activeProjectName.focus?.();
  }
}

function setSidebarCollapsed(collapsed) {
  sidebarCollapsed = collapsed;
  appShell.classList.toggle("sidebar-collapsed", collapsed);
  sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  sidebarToggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
  sidebarToggleIcon.textContent = collapsed ? "›" : "‹";
  window.setTimeout(resizeCanvas, 200);
}

sidebarToggle.addEventListener("click", () => setSidebarCollapsed(!sidebarCollapsed));

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    event.preventDefault();
    selectProject(selectedIndex + 1, true);
    projectMenu.querySelector(`[data-index="${selectedIndex}"]`)?.focus({ preventScroll: true });
  }

  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    event.preventDefault();
    selectProject(selectedIndex - 1, true);
    projectMenu.querySelector(`[data-index="${selectedIndex}"]`)?.focus({ preventScroll: true });
  }

  if (event.key === "Enter" && document.activeElement === document.body) {
    projectMenu.querySelector(`[data-index="${selectedIndex}"]`)?.click();
  }
});

function createParticles() {
  const count = Math.max(28, Math.min(76, Math.round(state.width / 24)));
  state.particles = Array.from({ length: count }, (_, index) => ({
    x: ((index * 47) % 101) / 100,
    y: ((index * 71) % 97) / 96,
    size: index % 7 === 0 ? 1.7 : index % 3 === 0 ? 1.1 : 0.7,
    speed: 0.0008 + (index % 6) * 0.00025,
    phase: index * 0.83
  }));
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  state.width = Math.max(1, bounds.width);
  state.height = Math.max(1, bounds.height);
  canvas.width = Math.round(state.width * state.pixelRatio);
  canvas.height = Math.round(state.height * state.pixelRatio);
  context.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
  createParticles();
  drawAmbient(0, true);
}

function drawGrid(ctx, width, height, time) {
  const horizon = height * 0.52 + state.pointerY * 8;
  const centerX = width * 0.5 + state.pointerX * 18;
  const lowerBound = height + 40;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0, 117, 255, 0.12)";

  for (let index = -11; index <= 11; index += 1) {
    const topX = centerX + index * 18;
    const bottomX = centerX + index * 92;
    ctx.beginPath();
    ctx.moveTo(topX, horizon);
    ctx.lineTo(bottomX, lowerBound);
    ctx.stroke();
  }

  for (let row = 0; row < 13; row += 1) {
    const progress = row / 12;
    const eased = progress * progress;
    const y = horizon + eased * (height - horizon + 20);
    const pulse = reducedMotion.matches ? 0 : Math.sin(time * 0.0008 + row * 0.4) * 0.35;
    ctx.globalAlpha = 0.42 + pulse * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawOrbit(ctx, width, height, time) {
  const centerX = width * 0.62 + state.pointerX * 26;
  const centerY = height * 0.49 + state.pointerY * 18;
  const baseRadius = Math.min(width, height) * 0.27;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.18 + state.pointerX * 0.025);

  for (let ring = 0; ring < 5; ring += 1) {
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      baseRadius * (0.72 + ring * 0.12),
      baseRadius * (0.24 + ring * 0.035),
      ring * 0.22,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = `rgba(0, 117, 255, ${0.24 - ring * 0.035})`;
    ctx.lineWidth = ring === 0 ? 1.5 : 1;
    ctx.stroke();
  }

  const nodeCount = 18;
  for (let index = 0; index < nodeCount; index += 1) {
    const angle = (index / nodeCount) * Math.PI * 2 + (reducedMotion.matches ? 0 : time * 0.00008);
    const radius = baseRadius * (0.72 + (index % 4) * 0.08);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.32;
    ctx.fillStyle = index % 5 === 0 ? "rgba(141, 196, 255, 0.95)" : "rgba(0, 117, 255, 0.62)";
    ctx.beginPath();
    ctx.arc(x, y, index % 5 === 0 ? 2.1 : 1.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawWaveform(ctx, width, height, time) {
  const centerY = height * 0.5;
  const startX = Math.max(24, width * 0.08);
  const endX = width * 0.95;
  const points = 84;

  ctx.save();
  ctx.beginPath();
  for (let index = 0; index <= points; index += 1) {
    const x = startX + (index / points) * (endX - startX);
    const envelope = Math.sin((index / points) * Math.PI);
    const movement = reducedMotion.matches ? 0 : time * 0.0035;
    const amplitude = Math.sin(index * 0.72 + movement) * 8 + Math.sin(index * 0.19 - movement * 0.42) * 5;
    const y = centerY + amplitude * envelope;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "rgba(84, 163, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawParticles(ctx, width, height, time) {
  ctx.save();
  state.particles.forEach((particle) => {
    const drift = reducedMotion.matches ? 0 : time * particle.speed;
    const x = ((particle.x + drift * 0.011) % 1) * width;
    const y = (particle.y * height + Math.sin(drift + particle.phase) * 9 + height) % height;
    const distanceFromCenter = Math.abs(x / width - 0.5);
    const opacity = Math.max(0.08, 0.5 - distanceFromCenter * 0.55);
    ctx.fillStyle = `rgba(84, 163, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawAmbient(timestamp, force = false) {
  if (!force && document.hidden) return;

  const delta = Math.min(32, timestamp - lastFrameTime || 16.67);
  lastFrameTime = timestamp;
  elapsed += delta;

  state.pointerX += (state.targetPointerX - state.pointerX) * 0.055;
  state.pointerY += (state.targetPointerY - state.pointerY) * 0.055;

  context.clearRect(0, 0, state.width, state.height);
  drawGrid(context, state.width, state.height, elapsed);
  drawWaveform(context, state.width, state.height, elapsed);
  drawOrbit(context, state.width, state.height, elapsed);
  drawParticles(context, state.width, state.height, elapsed);

  if (!reducedMotion.matches) {
    animationFrame = requestAnimationFrame(drawAmbient);
  }
}

function restartAnimation() {
  cancelAnimationFrame(animationFrame);
  lastFrameTime = 0;
  if (reducedMotion.matches) {
    drawAmbient(0, true);
  } else {
    animationFrame = requestAnimationFrame(drawAmbient);
  }
}

window.addEventListener("pointermove", (event) => {
  state.targetPointerX = (event.clientX / window.innerWidth - 0.5) * 2;
  state.targetPointerY = (event.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener("pointerleave", () => {
  state.targetPointerX = 0;
  state.targetPointerY = 0;
});

window.addEventListener("resize", resizeCanvas, { passive: true });
reducedMotion.addEventListener?.("change", restartAnimation);
document.addEventListener("visibilitychange", restartAnimation);

renderProjects();

if (window.innerWidth <= 860) {
  setSidebarCollapsed(true);
}

resizeCanvas();
restartAnimation();
