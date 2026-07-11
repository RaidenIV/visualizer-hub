import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
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
const canvas = document.querySelector("#showcaseCanvas");
const showcase = document.querySelector(".showcase");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const projectTotal = hubConfig.projects.length;
const twoDigit = (value) => String(value).padStart(2, "0");

let selectedIndex = 0;
let sidebarCollapsed = false;
let sceneController = null;

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

function createProjectLink(project, index) {
  const link = document.createElement("a");
  link.className = "project-link";
  link.href = project.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.dataset.index = String(index);
  link.setAttribute("aria-label", `Open ${project.name}`);
  link.innerHTML = `
    <span class="project-link__number">${twoDigit(index + 1)}</span>
    <span class="project-link__copy">
      <strong>${project.name}</strong>
      <small>${project.category}</small>
    </span>
    <span class="project-link__open" aria-hidden="true">↗</span>
  `;

  link.addEventListener("pointerenter", () => selectProject(index));
  link.addEventListener("focus", () => selectProject(index));
  link.addEventListener("click", () => selectProject(index));
  return link;
}

function createSidebarLink(project, index) {
  const link = document.createElement("a");
  link.className = "sidebar-project-link";
  link.href = `#${project.id}`;
  link.dataset.index = String(index);
  link.setAttribute("aria-label", `Highlight ${project.name}`);
  link.innerHTML = `
    <span class="sidebar-project-link__number">${twoDigit(index + 1)}</span>
    <span class="sidebar-project-link__name">${project.shortName}</span>
    <span class="sidebar-project-link__indicator" aria-hidden="true"></span>
  `;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    selectProject(index);
    projectMenu.querySelector(`[data-index="${index}"]`)?.focus({ preventScroll: true });
  });

  link.addEventListener("pointerenter", () => selectProject(index));
  return link;
}

function renderProjects() {
  const menuFragment = document.createDocumentFragment();
  const sidebarFragment = document.createDocumentFragment();

  hubConfig.projects.forEach((project, index) => {
    menuFragment.append(createProjectLink(project, index));
    sidebarFragment.append(createSidebarLink(project, index));
  });

  projectMenu.replaceChildren(menuFragment);
  sidebarProjects.replaceChildren(sidebarFragment);
  selectProject(0);
}

