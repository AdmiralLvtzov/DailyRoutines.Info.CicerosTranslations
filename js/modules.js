document.addEventListener('DOMContentLoaded', () => {
    let modulesData = {};
    let currentLanguage = 'zh-CN';
    const modulesList = document.getElementById('modulesList');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const permissionFilter = document.getElementById('permissionFilter');
    const languageSelector = document.getElementById('language-selector');

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

    // 加载模块数据
    async function loadModulesData(language) {
        try {
            const response = await fetch(`assets/${ModuleConfig.languageFiles[language]}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error loading ${language} modules:`, error);
            // 如果加载失败，尝试加载中文数据作为后备
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
        
        // 添加权限标签
        if (module.CNPremium) {
            const premiumTag = document.createElement('span');
            premiumTag.className = 'module-tag premium';
            premiumTag.textContent = ModuleConfig.permissionTypes.CNPremium;
            meta.appendChild(premiumTag);
        } else if (module.GlobalPremium) {
            const premiumTag = document.createElement('span');
            premiumTag.className = 'module-tag premium';
            premiumTag.textContent = ModuleConfig.permissionTypes.GlobalPremium;
            meta.appendChild(premiumTag);
        }
        
        if (module.NeedAuth) {
            const authTag = document.createElement('span');
            authTag.className = 'module-tag auth';
            authTag.textContent = ModuleConfig.permissionTypes.NeedAuth;
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
        authorInfo.innerHTML = `<i class='bx bx-user'></i> ${module.Author.join(', ')}`;
        
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
        
        const filteredData = Object.entries(modulesData).filter(([key, module]) => {
            const matchesSearch = module.Title.toLowerCase().includes(searchTerm) ||
                                module.Description.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || module.Category.toString() === selectedCategory;
            
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
            
            return matchesSearch && matchesCategory && matchesPermission;
        });
        
        modulesList.innerHTML = '';
        filteredData.forEach(([key, module]) => {
            const moduleCard = createModuleCard(key, module);
            modulesList.appendChild(moduleCard);
        });
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
        modulesData = await loadModulesData(currentLanguage);
        renderModules(modulesData);
    }

    // 添加事件监听器
    searchInput.addEventListener('input', filterModules);
    categoryFilter.addEventListener('change', filterModules);
    permissionFilter.addEventListener('change', filterModules);
    languageSelector.addEventListener('change', (e) => changeLanguage(e.target.value));

    // 初始化页面
    init();
}); 