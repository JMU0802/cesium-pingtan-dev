export class CameraController {
    constructor(viewer) {
        this.viewer = viewer;
        this.homePosition = {
            destination: Cesium.Cartesian3.fromDegrees(119.79, 25.50, 5000),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
            }
        };
    }

    flyToPingtan() {
        this.viewer.camera.flyTo(this.homePosition);
    }

    flyToHome() {
        this.viewer.camera.flyTo(this.homePosition);
    }

    flyToModel(modelId, modelLoader) {
        const model = modelLoader.loadedModels.get(modelId);
        if (model) {
            if (model.entity) {
                this.viewer.flyTo(model.entity);
            } else if (model.tileset) {
                this.viewer.flyTo(model.tileset);
            }
        }
    }

    enableCameraControls() {
        // 启用相机控制
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
        this.viewer.scene.screenSpaceCameraController.enableZoom = true;
        this.viewer.scene.screenSpaceCameraController.enableTilt = true;
        this.viewer.scene.screenSpaceCameraController.enableLook = true;
    }

    disableCameraControls() {
        // 禁用相机控制
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
        this.viewer.scene.screenSpaceCameraController.enableZoom = false;
        this.viewer.scene.screenSpaceCameraController.enableTilt = false;
        this.viewer.scene.screenSpaceCameraController.enableLook = false;
    }
}