function selectProject(index) {
  selectedIndex = (index + projectTotal) % projectTotal;
  const project = hubConfig.projects[selectedIndex];

  document.querySelectorAll(".project-link").forEach((link, linkIndex) => {
    const isActive = linkIndex === selectedIndex;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "true" : "false");
  });

  document.querySelectorAll(".sidebar-project-link").forEach((link, linkIndex) => {
    const isActive = linkIndex === selectedIndex;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  activeIndex.textContent = twoDigit(selectedIndex + 1);
  activeProjectName.textContent = project.name.toUpperCase();
  activeProjectDescription.textContent = project.description;
  sceneController?.setProject(project);
}

function setSidebarCollapsed(collapsed) {
  sidebarCollapsed = collapsed;
  appShell.classList.toggle("sidebar-collapsed", collapsed);
  sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
  sidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
  sidebarToggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
  sidebarToggleIcon.textContent = collapsed ? "›" : "‹";
  window.setTimeout(() => sceneController?.resize(), 200);
}

sidebarToggle.addEventListener("click", () => setSidebarCollapsed(!sidebarCollapsed));

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    event.preventDefault();
    selectProject(selectedIndex + 1);
    projectMenu.querySelector(`[data-index="${selectedIndex}"]`)?.focus({ preventScroll: true });
  }

  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    event.preventDefault();
    selectProject(selectedIndex - 1);
    projectMenu.querySelector(`[data-index="${selectedIndex}"]`)?.focus({ preventScroll: true });
  }

  if (event.key === "Enter" && document.activeElement === document.body) {
    projectMenu.querySelector(`[data-index="${selectedIndex}"]`)?.click();
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
    this.rotation = 0;
    this.rotationSpeed = 0.002;
    this.lastDirection = 1;
    this.scrollOffset = 0;
    this.scrollVelocity = 0;
    this.targetCameraTilt = 0;
    this.dragging = false;
    this.pointerId = null;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.pendingProjectToken = 0;
    this.frameId = 0;

    this.instanceCount = 20;
    this.imagesPerTurn = 6;
    this.radius = 6.4;
    this.spiralStep = 1.48;
    this.totalHeight = this.instanceCount * this.spiralStep;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 120);
    this.camera.position.set(0, 0, 12);

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
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.42, 0.08);
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
    const positions = [];
    const gridRadius = 28;
    const minY = -42;
    const maxY = 42;
    const radialSegments = 72;
    const ringSegments = 144;

    for (let i = 0; i < radialSegments; i += 1) {
      const angle = (i / radialSegments) * Math.PI * 2;
      const x = Math.sin(angle) * gridRadius;
      const z = Math.cos(angle) * gridRadius;
      positions.push(x, minY, z, x, maxY, z);
    }

    for (let y = minY; y <= maxY; y += 1.15) {
      for (let i = 0; i < ringSegments; i += 1) {
        const angleA = (i / ringSegments) * Math.PI * 2;
        const angleB = ((i + 1) / ringSegments) * Math.PI * 2;
        positions.push(
          Math.sin(angleA) * gridRadius,
          y,
          Math.cos(angleA) * gridRadius,
          Math.sin(angleB) * gridRadius,
          y,
          Math.cos(angleB) * gridRadius
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(hubConfig.accent),
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.grid = new THREE.LineSegments(geometry, material);
    this.grid.renderOrder = -10;
    this.scene.add(this.grid);

    const pointGeometry = new THREE.BufferGeometry();
    const pointPositions = [];
    for (let y = -36; y <= 36; y += 2.3) {
      for (let i = 0; i < 48; i += 1) {
        const angle = (i / 48) * Math.PI * 2;
        pointPositions.push(Math.sin(angle) * 27.9, y, Math.cos(angle) * 27.9);
      }
    }
    pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pointPositions, 3));
    const pointMaterial = new THREE.PointsMaterial({
      color: new THREE.Color("#4ca0ff"),
      size: 0.028,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.gridPoints = new THREE.Points(pointGeometry, pointMaterial);
    this.scene.add(this.gridPoints);
  }

  createWireframeShape() {
    const geometry = new THREE.TorusGeometry(1, 0.35, 16, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#4ca0ff"),
      wireframe: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.torus = new THREE.Mesh(geometry, material);
    this.torus.scale.setScalar(2.3);
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
        uFlicker: { value: 0.15 },
        uChromatic: { value: 0.006 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vCurve;

        void main() {
          vUv = uv;
          vec3 transformed = position;
          float curve = position.x * position.x * 0.055;
          transformed.z -= curve;
          vCurve = curve;
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

        varying vec2 vUv;
        varying float vCurve;

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

          float scan = 0.82 + 0.18 * sin((uv.y * 760.0) + uTime * 15.0);
          vec3 imageBlue = mix(uAccent * 0.12, uAccentBright * (0.72 + luma * 1.1), dotMask);
          imageBlue *= scan;
          imageBlue += source * 0.075;

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

          vec3 color = imageBlue;
          color = mix(color, uAccentBright * 2.1, max(border, corner));
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
      mesh.userData.baseAngle = i * ((Math.PI * 2) / this.imagesPerTurn);
      mesh.userData.baseY = -(this.totalHeight / 2) + i * this.spiralStep;
      this.cards.push(mesh);
      this.scene.add(mesh);
    }
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

  bindInput() {
    this.onWheel = (event) => {
      event.preventDefault();
      const impulse = THREE.MathUtils.clamp(event.deltaY * 0.00075, -0.32, 0.32);
      this.scrollVelocity += impulse;
    };

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

    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
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

    this.scrollVelocity *= this.dragging ? 0.93 : 0.87;
    if (Math.abs(this.scrollVelocity) > 0.00001) {
      this.lastDirection = Math.sign(this.scrollVelocity);
    }

    const autoSpeed = 0.002 * this.lastDirection * motionScale;
    const targetRotationSpeed = autoSpeed + this.scrollVelocity * 1.75;
    this.rotationSpeed += (THREE.MathUtils.clamp(targetRotationSpeed, -0.15, 0.15) - this.rotationSpeed) * 0.09;
    this.rotation += this.rotationSpeed * delta * 60;
    this.scrollOffset += this.scrollVelocity * 10.2 * motionScale;

    const squeeze = Math.min(Math.abs(this.scrollVelocity) * 3, 0.45);

    this.cards.forEach((card, index) => {
      const angle = card.userData.baseAngle + this.rotation;
      const rawY = card.userData.baseY + this.scrollOffset;
      const y = THREE.MathUtils.euclideanModulo(rawY + this.totalHeight / 2, this.totalHeight) - this.totalHeight / 2;
      const x = Math.sin(angle) * this.radius;
      const z = Math.cos(angle) * this.radius;

      card.position.set(x, y, z);
      card.rotation.set(0, angle, 0);
      card.scale.set(0.83 * (1 - squeeze * 0.28), 0.83 * (1 + squeeze * 0.13), 0.83);

      const frontness = THREE.MathUtils.smoothstep(z, -this.radius * 0.65, this.radius);
      const verticalFade = 1 - THREE.MathUtils.smoothstep(Math.abs(y), 4.0, 9.5);
      const depthFade = THREE.MathUtils.clamp(frontness * verticalFade, 0.04, 1);
      card.material.uniforms.uTime.value = elapsed;
      card.material.uniforms.uDepthFade.value = depthFade;
      card.material.uniforms.uOpacity.value = 0.32 + depthFade * 0.68;
      card.renderOrder = Math.round((z + this.radius) * 100) + index;
    });

    const torusTargetSpeed = 0.004 * this.lastDirection + this.scrollVelocity * 1.75;
    this.torus.rotation.y += THREE.MathUtils.clamp(torusTargetSpeed, -0.16, 0.16) * delta * 60;
    this.torus.rotation.x = -0.5 + Math.sin(elapsed * 0.25) * 0.035;
    this.torus.rotation.z = -1.95;
    const torusScale = 2.3 - Math.min(Math.abs(this.scrollVelocity) * 2.2, 0.42);
    this.torus.scale.lerp(new THREE.Vector3(torusScale, torusScale, torusScale), 0.06);

    this.targetCameraTilt = THREE.MathUtils.clamp(this.scrollVelocity * 0.9, -0.08, 0.08);
    this.camera.rotation.z += (this.targetCameraTilt - this.camera.rotation.z) * 0.055;
    this.grid.rotation.y = this.rotation * 0.035;
    this.gridPoints.rotation.y = this.rotation * 0.035;

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

renderProjects();

if (window.innerWidth <= 980) {
  setSidebarCollapsed(true);
}

try {
  sceneController = new CylindricalShowcase(canvas, showcase);
  sceneController.setProject(hubConfig.projects[selectedIndex]);
} catch (error) {
  console.error(error);
  showWebGLError("The 3D showcase could not start. Enable WebGL hardware acceleration and reload the page.");
}

window.addEventListener("resize", () => sceneController?.resize(), { passive: true });
