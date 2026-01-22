// Cesium Ion 璁块棶浠ょ墝锛堝凡绉婚櫎杩囨湡token锛屼娇鐢ㄥ紑婧愬湴褰級
// 濡傞渶浣跨敤 Cesium Ion 璧勬簮锛岃璁块棶 https://cesium.com/ion/ 鑾峰彇鏂?token
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
let savedPolygons = [];  // 鏀逛负瀛樺偍瀹屾暣鐨勫杈瑰舰瀵硅薄鏁扮粍
let polygonCounter = 1;  // 澶氳竟褰㈣鏁板櫒
let selectedPolygon = null;
let selectedPolygonId = null;  // 褰撳墠閫変腑鐨勫杈瑰舰ID
let handler;
let ctrlPressed = false;
let keyDownHandler = null;
let keyUpHandler = null;
let mouseDownPosition = null;
let isDraggingScene = false;
let previewLine = null; // 棰勮铏氱嚎

// 鍒濆鍖?Cesium Viewer
function initCesium() {
    try {
        viewer = new Cesium.Viewer('cesiumContainer', {
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),  // 浣跨敤妞悆浣撳湴褰㈤伩鍏?token 閿欒
            imageryProvider: new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/'
            }),  // 浣跨敤 OpenStreetMap 鏇夸唬 Cesium Ion 褰卞儚
            animation: false,
            timeline: false,
            baseLayerPicker: false,  // 绂佺敤浠ラ伩鍏?Cesium Ion 璋冪敤
            geocoder: false,  // 绂佺敤浠ラ伩鍏?Cesium Ion 璋冪敤
            homeButton: true,
            navigationHelpButton: true,
            sceneModePicker: true,
            fullscreenButton: true
        });

        viewer.scene.globe.depthTestAgainstTerrain = true;
        
        // 椋炲悜骞虫江
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(119.789, 25.497, 5000),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
            }
        });

        logMessage('Cesium鍒濆鍖栨垚鍔?, 'success');
        
        // 璁剧疆榧犳爣绉诲姩浜嬩欢鏄剧ず鍧愭爣
        setupMouseMoveHandler();
        
    } catch (error) {
        logMessage('Cesium鍒濆鍖栧け璐? ' + error.message, 'error');
    }
}

// 璁剧疆榧犳爣绉诲姩浜嬩欢
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
                
                document.getElementById('longitude').textContent = longitude + '掳';
                document.getElementById('latitude').textContent = latitude + '掳';
                document.getElementById('height').textContent = height + ' m';
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

// 鏃ュ織娑堟伅
function logMessage(message, type = 'info') {
    const log = document.getElementById('log');
    const timestamp = new Date().toLocaleTimeString();
    const className = 'log-' + type;
    log.innerHTML = `<div class="${className}">[${timestamp}] ${message}</div>` + log.innerHTML;
    
    // 闄愬埗鏃ュ織鏉＄洰鏁伴噺
    const entries = log.querySelectorAll('div');
    if (entries.length > 50) {
        entries[entries.length - 1].remove();
    }
}

// 鍔犺浇涓绘ā鍨?function loadMainTileset() {
    try {
        const tileset = viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                url: './pingtan/terra_3Dtiles/tileset.json'
            })
        );
        
        tileset.readyPromise.then(function(tileset) {
            viewer.zoomTo(tileset);
            tilesets.push(tileset);
            logMessage('涓绘ā鍨嬪姞杞芥垚鍔?, 'success');
        }).catch(function(error) {
            logMessage('涓绘ā鍨嬪姞杞藉け璐? ' + error.message, 'error');
        });
    } catch (error) {
        logMessage('鍔犺浇澶辫触: ' + error.message, 'error');
    }
}

// 鍔犺浇 BlockAB
function loadBlockAB() {
    loadBlock('BlockAB', './pingtan/terra_3Dtiles/BlockAB/');
}

// 鍔犺浇 BlockXX
function loadBlockXX() {
    loadBlock('BlockXX', './pingtan/terra_3Dtiles/BlockXX/');
}

