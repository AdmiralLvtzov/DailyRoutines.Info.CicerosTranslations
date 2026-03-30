import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import matter from 'gray-matter';

const rootDir = process.cwd();
const articlesDir = path.join(rootDir, 'articles');
const assetsDir = path.join(rootDir, 'assets');
const require = createRequire(import.meta.url);
const gitDatesCache = new Map();
let siteDataCache;

export const LOCALES = [
  { key: 'root', code: 'zh', lang: 'zh-CN', dir: '', routePrefix: '' },
  { key: 'en', code: 'en', lang: 'en', dir: 'en', routePrefix: '/en' },
  { key: 'ja', code: 'ja', lang: 'ja-JP', dir: 'ja', routePrefix: '/ja' }
];

export const LOCALE_KEYS = LOCALES.map((locale) => locale.key);
export const DEFAULT_LOCALE = 'root';

export const CATEGORY_CONFIGS = [
  {
    sourceDir: 'Changelog',
    slug: 'changelog',
    order: 100,
    titles: {
      root: '更新日志',
      en: 'Changelog',
      ja: '更新履歴'
    },
    descriptions: {
      root: '版本更新记录、新增模块与重要行为变更。',
      en: 'Release notes, new modules, and important behavior changes.',
      ja: 'リリースノート、新規モジュール、重要な変更点です。'
    }
  },
  {
    sourceDir: 'FAQ',
    slug: 'faq',
    order: 90,
    titles: {
      root: '常见问题',
      en: 'FAQ',
      ja: 'よくある質問'
    },
    descriptions: {
      root: '常见问题、排查方案与日常使用说明。',
      en: 'Frequently asked questions, troubleshooting, and usage guides.',
      ja: 'よくある質問、トラブルシューティング、日常的な利用ガイドです。'
    }
  },
  {
    sourceDir: 'Development',
    slug: 'development',
    order: 80,
    titles: {
      root: '开发文档',
      en: 'Developer',
      ja: '開発ドキュメント'
    },
    descriptions: {
      root: 'IPC 与开发集成相关说明。',
      en: 'IPC and development integration references.',
      ja: 'IPC と開発連携に関する資料です。'
    }
  },
  {
    sourceDir: 'Others',
    slug: 'others',
    order: 10,
    titles: {
      root: '其他内容',
      en: 'Others',
      ja: 'その他'
    },
    descriptions: {
      root: '补充资料与其他整理内容。',
      en: 'Supplementary notes and other curated content.',
      ja: '補足資料やその他の整理済みコンテンツです。'
    }
  }
];

const ALERT_LABELS = {
  root: {
    note: '注意',
    tip: '提示',
    important: '重要',
    warning: '警告',
    caution: '谨慎'
  },
  en: {
    note: 'Note',
    tip: 'Tip',
    important: 'Important',
    warning: 'Warning',
    caution: 'Caution'
  },
  ja: {
    note: '注意',
    tip: 'ヒント',
    important: '重要',
    warning: '警告',
    caution: '注意'
  }
};

function walkMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walkMarkdownFiles(fullPath);
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
    });
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function detectLocale(filename) {
  const match = filename.match(/\.([a-z]{2})\.md$/i);
  if (!match) {
    return DEFAULT_LOCALE;
  }

  const [, code] = match;
  return code === 'en' || code === 'ja' ? code : DEFAULT_LOCALE;
}

function stripLanguageSuffix(filename) {
  return filename.replace(/\.(en|ja)\.md$/i, '.md').replace(/\.md$/i, '');
}

function encodeRouteSegment(value) {
  return encodeURIComponent(value).replace(/%2F/gi, '/');
}

