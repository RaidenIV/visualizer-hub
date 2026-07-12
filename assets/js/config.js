/**
 * AIGOX XMB navigation, project destinations, and visualizer image sets.
 */
export const hubConfig = Object.freeze({
  accent: "#0075ff",
  categories: Object.freeze([
    Object.freeze({
      id: "apps",
      name: "Apps",
      icon: "assets/images/apps.svg",
      items: Object.freeze([
        Object.freeze({
          id: "codex",
          name: "CODEX",
          description: "A centralized software and code workspace.",
          href: "https://codex-production-4a6a.up.railway.app/",
          visualizerId: "codex"
        }),
        Object.freeze({
          id: "homeplate",
          name: "HOMEPLATE",
          description: "Recipe, cookbook, and meal-planning software.",
          href: "https://dinner-app-production-55b7.up.railway.app/",
          visualizerId: "homeplate"
        }),
        Object.freeze({
          id: "taskcom",
          name: "TASKCOM",
          description: "Project and task command software for structured execution.",
          href: "https://projecttracker-production-9bab.up.railway.app/",
          visualizerId: "taskcom"
        })
      ])
    }),
    Object.freeze({
      id: "audio",
      name: "VISUALIZERS",
      icon: "assets/images/visualizer.svg",
      items: Object.freeze([
        Object.freeze({
          id: "binary-tower",
          name: "BINARY TOWER",
          description: "Audio-reactive binary terrain visualization.",
          href: "https://raideniv.github.io/binary-tower/",
          visualizerId: "binary-tower"
        }),
        Object.freeze({
          id: "galaxy",
          name: "GALAXY",
          description: "A deep-space particle field shaped by sound and motion.",
          href: "https://raideniv.github.io/galaxy-visualizer/",
          visualizerId: "galaxy"
        }),
        Object.freeze({
          id: "particle-accelerator",
          name: "PARTICLE ACCELERATOR",
          description: "Reactive energy streams driven through a kinetic particle system.",
          href: "https://www.xodiamediagroup.com/vis",
          visualizerId: "particle-accelerator"
        }),
        Object.freeze({
          id: "spectrogramic-voxel-engine",
          name: "SPECTROGRAMIC VOXEL ENGINE",
          description: "Volumetric frequency architecture built from animated voxels.",
          href: "https://raideniv.github.io/spectrogramic-voxel-engine/",
          visualizerId: "spectrogramic-voxel-engine"
        })
      ])
    }),
    Object.freeze({
      id: "games",
      name: "Games",
      icon: "assets/images/controller.svg",
      items: Object.freeze([
        Object.freeze({
          id: "capsule-havoc",
          name: "CAPSULE HAVOC",
          description: "Fast-paced capsule combat built for the browser.",
          href: "https://raideniv.github.io/capsule_havoc/"
        }),
        Object.freeze({
          id: "project-osea",
          name: "PROJECT OSEA",
          description: "An original interactive game project from AIGOX.",
          href: "https://www.xodiamediagroup.com/osea"
        }),
        Object.freeze({
          id: "tetron",
          name: "TETRON",
          description: "A tactical 3D action sandbox and game laboratory.",
          href: "https://raideniv.github.io/tetron/"
        })
      ])
    }),
    Object.freeze({
      id: "tools",
      name: "Tools",
      icon: "assets/images/tools.svg",
      items: Object.freeze([
        Object.freeze({
          id: "3d-modeler",
          name: "3D MODELER",
          description: "Browser-based tools for building and previewing 3D assets.",
          href: "https://www.xodiamediagroup.com/modeler"
        }),
        Object.freeze({
          id: "audio-converter",
          name: "AUDIO CONVERTER",
          description: "A focused utility for converting audio files in the browser.",
          href: "https://raideniv.github.io/audio-converter/"
        }),
        Object.freeze({
          id: "beat-detective",
          name: "BEAT DETECTIVE",
          description: "Audio analysis utilities for detecting tempo and beat structure.",
          href: "https://raideniv.github.io/beat_detective/"
        }),
        Object.freeze({
          id: "svg-editor",
          name: "SVG EDITOR",
          description: "Create, edit, combine, and export scalable vector graphics.",
          href: "svg.html"
        })
      ])
    })
  ]),
  projects: Object.freeze([
    Object.freeze({
      id: "codex",
      name: "Codex",
      shortName: "Codex",
      description: "A centralized software and code workspace.",
      category: "APP / CODE",
      href: "https://codex-production-4a6a.up.railway.app/",
      images: Object.freeze([
        "assets/images/showcase/codex.png",
        "assets/images/showcase/codex.png",
        "assets/images/showcase/codex.png",
        "assets/images/showcase/codex.png",
        "assets/images/showcase/codex.png"
      ])
    }),
    Object.freeze({
      id: "homeplate",
      name: "HomePlate",
      shortName: "HomePlate",
      description: "Recipe, cookbook, and meal-planning software.",
      category: "APP / MEALS",
      href: "https://dinner-app-production-55b7.up.railway.app/",
      images: Object.freeze([
        "assets/images/showcase/homeplate.png",
        "assets/images/showcase/homeplate.png",
        "assets/images/showcase/homeplate.png",
        "assets/images/showcase/homeplate.png",
        "assets/images/showcase/homeplate.png"
      ])
    }),
    Object.freeze({
      id: "taskcom",
      name: "TaskCom",
      shortName: "TaskCom",
      description: "Project and task command software for structured execution.",
      category: "APP / PROJECTS",
      href: "https://projecttracker-production-9bab.up.railway.app/",
      images: Object.freeze([
        "assets/images/showcase/taskcom.png",
        "assets/images/showcase/taskcom.png",
        "assets/images/showcase/taskcom.png",
        "assets/images/showcase/taskcom.png",
        "assets/images/showcase/taskcom.png"
      ])
    }),
    Object.freeze({
      id: "binary-tower",
      name: "Binary Tower",
      shortName: "Binary Tower",
      description: "Audio-reactive binary terrain visualization.",
      category: "FFT / TERRAIN",
      href: "https://raideniv.github.io/binary-tower/",
      images: Object.freeze([
        "assets/images/showcase/2.png",
        "assets/images/showcase/2.png",
        "assets/images/showcase/2.png",
        "assets/images/showcase/2.png",
        "assets/images/showcase/2.png"
      ])
    }),
    Object.freeze({
      id: "galaxy",
      name: "Galaxy",
      shortName: "Galaxy",
      description: "A deep-space particle field shaped by sound and motion.",
      category: "AUDIO / PARTICLES",
      href: "https://raideniv.github.io/galaxy/",
      images: Object.freeze([
        "assets/images/showcase/5.png",
        "assets/images/showcase/5.png",
        "assets/images/showcase/5.png",
        "assets/images/showcase/5.png",
        "assets/images/showcase/5.png"
      ])
    }),
    Object.freeze({
      id: "particle-accelerator",
      name: "Particle Accelerator",
      shortName: "Particle Accelerator",
      description: "Reactive energy streams driven through a kinetic particle system.",
      category: "ENERGY / MOTION",
      href: "https://raideniv.github.io/particle-accelerator/",
      images: Object.freeze([
        "assets/images/showcase/1.png",
        "assets/images/showcase/1.png",
        "assets/images/showcase/1.png",
        "assets/images/showcase/1.png",
        "assets/images/showcase/1.png"
      ])
    }),
    Object.freeze({
      id: "spectrogramic-voxel-engine",
      name: "Spectrogramic Voxel Engine",
      shortName: "Voxel Engine",
      description: "Volumetric frequency architecture built from animated voxels.",
      category: "SPECTRUM / VOXELS",
      href: "https://raideniv.github.io/spectrogramic-voxel-engine/",
      images: Object.freeze([
        "assets/images/showcase/3.png",
        "assets/images/showcase/4.png",
        "assets/images/showcase/3.png",
        "assets/images/showcase/4.png",
        "assets/images/showcase/3.png"
      ])
    })
  ])
});
