import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { hubConfig } from "./config.js";

const DITHER_MODE_MAP = Object.freeze({
  "Static (Flat)": 0,
  Halftone: 1,
  "Inv Halftone": 2,
  Rotation: 3,
  "Stretch V": 4,
  "Stretch H": 5,
  Checkerboard: 6,
  Glitch: 8,
  Melt: 9,
  "Edge Detect": 10,
  Quantize: 12,
  Noise: 13,
  Threshold: 15
});

const DITHER_SHAPE_MAP = Object.freeze({
  Circle: 0,
  Square: 1,
  Diamond: 2,
  Hexagon: 3,
  "Rect V": 4,
  "Rect H": 5,
  Diagonal: 6,
  Octagon: 7,
  Star: 8,
  "Hollow Rect": 9,
  Plus: 10
});

const CONTROL_GROUPS = Object.freeze([
  {
    name: "Gallery",
    controls: [
      { key: "imageScale", label: "Image Size", value: 0.83, min: 0.3, max: 2, step: 0.01 },
      { key: "radius", label: "Radius", value: 6, min: 1, max: 10, step: 0.1 },
      { key: "spiralStep", label: "Spiral Step", value: 0.8, min: 0.3, max: 5, step: 0.05 },
      { key: "imagesPerTurn", label: "Images / Turn", value: 7, min: 2, max: 10, step: 1 },
      { key: "curvature", label: "Curvature", value: 1.5, min: 0.5, max: 4, step: 0.05 }
    ]
  },
  {
    name: "Motion",
    controls: [
      { key: "momentum", label: "Momentum", value: 0.87, min: 0.5, max: 0.99, step: 0.01 },
      { key: "scrollAdvanceSpeed", label: "Scroll Advance Speed", value: 0.17, min: 0, max: 2, step: 0.01 },
      { key: "autoRotateSpeed", label: "Auto-rotate Speed", value: 0.002, min: 0, max: 0.02, step: 0.0005 },
      { key: "scrollRotateForce", label: "Scroll Rotate Force", value: 1.75, min: 0, max: 5, step: 0.05 },
      { key: "maxRotationSpeed", label: "Max Rotation Speed", value: 0.15, min: 0.005, max: 0.2, step: 0.005 },
      { key: "rotationSmoothing", label: "Rotation Smoothing", value: 0.09, min: 0.005, max: 0.2, step: 0.005 }
    ]
  },
  {
    name: "Effects",
    controls: [
      { key: "squeezeMax", label: "Squeeze Intensity", value: 0.5, min: 0, max: 0.8, step: 0.01 },
      { key: "squeezeWidth", label: "Squeeze Width", value: 7.5, min: 1, max: 15, step: 0.5 },
      { key: "chromaticAberration", label: "Chromatic Aberration", value: 0.02, min: 0, max: 0.15, step: 0.005 },
      { key: "opacity", label: "Opacity", value: 1, min: 0, max: 1, step: 0.01 },
      { key: "emission", label: "Emission", value: 0.65, min: 0, max: 3, step: 0.05 },
      { key: "saturation", label: "Saturation", value: 1.5, min: 0, max: 3, step: 0.05 },
      { key: "brightness", label: "Brightness", value: 1.15, min: 0.2, max: 3, step: 0.05 },
      { key: "scanLines", label: "Scan Lines", value: 0.6, min: 0, max: 1, step: 0.05 },
      { key: "scanLineSpeed", label: "Scan Speed", value: 3.9, min: 0, max: 5, step: 0.1 },
      { key: "scanLineDensity", label: "Scan Density", value: 25, min: 5, max: 100, step: 1 },
      { key: "distanceFadeStart", label: "Fade Start", value: 3, min: 0, max: 20, step: 0.5 },
      { key: "distanceFadeEnd", label: "Fade End", value: 8, min: 1, max: 30, step: 0.5 },
      { key: "flickerIntensity", label: "Flicker", value: 0.18, min: 0, max: 1, step: 0.01 },
      { key: "flickerSpeed", label: "Flicker Speed", value: 5, min: 0.1, max: 5, step: 0.1 }
    ]
  },
  {
    name: "Border",
    controls: [
      { key: "borderWidth", label: "Width", value: 0.005, min: 0.005, max: 0.1, step: 0.005 },
      { key: "borderColor", label: "Color", type: "color", value: "#ffffff" },
      { key: "borderEmission", label: "Glow", value: 0, min: 0, max: 5, step: 0.1 },
      { key: "borderRadius", label: "Radius", value: 0, min: 0, max: 0.25, step: 0.005 },
      { key: "borderOffset", label: "Offset", value: 0, min: -0.1, max: 0.1, step: 0.005 }
    ]
  },
  {
    name: "Corners",
    controls: [
      { key: "cornerSize", label: "Size", value: 0.06, min: 0, max: 0.4, step: 0.01 },
      { key: "cornerWidth", label: "Width", value: 0.005, min: 0.005, max: 0.08, step: 0.005 },
      { key: "cornerOffset", label: "Offset", value: 0.03, min: -0.1, max: 0.15, step: 0.005 }
    ]
  },
  {
    name: "Dither",
    controls: [
      { key: "ditherEnabled", label: "Enabled", type: "checkbox", value: true },
      { key: "ditherCellSize", label: "Cell Size", value: 2, min: 0, max: 10, step: 1 },
      { key: "ditherGap", label: "Gap", value: 2.75, min: 0, max: 20, step: 0.25 },
      { key: "ditherContrast", label: "Contrast", value: 0, min: -1, max: 1, step: 0.01 },
      { key: "ditherMode", label: "Mode", type: "select", value: "Inv Halftone", options: Object.keys(DITHER_MODE_MAP) },
      { key: "ditherShape", label: "Shape", type: "select", value: "Circle", options: Object.keys(DITHER_SHAPE_MAP) },
      { key: "ditherBaseScale", label: "Base Scale", value: 0.76, min: 0.1, max: 5, step: 0.01 },
      { key: "ditherIntensity", label: "Intensity", value: 2.61, min: 0, max: 5, step: 0.01 },
      { key: "ditherBgColor", label: "BG Color", type: "color", value: "#111111" },
      { key: "ditherUseColor", label: "Use Image Color", type: "checkbox", value: true },
      { key: "ditherFgColor", label: "FG Color", type: "color", value: "#ffffff" }
    ]
  },
  {
    name: "Grid",
    controls: [
      { key: "cylinderRadius", label: "Radius", value: 32, min: 10, max: 80, step: 1 },
      { key: "cylinderHeight", label: "Height", value: 90, min: 20, max: 200, step: 5 },
      { key: "gridSize", label: "Cell Size", value: 0.45, min: 0.05, max: 1, step: 0.01 },
      { key: "subdivisions", label: "Subdivisions", value: 2, min: 1, max: 6, step: 1 },
      { key: "tileX", label: "Tile X", value: 17, min: 1, max: 40, step: 1 },
      { key: "tileY", label: "Tile Y", value: 5, min: 1, max: 40, step: 1 },
      { key: "majorLineWidth", label: "Major Line W", value: 0.005, min: 0.0005, max: 0.01, step: 0.0005 },
      { key: "minorLineWidth", label: "Minor Line W", value: 0.004, min: 0.0005, max: 0.005, step: 0.0005 },
      { key: "dotSize", label: "Dot Size", value: 0.011, min: 0.001, max: 0.02, step: 0.001 },
      { key: "majorLineColor", label: "Major Color", type: "color", value: hubConfig.accent },
      { key: "minorLineColor", label: "Minor Color", type: "color", value: hubConfig.accent },
      { key: "dotColor", label: "Dot Color", type: "color", value: hubConfig.accent },
      { key: "majorLineOpacity", label: "Major Opacity", value: 0.46, min: 0, max: 1, step: 0.01 },
      { key: "minorLineOpacity", label: "Minor Opacity", value: 0.14, min: 0, max: 1, step: 0.01 },
      { key: "dotOpacity", label: "Dot Opacity", value: 1, min: 0, max: 1, step: 0.01 },
      { key: "horizontalFade", label: "Horizontal Fade", value: 0.1, min: 0, max: 1, step: 0.05 },
      { key: "horizontalFadeSoftness", label: "Horizontal Softness", value: 0.7, min: 0.01, max: 1, step: 0.05 },
      { key: "bgColor", label: "BG Color", type: "color", value: "#001d50" },
      { key: "bgOpacity", label: "BG Opacity", value: 0.51, min: 0, max: 1, step: 0.01 }
    ]
  },
  {
    name: "Camera",
    controls: [
      { key: "panIntensityX", label: "Pan X Intensity", value: 0.8, min: 0, max: 6, step: 0.1 },
      { key: "panIntensityY", label: "Pan Y Intensity", value: 1.2, min: 0, max: 4, step: 0.1 },
      { key: "cameraSmoothing", label: "Smoothing", value: 0.06, min: 0.01, max: 1, step: 0.01 },
      { key: "initialZoom", label: "Base Zoom", value: 11, min: 5, max: 25, step: 0.5 },
      { key: "maxZoomOut", label: "Max Zoom Out", value: 28.5, min: 5, max: 30, step: 0.5 },
      { key: "zoomSpeed", label: "Zoom Speed", value: 0.05, min: 0, max: 0.3, step: 0.005 },
      { key: "zoomDecay", label: "Zoom Decay", value: 0.1, min: 0.01, max: 0.5, step: 0.01 },
      { key: "lookAtX", label: "Look At X", value: 0, min: -5, max: 5, step: 0.1 },
      { key: "lookAtY", label: "Look At Y", value: 0.1, min: -5, max: 5, step: 0.1 },
      { key: "lookAtZ", label: "Look At Z", value: 0, min: -5, max: 5, step: 0.1 }
    ]
  },
  {
    name: "Bloom",
    controls: [
      { key: "bloomIntensity", label: "Intensity", value: 1.2, min: 0, max: 10, step: 0.1 },
      { key: "bloomThreshold", label: "Threshold", value: 0.01, min: 0, max: 2, step: 0.01 },
      { key: "bloomSmoothing", label: "Smoothing", value: 0.45, min: 0, max: 1, step: 0.05 },
      { key: "bloomRadius", label: "Radius", value: 0.65, min: 0, max: 1, step: 0.05 }
    ]
  },
  {
    name: "Torus",
    controls: [
      { key: "shapeEnabled", label: "Enable", type: "checkbox", value: true },
      { key: "shapeType", label: "Shape", type: "select", value: "Torus", options: ["Torus", "TorusKnot", "Cube"] },
      { key: "torusScale", label: "Scale", value: 2.3, min: 0.1, max: 10, step: 0.1 },
      { key: "shapeColor", label: "Color", type: "color", value: hubConfig.accent },
      { key: "shapeAutoRotateSpeed", label: "Auto Rotate", value: 0.004, min: 0, max: 0.02, step: 0.0005 },
      { key: "shapeScrollRotateForce", label: "Scroll Rotate", value: 1.75, min: 0, max: 5, step: 0.05 },
      { key: "shapeMaxRotationSpeed", label: "Max Rot Speed", value: 0.15, min: 0.005, max: 0.3, step: 0.005 },
      { key: "shapeRotationSmoothing", label: "Rot Smoothing", value: 0.09, min: 0.005, max: 0.2, step: 0.005 },
      { key: "shapeTiltX", label: "Tilt X", value: -0.5, min: -Math.PI, max: Math.PI, step: 0.01 },
      { key: "shapeTiltZ", label: "Tilt Z", value: -1.95, min: -Math.PI, max: Math.PI, step: 0.01 },
      { key: "shapeScaleReact", label: "Scale React", value: 0.02, min: 0, max: 0.5, step: 0.01 },
      { key: "shapeScaleSmoothing", label: "Scale Smoothing", value: 0.04, min: 0.01, max: 0.2, step: 0.01 },
      { key: "torusOpacity", label: "Opacity", value: 0.8, min: 0, max: 1, step: 0.01 },
      { key: "shapeSingleSide", label: "Single Side", type: "checkbox", value: true }
    ]
  }
]);