function compareVersionLabels(left, right) {
  const normalize = (value) => value.replace(/^[vV]/, '').split(/[^\d]+/).filter(Boolean).map(Number);
  const leftParts = normalize(left);
  const rightParts = normalize(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const diff = (rightParts[index] ?? 0) - (leftParts[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return left.localeCompare(right, 'en');
}

function compareArticles(category, left, right) {
  if (category.slug === 'changelog') {
    return compareVersionLabels(left.baseName, right.baseName);
  }

  return left.baseName.localeCompare(right.baseName, 'zh-Hans-CN', { numeric: true });
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/^\s{0,3}>\s*\[![^\]]+\]\s*$/gim, ' ')
    .replace(/^:::[^\n]*$/gm, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildExcerpt(markdown) {
  const paragraphs = markdown
    .replace(/^\s{0,3}>\s*\[![^\]]+\]\s*$/gim, '')
    .split(/\n{2,}/)
    .map((section) => stripMarkdown(section))
    .filter(Boolean);

  return (paragraphs[0] ?? '').slice(0, 140);
}

function quoteYaml(value) {
  return JSON.stringify(value ?? '');
}

function formatDateValue(value) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function getGitDates(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, '/');

  if (gitDatesCache.has(normalizedPath)) {
    return gitDatesCache.get(normalizedPath);
  }

  let dates;
  try {
    const { execFileSync } = require('node:child_process');
    const output = execFileSync(
      'git',
      ['log', '--follow', '--format=%aI', '--', normalizedPath],
      {
        cwd: rootDir,
        encoding: 'utf8'
      }
    ).trim();

    if (!output) {
      throw new Error('missing git history');
    }

    const commitDates = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    dates = {
      date: commitDates.at(-1)?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      lastUpdated: commitDates[0] ?? new Date().toISOString()
    };
  } catch {
    const fallback = new Date().toISOString();
    dates = {
      date: fallback.slice(0, 10),
      lastUpdated: fallback
    };
  }

  gitDatesCache.set(normalizedPath, dates);
  return dates;
}

function transformGithubAlerts(markdown, localeKey) {
  const labels = ALERT_LABELS[localeKey] ?? ALERT_LABELS.root;
  const lines = markdown.split(/\r?\n/);
  const transformed = [];
  let fence = null;

  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);

    if (fenceMatch) {
      const currentFence = fenceMatch[1];
      if (!fence) {
        fence = currentFence;
      } else if (currentFence[0] === fence[0] && currentFence.length >= fence.length) {
        fence = null;
      }
      transformed.push(line);
      index += 1;
      continue;
    }

    if (!fence) {
      const alertMatch = line.match(/^\s{0,3}>\s*\[!([a-z]+)\]\s*$/i);
      if (alertMatch) {
        const alertType = alertMatch[1].toLowerCase();
        const mappedType =
          alertType === 'tip' ? 'tip' :
          alertType === 'important' ? 'note' :
          alertType === 'warning' || alertType === 'caution' ? 'caution' :
          'note';

        const title = labels[alertType] ?? labels.note;
        const contentLines = [];
        index += 1;

        while (index < lines.length) {
          const contentLine = lines[index];
          if (!/^\s{0,3}>/.test(contentLine)) {
            break;
          }
          contentLines.push(contentLine.replace(/^\s{0,3}>\s?/, ''));
          index += 1;
        }

        transformed.push(`:::${mappedType}[${title}]`);
        if (contentLines.length > 0) {
          transformed.push(...contentLines);
        }
        transformed.push(':::');
        transformed.push('');
        continue;
      }
    }

    transformed.push(line);
    index += 1;
  }

  return transformed.join('\n').trim();
}

function createDocFrontmatter(metadata) {
  return [
    '---',
    `title: ${quoteYaml(metadata.title)}`,
    metadata.description ? `description: ${quoteYaml(metadata.description)}` : null,
    metadata.lastUpdated ? `lastUpdated: ${formatDateValue(metadata.lastUpdated)}` : null,
    '---',
    ''
  ].filter(Boolean).join('\n');
}

function createOverviewContent(localeKey, category, articles) {
  const titles = {
    root: {
      introTitle: '分类说明',
      articleTitle: '文章列表',
      empty: '当前分类暂时还没有文章。'
    },
    en: {
      introTitle: 'Overview',
      articleTitle: 'Articles',
      empty: 'There are no articles in this section yet.'
    },
    ja: {
      introTitle: '概要',
      articleTitle: '記事一覧',
      empty: 'このカテゴリにはまだ記事がありません。'
    }
  }[localeKey];

  const description = getLocalizedValue(category.descriptions, localeKey);
  const visibleArticles = getVisibleArticles(articles, localeKey);
  const articleItems = visibleArticles.map((article) => {
    const articleMeta = article.translations[localeKey] ?? article.translations.root;
    const suffix = article.date ? ` · ${article.date}` : '';
    return `- [${articleMeta.title}](./${article.slug}/)${suffix}`;
  });

  return [
    `## ${titles.introTitle}`,
    '',
    description,
    '',
    `## ${titles.articleTitle}`,
    '',
    articleItems.length > 0 ? articleItems.join('\n') : titles.empty,
    ''
  ].join('\n');
}

