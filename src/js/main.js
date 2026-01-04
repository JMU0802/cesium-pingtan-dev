import { SceneManager } from './modules/SceneManager.js';
import { ModelLoader } from './modules/ModelLoader.js';
import { UIController } from './modules/UIController.js';
import { CameraController } from './modules/CameraController.js';

class PingtanViewer {
    constructor() {
        this.init();
    }

    async init() {
        try {
            console.log('开始初始化 PingtanViewer...');

            // 检查 Cesium 是否可用
            if (typeof Cesium === 'undefined') {
                throw new Error('Cesium 库未加载');
            }
            console.log('Cesium 库已加载，版本:', Cesium.VERSION);

            // 检查容器是否存在
            const container = document.getElementById('cesiumContainer');
            if (!container) {
                throw new Error('找不到 cesiumContainer 元素');
            }
            console.log('容器元素已找到');

            // 初始化Cesium场景
            console.log('开始初始化场景管理器...');
            this.sceneManager = new SceneManager('cesiumContainer');
            await this.sceneManager.initialize();

        // 初始化模型加载器
        this.modelLoader = new ModelLoader(this.sceneManager.viewer);
        
        // 初始化相机控制器
        this.cameraController = new CameraController(this.sceneManager.viewer);
        
        // 初始化UI控制器
        this.uiController = new UIController(
            this.sceneManager,
            this.modelLoader,
            this.cameraController
        );

        // 将UIController实例暴露给全局作用域，供HTML中的onclick使用
        window.uiController = this.uiController;

            // 设置初始视角到平潭地区
            console.log('设置初始视角...');
            this.cameraController.flyToPingtan();

            console.log('PingtanViewer 初始化完成！');
        } catch (error) {
            console.error('PingtanViewer 初始化失败:', error);
            console.error('错误堆栈:', error.stack);

            // 显示错误信息给用户
            const container = document.getElementById('cesiumContainer');
            if (container) {
                container.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100%; background: #f0f0f0; color: #333; font-family: Arial, sans-serif;">
                        <div style="text-align: center; padding: 20px;">
                            <h2>初始化失败</h2>
                            <p>错误信息: ${error.message}</p>
                            <p>请检查浏览器控制台获取详细信息</p>
                        </div>
                    </div>
                `;
            }
        }
    }
}

// 启动应用的函数
function startApp() {
    console.log('开始启动应用...');

    // 检查 Cesium 是否已加载
    if (typeof Cesium === 'undefined') {
        console.log('Cesium 尚未加载，等待...');
        setTimeout(startApp, 100);
        return;
    }

    console.log('Cesium 已加载，开始初始化应用...');
    new PingtanViewer();
}

// 等待 DOM 和所有资源加载完成
window.addEventListener('load', () => {
    console.log('页面完全加载完成，开始启动应用...');
    startApp();
});

// 备用方案：如果页面已经加载完成
if (document.readyState === 'complete') {
    console.log('页面已经完全加载，直接启动应用...');
    startApp();
}