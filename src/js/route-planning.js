// 航线规划核心功能模块 - 优化版本

// 全局配置
const ROUTE_CONFIG = {
    SEA_LEVEL_HEIGHT: 0,           // 海面高度（米）
    ROUTE_HEIGHT_OFFSET: 2,        // 航线高度偏移（米，避免与海面重叠）
    INTERPOLATION_POINTS: 50,      // 航线插值点数（处理地球曲率）
    BOUNDARY_HEIGHT_OFFSET: 1,     // 边界线高度偏移
    LABEL_HEIGHT_OFFSET: 50,       // 标签高度偏移
    POINT_HEIGHT_OFFSET: 5         // 航点高度偏移
};

// 绘制航线段（优化版本）
function drawRouteSegment(fromIndex, toIndex) {
    const fromPoint = routePoints[fromIndex];
    const toPoint = routePoints[toIndex];

    // 计算航行信息
    const navInfo = calculateNavigationInfo(fromPoint, toPoint);

    // 生成考虑地球曲率的航线路径
    const routePath = generateCurvedRoutePath(fromPoint, toPoint);

    // 绘制主航线（考虑地球曲率）
    const mainRoute = viewer.entities.add({
        name: `航线段 ${fromIndex + 1}-${toIndex + 1}`,
        description: `
            <h3>航线段 ${fromIndex + 1} → ${toIndex + 1}</h3>
            <p><strong>航程:</strong> ${navInfo.distance.toFixed(2)} 海里</p>
            <p><strong>航向:</strong> ${navInfo.bearing.toFixed(1)}°</p>
            <p><strong>大圆航程:</strong> ${navInfo.greatCircleDistance.toFixed(2)} 海里</p>
            <p><strong>纬度修正系数:</strong> ${navInfo.mercatorCorrection.toFixed(4)}</p>
            <p><strong>航线类型:</strong> 大圆航线（考虑地球曲率）</p>
        `,
        polyline: {
            positions: routePath,
            width: 5,
            material: Cesium.Color.BLUE,
            heightReference: Cesium.HeightReference.NONE, // 不贴地，使用绝对高度
            extrudedHeight: 0,
            followSurface: false, // 不跟随地表，保持直线特性
            granularity: Cesium.Math.toRadians(0.01) // 高精度插值
        }
    });

    routeEntities.push(mainRoute);

    // 绘制航线边界
    if (showBoundaries) {
        drawRouteBoundaries(fromPoint, toPoint, navInfo);
    }

    // 添加航行信息标签
    if (showRouteInfo) {
        addNavigationLabel(fromPoint, toPoint, navInfo);
    }
}

// 生成考虑地球曲率的航线路径
function generateCurvedRoutePath(fromPoint, toPoint) {
    const positions = [];
    const numPoints = ROUTE_CONFIG.INTERPOLATION_POINTS;

    // 使用大圆插值生成平滑的曲线路径
    for (let i = 0; i <= numPoints; i++) {
        const fraction = i / numPoints;

        // 大圆插值计算
        const interpolatedPosition = interpolateGreatCircle(
            fromPoint.longitude, fromPoint.latitude,
            toPoint.longitude, toPoint.latitude,
            fraction
        );

        // 设置海面高度
        const cartesian = Cesium.Cartesian3.fromDegrees(
            interpolatedPosition.longitude,
            interpolatedPosition.latitude,
            ROUTE_CONFIG.SEA_LEVEL_HEIGHT + ROUTE_CONFIG.ROUTE_HEIGHT_OFFSET
        );

        positions.push(cartesian);
    }

    return positions;
}

// 大圆插值函数
function interpolateGreatCircle(lon1, lat1, lon2, lat2, fraction) {
    const lat1Rad = Cesium.Math.toRadians(lat1);
    const lon1Rad = Cesium.Math.toRadians(lon1);
    const lat2Rad = Cesium.Math.toRadians(lat2);
    const lon2Rad = Cesium.Math.toRadians(lon2);

    // 计算大圆距离
    const deltaLat = lat2Rad - lat1Rad;
    const deltaLon = lon2Rad - lon1Rad;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    // 如果距离很小，使用线性插值
    if (c < 0.0001) {
        return {
            longitude: lon1 + (lon2 - lon1) * fraction,
            latitude: lat1 + (lat2 - lat1) * fraction
        };
    }

    // 大圆插值
    const A = Math.sin((1 - fraction) * c) / Math.sin(c);
    const B = Math.sin(fraction * c) / Math.sin(c);

    const x = A * Math.cos(lat1Rad) * Math.cos(lon1Rad) + B * Math.cos(lat2Rad) * Math.cos(lon2Rad);
    const y = A * Math.cos(lat1Rad) * Math.sin(lon1Rad) + B * Math.cos(lat2Rad) * Math.sin(lon2Rad);
    const z = A * Math.sin(lat1Rad) + B * Math.sin(lat2Rad);

    const latRad = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lonRad = Math.atan2(y, x);

    return {
        longitude: Cesium.Math.toDegrees(lonRad),
        latitude: Cesium.Math.toDegrees(latRad)
    };
}

