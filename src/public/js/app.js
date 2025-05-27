// YouTV 主应用程序
// 全局变量和配置
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '["tyyszy","bfzy","dyttzy","ruyi"]');
let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
let currentSearchResults = [];
let isPasswordVerified = false;

// 常量配置
const SEARCH_HISTORY_KEY = 'searchHistory';
const MAX_HISTORY_ITEMS = 50;
const API_TIMEOUT = 10000;

// 应用初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('YouTV 应用初始化...');

    // 检查密码保护
    checkPasswordProtection();

    // 初始化UI组件
    initializeUI();

    // 设置事件监听器
    setupEventListeners();

    // 设置浏览器历史管理
    setupBrowserHistory();

    // 加载API源
    loadApiSources();

    // 初始化设置
    initializeSettings();

    // 显示免责声明
    showDisclaimer();

    console.log('YouTV 应用初始化完成');
});

// 密码保护检查
function checkPasswordProtection() {
    const passwordHash = window.APP_CONFIG?.PASSWORD_HASH;

    if (passwordHash && passwordHash.trim() !== '') {
        const savedHash = localStorage.getItem('passwordVerified');

        if (savedHash !== passwordHash) {
            showPasswordModal();
            return false;
        } else {
            isPasswordVerified = true;
        }
    } else {
        isPasswordVerified = true;
    }

    return isPasswordVerified;
}

// 显示密码验证模态框
function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const form = document.getElementById('passwordForm');
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');

    modal.classList.remove('hidden');
    input.focus();

    form.onsubmit = async function(e) {
        e.preventDefault();

        const password = input.value.trim();
        if (!password) {
            showPasswordError('请输入密码');
            return;
        }

        try {
            showPasswordLoading(true);
            const hash = await sha256(password);

            if (hash === window.APP_CONFIG.PASSWORD_HASH) {
                localStorage.setItem('passwordVerified', hash);
                isPasswordVerified = true;
                modal.classList.add('hidden');
                hidePasswordError();
                showToast('验证成功', 'success');
            } else {
                showPasswordError('密码错误，请重试');
            }
        } catch (error) {
            showPasswordError('验证失败，请重试');
        } finally {
            showPasswordLoading(false);
        }
    };
}

// 显示密码错误
function showPasswordError(message) {
    const error = document.getElementById('passwordError');
    error.textContent = message;
    error.classList.remove('hidden');
}

// 隐藏密码错误
function hidePasswordError() {
    const error = document.getElementById('passwordError');
    error.classList.add('hidden');
}

// 显示密码加载状态
function showPasswordLoading(show) {
    const text = document.getElementById('passwordSubmitText');
    const loading = document.getElementById('passwordSubmitLoading');

    if (show) {
        text.classList.add('hidden');
        loading.classList.remove('hidden');
    } else {
        text.classList.remove('hidden');
        loading.classList.add('hidden');
    }
}

// SHA256哈希函数
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 初始化UI组件
function initializeUI() {
    // 初始化搜索输入框
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchInput');

    searchInput.addEventListener('input', function() {
        if (this.value.trim()) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    });

    // 初始化标签页
    initializeTabs();

    // 初始化侧边栏
    initializeSidebars();

    // 从URL获取搜索参数
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || getSearchFromPath();

    if (searchQuery) {
        searchInput.value = decodeURIComponent(searchQuery);
        clearBtn.classList.remove('hidden');
        // 延迟执行搜索，确保API源已加载
        setTimeout(() => performSearch(searchQuery), 500);
    }
}

