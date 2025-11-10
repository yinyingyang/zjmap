// map.js - 地图相关功能

// 初始化地图
function initMap() {
    // 创建地图实例，禁用默认自带缩放控制
    map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false,
        crs: L.CRS.Simple,  // 使用简单坐标系统
        minZoom: 2,  // 最小缩小倍数
        maxZoom: 5   // 最大放大倍数
    }).setView(userState.lastCenter, userState.lastZoom);

    // 确保移除所有可能的控制元素
    setTimeout(() => {
        const zoomControls = document.querySelectorAll('.leaflet-control-zoom');
        zoomControls.forEach(control => control.remove());
    }, 100);

}

// 切换国家
function switchCountry(country) {
    console.log('切换国家:', country);
    currentCountry = country;
    // 清除当前地图上的所有标记
    clearMarkers();
    console.log('已清除所有标记');
    // 更新地图配置
    const countryConfig = getCountryConfig(country);
    if (countryConfig) {
        console.log('国家配置已加载:', countryConfig);
        // 移除所有图层（保留地图容器）
        map.eachLayer(function(layer) {
            if (!(layer instanceof L.Control)) {
                map.removeLayer(layer);
            }
        });
    
        // 创建自定义地图图层
        // 计算地图边界，使坐标xy增加比例为1
        const mapBounds = [
            [countryConfig.y, countryConfig.x],
            [countryConfig.maxY, countryConfig.maxX]
        ];
    
        // 添加本地地图图片
        L.imageOverlay(countryConfig.mapUrl, mapBounds).addTo(map);
    
        // 设置地图边界和视图
        map.setMaxBounds(mapBounds);
        map.fitBounds(mapBounds);
        
        // 延迟加载国家标记，确保地图已更新
        setTimeout(function() {
            loadCountryMarkers(country);
        }, 300);
        let mouseCoordinates = document.getElementById('mouse-coordinates');
        // 重新绑定鼠标移动事件，显示坐标
        map.off('mousemove').on('mousemove', function(e) {
            x=e.latlng.lng;
            y=e.latlng.lat;
            // 检查坐标是否在有效范围内
            if (countryConfig && 
                x >= countryConfig.x && x <= countryConfig.maxX &&
                y >= countryConfig.y && y <= countryConfig.maxY) {
                mouseCoordinates.style.display = 'block';
                mouseCoordinates.textContent = 
                    '坐标: ' + 
                    x.toFixed(0) + ', ' + y.toFixed(0);
            } else {
                // 坐标超出范围时隐藏控件
                mouseCoordinates.style.display = 'none';
                mouseCoordinates.textContent = '';
            }
        });
    
        // 鼠标离开地图时清空坐标显示
        map.off('mouseout').on('mouseout', function() {
            mouseCoordinates.style.display = 'none';
            mouseCoordinates.textContent = '';
        });
        
        // 本地调试时添加鼠标点击事件，复制坐标到剪贴板
        if(/localhost|127.0.0.1/.test(window.location.href)) {
            map.off('mouseup').on('mouseup', function(e) {
                const textToCopy = mouseCoordinates.textContent;
                if (textToCopy) {
                    // 提取坐标部分，去除'坐标:'前缀
                    const coordinates = textToCopy.replace('坐标: ', '');
                    navigator.clipboard.writeText(`,[${coordinates}]`).then(() => {
                        console.log('坐标已复制到剪贴板');
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                }
            });
        }
        // 地图移动结束事件
        map.on('moveend', function() {
            // 保存用户状态
            saveUserState();
        });
    } else {
        console.error('未找到国家配置:', country);
    }
}

// 加载国家标记
function loadCountryMarkers(country) {
    console.log('加载国家标记:', country);
    // 加载资源点标记
    if (resourcesData[country]) {
        console.log('找到资源数据，数量:', Object.keys(resourcesData[country]).length);
        
        // 获取当前选中的资源类型
        const selectedResourceTypes = [];
        document.querySelectorAll('.resource-type-checkbox input:checked').forEach(checkbox => {
            selectedResourceTypes.push(checkbox.value);
        });
        
        // 如果没有选中的资源类型，隐藏所有资源点
        if (selectedResourceTypes.length === 0) {
            document.querySelectorAll('.resource-marker').forEach(marker => {
                marker.style.display = 'none';
            });
            return;
        }
        
        Object.keys(resourcesData[country]).forEach(resourceName => {
            const resource = resourcesData[country][resourceName];
            // 检查资源类型是否被选中
            if (selectedResourceTypes.includes(resourceName)) {
                // 为resource对象添加name属性
                resource.name = resourceName;
                addResourceMarker(resource);
            }
        });
    } else {
        console.error('未找到国家资源数据:', country);
        console.log('可用国家列表:', Object.keys(resourcesData));
    }

    // 加载抽奖机标记
    if (machinesData.machines && machinesData.machines[country]) {
        machinesData.machines[country].forEach(machine => {
            addMachineMarker(machine);
        });
    } else {
        console.error('未找到国家抽奖机数据:', country);
    }
}

// 添加资源点标记
function addResourceMarker(resource) {
    // 现在resource对象包含name属性，由loadCountryMarkers函数添加
    
    const icon = L.icon({
        iconUrl: `src/img/icons/${resource.name}.png`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    // 遍历坐标列表，为每个坐标创建标记
    resource.coordinates.forEach(coords => {
        const marker = L.marker([coords[1], coords[0]], { icon: icon }).addTo(map);
        
        // 为标记元素添加data-type属性，用于筛选
        marker.getElement().setAttribute('data-type', resource.name);
        
        // 添加CSS类，用于筛选
        marker.getElement().classList.add('resource-marker');
        
        // 默认显示标记
        marker.getElement().style.display = 'block';

        // 绑定弹窗
        marker.bindPopup(`
            <b>${resource.name}</b><br>
            坐标: ${coords[0]}, ${coords[1]}
        `);
    });
}

// 添加抽奖机标记
function addMachineMarker(machine) {
    // 抽奖机图标
    const icon = L.icon({
        iconUrl: 'src/img/icons/抽奖机.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const marker = L.marker([machine.y, machine.x], { icon: icon }).addTo(map);

    // 绑定弹窗
    const machineType = machine.type;
    const typeData = machinesData.types[machineType];
    const totalPrizeCount = typeData && typeData.prizes ? typeData.prizes.length : 0;
    
    // 计算已抽取的奖品数量
    const claimedPrizes = userState.claimedPrizes[machine.machineId] || [];
    const claimedCount = claimedPrizes.length;
    const remainingCount = totalPrizeCount - claimedCount;
    
    marker.bindPopup(`
        <b>${machine.name}</b><br>
        类型: ${machine.type}<br>
        奖品数量: ${remainingCount}/${totalPrizeCount}<br>
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

// 获取国家配置
function getCountryConfig(country) {
    // 城市默认配置
    const countryConfigs = {
        '森之国': {
            center: [114, 93], // 地图中心坐标
            mapUrl: 'src/img/森之国.jpg', // 本地地图图片路径
            x: -1,
            y: -1,
            maxX: 227,
            maxY: 187
        },
        '山之国': {
            center: [136.5, 104.5], // 地图中心坐标
            mapUrl: 'src/img/山之国.jpg', // 本地地图图片路径
            x: -1,
            y: -1,
            maxX: 273,
            maxY: 209
        },
        '泽之国': {
            center: [125, 125], // 地图中心坐标
            mapUrl: 'src/img/泽之国.jpg', // 本地地图图片路径
            x: 6,
            y: 4,
            maxX: 252,//225
            maxY: 240//233
        },
        '龙之国': {
            center: [110, 130], // 地图中心坐标
            mapUrl: 'src/img/龙之国.jpg', // 本地地图图片路径
            x: 0,
            y: 0,
            maxX: 258,
            maxY: 283
        }
    };

    return countryConfigs[country] || countryConfigs['森之国'];
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

// 生成螺旋布局坐标
function generateSpiralPositions() {
    const positions = [];
    const rows = 9;
    const cols = 7;
    
    // 定义螺旋路径
    // 第一行：1-7
    for (let col = 0; col < cols; col++) {
        positions.push({ row: 0, col: col, number: col + 1 });
    }
    
    // 右侧列：8-15
    for (let row = 1; row < rows - 1; row++) {
        positions.push({ row: row, col: cols - 1, number: 7 + row });
    }
    
    // 底行：16-22 (反向)
    for (let col = cols - 1; col >= 0; col--) {
        positions.push({ row: rows - 1, col: col, number: 14 + (cols - col) });
    }
    
    // 左侧列：23-28
    for (let row = rows - 2; row >= 1; row--) {
        positions.push({ row: row, col: 0, number: 21 + (rows - 1 - row) });
    }
    
    return positions;
}

// 显示抽奖机详情
function showMachineDetail(machine) {

    const prizesList = document.getElementById('prizes-list');
    prizesList.innerHTML = '';

    // 从新数据结构中获取奖品列表
    const machineType = machine.type;
    const typeData = machinesData.types[machineType];
    
    if (!typeData || !typeData.prizes) {
        console.error('未找到类型数据:', machineType);
        return;
    }

    // 生成螺旋布局坐标
    const positions = generateSpiralPositions();
    
    // 创建9x7的表格布局
    const gridContainer = document.createElement('div');
    gridContainer.className = 'prizes-grid';
    
    // 创建所有格子
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'prize-cell empty';
            
            gridContainer.appendChild(cell);
        }
    }

    // 填充奖品数据
    typeData.prizes.forEach((prize, index) => {
        if (index < positions.length) {
            const pos = positions[index];
            const cellIndex = pos.row * 7 + pos.col;
            const cell = gridContainer.children[cellIndex];
            
            // 检查是否已抽取
            const isClaimed = userState.claimedPrizes[machine.machineId] && userState.claimedPrizes[machine.machineId].includes(index);
            
            cell.textContent = prize;
            cell.className = isClaimed ? 'prize-cell prize-claimed' : 'prize-cell';
            cell.dataset.prizeIndex = index;
            cell.dataset.prizeName = prize;
            cell.dataset.number = pos.number;
            
            // 添加点击事件
            cell.addEventListener('click', function() {
                const prizeIndex = parseInt(this.dataset.prizeIndex);
                const isCurrentlyClaimed = this.classList.contains('prize-claimed');
                const newClaimedState = !isCurrentlyClaimed;
                
                // 更新用户状态
                updateClaimedPrize(machine.machineId, prizeIndex, newClaimedState);
                
                // 更新UI
                if (newClaimedState) {
                    this.classList.add('prize-claimed');
                } else {
                    this.classList.remove('prize-claimed');
                }
            });
            
            // 添加悬停效果
            cell.addEventListener('mouseenter', function() {
                if (this.style.backgroundColor !== 'rgb(108, 117, 125)' && this.style.backgroundColor !== '#6c757d') {
                    this.style.backgroundColor = '#e9ecef';
                    this.style.transform = 'scale(1.05)';
                }
            });
            
            cell.addEventListener('mouseleave', function() {
                if (this.style.backgroundColor !== 'rgb(108, 117, 125)' && this.style.backgroundColor !== '#6c757d') {
                    this.style.backgroundColor = '#f8f9fa';
                    this.style.transform = 'none';
                }
            });
        }
    });

    prizesList.appendChild(gridContainer);

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

    // 如果当前显示的是这个抽奖机的详情，更新弹窗中的奖品数量显示
    const machineDetailElement = document.getElementById('machine-detail');
    if (machineDetailElement.style.display === 'block') {
        const currentMachineTitle = document.querySelector('#machine-detail h3')?.textContent;
        if (currentMachineTitle) {
            // 从machinesData中找到对应的抽奖机数据
            let currentMachine = null;
            for (const country in machinesData.countries) {
                const countryMachines = machinesData.countries[country];
                const foundMachine = countryMachines.find(machine => machine.machineId === machineId);
                if (foundMachine) {
                    currentMachine = foundMachine;
                    break;
                }
            }
            if (currentMachine) {
                // 重新显示该抽奖机详情以更新奖品数量
                showMachineDetail(currentMachine);
            }
        }
    }
}