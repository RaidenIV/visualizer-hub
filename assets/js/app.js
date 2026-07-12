import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { hubConfig } from "./config.js";

const appShell = document.querySelector("#appShell");
const sidebarToggle = document.querySelector("#sidebarToggle");
const sidebarToggleIcon = document.querySelector("#sidebarToggleIcon");
const sidebarDate = document.querySelector("#sidebarDate");
const canvas = document.querySelector("#showcaseCanvas");
const showcase = document.querySelector(".showcase");
const xmbMenu = document.querySelector("#xmbMenu");
const xmbCategories = document.querySelector("#xmbCategories");
const xmbItems = document.querySelector("#xmbItems");
const xmbItemsStage = document.querySelector("#xmbItemsStage");
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const shapeToggle = document.querySelector("#shapeToggle");
const configToggle = document.querySelector("#configToggle");
const configPanel = document.querySelector("#configPanel");
const exportSettingsButton = document.querySelector("#exportSettings");
const settingInputs = [...document.querySelectorAll("[data-scene-setting]")];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const projectTotal = hubConfig.projects.length;
const audioCategoryIndex = Math.max(
  0,
  hubConfig.categories.findIndex((category) => category.id === "audio")
);

let selectedProjectIndex = 0;
let activeCategoryIndex = audioCategoryIndex;
let activeItemIndices = hubConfig.categories.map(() => 0);
let sidebarCollapsed = false;
let sceneController = null;
let activePreset = "blueScifi";
let shapeVisible = true;
let wheelLocked = false;
let wheelAccumulator = 0;
let wheelResetTimer = 0;
let itemPointerLocked = false;

document.documentElement.style.setProperty("--accent", hubConfig.accent);

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
sidebarDate.textContent = currentDate;

function getProjectIndex(projectId) {
  return hubConfig.projects.findIndex((project) => project.id === projectId);
}

function getVisualizerLocation(projectId) {
  for (let categoryIndex = 0; categoryIndex < hubConfig.categories.length; categoryIndex += 1) {
    const itemIndex = hubConfig.categories[categoryIndex].items.findIndex(
      (item) => item.visualizerId === projectId
    );
    if (itemIndex >= 0) return { categoryIndex, itemIndex };
  }
  return null;
}


function createCategoryButton(category, index) {
  const button = document.createElement("button");
  button.className = "xmb-category";
  button.type = "button";
  button.dataset.index = String(index);
  button.setAttribute("role", "tab");
  button.setAttribute("aria-controls", "xmbItems");
  button.setAttribute("aria-label", `${category.name} category`);
  button.innerHTML = `
    <span class="xmb-category__icon-wrap" aria-hidden="true">
      <img class="xmb-category__icon" src="${category.icon}" alt="" />
    </span>
    <span class="xmb-category__name">${category.name}</span>
  `;

  button.addEventListener("click", () => selectCategory(index));
  return button;
}

function createXmbItem(item, index) {
  const link = document.createElement("a");
  link.className = "xmb-item";
  link.href = item.href;
  link.target = item.href.endsWith("svg.html") ? "_self" : "_blank";
  if (link.target === "_blank") link.rel = "noopener noreferrer";
  link.dataset.index = String(index);
  link.innerHTML = `<span class="xmb-item__name">${item.name}</span>`;

  link.addEventListener("pointerenter", () => {
    if (itemPointerLocked) return;
    itemPointerLocked = true;
    selectXmbItem(index);
    window.setTimeout(() => {
      itemPointerLocked = false;
    }, 230);
  });
  link.addEventListener("focus", () => selectXmbItem(index));
  link.addEventListener("click", () => selectXmbItem(index));
  return link;
}