// 计算航行信息（考虑纬度渐长率）
function calculateNavigationInfo(fromPoint, toPoint) {
    const lat1 = Cesium.Math.toRadians(fromPoint.latitude);
    const lon1 = Cesium.Math.toRadians(fromPoint.longitude);
    const lat2 = Cesium.Math.toRadians(toPoint.latitude);
    const lon2 = Cesium.Math.toRadians(toPoint.longitude);
    
    // 计算经差和纬差
    const deltaLon = lon2 - lon1;
    const deltaLat = lat2 - lat1;
    
    // 计算平均纬度
    const meanLat = (lat1 + lat2) / 2;
    
    // 计算纬度渐长率修正
    const mercatorCorrection = Math.cos(meanLat);
    
    // 墨卡托航程计算（考虑纬度渐长率）
    const deltaLonCorrected = deltaLon * mercatorCorrection;
    const mercatorDistance = Math.sqrt(deltaLat * deltaLat + deltaLonCorrected * deltaLonCorrected);
    const mercatorDistanceNM = mercatorDistance * 180 / Math.PI * 60; // 转换为海里
    
    // 大圆航程计算
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
             Math.cos(lat1) * Math.cos(lat2) *
             Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const greatCircleDistanceNM = c * 180 / Math.PI * 60; // 地球半径约为60海里/度
    
    // 计算航向（真航向）
    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    let bearing = Math.atan2(y, x);
    bearing = Cesium.Math.toDegrees(bearing);
    bearing = (bearing + 360) % 360; // 转换为0-360度
    
    return {
        distance: mercatorDistanceNM,
        greatCircleDistance: greatCircleDistanceNM,
        bearing: bearing,
        deltaLat: Cesium.Math.toDegrees(deltaLat),
        deltaLon: Cesium.Math.toDegrees(deltaLon),
        mercatorCorrection: mercatorCorrection
    };
}

// 绘制航线边界（优化版本）
function drawRouteBoundaries(fromPoint, toPoint, navInfo) {
    const boundaryWidthMeters = routeBoundaryWidth * NAUTICAL_MILE_TO_METERS;

    // 生成左右边界的曲线路径
    const leftBoundaryPath = generateBoundaryPath(fromPoint, toPoint, navInfo, -boundaryWidthMeters);
    const rightBoundaryPath = generateBoundaryPath(fromPoint, toPoint, navInfo, boundaryWidthMeters);

    // 绘制左边界（红色虚线）
    const leftBoundary = viewer.entities.add({
        name: `左边界 ${fromPoint.id + 1}-${toPoint.id + 1}`,
        description: `左舷边界 (${routeBoundaryWidth}海里)`,
        polyline: {
            positions: leftBoundaryPath,
            width: 3,
            material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.RED,
                dashLength: 30.0,
                gapColor: Cesium.Color.TRANSPARENT
            }),
            heightReference: Cesium.HeightReference.NONE,
            followSurface: false,
            granularity: Cesium.Math.toRadians(0.01)
        }
    });

    // 绘制右边界（绿色虚线）
    const rightBoundary = viewer.entities.add({
        name: `右边界 ${fromPoint.id + 1}-${toPoint.id + 1}`,
        description: `右舷边界 (${routeBoundaryWidth}海里)`,
        polyline: {
            positions: rightBoundaryPath,
            width: 3,
            material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.GREEN,
                dashLength: 30.0,
                gapColor: Cesium.Color.TRANSPARENT
            }),
            heightReference: Cesium.HeightReference.NONE,
            followSurface: false,
            granularity: Cesium.Math.toRadians(0.01)
        }
    });

    routeEntities.push(leftBoundary, rightBoundary);
}

