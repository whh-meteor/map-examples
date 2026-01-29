/* eslint-disable */
// import * as maptalks from "maptalks-gl";
// import * as turf from "@turf/turf";

// 直接使用提供的海岸线数据
const coastline = {
  type: "FeatureCollection",
  name: "123",
  crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [120.085813517835135, 36.11985172088616],
          [120.131983133879444, 36.094781122926612],
          [120.179145644892486, 36.072937433615316],
          [120.216875653702985, 36.045384598233987],
          [120.232265525717764, 36.029001831250511],
          [120.247903621474762, 36.010633274329649],
          [120.256343228708673, 36.002193667095746],
          [120.258825466130418, 35.99350583611966],
          [120.260314808583459, 35.984321557659229],
          [120.261307703552163, 35.971910370550532],
          [120.258577242388199, 35.960988525894869],
          [120.246166055279474, 35.94857733878618],
          [120.223825918483811, 35.922017398373583],
          [120.137195832465238, 35.882549823367931],
          [120.062728709813072, 35.824961915183586],
          [119.996204746910465, 35.744537422719247],
          [119.913794464508726, 35.682977934660123],
          [119.807802926600374, 35.585674227727949],
          [119.732094685237442, 35.578723962947088],
          [119.652911311483876, 35.585674227727949],
        ],
      },
    },
  ],
};

/**
 * 海岸线漫游功能
 * 将中心点看作飞行器，沿着geojson设定的航线进行飞行
 * 参考: https://maptalks.org/examples/cn/animation/map-view-follow/
 */
class CoastlineRoaming {
  // 在CoastlineRoaming类的constructor中添加防抖相关变量
  constructor(map, options = {}) {
    this.map = map;
    this.options = {
      duration: options.duration || 60000, // 总动画时长（毫秒）
      zoom: options.zoom || 16, // 飞行时的缩放级别
      pitch: options.pitch || 45, // 飞行时的倾斜角度
      autoStart: options.autoStart || false, // 是否自动开始
      onComplete: options.onComplete || null, // 完成回调
      onProgress: options.onProgress || null, // 进度回调
      ...options,
    };

    // 内部状态
    this.isRoaming = false; // 是否正在漫游
    this.pathPoints = []; // 路径点数组
    this.roamingLine = null; // 漫游路径线
    this.aircraftMarker = null; // 飞行器标记
    this.aircraftLayer = null; // 飞行器图层
    this.roamingLayer = null; // 漫游路径图层

    // 保存原始地图状态
    this.originalCenter = null; // 原始中心点
    this.originalZoom = null; // 原始缩放级别
    this.originalBearing = null; // 原始方位角
    this.originalPitch = null; // 原始倾斜角度
    this.originalDragRotate = null; // 原始旋转拖拽状态
    this.originalDragPitch = null; // 原始倾斜拖拽状态

    // 用于跟随动画的变量
    this.currentCoordinate = null; // 当前坐标
    this.preCoordinate = null; // 上一个坐标

    // 新增：用于平滑方位角变化的变量
    this.targetBearing = 0; // 目标方位角
    this.smoothBearing = 0; // 平滑后的方位角
    this.bearingChangeThreshold = 5; // 方位角变化阈值，小于此值不更新
    this.bearingSmoothingFactor = 0.1; // 方位角平滑系数（0-1，越小越平滑）
  }

