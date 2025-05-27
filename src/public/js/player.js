// YouTV 视频播放器
// 全局变量
let currentVideo = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let currentSourceCode = '';
let currentVideoId = '';
let currentVideoTitle = '';
let isPasswordVerified = false;
let hls = null;
let autoPlayNext = false;
let episodesReversed = false;

// 播放器初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('YouTV 播放器初始化...');

    // 调试信息
    console.log('当前localStorage状态:', {
        passwordVerified: localStorage.getItem('passwordVerified'),
        allKeys: Object.keys(localStorage)
    });

    console.log('APP_CONFIG:', window.APP_CONFIG);

    // 检查密码保护
    const needsPassword = checkPasswordProtection();

    if (!needsPassword) {
        console.log('密码验证通过，开始初始化播放器');

        // 解析URL参数
        parseUrlParams();

        // 初始化播放器
        initializePlayer();

        // 设置事件监听器
        setupEventListeners();

        // 加载视频
        loadVideo();
    } else {
        console.log('需要密码验证，等待用户输入');
    }

    console.log('YouTV 播放器初始化完成');
});

// 密码保护检查
function checkPasswordProtection() {
    const passwordHash = window.APP_CONFIG?.PASSWORD_HASH;
    const savedHash = localStorage.getItem('passwordVerified');

    // 检查URL参数中的验证状态
    const urlParams = new URLSearchParams(window.location.search);
    const isVerifiedFromMain = urlParams.get('verified') === 'true';

    console.log('播放器密码检查:', {
        passwordHash: passwordHash ? passwordHash.substring(0, 10) + '...' : 'none',
        savedHash: savedHash ? savedHash.substring(0, 10) + '...' : 'none',
        isEqual: savedHash === passwordHash,
        verifiedFromMain: isVerifiedFromMain
    });

    // 如果没有设置密码，直接通过
    if (!passwordHash || passwordHash.trim() === '' || passwordHash === '{{PASSWORD}}') {
        console.log('无需密码验证');
        isPasswordVerified = true;
        return true;
    }

    // 如果从主页面跳转且已验证，直接通过
    if (isVerifiedFromMain && savedHash === passwordHash) {
        console.log('从主页面跳转，密码验证成功');
        isPasswordVerified = true;
        return true;
    }

    // 如果已经验证过，直接通过
    if (savedHash === passwordHash) {
        console.log('密码验证成功');
        isPasswordVerified = true;
        return true;
    }

    // 需要验证密码
    console.log('需要密码验证，显示密码框');
    showPasswordModal();
    return false;
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

                console.log('密码验证成功，开始初始化播放器');

                // 解析URL参数
                parseUrlParams();

                // 初始化播放器
                initializePlayer();

                // 设置事件监听器
                setupEventListeners();

                // 加载视频
                loadVideo();
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

// 密码相关辅助函数
function showPasswordError(message) {
    const error = document.getElementById('passwordError');
    error.textContent = message;
    error.classList.remove('hidden');
}

function hidePasswordError() {
    const error = document.getElementById('passwordError');
    error.classList.add('hidden');
}

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

// 解析URL参数
function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    currentVideoTitle = urlParams.get('title') || '未知视频';
    currentSourceCode = urlParams.get('source') || '';
    currentEpisodeIndex = parseInt(urlParams.get('index')) || 0;
    currentVideoId = urlParams.get('id') || '';

    const videoUrl = urlParams.get('url');
    if (videoUrl) {
        currentVideo = {
            url: decodeURIComponent(videoUrl),
            name: `第${currentEpisodeIndex + 1}集`
        };
    }

    // 设置返回按钮
    const backUrl = urlParams.get('back');
    const backBtn = document.getElementById('backBtn');

    if (backBtn) {
        backBtn.onclick = function() {
            // 优先使用提供的返回URL
            if (backUrl) {
                window.location.href = decodeURIComponent(backUrl);
                return;
            }

            // 检查浏览器历史记录
            if (window.history.length > 1 && document.referrer) {
                // 如果有历史记录且来源是本站，使用浏览器返回
                const referrerUrl = new URL(document.referrer);
                const currentUrl = new URL(window.location.href);

                if (referrerUrl.origin === currentUrl.origin) {
                    window.history.back();
                    return;
                }
            }

            // 默认返回首页
            window.location.href = '/';
        };
    }

    // 更新页面标题
    document.title = `${currentVideoTitle} - YouTV 播放器`;
}