const PRESET_VALUES = Object.freeze({
  default: Object.freeze({
    bloomIntensity: 1.2,
    borderColor: "#ffffff",
    borderEmission: 0,
    ditherUseColor: true,
    ditherFgColor: "#ffffff",
    ditherGap: 2.75,
    ditherContrast: 0,
    ditherBaseScale: 0.76
  }),
  blueScifi: Object.freeze({
    bloomIntensity: 0.9,
    borderColor: hubConfig.accent,
    borderEmission: 1.6,
    ditherUseColor: false,
    ditherFgColor: hubConfig.accent,
    ditherGap: 5.5,
    ditherContrast: -0.02,
    ditherBaseScale: 0.44
  })
});

const appShell = document.querySelector("#appShell");
const sidebarToggle = document.querySelector("#sidebarToggle");
const sidebarToggleIcon = document.querySelector("#sidebarToggleIcon");
const sidebarDate = document.querySelector("#sidebarDate");
const canvas = document.querySelector("#showcaseCanvas");
const showcase = document.querySelector(".showcase");
const visualizerNav = document.querySelector("#visualizerNav");
const visualizerLinks = document.querySelector("#visualizerLinks");
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const shapeToggle = document.querySelector("#shapeToggle");
const configToggle = document.querySelector("#configToggle");
const configPanel = document.querySelector("#configPanel");
const exportSettingsButton = document.querySelector("#exportSettings");
let settingInputs = [];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const projectTotal = hubConfig.visualizers.length;