  // 修改getBearing方法，优化方位角计算
  /**
   * 计算两点之间的方位角（bearing）
   * @param {maptalks.Coordinate} c1 - 起点坐标
   * @param {maptalks.Coordinate} c2 - 终点坐标
   * @returns {Number} 方位角（度）
   */
  getBearing(c1, c2) {
    const dLng = ((c2.x - c1.x) * Math.PI) / 180;
    const lat1 = (c1.y * Math.PI) / 180;
    const lat2 = (c2.y * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  // 修改start方法中的animateShow回调函数，添加方位角平滑处理
  start() {
    // ... 现有代码 ...

    // 使用 animateShow 实现平滑的动画跟随效果
    this.roamingLine.animateShow(
      {
        duration: this.options.duration,
        easing: "linear",
      },
      (frame, c) => {
        if (!this.isRoaming) {
          return;
        }

        // 更新当前坐标
        this.currentCoordinate = c.copy();

        // 更新飞行器位置
        if (this.aircraftMarker) {
          this.currentCoordinate.z = 3000;
          this.aircraftMarker.setCoordinates(this.currentCoordinate);
        }

        // 地图跟随（仅在非交互状态下更新）
        if (this.preCoordinate) {
          if (!this.map.isInteracting()) {
            // 计算目标方位角
            const targetBearing = this.getBearing(
              this.preCoordinate,
              this.currentCoordinate
            );

            // 计算方位角差值，考虑360度环绕
            let bearingDiff = targetBearing - this.smoothBearing;
            if (bearingDiff > 180) {
              bearingDiff -= 360;
            } else if (bearingDiff < -180) {
              bearingDiff += 360;
            }

            // 只有当方位角变化超过阈值时才更新
            if (Math.abs(bearingDiff) > this.bearingChangeThreshold) {
              this.targetBearing = targetBearing;
              // 使用平滑系数更新方位角，实现渐进式变化
              this.smoothBearing += bearingDiff * this.bearingSmoothingFactor;
              this.smoothBearing = (this.smoothBearing + 360) % 360; // 保持在0-360度
            }

            // 平滑更新地图中心点
            if (this.map.animateTo) {
              this.map.animateTo({
                center: this.currentCoordinate,
                zoom: this.options.zoom,
                bearing: this.smoothBearing,
                duration: 32, // 约60fps的帧率
              });
            } else {
              // 兼容没有animateTo的版本
              this.map.setCenter(this.currentCoordinate);
              if (this.map.setBearing) {
                this.map.setBearing(this.smoothBearing);
              }
              if (this.map.getZoom() !== this.options.zoom) {
                this.map.setZoom(this.options.zoom);
              }
            }
          }
        }

        // 更新上一个坐标
        this.preCoordinate = this.currentCoordinate.copy();

        // 触发进度回调
        if (this.options.onProgress) {
          const total = this.pathPoints.length;
          // 估算当前进度（基于动画帧）
          const progress = frame && frame.progress ? frame.progress * 100 : 0;
          this.options.onProgress(progress, frame, total);
        }
      },
      () => {
        // 动画完成回调
        this.isRoaming = false;
        if (this.options.onComplete) {
          this.options.onComplete();
        }
      }
    );
  }

  /**
   * 从GeoJSON数据提取路径坐标
   * @param {Object} geojsonData - GeoJSON数据
   * @returns {Array} 坐标点数组 [[lng, lat], ...]
   */
  extractPathFromGeoJSON(geojsonData) {
    if (!geojsonData || !geojsonData.features) {
      console.warn("GeoJSON数据格式不正确");
      return [];
    }

    // 按照岸线序号属性字段对岸线数据进行排序
    // const sortedFeatures = [...geojsonData.features].sort((a, b) => {
    //   const indexA =
    //     a.properties && a.properties.岸线序号 ? a.properties.岸线序号 : "";
    //   const indexB =
    //     b.properties && b.properties.岸线序号 ? b.properties.岸线序号 : "";

    //   // 尝试按数字排序，如果无法转换为数字则按字符串排序
    //   const numA = Number(indexA);
    //   const numB = Number(indexB);

    //   if (!isNaN(numA) && !isNaN(numB)) {
    //     return numA - numB;
    //   } else {
    //     return indexA.localeCompare(indexB);
    //   }
    // });
    const sortedFeatures = geojsonData.features;
    const pathPoints = [];

    [sortedFeatures].forEach((feature) => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates;
        const geometryType = feature.geometry.type;

        switch (geometryType) {
          case "LineString":
            // LineString: coordinates是点数组 [[lng, lat], ...]
            if (Array.isArray(coordinates)) {
              pathPoints.push(...coordinates);
            }
            break;

          case "MultiLineString":
            // MultiLineString: coordinates是嵌套数组 [[[lng, lat], ...], ...]
            if (Array.isArray(coordinates)) {
              coordinates.forEach((line) => {
                if (Array.isArray(line)) {
                  pathPoints.push(...line);
                }
              });
            }
            break;

          case "Polygon":
            // Polygon: coordinates是 [[[lng, lat], ...], ...] 取第一条边
            if (Array.isArray(coordinates) && coordinates.length > 0) {
              const firstRing = coordinates[0];
              if (Array.isArray(firstRing)) {
                pathPoints.push(...firstRing);
              }
            }
            break;

          case "MultiPolygon":
            // MultiPolygon: coordinates是 [[[[lng, lat], ...], ...], ...]
            // 取第一个多边形的第一条边
            if (
              Array.isArray(coordinates) &&
              coordinates.length > 0 &&
              Array.isArray(coordinates[0]) &&
              coordinates[0].length > 0
            ) {
              const firstRing = coordinates[0][0];
              if (Array.isArray(firstRing)) {
                pathPoints.push(...firstRing);
              }
            }
            break;

          default:
            console.warn(`不支持的几何类型: ${geometryType}`);
            break;
        }
      }
    });

    if (pathPoints.length === 0) {
      console.warn("未能提取到任何路径点");
      return [];
    }

    return pathPoints;
  }

