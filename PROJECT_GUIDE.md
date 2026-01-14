# 地图功能示例集合

这是一个基于 Vue3 + Vite 构建的地图功能示例展示网站，用于整合和展示各种地图功能的 HTML demo。

## 功能特性

- 📂 **分类展示** - 将地图功能按类别组织展示
- 🔍 **在线预览** - 直接在网页中预览 HTML demo
- ✏️ **在线编辑** - 使用 Monaco Editor 在线编辑代码
- 📱 **响应式设计** - 支持移动端和桌面端
- 🎨 **美观界面** - 现代化的 UI 设计
- 🖥️ **大屏展示** - 针对地图 demo 优化的全屏预览和编辑模式
- 📝 **详细描述** - 每个 demo 都有清晰的标题和描述

## 项目结构

```
Tools-Map/
├── public/
│   └── demos/              # 存放 HTML demo 文件
│       ├── basic-map.html  # 基础地图示例
│       └── marker-demo.html # 标记点示例
├── src/
│   ├── data/
│   │   └── demos.js        # Demo 数据配置
│   ├── router/
│   │   └── index.js        # 路由配置
│   ├── views/
│   │   ├── Home.vue        # 首页
│   │   └── DemoDetail.vue  # Demo 详情页
│   ├── App.vue             # 根组件
│   ├── main.js             # 入口文件
│   └── style.css           # 全局样式
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

## 快速开始

### 前置要求

确保你的系统已安装以下工具之一：

- Node.js (推荐 v16 或更高版本)
- pnpm (可选，更快的包管理器)
- yarn (可选)

### 安装依赖

使用 npm：

```bash
npm install
```

使用 pnpm：

```bash
pnpm install
```

使用 yarn：

```bash
yarn install
```

### 启动开发服务器

使用 npm：

```bash
npm run dev
```

使用 pnpm：

```bash
pnpm dev
```

使用 yarn：

```bash
yarn dev
```

启动后，浏览器会自动打开 `http://localhost:3000`

### 构建生产版本

使用 npm：

```bash
npm run build
```

使用 pnpm：

```bash
pnpm build
```

使用 yarn：

```bash
yarn build
```

## 如何添加新的 Demo

### 1. 创建 HTML 文件

在 `public/demos/` 目录下创建新的 HTML 文件，例如 `my-demo.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>我的Demo</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        background: #f5f5f5;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #333;
        margin-bottom: 10px;
      }
      p {
        color: #666;
        line-height: 1.6;
      }
      .map-container {
        width: 100%;
        height: 600px;
        background: #e0e0e0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>我的地图Demo</h1>
      <p>这是一个示例描述，说明这个demo的功能和用途。</p>

      <div class="map-container" id="map">
        <!-- 地图容器 -->
      </div>
    </div>

    <script>
      // 在这里添加你的地图初始化代码
      console.log("地图demo已加载");
    </script>
  </body>
</html>
```

### 2. 配置 Demo 信息

在 `src/data/demos.js` 中添加 demo 配置：

```javascript
export const demoCategories = [
  {
    id: "basic",
    name: "基础功能",
    description: "地图的基本操作和显示",
    demos: [
      {
        id: "my-demo",
        title: "我的Demo标题",
        description: "Demo的简短描述，说明功能和用途",
        icon: "🗺️",
      },
    ],
  },
];
```

**配置说明：**

- `id`: demo 的唯一标识符，必须与 HTML 文件名一致（不含扩展名）
- `title`: demo 的显示标题
- `description`: demo 的详细描述，会显示在详情页
- `icon`: demo 的图标（emoji）

### 3. 访问 Demo

启动项目后，访问首页即可看到新添加的 demo，点击即可查看和编辑。

## 界面说明

### 首页

首页展示所有分类和 demo，每个 demo 卡片包含：

- 图标
- 标题
- 描述
- 查看按钮
- 编辑按钮

### Demo 详情页

详情页分为两种模式：

#### 预览模式（默认）

- 全屏显示 demo 预览
- 顶部显示 demo 信息（标题、分类、描述）
- 操作按钮：编辑、全屏

#### 编辑模式

- 左侧：代码编辑器（Monaco Editor）
- 右侧：实时预览
- 操作按钮：运行、保存、取消、全屏

**编辑模式特点：**

- 左右分屏，各占 50%
- 实时预览代码修改效果
- 支持全屏编辑

## 分类说明

当前支持以下分类：

- **基础功能** - 地图的基本操作和显示
- **标记与覆盖物** - 各种标记点和覆盖物的使用
- **控件与交互** - 地图控件和用户交互功能
- **图层管理** - 多图层切换和管理
- **地图服务** - 地理编码、路径规划等服务
- **高级功能** - 复杂的高级地图功能

## 在线编辑功能

点击任意 demo 的"编辑"按钮，可以：

- 使用 Monaco Editor 编辑 HTML 代码
- 实时预览编辑效果
- 点击"运行"按钮更新预览
- 全屏编辑模式
- 保存代码（前端演示，实际保存需要后端支持）

**编辑快捷键：**

- `Ctrl/Cmd + S`: 保存代码
- `Ctrl/Cmd + Enter`: 运行代码

## 样式优化说明

本项目针对地图 demo 进行了以下优化：

1. **全屏预览** - 预览区域占据整个可用空间
2. **编辑分屏** - 编辑模式下左右各占 50%
3. **紧凑布局** - 减少不必要的间距，最大化展示区域
4. **响应式设计** - 自动适配不同屏幕尺寸
5. **固定高度** - 防止页面滚动，提供更好的地图交互体验

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - Vue.js 官方路由
- **Monaco Editor** - VS Code 的代码编辑器

## 注意事项

1. HTML demo 文件必须放在 `public/demos/` 目录下
2. Demo 的 id 必须与 HTML 文件名一致（不含扩展名）
3. 在线编辑功能目前仅支持前端预览，实际保存需要后端支持
4. 确保引入的地图 API 密钥有效
5. 建议为地图容器设置固定高度，以获得更好的展示效果

## 开发建议

1. 为每个 demo 添加清晰的注释和说明
2. 保持代码简洁，易于理解
3. 使用语义化的 HTML 标签
4. 添加适当的错误处理
5. 优化性能，避免不必要的资源加载
6. 地图容器建议设置 `height: 100%` 或固定高度
7. 使用 CSS Flexbox 或 Grid 布局，确保地图容器正确显示

## 常见问题

### Q: 如何调整预览区域的高度？

A: 预览区域会自动占据可用空间。如需调整，可以在 `src/views/DemoDetail.vue` 中修改 `.demo-content` 的样式。

### Q: 如何添加新的分类？

A: 在 `src/data/demos.js` 的 `demoCategories` 数组中添加新的分类对象。

### Q: 编辑的代码如何保存？

A: 当前版本仅支持前端预览。如需实现真实的保存功能，需要添加后端 API。

### Q: 支持哪些地图 API？

A: 支持所有基于 HTML/JavaScript 的地图 API，包括：

- 高德地图
- 百度地图
- 腾讯地图
- Leaflet
- OpenLayers
- Mapbox GL JS

## 许可证

MIT License