// 生成边界路径（考虑地球曲率）
function generateBoundaryPath(fromPoint, toPoint, navInfo, offsetMeters) {
    const positions = [];
    const numPoints = ROUTE_CONFIG.INTERPOLATION_POINTS;

    for (let i = 0; i <= numPoints; i++) {
        const fraction = i / numPoints;

        // 在主航线上插值
        const interpolatedPosition = interpolateGreatCircle(
            fromPoint.longitude, fromPoint.latitude,
            toPoint.longitude, toPoint.latitude,
            fraction
        );

        // 计算该点的航向（用于确定边界方向）
        let localBearing;
        if (i === 0) {
            localBearing = navInfo.bearing;
        } else if (i === numPoints) {
            localBearing = navInfo.bearing;
        } else {
            // 计算局部航向
            const prevFraction = Math.max(0, (i - 1) / numPoints);
            const nextFraction = Math.min(1, (i + 1) / numPoints);

            const prevPos = interpolateGreatCircle(
                fromPoint.longitude, fromPoint.latitude,
                toPoint.longitude, toPoint.latitude,
                prevFraction
            );
            const nextPos = interpolateGreatCircle(
                fromPoint.longitude, fromPoint.latitude,
                toPoint.longitude, toPoint.latitude,
                nextFraction
            );

            localBearing = calculateBearing(prevPos.longitude, prevPos.latitude,
                                          nextPos.longitude, nextPos.latitude);
        }

        // 计算边界点
        const boundaryPoint = calculateBoundaryPointFromPosition(
            interpolatedPosition.longitude,
            interpolatedPosition.latitude,
            localBearing,
            Math.abs(offsetMeters),
            offsetMeters < 0 // 左舷为true，右舷为false
        );

        const cartesian = Cesium.Cartesian3.fromDegrees(
            boundaryPoint.longitude,
            boundaryPoint.latitude,
            ROUTE_CONFIG.SEA_LEVEL_HEIGHT + ROUTE_CONFIG.BOUNDARY_HEIGHT_OFFSET
        );

        positions.push(cartesian);
    }

    return positions;
}

// 计算航向
function calculateBearing(lon1, lat1, lon2, lat2) {
    const lat1Rad = Cesium.Math.toRadians(lat1);
    const lon1Rad = Cesium.Math.toRadians(lon1);
    const lat2Rad = Cesium.Math.toRadians(lat2);
    const lon2Rad = Cesium.Math.toRadians(lon2);

    const deltaLon = lon2Rad - lon1Rad;
    const y = Math.sin(deltaLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon);

    let bearing = Math.atan2(y, x);
    bearing = Cesium.Math.toDegrees(bearing);
    return (bearing + 360) % 360;
}

// 从位置计算边界点
function calculateBoundaryPointFromPosition(longitude, latitude, bearing, distanceMeters, isLeft) {
    const lat1 = Cesium.Math.toRadians(latitude);
    const lon1 = Cesium.Math.toRadians(longitude);

    // 确定边界方向（左舷或右舷）
    const boundaryBearing = Cesium.Math.toRadians(bearing + (isLeft ? -90 : 90));

    const angularDistance = distanceMeters / 6371000; // 地球半径约6371km

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
                          Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(boundaryBearing));

    const lon2 = lon1 + Math.atan2(Math.sin(boundaryBearing) * Math.sin(angularDistance) * Math.cos(lat1),
                                  Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));

    return {
        longitude: Cesium.Math.toDegrees(lon2),
        latitude: Cesium.Math.toDegrees(lat2)
    };
}

// 计算边界点
function calculateBoundaryPoint(centerPoint, bearing, distanceMeters) {
    const lat1 = Cesium.Math.toRadians(centerPoint.latitude);
    const lon1 = Cesium.Math.toRadians(centerPoint.longitude);
    
    const angularDistance = distanceMeters / 6371000; // 地球半径约6371km
    
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularDistance) +
                          Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing));
    
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
                                  Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2));
    
    return Cesium.Cartesian3.fromDegrees(
        Cesium.Math.toDegrees(lon2),
        Cesium.Math.toDegrees(lat2),
        100
    );
}

