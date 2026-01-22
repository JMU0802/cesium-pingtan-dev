// Cesium Ion 访问令牌（已移除过期token，使用开源地形）
// 如需使用 Cesium Ion 资源，请访问 https://cesium.com/ion/ 获取新 token
// Cesium.Ion.defaultAccessToken = 'YOUR_ACCESS_TOKEN_HERE';

let viewer;
let tilesets = [];
let currentPolygon = {
    points: [],
    entities: [],
    lines: [],
    isDrawing: false,
    isDragging: false,
    draggedEntity: null
};
let savedPolygons = [];  // 改为存储完整的多边形对象数组
let polygonCounter = 1;  // 多边形计数器
let selectedPolygon = null;
let selectedPolygonId = null;  // 当前选中的多边形ID
let handler;
let ctrlPressed = false;
let keyDownHandler = null;
let keyUpHandler = null;
let mouseDownPosition = null;
let isDraggingScene = false;
let previewLine = null; // 预览虚线

// 初始化 Cesium Viewer
function initCesium() {
    try {
        viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),  // 使用椭球体地形避免 token 错误
            imageryProvider: new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/'
            }),  // 使用 OpenStreetMap 替代 Cesium Ion 影像
            animation: false,
            timeline: false,
            baseLayerPicker: false,  // 禁用以避免 Cesium Ion 调用
            geocoder: false,  // 禁用以避免 Cesium Ion 调用
            homeButton: true,
            navigationHelpButton: true,
            sceneModePicker: true,
            fullscreenButton: true
        });

        viewer.scene.globe.depthTestAgainstTerrain = true;
        
        // 飞向平潭
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(119.789, 25.497, 5000),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
            }
        });

        logMessage('Cesium初始化成功', 'success');
        
        // 设置鼠标移动事件显示坐标
        setupMouseMoveHandler();
        
        // 默认选中OSM按钮
        updateImageryButtonState('osm');
        
    } catch (error) {
        logMessage('Cesium初始化失败: ' + error.message, 'error');
    }
}

// 切换影像图层
function switchImagery(type) {
    try {
        // 移除所有影像图层
        viewer.imageryLayers.removeAll();
        
        // 根据类型添加新的影像图层
        if (type === 'osm') {
            viewer.imageryLayers.addImageryProvider(
                new Cesium.OpenStreetMapImageryProvider({
                    url: 'https://a.tile.openstreetmap.org/'
                })
            );
            logMessage('已切换到街道图', 'success');
        } else if (type === 'satellite') {
            viewer.imageryLayers.addImageryProvider(
                new Cesium.ArcGisMapServerImageryProvider({
                    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                })
            );
            logMessage('已切换到卫星影像', 'success');
        }
        
        // 更新按钮状态
        updateImageryButtonState(type);
        
    } catch (error) {
        logMessage('切换影像失败: ' + error.message, 'error');
    }
}

// 更新影像按钮状态
function updateImageryButtonState(activeType) {
    const osmBtn = document.getElementById('osmBtn');
    const satelliteBtn = document.getElementById('satelliteBtn');
    
    if (osmBtn && satelliteBtn) {
        // 移除所有按钮的active状态
        osmBtn.style.opacity = '0.6';
        satelliteBtn.style.opacity = '0.6';
        
        // 设置当前选中按钮的状态
        if (activeType === 'osm') {
            osmBtn.style.opacity = '1';
            osmBtn.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.6)';
            satelliteBtn.style.boxShadow = 'none';
        } else if (activeType === 'satellite') {
            satelliteBtn.style.opacity = '1';
            satelliteBtn.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.6)';
            osmBtn.style.boxShadow = 'none';
        }
    }
}

