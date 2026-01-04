/**
 * 场景管理器 - 负责Cesium场景的初始化和管理
 */
export class SceneManager {
    constructor(containerId) {
        this.containerId = containerId;
        this.viewer = null;
        this.scene = null;
        this.camera = null;
        this.globe = null;
    }

    /**
     * 初始化Cesium场景
     */
    async initialize() {
        try {
            console.log('开始初始化Cesium场景...');

            // 设置Cesium的静态资源路径
            window.CESIUM_BASE_URL = 'https://unpkg.com/cesium@1.131.0/Build/Cesium/';

            console.log('创建Cesium Viewer...');
            // 创建Cesium Viewer
            this.viewer = new Cesium.Viewer(this.containerId, {
                // 基础配置
                animation: false,           // 不显示动画控件
                baseLayerPicker: true,      // 显示图层选择器
                fullscreenButton: true,     // 显示全屏按钮
                geocoder: true,             // 显示地理编码器
                homeButton: true,           // 显示主页按钮
                infoBox: true,              // 显示信息框
                sceneModePicker: true,      // 显示场景模式选择器
                selectionIndicator: true,   // 显示选择指示器
                timeline: false,            // 不显示时间轴
                navigationHelpButton: true, // 显示导航帮助按钮
                navigationInstructionsInitiallyVisible: false,
                
                // 使用默认地形提供者（椭球体地形）
                
                // 使用默认影像图层
                
                // 使用默认天空盒
            });

            // 获取场景相关对象的引用
            this.scene = this.viewer.scene;
            this.camera = this.viewer.camera;
            this.globe = this.scene.globe;

            // 配置场景属性
            this.configureScene();
            
            // 配置地球属性
            this.configureGlobe();

            console.log('Cesium场景初始化成功');
            console.log('Viewer:', this.viewer);
            console.log('Scene:', this.scene);
            console.log('Camera:', this.camera);
            return true;
        } catch (error) {
            console.error('Cesium场景初始化失败:', error);
            console.error('错误详情:', error.stack);
            throw error;
        }
    }

    /**
     * 配置场景属性
     */
    configureScene() {
        // 启用深度测试
        this.scene.globe.depthTestAgainstTerrain = true;
        
        // 配置光照
        this.scene.light = new Cesium.DirectionalLight({
            direction: new Cesium.Cartesian3(1, 0, 0)
        });
        
        // 配置雾效
        this.scene.fog.enabled = true;
        this.scene.fog.density = 0.0002;
        
        // 配置天空大气
        this.scene.skyAtmosphere.show = true;
        
        // 配置地面大气
        this.scene.globe.showGroundAtmosphere = true;
    }

    /**
     * 配置地球属性
     */
    configureGlobe() {
        // 启用光照
        this.globe.enableLighting = true;
        
        // 配置水面效果
        this.globe.oceanNormalMapUrl = 'https://unpkg.com/cesium@1.131.0/Build/Cesium/Assets/Textures/waterNormals.jpg';
        
        // 配置地形夸张
        this.globe.terrainExaggeration = 1.0;
        
        // 配置基础颜色
        this.globe.baseColor = Cesium.Color.BLUE.clone();
    }

    /**
     * 添加图层
     */
    addImageryLayer(imageryProvider, options = {}) {
        const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
        
        if (options.alpha !== undefined) {
            layer.alpha = options.alpha;
        }
        
        if (options.brightness !== undefined) {
            layer.brightness = options.brightness;
        }
        
        if (options.contrast !== undefined) {
            layer.contrast = options.contrast;
        }
        
        return layer;
    }

    /**
     * 移除图层
     */
    removeImageryLayer(layer) {
        this.viewer.imageryLayers.remove(layer);
    }

    /**
     * 添加实体
     */
    addEntity(entity) {
        return this.viewer.entities.add(entity);
    }

    /**
     * 移除实体
     */
    removeEntity(entity) {
        this.viewer.entities.remove(entity);
    }

    /**
     * 清除所有实体
     */
    clearEntities() {
        this.viewer.entities.removeAll();
    }

    /**
     * 添加数据源
     */
    addDataSource(dataSource) {
        return this.viewer.dataSources.add(dataSource);
    }

    /**
     * 移除数据源
     */
    removeDataSource(dataSource) {
        this.viewer.dataSources.remove(dataSource);
    }

    /**
     * 获取场景截图
     */
    captureScreenshot() {
        return this.viewer.scene.canvas.toDataURL();
    }

    /**
     * 销毁场景
     */
    destroy() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
            this.scene = null;
            this.camera = null;
            this.globe = null;
        }
    }

    /**
     * 获取当前相机位置
     */
    getCameraPosition() {
        const position = this.camera.position;
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        
        return {
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
            height: cartographic.height
        };
    }

    /**
     * 设置相机位置
     */
    setCameraPosition(longitude, latitude, height, heading = 0, pitch = -90, roll = 0) {
        this.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            orientation: {
                heading: Cesium.Math.toRadians(heading),
                pitch: Cesium.Math.toRadians(pitch),
                roll: Cesium.Math.toRadians(roll)
            }
        });
    }

    /**
     * 飞行到指定位置
     */
    flyTo(longitude, latitude, height, duration = 3.0) {
        return this.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            duration: duration
        });
    }

    /**
     * 获取地面高度
     */
    async getTerrainHeight(longitude, latitude) {
        const positions = [Cesium.Cartographic.fromDegrees(longitude, latitude)];
        const heights = await Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, positions);
        return heights[0].height;
    }

    /**
     * 切换地形显示
     */
    toggleTerrain() {
        this.globe.show = !this.globe.show;
        return this.globe.show;
    }

    /**
     * 切换影像图层
     */
    toggleImagery() {
        const layers = this.viewer.imageryLayers;
        if (layers.length > 0) {
            const baseLayer = layers.get(0);
            baseLayer.show = !baseLayer.show;
            return baseLayer.show;
        }
        return false;
    }
}
