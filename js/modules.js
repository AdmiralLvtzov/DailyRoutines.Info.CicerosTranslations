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
            // 检测当前路径是否在modules子目录中
            const basePath = window.location.pathname.includes('/modules/') ? '../' : '';
            const response = await fetch(`${basePath}assets/${ModuleConfig.languageFiles[language]}`);
            const data = await response.json();
            initAuthorOptions(data);
            return data;
        } catch (error) {
            console.error(`Error loading ${language} modules:`, error);
            if (language !== 'zh-CN') {
                return loadModulesData('zh-CN');
            }
            return {};
        }
    }

    // 渲染模块列表
    function renderModules(data) {
        modulesList.innerHTML = '';
        Object.entries(data).forEach(([key, module]) => {
            const moduleCard = createModuleCard(key, module);
            modulesList.appendChild(moduleCard);
        });
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
        
        modulesList.innerHTML = '';
        filteredData.forEach(([key, module]) => {
            const moduleCard = createModuleCard(key, module);
            modulesList.appendChild(moduleCard);
        });

        // 更新模块计数
        moduleCount.textContent = filteredData.length;
    }

    // 切换语言
    async function changeLanguage(language) {
        currentLanguage = language;
        modulesData = await loadModulesData(language);
        renderModules(modulesData);
        moduleCount.textContent = Object.keys(modulesData).length;
    }

    // 初始化
    async function init() {
        initCategoryOptions();
        modulesData = await loadModulesData(currentLanguage);
        renderModules(modulesData);
        moduleCount.textContent = Object.keys(modulesData).length;
    }

    // 添加事件监听器
    searchInput.addEventListener('input', filterModules);
    categoryFilter.addEventListener('change', filterModules);
    permissionFilter.addEventListener('change', filterModules);
    authorFilter.addEventListener('change', filterModules);
    languageSelector.addEventListener('change', (e) => changeLanguage(e.target.value));

    // 初始化页面
    init();
}); 