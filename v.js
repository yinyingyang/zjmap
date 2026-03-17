// 视频自动全屏并取消静音脚本
// 使用方法：将此脚本保存为 .js 文件，或在浏览器控制台中运行
// 也可以创建为书签脚本，在视频页面点击运行

(function() {
    'use strict';

    function activateVideoPlayer() {
        // 查找页面上的视频元素
        const videos = document.querySelectorAll('video');
        
        if (videos.length === 0) {
            console.log('未找到视频元素，尝试其他方法...');
            // 尝试查找嵌入的iframe（如优酷视频）
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const iframeVideos = iframeDoc.querySelectorAll('video');
                    if (iframeVideos.length > 0) {
                        handleVideos(iframeVideos);
                        return;
                    }
                } catch (e) {
                    console.log('无法访问iframe:', e.message);
                }
            }
            alert('未找到视频元素，请确保页面已加载视频');
            return;
        }

        handleVideos(videos);
    }

    function handleVideos(videos) {
        videos.forEach(video => {
            // 取消静音
            video.muted = false;
            video.volume = 1.0;
            
            // 尝试播放视频（浏览器可能需要用户交互）
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('自动播放被阻止:', error.message);
                });
            }
            
            console.log('已取消静音，音量设为100%');
        });

        // 尝试全屏
        enterFullscreen();
    }

    function enterFullscreen() {
        const video = document.querySelector('video') || document.querySelector('.video-player');
        
        if (video) {
            // 尝试视频元素的全屏
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitEnterFullscreen) {
                // iOS Safari
                video.webkitEnterFullscreen();
            } else if (video.webkitRequestFullscreen) {
                // 旧版iOS
                video.webkitRequestFullscreen();
            } else if (video.mozRequestFullScreen) {
                video.mozRequestFullScreen();
            } else if (video.msRequestFullscreen) {
                video.msRequestFullscreen();
            }
        }

        // 尝试页面全屏
        const html = document.documentElement;
        if (html.requestFullscreen) {
            html.requestFullscreen();
        } else if (html.webkitRequestFullscreen) {
            html.webkitRequestFullscreen();
        }

        // 尝试查找全屏按钮并点击
        const fullscreenButtons = document.querySelectorAll('.fullscreen-btn, .fullscreen, [class*="fullscreen"], [aria-label*="全屏"]');
        fullscreenButtons.forEach(btn => {
            if (btn && typeof btn.click === 'function') {
                btn.click();
                console.log('已点击全屏按钮');
            }
        });

        console.log('全屏操作已执行');
    }

    // 监听视频加载
    function observeNewVideos() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'VIDEO') {
                        console.log('检测到新视频元素');
                        activateVideoPlayer();
                    }
                    if (node.querySelector && node.querySelector('video')) {
                        console.log('检测到包含视频的元素');
                        activateVideoPlayer();
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 执行主函数
    console.log('开始处理视频...');
    activateVideoPlayer();
    observeNewVideos();

    console.log('脚本已运行。如果未找到视频，请等待页面完全加载后重新运行。');
    console.log('提示：在iPad上，可能需要手动点击视频来触发全屏和播放。');
})();
