@echo off
echo 🚀 启动安海澳测绘数据可视化系统...
echo.
echo 📂 工作目录: %CD%
echo 🌐 服务器端口: 8080
echo.

cd /d F:\CesiumDev
python -m http.server 8080

pause