// 设置鼠标移动事件
function setupMouseMoveHandler() {
    const scene = viewer.scene;
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    
    handler.setInputAction(function(movement) {
        if (!currentPolygon.isDragging) {
            const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
                const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
                const height = cartographic.height.toFixed(2);
                
                document.getElementById('longitude').textContent = longitude + '°';
                document.getElementById('latitude').textContent = latitude + '°';
                document.getElementById('height').textContent = height + ' m';
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

// 日志消息
function logMessage(message, type = 'info') {
    const log = document.getElementById('log');
    const timestamp = new Date().toLocaleTimeString();
    const className = 'log-' + type;
    log.innerHTML = `<div class="${className}">[${timestamp}] ${message}</div>` + log.innerHTML;
    
    // 限制日志条目数量
    const entries = log.querySelectorAll('div');
    if (entries.length > 50) {
        entries[entries.length - 1].remove();
    }
}

// 加载主模型
function loadMainTileset() {
    try {
        const tileset = viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                url: './pingtan/terra_3Dtiles/tileset.json'
            })
        );
        
        tileset.readyPromise.then(function(tileset) {
            viewer.zoomTo(tileset);
            tilesets.push(tileset);
            logMessage('主模型加载成功', 'success');
        }).catch(function(error) {
            logMessage('主模型加载失败: ' + error.message, 'error');
        });
    } catch (error) {
        logMessage('加载失败: ' + error.message, 'error');
    }
}

// 加载 BlockAB
function loadBlockAB() {
    loadBlock('BlockAB', './pingtan/terra_3Dtiles/BlockAB/');
}

// 加载 BlockXX
function loadBlockXX() {
    loadBlock('BlockXX', './pingtan/terra_3Dtiles/BlockXX/');
}

// 加载 BlockXA
function loadBlockXA() {
    loadBlock('BlockXA', './pingtan/terra_3Dtiles/BlockXA/');
}

// 加载 BlockAY
function loadBlockAY() {
    loadBlock('BlockAY', './pingtan/terra_3Dtiles/BlockAY/');
}

// 通用加载块函数
function loadBlock(blockName, path) {
    try {
        const tileset = viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                url: path + 'tileset.json'
            })
        );
        
        tileset.readyPromise.then(function(tileset) {
            tilesets.push(tileset);
            logMessage(blockName + ' 加载成功', 'success');
        }).catch(function(error) {
            logMessage(blockName + ' 加载失败: ' + error.message, 'error');
        });
    } catch (error) {
        logMessage(blockName + ' 加载失败: ' + error.message, 'error');
    }
}

// 清除所有模型
function clearAll() {
    tilesets.forEach(tileset => {
        viewer.scene.primitives.remove(tileset);
    });
    tilesets = [];
    logMessage('已清除所有模型', 'info');
}

// 开始绘制多边形
function startDrawPolygon() {
    if (currentPolygon.isDrawing) {
        logMessage('已经在绘制模式中', 'warning');
        return;
    }
    
    logMessage('═══════ 开始绘制多边形 ═══════', 'success');
    
    currentPolygon.isDrawing = true;
    currentPolygon.points = [];
    currentPolygon.entities = [];
    currentPolygon.lines = [];
    
    logMessage('绘制状态已设置: isDrawing = ' + currentPolygon.isDrawing, 'info');
    
    document.getElementById('drawBtn').disabled = true;
    document.getElementById('finishBtn').disabled = false;
    document.getElementById('deletePointBtn').disabled = false;
    document.getElementById('cancelBtn').disabled = false;
    document.getElementById('polygonInfo').style.display = 'block';
    
    logMessage('按钮状态已更新', 'info');
    
    setupDrawHandlers();
    logMessage('✓ 绘制模式已启动 - 请左键单击地面添加点', 'success');
}