function createDocsHomeContent(localeKey, siteData) {
  const labels = {
    root: {
      intro: '这里集中整理了 Daily Routines 的常见问题、更新日志、开发资料与其他补充内容。',
      categoryTitle: '内容分区',
      latestTitle: '最近更新'
    },
    en: {
      intro: 'This site collects Daily Routines FAQs, changelogs, developer references, and supplemental notes.',
      categoryTitle: 'Sections',
      latestTitle: 'Latest Updates'
    },
    ja: {
      intro: 'このサイトでは、Daily Routines の FAQ、更新履歴、開発資料、補足情報をまとめています。',
      categoryTitle: 'カテゴリ',
      latestTitle: '最近の更新'
    }
  }[localeKey];

  const changelogCategory = siteData.categories.find((category) => category.slug === 'changelog');
  const latestItems = getVisibleArticles(changelogCategory?.articles ?? [], localeKey).slice(0, 8).map((article) => {
    const articleMeta = article.translations[localeKey] ?? article.translations.root;
    return `- [${articleMeta.title}](${buildDocsArticleLink(localeKey, 'changelog', article.slug)})`;
  });

  return [
    labels.intro,
    '',
    `## ${labels.categoryTitle}`,
    '',
    ...siteData.categories.map((category) => {
      const title = getLocalizedValue(category.titles, localeKey);
      const description = getLocalizedValue(category.descriptions, localeKey);
      return `- [${title}](${buildDocsCategoryLink(localeKey, category.slug)})\n  ${description}`;
    }),
    '',
    `## ${labels.latestTitle}`,
    '',
    latestItems.join('\n'),
    ''
  ].join('\n');
}

export function buildDocsCategoryLink(localeKey, categorySlug) {
  const locale = LOCALES.find((entry) => entry.key === localeKey) ?? LOCALES[0];
  return `${locale.routePrefix}/docs/${categorySlug}/`;
}

export function buildDocsHomeLink(localeKey) {
  const locale = LOCALES.find((entry) => entry.key === localeKey) ?? LOCALES[0];
  return `${locale.routePrefix}/docs/`;
}

export function buildDocsArticleLink(localeKey, categorySlug, articleSlug) {
  const locale = LOCALES.find((entry) => entry.key === localeKey) ?? LOCALES[0];
  return `${locale.routePrefix}/docs/${categorySlug}/${encodeRouteSegment(articleSlug)}/`;
}

export function buildSiteHomeLink(localeKey) {
  const locale = LOCALES.find((entry) => entry.key === localeKey) ?? LOCALES[0];
  return locale.routePrefix || '/';
}

export function getLocalizedValue(values, localeKey) {
  return values?.[localeKey] ?? values?.[DEFAULT_LOCALE] ?? '';
}

export function getVisibleArticles(articles, localeKey) {
  if (localeKey === DEFAULT_LOCALE) {
    return articles;
  }

  return articles.filter((article) => article.translations[localeKey]);
}

export function buildSiteData() {
  if (siteDataCache) {
    return siteDataCache;
  }

  const categories = CATEGORY_CONFIGS.map((categoryConfig) => {
    const directory = path.join(articlesDir, categoryConfig.sourceDir);
    const groupedArticles = new Map();

    for (const filePath of walkMarkdownFiles(directory)) {
      const filename = path.basename(filePath);
      const localeKey = detectLocale(filename);
      const baseName = stripLanguageSuffix(filename);
      const raw = readUtf8(filePath);
      const { data, content } = matter(raw);
      const relativePath = path.relative(rootDir, filePath);
      const { date, lastUpdated } = getGitDates(relativePath);
      const slug = baseName;

      if (!groupedArticles.has(baseName)) {
        groupedArticles.set(baseName, {
          baseName,
          slug,
          date,
          lastUpdated,
          translations: {}
        });
      }

      const article = groupedArticles.get(baseName);
      article.date = article.date || date;
      article.lastUpdated =
        new Date(lastUpdated).getTime() > new Date(article.lastUpdated).getTime()
          ? lastUpdated
          : article.lastUpdated;

      article.translations[localeKey] = {
        localeKey,
        title: data.title?.toString().trim() || baseName,
        description: data.description?.toString().trim() || buildExcerpt(content),
        content: transformGithubAlerts(content.trim(), localeKey),
        filePath,
        relativePath,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        lastUpdated,
        date
      };
    }

    const articles = Array.from(groupedArticles.values())
      .sort((left, right) => compareArticles(categoryConfig, left, right));

    const latestUpdate = articles.reduce((latest, article) => {
      return new Date(article.lastUpdated).getTime() > new Date(latest).getTime()
        ? article.lastUpdated
        : latest;
    }, new Date().toISOString());

    return {
      ...categoryConfig,
      articles,
      articleCount: articles.length,
      latestUpdate
    };
  }).sort((left, right) => right.order - left.order);

  const latestUpdate = categories.reduce((latest, category) => {
    return new Date(category.latestUpdate).getTime() > new Date(latest).getTime()
      ? category.latestUpdate
      : latest;
  }, new Date().toISOString());

  siteDataCache = {
    generatedAt: new Date().toISOString(),
    latestUpdate,
    categories
  };

  return siteDataCache;
}

