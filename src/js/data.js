// data.js - 数据加载和用户状态管理

// 初始化数据
function initData() {
    return Promise.all([
        loadResourcesData(),
        loadMachinesData()
    ]);
}

// 加载资源点数据
function loadResourcesData() {
    return fetch('src/data/resources.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('资源数据加载失败');
            }
            return response.json();
        })
        .then(data => {
            resourcesData = data;
            console.log('资源数据加载成功，可用国家:', Object.keys(resourcesData));
        })
        .catch(error => {
            console.error('加载资源数据出错:', error);
        });
}

// 加载抽奖机数据
function loadMachinesData() {
    return fetch('src/data/machines.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('抽奖机数据加载失败');
            }
            return response.json();
        })
        .then(data => {
            machinesData = data;
            console.log('抽奖机数据加载成功');
        })
        .catch(error => {
            console.error('加载抽奖机数据出错:', error);
        });
}

// 加载用户状态
function loadUserState() {
    try {
        const savedState = getCookie('userState');
        if (savedState) {
            userState = JSON.parse(savedState);
            currentCountry = userState.lastCountry || '森之国';
            console.log('用户状态加载成功');
        } else {
            console.log('没有找到保存的用户状态');
        }
    } catch (error) {
        console.error('加载用户状态出错:', error);
        // 重置为默认状态
        userState = {
        lastCountry: '森之国',
        lastCenter: [0, 0],
        lastZoom: 5,
        claimedPrizes: {}
    };
    currentCountry = '森之国';
    }
}

// 保存用户状态
function saveUserState() {
    try {
        userState.lastCountry = currentCountry;
        userState.lastCenter = map.getCenter();
        userState.lastZoom = map.getZoom();

        setCookie('userState', JSON.stringify(userState), 365);
        console.log('用户状态保存成功');
    } catch (error) {
        console.error('保存用户状态出错:', error);
    }
}

// 设置Cookie
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '')  + expires + '; path=/';
}

// 获取Cookie
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

// 删除Cookie
function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/';
}
