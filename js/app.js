// 配置参数
const CONFIG = {
    articlesPath: 'articles',
    indexFile: 'articles.json',
    basePath: '',
    cacheVersion: Date.now(), // 添加缓存版本
    recentArticlesCount: 5 // 每个分类显示的最新文章数量
};

// 初始化基础路径
function initBasePath() {
    const scriptPath = document.currentScript.src;
    const baseUrl = new URL('.', window.location.href).pathname;
    CONFIG.basePath = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

// 设置动画顺序
function setAnimationOrder() {
    // 为分类卡片设置动画顺序
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach((card, index) => {
        card.style.setProperty('--animation-order', index);
    });
    
    // 为文章列表项设置动画顺序
    const navArticleItems = document.querySelectorAll('.nav-article-item');
    navArticleItems.forEach((item, index) => {
        item.style.setProperty('--animation-order', index);
    });
    
    // 为最近文章项设置动画顺序
    const recentArticleItems = document.querySelectorAll('.recent-article-item');
    recentArticleItems.forEach((item, index) => {
        item.style.setProperty('--animation-order', index);
    });
}

class FAQApp {
    constructor() {
        // 确保语言配置存在
        if (!window.LANGUAGE_CONFIG) {
            console.error('语言配置未加载！');
            window.LANGUAGE_CONFIG = {
                default: 'zh',
                supported: ['zh'],
                labels: { 'zh': '中文' }
            };
        }
        
        this.categories = [];
        this.categoryWeights = {}; // 添加分类权重存储
        
        // 获取本地存储的语言设置或浏览器语言
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
        } else {
            // 获取浏览器语言
            const browserLang = navigator.language.toLowerCase().split('-')[0];
            // 检查浏览器语言是否在支持的语言列表中
            this.currentLanguage = window.LANGUAGE_CONFIG.supported.includes(browserLang)
                ? browserLang
                : window.LANGUAGE_CONFIG.default;
            // 保存初始语言设置
            localStorage.setItem('selectedLanguage', this.currentLanguage);
        }

        this.searchEngine = new SearchEngine();
        this.currentArticle = null;
        this.lastIndexCheck = 0;
        initBasePath();
        this.init();
        this.setupAutoRefresh();
        this.setupUpdateNotification();
    }

    // 添加翻译辅助函数
    t(key) {
        const keys = key.split('.');
        let value = window.TRANSLATIONS[this.currentLanguage];
        for (const k of keys) {
            if (!value || !value[k]) {
                console.warn(`Translation missing for key: ${key} in language: ${this.currentLanguage}`);
                // 回退到默认语言
                value = window.TRANSLATIONS[window.LANGUAGE_CONFIG.default];
                for (const defaultK of keys) {
                    value = value[defaultK];
                }
                break;
            }
            value = value[k];
        }
        return value;
    }

    setupAutoRefresh() {
        // 移除自动刷新逻辑，改为只在用户主动触发时检查更新
        // 当页面从隐藏状态变为可见时，不自动刷新
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // 可以在这里添加更新提示，但不自动刷新
                console.log('页面已恢复可见状态');
            }
        });
    }

    setupUpdateNotification() {
        // 监听 Service Worker 更新
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // 显示更新提示
                this.showUpdateNotification();
            });
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-message">
                网站已更新！
                <button onclick="window.location.reload()">立即刷新</button>
            </div>
        `;
        document.body.appendChild(notification);
    }

    async checkForUpdates() {
        try {
            const response = await fetch(`${CONFIG.basePath}/${CONFIG.indexFile}`, {
                method: 'GET',
                cache: 'no-cache' // 使用 fetch 缓存控制
            });
            
            if (!response.ok) return;
            
            const newIndex = await response.json();
            const currentHash = JSON.stringify(this.categories);
            const newHash = JSON.stringify(newIndex.categories);
            
            if (currentHash !== newHash) {
                console.log('检测到文章更新，正在刷新...');
                this.categories = newIndex.categories;
                this.categoryWeights = newIndex.categoryWeights || {};
                
                // 根据权重重新排序分类
                this.categories.sort((a, b) => {
                    const weightA = this.categoryWeights[a.name] || 0;
                    const weightB = this.categoryWeights[b.name] || 0;
                    if (weightA === weightB) {
                        return a.name.localeCompare(b.name);
                    }
                    return weightB - weightA;
                });
                
                this.renderCategories();
                
                // 如果有当前文章，重新加载
                if (this.currentArticle) {
                    await this.loadArticle(this.currentArticle.slug, this.currentArticle.category);
                }
            }
        } catch (error) {
            console.error('检查更新失败:', error);
        }
    }

    async init() {
        try {
            await this.loadIndex();
            await this.searchEngine.init();
            this.renderCategories();
            this.setupEventListeners();
            this.checkInitialHash();
            this.setupCategoryState();
            this.setupTheme();
            this.setupNavigation();
            this.setupSearch();
            this.updatePageTitle();
        } catch (error) {
            console.error('初始化失败:', error);
            document.getElementById('category-list').innerHTML = `
                <div class="error-message">
                    <h2>${this.t('errors.loadFailed')}</h2>
                    <p>${this.t('errors.indexLoadError')}</p>
                    <p>${this.t('errors.errorMessage')}: ${error.message}</p>
                </div>
            `;
        }
    }

    async loadIndex() {
        const response = await fetch(`${CONFIG.basePath}/${CONFIG.indexFile}?v=${CONFIG.cacheVersion}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.categories = data.categories;
        this.categoryWeights = data.categoryWeights || {}; // 加载分类权重
        
        // 根据权重重新排序分类
        this.categories.sort((a, b) => {
            const weightA = this.categoryWeights[a.name] || 0;
            const weightB = this.categoryWeights[b.name] || 0;
            if (weightA === weightB) {
                return a.name.localeCompare(b.name);
            }
            return weightB - weightA;
        });

        // 设置语言选择器
        const languageSelector = document.getElementById('language-selector');
        languageSelector.innerHTML = window.LANGUAGE_CONFIG.supported.map(lang => 
            `<option value="${lang}">${window.LANGUAGE_CONFIG.labels[lang]}</option>`
        ).join('');
        languageSelector.value = this.currentLanguage;
        languageSelector.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            localStorage.setItem('selectedLanguage', this.currentLanguage);
            this.updatePageTitle();
            this.renderCategories(); // 重新渲染分类和文章列表
            this.reloadCurrentArticle();
        });
    }

    // 获取文章在当前语言下的标题
    async getArticleTitle(article, category) {
        // 如果文章本身有多语言标题，直接使用
        if (article.titles && article.titles[this.currentLanguage]) {
            return article.titles[this.currentLanguage];
        }

        // 否则尝试从文章文件中获取标题
        try {
            const path = `${CONFIG.basePath}/${CONFIG.articlesPath}/${category}/${article.slug}${this.currentLanguage === window.LANGUAGE_CONFIG.default ? '' : '.' + this.currentLanguage}.md?v=${CONFIG.cacheVersion}`;
            const response = await fetch(path, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (response.ok) {
                const content = await response.text();
                const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
                if (frontmatterMatch) {
                    const frontmatter = frontmatterMatch[1];
                    const titleMatch = frontmatter.match(/title:\s*(.+)/);
                    if (titleMatch) {
                        return titleMatch[1].trim();
                    }
                }
            }
        } catch (error) {
            console.warn(`无法获取文章 ${article.slug} 的 ${this.currentLanguage} 标题:`, error);
        }

        // 如果获取失败，返回默认标题
        return article.title;
    }

    async renderCategories() {
        const container = document.getElementById('category-list');
        const categoryNav = document.getElementById('category-nav');
        
        // 渲染主页分类卡片
        container.innerHTML = '<div class="loading"><div class="loader"></div><p>' + this.t('loading.index') + '</p></div>';
        categoryNav.innerHTML = ''; // 清空导航

        // 为每个分类异步获取文章标题
        const categoriesHTML = await Promise.all(this.categories.map(async category => {
            const recentArticles = await Promise.all(
                category.articles.slice(0, CONFIG.recentArticlesCount).map(async article => {
                    const title = await this.getArticleTitle(article, category.name);
                    return `
                        <li class="recent-article-item" 
                            data-slug="${article.slug}"
                            data-category="${category.name}">
                            ${title}
                            ${article.date ? `<span class="article-date-small">${article.date}</span>` : ''}
                        </li>
                    `;
                })
            );

            return `
                <div class="category-card" data-category="${category.name}">
                    <div class="category-card-header">
                        <div class="category-icon">${category.name[0]}</div>
                        <h2 class="category-title">${category.name}</h2>
                    </div>
                    <ul class="recent-articles">
                        ${recentArticles.join('')}
                    </ul>
                </div>
            `;
        }));

        container.innerHTML = categoriesHTML.join('');

        // 异步渲染侧边栏导航
        const navHTML = await Promise.all(this.categories.map(async category => {
            const articlesList = await Promise.all(
                category.articles.map(async article => {
                    const title = await this.getArticleTitle(article, category.name);
                    return `
                        <li class="nav-article-item" 
                            data-slug="${article.slug}"
                            data-category="${category.name}">
                            ${title}
                        </li>
                    `;
                })
            );

            return `
                <div class="nav-category">
                    <h4 class="nav-category-title">${category.name}</h4>
                    <ul class="nav-article-list">
                        ${articlesList.join('')}
                    </ul>
                </div>
            `;
        }));

        categoryNav.innerHTML = navHTML.join('');

        // 重新绑定事件监听器
        this.setupEventListeners();
        this.setupCategoryState();
        
        // 渲染完成后设置动画顺序
        setTimeout(setAnimationOrder, 100);
    }

    setupEventListeners() {
        // 主页分类卡片点击事件
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // 如果点击的是文章项，不触发分类跳转
                if (!e.target.closest('.recent-article-item')) {
                    const categoryName = card.dataset.category;
                    this.showCategoryPage(categoryName);
                }
            });
        });

        // 主页文章点击事件
        document.querySelectorAll('.recent-article-item').forEach(item => {
            item.addEventListener('click', () => this.loadArticle(
                item.dataset.slug,
                item.dataset.category
            ));
        });

        // 侧边栏文章点击事件
        document.querySelectorAll('.nav-article-item').forEach(item => {
            item.addEventListener('click', () => this.loadArticle(
                item.dataset.slug,
                item.dataset.category
            ));
        });

        // 返回主页按钮点击事件
        document.querySelector('.sidebar-back').addEventListener('click', () => {
            this.showHome();
        });

        // 主页标题点击事件
        document.querySelector('.header-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHome();
        });

        // 侧边栏品牌点击事件
        document.querySelector('.sidebar-brand').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHome();
        });

        window.addEventListener('hashchange', () => this.checkInitialHash());
    }

    showHome() {
        document.querySelector('.container').classList.add('hidden');
        document.querySelector('.home-container').classList.remove('hidden');
        window.location.hash = '';
    }

    async loadArticle(slug, category) {
        // 防止重复加载同一篇文章
        if (this.isArticleLoading && this.currentArticle && this.currentArticle.slug === slug && this.currentArticle.category === category) {
            return;
        }
        
        this.isArticleLoading = true;
        document.querySelector('.container').classList.remove('hidden');
        document.querySelector('.home-container').classList.add('hidden');
        const articleContent = document.getElementById('article-content');
        articleContent.innerHTML = `
            <div class="loading">
                <div class="loader"></div>
                <p>${this.t('loading.article')}</p>
            </div>
        `;
        
        try {
            // 首先尝试加载当前语言版本
            let path = `${CONFIG.basePath}/${CONFIG.articlesPath}/${category}/${slug}${this.currentLanguage === window.LANGUAGE_CONFIG.default ? '' : '.' + this.currentLanguage}.md`;
            let response = await fetch(path, {
                method: 'GET',
                cache: 'no-cache' // 使用 fetch 缓存控制
            });

            // 如果当前语言版本不存在，回退到默认语言版本
            if (!response.ok && this.currentLanguage !== window.LANGUAGE_CONFIG.default) {
                console.log(`当前语言版本 (${this.currentLanguage}) 不存在，使用默认语言版本`);
                path = `${CONFIG.basePath}/${CONFIG.articlesPath}/${category}/${slug}.md`;
                response = await fetch(path, {
                    method: 'GET',
                    cache: 'no-cache' // 使用 fetch 缓存控制
                });
            }

            if (!response.ok) throw new Error(`文章加载失败 (${response.status})`);
            
            const markdown = await response.text();
            
            // 配置 marked.js 选项
            const markedOptions = {
                gfm: true, // 启用 GitHub 风格的 Markdown
                breaks: true, // 启用换行符转换为 <br>
            };

            // 配置代码高亮
            marked.use({
                async: false,
                gfm: true,
                breaks: true,
                renderer: {
                    code(code, language) {
                        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
                        return `<pre><code class="hljs language-${validLanguage}">${
                            hljs.highlight(code, { language: validLanguage }).value
                        }</code></pre>`;
                    }
                }
            });

            // 配置标题 ID 插件
            if (window.markedGfmHeadingId) {
                marked.use(window.markedGfmHeadingId.gfmHeadingId());
            }
            
            // 解析 frontmatter
            const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            if (frontmatterMatch) {
                const [_, frontmatterContent, markdownContent] = frontmatterMatch;
                const frontmatter = {};
                frontmatterContent.split('\n').forEach(line => {
                    const [key, ...values] = line.split(':').map(s => s.trim());
                    if (key && values.length) {
                        if (values[0].startsWith('[')) {
                            frontmatter[key] = values.join(':')
                                .replace(/[\[\]]/g, '')
                                .split(',')
                                .map(tag => tag.trim());
                        } else {
                            frontmatter[key] = values.join(':').trim();
                        }
                    }
                });

                // 构建文章头部 HTML
                let articleHeader = `
                    <div class="article-header">
                        <h1>${frontmatter.title}</h1>
                        ${frontmatter.date ? `
                            <div class="article-date">
                                <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M19,4H17V3a1,1,0,0,0-2,0V4H9V3A1,1,0,0,0,7,3V4H5A2,2,0,0,0,3,6V19a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2V6A2,2,0,0,0,19,4Zm0,15H5V8H19Z"/>
                                </svg>
                                ${frontmatter.date}
                            </div>
                        ` : ''}
                        ${frontmatter.tags ? `
                            <div class="article-tags">
                                ${frontmatter.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;

                // 使用新版本的 marked API 渲染 Markdown 内容
                this.renderArticle(articleHeader + marked.parse(markdownContent));
            } else {
                // 如果没有 frontmatter，直接渲染全部内容
                this.renderArticle(marked.parse(markdown));
            }
            
            // 更新当前文章信息
            this.currentArticle = { slug, category };
            
            // 使用 replaceState 而不是直接修改 hash，避免触发 hashchange 事件
            const newHash = `#${category}/${slug}`;
            if (window.location.hash !== newHash) {
                history.replaceState(null, null, newHash);
            }

            const savedProgress = localStorage.getItem(`progress:${newHash}`);
            if (savedProgress) {
                requestAnimationFrame(() => {
                    articleContent.scrollTop = savedProgress * 
                        (articleContent.scrollHeight - articleContent.clientHeight);
                });
            }
        } catch (error) {
            console.error('加载文章失败:', error);
            articleContent.innerHTML = `
                <div class="error-message">
                    <h2>加载失败</h2>
                    <p>无法加载文档</p>
                    <p>错误信息: ${error.message}</p>
                </div>
            `;
        } finally {
            this.isArticleLoading = false;
        }
    }

    renderArticle(content) {
        const articleContent = document.getElementById('article-content');
        const articleList = document.getElementById('article-list');
        
        articleContent.innerHTML = content;
        articleList.classList.add('hidden');
        articleContent.classList.remove('hidden');
        
        // 高亮代码块
        document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });

        // 保存阅读进度
        articleContent.addEventListener('scroll', () => {
            if (!this.currentArticle) return;
            
            const scrollPercent = articleContent.scrollTop / 
                (articleContent.scrollHeight - articleContent.clientHeight);
            const progressKey = `progress:#${this.currentArticle.category}/${this.currentArticle.slug}`;
            localStorage.setItem(progressKey, scrollPercent);
        });
    }

    checkInitialHash() {
        if (window.location.hash) {
            const hashContent = decodeURIComponent(window.location.hash.substring(1));
            const parts = hashContent.split('/');
            
            if (parts.length === 2) {
                // 如果hash包含category和slug，加载具体文章
                const [category, slug] = parts;
                
                // 避免重复加载当前文章
                if (this.currentArticle && this.currentArticle.slug === slug && this.currentArticle.category === category) {
                    return;
                }
                
                this.loadArticle(slug, category);
            } else if (parts.length === 1) {
                // 如果hash只包含category，显示分类页面
                this.showCategoryPage(parts[0]);
            }
        } else {
            this.showHome();
        }
    }

    setupCategoryState() {
        this.categoryState = JSON.parse(localStorage.getItem('categoryState') || '{}');
        
        document.querySelectorAll('.nav-category-title').forEach(title => {
            const category = title.textContent;
            const articlesList = title.nextElementSibling;
            articlesList.hidden = !this.categoryState[category];
            
            title.addEventListener('click', () => {
                articlesList.hidden = !articlesList.hidden;
                this.saveCategoryState(category, !articlesList.hidden);
            });
        });
    }

    saveCategoryState(category, isOpen) {
        this.categoryState[category] = isOpen;
        localStorage.setItem('categoryState', JSON.stringify(this.categoryState));
    }

    setupTheme() {
        // 获取存储的主题或使用默认亮色主题
        this.theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // 找到主题切换按钮
        const themeToggle = document.getElementById('theme-toggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                // 切换主题
                this.theme = this.theme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', this.theme);
                localStorage.setItem('theme', this.theme);
            });
        }
    }

    setupNavigation() {
        // 添加导航相关的键盘快捷键
        document.addEventListener('keydown', (e) => {
            // ESC 键返回主页
            if (e.key === 'Escape') {
                this.showHome();
            }
            
            // Ctrl/Cmd + K 聚焦搜索框
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }
        });
        
        // 添加返回顶部按钮功能
        this.setupScrollToTop();
        
        // 添加移动导航菜单功能
        this.setupMobileNavigation();
    }
    
    setupScrollToTop() {
        // 检查是否已存在返回顶部按钮
        let scrollTopButton = document.querySelector('.scroll-top');
        
        // 如果不存在，创建返回顶部按钮
        if (!scrollTopButton) {
            scrollTopButton = document.createElement('button');
            scrollTopButton.className = 'scroll-top';
            scrollTopButton.setAttribute('aria-label', '返回顶部');
            scrollTopButton.innerHTML = '<i class="bx bx-chevron-up"></i>';
            document.body.appendChild(scrollTopButton);
        }
        
        // 处理滚动事件，控制按钮显示/隐藏
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopButton.classList.add('show');
            } else {
                scrollTopButton.classList.remove('show');
            }
        });
        
        // 添加点击事件处理
        scrollTopButton.addEventListener('click', () => {
            // 平滑滚动到顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    setupMobileNavigation() {
        // 检查是否已存在移动菜单按钮
        let mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        
        // 如果不存在，创建移动菜单按钮
        if (!mobileMenuToggle) {
            mobileMenuToggle = document.createElement('button');
            mobileMenuToggle.className = 'mobile-menu-toggle';
            mobileMenuToggle.setAttribute('aria-label', '菜单');
            mobileMenuToggle.innerHTML = `
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            `;
            document.body.appendChild(mobileMenuToggle);
        }
        
        // 获取侧边栏元素
        const sidebar = document.querySelector('.sidebar');
        
        // 添加点击事件处理
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            sidebar.classList.toggle('active');
            
            // 禁用/启用内容滚动
            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // 点击侧边栏链接后关闭菜单
        const sidebarLinks = sidebar.querySelectorAll('a, .nav-article-item');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                sidebar.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // 点击侧边栏外部关闭菜单
        document.addEventListener('click', (event) => {
            if (sidebar.classList.contains('active') && 
                !sidebar.contains(event.target) && 
                !mobileMenuToggle.contains(event.target)) {
                    
                mobileMenuToggle.classList.remove('active');
                sidebar.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const headerSearchInput = document.getElementById('header-search-input');
        const headerSearchResults = document.getElementById('header-search-results');
        let debounceTimer;

        // 确保初始状态下搜索结果区域是隐藏的
        if (searchResults) searchResults.innerHTML = '';
        if (headerSearchResults) headerSearchResults.innerHTML = '';
        
        // 添加样式确保搜索结果区域默认隐藏
        if (headerSearchResults) headerSearchResults.style.display = 'none';
        if (searchResults) searchResults.style.display = 'none';

        // 通用搜索处理函数
        const handleSearch = (input, resultsContainer) => {
            clearTimeout(debounceTimer);
            const query = input.value.trim();
            
            // 清空搜索结果
            if (!query) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }

            // 延迟执行搜索
            debounceTimer = setTimeout(() => {
                console.log('执行搜索:', query); // 添加调试日志
                const results = this.searchEngine.search(query);
                console.log('搜索结果:', results); // 添加调试日志
                this.renderSearchResults(results, resultsContainer);
                // 确保搜索结果区域可见
                resultsContainer.style.display = 'block';
            }, 200);
        };

        // 通用键盘事件处理函数
        const handleKeydown = (e, input, resultsContainer) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                input.value = '';
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                input.blur();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const firstResult = resultsContainer.querySelector('.search-result-item');
                if (firstResult) {
                    this.loadArticle(
                        firstResult.dataset.slug,
                        firstResult.dataset.category
                    );
                    resultsContainer.innerHTML = '';
                    resultsContainer.style.display = 'none';
                    input.value = '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const firstResult = resultsContainer.querySelector('.search-result-item');
                if (firstResult) {
                    firstResult.focus();
                }
            }
        };

        // 侧边栏搜索框
        if (searchInput) {
            searchInput.addEventListener('input', (e) => handleSearch(searchInput, searchResults));
            searchInput.addEventListener('keydown', (e) => handleKeydown(e, searchInput, searchResults));
            searchInput.placeholder = this.t('search.placeholder');
        }

        // 主页搜索框
        if (headerSearchInput) {
            headerSearchInput.addEventListener('input', (e) => handleSearch(headerSearchInput, headerSearchResults));
            headerSearchInput.addEventListener('keydown', (e) => handleKeydown(e, headerSearchInput, headerSearchResults));
            headerSearchInput.placeholder = this.t('search.placeholder');
        }

        // 点击搜索结果外部时关闭搜索结果
        document.addEventListener('click', (e) => {
            // 检查是否点击了搜索框或搜索结果区域
            const isSearchInputClick = searchInput && (searchInput.contains(e.target) || e.target === searchInput);
            const isHeaderSearchInputClick = headerSearchInput && (headerSearchInput.contains(e.target) || e.target === headerSearchInput);
            const isSearchResultsClick = searchResults && searchResults.contains(e.target);
            const isHeaderSearchResultsClick = headerSearchResults && headerSearchResults.contains(e.target);
            
            // 如果点击了搜索框或搜索结果区域以外的地方，关闭搜索结果
            if (!isSearchInputClick && !isHeaderSearchInputClick && !isSearchResultsClick && !isHeaderSearchResultsClick) {
                if (searchResults) {
                    searchResults.innerHTML = '';
                    searchResults.style.display = 'none';
                }
                if (headerSearchResults) {
                    headerSearchResults.innerHTML = '';
                    headerSearchResults.style.display = 'none';
                }
            }
        });

        // 标签点击事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag')) {
                e.preventDefault();
                e.stopPropagation();
                const tag = e.target.textContent;
                console.log('点击标签:', tag); // 添加调试日志
                const results = this.searchEngine.searchByTag(tag);
                console.log('标签搜索结果:', results); // 添加调试日志
                
                // 如果在主页，切换到文章页面并显示搜索结果
                if (document.querySelector('.home-container').classList.contains('hidden') === false) {
                    document.querySelector('.home-container').classList.add('hidden');
                    document.querySelector('.container').classList.remove('hidden');
                }
                
                if (searchInput) {
                    searchInput.value = `#${tag}`;
                    searchInput.focus();
                    this.renderSearchResults(results, searchResults);
                    searchResults.style.display = 'block';
                }
            }
        });
    }

    renderSearchResults(results, container) {
        if (!container) container = document.getElementById('search-results');
        
        if (results.length === 0) {
            container.innerHTML = `<div class="search-results-inner"><div class="no-results">${this.t('search.noResults')}</div></div>`;
            container.style.display = 'block'; // 显示"无结果"提示
            return;
        }

        console.log('渲染搜索结果:', results); // 添加调试日志

        // 创建内部容器用于滚动
        const innerHtml = results.map(result => `
            <div class="search-result-item" data-slug="${result.slug}" data-category="${result.category}" tabindex="0">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-meta">
                    <span class="search-result-category">${result.category}</span>
                    ${result.date ? `<span class="search-result-date">${result.date}</span>` : ''}
                </div>
            </div>
        `).join('');

        // 使用内部容器包装搜索结果
        container.innerHTML = `<div class="search-results-inner">${innerHtml}</div>`;
        container.style.display = 'block'; // 确保搜索结果可见

        // 添加搜索结果点击事件
        const searchResultItems = container.querySelectorAll('.search-result-item');
        searchResultItems.forEach(item => {
            item.addEventListener('click', () => {
                const slug = item.dataset.slug;
                const category = item.dataset.category;
                
                // 如果在主页，切换到文章页面
                if (document.querySelector('.home-container').classList.contains('hidden') === false) {
                    document.querySelector('.home-container').classList.add('hidden');
                    document.querySelector('.container').classList.remove('hidden');
                }
                
                this.loadArticle(slug, category);
                container.innerHTML = '';
                container.style.display = 'none';
                
                // 清空搜索框
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                
                const headerSearchInput = document.getElementById('header-search-input');
                if (headerSearchInput) headerSearchInput.value = '';
            });

            // 键盘导航
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    item.click();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextItem = item.nextElementSibling;
                    if (nextItem) nextItem.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevItem = item.previousElementSibling;
                    if (prevItem) {
                        prevItem.focus();
                    } else {
                        // 返回到搜索框
                        if (container.id === 'search-results') {
                            document.getElementById('search-input').focus();
                        } else if (container.id === 'header-search-results') {
                            document.getElementById('header-search-input').focus();
                        }
                    }
                }
            });
        });
    }

    reloadCurrentArticle() {
        if (this.currentArticle) {
            this.loadArticle(this.currentArticle.slug, this.currentArticle.category);
        }
    }

    updatePageTitle() {
        document.title = this.t('siteTitle');
        document.querySelector('.site-title').textContent = this.t('siteTitle');
        document.querySelector('.sidebar-title').textContent = this.t('siteTitle');
    }

    async showCategoryPage(categoryName) {
        console.log('显示分类页面:', categoryName); // 添加调试日志
        
        // 确保容器可见性正确设置
        const container = document.querySelector('.container');
        const homeContainer = document.querySelector('.home-container');
        const articleContent = document.getElementById('article-content');
        const articleList = document.getElementById('article-list');
        
        if (!container || !homeContainer || !articleContent || !articleList) {
            console.error('找不到必要的DOM元素');
            return;
        }
        
        // 设置显示状态
        container.classList.remove('hidden');
        homeContainer.classList.add('hidden');
        articleContent.classList.add('hidden');
        articleList.classList.remove('hidden');
        
        // 查找对应的分类
        const category = this.categories.find(cat => cat.name === categoryName);
        if (!category) {
            console.error('找不到分类:', categoryName);
            articleList.innerHTML = `
                <div class="error-message">
                    <h2>找不到分类</h2>
                    <p>无法找到分类: ${categoryName}</p>
                </div>
            `;
            return;
        }
        
        console.log('找到分类:', category); // 添加调试日志
        
        // 显示加载中状态
        articleList.innerHTML = `
            <div class="loading">
                <div class="loader"></div>
                <p>${this.t('loading.category')}</p>
            </div>
        `;
        
        try {
            // 渲染分类页面
            const articlesHTML = await Promise.all(category.articles.map(async article => {
                const title = await this.getArticleTitle(article, categoryName);
                return `
                    <div class="article-item" data-slug="${article.slug}" data-category="${categoryName}">
                        <h3 class="article-title">${title}</h3>
                        ${article.date ? `<div class="article-date">${article.date}</div>` : ''}
                        ${article.tags && article.tags.length ? `
                            <div class="article-tags">
                                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }));
            
            // 更新页面内容
            articleList.innerHTML = `
                <h1 class="category-page-title">${categoryName}</h1>
                <div class="article-list">
                    ${articlesHTML.join('')}
                </div>
            `;
            
            // 添加文章点击事件
            articleList.querySelectorAll('.article-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.loadArticle(item.dataset.slug, item.dataset.category);
                });
            });
            
            // 更新URL（使用replaceState避免触发新的hashchange事件）
            const newHash = `#${categoryName}`;
            if (window.location.hash !== newHash) {
                history.replaceState(null, null, newHash);
            }
            
        } catch (error) {
            console.error('渲染分类页面失败:', error);
            articleList.innerHTML = `
                <div class="error-message">
                    <h2>加载失败</h2>
                    <p>无法加载分类内容</p>
                    <p>错误信息: ${error.message}</p>
                </div>
            `;
        }
    }
}