export function buildSidebarConfig() {
  const siteData = buildSiteData();
  return [
    {
      label: '站点入口',
      translations: {
        en: 'Site',
        'ja-JP': 'サイト'
      },
      items: [
        {
          label: '官网首页',
          translations: {
            en: 'Home',
            'ja-JP': 'ホーム'
          },
          link: '/'
        }
      ]
    },
    {
      label: '内容分区',
      translations: {
        en: 'Sections',
        'ja-JP': 'カテゴリ'
      },
      items: siteData.categories.map((category) => ({
        label: getLocalizedValue(category.titles, 'root'),
        translations: {
          en: getLocalizedValue(category.titles, 'en'),
          'ja-JP': getLocalizedValue(category.titles, 'ja')
        },
        link: `/docs/${category.slug}/`
      }))
    }
  ];
}

export function syncGeneratedDocs() {
  const siteData = buildSiteData();
  const docsRoot = path.join(rootDir, 'src', 'content', 'docs');
  const publicAssetsDir = path.join(rootDir, 'public', 'assets');

  fs.rmSync(docsRoot, { recursive: true, force: true });
  fs.mkdirSync(docsRoot, { recursive: true });

  fs.rmSync(publicAssetsDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(publicAssetsDir), { recursive: true });
  fs.cpSync(assetsDir, publicAssetsDir, { recursive: true, force: true });

  for (const locale of LOCALES) {
    const localeRoot = locale.dir ? path.join(docsRoot, locale.dir) : docsRoot;
    const docsPrefix = path.join(localeRoot, 'docs');
    fs.mkdirSync(docsPrefix, { recursive: true });

    const docsIndexFrontmatter = createDocFrontmatter({
      title: locale.key === 'root' ? '文档中心' : locale.key === 'en' ? 'Docs' : 'ドキュメント',
      description:
        locale.key === 'root'
          ? 'Daily Routines 文档总览'
          : locale.key === 'en'
            ? 'Daily Routines documentation overview'
            : 'Daily Routines ドキュメント一覧',
      lastUpdated: siteData.generatedAt
    });

    fs.writeFileSync(
      path.join(docsPrefix, 'index.md'),
      `${docsIndexFrontmatter}${createDocsHomeContent(locale.key, siteData)}\n`,
      'utf8'
    );

    for (const category of siteData.categories) {
      const categoryDir = path.join(docsPrefix, category.slug);
      fs.mkdirSync(categoryDir, { recursive: true });

      const overviewFrontmatter = createDocFrontmatter({
        title: getLocalizedValue(category.titles, locale.key),
        description: getLocalizedValue(category.descriptions, locale.key),
        lastUpdated: category.latestUpdate
      });

      fs.writeFileSync(
        path.join(categoryDir, 'index.md'),
        `${overviewFrontmatter}${createOverviewContent(locale.key, category, category.articles)}\n`,
        'utf8'
      );
    }
  }

  for (const category of siteData.categories) {
    for (const article of category.articles) {
      for (const localeKey of Object.keys(article.translations)) {
        const locale = LOCALES.find((entry) => entry.key === localeKey) ?? LOCALES[0];
        const translation = article.translations[localeKey];
        const localeRoot = locale.dir ? path.join(docsRoot, locale.dir) : docsRoot;
        const articleDir = path.join(localeRoot, 'docs', category.slug);
        fs.mkdirSync(articleDir, { recursive: true });

        const frontmatter = createDocFrontmatter({
          title: translation.title,
          description: translation.description,
          lastUpdated: translation.lastUpdated
        });

        fs.writeFileSync(
          path.join(articleDir, `${article.slug}.md`),
          `${frontmatter}${translation.content}\n`,
          'utf8'
        );
      }
    }
  }

  return siteData;
}
