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
    
    // 搜索延迟处理
    let searchTimeout = null;
    const SEARCH_DELAY = 300; // 300毫秒延迟
    
    // 懒加载配置
    const INITIAL_LOAD_COUNT = 30; // 增加初始加载数量到30个
    const BATCH_LOAD_COUNT = 40; // 增加批量加载数量到40个
    let allModulesEntries = []; // 存储所有模块数据
    let renderedCount = 0; // 已渲染的模块数量
    let isFiltering = false; // 是否正在筛选
    let loadingMoreModules = false; // 是否正在加载更多模块
    let fastScrollDetected = false; // 检测快速滚动
    let lastScrollY = 0; // 上一次滚动位置
    let scrollSpeed = 0; // 滚动速度

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
    
    // 预先加载下一批模块（但不立即显示）
    let preloadedBatch = null;
    function preloadNextBatch() {
        if (preloadedBatch !== null || renderedCount >= allModulesEntries.length) return;
        
        const startIndex = renderedCount;
        const endIndex = Math.min(startIndex + BATCH_LOAD_COUNT, allModulesEntries.length);
        const nextEntries = allModulesEntries.slice(startIndex, endIndex);
        
        // 预先创建下一批模块卡片，但不添加到DOM
        preloadedBatch = document.createDocumentFragment();
        nextEntries.forEach(([key, module]) => {
            const moduleCard = createModuleCard(key, module);
            preloadedBatch.appendChild(moduleCard);
        });
    }
    
    // 加载更多模块
    function loadMoreModules() {
        // 如果正在加载，则不重复加载
        if (loadingMoreModules) return;
        
        loadingMoreModules = true;
        
        // 如果已预加载下一批，直接使用
        if (preloadedBatch !== null) {
            const count = preloadedBatch.children.length;
            modulesList.appendChild(preloadedBatch);
            renderedCount += count;
            preloadedBatch = null;
            loadingMoreModules = false;
            
            // 立即预加载下一批
            setTimeout(preloadNextBatch, 0);
            
            // 检查是否需要加载更多
            if (fastScrollDetected || shouldLoadAhead()) {
                setTimeout(loadMoreModules, 10);
            }
            return;
        }
        
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
        
        // 立即渲染，不使用延迟
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
        
        // 预加载下一批
        setTimeout(preloadNextBatch, 0);
        
        // 如果检测到快速滚动或需要提前加载，继续加载
        if (fastScrollDetected || shouldLoadAhead()) {
            setTimeout(loadMoreModules, 10);
        } else {
            // 如果视窗高度大于内容，继续加载
            checkIfMoreContentNeeded();
        }
    }
    
    // 判断是否需要提前加载
    function shouldLoadAhead() {
        // 如果已加载全部内容，不需要继续加载
        if (renderedCount >= allModulesEntries.length) return false;
        
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPosition = window.scrollY;
        
        // 如果内容高度小于3个屏幕高度，或者用户已滚动超过60%，就提前加载
        return (documentHeight < windowHeight * 3) || 
               (scrollPosition / (documentHeight - windowHeight) > 0.6);
    }
    
    // 检查是否需要继续加载更多内容（当屏幕未填满时）
    function checkIfMoreContentNeeded() {
        // 如果已加载全部内容，不需要继续加载
        if (renderedCount >= allModulesEntries.length) return;
        
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPosition = window.scrollY;
        
        // 更激进的加载触发条件
        // 如果内容高度不足以填满视窗+1500px，或者滚动位置已经超过一半，就加载更多
        if ((documentHeight < windowHeight + 1500) || 
            (scrollPosition > documentHeight / 3)) { // 改为1/3处就开始加载
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
        const currentScrollY = window.scrollY;
        
        // 计算滚动速度
        scrollSpeed = Math.abs(currentScrollY - lastScrollY);
        fastScrollDetected = scrollSpeed > 100; // 如果一次滚动超过100px，认为是快速滚动
        
        if (fastScrollDetected) {
            // 快速滚动时，主动加载更多内容
            loadMoreModules();
        }
        
        lastScrollY = currentScrollY;
        
        // 如果正在筛选或已加载全部模块，不触发懒加载
        if (isFiltering || renderedCount >= allModulesEntries.length) return;
        
        // 计算滚动位置
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 提前触发加载，优化体验 - 降低加载触发条件
        const remainingHeight = documentHeight - (currentScrollY + windowHeight);
        
        // 当剩余不足1200px或滚动超过60%时加载更多
        if (remainingHeight < 1200 || (currentScrollY / (documentHeight - windowHeight) > 0.6)) {
            loadMoreModules();
        }
    }, 50); // 降低节流时间为50毫秒，提高灵敏度
    
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
        preloadedBatch = null; // 重置预加载批次
        
        // 更新模块计数
        moduleCount.textContent = filteredData.length;
        
        // 检测是否有任何筛选
        const hasFilters = searchTerm || selectedCategory || selectedPermission || selectedAuthor;
        
        // 直接加载筛选后的模块（如果少于150个则一次性加载，否则使用懒加载）
        if (filteredData.length <= 150) {
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
        setTimeout(checkIfMoreContentNeeded, 100);
        
        // 如果有更多内容需要加载，预加载下一批
        if (renderedCount < filteredData.length) {
            setTimeout(preloadNextBatch, 200);
        }
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
        setTimeout(checkIfMoreContentNeeded, 300);
        
        // 预加载下一批内容
        setTimeout(preloadNextBatch, 500);
        
        // 每2秒检查一次是否需要加载更多内容，防止极端情况下的加载失败
        setInterval(checkIfMoreContentNeeded, 2000);
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