// 从路径获取搜索关键词
function getSearchFromPath() {
    const path = window.location.pathname;
    const match = path.match(/\/s=(.+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// 初始化标签页
function initializeTabs() {
    const homeTab = document.getElementById('homeTab');
    const searchTab = document.getElementById('searchTab');
    const movieTab = document.getElementById('movieTab');
    const tvTab = document.getElementById('tvTab');
    const animeTab = document.getElementById('animeTab');
    const varietyTab = document.getElementById('varietyTab');

    homeTab.addEventListener('click', function() {
        switchTab('home');
    });

    searchTab.addEventListener('click', function() {
        switchTab('search');
    });

    movieTab.addEventListener('click', function() {
        switchTab('category', '电影');
    });

    tvTab.addEventListener('click', function() {
        switchTab('category', '电视剧');
    });

    animeTab.addEventListener('click', function() {
        switchTab('category', '动漫');
    });

    varietyTab.addEventListener('click', function() {
        switchTab('category', '综艺');
    });
}

// 切换标签页
function switchTab(tab, category = null) {
    const homeTab = document.getElementById('homeTab');
    const searchTab = document.getElementById('searchTab');
    const movieTab = document.getElementById('movieTab');
    const tvTab = document.getElementById('tvTab');
    const animeTab = document.getElementById('animeTab');
    const varietyTab = document.getElementById('varietyTab');

    const doubanArea = document.getElementById('doubanArea');
    const trendingArea = document.getElementById('trendingArea');
    const resultsArea = document.getElementById('resultsArea');
    const categoryArea = document.getElementById('categoryArea');

    // 重置所有标签样式
    const tabs = [homeTab, searchTab, movieTab, tvTab, animeTab, varietyTab];
    tabs.forEach(tabEl => {
        if (tabEl) {
            tabEl.classList.remove('active', 'border-blue-500', 'text-blue-400');
            tabEl.classList.add('border-transparent', 'text-gray-400');
        }
    });

    // 隐藏所有区域
    doubanArea.classList.add('hidden');
    trendingArea.classList.add('hidden');
    resultsArea.classList.add('hidden');
    categoryArea.classList.add('hidden');

    if (tab === 'home') {
        homeTab.classList.add('active', 'border-blue-500', 'text-blue-400');
        homeTab.classList.remove('border-transparent', 'text-gray-400');
        doubanArea.classList.remove('hidden');
        trendingArea.classList.remove('hidden');
        resetSearchArea();
    } else if (tab === 'search') {
        searchTab.classList.add('active', 'border-blue-500', 'text-blue-400');
        searchTab.classList.remove('border-transparent', 'text-gray-400');
        document.getElementById('searchInput').focus();
    } else if (tab === 'category' && category) {
        // 激活对应的分类标签
        const categoryTabs = {
            '电影': movieTab,
            '电视剧': tvTab,
            '动漫': animeTab,
            '综艺': varietyTab
        };

        const activeTab = categoryTabs[category];
        if (activeTab) {
            activeTab.classList.add('active', 'border-blue-500', 'text-blue-400');
            activeTab.classList.remove('border-transparent', 'text-gray-400');
        }

        categoryArea.classList.remove('hidden');
        document.getElementById('categoryTitle').textContent = category;
        loadCategoryContent(category);
    }
}

// 重置搜索区域
function resetSearchArea() {
    const searchArea = document.getElementById('searchArea');
    const resultsArea = document.getElementById('resultsArea');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchInput');

    searchArea.classList.add('flex-1');
    searchArea.classList.remove('mb-8');
    resultsArea.classList.add('hidden');
    searchInput.value = '';
    clearBtn.classList.add('hidden');

    // 更新URL
    window.history.pushState({}, 'YouTV - 免费在线视频搜索与观看平台', '/');
    document.title = 'YouTV - 免费在线视频搜索与观看平台';
}

// 初始化侧边栏
function initializeSidebars() {
    // 历史记录侧边栏
    const historyBtn = document.getElementById('historyBtn');
    const historyPanel = document.getElementById('historyPanel');
    const closeHistoryBtn = document.getElementById('closeHistoryPanel');

    historyBtn.addEventListener('click', function() {
        historyPanel.classList.add('show');
        renderSearchHistory();
    });

    closeHistoryBtn.addEventListener('click', function() {
        historyPanel.classList.remove('show');
    });

    // 设置侧边栏
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettingsBtn = document.getElementById('closeSettingsPanel');

    settingsBtn.addEventListener('click', function() {
        settingsPanel.classList.add('show');
    });

    closeSettingsBtn.addEventListener('click', function() {
        settingsPanel.classList.remove('show');
    });

    // 点击外部关闭侧边栏
    document.addEventListener('click', function(e) {
        if (!historyPanel.contains(e.target) && !historyBtn.contains(e.target)) {
            historyPanel.classList.remove('show');
        }

        if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
            settingsPanel.classList.remove('show');
        }
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索相关
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearchInput');
    const backToHomeBtn = document.getElementById('backToHome');

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    searchBtn.addEventListener('click', performSearch);
    clearBtn.addEventListener('click', clearSearchInput);
    backToHomeBtn.addEventListener('click', () => switchTab('home'));

    // 设置相关事件监听器将在下一部分添加
}

// 设置浏览器历史管理
function setupBrowserHistory() {
    // 监听浏览器前进/后退按钮
    window.addEventListener('popstate', function(event) {
        console.log('浏览器历史状态变化:', event.state);

        // 根据URL状态恢复页面状态
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q') || getSearchFromPath();

        if (searchQuery) {
            // 恢复搜索状态
            const searchInput = document.getElementById('searchInput');
            const clearBtn = document.getElementById('clearSearchInput');

            searchInput.value = decodeURIComponent(searchQuery);
            clearBtn.classList.remove('hidden');

            // 执行搜索但不更新历史记录
            performSearchWithoutHistory(searchQuery);
        } else {
            // 返回首页状态
            switchTab('home');
        }
    });
}

// 清空搜索输入框
function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchInput');

    searchInput.value = '';
    clearBtn.classList.add('hidden');
    searchInput.focus();
}

// 加载API源
async function loadApiSources() {
    try {
        const response = await fetch('/api/sources');
        const data = await response.json();

        if (data.code === 200) {
            renderApiSources(data.sources);
        } else {
            console.error('加载API源失败:', data.message);
            showToast('加载数据源失败', 'error');
        }
    } catch (error) {
        console.error('加载API源错误:', error);
        showToast('加载数据源失败', 'error');
    }
}

// 渲染API源复选框
function renderApiSources(sources) {
    const container = document.getElementById('apiCheckboxes');
    container.innerHTML = '';

    // 普通资源组
    const normalDiv = document.createElement('div');
    normalDiv.className = 'space-y-2';

    const normalTitle = document.createElement('h5');
    normalTitle.className = 'font-medium text-gray-300 mb-2';
    normalTitle.textContent = '普通资源';
    normalDiv.appendChild(normalTitle);

    // 创建普通API源复选框
    Object.entries(sources).forEach(([key, source]) => {
        if (source.adult) return;

        const isChecked = selectedAPIs.includes(key);
        const checkbox = createApiCheckbox(key, source.name, isChecked, false);
        normalDiv.appendChild(checkbox);
    });

    container.appendChild(normalDiv);

    // 更新选中数量
    updateSelectedApiCount();
}

// 创建API复选框
function createApiCheckbox(key, name, checked, isAdult) {
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `api_${key}`;
    checkbox.checked = checked;
    checkbox.dataset.api = key;
    checkbox.className = isAdult ? 'api-adult' : '';

    const label = document.createElement('label');
    label.htmlFor = `api_${key}`;
    label.className = 'text-sm cursor-pointer';
    label.textContent = name;

    checkbox.addEventListener('change', function() {
        updateSelectedAPIs();
    });

    div.appendChild(checkbox);
    div.appendChild(label);

    return div;
}

// 更新选中的API列表
function updateSelectedAPIs() {
    const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]:checked');
    selectedAPIs = Array.from(checkboxes).map(cb => cb.dataset.api);

    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    updateSelectedApiCount();
}

// 更新选中API数量显示
function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) {
        countEl.textContent = selectedAPIs.length;
    }
}

