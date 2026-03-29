const fs = require('fs');
const path = require('path');
const glob = require('glob');
const frontmatter = require('front-matter');
const { execFileSync } = require('child_process');
const { LANGUAGE_CONFIG, CATEGORY_WEIGHTS } = require('./js/config.js');

const articlesDir = path.join(__dirname, 'articles');
const outputFile = path.join(__dirname, 'articles.json');
const gitArticleDateCache = new Map();

function getGitArticleDates(filePath) {
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    if (gitArticleDateCache.has(relativePath)) {
        return gitArticleDateCache.get(relativePath);
    }

    let articleDates;

    try {
        const gitLogOutput = execFileSync(
            'git',
            ['log', '--follow', '--format=%aI', '--', relativePath],
            { encoding: 'utf8' }
        ).trim();

        if (!gitLogOutput) {
            throw new Error('文件尚未提交到 Git');
        }

        const commitDates = gitLogOutput
            .split(/\r?\n/)
            .map(item => item.trim())
            .filter(Boolean);

        articleDates = {
            date: commitDates.at(-1).split('T')[0],
            lastModified: commitDates[0]
        };
    } catch (error) {
        const fallbackDate = new Date().toISOString();
        console.warn(`文件 ${relativePath} 暂无可用的 Git 历史，临时使用当前时间: ${error.message}`);
        articleDates = {
            date: fallbackDate.split('T')[0],
            lastModified: fallbackDate
        };
    }

    gitArticleDateCache.set(relativePath, articleDates);
    return articleDates;
}

function getArticleLanguage(filename) {
    const match = filename.match(/\.([a-z]{2})\.md$/);
    return match ? match[1] : LANGUAGE_CONFIG.default;
}

function getBaseSlug(filename) {
    return filename.replace(/\.[a-z]{2}\.md$/, '.md').replace(/\.md$/, '');
}

function comparePaths(a, b) {
    return a.replace(/\\/g, '/').localeCompare(b.replace(/\\/g, '/'), 'zh-Hans-CN');
}

function generateIndex() {
    console.log('===== 开始生成索引 =====');

    // 确保文章目录存在
    if (!fs.existsSync(articlesDir)) {
        fs.mkdirSync(articlesDir, { recursive: true });
    }

    const categories = [];
    
    // 获取所有子文件夹作为分类
    const categoryDirs = glob.sync('articles/*/', { onlyDirectories: true }).sort(comparePaths);
    
    categoryDirs.forEach(categoryDir => {
        const categoryName = path.basename(categoryDir);
        const articles = new Map(); // 用于存储该分类下的文章
        const normalizedCategoryDir = categoryDir.replace(/\\/g, '/').replace(/\/$/, '');
        
        // 获取分类目录下的所有文章
        const articleFiles = glob.sync(`${normalizedCategoryDir}/**/*.md`).sort(comparePaths);
        
        articleFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const { attributes } = frontmatter(content);
                
                // 验证必需的 frontmatter 字段
                if (!attributes.title) {
                    console.warn(`警告: ${file} 缺少标题字段`);
                    return;
                }

                const language = getArticleLanguage(path.basename(file));
                const baseSlug = getBaseSlug(path.basename(file));
                const { date, lastModified } = getGitArticleDates(file);

                const article = {
                    title: attributes.title,
                    date: date,
                    slug: baseSlug,
                    description: attributes.description || '',
                    tags: attributes.tags || [],
                    lastModified: lastModified,
                    language: language,
                    translations: {}
                };

                if (!articles.has(baseSlug)) {
                    articles.set(baseSlug, {
                        base: null,
                        translations: {}
                    });
                }

                const articleData = articles.get(baseSlug);
                if (language === LANGUAGE_CONFIG.default) {
                    articleData.base = article;
                } else {
                    articleData.translations[language] = article;
                }
            } catch (error) {
                console.error(`处理文件 ${file} 时出错:`, error);
            }
        });

        // 处理文章的翻译信息并创建最终的文章列表
        const finalArticles = [];
        articles.forEach((articleData, slug) => {
            if (articleData.base) {
                const finalArticle = { ...articleData.base };
                finalArticle.translations = Object.fromEntries(
                    Object.entries(articleData.translations).sort(([languageA], [languageB]) =>
                        languageA.localeCompare(languageB, 'en')
                    )
                );
                finalArticles.push(finalArticle);
            }
        });

        // 按日期降序排序文章，日期相同时按 slug 排序以确保稳定输出
        const sortedArticles = finalArticles.sort((a, b) => 
            new Date(b.date) - new Date(a.date) || a.slug.localeCompare(b.slug, 'en')
        );

        categories.push({
            name: categoryName,
            articles: sortedArticles
        });
    });

    // 按分类权重排序，权重相同时按名称排序
    categories.sort((a, b) => {
        const weightA = CATEGORY_WEIGHTS[a.name] || 0;
        const weightB = CATEGORY_WEIGHTS[b.name] || 0;
        if (weightA === weightB) {
            return a.name.localeCompare(b.name);
        }
        return weightB - weightA;
    });

    // 写入 JSON 文件
    try {
        fs.writeFileSync(outputFile, JSON.stringify({
            config: LANGUAGE_CONFIG,
            categoryWeights: CATEGORY_WEIGHTS, // 添加权重配置到输出
            categories: categories
        }, null, 2));
        console.log('✅ 索引生成成功！');
        console.log(`📚 共处理 ${categories.length} 个分类，${categories.reduce((sum, cat) => sum + cat.articles.length, 0)} 篇文章`);
        console.log('===== 索引生成完成 =====');
    } catch (error) {
        console.error('❌ 写入索引文件失败:', error);
        process.exit(1);
    }
}

// 执行生成
generateIndex(); 
