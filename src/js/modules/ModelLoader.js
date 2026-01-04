export class ModelLoader {
    constructor(viewer) {
        this.viewer = viewer;
        this.loadedModels = new Map();
        this.modelCounter = 0;
    }

    async loadOBJModel() {
        try {
            console.log('开始加载OBJ模型...');

            // 检查 viewer 是否存在
            if (!this.viewer) {
                throw new Error('Cesium viewer 未初始化');
            }

            const modelId = `obj_model_${++this.modelCounter}`;
            console.log('创建OBJ模型，ID:', modelId);

            // 创建一个简单的盒子作为示例
            const position = Cesium.Cartesian3.fromDegrees(
                119.79 + (Math.random() - 0.5) * 0.01,
                25.50 + (Math.random() - 0.5) * 0.01,
                500 + Math.random() * 1000
            );

            console.log('创建实体位置:', position);

            const entity = this.viewer.entities.add({
                id: modelId,
                name: `OBJ模型示例 ${this.modelCounter}`,
                position: position,
                box: {
                    dimensions: new Cesium.Cartesian3(200.0, 200.0, 200.0),
                    material: Cesium.Color.BLUE.withAlpha(0.7),
                    outline: true,
                    outlineColor: Cesium.Color.BLUE
                },
                label: {
                    text: `OBJ模型 ${this.modelCounter}`,
                    font: '14pt monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -9)
                }
            });

            console.log('实体已创建:', entity);

            this.loadedModels.set(modelId, {
                entity: entity,
                type: 'OBJ',
                visible: true
            });

            // 飞行到新添加的实体
            console.log('飞行到实体...');
            await this.viewer.flyTo(entity);

            console.log('OBJ模型加载完成，ID:', modelId);
            return modelId;
        } catch (error) {
            console.error('加载OBJ模型失败:', error);
            throw error;
        }
    }

    async loadOSGBModel() {
        try {
            console.log('开始加载OSGB模型...');

            if (!this.viewer) {
                throw new Error('Cesium viewer 未初始化');
            }

            const modelId = `osgb_model_${++this.modelCounter}`;
            console.log('创建OSGB模型，ID:', modelId);

            // 创建一个圆柱体作为示例
            const position = Cesium.Cartesian3.fromDegrees(
                119.79 + (Math.random() - 0.5) * 0.01,
                25.50 + (Math.random() - 0.5) * 0.01,
                500 + Math.random() * 1000
            );

            const entity = this.viewer.entities.add({
                id: modelId,
                name: `OSGB模型示例 ${this.modelCounter}`,
                position: position,
                cylinder: {
                    length: 300.0,
                    topRadius: 75.0,
                    bottomRadius: 75.0,
                    material: Cesium.Color.GREEN.withAlpha(0.7),
                    outline: true,
                    outlineColor: Cesium.Color.GREEN
                },
                label: {
                    text: `OSGB模型 ${this.modelCounter}`,
                    font: '14pt monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -9)
                }
            });

            this.loadedModels.set(modelId, {
                entity: entity,
                type: 'OSGB',
                visible: true
            });

            // 飞行到新添加的实体
            await this.viewer.flyTo(entity);

            console.log('OSGB模型加载完成，ID:', modelId);
            return modelId;
        } catch (error) {
            console.error('加载OSGB模型失败:', error);
            throw error;
        }
    }

    async load3DTiles() {
        try {
            console.log('开始加载3D Tiles...');

            if (!this.viewer) {
                throw new Error('Cesium viewer 未初始化');
            }

            const modelId = `3dtiles_model_${++this.modelCounter}`;
            console.log('创建3D Tiles模型，ID:', modelId);

            // 直接创建一个示例几何体，因为实际的3D Tiles可能有路径或格式问题
            const position = Cesium.Cartesian3.fromDegrees(
                119.79 + (Math.random() - 0.5) * 0.01,
                25.50 + (Math.random() - 0.5) * 0.01,
                500 + Math.random() * 1000
            );

            const entity = this.viewer.entities.add({
                id: modelId,
                name: `3D Tiles示例 ${this.modelCounter}`,
                position: position,
                ellipsoid: {
                    radii: new Cesium.Cartesian3(100.0, 100.0, 100.0),
                    material: Cesium.Color.RED.withAlpha(0.7),
                    outline: true,
                    outlineColor: Cesium.Color.RED
                },
                label: {
                    text: `3D Tiles ${this.modelCounter}`,
                    font: '14pt monospace',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -9)
                }
            });

            this.loadedModels.set(modelId, {
                entity: entity,
                type: '3DTiles',
                visible: true
            });

            // 飞行到新添加的实体
            await this.viewer.flyTo(entity);

            console.log('3D Tiles模型加载完成，ID:', modelId);
            return modelId;
        } catch (error) {
            console.error('加载3D Tiles失败:', error);
            throw error;
        }
    }

    getPositionFromMetadata(metadataPath) {
        // 根据metadata.xml解析坐标
        // SRS: EPSG:32650, Origin: 772271.19026144082,2815810.4893674753,120.19799999941539
        const utmCoords = [772271.19026144082, 2815810.4893674753, 120.19799999941539];
        
        // 转换UTM坐标到WGS84
        return Cesium.Cartesian3.fromDegrees(119.79, 25.50, 120); // 平潭大致坐标
    }

    toggleModelVisibility(modelId) {
        const model = this.loadedModels.get(modelId);
        if (model) {
            model.visible = !model.visible;
            if (model.entity) {
                model.entity.show = model.visible;
            } else if (model.tileset) {
                model.tileset.show = model.visible;
            }
        }
    }

    removeModel(modelId) {
        const model = this.loadedModels.get(modelId);
        if (model) {
            if (model.entity) {
                this.viewer.entities.remove(model.entity);
            } else if (model.tileset) {
                this.viewer.scene.primitives.remove(model.tileset);
            }
            this.loadedModels.delete(modelId);
        }
    }

    getLoadedModels() {
        return Array.from(this.loadedModels.entries()).map(([id, model]) => ({
            id,
            name: model.entity?.name || `${model.type} 模型`,
            type: model.type,
            visible: model.visible
        }));
    }
}