// 设置绘制事件处理器
function setupDrawHandlers() {
    if (handler) {
        handler.destroy();
    }
    
    // 移除旧的键盘监听器
    if (keyDownHandler) {
        document.removeEventListener('keydown', keyDownHandler);
    }
    if (keyUpHandler) {
        document.removeEventListener('keyup', keyUpHandler);
    }
    
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    // 禁用右键上下文菜单
    viewer.scene.canvas.oncontextmenu = function(e) {
        e.preventDefault();
        return false;
    };
    
    // 监听键盘Ctrl键
    keyDownHandler = function(e) {
        if (e.key === 'Control') {
            ctrlPressed = true;
        }
    };
    
    keyUpHandler = function(e) {
        if (e.key === 'Control') {
            ctrlPressed = false;
        }
    };
    
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    logMessage('事件处理器已设置', 'success');
    
    // 左键按下 - 记录位置
    handler.setInputAction(function(click) {
        if (!currentPolygon.isDrawing) return;
        
        mouseDownPosition = click.position.clone();
        isDraggingScene = false;
        
        const pickedObject = viewer.scene.pick(click.position);
        
        // 如果点击的是已有点，准备拖动点
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.isPoint) {
            currentPolygon.isDragging = true;
            currentPolygon.draggedEntity = pickedObject.id;
            viewer.scene.screenSpaceCameraController.enableRotate = false;
            logMessage('选中点，准备拖动', 'success');
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    
    // 鼠标移动 - 拖动点或显示预览虚线
    handler.setInputAction(function(movement) {
        if (!currentPolygon.isDrawing) return;
        
        if (currentPolygon.isDragging && currentPolygon.draggedEntity) {
            // 拖动点 - 使用scene.pickPosition获取更准确的坐标
            const cartesian = viewer.scene.pickPosition(movement.endPosition);
            if (!cartesian) {
                // 如果pickPosition失败，使用globe.pick
                const ray = viewer.camera.getPickRay(movement.endPosition);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            }
            if (cartesian) {
                const index = currentPolygon.entities.indexOf(currentPolygon.draggedEntity);
                if (index !== -1) {
                    currentPolygon.points[index] = cartesian;
                    currentPolygon.draggedEntity.position = cartesian;
                    redrawPolygon();
                    updatePolygonStats();
                }
            }
        } else if (mouseDownPosition) {
            // 检测是否在拖动场景
            const distance = Cesium.Cartesian2.distance(mouseDownPosition, movement.endPosition);
            if (distance > 5) {
                isDraggingScene = true;
            }
        } else if (currentPolygon.points.length > 0) {
            // 显示预览虚线 - 使用scene.pickPosition获取更准确的坐标
            let cartesian = viewer.scene.pickPosition(movement.endPosition);
            if (!cartesian) {
                const ray = viewer.camera.getPickRay(movement.endPosition);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            }
            if (cartesian) {
                updatePreviewLine(cartesian);
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    // 左键释放 - 添加点或结束拖动或插入点
    handler.setInputAction(function(click) {
        if (currentPolygon.isDragging) {
            // 结束拖动点
            currentPolygon.isDragging = false;
            currentPolygon.draggedEntity = null;
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            logMessage('点已移动', 'success');
        } else if (mouseDownPosition && !isDraggingScene) {
            // 没有拖动场景，是单击行为
            if (ctrlPressed && currentPolygon.points.length >= 2) {
                // Ctrl + 点击在线段上插入点
                let cartesian = viewer.scene.pickPosition(click.position);
                if (!cartesian) {
                    const ray = viewer.camera.getPickRay(click.position);
                    cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                }
                if (cartesian) {
                    insertPointOnLine(cartesian);
                }
            } else if (!ctrlPressed) {
                // 左键单击添加点 - 使用scene.pickPosition获取更准确的坐标
                let cartesian = viewer.scene.pickPosition(click.position);
                if (!cartesian) {
                    // 如果pickPosition失败，使用globe.pick
                    const ray = viewer.camera.getPickRay(click.position);
                    cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                }
                if (cartesian) {
                    logMessage('获取坐标成功', 'success');
                    addPolygonPoint(cartesian);
                } else {
                    logMessage('无法获取坐标点', 'error');
                }
            }
        }
        
        mouseDownPosition = null;
        isDraggingScene = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    
    // 右键点击删除点
    handler.setInputAction(function(click) {
        if (!currentPolygon.isDrawing) return;
        
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.isPoint) {
            deletePolygonPoint(pickedObject.id);
            logMessage('右键删除点', 'info');
        }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    
    // 双击完成绘制
    handler.setInputAction(function() {
        if (currentPolygon.isDrawing && currentPolygon.points.length >= 3) {
            finishDrawing();
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}

// 更新预览虚线
function updatePreviewLine(cartesian) {
    // 移除旧的预览线
    if (previewLine) {
        viewer.entities.remove(previewLine);
        previewLine = null;
    }
    
    // 如果有至少一个点，创建预览线 - 绿色虚线
    if (currentPolygon.points.length > 0) {
        const lastPoint = currentPolygon.points[currentPolygon.points.length - 1];
        
        previewLine = viewer.entities.add({
            polyline: {
                positions: [lastPoint, cartesian],
                width: 2,
                material: new Cesium.PolylineDashMaterialProperty({
                    color: Cesium.Color.GREEN,
                    dashLength: 16
                }),
                clampToGround: true
            }
        });
    }
}

// 清除预览虚线
function clearPreviewLine() {
    if (previewLine) {
        viewer.entities.remove(previewLine);
        previewLine = null;
    }
}

// 添加多边形点
function addPolygonPoint(cartesian) {
    currentPolygon.points.push(cartesian);
    
    // 显示坐标信息
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
    const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
    const height = cartographic.height.toFixed(2);
    logMessage(`坐标: 经度${lon}°, 纬度${lat}°, 高度${height}m`, 'info');
    
    // 清除预览线
    clearPreviewLine();
    
    // 添加点实体 - 红色点标记
    const pointEntity = viewer.entities.add({
        position: cartesian,
        point: {
            pixelSize: 14,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        isPoint: true
    });
    
    currentPolygon.entities.push(pointEntity);
    
    // 如果有多个点，绘制实线线段
    if (currentPolygon.points.length > 1) {
        drawLine(currentPolygon.points[currentPolygon.points.length - 2], cartesian);
    }
    
    updatePolygonStats();
    logMessage(`✓ 添加点 - 总点数: ${currentPolygon.points.length}`, 'success');
}

// 删除多边形点
function deletePolygonPoint(entity) {
    const index = currentPolygon.entities.indexOf(entity);
    if (index !== -1) {
        viewer.entities.remove(entity);
        currentPolygon.entities.splice(index, 1);
        currentPolygon.points.splice(index, 1);
        redrawPolygon();
        updatePolygonStats();
        logMessage(`删除点 - 剩余 ${currentPolygon.points.length} 个点`, 'info');
    }
}

// 删除上一个点
function deleteLastPoint() {
    if (currentPolygon.points.length > 0) {
        const lastEntity = currentPolygon.entities[currentPolygon.entities.length - 1];
        viewer.entities.remove(lastEntity);
        currentPolygon.entities.pop();
        currentPolygon.points.pop();
        redrawPolygon();
        updatePolygonStats();
        logMessage(`删除上一点 - 剩余 ${currentPolygon.points.length} 个点`, 'info');
    }
}

// 在线段上插入点
function insertPointOnLine(cartesian) {
    let closestIndex = -1;
    let minDistance = Infinity;
    
    // 找到最近的线段
    for (let i = 0; i < currentPolygon.points.length - 1; i++) {
        const distance = distanceToLineSegment(cartesian, currentPolygon.points[i], currentPolygon.points[i + 1]);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }
    
    // 检查闭合线段
    if (currentPolygon.points.length >= 3) {
        const distance = distanceToLineSegment(
            cartesian,
            currentPolygon.points[currentPolygon.points.length - 1],
            currentPolygon.points[0]
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = currentPolygon.points.length - 1;
        }
    }
    
    if (closestIndex !== -1 && minDistance < 100) {
        // 插入点
        currentPolygon.points.splice(closestIndex + 1, 0, cartesian);
        
        const pointEntity = viewer.entities.add({
            position: cartesian,
            point: {
                pixelSize: 12,
                color: Cesium.Color.YELLOW,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            },
            isPoint: true
        });
        
        currentPolygon.entities.splice(closestIndex + 1, 0, pointEntity);
        redrawPolygon();
        updatePolygonStats();
        logMessage('插入点成功', 'success');
    }
}

// 计算点到线段的距离
function distanceToLineSegment(point, lineStart, lineEnd) {
    const cartographic = Cesium.Cartographic.fromCartesian(point);
    const startCarto = Cesium.Cartographic.fromCartesian(lineStart);
    const endCarto = Cesium.Cartographic.fromCartesian(lineEnd);
    
    const A = cartographic.longitude - startCarto.longitude;
    const B = cartographic.latitude - startCarto.latitude;
    const C = endCarto.longitude - startCarto.longitude;
    const D = endCarto.latitude - startCarto.latitude;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
        xx = startCarto.longitude;
        yy = startCarto.latitude;
    } else if (param > 1) {
        xx = endCarto.longitude;
        yy = endCarto.latitude;
    } else {
        xx = startCarto.longitude + param * C;
        yy = startCarto.latitude + param * D;
    }
    
    const dx = cartographic.longitude - xx;
    const dy = cartographic.latitude - yy;
    
    return Math.sqrt(dx * dx + dy * dy) * 111000;
}

// 绘制线段 - 绿色线段
function drawLine(start, end) {
    const line = viewer.entities.add({
        polyline: {
            positions: [start, end],
            width: 3,
            material: Cesium.Color.GREEN,
            clampToGround: true,
            classificationType: Cesium.ClassificationType.BOTH
        }
    });
    
    currentPolygon.lines.push(line);
}

// 重绘多边形
function redrawPolygon() {
    // 移除所有线段
    currentPolygon.lines.forEach(line => viewer.entities.remove(line));
    currentPolygon.lines = [];
    
    // 重新绘制所有线段
    for (let i = 0; i < currentPolygon.points.length - 1; i++) {
        drawLine(currentPolygon.points[i], currentPolygon.points[i + 1]);
    }
    
    // 闭合线段
    if (currentPolygon.points.length >= 3) {
        drawLine(currentPolygon.points[currentPolygon.points.length - 1], currentPolygon.points[0]);
    }
}

// 完成绘制
function finishDrawing() {
    if (!currentPolygon.isDrawing || currentPolygon.points.length < 3) {
        logMessage('至少需要3个点才能完成多边形', 'warning');
        return;
    }
    
    // 清除预览线
    clearPreviewLine();
    
    // 创建多边形实体
    const fillColor = hexToColor(document.getElementById('fillColor').value);
    fillColor.alpha = parseFloat(document.getElementById('fillOpacity').value) / 100;
    
    const area = calculateArea(currentPolygon.points);
    const perimeter = calculatePerimeter(currentPolygon.points);
    
    const polygonEntity = viewer.entities.add({
        polygon: {
            hierarchy: new Cesium.PolygonHierarchy(currentPolygon.points),
            material: fillColor,
            outline: false,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        isPolygon: true,
        polygonData: {
            id: polygonCounter,
            name: `多边形 ${polygonCounter}`,
            points: currentPolygon.points.map(p => {
                const carto = Cesium.Cartographic.fromCartesian(p);
                return {
                    longitude: Cesium.Math.toDegrees(carto.longitude),
                    latitude: Cesium.Math.toDegrees(carto.latitude)
                };
            }),
            area: area,
            perimeter: perimeter,
            pointEntities: currentPolygon.entities,
            lineEntities: currentPolygon.lines,
            fillColor: fillColor,
            originalAlpha: fillColor.alpha
        }
    });
    
    savedPolygons.push(polygonEntity);
    polygonCounter++;
    
    // 更新多边形列表
    updatePolygonList();
    
    currentPolygon.isDrawing = false;
    currentPolygon.points = [];
    currentPolygon.entities = [];
    currentPolygon.lines = [];
    
    document.getElementById('drawBtn').disabled = false;
    document.getElementById('finishBtn').disabled = true;
    document.getElementById('deletePointBtn').disabled = true;
    document.getElementById('cancelBtn').disabled = true;
    document.getElementById('polygonInfo').style.display = 'none';
    
    if (handler) {
        handler.destroy();
        handler = null;
    }
    
    // 移除键盘监听器
    if (keyDownHandler) {
        document.removeEventListener('keydown', keyDownHandler);
        keyDownHandler = null;
    }
    if (keyUpHandler) {
        document.removeEventListener('keyup', keyUpHandler);
        keyUpHandler = null;
    }
    ctrlPressed = false;
    
    logMessage(`${polygonEntity.polygonData.name} 绘制完成 - 面积: ${area.toFixed(2)} m²`, 'success');
    
    setupPolygonSelectionHandler();
    logMessage('多边形绘制完成 - 面积: ' + polygonEntity.polygonData.area.toFixed(2) + ' m²', 'success');
}

// 取消绘制
function cancelPolygon() {
    // 清除预览线
    clearPreviewLine();
    
    currentPolygon.entities.forEach(entity => viewer.entities.remove(entity));
    currentPolygon.lines.forEach(line => viewer.entities.remove(line));
    
    currentPolygon.isDrawing = false;
    currentPolygon.points = [];
    currentPolygon.entities = [];
    currentPolygon.lines = [];
    
    document.getElementById('drawBtn').disabled = false;
    document.getElementById('finishBtn').disabled = true;
    document.getElementById('deletePointBtn').disabled = true;
    document.getElementById('cancelBtn').disabled = true;
    document.getElementById('polygonInfo').style.display = 'none';
    
    if (handler) {
        handler.destroy();
        handler = null;
    }
    
    // 移除键盘监听器
    if (keyDownHandler) {
        document.removeEventListener('keydown', keyDownHandler);
        keyDownHandler = null;
    }
    if (keyUpHandler) {
        document.removeEventListener('keyup', keyUpHandler);
        keyUpHandler = null;
    }
    ctrlPressed = false;
    
    logMessage('取消绘制', 'info');
}

// 更新多边形统计信息
function updatePolygonStats() {
    document.getElementById('polygonPoints').textContent = currentPolygon.points.length;
    
    if (currentPolygon.points.length >= 2) {
        const perimeter = calculatePerimeter(currentPolygon.points);
        document.getElementById('polygonPerimeter').textContent = perimeter.toFixed(2) + ' m';
    }
    
    if (currentPolygon.points.length >= 3) {
        const area = calculateArea(currentPolygon.points);
        document.getElementById('polygonArea').textContent = area.toFixed(2) + ' m²';
    }
}

// 计算周长
function calculatePerimeter(points) {
    let perimeter = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
        perimeter += Cesium.Cartesian3.distance(points[i], points[i + 1]);
    }
    
    // 闭合边
    if (points.length >= 3) {
        perimeter += Cesium.Cartesian3.distance(points[points.length - 1], points[0]);
    }
    
    return perimeter;
}

// 计算面积 (使用Cesium内置的多边形面积计算)
function calculateArea(points) {
    if (points.length < 3) return 0;
    
    // 转换为经纬度坐标
    const positions = points.map(p => {
        const cartographic = Cesium.Cartographic.fromCartesian(p);
        return new Cesium.Cartographic(cartographic.longitude, cartographic.latitude, 0);
    });
    
    // 使用更准确的球面面积计算
    let area = 0;
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    
    for (let i = 0; i < positions.length; i++) {
        const j = (i + 1) % positions.length;
        
        const pos1 = ellipsoid.cartographicToCartesian(positions[i]);
        const pos2 = ellipsoid.cartographicToCartesian(positions[j]);
        
        // 计算两点之间的弧长
        const distance = Cesium.Cartesian3.distance(pos1, pos2);
        
        // 使用梯形公式累加面积
        const lat1 = positions[i].latitude;
        const lat2 = positions[j].latitude;
        const lon1 = positions[i].longitude;
        const lon2 = positions[j].longitude;
        
        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    // 转换为平方米
    const radius = ellipsoid.maximumRadius;
    area = Math.abs(area * radius * radius / 2.0);
    
    return area;
}

// 保存多边形
function savePolygon() {
    if (savedPolygons.length === 0) {
        logMessage('没有可保存的多边形', 'warning');
        return;
    }
    
    const data = savedPolygons.map(poly => ({
        points: poly.polygonData.points,
        area: poly.polygonData.area,
        perimeter: poly.polygonData.perimeter
    }));
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `pingtan_xiangbiwan_${timestamp}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    logMessage('多边形已保存: ' + filename, 'success');
}

// 显示加载模态框
function showLoadModal() {
    document.getElementById('loadModal').style.display = 'block';
}

// 关闭加载模态框
function closeLoadModal() {
    document.getElementById('loadModal').style.display = 'none';
}

// 加载多边形文件
function loadPolygonFile() {
    const fileInput = document.getElementById('loadFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        logMessage('请选择文件', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            const fillColor = hexToColor(document.getElementById('loadFillColor').value);
            fillColor.alpha = parseFloat(document.getElementById('loadFillOpacity').value) / 100;
            
            data.forEach(polygonData => {
                const points = polygonData.points.map(p => 
                    Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
                );
                
                const area = polygonData.area || calculateArea(points);
                const perimeter = polygonData.perimeter || calculatePerimeter(points);
                
                const polygonEntity = viewer.entities.add({
                    polygon: {
                        hierarchy: new Cesium.PolygonHierarchy(points),
                        material: fillColor,
                        outline: false,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                    },
                    isPolygon: true,
                    polygonData: {
                        id: polygonCounter,
                        name: `多边形 ${polygonCounter}`,
                        points: polygonData.points,
                        area: area,
                        perimeter: perimeter,
                        pointEntities: [],
                        lineEntities: [],
                        fillColor: fillColor,
                        originalAlpha: fillColor.alpha
                    }
                });
                
                savedPolygons.push(polygonEntity);
                polygonCounter++;
            });
            
            updatePolygonList();
            closeLoadModal();
            logMessage(`加载了 ${data.length} 个多边形`, 'success');
            
        } catch (error) {
            logMessage('加载失败: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// 设置多边形选择处理器
function setupPolygonSelectionHandler() {
    if (handler) {
        handler.destroy();
    }
    
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    handler.setInputAction(function(click) {
        const pickedObject = viewer.scene.pick(click.position);
        
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.isPolygon) {
            selectPolygon(pickedObject.id);
        } else {
            deselectPolygon();
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 选择多边形
function selectPolygon(polygonEntity) {
    deselectPolygon();
    
    selectedPolygon = polygonEntity;
    
    // 高亮显示
    const currentColor = polygonEntity.polygon.material.getValue().color;
    polygonEntity.polygon.material = Cesium.Color.fromAlpha(
        Cesium.Color.CYAN,
        currentColor.alpha
    );
    
    document.getElementById('deletePolyBtn').disabled = false;
    logMessage('选中多边形 - 面积: ' + polygonEntity.polygonData.area.toFixed(2) + ' m²', 'info');
}

// 取消选择多边形
function deselectPolygon() {
    if (selectedPolygon) {
        const fillColor = hexToColor(document.getElementById('fillColor').value);
        fillColor.alpha = parseFloat(document.getElementById('fillOpacity').value) / 100;
        selectedPolygon.polygon.material = fillColor;
        selectedPolygon = null;
        document.getElementById('deletePolyBtn').disabled = true;
    }
}

// 删除选中的多边形
function deleteSelectedPolygon() {
    if (selectedPolygon) {
        viewer.entities.remove(selectedPolygon);
        const index = savedPolygons.indexOf(selectedPolygon);
        if (index !== -1) {
            savedPolygons.splice(index, 1);
        }
        selectedPolygon = null;
        document.getElementById('deletePolyBtn').disabled = true;
        logMessage('删除多边形', 'info');
    }
}

// 清除所有多边形
function clearPolygons() {
    savedPolygons.forEach(polygon => {
        viewer.entities.remove(polygon);
        
        // 删除点和线段实体
        if (polygon.polygonData && polygon.polygonData.pointEntities) {
            polygon.polygonData.pointEntities.forEach(entity => viewer.entities.remove(entity));
        }
        if (polygon.polygonData && polygon.polygonData.lineEntities) {
            polygon.polygonData.lineEntities.forEach(entity => viewer.entities.remove(entity));
        }
    });
    
    savedPolygons = [];
    selectedPolygon = null;
    selectedPolygonId = null;
    document.getElementById('deletePolyBtn').disabled = true;
    updatePolygonList();
    logMessage('清除所有多边形', 'info');
}

// 颜色转换
function hexToColor(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? new Cesium.Color(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1.0
    ) : Cesium.Color.WHITE;
}

// 更新多边形列表
function updatePolygonList() {
    const listContainer = document.getElementById('polygonList');
    
    if (savedPolygons.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa; font-size: 12px;">暂无多边形</div>';
        document.getElementById('totalArea').textContent = '总面积: 0 m²';
        return;
    }
    
    listContainer.innerHTML = '';
    let totalArea = 0;
    
    savedPolygons.forEach((polygon, index) => {
        const data = polygon.polygonData;
        totalArea += data.area;
        
        const item = document.createElement('div');
        item.className = 'polygon-item';
        if (selectedPolygonId === data.id) {
            item.classList.add('selected');
        }
        
        item.innerHTML = `
            <div class="polygon-item-info">
                <div class="polygon-item-name">${data.name}</div>
                <div class="polygon-item-area">面积: ${data.area.toFixed(2)} m² | 周长: ${data.perimeter.toFixed(2)} m</div>
            </div>
            <button class="polygon-item-delete" onclick="deletePolygonById(${data.id})">删除</button>
        `;
        
        item.onclick = function(e) {
            if (!e.target.classList.contains('polygon-item-delete')) {
                selectPolygonById(data.id);
            }
        };
        
        listContainer.appendChild(item);
    });
    
    document.getElementById('totalArea').textContent = `总面积: ${totalArea.toFixed(2)} m²`;
}

// 根据ID选择多边形
function selectPolygonById(id) {
    // 取消之前的选择
    if (selectedPolygonId !== null) {
        const prevPolygon = savedPolygons.find(p => p.polygonData.id === selectedPolygonId);
        if (prevPolygon) {
            // 恢复原始颜色
            const color = prevPolygon.polygonData.fillColor.clone();
            color.alpha = prevPolygon.polygonData.originalAlpha;
            prevPolygon.polygon.material = color;
        }
    }
    
    // 选择新的多边形
    selectedPolygonId = id;
    const polygon = savedPolygons.find(p => p.polygonData.id === id);
    
    if (polygon) {
        // 高亮显示 - 增加亮度和透明度
        const highlightColor = polygon.polygonData.fillColor.clone();
        highlightColor.alpha = Math.min(polygon.polygonData.originalAlpha + 0.3, 0.9);
        polygon.polygon.material = highlightColor;
        
        // 飞向该多边形
        viewer.flyTo(polygon, {
            duration: 1.5,
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 500)
        });
        
        logMessage(`选中 ${polygon.polygonData.name}`, 'info');
    }
    
    updatePolygonList();
}

// 根据ID删除多边形
function deletePolygonById(id) {
    const index = savedPolygons.findIndex(p => p.polygonData.id === id);
    
    if (index !== -1) {
        const polygon = savedPolygons[index];
        
        // 删除多边形实体
        viewer.entities.remove(polygon);
        
        // 删除点和线段实体
        if (polygon.polygonData.pointEntities) {
            polygon.polygonData.pointEntities.forEach(entity => viewer.entities.remove(entity));
        }
        if (polygon.polygonData.lineEntities) {
            polygon.polygonData.lineEntities.forEach(entity => viewer.entities.remove(entity));
        }
        
        // 从数组中移除
        savedPolygons.splice(index, 1);
        
        // 如果删除的是选中的多边形，清除选择
        if (selectedPolygonId === id) {
            selectedPolygonId = null;
        }
        
        updatePolygonList();
        logMessage(`已删除 ${polygon.polygonData.name}`, 'success');
    }
}

// 切换面板
function togglePanel() {
    const panel = document.getElementById('controlPanel');
    panel.classList.toggle('collapsed');
}

// 页面加载时初始化
window.onload = function() {
    initCesium();
};