  /**
   * 计算两点之间的方位角（bearing）
   * @param {maptalks.Coordinate} c1 - 起点坐标
   * @param {maptalks.Coordinate} c2 - 终点坐标
   * @returns {Number} 方位角（度）
   */
  getBearing(c1, c2) {
    const dLng = ((c2.x - c1.x) * Math.PI) / 180;
    const lat1 = (c1.y * Math.PI) / 180;
    const lat2 = (c2.y * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    // 如果方位角变化小于30度，保持原来的方位角（避免频繁抖动）
    const currentBearing = this.map.getBearing ? this.map.getBearing() : 0;
    if (Math.abs(currentBearing - bearing) < 30 && this.preCoordinate) {
      return currentBearing;
    }

    return bearing;
  }

  /**
   * 启用自由视角（旋转和倾斜）
   */
  enableFreeView() {
    // 保存原始状态
    this.originalDragRotate =
      this.map.options && this.map.options.dragRotate !== undefined
        ? this.map.options.dragRotate
        : false;
    this.originalDragPitch =
      this.map.options && this.map.options.dragPitch !== undefined
        ? this.map.options.dragPitch
        : false;
    this.originalBearing =
      this.map.getBearing && typeof this.map.getBearing === "function"
        ? this.map.getBearing()
        : 0;
    this.originalPitch =
      this.map.getPitch && typeof this.map.getPitch === "function"
        ? this.map.getPitch()
        : 0;

    // 启用旋转和倾斜
    if (typeof this.map.config === "function") {
      // maptalks v0.49+
      this.map.config({
        dragRotate: true,
        dragPitch: true,
      });
    } else {
      // 兼容旧版本
      if (this.map.options) {
        this.map.options.dragRotate = true;
        this.map.options.dragPitch = true;
      }
    }

    // 设置初始倾斜角度
    if (this.map.setPitch && typeof this.map.setPitch === "function") {
      this.map.setPitch(this.options.pitch);
    }
  }

  /**
   * 恢复原始视角设置
   */
  restoreFreeView() {
    // 恢复原始设置

    if (typeof this.map.config === "function") {
      // maptalks v0.49+
      this.map.config({
        dragRotate:
          this.originalDragRotate !== null ? this.originalDragRotate : false,
        dragPitch:
          this.originalDragPitch !== null ? this.originalDragPitch : false,
      });
    } else {
      // 兼容旧版本
      if (this.map.options) {
        this.map.options.dragRotate =
          this.originalDragRotate !== null ? this.originalDragRotate : false;
        this.map.options.dragPitch =
          this.originalDragPitch !== null ? this.originalDragPitch : false;
      }
    }

    // 恢复原始方位角和倾斜角度
    if (
      this.originalBearing !== null &&
      this.map.setBearing &&
      typeof this.map.setBearing === "function"
    ) {
      this.map.setBearing(this.originalBearing);
    }
    if (
      this.originalPitch !== null &&
      this.map.setPitch &&
      typeof this.map.setPitch === "function"
    ) {
      this.map.setPitch(this.originalPitch);
    }
  }

  /**
   * 创建漫游路径线
   * @param {Array} coordinates - 坐标数组
   */
  createRoamingLine(coordinates) {
    // 如果已有图层，先移除旧的路径
    if (this.roamingLayer) {
      this.roamingLayer.remove();
    }

    // 创建漫游路径图层
    this.roamingLayer = new maptalks.VectorLayer("roaming-path", {
      zIndex: 500,
      enableAltitude: true,
    }).addTo(this.map);

    // 将坐标转换为 maptalks.Coordinate 数组
    const coordiantes = coordinates.map(
      (coord) => new maptalks.Coordinate(coord[0], coord[1])
    );

    // 创建路径线
    this.roamingLine = new maptalks.LineString(coordiantes, {
      symbol: {
        lineColor: "red",
        lineWidth: 2,
        lineOpacity:1,
      },
      properties: {
        altitude: 3000, //altitude for all vertexes
      },
    });

    this.roamingLine.addTo(this.roamingLayer);
  }
  /**
   * 创建飞行器标记
   * @param {maptalks.Coordinate} coordinate - 初始坐标
   */
  createAircraftMarker(coordinate) {
    // console.log("创建飞行器标记，坐标:", coordinate);

    // 如果已有图层，先移除旧的标记
    if (this.aircraftLayer) {
      // console.log("移除旧的飞行器图层");
      this.aircraftLayer.remove();
    }

    try {
      // 确保GLTFLayer可用
      // if (!GLTFLayer) {
      //   console.error("GLTFLayer未正确导入");
      //   return;
      // }

      // 创建GLTF图层
      this.aircraftLayer = new maptalks.GLTFLayer("aircraft", {
        zIndex: 1000,
      });
      // console.log("创建GLTF图层成功");

      // 添加图层到地图
      this.aircraftLayer.addTo(this.map);
      // console.log("GLTF图层已添加到地图");

      // 确保GLTFMarker可用
      // if (!GLTFMarker) {
      //   console.error("GLTFMarker未正确导入");
      //   return;
      // }

      // 创建飞行器标记（使用GLTF模型）
      this.aircraftMarker = new maptalks.GLTFMarker(coordinate, {
        symbol: {
          // GLTF模型路径
          url: "/demos/coastline-roaming/uav/scene.gltf",
          // 大幅增加缩放倍数，确保模型可见
          scale: 60, // 从之前的50增加到10000
          // 使用单独的XYZ缩放参数，更精确控制
          scaleX: 60,
          scaleY: 60,
          scaleZ: 60,
          // 调整旋转，可能需要根据模型方向调整
          rotationZ: -30,
          // 模型平移
          translation: [0, 0, 0],
          // 设置高度偏移，可能需要调整

          // 是否启用模型自动旋转以跟随方向
          rotationByView: true,
          // 设置动画帧率
          animationFPS: 60,
          // 预加载模型
          preload: true,
          // 启用调试信息
          debug: true,
        },
        properties: {
          name: "飞行器",
        },
      });
      this.aircraftMarker.setCoordinates(coordinate);
      // console.log("创建GLTFMarker成功");

      // 添加错误处理
      this.aircraftMarker.on("load", function () {
        // console.log("GLTF模型加载成功");
      });

      this.aircraftMarker.on("error", function (err) {
        console.error("GLTF模型加载失败:", err);
      });

      // 添加标记到图层
      this.aircraftMarker.addTo(this.aircraftLayer);
      // console.log("GLTFMarker已添加到图层");
    } catch (error) {
      console.error("创建飞行器标记时出错:", error);
    }
  }
  /**
   * 开始漫游
   */
  start() {
    if (this.isRoaming) {
      console.warn("漫游已在进行中");
      return;
    }
    let a = turf.featureCollection(turf.bezierSpline(coastline.features[0]));
    // console.log("🚀 ~ CoastlineRoaming ~ start ~ a:", a);
    // 从提供的海岸线数据提取路径点
    this.pathPoints = this.extractPathFromGeoJSON(a);

    if (this.pathPoints.length < 2) {
      console.error("路径点数量不足，无法开始漫游");
      return;
    }

    // 保存原始状态
    this.originalCenter = this.map.getCenter();
    this.originalZoom = this.map.getZoom();
    this.originalBearing = this.map.getBearing ? this.map.getBearing() : 0;
    this.originalPitch = this.map.getPitch ? this.map.getPitch() : 0;

    // 启用自由视角
    this.enableFreeView();

    // 创建漫游路径线
    this.createRoamingLine(this.pathPoints);

    // 创建飞行器标记
    const firstPoint = this.pathPoints[0];
    const firstCoordinate = new maptalks.Coordinate(
      firstPoint[0],
      firstPoint[1]
    );
    this.createAircraftMarker(firstCoordinate);

    // 设置初始视角
    this.map.setCenterAndZoom(firstCoordinate, this.options.zoom);

    // 设置初始倾斜角度
    if (this.map.setPitch && typeof this.map.setPitch === "function") {
      this.map.setPitch(this.options.pitch);
    }

    // 初始化跟随变量
    this.currentCoordinate = null;
    this.preCoordinate = null;

    // 开始漫游
    this.isRoaming = true;

    // 使用 animateShow 实现平滑的动画跟随效果
    // 参考: https://maptalks.org/examples/cn/animation/map-view-follow/
    this.roamingLine.animateShow(
      {
        duration: this.options.duration,
        easing: "linear",
      },
      (frame, c) => {
        if (!this.isRoaming) {
          return;
        }

        // 更新当前坐标
        this.currentCoordinate = c.copy();

        // 更新飞行器位置
        if (this.aircraftMarker) {
          this.currentCoordinate.z = 3000;
          this.aircraftMarker.setCoordinates(this.currentCoordinate);
        }

        // 地图跟随（仅在非交互状态下更新）
        if (this.preCoordinate) {
          if (!this.map.isInteracting()) {
            // 计算方位角
            const bearing = this.getBearing(
              this.preCoordinate,
              this.currentCoordinate
            );

            // 更新地图中心点
            // 移除高度信息，防止视角随飞行高度变化而拉远
            const center = this.currentCoordinate.copy();
            center.z = 0;
            this.map.setCenter(center);

            // 更新地图方位角
            if (
              this.map.setBearing &&
              typeof this.map.setBearing === "function"
            ) {
              this.map.setBearing(bearing);
            }

            // 保持缩放级别
            if (this.map.getZoom() !== this.options.zoom) {
              this.map.setZoom(this.options.zoom);
            }
          }
        }

        // 更新上一个坐标
        this.preCoordinate = this.currentCoordinate.copy();

        // 触发进度回调
        if (this.options.onProgress) {
          const total = this.pathPoints.length;
          // 估算当前进度（基于动画帧）
          const progress = frame && frame.progress ? frame.progress * 100 : 0;
          this.options.onProgress(progress, frame, total);
        }
      },
      () => {
        // 动画完成回调
        this.isRoaming = false;
        if (this.options.onComplete) {
          this.options.onComplete();
        }
      }
    );
  }

  /**
   * 停止漫游
   */
  stop() {
    this.isRoaming = false;

    // 停止动画
    if (this.roamingLine && this.roamingLine.animateShow) {
      // maptalks 的 animateShow 没有直接的 stop 方法
      // 可以通过设置标志位来停止
    }

    // 恢复原始视角设置
    this.restoreFreeView();
  }

  /**
   * 重置漫游
   */
  reset() {
    this.stop();

    // 移除飞行器标记和路径
    if (this.aircraftLayer) {
      this.aircraftLayer.remove();
      this.aircraftLayer = null;
      this.aircraftMarker = null;
    }

    if (this.roamingLayer) {
      this.roamingLayer.remove();
      this.roamingLayer = null;
      this.roamingLine = null;
    }

    // 恢复原始状态
    if (this.originalCenter && this.originalZoom !== null) {
      this.map.setCenterAndZoom(this.originalCenter, this.originalZoom);
    }

    // 重置变量
    this.currentCoordinate = null;
    this.preCoordinate = null;
    this.pathPoints = [];
  }

  /**
   * 销毁漫游对象
   */
  destroy() {
    this.reset();
    this.map = null;
    this.options = null;
  }

  /**
   * 获取漫游状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      isRoaming: this.isRoaming,
      totalPoints: this.pathPoints.length,
    };
  }
}

export default CoastlineRoaming;