// 添加航行信息标签（优化版本）
function addNavigationLabel(fromPoint, toPoint, navInfo) {
    // 计算航线段中点，使用大圆插值确保准确性
    const midPosition = interpolateGreatCircle(
        fromPoint.longitude, fromPoint.latitude,
        toPoint.longitude, toPoint.latitude,
        0.5
    );

    // 设置标签高度（海面上方）
    const labelCartesian = Cesium.Cartesian3.fromDegrees(
        midPosition.longitude,
        midPosition.latitude,
        ROUTE_CONFIG.SEA_LEVEL_HEIGHT + ROUTE_CONFIG.LABEL_HEIGHT_OFFSET
    );

    // 创建信息标签
    const infoLabel = viewer.entities.add({
        name: `航行信息 ${fromPoint.id + 1}-${toPoint.id + 1}`,
        description: `
            <h3>🧭 详细航行信息</h3>
            <p><strong>航程:</strong> ${navInfo.distance.toFixed(2)} 海里</p>
            <p><strong>航向:</strong> ${navInfo.bearing.toFixed(1)}°</p>
            <p><strong>大圆航程:</strong> ${navInfo.greatCircleDistance.toFixed(2)} 海里</p>
            <p><strong>纬差:</strong> ${navInfo.deltaLat.toFixed(4)}°</p>
            <p><strong>经差:</strong> ${navInfo.deltaLon.toFixed(4)}°</p>
            <p><strong>纬度修正系数:</strong> ${navInfo.mercatorCorrection.toFixed(4)}</p>
            <p><strong>航程差异:</strong> ${Math.abs(navInfo.distance - navInfo.greatCircleDistance).toFixed(3)} 海里</p>
            <p><strong>地球曲率修正:</strong> 已应用大圆航线</p>
        `,
        position: labelCartesian,
        label: {
            text: `${navInfo.distance.toFixed(1)}nm\n${navInfo.bearing.toFixed(0)}°`,
            font: 'bold 16pt Arial',
            pixelOffset: new Cesium.Cartesian2(0, 0),
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLUE,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            backgroundColor: Cesium.Color.BLUE.withAlpha(0.8),
            backgroundPadding: new Cesium.Cartesian2(12, 8),
            showBackground: true,
            scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 10000, 0.4), // 距离缩放
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // 始终可见
            heightReference: Cesium.HeightReference.NONE // 使用绝对高度
        }
    });

    routeEntities.push(infoLabel);
}

// 优化相机控制，支持数字地球同步
function setupCameraControls() {
    if (!viewer) return;

    // 设置相机约束，确保在合理的高度范围内
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 10;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000; // 支持全球视图

    // 启用地形碰撞检测
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;

    // 设置相机惯性
    viewer.scene.screenSpaceCameraController.inertiaSpin = 0.9;
    viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.9;
    viewer.scene.screenSpaceCameraController.inertiaZoom = 0.8;

    // 监听相机变化，实现航线元素的自适应缩放
    viewer.camera.changed.addEventListener(function() {
        updateRouteElementsScale();
    });
}

// 更新航线元素缩放
function updateRouteElementsScale() {
    if (!viewer || routeEntities.length === 0) return;

    const cameraHeight = viewer.camera.positionCartographic.height;

    // 根据相机高度调整线宽和点大小
    let lineWidthScale = 1.0;
    let pointSizeScale = 1.0;

    if (cameraHeight > 10000) {
        lineWidthScale = Math.min(3.0, cameraHeight / 5000);
        pointSizeScale = Math.min(2.0, cameraHeight / 8000);
    } else if (cameraHeight < 1000) {
        lineWidthScale = Math.max(0.5, cameraHeight / 2000);
        pointSizeScale = Math.max(0.7, cameraHeight / 1500);
    }

    // 应用缩放到航线实体
    routeEntities.forEach(entity => {
        if (entity.polyline) {
            // 调整线宽
            const originalWidth = entity.polyline.width._value || 5;
            entity.polyline.width = originalWidth * lineWidthScale;
        }

        if (entity.point) {
            // 调整点大小
            const originalSize = 18;
            entity.point.pixelSize = originalSize * pointSizeScale;
        }
    });
}

// 完成航线绘制
function finishDrawingRoute() {
    if (!isDrawingRoute) return;
    
    isDrawingRoute = false;
    
    // 移除事件处理器
    if (routeHandler) {
        routeHandler.destroy();
        routeHandler = null;
    }
    
    // 更新按钮状态
    document.getElementById('drawRouteBtn').style.display = 'inline-block';
    document.getElementById('finishRouteBtn').style.display = 'none';
    
    updateRouteInfo();
}

