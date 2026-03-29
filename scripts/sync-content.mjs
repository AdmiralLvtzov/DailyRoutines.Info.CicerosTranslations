import { syncGeneratedDocs } from './site-data.mjs';

const siteData = syncGeneratedDocs();

console.log(
  `已同步 ${siteData.categories.length} 个分类、${siteData.categories.reduce((sum, category) => sum + category.articleCount, 0)} 篇文章到 Astro / Starlight 内容目录。`
);
