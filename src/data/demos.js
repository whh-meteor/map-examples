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
        image: "/img/maptalks-light.png",
      },
      {
        id: "maptalks-dark",
        title: "Dark底图",
        description: "黑色底图",
        icon: "🗺️",
        image: "/img/maptalks-dark.png",
      },
      {
        id: "maptalks-esri",
        title: "ESRI底图",
        description: "esri官方遥感影像",
        icon: "🗺️",
        image: "/img/maptalks-esri.png",
      },
      {
        id: "maptalks-css",
        title: "底图风格滤镜",
        description: "cssfilter",
        icon: "🗺️",
        image: "/img/maptalks-css.png",
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
        id: "heatmap",
        title: "热力图",
        description: "在地图上添加热力图",
         image: "/img/heatmap.png",
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
    demos: [
      {
        id: "2.5d-area",
        title: "2.5D 行政区效果",
        description: "2.5D 行政区效果",
        icon: "🏢",
        image: "/img/2.5d-area.png",
      },
    ],
  },
  {
    id: "services",
    name: "地图服务",
    description: "地理编码、路径规划等服务",
    icon: "🔧",
    demos: [
      {
        id: "Proj4-mkt",
        title: "Lambert投影-Geoserver",
        description:
          "（需要启动Geoserver）展示如何使用墨卡托和兰伯特投影之间的切换",
        icon: "🗺",
        image: "/img/Proj4-mkt.png",
      },    {
        id: "terrain-QGIS",
        title: "自定义地形加载-QGIS灰度图",
        description: "添加自定义地形",
        icon: "🗺",
        image: "/img/arcgis-terrain.png",
      },
      {
        id: "terrain-arcgis",
        title: "arcgis地形",
        description: "添加arcgisx地形",
        icon: "🗺",
        image: "/img/arcgis-terrain.png",
      },
      {
        id: "terrain-arcgis-color",
        title: "色彩地形",
        description: "添加arcgisx地形",
        icon: "🗺",
        image: "/img/arcgis-terrain-color.png",
      },
      {
        id: "terrain-arcgis-lit",
        title: "光照阴影地形",
        description: "添加arcgisx地形",
        icon: "🗺",
        image: "/img/arcgis-terrain-lit.png",
      },
    ],
  },
  {
    id: "3dCity",
    name: "三维效果",
    description: "复杂的高级地图功能",
    icon: "🏠",
    demos: [
      {
        id: "3d-mvt-build",
        title: "三维建筑白模",
        description:
          "（需要启动py后台读取数据）展示如何使用mvt加载大量十六昂瓦片并拉伸为三维建筑模型",
        icon: "🏢",
        image: "/img/3d-mvt-build.png",
      },
      {
        id: "3d-buildings-texture",
        title: "建筑物+纹理贴图",
        description: "maptalks-gl实现效果，建筑，水面",
        image: "/img/3d-buildings-texture.png",
      },
      {
        id: "3d-water",
        title: "maptalks水体效果",
        description: "maptalks-gl实现水面,需要切片数据",
        image: "/img/3d-water.png",
      }, {
        id: "threjs_water",
        title: "threejs水体效果",
        description: "threejs实现水面",
        image: "/img/3d-water.png",
      },
      {
        id: "threejs_ocean_ship",
        title: "three水体船只",
        description: "海洋+船只+geojson裁剪区域",
        image: "/img/threejs_ocean_ship.png",
      },
      {
        id: "3d-buildings",
        title: "threejs建筑扫描光效果",
        description: "maptalks+threejs",
        icon: "🏘",
        image: "/img/3d-buildings.png",
      },
      {
        id: "3d-gltf-tower",
        title: "三维黄岛",
        description: "maptalks+threejs",
        icon: "🏘",
        image: "/img/3d-gltf-tower.png",
      },
    ],
  },
  {
    id: "advanced",
    name: "高级功能",
    description: "复杂的高级地图功能",
    icon: "⚡",
    demos: [
      {
        id: "Animation-clinematic",
        title: "厄尔尼诺现象形成机制",
        description: "厄尔尼诺现象形成机制演示动画",
        icon: "🎞️",
      },
    ],
  },
];

export const getDemoById = (id) => {
  for (const category of demoCategories) {
    const demo = category.demos.find((d) => d.id === id);
    if (demo) return { ...demo, category };
  }
  return null;
};