// 初始化播放器
function initializePlayer() {
    const video = document.getElementById('videoPlayer');

    // 设置播放器配置
    autoPlayNext = localStorage.getItem('autoPlayNext') === 'true';
    const autoPlayCheckbox = document.getElementById('autoPlay');
    if (autoPlayCheckbox) {
        autoPlayCheckbox.checked = autoPlayNext;
    }

    // 播放器事件监听
    video.addEventListener('loadstart', function() {
        showPlayerLoading();
    });

    video.addEventListener('canplay', function() {
        hidePlayerLoading();
        hidePlayerError();
    });

    video.addEventListener('error', function(e) {
        console.error('视频播放错误:', e);
        showPlayerError();
    });

    video.addEventListener('ended', function() {
        if (autoPlayNext) {
            playNextEpisode();
        }
    });

    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 设置事件监听器
function setupEventListeners() {
    // 播放控制按钮
    const prevBtn = document.getElementById('prevEpisode');
    const nextBtn = document.getElementById('nextEpisode');
    const retryBtn = document.getElementById('retryBtn');
    const autoPlayCheckbox = document.getElementById('autoPlay');
    const toggleOrderBtn = document.getElementById('toggleEpisodeOrder');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousEpisode);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', playNextEpisode);
    }

    if (retryBtn) {
        retryBtn.addEventListener('click', retryVideo);
    }

    if (autoPlayCheckbox) {
        autoPlayCheckbox.addEventListener('change', function() {
            autoPlayNext = this.checked;
            localStorage.setItem('autoPlayNext', autoPlayNext);
        });
    }

    if (toggleOrderBtn) {
        toggleOrderBtn.addEventListener('click', toggleEpisodeOrder);
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
}

// 加载视频
async function loadVideo() {
    console.log('loadVideo 函数被调用');
    console.log('密码验证状态:', isPasswordVerified);
    console.log('当前视频信息:', currentVideo);
    console.log('APP_CONFIG:', window.APP_CONFIG);

    if (!isPasswordVerified) {
        console.log('密码未验证，跳过视频加载');
        return;
    }

    if (!currentVideo || !currentVideo.url) {
        console.error('无效的视频信息:', currentVideo);
        showPlayerError('无效的视频链接');
        return;
    }

    try {
        console.log('开始加载视频流程...');

        // 更新UI信息
        updateVideoInfo();

        // 如果有视频ID，加载完整的剧集列表
        if (currentVideoId && currentSourceCode) {
            console.log('加载剧集列表...');
            await loadEpisodesList();
        }

        // 加载视频流
        console.log('准备加载视频流:', currentVideo.url);
        await loadVideoStream(currentVideo.url);

    } catch (error) {
        console.error('加载视频失败:', error);
        showPlayerError('视频加载失败: ' + error.message);
    }
}

// 更新视频信息显示
function updateVideoInfo() {
    const titleEl = document.getElementById('videoTitle');
    const currentEpisodeEl = document.getElementById('currentEpisode');
    const sourceEl = document.getElementById('videoSource');

    if (titleEl) {
        titleEl.textContent = currentVideoTitle;
    }

    if (currentEpisodeEl) {
        currentEpisodeEl.textContent = currentVideo?.name || `第${currentEpisodeIndex + 1}集`;
    }

    if (sourceEl) {
        // 从localStorage获取源名称或使用默认值
        sourceEl.textContent = getSourceName(currentSourceCode);
    }
}

