export const demoCategories = [
  {
    id: "basic",
    name: "基础功能",
    description: "地图的基本操作和显示",
    icon: "🗺️",
    demos: [
      {
        id: "basic-map",
        title: "基础地图",
        description: "展示如何初始化一个基础地图",
        icon: "🗺️",
      },
      {
        id: "maptalks-light",
        title: "Light底图",
        description: "白色底图",
        icon: "🗺️",
      },
      {
        id: "maptalks-dark",
        title: "Dark底图",
        description: "黑色底图",
        icon: "🗺️",
      },
      {
        id: "maptalks-esri",
        title: "ESRI底图",
        description: "esri官方遥感影像",
        icon: "🗺️",
      },
      {
        id: "maptalks-css",
        title: "底图风格滤镜",
        description: "cssfilter",
        icon: "🗺️",
      },
    ],
  },
  {
    id: "markers",
    name: "标记与覆盖物",
    description: "各种标记点和覆盖物的使用",
    icon: "📍",
    demos: [
      {
        id: "marker-demo",
        title: "标记点示例",
        description: "在地图上添加和管理标记点",
        icon: "📍",
      },
    ],
  },
  {
    id: "controls",
    name: "控件与交互",
    description: "地图控件和用户交互功能",
    icon: "🎛️",
    demos: [],
  },
  {
    id: "layers",
    name: "图层管理",
    description: "多图层切换和管理",
    icon: "📑",
    demos: [],
  },
  {
    id: "services",
    name: "地图服务",
    description: "地理编码、路径规划等服务",
    icon: "🔧",
    demos: [
      {
        id: "v2-添加深色地图",
        title: "三维建筑",
        description: "展示如何初始化一个基础三维建筑",
        icon: "🏢",
      },
      {
        id: "Proj4-mkt",
        title: "Lambert投影-Geoserver",
        description: "展示如何使用墨卡托和兰伯特投影之间的切换",
        icon: "🗺",
      },
      {
        id: "3d-buildings",
        title: "threejs建筑扫描光效果",
        description: "maptalks+threejs",
        icon: "🏘",
      },
    ],
  },
  {
    id: "advanced",
    name: "高级功能",
    description: "复杂的高级地图功能",
    icon: "⚡",
    demos: [],
  },
];

export const getDemoById = (id) => {
  for (const category of demoCategories) {
    const demo = category.demos.find((d) => d.id === id);
    if (demo) return { ...demo, category };
  }
  return null;
};
