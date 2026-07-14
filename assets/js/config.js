/**
 * Audio visualizer navigation and cylindrical gallery image sets.
 */
export const hubConfig = Object.freeze({
  accent: "#0075ff",
  visualizers: Object.freeze([
    Object.freeze({
      id: "binary-tower",
      name: "BINARY TOWER",
      description: "Audio-reactive binary terrain visualization.",
      href: "https://raideniv.github.io/binary-tower/",
      projectId: "binary-tower"
    }),
    Object.freeze({
      id: "galaxy",
      name: "GALAXY",
      description: "A deep-space particle field shaped by sound and motion.",
      href: "https://raideniv.github.io/galaxy-visualizer/",
      projectId: "galaxy"
    }),
    Object.freeze({
      id: "particle-accelerator",
      name: "PARTICLE ACCELERATOR",
      description: "Reactive energy streams driven through a kinetic particle system.",
      href: "https://www.xodiamediagroup.com/vis",
      projectId: "particle-accelerator"
    }),
    Object.freeze({
      id: "spectrogramic-voxel-engine",
      name: "SPECTROGRAMIC VOXEL ENGINE",
      description: "Volumetric frequency architecture built from animated voxels.",
      href: "https://raideniv.github.io/spectrogramic-voxel-engine/",
      projectId: "spectrogramic-voxel-engine"
    }),
    Object.freeze({
      id: "waterfall-spectrogram",
      name: "WATERFALL SPECTROGRAM",
      description: "A line-based waterfall view of audio frequency energy over time.",
      href: "https://raideniv.github.io/line-spectrogram/",
      projectId: "waterfall-spectrogram"
    })
  ]),
  projects: Object.freeze([
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
      href: "https://raideniv.github.io/galaxy-visualizer/",
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
      href: "https://www.xodiamediagroup.com/vis",
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
    }),
    Object.freeze({
      id: "waterfall-spectrogram",
      name: "Waterfall Spectrogram",
      shortName: "Waterfall Spectrogram",
      description: "A line-based waterfall view of audio frequency energy over time.",
      category: "SPECTRUM / WATERFALL",
      href: "https://raideniv.github.io/line-spectrogram/",
      images: Object.freeze([
        "assets/images/showcase/1.png",
        "assets/images/showcase/2.png",
        "assets/images/showcase/3.png",
        "assets/images/showcase/4.png",
        "assets/images/showcase/5.png"
      ])
    })
  ])
});
