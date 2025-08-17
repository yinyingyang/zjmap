// main.js - 程序入口文件

// 导入其他模块
// 注意：在浏览器环境中，这些导入语句需要通过模块打包工具处理
// 或在HTML中按顺序引入脚本文件

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 从cookie获取默认选中的国家，如果没有则默认为第一个
    const savedState = getCookie('userState');
    let defaultCountry = '森之国';
    if (savedState) {
        try {
            const userState = JSON.parse(savedState);
            defaultCountry = userState.lastCountry || '森之国';
        } catch (error) {
            console.error('解析用户状态出错:', error);
        }
    }
    
    // 设置默认选中的单选框
    const defaultRadio = document.querySelector(`input[name="country"][value="${defaultCountry}"]`);
    if (defaultRadio) {
        defaultRadio.checked = true;
    } else {
        // 如果没有找到对应的单选框，则默认选中第一个
        const firstRadio = document.querySelector('input[name="country"]');
        if (firstRadio) {
            firstRadio.checked = true;
            defaultCountry = firstRadio.value;
        }
    }
    // 初始化数据
    initData()
        .then(() => {
            // 加载用户状态
            loadUserState();
            // 初始化地图
            initMap();
            // 初始化搜索功能
            initSearch();
            // 切换到默认国家
            switchCountry(defaultCountry);
            console.log('杖剑传说地图加载完成');
        })
        .catch(error => {
            console.error('初始化失败:', error);
            alert('地图加载失败，请刷新页面重试');
        });

    // 侧边栏交互
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);

    // 打开侧边栏
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        // 隐藏侧边栏切换按钮
        sidebarToggle.style.display = 'none';
    });

    // 关闭侧边栏
    function closeSidebarFunc() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        // 显示侧边栏切换按钮
        sidebarToggle.style.display = 'block';
    }

    closeSidebar.addEventListener('click', closeSidebarFunc);
    sidebarOverlay.addEventListener('click', closeSidebarFunc);

    // 按下ESC键关闭侧边栏
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebarFunc();
        }
    });

    // 国家切换事件
    document.querySelectorAll('input[name="country"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const selectedCountry = this.value;
                switchCountry(selectedCountry);
                // 保存用户状态
                userState.lastCountry = selectedCountry;
                saveUserState();
            }
        });
    })

    // 地图缩放事件 (只在元素存在时添加)
    const zoomInBtn = document.getElementById('zoom-in');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', function() {
            map.zoomIn();
            // 保存用户状态
            saveUserState();
        });
    }

    const zoomOutBtn = document.getElementById('zoom-out');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', function() {
            map.zoomOut();
            // 保存用户状态
            saveUserState();
        });
    }

    // 搜索按钮事件 (只在元素存在时添加)
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            performSearch();
        });
    }

    // 搜索输入框回车事件 (只在元素存在时添加)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // 关闭模态框事件
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            document.getElementById(modalId).style.display = 'none';
        });
    });

    // 点击空白处关闭模态框
    window.addEventListener('click', function(e) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // 地图移动结束事件将在initMap函数中设置
});

// 全局变量
let map = null;
let currentCountry = '森之国';
let resourcesData = {};
let machinesData = {};
let userState = {
    lastCountry: '森之国',
    lastCenter: [0, 0],
    lastZoom: 10,
    claimedPrizes: {}
};