// 执行搜索
async function performSearch(query) {
    return await performSearchInternal(query, true);
}

// 执行搜索但不更新历史记录（用于浏览器历史导航）
async function performSearchWithoutHistory(query) {
    return await performSearchInternal(query, false);
}

// 内部搜索实现
async function performSearchInternal(query, updateHistory = true) {
    if (!checkPasswordProtection()) {
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const searchQuery = query || searchInput.value.trim();

    if (!searchQuery) {
        showToast('请输入搜索内容', 'info');
        return;
    }

    if (selectedAPIs.length === 0) {
        showToast('请至少选择一个数据源', 'warning');
        return;
    }

    try {
        showImprovedLoading('正在搜索视频资源...');

        // 保存搜索历史（仅在更新历史时）
        if (updateHistory) {
            saveSearchHistory(searchQuery);
        }

        // 更新UI状态
        switchToSearchResults();

        // 构建搜索参数
        const params = new URLSearchParams({
            q: searchQuery,
            sources: selectedAPIs.join(','),
            customApis: JSON.stringify(customAPIs)
        });

        // 发起搜索请求
        const response = await fetch(`/api/search?${params}`, {
            timeout: API_TIMEOUT
        });

        const data = await response.json();

        if (data.code === 200) {
            currentSearchResults = data.list || [];
            renderSearchResults(currentSearchResults, searchQuery);

            // 更新URL（仅在更新历史时）
            if (updateHistory) {
                const encodedQuery = encodeURIComponent(searchQuery);
                window.history.pushState(
                    { search: searchQuery },
                    `搜索: ${searchQuery} - YouTV`,
                    `/s=${encodedQuery}`
                );
                document.title = `搜索: ${searchQuery} - YouTV`;
            }
        } else {
            throw new Error(data.message || '搜索失败');
        }

    } catch (error) {
        console.error('搜索错误:', error);
        showToast('搜索失败，请稍后重试', 'error');
        renderSearchResults([], searchQuery);
    } finally {
        hideLoading();
    }
}

// 切换到搜索结果视图
function switchToSearchResults() {
    const searchArea = document.getElementById('searchArea');
    const resultsArea = document.getElementById('resultsArea');
    const doubanArea = document.getElementById('doubanArea');
    const trendingArea = document.getElementById('trendingArea');

    searchArea.classList.remove('flex-1');
    searchArea.classList.add('mb-8');
    resultsArea.classList.remove('hidden');
    doubanArea.classList.add('hidden');
    trendingArea.classList.add('hidden');

    // 切换到搜索标签
    switchTab('search');
}

// 渲染搜索结果
function renderSearchResults(results, query) {
    const resultsContainer = document.getElementById('results');
    const countElement = document.getElementById('searchResultsCount');

    countElement.textContent = results.length;

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">🔍</div>
                <h3 class="text-xl font-semibold mb-2">没有找到匹配的结果</h3>
                <p class="text-gray-400">请尝试其他关键词或更换数据源</p>
            </div>
        `;
        return;
    }

    // 过滤黄色内容（如果启用）
    const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
    if (yellowFilterEnabled) {
        const bannedTypes = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑',
                           '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码',
                           '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];

        results = results.filter(item => {
            const typeName = item.type_name || '';
            return !bannedTypes.some(keyword => typeName.includes(keyword));
        });

        countElement.textContent = results.length;
    }

    // 渲染视频卡片
    const cardsHtml = results.map(item => createVideoCard(item)).join('');
    resultsContainer.innerHTML = cardsHtml;
}

// 创建视频卡片
function createVideoCard(item) {
    const safeName = escapeHtml(item.vod_name || '未知视频');
    const safeRemarks = escapeHtml(item.vod_remarks || '');
    const safeTypeName = escapeHtml(item.type_name || '');
    const safeYear = escapeHtml(item.vod_year || '');
    const safeSourceName = escapeHtml(item.source_name || '');

    const hasCover = item.vod_pic && item.vod_pic.startsWith('http');
    const coverImg = hasCover ?
        `<img src="${item.vod_pic}" alt="${safeName}" class="w-full h-48 object-cover" loading="lazy" onerror="this.style.display='none'">` :
        `<div class="w-full h-48 bg-gray-700 flex items-center justify-center">
            <svg class="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
            </svg>
        </div>`;

    return `
        <div class="video-card" onclick="showVideoDetails('${item.vod_id}', '${safeName}', '${item.source_code}')">
            ${coverImg}
            <div class="p-4">
                <h3 class="font-semibold text-white mb-2 line-clamp-2">${safeName}</h3>
                <div class="space-y-1 text-sm text-gray-400">
                    ${safeTypeName ? `<div class="flex items-center space-x-2">
                        <span class="rating-badge">${safeTypeName}</span>
                        ${safeYear ? `<span class="text-gray-400">${safeYear}</span>` : ''}
                    </div>` : ''}
                    ${safeRemarks ? `<p class="line-clamp-2">${safeRemarks}</p>` : ''}
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-blue-400 text-xs">${safeSourceName}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 搜索历史管理
function saveSearchHistory(query) {
    if (!query || query.trim() === '') return;

    // 移除重复项
    searchHistory = searchHistory.filter(item => item.query !== query);

    // 添加到开头
    searchHistory.unshift({
        query: query,
        timestamp: Date.now()
    });

    // 限制历史记录数量
    if (searchHistory.length > MAX_HISTORY_ITEMS) {
        searchHistory = searchHistory.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
}

// 渲染搜索历史
function renderSearchHistory() {
    const container = document.getElementById('searchHistoryList');

    if (searchHistory.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                暂无搜索记录
            </div>
        `;
        return;
    }

    const historyHtml = searchHistory.map(item => `
        <div class="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer"
             onclick="searchFromHistory('${escapeHtml(item.query)}')">
            <span class="text-sm">${escapeHtml(item.query)}</span>
            <span class="text-xs text-gray-500">${formatTime(item.timestamp)}</span>
        </div>
    `).join('');

    container.innerHTML = historyHtml;
}

// 从历史记录搜索
function searchFromHistory(query) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = query;

    // 关闭历史面板
    document.getElementById('historyPanel').classList.remove('show');

    // 执行搜索
    performSearch(query);
}

// 清空搜索历史
function clearSearchHistory() {
    searchHistory = [];
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    renderSearchHistory();
    showToast('搜索历史已清空', 'info');
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // 1分钟内
        return '刚刚';
    } else if (diff < 3600000) { // 1小时内
        return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) { // 1天内
        return Math.floor(diff / 3600000) + '小时前';
    } else {
        return date.toLocaleDateString();
    }
}

// 初始化设置
function initializeSettings() {
    // 设置默认值
    if (!localStorage.getItem('hasInitializedDefaults')) {
        localStorage.setItem('selectedAPIs', JSON.stringify(["tyyszy","bfzy","dyttzy","ruyi"]));
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem('adFilteringEnabled', 'true');
        localStorage.setItem('doubanEnabled', 'true');
        localStorage.setItem('hasInitializedDefaults', 'true');
    }

    // 设置开关状态
    const yellowFilter = document.getElementById('yellowFilterToggle');
    const adFilter = document.getElementById('adFilterToggle');
    const doubanToggle = document.getElementById('doubanToggle');

    if (yellowFilter) {
        yellowFilter.checked = localStorage.getItem('yellowFilterEnabled') === 'true';
        yellowFilter.addEventListener('change', function() {
            localStorage.setItem('yellowFilterEnabled', this.checked);
        });
    }

    if (adFilter) {
        adFilter.checked = localStorage.getItem('adFilteringEnabled') === 'true';
        adFilter.addEventListener('change', function() {
            localStorage.setItem('adFilteringEnabled', this.checked);
        });
    }

    if (doubanToggle) {
        doubanToggle.checked = localStorage.getItem('doubanEnabled') === 'true';
        doubanToggle.addEventListener('change', function() {
            localStorage.setItem('doubanEnabled', this.checked);
            updateDoubanVisibility();
        });
    }

    // 设置API选择按钮
    setupApiSelectionButtons();

    // 设置历史记录按钮
    const clearHistoryBtn = document.getElementById('clearSearchHistory');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearSearchHistory);
    }

    // 设置配置管理按钮
    setupConfigManagement();

    // 设置自定义API管理
    setupCustomApiManagement();

    // 设置豆瓣按钮事件
    setupDoubanEvents();

    // 设置热门内容按钮事件
    setupTrendingEvents();

    // 更新豆瓣区域显示
    updateDoubanVisibility();

    // 加载豆瓣推荐内容
    loadDoubanRecommendations();

    // 加载热门内容
    loadTrendingContent();
}

// 设置API选择按钮
function setupApiSelectionButtons() {
    const selectAllBtn = document.getElementById('selectAllAPIs');
    const selectNoneBtn = document.getElementById('selectNoneAPIs');
    const selectNormalBtn = document.getElementById('selectNormalAPIs');

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => selectAPIs(true, false));
    }

    if (selectNoneBtn) {
        selectNoneBtn.addEventListener('click', () => selectAPIs(false, false));
    }

    if (selectNormalBtn) {
        selectNormalBtn.addEventListener('click', () => selectAPIs(true, true));
    }
}

// 选择API
function selectAPIs(selectAll, normalOnly) {
    const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (normalOnly && checkbox.classList.contains('api-adult')) {
            checkbox.checked = false;
        } else {
            checkbox.checked = selectAll;
        }
    });

    updateSelectedAPIs();
}

// 更新豆瓣区域显示
function updateDoubanVisibility() {
    const doubanArea = document.getElementById('doubanArea');
    const doubanEnabled = localStorage.getItem('doubanEnabled') === 'true';

    if (doubanArea) {
        if (doubanEnabled) {
            doubanArea.classList.remove('hidden');
        } else {
            doubanArea.classList.add('hidden');
        }
    }
}

// 当前豆瓣类型
let currentDoubanType = 'movie';

// 当前热门内容类型
let currentTrendingType = 'movie';

// 加载豆瓣推荐内容
async function loadDoubanRecommendations(type = 'movie', refresh = false) {
    const doubanEnabled = localStorage.getItem('doubanEnabled') === 'true';
    if (!doubanEnabled) {
        return;
    }

    try {
        const resultsContainer = document.getElementById('doubanResults');

        // 显示加载状态
        if (!refresh) {
            resultsContainer.innerHTML = createSkeletonCards(6);
        }

        currentDoubanType = type;

        // 构建请求参数
        const params = new URLSearchParams({
            type: type,
            limit: '6'
        });

        if (refresh) {
            params.append('refresh', 'true');
        }

        // 发起请求
        const response = await fetch(`/api/douban?${params}`);
        const data = await response.json();

        if (data.code === 200) {
            renderDoubanResults(data.list, type);
            updateDoubanTabs(type);
        } else {
            throw new Error(data.message || '获取推荐内容失败');
        }

    } catch (error) {
        console.error('豆瓣推荐加载错误:', error);
        const resultsContainer = document.getElementById('doubanResults');
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <div class="text-red-500 text-4xl mb-4">⚠️</div>
                <p>加载推荐内容失败</p>
                <button class="btn-secondary mt-4" onclick="loadDoubanRecommendations('${currentDoubanType}')">
                    重试
                </button>
            </div>
        `;
    }
}

// 渲染豆瓣推荐结果
function renderDoubanResults(results, type) {
    const resultsContainer = document.getElementById('doubanResults');

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <div class="text-6xl mb-4">📺</div>
                <p>暂无推荐内容</p>
            </div>
        `;
        return;
    }

    const cardsHtml = results.map(item => createDoubanCard(item)).join('');
    resultsContainer.innerHTML = cardsHtml;
}

// 创建豆瓣推荐卡片
function createDoubanCard(item) {
    const safeTitle = escapeHtml(item.title || '未知标题');
    const safeYear = escapeHtml(item.year || '');
    const safeRating = escapeHtml(item.rating || '');
    const safeGenre = escapeHtml(item.genre || '');
    const safeDescription = escapeHtml(item.description || '');

    return `
        <div class="video-card" onclick="searchDoubanItem('${safeTitle}')">
            <img src="${item.poster}" alt="${safeTitle}" class="w-full h-48 object-cover" loading="lazy" onerror="this.style.display='none'">
            <div class="p-4">
                <h3 class="font-semibold text-white mb-2 line-clamp-2">${safeTitle}</h3>
                <div class="space-y-1 text-sm text-gray-400">
                    <div class="flex items-center space-x-2">
                        <span class="douban-badge">豆瓣 ${safeRating}</span>
                        ${safeYear ? `<span class="text-gray-400">${safeYear}</span>` : ''}
                    </div>
                    ${safeGenre ? `<p class="text-blue-400 text-xs">${safeGenre}</p>` : ''}
                    ${safeDescription ? `<p class="line-clamp-2 text-xs">${safeDescription}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

// 更新豆瓣标签页状态
function updateDoubanTabs(activeType) {
    const movieTab = document.getElementById('doubanMovieTab');
    const tvTab = document.getElementById('doubanTvTab');

    if (movieTab && tvTab) {
        // 重置样式
        movieTab.className = 'btn-secondary px-4 py-2 text-sm';
        tvTab.className = 'btn-secondary px-4 py-2 text-sm';

        // 设置激活状态
        if (activeType === 'movie') {
            movieTab.className = 'btn-primary px-4 py-2 text-sm';
        } else {
            tvTab.className = 'btn-primary px-4 py-2 text-sm';
        }
    }
}

// 搜索豆瓣推荐项目
function searchDoubanItem(title) {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchInput');

    searchInput.value = title;
    clearBtn.classList.remove('hidden');

    // 执行搜索
    performSearch(title);
}

// 设置豆瓣按钮事件
function setupDoubanEvents() {
    const movieTab = document.getElementById('doubanMovieTab');
    const tvTab = document.getElementById('doubanTvTab');
    const refreshBtn = document.getElementById('refreshDouban');

    if (movieTab) {
        movieTab.addEventListener('click', function() {
            loadDoubanRecommendations('movie');
        });
    }

    if (tvTab) {
        tvTab.addEventListener('click', function() {
            loadDoubanRecommendations('tv');
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDoubanRecommendations(currentDoubanType, true);
        });
    }
}

// 创建骨架屏卡片
function createSkeletonCards(count) {
    const skeletonCards = Array(count).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="p-4">
                <div class="skeleton-text w-3/4"></div>
                <div class="skeleton-text w-1/2"></div>
                <div class="skeleton-text-sm w-2/3"></div>
                <div class="skeleton-text-sm w-1/3"></div>
            </div>
        </div>
    `).join('');

    return skeletonCards;
}

// 加载热门内容
async function loadTrendingContent(type = 'movie', refresh = false) {
    try {
        // 检查是否有选中的API源
        if (selectedAPIs.length === 0) {
            console.log('没有选中的API源，跳过热门内容加载');
            return;
        }

        const resultsContainer = document.getElementById('trendingResults');
        if (!resultsContainer) {
            console.log('热门内容容器不存在，跳过加载');
            return;
        }

        // 显示加载状态
        if (!refresh) {
            resultsContainer.innerHTML = createSkeletonCards(6);
        }

        currentTrendingType = type;

        // 构建请求参数
        const params = new URLSearchParams({
            type: type,
            limit: '6'
        });

        if (refresh) {
            params.append('refresh', 'true');
        }

        // 发起请求
        const response = await fetch(`/api/trending?${params}`);
        const data = await response.json();

        if (data.code === 200) {
            renderTrendingResults(data.list, type);
            updateTrendingTabs(type);
        } else {
            throw new Error(data.message || '获取热门内容失败');
        }

    } catch (error) {
        console.error('热门内容加载错误:', error);
        const resultsContainer = document.getElementById('trendingResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <div class="text-red-500 text-4xl mb-4">⚠️</div>
                    <p>加载热门内容失败</p>
                    <button class="btn-secondary mt-4" onclick="loadTrendingContent('${currentTrendingType}')">
                        重试
                    </button>
                </div>
            `;
        }
    }
}

// 渲染热门内容结果
function renderTrendingResults(results, type) {
    const resultsContainer = document.getElementById('trendingResults');
    if (!resultsContainer) return;

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <div class="text-6xl mb-4">🎬</div>
                <p>暂无热门内容</p>
            </div>
        `;
        return;
    }

    const cardsHtml = results.map(item => createVideoCard(item)).join('');
    resultsContainer.innerHTML = cardsHtml;
}

// 更新热门内容标签页状态
function updateTrendingTabs(activeType) {
    const movieTab = document.getElementById('trendingMovieTab');
    const tvTab = document.getElementById('trendingTvTab');

    if (movieTab && tvTab) {
        // 重置样式
        movieTab.className = 'btn-secondary px-4 py-2 text-sm';
        tvTab.className = 'btn-secondary px-4 py-2 text-sm';

        // 设置激活状态
        if (activeType === 'movie') {
            movieTab.className = 'btn-primary px-4 py-2 text-sm';
        } else {
            tvTab.className = 'btn-primary px-4 py-2 text-sm';
        }
    }
}

// 设置热门内容按钮事件
function setupTrendingEvents() {
    const movieTab = document.getElementById('trendingMovieTab');
    const tvTab = document.getElementById('trendingTvTab');
    const refreshBtn = document.getElementById('refreshTrending');

    if (movieTab) {
        movieTab.addEventListener('click', function() {
            loadTrendingContent('movie');
        });
    }

    if (tvTab) {
        tvTab.addEventListener('click', function() {
            loadTrendingContent('tv');
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadTrendingContent(currentTrendingType, true);
        });
    }
}

// 改进的加载状态显示
function showImprovedLoading(text = '加载中...', container = null) {
    const loadingHtml = `
        <div class="loading-container">
            <div class="loading-spinner-lg"></div>
            <p class="loading-text">${text}</p>
        </div>
    `;

    if (container) {
        container.innerHTML = loadingHtml;
    } else {
        const overlay = document.getElementById('loadingOverlay');
        const textEl = document.getElementById('loadingText');
        if (textEl) {
            textEl.textContent = text;
        }
        overlay.classList.remove('hidden');
    }
}

// 显示免责声明
function showDisclaimer() {
    const hasAccepted = localStorage.getItem('disclaimerAccepted');

    if (!hasAccepted) {
        const modal = document.getElementById('disclaimerModal');
        const acceptBtn = document.getElementById('acceptDisclaimer');

        modal.classList.remove('hidden');

        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('disclaimerAccepted', 'true');
            modal.classList.add('hidden');
        });
    }
}

// 显示视频详情
async function showVideoDetails(videoId, videoName, sourceCode) {
    if (!checkPasswordProtection()) {
        return;
    }

    try {
        showImprovedLoading('正在获取视频详情...');

        // 构建请求参数
        const params = new URLSearchParams({
            id: videoId,
            source: sourceCode
        });

        // 如果是自定义API，添加额外参数
        if (sourceCode.startsWith('custom_')) {
            const customIndex = parseInt(sourceCode.replace('custom_', ''));
            const customApi = customAPIs[customIndex];

            if (customApi) {
                params.append('customApi', customApi.url);
                if (customApi.detail) {
                    params.append('customDetail', customApi.detail);
                }
            }
        }

        const response = await fetch(`/api/detail?${params}`);
        const data = await response.json();

        if (data.code === 200) {
            renderVideoDetails(data, videoName, sourceCode);
        } else {
            throw new Error(data.message || '获取详情失败');
        }

    } catch (error) {
        console.error('获取详情错误:', error);
        showToast('获取详情失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 渲染视频详情
function renderVideoDetails(data, videoName, sourceCode) {
    const modal = document.getElementById('videoModal');
    const title = document.getElementById('videoModalTitle');
    const content = document.getElementById('videoModalContent');
    const closeBtn = document.getElementById('closeVideoModal');

    title.textContent = videoName + (data.videoInfo?.source_name ? ` (${data.videoInfo.source_name})` : '');

    if (data.episodes && data.episodes.length > 0) {
        let detailInfoHtml = '';

        // 视频信息
        if (data.videoInfo) {
            const info = data.videoInfo;
            const hasInfo = info.type || info.year || info.area || info.director || info.actor || info.remarks;
            const description = info.desc ? info.desc.replace(/<[^>]+>/g, '').trim() : '';

            if (hasInfo || description) {
                detailInfoHtml = `
                    <div class="mb-6 p-4 bg-gray-700 rounded-lg">
                        ${hasInfo ? `
                            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                                ${info.type ? `<div><span class="text-gray-400">类型:</span> ${escapeHtml(info.type)}</div>` : ''}
                                ${info.year ? `<div><span class="text-gray-400">年份:</span> ${escapeHtml(info.year)}</div>` : ''}
                                ${info.area ? `<div><span class="text-gray-400">地区:</span> ${escapeHtml(info.area)}</div>` : ''}
                                ${info.director ? `<div><span class="text-gray-400">导演:</span> ${escapeHtml(info.director)}</div>` : ''}
                                ${info.actor ? `<div><span class="text-gray-400">主演:</span> ${escapeHtml(info.actor)}</div>` : ''}
                                ${info.remarks ? `<div><span class="text-gray-400">备注:</span> ${escapeHtml(info.remarks)}</div>` : ''}
                            </div>
                        ` : ''}
                        ${description ? `
                            <div>
                                <div class="text-gray-400 text-sm mb-2">简介:</div>
                                <p class="text-sm leading-relaxed">${escapeHtml(description)}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        }

        // 剧集列表
        const episodesHtml = data.episodes.map((episode, index) => `
            <button class="btn-secondary text-sm mr-2 mb-2"
                    onclick="playVideo('${episode.url}', '${escapeHtml(videoName)}', '${sourceCode}', ${index}, '${data.videoInfo?.vod_id || ''}')">
                ${escapeHtml(episode.name)}
            </button>
        `).join('');

        content.innerHTML = `
            ${detailInfoHtml}
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold">共 ${data.episodes.length} 集</h4>
                <button class="btn-secondary text-sm" onclick="copyEpisodeLinks('${escapeHtml(JSON.stringify(data.episodes))}')">
                    复制链接
                </button>
            </div>
            <div class="max-h-64 overflow-y-auto">
                ${episodesHtml}
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="text-center py-12">
                <div class="text-red-500 text-6xl mb-4">❌</div>
                <h3 class="text-xl font-semibold mb-2">未找到播放资源</h3>
                <p class="text-gray-400">该视频可能暂时无法播放，请尝试其他视频</p>
            </div>
        `;
    }

    modal.classList.remove('hidden');

    // 关闭按钮事件
    closeBtn.onclick = function() {
        modal.classList.add('hidden');
    };

    // 点击外部关闭
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    };
}

// 播放视频
function playVideo(url, videoName, sourceCode, episodeIndex, videoId) {
    if (!checkPasswordProtection()) {
        return;
    }

    // 构建播放页面URL
    const params = new URLSearchParams({
        url: url,
        title: videoName,
        source: sourceCode,
        index: episodeIndex || 0,
        id: videoId || '',
        back: window.location.href,
        verified: 'true'  // 添加验证状态参数
    });

    // 跳转到播放页面
    window.location.href = `player.html?${params}`;
}

// 复制剧集链接
function copyEpisodeLinks(episodesJson) {
    try {
        const episodes = JSON.parse(episodesJson);
        const links = episodes.map(ep => ep.url).join('\n');

        navigator.clipboard.writeText(links).then(() => {
            showToast('播放链接已复制', 'success');
        }).catch(() => {
            showToast('复制失败，请检查浏览器权限', 'error');
        });
    } catch (error) {
        showToast('复制失败', 'error');
    }
}

// 显示加载状态
function showLoading(text = '加载中...') {
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');

    if (textEl) {
        textEl.textContent = text;
    }

    overlay.classList.remove('hidden');
}

// 隐藏加载状态
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('hidden');
}

// 显示Toast通知
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast ${type} transform translate-x-full`;
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <span>${escapeHtml(message)}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-300">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    container.appendChild(toast);

    // 动画显示
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);

    // 自动隐藏
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    showToast('发生未知错误，请刷新页面重试', 'error');
});

// 全局未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
    showToast('网络请求失败，请检查网络连接', 'error');
});

// 设置配置管理
function setupConfigManagement() {
    const importBtn = document.getElementById('importConfig');
    const exportBtn = document.getElementById('exportConfig');
    const clearCookiesBtn = document.getElementById('clearCookies');

    if (importBtn) {
        importBtn.addEventListener('click', importConfiguration);
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', exportConfiguration);
    }

    if (clearCookiesBtn) {
        clearCookiesBtn.addEventListener('click', clearAllCookies);
    }
}

// 设置自定义API管理
function setupCustomApiManagement() {
    const addBtn = document.getElementById('addCustomApiBtn');

    if (addBtn) {
        addBtn.addEventListener('click', showAddCustomApiModal);
    }

    // 渲染现有的自定义API
    renderCustomApisList();
}

// 显示添加自定义API模态框
function showAddCustomApiModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">添加自定义API</h3>
                <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <form id="customApiForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">API名称</label>
                    <input type="text" id="customApiName" class="input-field" placeholder="例如：我的API" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">API地址</label>
                    <input type="url" id="customApiUrl" class="input-field" placeholder="https://api.example.com/api.php/provide/vod" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">详情API地址（可选）</label>
                    <input type="url" id="customApiDetail" class="input-field" placeholder="留空则使用相同地址">
                </div>
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="customApiAdult" class="toggle">
                    <label for="customApiAdult" class="text-sm">成人内容</label>
                </div>
                <div class="flex space-x-2">
                    <button type="submit" class="btn-primary flex-1">添加</button>
                    <button type="button" onclick="this.closest('.modal-overlay').remove()" class="btn-secondary flex-1">取消</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // 处理表单提交
    const form = modal.querySelector('#customApiForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        addCustomApi();
        modal.remove();
    });

    // 聚焦第一个输入框
    modal.querySelector('#customApiName').focus();
}

// 添加自定义API
function addCustomApi() {
    const name = document.getElementById('customApiName').value.trim();
    const url = document.getElementById('customApiUrl').value.trim();
    const detail = document.getElementById('customApiDetail').value.trim();
    const isAdult = document.getElementById('customApiAdult').checked;

    if (!name || !url) {
        showToast('请填写API名称和地址', 'error');
        return;
    }

    // 验证URL格式
    try {
        new URL(url);
        if (detail) {
            new URL(detail);
        }
    } catch (error) {
        showToast('请输入有效的URL地址', 'error');
        return;
    }

    const customApi = {
        name: name,
        url: url,
        detail: detail || null,
        isAdult: isAdult
    };

    customAPIs.push(customApi);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));

    renderCustomApisList();
    showToast('自定义API添加成功', 'success');
}

// 渲染自定义API列表
function renderCustomApisList() {
    const container = document.getElementById('customApisList');

    if (customAPIs.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-4 text-sm">
                暂无自定义API
            </div>
        `;
        return;
    }

    const apisHtml = customAPIs.map((api, index) => `
        <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div class="flex-1">
                <div class="font-medium">${escapeHtml(api.name)}</div>
                <div class="text-xs text-gray-400 truncate">${escapeHtml(api.url)}</div>
                ${api.isAdult ? '<span class="text-xs text-red-400">成人内容</span>' : ''}
            </div>
            <button onclick="removeCustomApi(${index})" class="text-red-400 hover:text-red-300 ml-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `).join('');

    container.innerHTML = apisHtml;
}

// 删除自定义API
function removeCustomApi(index) {
    if (confirm('确定要删除这个自定义API吗？')) {
        customAPIs.splice(index, 1);
        localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
        renderCustomApisList();
        showToast('自定义API已删除', 'info');
    }
}

// 导出配置
function exportConfiguration() {
    const config = {
        selectedAPIs: selectedAPIs,
        customAPIs: customAPIs,
        yellowFilterEnabled: localStorage.getItem('yellowFilterEnabled') === 'true',
        adFilteringEnabled: localStorage.getItem('adFilteringEnabled') === 'true',
        doubanEnabled: localStorage.getItem('doubanEnabled') === 'true',
        autoPlayNext: localStorage.getItem('autoPlayNext') === 'true',
        searchHistory: searchHistory,
        exportTime: new Date().toISOString(),
        version: '1.0.0'
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `youtv-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showToast('配置已导出', 'success');
}

// 导入配置
function importConfiguration() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const config = JSON.parse(e.target.result);

                // 验证配置格式
                if (!config.version || !Array.isArray(config.selectedAPIs)) {
                    throw new Error('无效的配置文件格式');
                }

                // 应用配置
                if (config.selectedAPIs) {
                    selectedAPIs = config.selectedAPIs;
                    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
                }

                if (config.customAPIs && Array.isArray(config.customAPIs)) {
                    customAPIs = config.customAPIs;
                    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
                }

                if (typeof config.yellowFilterEnabled === 'boolean') {
                    localStorage.setItem('yellowFilterEnabled', config.yellowFilterEnabled);
                }

                if (typeof config.adFilteringEnabled === 'boolean') {
                    localStorage.setItem('adFilteringEnabled', config.adFilteringEnabled);
                }

                if (typeof config.doubanEnabled === 'boolean') {
                    localStorage.setItem('doubanEnabled', config.doubanEnabled);
                }

                if (typeof config.autoPlayNext === 'boolean') {
                    localStorage.setItem('autoPlayNext', config.autoPlayNext);
                }

                if (config.searchHistory && Array.isArray(config.searchHistory)) {
                    searchHistory = config.searchHistory;
                    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
                }

                // 刷新页面以应用配置
                showToast('配置导入成功，页面将刷新', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (error) {
                console.error('导入配置失败:', error);
                showToast('配置文件格式错误', 'error');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// 清除所有Cookie和本地存储
function clearAllCookies() {
    if (confirm('确定要清除所有设置和数据吗？此操作不可撤销。')) {
        // 清除localStorage
        localStorage.clear();

        // 清除sessionStorage
        sessionStorage.clear();

        // 清除cookies
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        showToast('所有数据已清除，页面将刷新', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}

// 加载分类内容
async function loadCategoryContent(category, page = 1) {
    if (!checkPasswordProtection()) {
        return;
    }

    try {
        const resultsContainer = document.getElementById('categoryResults');

        // 显示加载状态
        resultsContainer.innerHTML = createSkeletonCards(12);

        // 构建搜索参数 - 使用分类名称作为搜索关键词
        const params = new URLSearchParams({
            q: category,
            sources: selectedAPIs.join(','),
            customApis: JSON.stringify(customAPIs),
            page: page
        });

        // 发起搜索请求
        const response = await fetch(`/api/search?${params}`, {
            timeout: API_TIMEOUT
        });

        const data = await response.json();

        if (data.code === 200) {
            let results = data.list || [];

            // 根据分类过滤结果
            results = results.filter(item => {
                const typeName = item.type_name || '';
                const vodName = item.vod_name || '';

                // 根据分类进行更精确的过滤
                switch(category) {
                    case '电影':
                        return typeName.includes('电影') || typeName.includes('影片');
                    case '电视剧':
                        return typeName.includes('电视剧') || typeName.includes('连续剧') || typeName.includes('剧集');
                    case '动漫':
                        return typeName.includes('动漫') || typeName.includes('动画') || typeName.includes('卡通');
                    case '综艺':
                        return typeName.includes('综艺') || typeName.includes('娱乐') || typeName.includes('真人秀');
                    default:
                        return true;
                }
            });

            renderCategoryResults(results, category, page);
        } else {
            throw new Error(data.message || '加载分类内容失败');
        }

    } catch (error) {
        console.error('分类内容加载错误:', error);
        const resultsContainer = document.getElementById('categoryResults');
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 class="text-xl font-semibold mb-2">加载失败</h3>
                <p class="text-gray-400 mb-4">请检查网络连接或稍后重试</p>
                <button class="btn-primary" onclick="loadCategoryContent('${category}', ${page})">重试</button>
            </div>
        `;
    }
}

// 渲染分类结果
function renderCategoryResults(results, category, page) {
    const resultsContainer = document.getElementById('categoryResults');
    const pageInfo = document.getElementById('pageInfo');

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">🎬</div>
                <h3 class="text-xl font-semibold mb-2">暂无${category}内容</h3>
                <p class="text-gray-400">请尝试其他分类或稍后再试</p>
            </div>
        `;
        return;
    }

    // 过滤黄色内容（如果启用）
    const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
    if (yellowFilterEnabled) {
        const bannedTypes = ['伦理片', '福利', '里番动漫', '门事件', '萝莉少女', '制服诱惑',
                           '国产传媒', 'cosplay', '黑丝诱惑', '无码', '日本无码', '有码',
                           '日本有码', 'SWAG', '网红主播', '色情片', '同性片', '福利视频', '福利片'];

        results = results.filter(item => {
            const typeName = item.type_name || '';
            return !bannedTypes.some(keyword => typeName.includes(keyword));
        });
    }

    // 渲染视频卡片
    const cardsHtml = results.map(item => createVideoCard(item)).join('');
    resultsContainer.innerHTML = cardsHtml;

    // 更新分页信息
    if (pageInfo) {
        pageInfo.textContent = `第 ${page} 页`;
    }
}

// 导出全局函数供HTML调用
window.showVideoDetails = showVideoDetails;
window.playVideo = playVideo;
window.copyEpisodeLinks = copyEpisodeLinks;
window.searchFromHistory = searchFromHistory;
window.performSearch = performSearch;
window.removeCustomApi = removeCustomApi;
window.loadCategoryContent = loadCategoryContent;
window.loadTrendingContent = loadTrendingContent;