// 鍔犺浇 BlockXA
function loadBlockXA() {
    loadBlock('BlockXA', './pingtan/terra_3Dtiles/BlockXA/');
}

// 鍔犺浇 BlockAY
function loadBlockAY() {
    loadBlock('BlockAY', './pingtan/terra_3Dtiles/BlockAY/');
}

// 閫氱敤鍔犺浇鍧楀嚱鏁?function loadBlock(blockName, path) {
    try {
        const tileset = viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                url: path + 'tileset.json'
            })
        );
        
        tileset.readyPromise.then(function(tileset) {
            tilesets.push(tileset);
            logMessage(blockName + ' 鍔犺浇鎴愬姛', 'success');
        }).catch(function(error) {
            logMessage(blockName + ' 鍔犺浇澶辫触: ' + error.message, 'error');
        });
    } catch (error) {
        logMessage(blockName + ' 鍔犺浇澶辫触: ' + error.message, 'error');
    }
}

// 娓呴櫎鎵€鏈夋ā鍨?function clearAll() {
    tilesets.forEach(tileset => {
        viewer.scene.primitives.remove(tileset);
    });
    tilesets = [];
    logMessage('宸叉竻闄ゆ墍鏈夋ā鍨?, 'info');
}

// 寮€濮嬬粯鍒跺杈瑰舰
function startDrawPolygon() {
    if (currentPolygon.isDrawing) {
        logMessage('宸茬粡鍦ㄧ粯鍒舵ā寮忎腑', 'warning');
        return;
    }
    
    logMessage('鈺愨晲鈺愨晲鈺愨晲鈺?寮€濮嬬粯鍒跺杈瑰舰 鈺愨晲鈺愨晲鈺愨晲鈺?, 'success');
    
    currentPolygon.isDrawing = true;
    currentPolygon.points = [];
    currentPolygon.entities = [];
    currentPolygon.lines = [];
    
    logMessage('缁樺埗鐘舵€佸凡璁剧疆: isDrawing = ' + currentPolygon.isDrawing, 'info');
    
    document.getElementById('drawBtn').disabled = true;
    document.getElementById('finishBtn').disabled = false;
    document.getElementById('deletePointBtn').disabled = false;
    document.getElementById('cancelBtn').disabled = false;
    document.getElementById('polygonInfo').style.display = 'block';
    
    logMessage('鎸夐挳鐘舵€佸凡鏇存柊', 'info');
    
    setupDrawHandlers();
    logMessage('鉁?缁樺埗妯″紡宸插惎鍔?- 璇峰乏閿崟鍑诲湴闈㈡坊鍔犵偣', 'success');
}

// 璁剧疆缁樺埗浜嬩欢澶勭悊鍣?function setupDrawHandlers() {
    if (handler) {
        handler.destroy();
    }
    
    // 绉婚櫎鏃х殑閿洏鐩戝惉鍣?    if (keyDownHandler) {
        document.removeEventListener('keydown', keyDownHandler);
    }
    if (keyUpHandler) {
        document.removeEventListener('keyup', keyUpHandler);
    }
    
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    // 绂佺敤鍙抽敭涓婁笅鏂囪彍鍗?    viewer.scene.canvas.oncontextmenu = function(e) {
        e.preventDefault();
        return false;
    };
    
    // 鐩戝惉閿洏Ctrl閿?    keyDownHandler = function(e) {
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
    
    logMessage('浜嬩欢澶勭悊鍣ㄥ凡璁剧疆', 'success');
    
    // 宸﹂敭鎸変笅 - 璁板綍浣嶇疆
    handler.setInputAction(function(click) {
        if (!currentPolygon.isDrawing) return;
        
        mouseDownPosition = click.position.clone();
        isDraggingScene = false;
        
        const pickedObject = viewer.scene.pick(click.position);
        
        // 濡傛灉鐐瑰嚮鐨勬槸宸叉湁鐐癸紝鍑嗗鎷栧姩鐐?        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.isPoint) {
            currentPolygon.isDragging = true;
            currentPolygon.draggedEntity = pickedObject.id;
            viewer.scene.screenSpaceCameraController.enableRotate = false;
            logMessage('閫変腑鐐癸紝鍑嗗鎷栧姩', 'success');
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    
    // 榧犳爣绉诲姩 - 鎷栧姩鐐规垨鏄剧ず棰勮铏氱嚎
    handler.setInputAction(function(movement) {
        if (!currentPolygon.isDrawing) return;
        
        if (currentPolygon.isDragging && currentPolygon.draggedEntity) {
            // 鎷栧姩鐐?- 浣跨敤scene.pickPosition鑾峰彇鏇村噯纭殑鍧愭爣
            const cartesian = viewer.scene.pickPosition(movement.endPosition);
            if (!cartesian) {
                // 濡傛灉pickPosition澶辫触锛屼娇鐢╣lobe.pick
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
            // 妫€娴嬫槸鍚﹀湪鎷栧姩鍦烘櫙
            const distance = Cesium.Cartesian2.distance(mouseDownPosition, movement.endPosition);
            if (distance > 5) {
                isDraggingScene = true;
            }
        } else if (currentPolygon.points.length > 0) {
            // 鏄剧ず棰勮铏氱嚎 - 浣跨敤scene.pickPosition鑾峰彇鏇村噯纭殑鍧愭爣
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
    
    // 宸﹂敭閲婃斁 - 娣诲姞鐐规垨缁撴潫鎷栧姩鎴栨彃鍏ョ偣
    handler.setInputAction(function(click) {
        if (currentPolygon.isDragging) {
            // 缁撴潫鎷栧姩鐐?            currentPolygon.isDragging = false;
            currentPolygon.draggedEntity = null;
            viewer.scene.screenSpaceCameraController.enableRotate = true;
            logMessage('鐐瑰凡绉诲姩', 'success');
        } else if (mouseDownPosition && !isDraggingScene) {
            // 娌℃湁鎷栧姩鍦烘櫙锛屾槸鍗曞嚮琛屼负
            if (ctrlPressed && currentPolygon.points.length >= 2) {
                // Ctrl + 鐐瑰嚮鍦ㄧ嚎娈典笂鎻掑叆鐐?                let cartesian = viewer.scene.pickPosition(click.position);
                if (!cartesian) {
                    const ray = viewer.camera.getPickRay(click.position);
                    cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                }
                if (cartesian) {
                    insertPointOnLine(cartesian);
                }
            } else if (!ctrlPressed) {
                // 宸﹂敭鍗曞嚮娣诲姞鐐?- 浣跨敤scene.pickPosition鑾峰彇鏇村噯纭殑鍧愭爣
                let cartesian = viewer.scene.pickPosition(click.position);
                if (!cartesian) {
                    // 濡傛灉pickPosition澶辫触锛屼娇鐢╣lobe.pick
                    const ray = viewer.camera.getPickRay(click.position);
                    cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                }
                if (cartesian) {
                    logMessage('鑾峰彇鍧愭爣鎴愬姛', 'success');
                    addPolygonPoint(cartesian);
                } else {
                    logMessage('鏃犳硶鑾峰彇鍧愭爣鐐?, 'error');
                }
            }
        }
        
        mouseDownPosition = null;
        isDraggingScene = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    
    // 鍙抽敭鐐瑰嚮鍒犻櫎鐐?    handler.setInputAction(function(click) {
        if (!currentPolygon.isDrawing) return;
        
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.isPoint) {
            deletePolygonPoint(pickedObject.id);
            logMessage('鍙抽敭鍒犻櫎鐐?, 'info');
        }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    
    // 鍙屽嚮瀹屾垚缁樺埗
    handler.setInputAction(function() {
        if (currentPolygon.isDrawing && currentPolygon.points.length >= 3) {
            finishDrawing();
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}

// 鏇存柊棰勮铏氱嚎
function updatePreviewLine(cartesian) {
    // 绉婚櫎鏃х殑棰勮绾?    if (previewLine) {
        viewer.entities.remove(previewLine);
        previewLine = null;
    }
    
    // 濡傛灉鏈夎嚦灏戜竴涓偣锛屽垱寤洪瑙堢嚎 - 缁胯壊铏氱嚎
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

// 娓呴櫎棰勮铏氱嚎
function clearPreviewLine() {
    if (previewLine) {
        viewer.entities.remove(previewLine);
        previewLine = null;
    }
}

// 娣诲姞澶氳竟褰㈢偣
function addPolygonPoint(cartesian) {
    currentPolygon.points.push(cartesian);
    
    // 鏄剧ず鍧愭爣淇℃伅
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
    const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
    const height = cartographic.height.toFixed(2);
    logMessage(`鍧愭爣: 缁忓害${lon}掳, 绾害${lat}掳, 楂樺害${height}m`, 'info');
    
    // 娓呴櫎棰勮绾?    clearPreviewLine();
    
    // 娣诲姞鐐瑰疄浣?- 绾㈣壊鐐规爣璁?    const pointEntity = viewer.entities.add({
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
    
    // 濡傛灉鏈夊涓偣锛岀粯鍒跺疄绾跨嚎娈?    if (currentPolygon.points.length > 1) {
        drawLine(currentPolygon.points[currentPolygon.points.length - 2], cartesian);
    }
    
    updatePolygonStats();
    logMessage(`鉁?娣诲姞鐐?- 鎬荤偣鏁? ${currentPolygon.points.length}`, 'success');
}

// 鍒犻櫎澶氳竟褰㈢偣
function deletePolygonPoint(entity) {
    const index = currentPolygon.entities.indexOf(entity);
    if (index !== -1) {
        viewer.entities.remove(entity);
        currentPolygon.entities.splice(index, 1);
        currentPolygon.points.splice(index, 1);
        redrawPolygon();
        updatePolygonStats();
        logMessage(`鍒犻櫎鐐?- 鍓╀綑 ${currentPolygon.points.length} 涓偣`, 'info');
    }
}

// 鍒犻櫎涓婁竴涓偣
function deleteLastPoint() {
    if (currentPolygon.points.length > 0) {
        const lastEntity = currentPolygon.entities[currentPolygon.entities.length - 1];
        viewer.entities.remove(lastEntity);
        currentPolygon.entities.pop();
        currentPolygon.points.pop();
        redrawPolygon();
        updatePolygonStats();
        logMessage(`鍒犻櫎涓婁竴鐐?- 鍓╀綑 ${currentPolygon.points.length} 涓偣`, 'info');
    }
}

// 鍦ㄧ嚎娈典笂鎻掑叆鐐?function insertPointOnLine(cartesian) {
    let closestIndex = -1;
    let minDistance = Infinity;
    
    // 鎵惧埌鏈€杩戠殑绾挎
    for (let i = 0; i < currentPolygon.points.length - 1; i++) {
        const distance = distanceToLineSegment(cartesian, currentPolygon.points[i], currentPolygon.points[i + 1]);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
        }
    }
    
    // 妫€鏌ラ棴鍚堢嚎娈?    if (currentPolygon.points.length >= 3) {
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
        // 鎻掑叆鐐?        currentPolygon.points.splice(closestIndex + 1, 0, cartesian);
        
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
        logMessage('鎻掑叆鐐规垚鍔?, 'success');
    }
}

// 璁＄畻鐐瑰埌绾挎鐨勮窛绂?function distanceToLineSegment(point, lineStart, lineEnd) {
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

// 缁樺埗绾挎 - 缁胯壊绾挎
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

// 閲嶇粯澶氳竟褰?function redrawPolygon() {
    // 绉婚櫎鎵€鏈夌嚎娈?    currentPolygon.lines.forEach(line => viewer.entities.remove(line));
    currentPolygon.lines = [];
    
    // 閲嶆柊缁樺埗鎵€鏈夌嚎娈?    for (let i = 0; i < currentPolygon.points.length - 1; i++) {
        drawLine(currentPolygon.points[i], currentPolygon.points[i + 1]);
    }
    
    // 闂悎绾挎
    if (currentPolygon.points.length >= 3) {
        drawLine(currentPolygon.points[currentPolygon.points.length - 1], currentPolygon.points[0]);
    }
}

// 瀹屾垚缁樺埗
function finishDrawing() {
    if (!currentPolygon.isDrawing || currentPolygon.points.length < 3) {
        logMessage('鑷冲皯闇€瑕?涓偣鎵嶈兘瀹屾垚澶氳竟褰?, 'warning');
        return;
    }
    
    // 娓呴櫎棰勮绾?    clearPreviewLine();
    
    // 鍒涘缓澶氳竟褰㈠疄浣?    const fillColor = hexToColor(document.getElementById('fillColor').value);
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
            name: `澶氳竟褰?${polygonCounter}`,
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
    
    // 鏇存柊澶氳竟褰㈠垪琛?    updatePolygonList();
    
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
    
    // 绉婚櫎閿洏鐩戝惉鍣?    if (keyDownHandler) {
        document.removeEventListener('keydown', keyDownHandler);
        keyDownHandler = null;
    }
    if (keyUpHandler) {
        document.removeEventListener('keyup', keyUpHandler);
        keyUpHandler = null;
    }
    ctrlPressed = false;
    
    logMessage(`${polygonEntity.polygonData.name} 缁樺埗瀹屾垚 - 闈㈢Н: ${area.toFixed(2)} m虏`, 'success');
    
    setupPolygonSelectionHandler();
    logMessage('澶氳竟褰㈢粯鍒跺畬鎴?- 闈㈢Н: ' + polygonEntity.polygonData.area.toFixed(2) + ' m虏', 'success');
}

// 鍙栨秷缁樺埗
function cancelPolygon() {
    // 娓呴櫎棰勮绾?    clearPreviewLine();
    
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
    
    // 绉婚櫎閿洏鐩戝惉鍣?    if (keyDownHandler) {
        document.removeEventListener('keydown', keyDownHandler);
        keyDownHandler = null;
    }
    if (keyUpHandler) {
        document.removeEventListener('keyup', keyUpHandler);
        keyUpHandler = null;
    }
    ctrlPressed = false;
    
    logMessage('鍙栨秷缁樺埗', 'info');
}

// 鏇存柊澶氳竟褰㈢粺璁′俊鎭?function updatePolygonStats() {
    document.getElementById('polygonPoints').textContent = currentPolygon.points.length;
    
    if (currentPolygon.points.length >= 2) {
        const perimeter = calculatePerimeter(currentPolygon.points);
        document.getElementById('polygonPerimeter').textContent = perimeter.toFixed(2) + ' m';
    }
    
    if (currentPolygon.points.length >= 3) {
        const area = calculateArea(currentPolygon.points);
        document.getElementById('polygonArea').textContent = area.toFixed(2) + ' m虏';
    }
}

// 璁＄畻鍛ㄩ暱
function calculatePerimeter(points) {
    let perimeter = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
        perimeter += Cesium.Cartesian3.distance(points[i], points[i + 1]);
    }
    
    // 闂悎杈?    if (points.length >= 3) {
        perimeter += Cesium.Cartesian3.distance(points[points.length - 1], points[0]);
    }
    
    return perimeter;
}

// 璁＄畻闈㈢Н (浣跨敤Cesium鍐呯疆鐨勫杈瑰舰闈㈢Н璁＄畻)
function calculateArea(points) {
    if (points.length < 3) return 0;
    
    // 杞崲涓虹粡绾害鍧愭爣
    const positions = points.map(p => {
        const cartographic = Cesium.Cartographic.fromCartesian(p);
        return new Cesium.Cartographic(cartographic.longitude, cartographic.latitude, 0);
    });
    
    // 浣跨敤鏇村噯纭殑鐞冮潰闈㈢Н璁＄畻
    let area = 0;
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    
    for (let i = 0; i < positions.length; i++) {
        const j = (i + 1) % positions.length;
        
        const pos1 = ellipsoid.cartographicToCartesian(positions[i]);
        const pos2 = ellipsoid.cartographicToCartesian(positions[j]);
        
        // 璁＄畻涓ょ偣涔嬮棿鐨勫姬闀?        const distance = Cesium.Cartesian3.distance(pos1, pos2);
        
        // 浣跨敤姊舰鍏紡绱姞闈㈢Н
        const lat1 = positions[i].latitude;
        const lat2 = positions[j].latitude;
        const lon1 = positions[i].longitude;
        const lon2 = positions[j].longitude;
        
        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    // 杞崲涓哄钩鏂圭背
    const radius = ellipsoid.maximumRadius;
    area = Math.abs(area * radius * radius / 2.0);
    
    return area;
}

// 淇濆瓨澶氳竟褰?function savePolygon() {
    if (savedPolygons.length === 0) {
        logMessage('娌℃湁鍙繚瀛樼殑澶氳竟褰?, 'warning');
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
    logMessage('澶氳竟褰㈠凡淇濆瓨: ' + filename, 'success');
}

// 鏄剧ず鍔犺浇妯℃€佹
function showLoadModal() {
    document.getElementById('loadModal').style.display = 'block';
}

// 鍏抽棴鍔犺浇妯℃€佹
function closeLoadModal() {
    document.getElementById('loadModal').style.display = 'none';
}

// 鍔犺浇澶氳竟褰㈡枃浠?function loadPolygonFile() {
    const fileInput = document.getElementById('loadFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        logMessage('璇烽€夋嫨鏂囦欢', 'warning');
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
                        name: `澶氳竟褰?${polygonCounter}`,
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
            logMessage(`鍔犺浇浜?${data.length} 涓杈瑰舰`, 'success');
            
        } catch (error) {
            logMessage('鍔犺浇澶辫触: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

// 璁剧疆澶氳竟褰㈤€夋嫨澶勭悊鍣?function setupPolygonSelectionHandler() {
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

// 閫夋嫨澶氳竟褰?function selectPolygon(polygonEntity) {
    deselectPolygon();
    
    selectedPolygon = polygonEntity;
    
    // 楂樹寒鏄剧ず
    const currentColor = polygonEntity.polygon.material.getValue().color;
    polygonEntity.polygon.material = Cesium.Color.fromAlpha(
        Cesium.Color.CYAN,
        currentColor.alpha
    );
    
    document.getElementById('deletePolyBtn').disabled = false;
    logMessage('閫変腑澶氳竟褰?- 闈㈢Н: ' + polygonEntity.polygonData.area.toFixed(2) + ' m虏', 'info');
}

// 鍙栨秷閫夋嫨澶氳竟褰?function deselectPolygon() {
    if (selectedPolygon) {
        const fillColor = hexToColor(document.getElementById('fillColor').value);
        fillColor.alpha = parseFloat(document.getElementById('fillOpacity').value) / 100;
        selectedPolygon.polygon.material = fillColor;
        selectedPolygon = null;
        document.getElementById('deletePolyBtn').disabled = true;
    }
}

// 鍒犻櫎閫変腑鐨勫杈瑰舰
function deleteSelectedPolygon() {
    if (selectedPolygon) {
        viewer.entities.remove(selectedPolygon);
        const index = savedPolygons.indexOf(selectedPolygon);
        if (index !== -1) {
            savedPolygons.splice(index, 1);
        }
        selectedPolygon = null;
        document.getElementById('deletePolyBtn').disabled = true;
        logMessage('鍒犻櫎澶氳竟褰?, 'info');
    }
}

// 娓呴櫎鎵€鏈夊杈瑰舰
function clearPolygons() {
    savedPolygons.forEach(polygon => {
        viewer.entities.remove(polygon);
        
        // 鍒犻櫎鐐瑰拰绾挎瀹炰綋
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
    logMessage('娓呴櫎鎵€鏈夊杈瑰舰', 'info');
}

// 棰滆壊杞崲
function hexToColor(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? new Cesium.Color(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1.0
    ) : Cesium.Color.WHITE;
}

// 鏇存柊澶氳竟褰㈠垪琛?function updatePolygonList() {
    const listContainer = document.getElementById('polygonList');
    
    if (savedPolygons.length === 0) {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa; font-size: 12px;">鏆傛棤澶氳竟褰?/div>';
        document.getElementById('totalArea').textContent = '鎬婚潰绉? 0 m虏';
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
                <div class="polygon-item-area">闈㈢Н: ${data.area.toFixed(2)} m虏 | 鍛ㄩ暱: ${data.perimeter.toFixed(2)} m</div>
            </div>
            <button class="polygon-item-delete" onclick="deletePolygonById(${data.id})">鍒犻櫎</button>
        `;
        
        item.onclick = function(e) {
            if (!e.target.classList.contains('polygon-item-delete')) {
                selectPolygonById(data.id);
            }
        };
        
        listContainer.appendChild(item);
    });
    
    document.getElementById('totalArea').textContent = `鎬婚潰绉? ${totalArea.toFixed(2)} m虏`;
}

// 鏍规嵁ID閫夋嫨澶氳竟褰?function selectPolygonById(id) {
    // 鍙栨秷涔嬪墠鐨勯€夋嫨
    if (selectedPolygonId !== null) {
        const prevPolygon = savedPolygons.find(p => p.polygonData.id === selectedPolygonId);
        if (prevPolygon) {
            // 鎭㈠鍘熷棰滆壊
            const color = prevPolygon.polygonData.fillColor.clone();
            color.alpha = prevPolygon.polygonData.originalAlpha;
            prevPolygon.polygon.material = color;
        }
    }
    
    // 閫夋嫨鏂扮殑澶氳竟褰?    selectedPolygonId = id;
    const polygon = savedPolygons.find(p => p.polygonData.id === id);
    
    if (polygon) {
        // 楂樹寒鏄剧ず - 澧炲姞浜害鍜岄€忔槑搴?        const highlightColor = polygon.polygonData.fillColor.clone();
        highlightColor.alpha = Math.min(polygon.polygonData.originalAlpha + 0.3, 0.9);
        polygon.polygon.material = highlightColor;
        
        // 椋炲悜璇ュ杈瑰舰
        viewer.flyTo(polygon, {
            duration: 1.5,
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 500)
        });
        
        logMessage(`閫変腑 ${polygon.polygonData.name}`, 'info');
    }
    
    updatePolygonList();
}

// 鏍规嵁ID鍒犻櫎澶氳竟褰?function deletePolygonById(id) {
    const index = savedPolygons.findIndex(p => p.polygonData.id === id);
    
    if (index !== -1) {
        const polygon = savedPolygons[index];
        
        // 鍒犻櫎澶氳竟褰㈠疄浣?        viewer.entities.remove(polygon);
        
        // 鍒犻櫎鐐瑰拰绾挎瀹炰綋
        if (polygon.polygonData.pointEntities) {
            polygon.polygonData.pointEntities.forEach(entity => viewer.entities.remove(entity));
        }
        if (polygon.polygonData.lineEntities) {
            polygon.polygonData.lineEntities.forEach(entity => viewer.entities.remove(entity));
        }
        
        // 浠庢暟缁勪腑绉婚櫎
        savedPolygons.splice(index, 1);
        
        // 濡傛灉鍒犻櫎鐨勬槸閫変腑鐨勫杈瑰舰锛屾竻闄ら€夋嫨
        if (selectedPolygonId === id) {
            selectedPolygonId = null;
        }
        
        updatePolygonList();
        logMessage(`宸插垹闄?${polygon.polygonData.name}`, 'success');
    }
}

// 鍒囨崲闈㈡澘
function togglePanel() {
    const panel = document.getElementById('controlPanel');
    panel.classList.toggle('collapsed');
}

// 椤甸潰鍔犺浇鏃跺垵濮嬪寲
window.onload = function() {
    initCesium();
};