let selectedProjectIndex = 0;
let sidebarCollapsed = false;
let sceneController = null;
let activePreset = "blueScifi";
let shapeVisible = true;
let wheelLocked = false;
let wheelAccumulator = 0;
let wheelResetTimer = 0;

document.documentElement.style.setProperty("--accent", hubConfig.accent);


function renderShowcaseConfig() {
  const fragment = document.createDocumentFragment();

  CONTROL_GROUPS.forEach((group, groupIndex) => {
    const details = document.createElement("details");
    if (groupIndex === 0) details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = group.name.toUpperCase();
    details.append(summary);

    group.controls.forEach((definition) => {
      const label = document.createElement("label");
      label.className = `config-control config-control--${definition.type ?? "range"}`;

      const name = document.createElement("span");
      name.textContent = definition.label.toUpperCase();

      const output = document.createElement("output");
      output.dataset.outputFor = definition.key;

      let control;
      if (definition.type === "select") {
        control = document.createElement("select");
        definition.options.forEach((optionValue) => {
          const option = document.createElement("option");
          option.value = optionValue;
          option.textContent = optionValue;
          control.append(option);
        });
        control.value = definition.value;
      } else {
        control = document.createElement("input");
        control.type = definition.type ?? "range";
        if (control.type === "checkbox") {
          control.checked = Boolean(definition.value);
        } else {
          control.value = String(definition.value);
        }
        if (control.type === "range") {
          control.min = String(definition.min);
          control.max = String(definition.max);
          control.step = String(definition.step);
        }
      }

      control.dataset.sceneSetting = definition.key;
      control.setAttribute("aria-label", definition.label);
      label.append(name, output, control);
      details.append(label);
    });

    fragment.append(details);
  });

  configPanel.replaceChildren(fragment);
  settingInputs = [...configPanel.querySelectorAll("[data-scene-setting]")];
  settingInputs.forEach((control) => syncControlOutput(control));
}

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

function getProject(projectId) {
  return hubConfig.projects.find((project) => project.id === projectId) ?? null;
}

function createVisualizerLink(visualizer, index) {
  const link = document.createElement("a");
  link.className = "visualizer-link";
  link.href = visualizer.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.dataset.index = String(index);
  link.textContent = visualizer.name;

  link.addEventListener("pointerenter", () => selectVisualizer(index));
  link.addEventListener("focus", () => selectVisualizer(index));
  link.addEventListener("click", () => selectVisualizer(index));
  return link;
}

function updateVisualizerSelection({ focus = false, animate = false, direction = 1 } = {}) {
  visualizerLinks.querySelectorAll(".visualizer-link").forEach((link, index) => {
    const isActive = index === selectedProjectIndex;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "true" : "false");
    link.tabIndex = isActive ? 0 : -1;
  });

  const visualizer = hubConfig.visualizers[selectedProjectIndex];
  const project = getProject(visualizer.projectId);
  if (project) sceneController?.setProject(project);
  if (animate) sceneController?.nudge(direction);
  if (focus) {
    visualizerLinks
      .querySelector(".visualizer-link.is-active")
      ?.focus({ preventScroll: true });
  }
}

function selectVisualizer(index, { focus = false, animate = false, direction = 1 } = {}) {
  selectedProjectIndex = (index + projectTotal) % projectTotal;
  updateVisualizerSelection({ focus, animate, direction });
}

function renderVisualizerNav() {
  const fragment = document.createDocumentFragment();
  hubConfig.visualizers.forEach((visualizer, index) => {
    fragment.append(createVisualizerLink(visualizer, index));
  });
  visualizerLinks.replaceChildren(fragment);
  updateVisualizerSelection();
}

function navigateVisualizers(direction, { focus = false } = {}) {
  selectVisualizer(selectedProjectIndex + direction, {
    focus,
    animate: true,
    direction
  });
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
  }, 200);
}