function updateCategoryState() {
  xmbCategories.querySelectorAll(".xmb-category").forEach((button, index) => {
    const isActive = index === activeCategoryIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
}

function updateXmbItemPositions() {
  const links = [...xmbItems.querySelectorAll(".xmb-item")];
  if (!links.length) return;

  const selectedIndex = activeItemIndices[activeCategoryIndex];
  const activeButton = xmbCategories.querySelector(".xmb-category.is-active");
  const activeIcon = activeButton?.querySelector(".xmb-category__icon-wrap");
  const activeItem = links[selectedIndex];
  if (!activeIcon || !activeItem) return;

  const stageBounds = xmbItemsStage.getBoundingClientRect();
  const iconBounds = activeIcon.getBoundingClientRect();
  const itemHeight = activeItem.offsetHeight || 40;
  const itemGap = 8;
  const itemStep = itemHeight + itemGap;
  const iconToSelectedGap = Math.max(24, stageBounds.top - iconBounds.bottom);
  const nearestAboveTop = iconBounds.top - iconToSelectedGap - itemHeight - stageBounds.top;

  links.forEach((link, index) => {
    const y = index < selectedIndex
      ? nearestAboveTop - (selectedIndex - index - 1) * itemStep
      : (index - selectedIndex) * itemStep;
    link.style.setProperty("--xmb-item-y", `${y}px`);
  });
}

function updateXmbStageAnchor() {
  const activeButton = xmbCategories.querySelector(".xmb-category.is-active");
  if (!activeButton) return;

  const rowCenter = xmbCategories.scrollWidth / 2;
  const activeCenter = activeButton.offsetLeft + activeButton.offsetWidth / 2;
  const categoryShift = rowCenter - activeCenter;
  xmbCategories.style.setProperty("--xmb-category-shift", `${categoryShift}px`);
  xmbMenu.style.setProperty("--xmb-anchor-x", "50%");

  requestAnimationFrame(updateXmbItemPositions);
}

function selectVisualizer(index, { syncXmb = false } = {}) {
  selectedProjectIndex = (index + projectTotal) % projectTotal;
  const project = hubConfig.projects[selectedProjectIndex];

  sceneController?.setProject(project);

  if (syncXmb) {
    const location = getVisualizerLocation(project.id);
    if (location) {
      activeItemIndices[location.categoryIndex] = location.itemIndex;
      selectCategory(location.categoryIndex);
    }
  }
}

function updateXmbSelection({ focus = false, animate = false, direction = 1 } = {}) {
  const category = hubConfig.categories[activeCategoryIndex];
  const itemTotal = category.items.length;
  const selectedItemIndex = (activeItemIndices[activeCategoryIndex] + itemTotal) % itemTotal;
  activeItemIndices[activeCategoryIndex] = selectedItemIndex;
  const selectedItem = category.items[selectedItemIndex];

  xmbItems.querySelectorAll(".xmb-item").forEach((link, index) => {
    const isActive = index === selectedItemIndex;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "true" : "false");
    link.tabIndex = isActive ? 0 : -1;
  });

  updateXmbItemPositions();

  if (selectedItem.visualizerId) {
    const projectIndex = getProjectIndex(selectedItem.visualizerId);
    if (projectIndex >= 0) selectVisualizer(projectIndex);
  }

  if (animate) sceneController?.nudge(direction);
  if (focus) xmbItems.querySelector(".xmb-item.is-active")?.focus({ preventScroll: true });
}

function renderXmbItems() {
  const category = hubConfig.categories[activeCategoryIndex];
  const fragment = document.createDocumentFragment();
  category.items.forEach((item, index) => fragment.append(createXmbItem(item, index)));
  xmbItems.replaceChildren(fragment);
  xmbItems.setAttribute("aria-label", `${category.name} links`);
  updateXmbSelection();
}

function selectCategory(index, { focus = false } = {}) {
  const categoryTotal = hubConfig.categories.length;
  activeCategoryIndex = (index + categoryTotal) % categoryTotal;
  updateCategoryState();
  renderXmbItems();
  requestAnimationFrame(updateXmbStageAnchor);

  if (focus) {
    xmbCategories
      .querySelector(`.xmb-category[data-index="${activeCategoryIndex}"]`)
      ?.focus({ preventScroll: true });
  }
}

function selectXmbItem(index, { focus = false, animate = false, direction = 1 } = {}) {
  const category = hubConfig.categories[activeCategoryIndex];
  activeItemIndices[activeCategoryIndex] = (index + category.items.length) % category.items.length;
  updateXmbSelection({ focus, animate, direction });
}

function renderXmb() {
  const fragment = document.createDocumentFragment();
  hubConfig.categories.forEach((category, index) => {
    fragment.append(createCategoryButton(category, index));
  });
  xmbCategories.replaceChildren(fragment);
  selectCategory(activeCategoryIndex);
}

function navigateXmbItems(direction, { focus = false } = {}) {
  const category = hubConfig.categories[activeCategoryIndex];
  selectXmbItem(activeItemIndices[activeCategoryIndex] + direction, {
    focus,
    animate: true,
    direction
  });
}

function navigateCategories(direction, { focus = false } = {}) {
  selectCategory(activeCategoryIndex + direction, { focus });
}

function setSidebarCollapsed(collapsed) {
  sidebarCollapsed = collapsed;
  appShell.classList.toggle("sidebar-collapsed", collapsed);
  sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  sidebarToggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
  sidebarToggleIcon.textContent = collapsed ? "›" : "‹";
  window.setTimeout(() => {
    sceneController?.resize();
    updateXmbStageAnchor();
  }, 200);
}

function formatSettingValue(input, value) {
  const step = Number(input.step || 1);
  if (step >= 1) return String(Math.round(value));
  if (step < 0.001) return value.toFixed(4);
  if (step < 0.01) return value.toFixed(3);
  return value.toFixed(2);
}

function setControlValue(name, value) {
  const input = document.querySelector(`[data-scene-setting="${name}"]`);
  const output = document.querySelector(`[data-output-for="${name}"]`);
  if (!(input instanceof HTMLInputElement)) return;
  input.value = String(value);
  if (output) output.textContent = formatSettingValue(input, Number(value));
}

function activatePreset(preset) {
  activePreset = preset;
  presetButtons.forEach((button) => {
    const isActive = button.dataset.preset === preset;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const bloomIntensity = preset === "default" ? 1.2 : 0.9;
  setControlValue("bloomIntensity", bloomIntensity);
  sceneController?.setSetting("bloomIntensity", bloomIntensity);
  sceneController?.setPreset(preset);
}

function setShapeVisible(visible) {
  shapeVisible = visible;
  shapeToggle.classList.toggle("is-active", visible);
  shapeToggle.setAttribute("aria-pressed", String(visible));
  sceneController?.setShapeVisible(visible);
}

function exportSettings() {
  const settings = Object.fromEntries(
    settingInputs.map((input) => [input.dataset.sceneSetting, Number(input.value)])
  );
  const payload = {
    preset: activePreset,
    shapeVisible,
    settings
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "audio-visualization-hub-settings.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bindShowcaseControls() {
  presetButtons.forEach((button) => {
    button.addEventListener("click", () => activatePreset(button.dataset.preset));
  });

  shapeToggle.addEventListener("click", () => setShapeVisible(!shapeVisible));

  exportSettingsButton.addEventListener("click", exportSettings);

  configToggle.addEventListener("click", () => {
    const expanded = configToggle.getAttribute("aria-expanded") === "true";
    configToggle.setAttribute("aria-expanded", String(!expanded));
    configToggle.classList.toggle("is-active", !expanded);
    configPanel.hidden = expanded;
  });

  settingInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const name = input.dataset.sceneSetting;
      const value = Number(input.value);
      const output = document.querySelector(`[data-output-for="${name}"]`);
      if (output) output.textContent = formatSettingValue(input, value);
      sceneController?.setSetting(name, value);
    });
  });
}