// 初始化应用
new FAQApp();

// 移动端增强功能
function setupMobileEnhancements() {
    // 移动端底部导航逻辑
    const mobileSearchBtn = document.getElementById('mobile-search-btn');
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');
    
    // 移动搜索按钮
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', function() {
            // 聚焦到顶部搜索框
            const searchInput = document.getElementById('header-search-input');
            if (searchInput) {
                searchInput.focus();
                // 滚动到顶部
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // 移动端主题切换按钮
    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', function() {
            toggleTheme();
        });
    }
    
    // 移动端菜单提示 - 只在首次访问显示
    if (!localStorage.getItem('menuHintShown')) {
        const menuHint = document.getElementById('mobile-menu-hint');
        if (menuHint) {
            menuHint.style.display = 'block';
            
            // 点击任何地方移除提示
            document.addEventListener('click', function hideHint() {
                menuHint.style.display = 'none';
                localStorage.setItem('menuHintShown', 'true');
                document.removeEventListener('click', hideHint);
            });
            
            // 5秒后自动隐藏
            setTimeout(() => {
                menuHint.style.display = 'none';
                localStorage.setItem('menuHintShown', 'true');
            }, 5000);
        }
    } else {
        // 已经显示过，直接隐藏
        const menuHint = document.getElementById('mobile-menu-hint');
        if (menuHint) {
            menuHint.style.display = 'none';
        }
    }
    
    // 移动端滑动指示器 - 仅在文章页面显示且首次访问
    const swipeIndicator = document.getElementById('mobile-swipe-indicator');
    if (swipeIndicator) {
        if (window.location.hash && !localStorage.getItem('swipeHintShown')) {
            swipeIndicator.style.display = 'block';
            localStorage.setItem('swipeHintShown', 'true');
            
            // 点击关闭
            swipeIndicator.addEventListener('click', function() {
                swipeIndicator.style.display = 'none';
            });
            
            // 5秒后自动隐藏
            setTimeout(() => {
                swipeIndicator.style.display = 'none';
            }, 5000);
        } else {
            swipeIndicator.style.display = 'none';
        }
    }
    
    // 检测设备是否为移动设备
    const isMobile = window.innerWidth <= 768;
    
    // 如果是移动设备，处理某些特殊的样式和行为
    if (isMobile) {
        // 处理溢出的大型表格，添加滚动提示
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (table.offsetWidth > window.innerWidth) {
                const tableWrapper = document.createElement('div');
                tableWrapper.className = 'table-wrapper';
                tableWrapper.style.position = 'relative';
                tableWrapper.style.width = '100%';
                tableWrapper.style.overflowX = 'auto';
                tableWrapper.style.webkitOverflowScrolling = 'touch';
                
                // 添加水平滚动提示
                const scrollHint = document.createElement('div');
                scrollHint.className = 'scroll-hint';
                scrollHint.textContent = '← 左右滑动查看更多 →';
                scrollHint.style.position = 'absolute';
                scrollHint.style.bottom = '0';
                scrollHint.style.left = '50%';
                scrollHint.style.transform = 'translateX(-50%)';
                scrollHint.style.backgroundColor = 'rgba(0,0,0,0.7)';
                scrollHint.style.color = 'white';
                scrollHint.style.padding = '5px 10px';
                scrollHint.style.borderRadius = '4px';
                scrollHint.style.fontSize = '0.8rem';
                scrollHint.style.pointerEvents = 'none';
                scrollHint.style.opacity = '0.8';
                scrollHint.style.zIndex = '10';
                
                // 包装表格
                table.parentNode.insertBefore(tableWrapper, table);
                tableWrapper.appendChild(table);
                tableWrapper.appendChild(scrollHint);
                
                // 滚动时隐藏提示
                tableWrapper.addEventListener('scroll', function() {
                    scrollHint.style.opacity = '0';
                    setTimeout(() => {
                        scrollHint.style.display = 'none';
                    }, 300);
                });
            }
        });
        
        // 处理代码块的滚动
        const codeBlocks = document.querySelectorAll('pre');
        codeBlocks.forEach(block => {
            if (block.offsetWidth > window.innerWidth) {
                block.style.position = 'relative';
                
                // 添加滚动提示
                const scrollHint = document.createElement('div');
                scrollHint.className = 'scroll-hint';
                scrollHint.textContent = '← 左右滑动查看更多 →';
                scrollHint.style.position = 'absolute';
                scrollHint.style.top = '0';
                scrollHint.style.right = '0';
                scrollHint.style.backgroundColor = 'rgba(0,0,0,0.7)';
                scrollHint.style.color = 'white';
                scrollHint.style.padding = '3px 8px';
                scrollHint.style.borderRadius = '0 0 0 4px';
                scrollHint.style.fontSize = '0.75rem';
                scrollHint.style.pointerEvents = 'none';
                
                block.appendChild(scrollHint);
                
                // 滚动时隐藏提示
                block.addEventListener('scroll', function() {
                    scrollHint.style.opacity = '0';
                    setTimeout(() => {
                        scrollHint.style.display = 'none';
                    }, 300);
                });
            }
        });
        
        // 优化导航栏在滚动时的行为（隐藏/显示）
        let lastScrollTop = 0;
        const bottomNav = document.getElementById('mobile-bottom-nav');
        
        if (bottomNav) {
            window.addEventListener('scroll', function() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // 向下滚动且超过100px，隐藏底部导航
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    bottomNav.style.transform = 'translateY(100%)';
                } else {
                    // 向上滚动或在顶部附近，显示底部导航
                    bottomNav.style.transform = 'translateY(0)';
                }
                
                lastScrollTop = scrollTop;
            });
        }
    }
}

// 在文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
    
    // 主题切换按钮事件
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // 设置移动端增强功能
    setupMobileEnhancements();
});

// 主题切换功能
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新底部导航图标显示
    updateThemeIcons(newTheme);
}

// 更新主题图标显示
function updateThemeIcons(theme) {
    const isDark = theme === 'dark';
    const lightIcons = document.querySelectorAll('.light-icon');
    const darkIcons = document.querySelectorAll('.dark-icon');
    
    lightIcons.forEach(icon => {
        icon.style.display = isDark ? 'block' : 'none';
    });
    
    darkIcons.forEach(icon => {
        icon.style.display = isDark ? 'none' : 'block';
    });
} 