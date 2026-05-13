[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-red)](./LICENSE)

# 人体骨骼 3D 图谱

Human Skeleton 3D Atlas — 交互式人体骨骼解剖学习应用

## 功能

- **206 块骨骼完整覆盖**：颅骨、脊柱、胸廓、上肢、下肢、听小骨，中英文双语名称与描述
- **3D 交互**：鼠标旋转、缩放、平移；点击骨骼高亮显示详情
- **分类筛选与搜索**：按解剖学分类快速定位，支持中英文搜索
- **相机飞行**：从列表选择骨骼时自动飞向目标位置
- **测验模式**：随机出题，输入骨骼名称判分，支持提示
- **主题切换**：暗色 / 亮色模式
- **程序化渲染**：无需外部 3D 模型文件，所有骨骼由代码生成

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 19 + Vite |
| 3D 引擎 | Three.js（React Three Fiber + Drei） |
| 状态管理 | Zustand |
| 渲染方式 | 程序化几何体（无需外部模型文件） |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Meteorkid/skeleton-anatomy.git
cd skeleton-anatomy

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 http://localhost:5173

### 构建

```bash
npm run build
npm run preview
```

## 项目结构

```
skeleton-anatomy/
├── src/
│   ├── components/
│   │   ├── BoneMesh.jsx         # 单块骨骼 mesh（点击/悬停/动画）
│   │   ├── CameraController.jsx # 相机飞行动画
│   │   ├── Canvas3D.jsx         # Three.js Canvas 容器
│   │   ├── InfoPanel.jsx        # 右侧骨骼详情面板
│   │   ├── QuizPanel.jsx        # 测验模式面板
│   │   ├── Sidebar.jsx          # 左侧分类/搜索/列表
│   │   └── SkeletonModel.jsx    # 骨骼模型组装
│   ├── data/
│   │   └── boneData.js          # 206 块骨骼数据
│   ├── store/
│   │   └── useStore.js          # Zustand 全局状态
│   ├── utils/
│   │   └── bonePositions.js     # 骨骼 3D 坐标配置
│   ├── App.jsx
│   └── App.css
├── index.html
├── package.json
└── vite.config.js
```

## 使用指南

- **旋转视角**：鼠标左键拖拽
- **缩放**：鼠标滚轮
- **平移**：鼠标右键拖拽
- **选中骨骼**：左键点击骨骼查看详情
- **搜索**：在左侧面板输入中英文关键词
- **测验**：点击"测验模式"按钮，随机出题

## 未来计划

- [ ] 肌肉系统图谱
- [ ] 血管/神经系统图谱
- [ ] 骨骼动画（行走、跑步）
- [ ] AR 增强现实模式

## License

[AGPL v3](LICENSE)
