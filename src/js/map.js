// map.js - 地图相关功能

// 初始化地图
function initMap() {
    // 创建地图实例，禁用默认缩放控制
    map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false,
        crs: L.CRS.Simple  // 使用简单坐标系统
    }).setView(userState.lastCenter, userState.lastZoom);

    // 确保移除所有可能的控制元素
    setTimeout(() => {
        const zoomControls = document.querySelectorAll('.leaflet-control-zoom');
        zoomControls.forEach(control => control.remove());
    }, 100);

    // 添加地图图层
    // 首先获取城市配置
    const cityConfig = getCityConfig(currentCity);
    
    // 创建自定义地图图层
    // 计算地图边界，使坐标xy增加比例为1
    const mapBounds = [
        [cityConfig.y, cityConfig.x], 
        [cityConfig.maxY, cityConfig.maxX]
    ];
    
    // 添加本地地图图片
    L.imageOverlay(cityConfig.mapUrl, mapBounds).addTo(map);
    
    // 设置地图边界，防止拖动超出地图范围
    map.setMaxBounds(mapBounds);
    
    // 设置地图视图为全图显示
    map.fitBounds(mapBounds);

    // 加载当前城市的标记
    loadCityMarkers(currentCity);

    // 地图移动结束事件
    map.on('moveend', function() {
        // 保存用户状态
        saveUserState();
    });

    // 鼠标移动事件，显示坐标
    map.on('mousemove', function(e) {
        document.getElementById('mouse-coordinates').textContent = 
            '坐标: ' + e.latlng.lng.toFixed(0) + ', ' + e.latlng.lat.toFixed(0);
    });

    // 鼠标离开地图时清空坐标显示
    map.on('mouseout', function() {
        document.getElementById('mouse-coordinates').textContent = '';
    });
}

// 切换城市
function switchCity(city) {
    console.log('切换城市:', city);
    currentCity = city;
    // 清除当前地图上的所有标记
    clearMarkers();
    console.log('已清除所有标记');
    // 更新地图配置
    const cityConfig = getCityConfig(city);
    if (cityConfig) {
        console.log('城市配置已加载:', cityConfig);
        // 移除所有图层（保留地图容器）
        map.eachLayer(function(layer) {
            if (!(layer instanceof L.Control)) {
                map.removeLayer(layer);
            }
        });
    
        // 创建自定义地图图层
        // 计算地图边界，使坐标xy增加比例为1
        const mapBounds = [
            [cityConfig.y, cityConfig.x],
            [cityConfig.maxY, cityConfig.maxX]
        ];
        
        // 设置地图最大坐标值
        const maxBounds = [
            [0, 0],
            [cityConfig.maxY, cityConfig.maxX]
        ];
    
        // 添加本地地图图片
        L.imageOverlay(cityConfig.mapUrl, mapBounds).addTo(map);
    
        // 设置地图边界和视图
        map.setMaxBounds(maxBounds);
        map.fitBounds(mapBounds);
    
        // 延迟加载城市标记，确保地图已更新
        setTimeout(function() {
            loadCityMarkers(city);
        }, 300);
    
        // 重新绑定鼠标移动事件，显示坐标
        map.off('mousemove').on('mousemove', function(e) {
            document.getElementById('mouse-coordinates').textContent = 
                '坐标: ' + e.latlng.lng.toFixed(0) + ', ' + e.latlng.lat.toFixed(0);
        });
    
        // 鼠标离开地图时清空坐标显示
        map.off('mouseout').on('mouseout', function() {
            document.getElementById('mouse-coordinates').textContent = '';
        });
    } else {
        console.error('未找到城市配置:', city);
    }
}

// 加载城市标记
function loadCityMarkers(city) {
    console.log('加载城市标记:', city);
    // 加载资源点标记
    if (resourcesData[city]) {
        console.log('找到资源数据，数量:', resourcesData[city].length);
        resourcesData[city].forEach(resource => {
            addResourceMarker(resource);
        });
    } else {
        console.error('未找到城市资源数据:', city);
        console.log('可用城市列表:', Object.keys(resourcesData));
    }

    // 加载抽奖机标记
    if (machinesData[city]) {
        machinesData[city].forEach(machine => {
            addMachineMarker(machine);
        });
    } else {
        console.error('未找到城市抽奖机数据:', city);
    }
}

// 添加资源点标记
function addResourceMarker(resource) {
    const icon = L.icon({
        iconUrl: `src/img/icons/${resource.name}.png`,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
    });

    // 遍历坐标列表，为每个坐标创建标记
    resource.coordinates.forEach(coords => {
        const marker = L.marker([coords[1], coords[0]], { icon: icon }).addTo(map);
        
        // 为标记元素添加data-type属性，用于筛选
        marker.getElement().setAttribute('data-type', resource.name);
        
        // 添加CSS类，用于筛选
        marker.getElement().classList.add('resource-marker');

        // 绑定弹窗
        marker.bindPopup(`
            <b>${resource.name}</b><br>
            刷新时间: ${resource.refreshTime}分钟<br>
            坐标: ${coords[0]}, ${coords[1]}
        `);
    });
}

