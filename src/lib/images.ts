import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.png', {
  eager: true,
});

export function getImage(filename: string): ImageMetadata {
  const mod = modules[`/src/assets/images/${filename}`];
  if (!mod) {
    throw new Error(`Image not found in src/assets/images: ${filename}`);
  }
  return mod.default;
}