function handleMenuWheel(event) {
  event.preventDefault();

  const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
    ? event.deltaY
    : event.deltaX;
  if (primaryDelta === 0) return;

  const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
    ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
      ? window.innerHeight
      : 1;

  window.clearTimeout(wheelResetTimer);
  wheelResetTimer = window.setTimeout(() => {
    wheelAccumulator = 0;
  }, 140);

  if (wheelLocked) return;

  wheelAccumulator += primaryDelta * deltaScale;
  if (Math.abs(wheelAccumulator) < 12) return;

  const direction = wheelAccumulator > 0 ? 1 : -1;
  wheelAccumulator = 0;
  wheelLocked = true;
  navigateXmbItems(direction);

  window.setTimeout(() => {
    wheelLocked = false;
  }, 170);
}

sidebarToggle.addEventListener("click", () => setSidebarCollapsed(!sidebarCollapsed));
showcase.addEventListener("wheel", handleMenuWheel, { passive: false, capture: true });

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    navigateCategories(1, { focus: true });
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigateCategories(-1, { focus: true });
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    navigateXmbItems(1, { focus: true });
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    navigateXmbItems(-1, { focus: true });
    return;
  }

  if (
    event.key === "Enter" &&
    !(document.activeElement instanceof HTMLAnchorElement) &&
    !(document.activeElement instanceof HTMLButtonElement)
  ) {
    event.preventDefault();
    xmbItems.querySelector(".xmb-item.is-active")?.click();
  }
});

