// search.js - 搜索和过滤功能

// 更新资源类型复选框
function updateResourceTypeCheckboxes() {
    const checkboxesContainer = document.getElementById('resource-type-checkboxes');
    const currentCity = document.getElementById('city').value;
    
    // 清空现有的复选框
    checkboxesContainer.innerHTML = '';
    
    // 获取当前城市的资源类型
    if (resourcesData[currentCity]) {
        const resourceTypes = [];
        resourcesData[currentCity].forEach(resource => {
            if (!resourceTypes.includes(resource.name)) {
                resourceTypes.push(resource.name);
            }
        });
        
        // 获取保存的资源类型状态
        let savedResourceTypes = {};
        const savedState = getCookie('resourceTypesState');
        if (savedState) {
            try {
                savedResourceTypes = JSON.parse(savedState);
            } catch (e) {
                console.error('解析保存的资源类型状态出错:', e);
            }
        }
        
        // 为每个资源类型创建复选框
        resourceTypes.forEach(type => {
            const label = document.createElement('label');
            label.className = 'resource-type-checkbox';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = type;
            
            // 从保存的状态中读取选中状态，如果没有保存的状态则默认选中
            if (savedResourceTypes[currentCity] && savedResourceTypes[currentCity].hasOwnProperty(type)) {
                checkbox.checked = savedResourceTypes[currentCity][type];
            } else {
                checkbox.checked = true; // 默认选中
            }
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(type));
            checkboxesContainer.appendChild(label);
        });
        
        // 更新资源显示
        filterResourcesByType();
    }
}

// 初始化搜索功能
function initSearch() {
    // 初始化时隐藏搜索结果
    document.querySelector('.search-results').style.display = 'none';
    
    // 初始化资源类型复选框
    updateResourceTypeCheckboxes();
    
    // 监听城市切换事件，更新资源类型复选框
    document.getElementById('city').addEventListener('change', updateResourceTypeCheckboxes);
    
    // 监听资源类型复选框变化事件
    document.getElementById('resource-type-checkboxes').addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            // 触发资源筛选更新
            filterResourcesByType();
            
            // 保存资源类型状态到cookies
            saveResourceTypesState();
        }
    });
}

// 根据资源类型筛选资源
function filterResourcesByType() {
    // 获取当前选中的资源类型
    const selectedResourceTypes = [];
    document.querySelectorAll('.resource-type-checkbox input:checked').forEach(checkbox => {
        selectedResourceTypes.push(checkbox.value);
    });
    
    // 获取当前城市
    const currentCity = document.getElementById('city').value;
    
    // 隐藏所有资源点
    document.querySelectorAll('.resource-marker').forEach(marker => {
        marker.style.display = 'none';
    });
    
    // 如果没有选中的资源类型，直接返回
    if (selectedResourceTypes.length === 0) {
        return;
    }
    
    // 显示选中资源类型的资源点
    selectedResourceTypes.forEach(type => {
        document.querySelectorAll(`.resource-marker[data-type="${type}"]`).forEach(marker => {
            marker.style.display = 'block';
        });
    });
}

// 保存资源类型状态到cookies
function saveResourceTypesState() {
    // 获取当前城市
    const currentCity = document.getElementById('city').value;
    
    // 获取所有资源类型复选框的状态
    const resourceTypesState = {};
    document.querySelectorAll('.resource-type-checkbox input[type="checkbox"]').forEach(checkbox => {
        if (!resourceTypesState[currentCity]) {
            resourceTypesState[currentCity] = {};
        }
        resourceTypesState[currentCity][checkbox.value] = checkbox.checked;
    });
    
    // 从cookies中读取现有状态
    let savedResourceTypes = {};
    const savedState = getCookie('resourceTypesState');
    if (savedState) {
        try {
            savedResourceTypes = JSON.parse(savedState);
        } catch (e) {
            console.error('解析保存的资源类型状态出错:', e);
        }
    }
    
    // 更新当前城市的状态
    if (!savedResourceTypes[currentCity]) {
        savedResourceTypes[currentCity] = {};
    }
    Object.assign(savedResourceTypes[currentCity], resourceTypesState[currentCity]);
    
    // 保存到cookies
    setCookie('resourceTypesState', JSON.stringify(savedResourceTypes), 365);
}