// 获取源名称
function getSourceName(sourceCode) {
    if (sourceCode.startsWith('custom_')) {
        return '自定义源';
    }

    // 这里可以添加内置源的名称映射
    const sourceNames = {
        'tyyszy': '太阳影视',
        'bfzy': '暴风影视',
        'dyttzy': '大雅影视',
        'ruyi': '如意影视'
    };

    return sourceNames[sourceCode] || '未知源';
}

// 加载剧集列表
async function loadEpisodesList() {
    try {
        showEpisodeLoading(true);

        // 构建请求参数
        const params = new URLSearchParams({
            id: currentVideoId,
            source: currentSourceCode
        });

        // 如果是自定义API，添加额外参数
        if (currentSourceCode.startsWith('custom_')) {
            const customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]');
            const customIndex = parseInt(currentSourceCode.replace('custom_', ''));
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

        if (data.code === 200 && data.episodes) {
            currentEpisodes = data.episodes;
            renderEpisodesList();
            updateNavigationButtons();
        }

    } catch (error) {
        console.error('加载剧集列表失败:', error);
        showToast('加载剧集列表失败', 'error');
    } finally {
        showEpisodeLoading(false);
    }
}

// 渲染剧集列表
function renderEpisodesList() {
    const container = document.getElementById('episodesList');

    if (!currentEpisodes || currentEpisodes.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <p>暂无剧集信息</p>
            </div>
        `;
        return;
    }

    // 根据排序状态处理剧集列表
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;

    const episodesHtml = episodes.map((episode, index) => {
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
        const isActive = realIndex === currentEpisodeIndex;

        return `
            <button class="w-full text-left p-3 rounded-lg transition-colors ${
                isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }" onclick="playEpisode(${realIndex})">
                <div class="font-medium">${escapeHtml(episode.name)}</div>
                ${isActive ? '<div class="text-xs text-blue-200 mt-1">正在播放</div>' : ''}
            </button>
        `;
    }).join('');

    container.innerHTML = episodesHtml;
}

// 加载视频流
async function loadVideoStream(videoUrl) {
    const video = document.getElementById('videoPlayer');

    try {
        console.log('开始加载视频:', videoUrl);
        showPlayerLoading();

        // 验证视频URL
        if (!videoUrl || typeof videoUrl !== 'string') {
            throw new Error('无效的视频URL');
        }

        // 清理之前的HLS实例
        if (hls) {
            hls.destroy();
            hls = null;
        }

        // 处理代理URL
        const proxyUrl = window.APP_CONFIG.PROXY_URL + encodeURIComponent(videoUrl);
        console.log('代理URL:', proxyUrl);

        // 测试代理连接
        try {
            console.log('测试代理连接...');
            const testResponse = await fetch(proxyUrl, {
                method: 'HEAD',
                timeout: 5000
            });
            console.log('代理连接测试结果:', testResponse.status, testResponse.statusText);
        } catch (testError) {
            console.error('代理连接测试失败:', testError);
            showPlayerError('代理服务器连接失败，请检查网络连接');
            return;
        }

        // 检查是否为HLS流
        if (videoUrl.includes('.m3u8') || videoUrl.includes('m3u8')) {
            if (window.Hls && window.Hls.isSupported()) {
                // 使用HLS.js - 优化配置（减少超时时间）
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 30,
                    maxBufferLength: 20,
                    maxMaxBufferLength: 300,
                    maxBufferSize: 30 * 1000 * 1000,
                    maxBufferHole: 0.5,
                    // 网络优化配置（减少超时时间）
                    manifestLoadingTimeOut: 8000,
                    manifestLoadingMaxRetry: 2,
                    manifestLoadingRetryDelay: 500,
                    levelLoadingTimeOut: 8000,
                    levelLoadingMaxRetry: 2,
                    levelLoadingRetryDelay: 500,
                    fragLoadingTimeOut: 8000,
                    fragLoadingMaxRetry: 3,
                    fragLoadingRetryDelay: 500,
                    // 启用自动质量切换
                    startLevel: -1,
                    autoStartLoad: true,
                    // 错误恢复配置
                    enableSoftwareAES: true,
                    enableWebVTT: false,
                    enableIMSC1: false,
                    enableCEA708Captions: false
                });

                console.log('HLS实例已创建，开始加载源:', proxyUrl);

                hls.loadSource(proxyUrl);
                hls.attachMedia(video);

                // 添加加载超时检测
                const loadingTimeout = setTimeout(() => {
                    console.error('视频加载超时');
                    showPlayerError('视频加载超时，请检查网络连接或尝试其他视频源');
                }, 15000); // 15秒超时

                // 监听事件
                hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
                    console.log('HLS manifest 解析成功');
                    clearTimeout(loadingTimeout);
                    hidePlayerLoading();
                    video.play().catch(e => {
                        console.log('自动播放被阻止:', e);
                        showToast('请点击播放按钮开始播放', 'info');
                    });
                });

                hls.on(window.Hls.Events.MANIFEST_LOADING, function() {
                    console.log('开始加载 HLS manifest');
                });

                hls.on(window.Hls.Events.LEVEL_SWITCHED, function(_, data) {
                    console.log('切换到质量级别:', data.level);
                });

                hls.on(window.Hls.Events.ERROR, function(_, data) {
                    console.error('HLS错误:', data);
                    clearTimeout(loadingTimeout);
                    if (data.fatal) {
                        handleHlsError(data);
                    } else {
                        // 非致命错误，记录但继续播放
                        console.warn('HLS非致命错误:', data.details);
                    }
                });

                // 添加缓冲事件监听
                hls.on(window.Hls.Events.BUFFER_APPENDING, function() {
                    console.log('开始添加缓冲数据');
                    hidePlayerLoading();
                });

                hls.on(window.Hls.Events.BUFFER_APPENDED, function() {
                    console.log('缓冲数据添加完成');
                    hidePlayerLoading();
                });

                hls.on(window.Hls.Events.FRAG_LOADED, function() {
                    console.log('视频片段加载完成');
                    hidePlayerLoading();
                });

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari原生支持
                console.log('使用Safari原生HLS支持');
                video.src = proxyUrl;

                const safariTimeout = setTimeout(() => {
                    console.error('Safari HLS加载超时');
                    showPlayerError('视频加载超时，请检查网络连接');
                }, 15000);

                video.addEventListener('loadedmetadata', function() {
                    console.log('Safari HLS元数据加载完成');
                    clearTimeout(safariTimeout);
                    hidePlayerLoading();
                });

                video.addEventListener('error', function(e) {
                    console.error('Safari HLS加载错误:', e);
                    clearTimeout(safariTimeout);
                    showPlayerError('HLS视频加载失败，请尝试其他视频源');
                });
            } else {
                throw new Error('浏览器不支持HLS播放');
            }
        } else {
            // 普通视频文件 (mp4, webm, avi等)
            console.log('加载普通视频文件');
            video.src = proxyUrl;

            const videoTimeout = setTimeout(() => {
                console.error('普通视频加载超时');
                showPlayerError('视频加载超时，请检查网络连接或尝试其他视频源');
            }, 15000);

            video.addEventListener('loadedmetadata', function() {
                console.log('视频元数据加载完成');
                clearTimeout(videoTimeout);
                hidePlayerLoading();
            });

            video.addEventListener('canplay', function() {
                console.log('视频可以开始播放');
                clearTimeout(videoTimeout);
                hidePlayerLoading();
            });

            video.addEventListener('error', function(e) {
                console.error('视频加载错误:', e);
                clearTimeout(videoTimeout);
                showPlayerError('视频文件加载失败，请尝试其他视频源');
            });

            video.addEventListener('loadstart', function() {
                console.log('开始加载视频文件');
            });
        }

    } catch (error) {
        console.error('加载视频流失败:', error);
        showPlayerError(error.message || '视频加载失败');
    }
}

// HLS错误重试计数器
let hlsRetryCount = 0;
const MAX_HLS_RETRIES = 3;

// 处理HLS错误
function handleHlsError(data) {
    if (!window.Hls || !hls) {
        showPlayerError('HLS播放器未加载');
        return;
    }

    console.error('HLS致命错误:', data);
    hlsRetryCount++;

    switch (data.type) {
        case window.Hls.ErrorTypes.NETWORK_ERROR:
            console.log(`网络错误，尝试恢复... (${hlsRetryCount}/${MAX_HLS_RETRIES})`);
            if (hlsRetryCount <= MAX_HLS_RETRIES) {
                setTimeout(() => {
                    if (hls) {
                        hls.startLoad();
                    }
                }, 1000 * hlsRetryCount); // 递增延迟
            } else {
                showPlayerError('网络连接失败，请检查网络或稍后重试');
                resetHlsRetryCount();
            }
            break;

        case window.Hls.ErrorTypes.MEDIA_ERROR:
            console.log(`媒体错误，尝试恢复... (${hlsRetryCount}/${MAX_HLS_RETRIES})`);
            if (hlsRetryCount <= MAX_HLS_RETRIES) {
                setTimeout(() => {
                    if (hls) {
                        hls.recoverMediaError();
                    }
                }, 500 * hlsRetryCount); // 递增延迟
            } else {
                showPlayerError('视频解码失败，请尝试刷新页面');
                resetHlsRetryCount();
            }
            break;

        case window.Hls.ErrorTypes.KEY_SYSTEM_ERROR:
            showPlayerError('视频加密错误，无法播放此内容');
            resetHlsRetryCount();
            break;

        case window.Hls.ErrorTypes.MUX_ERROR:
            showPlayerError('视频格式错误，无法播放此内容');
            resetHlsRetryCount();
            break;

        default:
            console.error('无法恢复的HLS错误:', data);
            showPlayerError('视频播放失败: ' + (data.details || '未知错误'));
            resetHlsRetryCount();
            break;
    }
}

// 重置HLS重试计数器
function resetHlsRetryCount() {
    hlsRetryCount = 0;
}

// 播放指定剧集
function playEpisode(episodeIndex) {
    if (!currentEpisodes || episodeIndex < 0 || episodeIndex >= currentEpisodes.length) {
        return;
    }

    currentEpisodeIndex = episodeIndex;
    currentVideo = currentEpisodes[episodeIndex];

    // 更新URL参数
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('index', episodeIndex);
    urlParams.set('url', encodeURIComponent(currentVideo.url));
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);

    // 更新UI
    updateVideoInfo();
    renderEpisodesList();
    updateNavigationButtons();

    // 加载新视频
    loadVideoStream(currentVideo.url);
}

// 播放上一集
function playPreviousEpisode() {
    if (currentEpisodeIndex > 0) {
        playEpisode(currentEpisodeIndex - 1);
    }
}

// 播放下一集
function playNextEpisode() {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
        playEpisode(currentEpisodeIndex + 1);
    }
}

// 重试视频
function retryVideo() {
    if (currentVideo && currentVideo.url) {
        resetHlsRetryCount(); // 重置重试计数器
        loadVideoStream(currentVideo.url);
    }
}

// 切换剧集排序
function toggleEpisodeOrder() {
    episodesReversed = !episodesReversed;
    renderEpisodesList();

    // 更新按钮文本
    const toggleBtn = document.getElementById('toggleEpisodeOrder');
    if (toggleBtn) {
        const text = episodesReversed ? '正序排列' : '倒序排列';
        toggleBtn.innerHTML = `
            <svg class="w-4 h-4 inline mr-1 transform ${episodesReversed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
            ${text}
        `;
    }
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevEpisode');
    const nextBtn = document.getElementById('nextEpisode');

    if (prevBtn) {
        prevBtn.disabled = currentEpisodeIndex <= 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentEpisodeIndex >= currentEpisodes.length - 1;
    }
}

// 显示播放器加载状态
function showPlayerLoading() {
    const loading = document.getElementById('playerLoading');
    const error = document.getElementById('playerError');

    loading.classList.remove('hidden');
    error.classList.add('hidden');
}

// 隐藏播放器加载状态
function hidePlayerLoading() {
    const loading = document.getElementById('playerLoading');
    loading.classList.add('hidden');
}

// 显示播放器错误
function showPlayerError(message = '视频加载失败') {
    const loading = document.getElementById('playerLoading');
    const error = document.getElementById('playerError');

    loading.classList.add('hidden');
    error.classList.remove('hidden');

    // 更新错误信息
    const errorText = error.querySelector('p');
    if (errorText) {
        errorText.textContent = message;
    }

    // 显示Toast通知
    showToast(message, 'error', 5000);

    console.error('播放器错误:', message);
}

// 隐藏播放器错误
function hidePlayerError() {
    const error = document.getElementById('playerError');
    error.classList.add('hidden');
}

// 显示剧集加载状态
function showEpisodeLoading(show) {
    const loading = document.getElementById('episodeLoading');
    if (loading) {
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

// 键盘快捷键处理
function handleKeyboardShortcuts(e) {
    const video = document.getElementById('videoPlayer');

    // 如果焦点在输入框中，不处理快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch (e.key) {
        case ' ': // 空格键 - 播放/暂停
            e.preventDefault();
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
            break;

        case 'ArrowLeft': // 左箭头 - 快退10秒
            e.preventDefault();
            video.currentTime = Math.max(0, video.currentTime - 10);
            break;

        case 'ArrowRight': // 右箭头 - 快进10秒
            e.preventDefault();
            video.currentTime = Math.min(video.duration, video.currentTime + 10);
            break;

        case 'ArrowUp': // 上箭头 - 音量增加
            e.preventDefault();
            video.volume = Math.min(1, video.volume + 0.1);
            break;

        case 'ArrowDown': // 下箭头 - 音量减少
            e.preventDefault();
            video.volume = Math.max(0, video.volume - 0.1);
            break;

        case 'm':
        case 'M': // M键 - 静音/取消静音
            e.preventDefault();
            video.muted = !video.muted;
            break;

        case 'f':
        case 'F': // F键 - 全屏/退出全屏
            e.preventDefault();
            toggleFullscreen();
            break;

        case 'Escape': // ESC键 - 退出全屏或返回
            e.preventDefault();
            if (document.fullscreenElement) {
                // 如果在全屏模式，退出全屏
                document.exitFullscreen();
            } else {
                // 如果不在全屏模式，执行返回操作
                const backBtn = document.getElementById('backBtn');
                if (backBtn && backBtn.onclick) {
                    backBtn.onclick();
                }
            }
            break;

        case 'p':
        case 'P': // P键 - 上一集
            e.preventDefault();
            playPreviousEpisode();
            break;

        case 'n':
        case 'N': // N键 - 下一集
            e.preventDefault();
            playNextEpisode();
            break;
    }
}

// 切换全屏
function toggleFullscreen() {
    const video = document.getElementById('videoPlayer');

    if (!document.fullscreenElement) {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

// 页面卸载时清理资源
window.addEventListener('beforeunload', function() {
    if (hls) {
        hls.destroy();
        hls = null;
    }
});

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('播放器错误:', e.error);
    showToast('播放器发生错误', 'error');
});

// 全局未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(e) {
    console.error('播放器Promise拒绝:', e.reason);
    showToast('网络请求失败', 'error');
});

// 导出全局函数供HTML调用
window.playEpisode = playEpisode;
window.playPreviousEpisode = playPreviousEpisode;
window.playNextEpisode = playNextEpisode;
window.retryVideo = retryVideo;
window.toggleEpisodeOrder = toggleEpisodeOrder;