class CylindricalShowcase {
  constructor(targetCanvas, container) {
    this.canvas = targetCanvas;
    this.container = container;
    this.clock = new THREE.Clock();
    this.cards = [];
    this.textures = new Map();
    this.activeProject = null;
    this.activePreset = "blueScifi";
    this.rotation = 0;
    this.rotationSpeed = 0.002;
    this.lastDirection = 1;
    this.scrollOffset = 0;
    this.scrollVelocity = 0;
    this.dragging = false;
    this.pointerId = null;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.pendingProjectToken = 0;
    this.frameId = 0;
    this.mousePosition = { x: 0, y: 0 };
    this.smoothMousePosition = { x: 0, y: 0 };
    this.targetZoom = 11;
    this.currentZoom = 11;

    this.instanceCount = 20;
    this.settings = {
      imageScale: 0.83,
      radius: 6.4,
      spiralStep: 1.48,
      imagesPerTurn: 6,
      curvature: 1.5,
      momentum: 0.87,
      autoRotateSpeed: 0.002,
      scrollRotateForce: 1.75,
      maxRotationSpeed: 0.15,
      rotationSmoothing: 0.09,
      scrollAdvanceSpeed: 0.17,
      opacity: 1,
      scanLines: 0.6,
      flickerIntensity: 0.18,
      bloomIntensity: 0.9,
      torusScale: 2.3,
      torusOpacity: 0.8,
      gridSize: 0.45,
      subdivisions: 2,
      majorLineWidth: 0.005,
      minorLineWidth: 0.004,
      dotSize: 0.011,
      majorLineOpacity: 0.46,
      minorLineOpacity: 0.14,
      dotOpacity: 1,
      bgOpacity: 0.51,
      tileX: 17,
      tileY: 5,
      horizontalFade: 0.1,
      horizontalFadeSoftness: 0.7
    };
    this.totalHeight = this.instanceCount * this.settings.spiralStep;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 120);
    this.camera.position.set(0, 0, 11);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.65, 0.01);
    this.composer.addPass(this.bloomPass);

    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.setCrossOrigin("anonymous");

    this.createBackgroundGrid();
    this.createWireframeShape();
    this.createCards();
    this.bindInput();
    this.resize();
    this.animate = this.animate.bind(this);
    this.frameId = requestAnimationFrame(this.animate);
  }

  createBackgroundGrid() {
    const vertexShader = `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;

      uniform float uGridSize;
      uniform float uSubdivisions;
      uniform float uMajorLineWidth;
      uniform float uMinorLineWidth;
      uniform float uDotSize;
      uniform vec3 uMajorLineColor;
      uniform vec3 uMinorLineColor;
      uniform vec3 uDotColor;
      uniform float uMajorLineOpacity;
      uniform float uMinorLineOpacity;
      uniform float uDotOpacity;
      uniform vec3 uBgColor;
      uniform float uBgOpacity;
      uniform float uTileX;
      uniform float uTileY;
      uniform float uHorizontalFade;
      uniform float uHorizontalFadeSoftness;

      varying vec2 vUv;

      void main() {
        vec2 uv = vec2(vUv.x * uTileX, vUv.y * uTileY);

        float cellSize = uGridSize;
        vec2 majorGrid = mod(uv, cellSize);
        vec2 majorDist = min(majorGrid, cellSize - majorGrid);
        float majorLine = min(majorDist.x, majorDist.y);
        float majorMask = 1.0 - smoothstep(0.0, uMajorLineWidth, majorLine);

        float subCellSize = cellSize / uSubdivisions;
        vec2 minorGrid = mod(uv, subCellSize);
        vec2 minorDist = min(minorGrid, subCellSize - minorGrid);
        float minorLine = min(minorDist.x, minorDist.y);
        float minorMask = 1.0 - smoothstep(0.0, uMinorLineWidth, minorLine);
        minorMask *= 1.0 - majorMask;

        vec2 nearestMajor = floor(uv / cellSize + 0.5) * cellSize;
        float distToDot = length(uv - nearestMajor);
        float dotMask = 1.0 - smoothstep(0.0, uDotSize, distToDot);

        float horzDist = abs(vUv.x - 0.5) * 2.0;
        float horzMask = smoothstep(
          uHorizontalFade,
          uHorizontalFade + uHorizontalFadeSoftness,
          horzDist
        );

        vec3 color = uBgColor;
        float alpha = uBgOpacity;

        color = mix(color, uMinorLineColor, minorMask * uMinorLineOpacity);
        alpha = max(alpha, minorMask * uMinorLineOpacity);

        color = mix(color, uMajorLineColor, majorMask * uMajorLineOpacity);
        alpha = max(alpha, majorMask * uMajorLineOpacity);

        color = mix(color, uDotColor, dotMask * uDotOpacity);
        alpha = max(alpha, dotMask * uDotOpacity);

        alpha *= horzMask;
        gl_FragColor = vec4(color, alpha);
      }
    `;

    this.gridUniforms = {
      uGridSize: { value: this.settings.gridSize },
      uSubdivisions: { value: this.settings.subdivisions },
      uMajorLineWidth: { value: this.settings.majorLineWidth },
      uMinorLineWidth: { value: this.settings.minorLineWidth },
      uDotSize: { value: this.settings.dotSize },
      uMajorLineColor: { value: new THREE.Color(hubConfig.accent) },
      uMinorLineColor: { value: new THREE.Color(hubConfig.accent) },
      uDotColor: { value: new THREE.Color(hubConfig.accent) },
      uMajorLineOpacity: { value: this.settings.majorLineOpacity },
      uMinorLineOpacity: { value: this.settings.minorLineOpacity },
      uDotOpacity: { value: this.settings.dotOpacity },
      uBgColor: { value: new THREE.Color("#001d50") },
      uBgOpacity: { value: this.settings.bgOpacity },
      uTileX: { value: this.settings.tileX },
      uTileY: { value: this.settings.tileY },
      uHorizontalFade: { value: this.settings.horizontalFade },
      uHorizontalFadeSoftness: { value: this.settings.horizontalFadeSoftness }
    };

    const geometry = new THREE.CylinderGeometry(32, 32, 90, 64, 1, true);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.gridUniforms,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    this.grid = new THREE.Mesh(geometry, material);
    this.grid.renderOrder = -1;
    this.scene.add(this.grid);
  }

  createWireframeShape() {
    const geometry = new THREE.TorusGeometry(1, 0.35, 16, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(hubConfig.accent),
      wireframe: true,
      transparent: true,
      opacity: this.settings.torusOpacity,
      side: THREE.FrontSide
    });

    this.torus = new THREE.Mesh(geometry, material);
    this.torus.scale.setScalar(this.settings.torusScale);
    this.torus.rotation.set(-0.5, 0, -1.95);
    this.scene.add(this.torus);
  }

  createCardMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uAccent: { value: new THREE.Color(hubConfig.accent) },
        uAccentBright: { value: new THREE.Color("#4ca0ff") },
        uOpacity: { value: 1 },
        uDepthFade: { value: 1 },
        uFlicker: { value: this.settings.flickerIntensity },
        uChromatic: { value: 0.006 },
        uCurvature: { value: this.settings.curvature },
        uScanLines: { value: this.settings.scanLines }
      },
      vertexShader: `
        uniform float uCurvature;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 transformed = position;
          transformed.z -= position.x * position.x * uCurvature * 0.0366667;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform sampler2D uTexture;
        uniform float uTime;
        uniform vec3 uAccent;
        uniform vec3 uAccentBright;
        uniform float uOpacity;
        uniform float uDepthFade;
        uniform float uFlicker;
        uniform float uChromatic;
        uniform float uScanLines;

        varying vec2 vUv;

        float roundedBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
        }

        void main() {
          vec2 uv = vUv;
          vec2 offset = vec2(uChromatic * (1.0 - uDepthFade), 0.0);
          float r = texture2D(uTexture, uv + offset).r;
          float g = texture2D(uTexture, uv).g;
          float b = texture2D(uTexture, uv - offset).b;
          vec3 source = vec3(r, g, b);
          float luma = dot(source, vec3(0.299, 0.587, 0.114));
          luma = clamp((luma - 0.43) * 1.35 + 0.5, 0.0, 1.0);

          vec2 cellCount = vec2(118.0, 68.0);
          vec2 cell = fract(uv * cellCount) - 0.5;
          float radius = mix(0.08, 0.49, luma);
          float dotMask = 1.0 - smoothstep(radius - 0.075, radius, length(cell));

          float scanWave = 0.82 + 0.18 * sin((uv.y * 760.0) + uTime * 15.0);
          float scan = mix(1.0, scanWave, uScanLines);
          vec3 imageColor = mix(uAccent * 0.12, uAccentBright * (0.72 + luma * 1.1), dotMask);
          imageColor *= scan;
          imageColor += source * 0.075;

          vec2 centered = uv - 0.5;
          float panel = roundedBox(centered, vec2(0.495), 0.012);
          float panelMask = 1.0 - smoothstep(-0.006, 0.006, panel);

          float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
          float border = 1.0 - smoothstep(0.006, 0.016, edgeDistance);

          float corner = 0.0;
          float cornerSize = 0.085;
          float cornerWidth = 0.008;
          vec2 c = min(uv, 1.0 - uv);
          if ((c.x < cornerWidth && c.y < cornerSize) || (c.y < cornerWidth && c.x < cornerSize)) {
            corner = 1.0;
          }

          float flickerWave = sin(uTime * 67.0 + uv.y * 9.0) * 0.5 + 0.5;
          float flicker = 1.0 - uFlicker * 0.14 * flickerWave;

          vec3 color = mix(imageColor, uAccentBright * 2.1, max(border, corner));
          color *= flicker;

          float alpha = panelMask * uOpacity * uDepthFade;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
  }

  createCards() {
    const geometry = new THREE.PlaneGeometry(4.15, 2.5, 32, 1);

    for (let i = 0; i < this.instanceCount; i += 1) {
      const material = this.createCardMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.userData.index = i;
      this.cards.push(mesh);
      this.scene.add(mesh);
    }

    this.updateCardLayout();
  }

  updateCardLayout() {
    this.totalHeight = this.instanceCount * this.settings.spiralStep;
    this.cards.forEach((card, index) => {
      card.userData.baseAngle = index * ((Math.PI * 2) / this.settings.imagesPerTurn);
      card.userData.baseY = -(this.totalHeight / 2) + index * this.settings.spiralStep;
    });
  }

  loadTexture(path) {
    if (this.textures.has(path)) return this.textures.get(path);

    const promise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        reject
      );
    });

    this.textures.set(path, promise);
    return promise;
  }

  async setProject(project) {
    this.activeProject = project;
    const token = ++this.pendingProjectToken;

    try {
      const loaded = await Promise.all(project.images.map((path) => this.loadTexture(path)));
      if (token !== this.pendingProjectToken) return;

      this.cards.forEach((card, index) => {
        card.material.uniforms.uTexture.value = loaded[index % loaded.length];
        card.material.needsUpdate = true;
      });
    } catch (error) {
      console.error("Unable to load showcase images.", error);
    }
  }

  setPreset(preset) {
    this.activePreset = preset;
    const isDefault = preset === "default";
    const accent = new THREE.Color(isDefault ? "#ffffff" : hubConfig.accent);
    const accentBright = new THREE.Color(isDefault ? "#ffffff" : "#4ca0ff");

    this.cards.forEach((card) => {
      card.material.uniforms.uAccent.value.copy(accent);
      card.material.uniforms.uAccentBright.value.copy(accentBright);
    });
  }

  setShapeVisible(visible) {
    this.torus.visible = visible;
  }

  setSetting(name, value) {
    if (!(name in this.settings) || !Number.isFinite(value)) return;
    this.settings[name] = name === "imagesPerTurn" ? Math.round(value) : value;

    if (["radius", "spiralStep", "imagesPerTurn"].includes(name)) {
      this.updateCardLayout();
    }

    if (name === "curvature") {
      this.cards.forEach((card) => {
        card.material.uniforms.uCurvature.value = value;
      });
    }

    if (name === "scanLines") {
      this.cards.forEach((card) => {
        card.material.uniforms.uScanLines.value = value;
      });
    }

    if (name === "flickerIntensity") {
      this.cards.forEach((card) => {
        card.material.uniforms.uFlicker.value = value;
      });
    }

    if (name === "bloomIntensity") this.bloomPass.strength = value;
    if (name === "torusOpacity") this.torus.material.opacity = value;

    const gridUniformMap = {
      gridSize: "uGridSize",
      majorLineOpacity: "uMajorLineOpacity",
      minorLineOpacity: "uMinorLineOpacity",
      dotOpacity: "uDotOpacity",
      bgOpacity: "uBgOpacity"
    };
    const uniformName = gridUniformMap[name];
    if (uniformName) this.gridUniforms[uniformName].value = value;
  }

  nudge(direction) {
    this.lastDirection = direction < 0 ? -1 : 1;
    this.scrollVelocity += this.lastDirection * 0.18;
  }

  bindInput() {
    this.onPointerDown = (event) => {
      this.dragging = true;
      this.pointerId = event.pointerId;
      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
      this.canvas.classList.add("is-dragging");
      this.canvas.setPointerCapture?.(event.pointerId);
    };

    this.onPointerMove = (event) => {
      if (!this.dragging || event.pointerId !== this.pointerId) return;
      const deltaX = event.clientX - this.lastPointerX;
      const deltaY = event.clientY - this.lastPointerY;
      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
      this.scrollVelocity += deltaX * 0.0008 + deltaY * 0.00135;
    };

    this.onPointerUp = (event) => {
      if (event.pointerId !== this.pointerId) return;
      this.dragging = false;
      this.pointerId = null;
      this.canvas.classList.remove("is-dragging");
      try {
        this.canvas.releasePointerCapture?.(event.pointerId);
      } catch {
        // The pointer may already have been released by the browser.
      }
    };

    this.onMouseMove = (event) => {
      this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("mousemove", this.onMouseMove, { passive: true });
  }

  resize() {
    const bounds = this.container.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    const motionScale = reducedMotion.matches ? 0.16 : 1;

    this.scrollVelocity *= this.dragging ? 0.93 : this.settings.momentum;
    if (Math.abs(this.scrollVelocity) > 0.00001) {
      this.lastDirection = Math.sign(this.scrollVelocity);
    }

    const autoSpeed = this.settings.autoRotateSpeed * this.lastDirection * motionScale;
    const targetRotationSpeed = autoSpeed + this.scrollVelocity * this.settings.scrollRotateForce;
    const clampedRotationSpeed = THREE.MathUtils.clamp(
      targetRotationSpeed,
      -this.settings.maxRotationSpeed,
      this.settings.maxRotationSpeed
    );
    this.rotationSpeed +=
      (clampedRotationSpeed - this.rotationSpeed) * this.settings.rotationSmoothing;
    this.rotation += this.rotationSpeed * delta * 60;
    this.scrollOffset += this.scrollVelocity * this.settings.scrollAdvanceSpeed * 60 * motionScale;

    const squeeze = Math.min(Math.abs(this.scrollVelocity) * 3, 0.45);

    this.cards.forEach((card, index) => {
      const angle = card.userData.baseAngle + this.rotation;
      const rawY = card.userData.baseY + this.scrollOffset;
      const y =
        THREE.MathUtils.euclideanModulo(rawY + this.totalHeight / 2, this.totalHeight) -
        this.totalHeight / 2;
      const x = Math.sin(angle) * this.settings.radius;
      const z = Math.cos(angle) * this.settings.radius;

      card.position.set(x, y, z);
      card.rotation.set(0, angle, 0);
      card.scale.set(
        this.settings.imageScale * (1 - squeeze * 0.28),
        this.settings.imageScale * (1 + squeeze * 0.13),
        this.settings.imageScale
      );

      const frontness = THREE.MathUtils.smoothstep(
        z,
        -this.settings.radius * 0.65,
        this.settings.radius
      );
      const verticalFade = 1 - THREE.MathUtils.smoothstep(Math.abs(y), 4.0, 9.5);
      const depthFade = THREE.MathUtils.clamp(frontness * verticalFade, 0.04, 1);
      card.material.uniforms.uTime.value = elapsed;
      card.material.uniforms.uDepthFade.value = depthFade;
      card.material.uniforms.uOpacity.value = (0.32 + depthFade * 0.68) * this.settings.opacity;
      card.renderOrder = Math.round((z + this.settings.radius) * 100) + index;
    });

    const torusTargetSpeed = 0.004 * this.lastDirection + this.scrollVelocity * 1.75;
    this.torus.rotation.y += THREE.MathUtils.clamp(torusTargetSpeed, -0.15, 0.15) * delta * 60;
    this.torus.rotation.x = -0.5;
    this.torus.rotation.z = -1.95;
    const torusScale = this.settings.torusScale - Math.min(Math.abs(this.scrollVelocity) * 0.2, 0.42);
    this.torus.scale.lerp(new THREE.Vector3(torusScale, torusScale, torusScale), 0.04);

    this.smoothMousePosition.x += (this.mousePosition.x - this.smoothMousePosition.x) * 0.06;
    this.smoothMousePosition.y += (this.mousePosition.y - this.smoothMousePosition.y) * 0.06;
    this.camera.position.x = this.smoothMousePosition.x * 0.8;
    this.camera.position.y = this.smoothMousePosition.y * 1.2;

    const absoluteVelocity = Math.abs(this.scrollVelocity);
    this.targetZoom += absoluteVelocity * 0.05;
    this.targetZoom = THREE.MathUtils.clamp(this.targetZoom, 11, 28.5);
    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;
    this.camera.position.z = this.currentZoom;
    this.targetZoom = THREE.MathUtils.lerp(this.targetZoom, 11, 0.9);
    this.camera.lookAt(0, 0.1, 0);

    this.grid.position.copy(this.camera.position);

    this.composer.render();
    this.frameId = requestAnimationFrame(this.animate);
  }
}

function showWebGLError(message) {
  const error = document.createElement("div");
  error.className = "webgl-error";
  error.textContent = message;
  showcase.append(error);
}

renderXmb();
bindShowcaseControls();

if (window.innerWidth <= 980) {
  setSidebarCollapsed(true);
}

try {
  sceneController = new CylindricalShowcase(canvas, showcase);
  sceneController.setProject(hubConfig.projects[selectedProjectIndex]);
  sceneController.setPreset(activePreset);
  sceneController.setShapeVisible(shapeVisible);
} catch (error) {
  console.error(error);
  showWebGLError("The 3D showcase could not start. Enable WebGL hardware acceleration and reload the page.");
}

window.addEventListener(
  "resize",
  () => {
    sceneController?.resize();
    updateXmbStageAnchor();
  },
  { passive: true }
);