// 清除航线
function clearRoute() {
    // 清除所有航线实体
    routeEntities.forEach(entity => {
        viewer.entities.remove(entity);
    });
    
    // 重置变量
    routePoints = [];
    routeEntities = [];
    isDrawingRoute = false;
    
    // 移除事件处理器
    if (routeHandler) {
        routeHandler.destroy();
        routeHandler = null;
    }
    
    // 重置按钮状态
    document.getElementById('drawRouteBtn').style.display = 'inline-block';
    document.getElementById('finishRouteBtn').style.display = 'none';
    
    updateRouteInfo('航线已清除，请重新绘制或加载预设航线');
}

// 更新边界宽度
function updateBoundaryWidth(value) {
    routeBoundaryWidth = parseFloat(value);
    document.getElementById('boundaryWidthValue').textContent = value;
    
    // 如果有航线，重新绘制边界
    if (routePoints.length >= 2) {
        // 清除现有边界
        const boundaryEntities = routeEntities.filter(entity => 
            entity.name && (entity.name.includes('边界') || entity.name.includes('boundary'))
        );
        boundaryEntities.forEach(entity => {
            viewer.entities.remove(entity);
            const index = routeEntities.indexOf(entity);
            if (index > -1) {
                routeEntities.splice(index, 1);
            }
        });
        
        // 重新绘制边界
        if (showBoundaries) {
            for (let i = 1; i < routePoints.length; i++) {
                const navInfo = calculateNavigationInfo(routePoints[i-1], routePoints[i]);
                drawRouteBoundaries(routePoints[i-1], routePoints[i], navInfo);
            }
        }
    }
    
    updateRouteInfo();
}

// 切换航行信息显示
function toggleRouteInfo() {
    const infoEntities = routeEntities.filter(entity => 
        entity.name && entity.name.includes('航行信息')
    );
    
    if (infoEntities.length === 0) {
        updateRouteInfo('没有航行信息可显示');
        return;
    }
    
    showRouteInfo = !showRouteInfo;
    infoEntities.forEach(entity => {
        entity.label.show = showRouteInfo;
    });
    
    updateRouteInfo();
}

// 切换边界线显示
function toggleBoundaries() {
    const boundaryEntities = routeEntities.filter(entity => 
        entity.name && (entity.name.includes('边界') || entity.name.includes('boundary'))
    );
    
    if (boundaryEntities.length === 0) {
        updateRouteInfo('没有边界线可显示');
        return;
    }
    
    showBoundaries = !showBoundaries;
    boundaryEntities.forEach(entity => {
        entity.polyline.show = showBoundaries;
    });
    
    updateRouteInfo();
}

// 更新航线信息显示
function updateRouteInfo(message = null) {
    const infoDiv = document.getElementById('routeInfo');

    if (message) {
        infoDiv.innerHTML = `<p>${message}</p>`;
        return;
    }

    if (routePoints.length === 0) {
        infoDiv.innerHTML = `
            <p>请开始绘制航线或加载预设航线</p>
            <p style="color: #888; font-size: 11px;">
                • 点击地图添加航点<br>
                • 系统自动计算航程和航向<br>
                • 考虑纬度渐长率修正<br>
                • 显示左红右绿边界线
            </p>
        `;
        return;
    }

    let totalDistance = 0;
    let totalGreatCircleDistance = 0;
    let segments = [];

    for (let i = 1; i < routePoints.length; i++) {
        const navInfo = calculateNavigationInfo(routePoints[i-1], routePoints[i]);
        totalDistance += navInfo.distance;
        totalGreatCircleDistance += navInfo.greatCircleDistance;
        segments.push(navInfo);
    }

    let html = `
        <div class="route-info">
            <p><span class="highlight">航点数量:</span> ${routePoints.length}</p>
            <p><span class="highlight">航线段数:</span> ${segments.length}</p>
            <p><span class="highlight">总航程:</span> ${totalDistance.toFixed(2)} 海里</p>
            <p><span class="highlight">大圆总航程:</span> ${totalGreatCircleDistance.toFixed(2)} 海里</p>
            <p><span class="highlight">航程差异:</span> ${Math.abs(totalDistance - totalGreatCircleDistance).toFixed(3)} 海里</p>
            <p><span class="highlight">边界宽度:</span> ${routeBoundaryWidth} 海里</p>
        </div>
    `;

    if (segments.length > 0) {
        html += '<div style="margin-top: 10px; font-size: 11px; color: #ccc;">';
        html += '<strong>航线段详情:</strong><br>';
        segments.forEach((seg, index) => {
            html += `${index + 1}: ${seg.distance.toFixed(1)}nm, ${seg.bearing.toFixed(0)}°<br>`;
        });
        html += '</div>';
    }

    infoDiv.innerHTML = html;
}

