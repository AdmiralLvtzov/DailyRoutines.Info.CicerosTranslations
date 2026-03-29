import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

function createDocsEntryId(entry: string) {
  const normalizedPath = entry.replace(/\\/g, '/').replace(/\.[^/.]+$/u, '');
  return normalizedPath.endsWith('/index')
    ? normalizedPath.slice(0, -'/index'.length)
    : normalizedPath;
}

export const collections = {
  docs: defineCollection({
    loader: docsLoader({
      generateId: ({ entry }) => createDocsEntryId(entry)
    }),
    schema: docsSchema()
  })
};
