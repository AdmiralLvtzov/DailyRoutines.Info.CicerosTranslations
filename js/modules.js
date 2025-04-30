document.addEventListener('DOMContentLoaded', () => {
    let modulesData = {};
    let currentLanguage = 'zh-CN';
    const modulesList = document.getElementById('modulesList');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const permissionFilter = document.getElementById('permissionFilter');
    const authorFilter = document.getElementById('authorFilter');
    const languageSelector = document.getElementById('language-selector');
    const moduleCount = document.getElementById('moduleCount');
    const filtersContainer = document.getElementById('filtersContainer');
    
    // 搜索延迟处理
    let searchTimeout = null;
    const SEARCH_DELAY = 300; // 300毫秒延迟
    
    // 懒加载配置
    const INITIAL_LOAD_COUNT = 20; // 初始加载20个模块
    const BATCH_LOAD_COUNT = 30; // 后续每批加载30个模块
    let allModulesEntries = []; // 存储所有模块数据
    let renderedCount = 0; // 已渲染的模块数量
    let isFiltering = false; // 是否正在筛选
    let lastScrollPosition = 0; // 记录上次滚动位置
    let isScrollingDown = false; // 是否正在向下滚动
    let loadingMoreModules = false; // 是否正在加载更多模块
    
    // 优化滚动加载触发条件
    const SCROLL_TRIGGER_OFFSET = 800; // 提前800px触发加载

    // 初始化分类选项
    function initCategoryOptions() {
        categoryFilter.innerHTML = '<option value="">所有分类</option>';
        Object.entries(ModuleConfig.categories).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            categoryFilter.appendChild(option);
        });
    }

    // 初始化作者选项
    function initAuthorOptions(data) {
        const authors = new Set();
        Object.values(data).forEach(module => {
            module.Author.forEach(author => authors.add(author));
        });
        
        authorFilter.innerHTML = '<option value="">所有作者</option>';
        Array.from(authors).sort().forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            authorFilter.appendChild(option);
        });
    }

    // 加载模块数据
    async function loadModulesData(language) {
        try {
            // 显示加载提示
            showLoadingIndicator();
            
            // 检测当前路径是否在modules子目录中
            const basePath = window.location.pathname.includes('/modules/') ? '../' : '';
            const response = await fetch(`${basePath}assets/${ModuleConfig.languageFiles[language]}`);
            const data = await response.json();
            
            // 加载完成后隐藏加载提示
            hideLoadingIndicator();
            
            initAuthorOptions(data);
            return data;
        } catch (error) {
            console.error(`Error loading ${language} modules:`, error);
            if (language !== 'zh-CN') {
                return loadModulesData('zh-CN');
            }
            hideLoadingIndicator();
            return {};
        }
    }
    
    // 显示加载指示器
    function showLoadingIndicator() {
        // 检查是否已存在加载指示器
        if (!document.getElementById('loadingIndicator')) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loadingIndicator';
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div><p>加载模块中...</p>';
            modulesList.appendChild(loadingIndicator);
        }
    }
    
    // 隐藏加载指示器
    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // 渲染模块列表（懒加载方式）
    function renderModules(data) {
        // 重置模块列表
        modulesList.innerHTML = '';
        allModulesEntries = Object.entries(data);
        renderedCount = 0;
        
        // 更新模块计数
        moduleCount.textContent = allModulesEntries.length;
        
        // 初始批量加载
        loadMoreModules();
        
        // 添加滚动监听
        addScrollListener();
    }
    
    // 加载更多模块
    function loadMoreModules() {
        // 如果正在加载，则不重复加载
        if (loadingMoreModules) return;
        
        loadingMoreModules = true;
        
        // 确定要加载的数量
        const batchCount = renderedCount === 0 ? INITIAL_LOAD_COUNT : BATCH_LOAD_COUNT;
        const remainingEntries = allModulesEntries.slice(renderedCount, renderedCount + batchCount);
        
        if (remainingEntries.length === 0) {
            loadingMoreModules = false;
            return;
        }
        
        // 创建加载状态指示器
        const loadingMoreIndicator = document.createElement('div');
        loadingMoreIndicator.className = 'loading-more-indicator';
        loadingMoreIndicator.innerHTML = '<div class="spinner-small"></div><p>加载更多模块...</p>';
        loadingMoreIndicator.style.gridColumn = '1 / -1';
        modulesList.appendChild(loadingMoreIndicator);
        
        // 使用setTimeout增加小延迟，确保UI可以更新
        setTimeout(() => {
            // 创建文档片段，提高性能
            const fragment = document.createDocumentFragment();
            
            // 渲染批次模块
            remainingEntries.forEach(([key, module]) => {
                const moduleCard = createModuleCard(key, module);
                fragment.appendChild(moduleCard);
            });
            
            // 移除加载更多指示器
            if (loadingMoreIndicator.parentNode) {
                loadingMoreIndicator.remove();
            }
            
            // 一次性添加到DOM
            modulesList.appendChild(fragment);
            
            // 更新已渲染计数
            renderedCount += remainingEntries.length;
            
            // 重置加载状态
            loadingMoreModules = false;
            
            // 如果视窗高度大于内容，继续加载
            checkIfMoreContentNeeded();
        }, 50);
    }
    
    // 检查是否需要继续加载更多内容（当屏幕未填满时）
    function checkIfMoreContentNeeded() {
        // 如果已加载全部内容，不需要继续加载
        if (renderedCount >= allModulesEntries.length) return;
        
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPosition = window.scrollY;
        
        // 更激进的加载触发条件
        // 如果内容高度不足以填满视窗+1000px，或者滚动位置已经超过一半，就加载更多
        if ((documentHeight < windowHeight + 1000) || 
            (scrollPosition > documentHeight / 2)) {
            loadMoreModules();
        }
    }
    
    // 添加滚动监听
    function addScrollListener() {
        // 移除已有的滚动监听器，避免重复添加
        window.removeEventListener('scroll', handleScroll);
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // 初始检查是否需要加载更多
        handleScroll();
    }
    
    // 处理滚动事件（使用节流，避免过于频繁触发）
    const handleScroll = throttle(function() {
        // 处理筛选容器的显示/隐藏
        const currentScrollPosition = window.scrollY;
        
        // 获取最新的筛选容器元素（防止DOM变化导致的引用失效）
        const currentFiltersContainer = document.getElementById('filtersContainer');
        
        // 确定滚动方向
        isScrollingDown = currentScrollPosition > lastScrollPosition;
        
        // 当向下滚动超过阈值时，强制隐藏筛选容器
        if (currentFiltersContainer) {
            if (currentScrollPosition > 100) { // 降低触发阈值，更容易隐藏
                currentFiltersContainer.classList.add('filters-hidden');
            } else {
                currentFiltersContainer.classList.remove('filters-hidden');
            }
        }
        
        lastScrollPosition = currentScrollPosition;
        
        // 如果正在筛选或已加载全部模块，不触发懒加载
        if (isFiltering || renderedCount >= allModulesEntries.length) return;
        
        // 计算滚动位置
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 提前触发加载，优化体验 - 降低加载触发条件
        const remainingHeight = documentHeight - (currentScrollPosition + windowHeight);
        
        // 当剩余不足1000px或滚动超过70%时加载更多
        if (remainingHeight < 1000 || (currentScrollPosition / (documentHeight - windowHeight) > 0.7)) {
            loadMoreModules();
        }
    }, 100); // 100毫秒的节流时间
    
    // 节流函数，控制函数执行频率
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 创建模块卡片
    function createModuleCard(key, module) {
        const card = document.createElement('div');
        card.className = 'module-card';
        
        // 设置卡片的动画延迟索引
        card.style.setProperty('--index', modulesList.children.length);
        
        const title = document.createElement('h2');
        title.className = 'module-title';
        title.textContent = module.Title;
        
        const description = document.createElement('p');
        description.className = 'module-description';
        description.textContent = module.Description;
        
        const meta = document.createElement('div');
        meta.className = 'module-meta';
        
        // 添加分类标签
        const categoryTag = document.createElement('span');
        categoryTag.className = 'module-tag';
        categoryTag.textContent = ModuleConfig.categories[module.Category] || '未知分类';
        categoryTag.addEventListener('click', () => {
            categoryFilter.value = module.Category;
            filterModules();
        });
        
        // 添加权限标签
        if (module.CNPremium) {
            const premiumTag = document.createElement('span');
            premiumTag.className = 'module-tag premium';
            premiumTag.textContent = ModuleConfig.permissionTypes.CNPremium;
            premiumTag.addEventListener('click', () => {
                permissionFilter.value = 'CNPremium';
                filterModules();
            });
            meta.appendChild(premiumTag);
        } else if (module.GlobalPremium) {
            const premiumTag = document.createElement('span');
            premiumTag.className = 'module-tag premium';
            premiumTag.textContent = ModuleConfig.permissionTypes.GlobalPremium;
            premiumTag.addEventListener('click', () => {
                permissionFilter.value = 'GlobalPremium';
                filterModules();
            });
            meta.appendChild(premiumTag);
        }
        
        if (module.NeedAuth) {
            const authTag = document.createElement('span');
            authTag.className = 'module-tag auth';
            authTag.textContent = ModuleConfig.permissionTypes.NeedAuth;
            authTag.addEventListener('click', () => {
                permissionFilter.value = 'NeedAuth';
                filterModules();
            });
            meta.appendChild(authTag);
        }
        
        // 添加国服标签
        if (module.CNOnly) {
            const cnTag = document.createElement('span');
            cnTag.className = 'module-tag cn-only';
            cnTag.textContent = '国服特供';
            meta.appendChild(cnTag);
        }
        
        meta.appendChild(categoryTag);
        
        // 添加作者信息
        const authorInfo = document.createElement('div');
        authorInfo.className = 'module-author';
        const authorIcon = document.createElement('i');
        authorIcon.className = 'bx bx-user';
        authorInfo.appendChild(authorIcon);
        
        module.Author.forEach((author, index) => {
            const authorSpan = document.createElement('span');
            authorSpan.className = 'module-author-name';
            authorSpan.textContent = author;
            authorSpan.addEventListener('click', () => {
                authorFilter.value = author;
                filterModules();
            });
            
            authorInfo.appendChild(authorSpan);
            if (index < module.Author.length - 1) {
                authorInfo.appendChild(document.createTextNode(', '));
            }
        });
        
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(meta);
        card.appendChild(authorInfo);
        
        return card;
    }

    // 筛选模块
    function filterModules() {
        isFiltering = true;
        
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedPermission = permissionFilter.value;
        const selectedAuthor = authorFilter.value;
        
        const filteredData = Object.entries(modulesData).filter(([key, module]) => {
            const matchesSearch = module.Title.toLowerCase().includes(searchTerm) ||
                                module.Description.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || module.Category.toString() === selectedCategory;
            const matchesAuthor = !selectedAuthor || module.Author.includes(selectedAuthor);
            
            let matchesPermission = true;
            if (selectedPermission === 'CNPremium') {
                matchesPermission = module.CNPremium;
            } else if (selectedPermission === 'GlobalPremium') {
                matchesPermission = module.GlobalPremium;
            } else if (selectedPermission === 'NeedAuth') {
                matchesPermission = module.NeedAuth;
            } else if (selectedPermission === 'none') {
                matchesPermission = !module.CNPremium && !module.GlobalPremium && !module.NeedAuth;
            }
            
            return matchesSearch && matchesCategory && matchesPermission && matchesAuthor;
        });
        
        // 更新模块显示
        modulesList.innerHTML = '';
        allModulesEntries = filteredData;
        renderedCount = 0;
        loadingMoreModules = false; // 重置加载状态
        
        // 更新模块计数
        moduleCount.textContent = filteredData.length;
        
        // 检测是否有任何筛选
        const hasFilters = searchTerm || selectedCategory || selectedPermission || selectedAuthor;
        
        // 直接加载筛选后的模块（如果少于100个则一次性加载，否则使用懒加载）
        if (filteredData.length <= 100) {
            filteredData.forEach(([key, module]) => {
                const moduleCard = createModuleCard(key, module);
                modulesList.appendChild(moduleCard);
            });
            renderedCount = filteredData.length;
        } else {
            loadMoreModules();
        }
        
        // 无论是否有筛选结果，都重新添加滚动监听器
        addScrollListener();
        
        // 搜索结果更新后自动滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        isFiltering = false;
        
        // 检查是否需要加载更多内容
        setTimeout(checkIfMoreContentNeeded, 300);
    }
    
    // 处理搜索输入
    function handleSearchInput() {
        // 清除之前的定时器
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // 设置新的定时器，延迟执行筛选
        searchTimeout = setTimeout(() => {
            filterModules();
        }, SEARCH_DELAY);
    }
    
    // 检查是否需要重置筛选
    function checkAndResetFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedPermission = permissionFilter.value;
        const selectedAuthor = authorFilter.value;
        
        // 如果所有筛选都被清除，重新加载全部模块
        if (!searchTerm && !selectedCategory && !selectedPermission && !selectedAuthor) {
            renderModules(modulesData);
        }
    }

    // 切换语言
    async function changeLanguage(language) {
        currentLanguage = language;
        modulesData = await loadModulesData(language);
        renderModules(modulesData);
    }

    // 初始化
    async function init() {
        initCategoryOptions();
        
        // 显示加载中状态
        showLoadingIndicator();
        
        // 异步加载模块数据
        modulesData = await loadModulesData(currentLanguage);
        renderModules(modulesData);
        
        // 添加窗口大小改变监听，以便在窗口大小变化时检查是否需要更多内容
        window.addEventListener('resize', throttle(checkIfMoreContentNeeded, 200), { passive: true });
        
        // 立即执行一次检查，确保初始内容填满页面
        setTimeout(checkIfMoreContentNeeded, 500);
        
        // 每3秒检查一次是否需要加载更多内容，防止极端情况下的加载失败
        setInterval(checkIfMoreContentNeeded, 3000);
    }

    // 添加事件监听器
    searchInput.addEventListener('input', handleSearchInput);
    categoryFilter.addEventListener('change', () => {
        filterModules();
        checkAndResetFilters();
    });
    permissionFilter.addEventListener('change', () => {
        filterModules();
        checkAndResetFilters();
    });
    authorFilter.addEventListener('change', () => {
        filterModules();
        checkAndResetFilters();
    });
    languageSelector.addEventListener('change', (e) => changeLanguage(e.target.value));

    // 初始化页面
    init();
}); 