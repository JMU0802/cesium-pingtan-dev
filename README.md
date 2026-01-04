# 平潭三维场景管理系统

## 🎯 项目简介

基于 Cesium 的平潭三维场景管理系统，支持加载 pingtan 目录下的 3D Tiles 数据，并提供鼠标绘制地理经纬度点功能。

## 🚀 快速开始

### 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:8080` 启动。

### 访问应用

浏览器访问：
- 主页面：`http://localhost:8080/index.html` （自动跳转到 pingtan-test.html）
- 直接访问：`http://localhost:8080/pingtan-test.html`

## 📦 主要功能

### 1. 3D Tiles 数据加载
- 加载主 Tileset
- 加载 BlockAB 区块
- 加载 BlockXX 区块
- 加载 BlockXA 区块
- 加载 BlockAY 区块

### 2. 鼠标交互
- 实时显示鼠标位置的经纬度坐标
- 坐标显示在页面左下角

### 3. 多边形绘制工具
- ✏️ 单击地图添加顶点
- 🔄 实时预览绘制中的多边形
- ✅ 双击完成绘制（自动闭合）
- 📊 显示多边形面积
- 🗑️ 清除所有多边形

## 🗂️ 项目结构

```
CesiumDev/
├── package.json          # 项目配置
├── server.js            # HTTP 服务器
├── start.bat           # Windows 启动脚本
├── src/
│   ├── index.html          # 入口页面（重定向）
│   ├── pingtan-test.html   # 主应用页面
│   ├── js/                 # JavaScript 模块
│   ├── styles/            # 样式文件
│   └── pingtan/           # Pingtan 3D 数据
│       └── terra_3Dtiles/ # 3D Tiles 数据
└── 安海澳测量数据/        # 测量数据存档
```

## 🛠️ 技术栈

- **Cesium.js** 1.95 - 三维地球引擎
- **http-server** - 开发服务器
- **原生 JavaScript** - 无额外框架依赖

## 📝 使用说明

### 加载 3D 数据
1. 点击"测试路径"检查数据文件是否存在
2. 点击相应的按钮加载不同区块的 3D Tiles 数据
3. 使用鼠标滚轮缩放，拖拽旋转视角

### 绘制多边形
1. 点击"开始绘制"按钮
2. 在地图上单击添加顶点
3. 双击完成绘制
4. 绘制完成后会显示多边形面积

### 查看坐标
- 移动鼠标即可在左下角实时查看当前位置的经纬度坐标

## ⚙️ 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 📄 许可证

MIT License

---

**版本**: 1.0.0  
**最后更新**: 2026年1月4日