function readControlValue(control) {
  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    return control.checked;
  }
  if (control instanceof HTMLInputElement && control.type === "color") {
    return control.value;
  }
  if (control instanceof HTMLSelectElement) {
    return control.value;
  }
  return Number(control.value);
}

function formatSettingValue(control, value) {
  if (typeof value === "boolean") return value ? "ON" : "OFF";
  if (typeof value === "string") {
    return control instanceof HTMLInputElement && control.type === "color"
      ? value.toUpperCase()
      : value;
  }
  const step = Number(control.step || 1);
  if (step >= 1) return String(Math.round(value));
  if (step < 0.001) return value.toFixed(4);
  if (step < 0.01) return value.toFixed(3);
  return value.toFixed(2);
}

function syncControlOutput(control, value = readControlValue(control)) {
  const name = control.dataset.sceneSetting;
  const output = document.querySelector(`[data-output-for="${name}"]`);
  if (output) output.textContent = formatSettingValue(control, value);
}

function setControlValue(name, value) {
  const control = document.querySelector(`[data-scene-setting="${name}"]`);
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;

  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    control.checked = Boolean(value);
  } else {
    control.value = String(value);
  }
  syncControlOutput(control, value);
}

function activatePreset(preset) {
  activePreset = preset;
  presetButtons.forEach((button) => {
    const isActive = button.dataset.preset === preset;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const presetValues = PRESET_VALUES[preset];
  if (presetValues) {
    Object.entries(presetValues).forEach(([name, value]) => {
      setControlValue(name, value);
      sceneController?.setSetting(name, value);
    });
  }
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
    settingInputs.map((control) => [control.dataset.sceneSetting, readControlValue(control)])
  );
  const payload = {
    preset: activePreset,
    shapeVisible,
    settings
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}
`], { type: "application/json" });
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

  settingInputs.forEach((control) => {
    const eventName = control instanceof HTMLInputElement && control.type === "range"
      ? "input"
      : "change";
    control.addEventListener(eventName, () => {
      const name = control.dataset.sceneSetting;
      const value = readControlValue(control);
      syncControlOutput(control, value);
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
  navigateVisualizers(direction);

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

  if (event.key === "ArrowDown") {
    event.preventDefault();
    navigateVisualizers(1, { focus: true });
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    navigateVisualizers(-1, { focus: true });
    return;
  }

  if (
    event.key === "Enter" &&
    !(document.activeElement instanceof HTMLAnchorElement) &&
    !(document.activeElement instanceof HTMLButtonElement)
  ) {
    event.preventDefault();
    visualizerLinks.querySelector(".visualizer-link.is-active")?.click();
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
    this.shapeVisibilityRequested = true;
    this.shapeRotationY = 0;
    this.shapeRotationSpeed = 0.001;
    this.shapeSmoothScale = 1;

    this.instanceCount = 20;
    this.settings = {
      imageScale: 0.83,
      radius: 6,
      spiralStep: 0.8,
      imagesPerTurn: 7,
      curvature: 1.5,
      momentum: 0.87,
      scrollAdvanceSpeed: 0.17,
      autoRotateSpeed: 0.002,
      scrollRotateForce: 1.75,
      maxRotationSpeed: 0.15,
      rotationSmoothing: 0.09,
      squeezeMax: 0.5,
      squeezeWidth: 7.5,
      chromaticAberration: 0.02,
      opacity: 1,
      emission: 0.65,
      saturation: 1.5,
      brightness: 1.15,
      scanLines: 0.6,
      scanLineSpeed: 3.9,
      scanLineDensity: 25,
      distanceFadeStart: 3,
      distanceFadeEnd: 8,
      flickerIntensity: 0.18,
      flickerSpeed: 5,
      borderWidth: 0.005,
      borderColor: "#ffffff",
      borderEmission: 0,
      borderRadius: 0,
      borderOffset: 0,
      cornerSize: 0.06,
      cornerWidth: 0.005,
      cornerOffset: 0.03,
      ditherEnabled: true,
      ditherCellSize: 2,
      ditherGap: 2.75,
      ditherContrast: 0,
      ditherMode: "Inv Halftone",
      ditherShape: "Circle",
      ditherBaseScale: 0.76,
      ditherIntensity: 2.61,
      ditherBgColor: "#111111",
      ditherUseColor: true,
      ditherFgColor: "#ffffff",
      cylinderRadius: 32,
      cylinderHeight: 90,
      gridSize: 0.45,
      subdivisions: 2,
      tileX: 17,
      tileY: 5,
      majorLineWidth: 0.005,
      minorLineWidth: 0.004,
      dotSize: 0.011,
      majorLineColor: hubConfig.accent,
      minorLineColor: hubConfig.accent,
      dotColor: hubConfig.accent,
      majorLineOpacity: 0.46,
      minorLineOpacity: 0.14,
      dotOpacity: 1,
      horizontalFade: 0.1,
      horizontalFadeSoftness: 0.7,
      bgColor: "#001d50",
      bgOpacity: 0.51,
      panIntensityX: 0.8,
      panIntensityY: 1.2,
      cameraSmoothing: 0.06,
      initialZoom: 11,
      maxZoomOut: 28.5,
      zoomSpeed: 0.05,
      zoomDecay: 0.1,
      lookAtX: 0,
      lookAtY: 0.1,
      lookAtZ: 0,
      bloomIntensity: 0.9,
      bloomThreshold: 0.01,
      bloomSmoothing: 0.45,
      bloomRadius: 0.65,
      shapeEnabled: true,
      shapeType: "Torus",
      torusScale: 2.3,
      shapeColor: hubConfig.accent,
      shapeAutoRotateSpeed: 0.004,
      shapeScrollRotateForce: 1.75,
      shapeMaxRotationSpeed: 0.15,
      shapeRotationSmoothing: 0.09,
      shapeTiltX: -0.5,
      shapeTiltZ: -1.95,
      shapeScaleReact: 0.02,
      shapeScaleSmoothing: 0.04,
      torusOpacity: 0.8,
      shapeSingleSide: true
    };
    this.totalHeight = this.instanceCount * this.settings.spiralStep;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 120);
    this.camera.position.set(0, 0, this.settings.initialZoom);

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
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      this.settings.bloomIntensity,
      this.settings.bloomRadius,
      this.settings.bloomThreshold
    );
    if (this.bloomPass.highPassUniforms?.smoothWidth) {
      this.bloomPass.highPassUniforms.smoothWidth.value = this.settings.bloomSmoothing;
    }
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
      uMajorLineColor: { value: new THREE.Color(this.settings.majorLineColor) },
      uMinorLineColor: { value: new THREE.Color(this.settings.minorLineColor) },
      uDotColor: { value: new THREE.Color(this.settings.dotColor) },
      uMajorLineOpacity: { value: this.settings.majorLineOpacity },
      uMinorLineOpacity: { value: this.settings.minorLineOpacity },
      uDotOpacity: { value: this.settings.dotOpacity },
      uBgColor: { value: new THREE.Color(this.settings.bgColor) },
      uBgOpacity: { value: this.settings.bgOpacity },
      uTileX: { value: this.settings.tileX },
      uTileY: { value: this.settings.tileY },
      uHorizontalFade: { value: this.settings.horizontalFade },
      uHorizontalFadeSoftness: { value: this.settings.horizontalFadeSoftness }
    };

    const geometry = new THREE.CylinderGeometry(
      this.settings.cylinderRadius,
      this.settings.cylinderRadius,
      this.settings.cylinderHeight,
      64,
      1,
      true
    );
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

  createShapeGeometry(type) {
    if (type === "TorusKnot") {
      return new THREE.TorusKnotGeometry(0.8, 0.25, 50, 16);
    }
    if (type === "Cube") {
      return new THREE.BoxGeometry(1.6, 1.6, 1.6);
    }
    return new THREE.TorusGeometry(1, 0.35, 16, 32);
  }

  replaceShapeGeometry(type) {
    if (!this.shape) return;
    const nextGeometry = this.createShapeGeometry(type);
    this.shape.geometry.dispose();
    this.shape.geometry = nextGeometry;
  }

  updateShapeVisibility() {
    if (this.shape) {
      this.shape.visible = this.shapeVisibilityRequested && this.settings.shapeEnabled;
    }
  }

  createWireframeShape() {
    const geometry = this.createShapeGeometry(this.settings.shapeType);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.settings.shapeColor),
      wireframe: true,
      transparent: true,
      opacity: this.settings.torusOpacity,
      side: this.settings.shapeSingleSide ? THREE.FrontSide : THREE.DoubleSide
    });

    this.shape = new THREE.Mesh(geometry, material);
    this.shape.scale.setScalar(this.settings.torusScale);
    this.shape.rotation.set(this.settings.shapeTiltX, 0, this.settings.shapeTiltZ);
    this.scene.add(this.shape);
    this.updateShapeVisibility();
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
        uFlickerSpeed: { value: this.settings.flickerSpeed },
        uChromatic: { value: this.settings.chromaticAberration },
        uCurvature: { value: this.settings.curvature },
        uEmission: { value: this.settings.emission },
        uSaturation: { value: this.settings.saturation },
        uBrightness: { value: this.settings.brightness },
        uScanLines: { value: this.settings.scanLines },
        uScanLineSpeed: { value: this.settings.scanLineSpeed },
        uScanLineDensity: { value: this.settings.scanLineDensity },
        uBorderWidth: { value: this.settings.borderWidth },
        uBorderColor: { value: new THREE.Color(this.settings.borderColor) },
        uBorderEmission: { value: this.settings.borderEmission },
        uBorderRadius: { value: this.settings.borderRadius },
        uBorderOffset: { value: this.settings.borderOffset },
        uCornerSize: { value: this.settings.cornerSize },
        uCornerWidth: { value: this.settings.cornerWidth },
        uCornerOffset: { value: this.settings.cornerOffset },
        uDitherEnabled: { value: this.settings.ditherEnabled ? 1 : 0 },
        uDitherCellSize: { value: this.settings.ditherCellSize },
        uDitherGap: { value: this.settings.ditherGap },
        uDitherContrast: { value: this.settings.ditherContrast },
        uDitherMode: { value: DITHER_MODE_MAP[this.settings.ditherMode] ?? 2 },
        uDitherShape: { value: DITHER_SHAPE_MAP[this.settings.ditherShape] ?? 0 },
        uDitherBaseScale: { value: this.settings.ditherBaseScale },
        uDitherIntensity: { value: this.settings.ditherIntensity },
        uDitherBgColor: { value: new THREE.Color(this.settings.ditherBgColor) },
        uDitherUseColor: { value: this.settings.ditherUseColor ? 1 : 0 },
        uDitherFgColor: { value: new THREE.Color(this.settings.ditherFgColor) }
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
        uniform float uFlickerSpeed;
        uniform float uChromatic;
        uniform float uEmission;
        uniform float uSaturation;
        uniform float uBrightness;
        uniform float uScanLines;
        uniform float uScanLineSpeed;
        uniform float uScanLineDensity;
        uniform float uBorderWidth;
        uniform vec3 uBorderColor;
        uniform float uBorderEmission;
        uniform float uBorderRadius;
        uniform float uBorderOffset;
        uniform float uCornerSize;
        uniform float uCornerWidth;
        uniform float uCornerOffset;
        uniform float uDitherEnabled;
        uniform float uDitherCellSize;
        uniform float uDitherGap;
        uniform float uDitherContrast;
        uniform float uDitherMode;
        uniform float uDitherShape;
        uniform float uDitherBaseScale;
        uniform float uDitherIntensity;
        uniform vec3 uDitherBgColor;
        uniform float uDitherUseColor;
        uniform vec3 uDitherFgColor;

        varying vec2 vUv;

        float roundedBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
        }

        float shapeDistance(vec2 p, float shape, float size) {
          if (shape < 0.5) return length(p) - size;
          if (shape < 1.5) return max(abs(p.x), abs(p.y)) - size;
          if (shape < 2.5) return abs(p.x) + abs(p.y) - size * 1.35;
          if (shape < 3.5) {
            p = abs(p);
            return max(p.x * 0.866025 + p.y * 0.5, p.y) - size;
          }
          if (shape < 4.5) return max(abs(p.x) - size * 0.28, abs(p.y) - size);
          if (shape < 5.5) return max(abs(p.x) - size, abs(p.y) - size * 0.28);
          if (shape < 6.5) {
            p = mat2(0.7071, -0.7071, 0.7071, 0.7071) * p;
            return max(abs(p.x) - size * 0.22, abs(p.y) - size * 1.35);
          }
          if (shape < 7.5) {
            p = abs(p);
            return max(max(p.x, p.y), (p.x + p.y) * 0.7071) - size;
          }
          if (shape < 8.5) {
            float a = atan(p.y, p.x);
            float r = length(p);
            float star = size * mix(0.45, 1.0, step(0.0, cos(a * 5.0)));
            return r - star;
          }
          if (shape < 9.5) {
            float outer = max(abs(p.x), abs(p.y)) - size;
            float inner = max(abs(p.x), abs(p.y)) - size * 0.7;
            return max(outer, -inner);
          }
          float vertical = max(abs(p.x) - size * 0.24, abs(p.y) - size);
          float horizontal = max(abs(p.x) - size, abs(p.y) - size * 0.24);
          return min(vertical, horizontal);
        }

        void main() {
          vec2 uv = vUv;
          vec2 chromaticOffset = vec2(uChromatic * (1.0 - uDepthFade), 0.0);
          float r = texture2D(uTexture, uv + chromaticOffset).r;
          float g = texture2D(uTexture, uv).g;
          float b = texture2D(uTexture, uv - chromaticOffset).b;
          vec3 source = vec3(r, g, b);

          float gray = dot(source, vec3(0.299, 0.587, 0.114));
          source = mix(vec3(gray), source, uSaturation) * uBrightness;
          float luma = clamp((gray - 0.5) * (1.0 + uDitherContrast * 2.0) + 0.5, 0.0, 1.0);

          float cellFactor = max(0.25, (uDitherCellSize + uDitherGap) * 0.35);
          vec2 cellCount = vec2(118.0, 68.0) / cellFactor;
          vec2 cell = fract(uv * cellCount) - 0.5;
          float modeLuma = luma;
          if (uDitherMode < 0.5) modeLuma = 1.0;
          if (uDitherMode > 1.5 && uDitherMode < 2.5) modeLuma = 1.0 - luma;
          if (uDitherMode > 11.5 && uDitherMode < 12.5) modeLuma = floor(luma * 5.0) / 4.0;
          if (uDitherMode > 14.5) modeLuma = step(0.5, luma);
          if (uDitherMode > 12.5 && uDitherMode < 13.5) {
            float randomValue = fract(sin(dot(floor(uv * cellCount), vec2(12.9898, 78.233))) * 43758.5453);
            modeLuma = clamp(luma + randomValue * 0.5, 0.0, 1.0);
          }
          if (uDitherMode > 2.5 && uDitherMode < 3.5) {
            float a = luma * 3.14159265359 * uDitherIntensity;
            cell = mat2(cos(a), -sin(a), sin(a), cos(a)) * cell;
          }
          if (uDitherMode > 3.5 && uDitherMode < 4.5) cell.y *= 0.45;
          if (uDitherMode > 4.5 && uDitherMode < 5.5) cell.x *= 0.45;
          if (uDitherMode > 5.5 && uDitherMode < 6.5) {
            float checker = mod(floor(uv.x * cellCount.x) + floor(uv.y * cellCount.y), 2.0);
            modeLuma = mix(luma, 1.0 - luma, checker);
          }
          if (uDitherMode > 7.5 && uDitherMode < 8.5) cell.x += sin(cell.y * 28.0 + uTime * 8.0) * 0.16;
          if (uDitherMode > 8.5 && uDitherMode < 9.5) cell.y += sin(uv.x * 24.0 + uTime * 2.0) * 0.22;
          if (uDitherMode > 9.5 && uDitherMode < 10.5) {
            vec2 texel = vec2(1.0 / 512.0);
            float gx = length(texture2D(uTexture, uv + vec2(texel.x, 0.0)).rgb - texture2D(uTexture, uv - vec2(texel.x, 0.0)).rgb);
            float gy = length(texture2D(uTexture, uv + vec2(0.0, texel.y)).rgb - texture2D(uTexture, uv - vec2(0.0, texel.y)).rgb);
            modeLuma = clamp((gx + gy) * 2.5, 0.0, 1.0);
          }

          float shapeSize = mix(0.05, 0.5, clamp(modeLuma * uDitherBaseScale, 0.0, 1.0));
          float shapeD = shapeDistance(cell, uDitherShape, shapeSize);
          float ditherMask = 1.0 - smoothstep(-0.025, 0.025, shapeD);
          ditherMask = clamp(ditherMask * uDitherIntensity, 0.0, 1.0);
          vec3 ditherForeground = mix(uDitherFgColor, source, uDitherUseColor);
          vec3 dithered = mix(uDitherBgColor, ditherForeground, ditherMask);
          vec3 imageColor = mix(source, dithered, uDitherEnabled);

          float scanWave = 0.82 + 0.18 * sin((uv.y * uScanLineDensity * 30.4) + uTime * uScanLineSpeed * 4.0);
          imageColor *= mix(1.0, scanWave, uScanLines);
          imageColor += uAccent * uEmission * (0.08 + luma * 0.12);

          vec2 centered = uv - 0.5;
          float panelRadius = clamp(uBorderRadius, 0.0, 0.25);
          float panel = roundedBox(centered, vec2(0.495), panelRadius);
          float panelMask = 1.0 - smoothstep(-0.006, 0.006, panel);

          float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
          float borderCenter = max(0.0, uBorderOffset);
          float border = 1.0 - smoothstep(
            max(0.0005, uBorderWidth),
            max(0.0005, uBorderWidth) + 0.006,
            abs(edgeDistance - borderCenter)
          );

          vec2 cornerCoord = min(uv, 1.0 - uv) - vec2(uCornerOffset);
          float corner = 0.0;
          if ((cornerCoord.x < uCornerWidth && cornerCoord.y < uCornerSize) ||
              (cornerCoord.y < uCornerWidth && cornerCoord.x < uCornerSize)) {
            corner = 1.0;
          }

          float flickerWave = sin(uTime * max(0.1, uFlickerSpeed) * 13.4 + uv.y * 9.0) * 0.5 + 0.5;
          float flicker = 1.0 - uFlicker * 0.14 * flickerWave;
          vec3 borderGlow = uBorderColor * (1.0 + uBorderEmission);
          vec3 color = mix(imageColor, borderGlow, max(border, corner));
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
    this.shapeVisibilityRequested = visible;
    this.updateShapeVisibility();
  }

  updateGridGeometry() {
    const nextGeometry = new THREE.CylinderGeometry(
      this.settings.cylinderRadius,
      this.settings.cylinderRadius,
      this.settings.cylinderHeight,
      64,
      1,
      true
    );
    this.grid.geometry.dispose();
    this.grid.geometry = nextGeometry;
  }

  setSetting(name, value) {
    if (!(name in this.settings)) return;

    const integerSettings = new Set([
      "imagesPerTurn", "ditherCellSize", "subdivisions", "tileX", "tileY", "scanLineDensity"
    ]);
    const numericValue = typeof value === "number" && Number.isFinite(value)
      ? (integerSettings.has(name) ? Math.round(value) : value)
      : value;
    this.settings[name] = numericValue;

    if (["radius", "spiralStep", "imagesPerTurn"].includes(name)) {
      this.updateCardLayout();
    }

    const cardUniformMap = {
      curvature: "uCurvature",
      chromaticAberration: "uChromatic",
      emission: "uEmission",
      saturation: "uSaturation",
      brightness: "uBrightness",
      scanLines: "uScanLines",
      scanLineSpeed: "uScanLineSpeed",
      scanLineDensity: "uScanLineDensity",
      flickerIntensity: "uFlicker",
      flickerSpeed: "uFlickerSpeed",
      borderWidth: "uBorderWidth",
      borderEmission: "uBorderEmission",
      borderRadius: "uBorderRadius",
      borderOffset: "uBorderOffset",
      cornerSize: "uCornerSize",
      cornerWidth: "uCornerWidth",
      cornerOffset: "uCornerOffset",
      ditherCellSize: "uDitherCellSize",
      ditherGap: "uDitherGap",
      ditherContrast: "uDitherContrast",
      ditherBaseScale: "uDitherBaseScale",
      ditherIntensity: "uDitherIntensity"
    };
    const cardUniform = cardUniformMap[name];
    if (cardUniform) {
      this.cards.forEach((card) => {
        card.material.uniforms[cardUniform].value = numericValue;
      });
    }

    if (name === "ditherEnabled" || name === "ditherUseColor") {
      const uniform = name === "ditherEnabled" ? "uDitherEnabled" : "uDitherUseColor";
      this.cards.forEach((card) => {
        card.material.uniforms[uniform].value = numericValue ? 1 : 0;
      });
    }

    if (name === "ditherMode" || name === "ditherShape") {
      const uniform = name === "ditherMode" ? "uDitherMode" : "uDitherShape";
      const map = name === "ditherMode" ? DITHER_MODE_MAP : DITHER_SHAPE_MAP;
      this.cards.forEach((card) => {
        card.material.uniforms[uniform].value = map[numericValue] ?? 0;
      });
    }

    const cardColorUniformMap = {
      borderColor: "uBorderColor",
      ditherBgColor: "uDitherBgColor",
      ditherFgColor: "uDitherFgColor"
    };
    const cardColorUniform = cardColorUniformMap[name];
    if (cardColorUniform) {
      this.cards.forEach((card) => {
        card.material.uniforms[cardColorUniform].value.set(numericValue);
      });
    }

    if (name === "bloomIntensity") this.bloomPass.strength = numericValue;
    if (name === "bloomThreshold") this.bloomPass.threshold = numericValue;
    if (name === "bloomRadius") this.bloomPass.radius = numericValue;
    if (name === "bloomSmoothing" && this.bloomPass.highPassUniforms?.smoothWidth) {
      this.bloomPass.highPassUniforms.smoothWidth.value = numericValue;
    }

    if (name === "shapeType") this.replaceShapeGeometry(numericValue);
    if (name === "shapeColor") this.shape.material.color.set(numericValue);
    if (name === "torusOpacity") this.shape.material.opacity = numericValue;
    if (name === "shapeSingleSide") {
      this.shape.material.side = numericValue ? THREE.FrontSide : THREE.DoubleSide;
      this.shape.material.needsUpdate = true;
    }
    if (name === "shapeEnabled") this.updateShapeVisibility();

    const gridUniformMap = {
      gridSize: "uGridSize",
      subdivisions: "uSubdivisions",
      tileX: "uTileX",
      tileY: "uTileY",
      majorLineWidth: "uMajorLineWidth",
      minorLineWidth: "uMinorLineWidth",
      dotSize: "uDotSize",
      majorLineOpacity: "uMajorLineOpacity",
      minorLineOpacity: "uMinorLineOpacity",
      dotOpacity: "uDotOpacity",
      horizontalFade: "uHorizontalFade",
      horizontalFadeSoftness: "uHorizontalFadeSoftness",
      bgOpacity: "uBgOpacity"
    };
    const gridUniform = gridUniformMap[name];
    if (gridUniform) this.gridUniforms[gridUniform].value = numericValue;

    const gridColorUniformMap = {
      majorLineColor: "uMajorLineColor",
      minorLineColor: "uMinorLineColor",
      dotColor: "uDotColor",
      bgColor: "uBgColor"
    };
    const gridColorUniform = gridColorUniformMap[name];
    if (gridColorUniform) this.gridUniforms[gridColorUniform].value.set(numericValue);

    if (name === "cylinderRadius" || name === "cylinderHeight") {
      this.updateGridGeometry();
    }

    if (name === "initialZoom") {
      this.targetZoom = Math.max(this.targetZoom, numericValue);
      this.currentZoom = Math.max(this.currentZoom, numericValue);
    }
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

    const squeeze = Math.min(
      Math.abs(this.scrollVelocity) * 3,
      this.settings.squeezeMax
    );

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
      const squeezeFalloff = Math.exp(
        -(y * y) / Math.max(0.001, this.settings.squeezeWidth * this.settings.squeezeWidth)
      );
      const localSqueeze = squeeze * squeezeFalloff;
      card.scale.set(
        this.settings.imageScale * (1 - localSqueeze * 0.28),
        this.settings.imageScale * (1 + localSqueeze * 0.13),
        this.settings.imageScale
      );

      const cameraDistance = card.position.distanceTo(this.camera.position);
      const fadeStart = Math.min(this.settings.distanceFadeStart, this.settings.distanceFadeEnd - 0.001);
      const fadeEnd = Math.max(this.settings.distanceFadeEnd, fadeStart + 0.001);
      const distanceFade = 1 - THREE.MathUtils.smoothstep(cameraDistance, fadeStart, fadeEnd);
      const verticalFade = 1 - THREE.MathUtils.smoothstep(Math.abs(y), 4.0, 9.5);
      const depthFade = THREE.MathUtils.clamp(distanceFade * verticalFade, 0.04, 1);
      card.material.uniforms.uTime.value = elapsed;
      card.material.uniforms.uDepthFade.value = depthFade;
      card.material.uniforms.uOpacity.value = (0.32 + depthFade * 0.68) * this.settings.opacity;
      card.renderOrder = Math.round((z + this.settings.radius) * 100) + index;
    });

    const shapeTargetSpeed =
      this.settings.shapeAutoRotateSpeed * this.lastDirection +
      this.scrollVelocity * this.settings.shapeScrollRotateForce;
    const clampedShapeSpeed = THREE.MathUtils.clamp(
      shapeTargetSpeed,
      -this.settings.shapeMaxRotationSpeed,
      this.settings.shapeMaxRotationSpeed
    );
    this.shapeRotationSpeed +=
      (clampedShapeSpeed - this.shapeRotationSpeed) * this.settings.shapeRotationSmoothing;
    this.shapeRotationY += this.shapeRotationSpeed * delta * 60;
    this.shape.rotation.set(
      this.settings.shapeTiltX,
      this.shapeRotationY,
      this.settings.shapeTiltZ
    );
    const shapeTargetScale =
      this.settings.torusScale -
      Math.abs(this.scrollVelocity) * this.settings.shapeScaleReact * 10;
    this.shapeSmoothScale +=
      (shapeTargetScale - this.shapeSmoothScale) * this.settings.shapeScaleSmoothing;
    this.shape.scale.setScalar(this.shapeSmoothScale);

    this.smoothMousePosition.x +=
      (this.mousePosition.x - this.smoothMousePosition.x) * this.settings.cameraSmoothing;
    this.smoothMousePosition.y +=
      (this.mousePosition.y - this.smoothMousePosition.y) * this.settings.cameraSmoothing;
    this.camera.position.x = this.smoothMousePosition.x * this.settings.panIntensityX;
    this.camera.position.y = this.smoothMousePosition.y * this.settings.panIntensityY;

    const absoluteVelocity = Math.abs(this.scrollVelocity);
    this.targetZoom += absoluteVelocity * this.settings.zoomSpeed;
    this.targetZoom = THREE.MathUtils.clamp(
      this.targetZoom,
      this.settings.initialZoom,
      this.settings.maxZoomOut
    );
    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;
    this.camera.position.z = this.currentZoom;
    this.targetZoom = THREE.MathUtils.lerp(
      this.targetZoom,
      this.settings.initialZoom,
      1 - this.settings.zoomDecay
    );
    this.camera.lookAt(
      this.settings.lookAtX,
      this.settings.lookAtY,
      this.settings.lookAtZ
    );

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

renderShowcaseConfig();
renderVisualizerNav();
bindShowcaseControls();

if (window.innerWidth <= 980) {
  setSidebarCollapsed(true);
}

try {
  sceneController = new CylindricalShowcase(canvas, showcase);
  const initialVisualizer = hubConfig.visualizers[selectedProjectIndex];
  const initialProject = getProject(initialVisualizer.projectId);
  if (initialProject) sceneController.setProject(initialProject);
  activatePreset(activePreset);
  sceneController.setShapeVisible(shapeVisible);
} catch (error) {
  console.error(error);
  showWebGLError("The 3D showcase could not start. Enable WebGL hardware acceleration and reload the page.");
}

window.addEventListener(
  "resize",
  () => {
    sceneController?.resize();
  },
  { passive: true }
);
