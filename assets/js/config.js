/**
 * Project content, destinations, and image sets for the cylindrical gallery.
 * Replace the image paths inside a project to give that visualizer its own screenshots.
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