// 执行搜索
function performSearch() {
    const searchInput = document.getElementById('search-input').value.trim().toLowerCase();
    const searchType = document.getElementById('search-type').value;

    if (!searchInput) {
        alert('请输入搜索关键词');
        return;
    }

    let results = [];

    if (searchType === 'resource') {
        // 搜索资源
        results = searchResources(searchInput);
    } else if (searchType === 'prize') {
        // 搜索奖品
        results = searchPrizes(searchInput);
    }

    // 显示搜索结果
    displaySearchResults(results, searchType);
}

// 搜索资源
function searchResources(keyword) {
    let results = [];

    // 获取当前选中的资源类型
    const selectedResourceTypes = [];
    document.querySelectorAll('.resource-type-checkbox input:checked').forEach(checkbox => {
        selectedResourceTypes.push(checkbox.value);
    });

    // 如果没有选中的资源类型，直接返回空数组
    if (selectedResourceTypes.length === 0) {
        return results;
    }

    // 只搜索当前城市的数据
    const currentCity = document.getElementById('city').value;
    if (resourcesData[currentCity]) {
        resourcesData[currentCity].forEach(resource => {
            // 检查资源类型是否被选中
            if (!selectedResourceTypes.includes(resource.name)) {
                return;
            }

            // 检查关键词是否匹配名称
            if (resource.name.toLowerCase().includes(keyword)) {
                results.push({
                    ...resource,
                    city: currentCity,
                    type: 'resource'
                });
            }
        });
    }

    return results;
}

// 搜索奖品
function searchPrizes(keyword) {
    let results = [];

    // 遍历所有城市的抽奖机
    for (const city in machinesData) {
        if (machinesData.hasOwnProperty(city)) {
            machinesData[city].forEach(machine => {
                machine.prizes.forEach(prize => {
                    // 检查关键词是否匹配奖品名称或描述
                    if (prize.name.toLowerCase().includes(keyword) || (prize.description && prize.description.toLowerCase().includes(keyword))) {
                        results.push({
                            ...prize,
                            machineId: machine.machineId,
                            machineName: machine.name,
                            city: city,
                            x: machine.x,
                            y: machine.y,
                            type: 'prize'
                        });
                    }
                });
            });
        }
    }

    return results;
}

// 显示搜索结果
function displaySearchResults(results, searchType) {
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';

    if (results.length === 0) {
        resultsList.innerHTML = '<li>没有找到匹配的结果</li>';
        document.querySelector('.search-results').style.display = 'block';
        return;
    }

    // 显示搜索结果
    results.forEach(result => {
        const li = document.createElement('li');

        if (searchType === 'resource') {
            li.innerHTML = `
                <div><strong>${result.name}</strong> (${result.type})</div>
                <div>城市: ${getCityName(result.city)}</div>
                <div>数量: ${result.amount}</div>
            `;
        } else if (searchType === 'prize') {
            li.innerHTML = `
                <div><strong>${result.name}</strong></div>
                <div>所属抽奖机: ${result.machineName}</div>
                <div>城市: ${getCityName(result.city)}</div>
            `;
        }

        // 点击结果项，跳转到地图位置
        li.addEventListener('click', function() {
            // 切换到对应的城市
            switchCity(result.city);
            // 定位到资源点或抽奖机位置
            map.setView([result.y, result.x], 15);
            // 隐藏搜索结果
            document.querySelector('.search-results').style.display = 'none';
        });

        resultsList.appendChild(li);
    });

    document.querySelector('.search-results').style.display = 'block';
}

// 获取城市名称
function getCityName(cityCode) {
    const cityNames = {
        'city1': '新手村',
        'city2': '主城',
        'city3': '边境要塞'
    };

    return cityNames[cityCode] || cityCode;
}