// 加载预设航线1：安海澳巡航航线
function loadSampleRoute1() {
    clearRoute();

    const samplePoints = [
        { lon: 119.690, lat: 25.410 },
        { lon: 119.700, lat: 25.410 },
        { lon: 119.700, lat: 25.420 },
        { lon: 119.690, lat: 25.420 },
        { lon: 119.690, lat: 25.410 }
    ];

    samplePoints.forEach(point => {
        addRoutePoint(point.lon, point.lat);
    });

    updateRouteInfo('已加载安海澳巡航航线');
}

// 加载预设航线2：测量作业航线
function loadSampleRoute2() {
    clearRoute();

    const samplePoints = [
        { lon: 119.692, lat: 25.412 },
        { lon: 119.698, lat: 25.412 },
        { lon: 119.698, lat: 25.414 },
        { lon: 119.692, lat: 25.414 },
        { lon: 119.692, lat: 25.416 },
        { lon: 119.698, lat: 25.416 },
        { lon: 119.698, lat: 25.418 },
        { lon: 119.692, lat: 25.418 }
    ];

    samplePoints.forEach(point => {
        addRoutePoint(point.lon, point.lat);
    });

    updateRouteInfo('已加载测量作业航线');
}

// 加载预设航线3：环形巡检航线
function loadSampleRoute3() {
    clearRoute();

    const centerLon = 119.695;
    const centerLat = 25.415;
    const radius = 0.005; // 约0.3海里半径
    const points = 8;

    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const lon = centerLon + radius * Math.cos(angle);
        const lat = centerLat + radius * Math.sin(angle);
        addRoutePoint(lon, lat);
    }

    updateRouteInfo('已加载环形巡检航线');
}

// 导出航线数据
function exportRouteData() {
    if (routePoints.length === 0) {
        updateRouteInfo('没有航线数据可导出');
        return;
    }

    let csvContent = 'Point,Longitude,Latitude,Longitude_DMS,Latitude_DMS\n';

    routePoints.forEach((point, index) => {
        const lonDMS = formatCoordinate(point.longitude, 0).split(',')[0];
        const latDMS = formatCoordinate(0, point.latitude).split(',')[1].trim();

        csvContent += `${index + 1},${point.longitude.toFixed(6)},${point.latitude.toFixed(6)},"${lonDMS}","${latDMS}"\n`;
    });

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `航线数据_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    updateRouteInfo('航线数据已导出为CSV文件');
}

// 导出航行计划
function exportNavigationPlan() {
    if (routePoints.length < 2) {
        updateRouteInfo('需要至少2个航点才能生成航行计划');
        return;
    }

    let planContent = '安海澳海域航行计划\n';
    planContent += '=' .repeat(50) + '\n\n';
    planContent += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    planContent += `航点数量: ${routePoints.length}\n`;
    planContent += `边界宽度: ${routeBoundaryWidth} 海里\n\n`;

    let totalDistance = 0;

    planContent += '航点坐标:\n';
    planContent += '-'.repeat(30) + '\n';
    routePoints.forEach((point, index) => {
        planContent += `航点 ${index + 1}: ${point.longitude.toFixed(6)}°, ${point.latitude.toFixed(6)}°\n`;
        planContent += `         ${formatCoordinate(point.longitude, point.latitude)}\n\n`;
    });

    planContent += '航行信息:\n';
    planContent += '-'.repeat(30) + '\n';
    for (let i = 1; i < routePoints.length; i++) {
        const navInfo = calculateNavigationInfo(routePoints[i-1], routePoints[i]);
        totalDistance += navInfo.distance;

        planContent += `航线段 ${i}: 航点${i} → 航点${i+1}\n`;
        planContent += `  航程: ${navInfo.distance.toFixed(2)} 海里\n`;
        planContent += `  航向: ${navInfo.bearing.toFixed(1)}°\n`;
        planContent += `  大圆航程: ${navInfo.greatCircleDistance.toFixed(2)} 海里\n`;
        planContent += `  纬度修正系数: ${navInfo.mercatorCorrection.toFixed(4)}\n\n`;
    }

    planContent += `总航程: ${totalDistance.toFixed(2)} 海里\n`;
    planContent += `预计航行时间 (10节): ${(totalDistance / 10).toFixed(1)} 小时\n`;

    // 下载文件
    const blob = new Blob([planContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `航行计划_${new Date().toISOString().slice(0,10)}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    updateRouteInfo('航行计划已导出为文本文件');
}