// 添加抽奖机标记
function addMachineMarker(machine) {
    // 抽奖机图标
    const icon = L.icon({
        iconUrl: 'src/img/icons/抽奖机.png',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker([machine.y, machine.x], { icon: icon }).addTo(map);

    // 绑定弹窗
    marker.bindPopup(`
        <b>${machine.name}</b><br>
        奖品数量: ${machine.prizes.length}<br>
        坐标: ${machine.x}, ${machine.y}
    `);

    // 点击事件，显示详情
    marker.on('click', function() {
        showMachineDetail(machine);
    });
}

// 清除所有标记
function clearMarkers() {
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
}

// 获取城市配置
function getCityConfig(city) {
    // 城市默认配置
    const cityConfigs = {
        '森之国': {
            center: [500, 500], // 地图中心坐标
            zoom: 12,
            mapUrl: 'src/img/森之国.jpg', // 本地地图图片路径
            x: 20,
            y: 12,
            maxX: 1000,
            maxY: 1000
        },
        '山之国': {
            center: [500, 500], // 地图中心坐标
            zoom: 12,
            mapUrl: 'src/img/山之国.jpg', // 本地地图图片路径
            x: 20,
            y: 12,
            maxX: 1000,
            maxY: 1000
        },
        '泽之国': {
            center: [500, 500], // 地图中心坐标
            zoom: 12,
            mapUrl: 'src/img/泽之国.jpg', // 本地地图图片路径
            x: 20,
            y: 12,
            maxX: 1000,
            maxY: 1000
        },
        '龙之国': {
            center: [110, 130], // 地图中心坐标
            zoom: 5,
            mapUrl: 'src/img/龙之国.jpg', // 本地地图图片路径
            x: 19,
            y: 12,
            maxX: 265,
            maxY: 280
        }
    };

    return cityConfigs[city] || cityConfigs['森之国'];
}

// 显示资源详情
function showResourceDetail(resource) {
    document.getElementById('resource-name').textContent = resource.name;
    document.getElementById('resource-refresh').textContent = resource.refreshTime + '分钟';

    // 隐藏不再使用的元素
    document.getElementById('resource-type').closest('div').style.display = 'none';
    document.getElementById('resource-amount').closest('div').style.display = 'none';

    document.getElementById('resource-detail').style.display = 'block';
}

// 显示抽奖机详情
function showMachineDetail(machine) {
    document.getElementById('machine-name').textContent = machine.name;

    const prizesList = document.getElementById('prizes-list');
    prizesList.innerHTML = '';

    // 生成奖品列表
    machine.prizes.forEach(prize => {
        const li = document.createElement('li');
        const isClaimed = userState.claimedPrizes[machine.machineId] && userState.claimedPrizes[machine.machineId].includes(prize.prizeId);

        li.innerHTML = `
            <span class="${isClaimed ? 'prize-claimed' : 'prize-unclaimed'}">${prize.name}</span>
            <input type="checkbox" class="prize-checkbox" data-machine-id="${machine.machineId}" data-prize-id="${prize.prizeId}" ${isClaimed ? 'checked' : ''}>
        `;

        prizesList.appendChild(li);
    });

    // 添加复选框事件
    document.querySelectorAll('.prize-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const machineId = this.getAttribute('data-machine-id');
            const prizeId = this.getAttribute('data-prize-id');
            const isChecked = this.checked;

            // 更新用户状态
            updateClaimedPrize(machineId, prizeId, isChecked);

            // 更新UI
            const span = this.previousElementSibling;
            if (isChecked) {
                span.classList.add('prize-claimed');
                span.classList.remove('prize-unclaimed');
            } else {
                span.classList.add('prize-unclaimed');
                span.classList.remove('prize-claimed');
            }
        });
    });

    document.getElementById('machine-detail').style.display = 'block';
}

// 更新已抽奖品状态
function updateClaimedPrize(machineId, prizeId, isClaimed) {
    if (!userState.claimedPrizes[machineId]) {
        userState.claimedPrizes[machineId] = [];
    }

    if (isClaimed) {
        if (!userState.claimedPrizes[machineId].includes(prizeId)) {
            userState.claimedPrizes[machineId].push(prizeId);
        }
    } else {
        userState.claimedPrizes[machineId] = userState.claimedPrizes[machineId].filter(id => id !== prizeId);
    }

    // 保存用户状态
    saveUserState();
}