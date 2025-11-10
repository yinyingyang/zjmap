// search.js - 搜索和过滤功能

// 获取当前选中的国家
function getCurrentCountry() {
    const checkedRadio = document.querySelector('input[name="country"]:checked');
    return checkedRadio ? checkedRadio.value : '森之国';
}

// 更新资源类型复选框
function updateResourceTypeCheckboxes() {
    const checkboxesContainer = document.getElementById('resource-type-checkboxes');
    const currentCountry = getCurrentCountry();
    
    // 清空现有的复选框
    checkboxesContainer.innerHTML = '';
    
    // 获取当前国家的资源类型
    if (resourcesData[currentCountry]) {
        const resourceTypes = Object.keys(resourcesData[currentCountry]);
        
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
        if (savedResourceTypes[currentCountry] && savedResourceTypes[currentCountry].hasOwnProperty(type)) {
            checkbox.checked = savedResourceTypes[currentCountry][type];
        } else {
            checkbox.checked = true; // 默认选中
        }
            
            label.appendChild(checkbox);
            // 创建图片元素
            const img = document.createElement('img');
            img.src = `src/img/icons/${type}.png`;
            img.alt = type;
            
            // 创建文本节点
            // const textNode = document.createTextNode(type);
            
            // 将图片和文本添加到label中
            label.appendChild(img);
            // label.appendChild(textNode);
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
    
    // 监听国家切换事件，更新资源类型复选框
        document.querySelectorAll('input[name="country"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                updateResourceTypeCheckboxes();
            }
        });
    });
    
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
    
    // 获取当前国家
    const currentCountry = getCurrentCountry();
    
    // 隐藏所有资源点
    document.querySelectorAll('.resource-marker').forEach(marker => {
        marker.style.display = 'none';
    });
    
    // 如果没有选中的资源类型，直接返回
    if (selectedResourceTypes.length === 0) {
        return;
    }
    
    // 检查是否有新选中的资源类型需要加载
    const loadedResourceTypes = new Set();
    document.querySelectorAll('.resource-marker').forEach(marker => {
        loadedResourceTypes.add(marker.getAttribute('data-type'));
    });
    
    // 如果有新选中的资源类型未加载，重新加载国家标记
    const hasNewResourceTypes = selectedResourceTypes.some(type => !loadedResourceTypes.has(type));
    if (hasNewResourceTypes) {
        // 清除现有资源标记（保留抽奖机标记）
        document.querySelectorAll('.resource-marker').forEach(marker => {
            const parent = marker.parentElement;
            if (parent && parent._leaflet_id) {
                map.removeLayer(parent._leaflet_id);
            }
        });
        
        // 重新加载国家标记
        loadCountryMarkers(currentCountry);
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
    // 获取当前国家
    const currentCountry = getCurrentCountry();
    
    // 获取所有资源类型复选框的状态
    const resourceTypesState = {};
    document.querySelectorAll('.resource-type-checkbox input[type="checkbox"]').forEach(checkbox => {
        if (!resourceTypesState[currentCountry]) {
            resourceTypesState[currentCountry] = {};
        }
        resourceTypesState[currentCountry][checkbox.value] = checkbox.checked;
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
    
    // 更新当前国家的状态
    if (!savedResourceTypes[currentCountry]) {
        savedResourceTypes[currentCountry] = {};
    }
    Object.assign(savedResourceTypes[currentCountry], resourceTypesState[currentCountry]);
    
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

    // 搜索所有国家的数据（取消资源类型选中检查）
    for (const country in resourcesData) {
        if (resourcesData.hasOwnProperty(country)) {
            Object.keys(resourcesData[country]).forEach(resourceName => {
                const resource = resourcesData[country][resourceName];

                // 检查关键词是否匹配名称
                if (resourceName.toLowerCase().includes(keyword)) {
                    results.push({
                        ...resource,
                        name: resourceName,
                        country: country,
                    });
                }
            });
        }
    }

    return results;
}

// 搜索奖品
function searchPrizes(keyword) {
    let results = [];

    // 遍历所有国家的抽奖机
    if (machinesData.machines) {
        for (const country in machinesData.machines) {
            if (machinesData.machines.hasOwnProperty(country)) {
                machinesData.machines[country].forEach(machine => {
                    // 获取机器类型对应的奖品数据
                    const machineType = machine.type;
                    const typeData = machinesData.types[machineType];
                    
                    if (typeData && typeData.prizes) {
                        typeData.prizes.forEach((prize, index) => {
                            // 检查奖品是否已经被用户标记为已抽取
                            const isClaimed = userState.claimedPrizes[machine.machineId] && userState.claimedPrizes[machine.machineId].includes(index);
                            if (isClaimed) {
                                return; // 跳过已标记的奖品
                            }
                            
                            // 对于简化的奖品结构，我们只搜索奖品名称
                            if (prize.toLowerCase().includes(keyword)) {
                                results.push({
                                name: prize,
                                machineId: machine.machineId,
                                machineName: machine.name,
                                country: country,
                                x: machine.x,
                                y: machine.y,
                                type: 'prize'
                            });
                            }
                        });
                    }
                });
            }
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

    if (searchType === 'prize') {
        // 对奖品搜索结果进行分组统计
        const prizeGroups = {};
        
        results.forEach(result => {
            const prizeName = typeof result.name === 'object' ? result.name.name : result.name;
            const key = `${result.machineId}-${prizeName}`;
            
            if (!prizeGroups[key]) {
                prizeGroups[key] = {
                    prizeName: prizeName,
                    machineName: result.machineName,
                    machineId: result.machineId,
                    country: result.country,
                    x: result.x,
                    y: result.y,
                    count: 0
                };
            }
            prizeGroups[key].count++;
        });

        // 计算每个转盘的未抽取奖品总数
        const machineStats = {};
        for (const country in machinesData.machines) {
            if (machinesData.machines.hasOwnProperty(country)) {
                machinesData.machines[country].forEach(machine => {
                    const machineType = machine.type;
                    const typeData = machinesData.types[machineType];
                    
                    if (typeData && typeData.prizes) {
                        let totalUnclaimed = 0;
                        typeData.prizes.forEach((prize, index) => {
                            const isClaimed = userState.claimedPrizes[machine.machineId] && userState.claimedPrizes[machine.machineId].includes(index);
                            if (!isClaimed) {
                                totalUnclaimed++;
                            }
                        });
                        machineStats[machine.machineId] = {
                            totalUnclaimed: totalUnclaimed,
                            totalPrizes: typeData.prizes.length
                        };
                    }
                });
            }
        }

        // 显示分组后的结果
        Object.values(prizeGroups).forEach(group => {
            const li = document.createElement('li');
            const machineStat = machineStats[group.machineId];
            
            li.innerHTML = `
                <div><strong>${group.prizeName}</strong> × ${group.count}</div>
                <div>所属转盘: ${group.machineName}</div>
                <div>类型: ${group.type}</div>
                <div>该转盘未抽取: ${machineStat.totalUnclaimed}/${machineStat.totalPrizes}</div>
            `;

            // 点击结果项，跳转到地图位置
            li.addEventListener('click', function() {
                // 切换到对应的国家
                const countryRadio = document.querySelector(`input[name="country"][value="${group.country}"]`);
                if (countryRadio) {
                    countryRadio.click();
                }
                // switchCountry(group.country);
                // 定位到资源点或抽奖机位置
                map.setView([group.y, group.x], 5);
                // 隐藏搜索结果
                document.querySelector('.search-results').style.display = 'none';
            });

            resultsList.appendChild(li);
        });
    } else {
        // 资源搜索结果保持原样显示
        results.forEach(result => {
            const li = document.createElement('li');

            if (searchType === 'resource') {
                li.innerHTML = `
                    <div><strong>${result.name}</strong></div>
                    <div>国家: ${result.country}</div>
                    <div>资源点: ${result.coordinates.length}个</div>
                `;
            }

            // 点击结果项，跳转到地图位置
            li.addEventListener('click', function() {
                // 切换到对应的国家
                const countryRadio = document.querySelector(`input[name="country"][value="${result.country}"]`);
                if (countryRadio) {
                    countryRadio.click();
                }
                //隐藏其他资源
                document.querySelectorAll('input[type="checkbox"]').forEach(item => {
                    item.value !== result.name ? item.checked = false : item.checked = true;
                });
                 // 触发资源筛选更新
                filterResourcesByType();
                
                // 保存资源类型状态到cookies
                saveResourceTypesState();
                // loadCountryMarkers(result.country);
            });

            resultsList.appendChild(li);
        });
    }

    document.querySelector('.search-results').style.display = 'block';
}

// 获取国家名称
function getCountryName(countryCode) {
    const countryNames = {
        'country1': '新手村',
        'country2': '主城',
        'country3': '边境要塞'
    };

    return countryNames[countryCode] || countryCode;
}