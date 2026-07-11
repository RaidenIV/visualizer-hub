/**
 * Central content and destination configuration for the visualization hub.
 * Update project URLs here if a repository is published under a different path.
 */
export const hubConfig = Object.freeze({
  accent: "#0075ff",
  projects: Object.freeze([
    Object.freeze({
      id: "binary-tower",
      name: "Binary Tower",
      shortName: "Binary Tower",
      description: "Audio-reactive binary terrain visualization.",
      category: "FFT / TERRAIN",
      href: "https://raideniv.github.io/binary-tower/",
      visual: "binary"
    }),
    Object.freeze({
      id: "galaxy",
      name: "Galaxy",
      shortName: "Galaxy",
      description: "A deep-space particle field shaped by sound and motion.",
      category: "AUDIO / PARTICLES",
      href: "https://raideniv.github.io/galaxy/",
      visual: "galaxy"
    }),
    Object.freeze({
      id: "particle-accelerator",
      name: "Particle Accelerator",
      shortName: "Particle Accelerator",
      description: "Reactive energy streams driven through a kinetic particle system.",
      category: "ENERGY / MOTION",
      href: "https://raideniv.github.io/particle-accelerator/",
      visual: "accelerator"
    }),
    Object.freeze({
      id: "spectrogramic-voxel-engine",
      name: "Spectrogramic Voxel Engine",
      shortName: "Voxel Engine",
      description: "Volumetric frequency architecture built from animated voxels.",
      category: "SPECTRUM / VOXELS",
      href: "https://raideniv.github.io/spectrogramic-voxel-engine/",
      visual: "voxel"
    })
  ])
});
