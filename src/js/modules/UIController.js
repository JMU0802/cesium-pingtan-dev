export class UIController {
    constructor(sceneManager, modelLoader, cameraController) {
        this.sceneManager = sceneManager;
        this.modelLoader = modelLoader;
        this.cameraController = cameraController;
        this.initEventListeners();
    }

    initEventListeners() {
        console.log('初始化事件监听器...');

        // 数据加载按钮
        const loadOBJBtn = document.getElementById('loadOBJ');
        if (loadOBJBtn) {
            loadOBJBtn.addEventListener('click', () => {
                console.log('OBJ按钮被点击');
                this.loadModel('OBJ');
            });
            console.log('OBJ按钮事件监听器已添加');
        } else {
            console.error('找不到loadOBJ按钮');
        }

        const loadOSGBBtn = document.getElementById('loadOSGB');
        if (loadOSGBBtn) {
            loadOSGBBtn.addEventListener('click', () => {
                console.log('OSGB按钮被点击');
                this.loadModel('OSGB');
            });
            console.log('OSGB按钮事件监听器已添加');
        } else {
            console.error('找不到loadOSGB按钮');
        }

        const load3DTilesBtn = document.getElementById('load3DTiles');
        if (load3DTilesBtn) {
            load3DTilesBtn.addEventListener('click', () => {
                console.log('3DTiles按钮被点击');
                this.loadModel('3DTiles');
            });
            console.log('3DTiles按钮事件监听器已添加');
        } else {
            console.error('找不到load3DTiles按钮');
        }

        // 场景控制按钮
        const homeViewBtn = document.getElementById('homeView');
        if (homeViewBtn) {
            homeViewBtn.addEventListener('click', () => {
                console.log('回到初始视角按钮被点击');
                this.cameraController.flyToHome();
            });
            console.log('回到初始视角按钮事件监听器已添加');
        } else {
            console.error('找不到homeView按钮');
        }

        const toggleTerrainBtn = document.getElementById('toggleTerrain');
        if (toggleTerrainBtn) {
            toggleTerrainBtn.addEventListener('click', () => {
                console.log('切换地形按钮被点击');
                const isVisible = this.sceneManager.toggleTerrain();
                this.showMessage(`地形${isVisible ? '显示' : '隐藏'}`, 'info');
            });
            console.log('切换地形按钮事件监听器已添加');
        } else {
            console.error('找不到toggleTerrain按钮');
        }

        const toggleImageryBtn = document.getElementById('toggleImagery');
        if (toggleImageryBtn) {
            toggleImageryBtn.addEventListener('click', () => {
                console.log('切换影像按钮被点击');
                const isVisible = this.sceneManager.toggleImagery();
                this.showMessage(`影像${isVisible ? '显示' : '隐藏'}`, 'info');
            });
            console.log('切换影像按钮事件监听器已添加');
        } else {
            console.error('找不到toggleImagery按钮');
        }

        // 添加测试按钮
        const testBtn = document.getElementById('testButton');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                console.log('测试按钮被点击！');
                this.testFunction();
            });
            console.log('测试按钮事件监听器已添加');
        } else {
            console.error('找不到testButton按钮');
        }

        console.log('所有事件监听器初始化完成');
    }

    testFunction() {
        console.log('测试函数被调用');

        // 检查 Cesium viewer 是否存在
        if (this.sceneManager && this.sceneManager.viewer) {
            console.log('Cesium viewer 存在');

            // 创建一个简单的测试实体
            const testEntity = this.sceneManager.viewer.entities.add({
                name: '测试实体',
                position: Cesium.Cartesian3.fromDegrees(119.79, 25.50, 1000),
                box: {
                    dimensions: new Cesium.Cartesian3(200.0, 200.0, 200.0),
                    material: Cesium.Color.YELLOW.withAlpha(0.8),
                    outline: true,
                    outlineColor: Cesium.Color.BLACK
                },
                label: {
                    text: '测试模型',
                    font: '16pt monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -9)
                }
            });

            // 飞行到测试实体
            this.sceneManager.viewer.flyTo(testEntity);
            this.showMessage('测试实体已创建！', 'success');
            console.log('测试实体已创建并飞行到位置');
        } else {
            console.error('Cesium viewer 不存在！');
            this.showMessage('Cesium viewer 未初始化', 'error');
        }
    }

    async loadModel(type) {
        console.log(`开始加载 ${type} 模型...`);

        const button = document.getElementById(`load${type}`);
        if (!button) {
            console.error(`找不到按钮: load${type}`);
            return;
        }

        button.disabled = true;
        button.textContent = '加载中...';

        try {
            let modelId;
            switch (type) {
                case 'OBJ':
                    console.log('调用 loadOBJModel...');
                    modelId = await this.modelLoader.loadOBJModel();
                    break;
                case 'OSGB':
                    console.log('调用 loadOSGBModel...');
                    modelId = await this.modelLoader.loadOSGBModel();
                    break;
                case '3DTiles':
                    console.log('调用 load3DTiles...');
                    modelId = await this.modelLoader.load3DTiles();
                    break;
                default:
                    throw new Error(`未知的模型类型: ${type}`);
            }

            console.log(`${type} 模型加载成功，ID: ${modelId}`);
            this.updateModelList();
            this.showMessage(`${type} 模型加载成功`, 'success');
        } catch (error) {
            console.error(`${type} 模型加载失败:`, error);
            this.showMessage(`${type} 模型加载失败: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
            button.textContent = `加载${type}模型`;
        }
    }

    updateModelList() {
        const modelList = document.getElementById('modelList');
        const models = this.modelLoader.getLoadedModels();
        
        modelList.innerHTML = '';
        
        models.forEach(model => {
            const modelItem = document.createElement('div');
            modelItem.className = 'model-item';
            modelItem.innerHTML = `
                <span>${model.name}</span>
                <div>
                    <button onclick="uiController.toggleModel('${model.id}')" class="btn">
                        ${model.visible ? '隐藏' : '显示'}
                    </button>
                    <button onclick="uiController.flyToModel('${model.id}')" class="btn">定位</button>
                    <button onclick="uiController.removeModel('${model.id}')" class="btn">删除</button>
                </div>
            `;
            modelList.appendChild(modelItem);
        });
    }

    toggleModel(modelId) {
        this.modelLoader.toggleModelVisibility(modelId);
        this.updateModelList();
    }

    flyToModel(modelId) {
        this.cameraController.flyToModel(modelId, this.modelLoader);
    }

    removeModel(modelId) {
        this.modelLoader.removeModel(modelId);
        this.updateModelList();
    }

    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 4px;
            color: white;
            z-index: 1000;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
    }
}

// 全局暴露UIController实例
window.uiController = null;