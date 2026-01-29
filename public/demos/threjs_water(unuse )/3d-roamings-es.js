import * as maptalks from "maptalks";
import { GroupGLLayer } from "maptalks-gl";
import { getTileActor } from "maptalks.tileclip";
import * as THREE from "three";
import * as maptalksThree from "maptalks.three";
import { Water } from "./js/water.js";
import { MTLLoader } from "./js/MTLLoader.js";
import { OBJLoader } from "./js/OBJLoader.js";

export function createTerrainLayer(layer) {
  let min = -0,
    max = 1161;
  const terrain = {
    type: "mapbox",
    maxAvailableZoom: 14,
    requireSkuToken: false,
    // urlTemplate: " https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/tile/{z}/{y}/{x} ",
    // urlTemplate:"http://127.0.0.1:5501/{z}/{x}/{y}.png",
    urlTemplate:
      "https://inner.qdlimap.cn:7001/GisServer/NanHuangHai/qingdaoterrain/{z}/{x}/{y}.png",
    subdomains: ["a", "b", "c", "d"],
    // colors: colors,
    exaggeration: 3,
    depthMask: true
    // shader: 'lit',
  };

  const group = new GroupGLLayer("group", [layer], {
    terrain
  });

  group.on("terrainlayercreated", (e) => {
    console.log("🚀 ~ createTerrainLayer ~ e:", e)
    const terrainLayer = group.getTerrainLayer();
    const tileActor = getTileActor();

    terrainLayer.getRenderer().loadTileBitmap = (url, tile, callback) => {
      const absoluteUrl = maptalks.Util.getAbsoluteURL(url);
      console.log("Loading terrain tile:", absoluteUrl);
      tileActor
        .encodeTerrainTile({
          url: absoluteUrl,
          terrainType: "qgis-gray",
          minHeight: min,
          maxHeight: max
          // indexedDBCache: true,
          // fetchOptions: {
          //     headers: {
          //         'Accept': 'image/png, image/jpeg, image/webp'
          //     }
          // }
        })
        .then((imagebitmap) => {
          console.log("Terrain tile encoded successfully");
          callback(null, imagebitmap);
        })
        .catch((error) => {
          console.error("地形编码失败:", error);
          console.error("Error details:", error.message, error.stack);
          callback(error);
        });
    };
  });

  return group;
}

export function createThreeLayer() {
  let threeLayer = new maptalksThree.ThreeLayer("three", {
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
    forceRenderOnZooming: true,
    // 移除renderer配置，使用默认设置
    // renderer: {
    //   preserveDrawingBuffer: true,
    //   antialias: true,
    //   alpha: true
    // }
  });

  let scene, camera, water;
     var engineerShip, thingsShip, helicopter;
let objectArr 
  threeLayer.prepareToDraw = function (gl, sceneObj, cameraObj) {
    scene = sceneObj;
    camera = cameraObj;

    // 构建一个坐标轴，帮助我们查看坐标系
    var axes = new THREE.AxisHelper(120);
    scene.add(axes);

    // 旋转整个场景，使其与地图平面对齐
    // ThreeLayer默认坐标系是垂直的，需要旋转90度使其水平
    scene.rotation.x = -Math.PI / 2;
    // 初始化灯光
    initLights();
    // 初始化水面（先初始化水面，确保它在最底层）
    initWater();
    initObjModel();
    // 初始化动画
    initAnimate();
  };

  // ================== 灯光 =============================
  function initLights() {
    // 增强环境光，确保所有面都能被照亮
    var ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    // 添加平行光，模拟太阳光
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 100, 0); // 从上方照射，确保顶部能被照亮
    scene.add(directionalLight);

    //添加材质灯光阴影
    var spotLight1 = new THREE.SpotLight(0xffffff);
    spotLight1.position.set(-50, 100, 0);
    scene.add(spotLight1);

    var spotLight2 = new THREE.SpotLight(0xffffff);
    spotLight2.position.set(550, 500, 0);
    scene.add(spotLight2);

    var spotLight3 = new THREE.SpotLight(0xffffff);
    spotLight3.position.set(150, 50, -200);
    scene.add(spotLight3);

    var spotLight4 = new THREE.SpotLight(0xffffff);
    spotLight4.position.set(150, 50, 200);
    scene.add(spotLight4);

    var spotLight5 = new THREE.SpotLight(0xffffff);
    spotLight5.position.set(-500, 10, 0);
    scene.add(spotLight5);
  }

  // =================== 水面 ================================
  function initWater() {
    console.log("Initializing water...");
    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(0, 100, 0);
    scene.add(light);
    console.log("Light added to scene");

    // 加载水的法线纹理
    var textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    textureLoader.load("/assets/objs/waternormals.jpg", function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      console.log("Water normals texture loaded");

      // 加载geojson文件来定义水面形状
      fetch("/assets/objs/water_shape.geojson")
        .then((response) => response.json())
        .then((geojson) => {
          console.log("GeoJSON loaded successfully");
          // 解析geojson，创建水面几何体
          var waterGeometry = createWaterGeometryFromGeoJSON(geojson);

          if (waterGeometry) {
            water = new THREE.Water(waterGeometry, {
              textureWidth: 1024, // 提高纹理分辨率
              textureHeight: 1024,
              waterNormals: texture,
              alpha: 0.8, // 调整透明度，使水面更自然
              sunDirection: light.position.clone().normalize(),
              sunColor: 0xffffff,
              waterColor: 0x00456e, // 更自然的海水颜色
              distortionScale: 3.7, // 降低扭曲度，提高性能
              fog: scene.fog !== undefined,
            });

            // 确保水面在最底层
            water.renderOrder = -100;

            scene.add(water);
            console.log("Water with GeoJSON geometry added to scene");
          } else {
            console.warn("Failed to create water geometry from GeoJSON, using default plane");
            createDefaultWater(texture, light);
          }
        })
        .catch((error) => {
          console.error("Error loading geojson:", error);
          // 如果加载失败，使用默认的平面几何体
          createDefaultWater(texture, light);
        });
    });
  }

  // 创建默认水面
  function createDefaultWater(texture, light) {
    console.log("Creating default water geometry");
    var waterGeometry = new THREE.PlaneGeometry(10000, 10000, 32, 32); // 减少分段数，提高性能
    
    // 创建水面对象
    water = new THREE.Water(waterGeometry, {
      textureWidth: 1024, // 提高纹理分辨率
      textureHeight: 1024,
      waterNormals: texture,
      alpha: 0.9, // 调整透明度，使水面更自然
      sunDirection: light.position.clone().normalize(),
      sunColor: 0xffffff,
      waterColor: 0x00456e, // 更自然的海水颜色
      distortionScale: 3.7, // 降低扭曲度，提高性能
      fog: scene.fog !== undefined,
    });
    console.log("Default water object created:", water);

    // 定位水面到地图中心，z=0表示在地图平面上
    var waterPosition = threeLayer.coordinateToVector3([ 119.99367,35.71827], 10);
    water.position.copy(waterPosition);
    console.log("Water position set to:", waterPosition);

    // 确保水面在最底层
    water.renderOrder = -100;

    scene.add(water);
    console.log("Default water added to scene");
  }

  // 从GeoJSON创建水面几何体
  function createWaterGeometryFromGeoJSON(geojson) {
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      return null;
    }

    // 存储所有形状
    var shapes = [];

    // 处理每个feature
    geojson.features.forEach(function (feature) {
      if (!feature.geometry) {
        return;
      }

      // 处理Polygon类型
      if (feature.geometry.type === "Polygon") {
        processPolygon(feature.geometry.coordinates, shapes);
      }
      // 处理MultiPolygon类型
      else if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates.forEach(function (polygonCoordinates) {
          processPolygon(polygonCoordinates, shapes);
        });
      }
    });

    // 如果没有有效形状，返回null
    if (shapes.length === 0) {
      return null;
    }

    // 创建几何体
    var geometry;
    if (shapes.length === 1) {
      // 单个形状
      geometry = new THREE.ShapeGeometry(shapes[0]);
    } else {
      // 多个形状
      geometry = new THREE.BufferGeometry();
      var allVertices = [];
      var allIndices = [];
      var indexOffset = 0;

      shapes.forEach(function (shape) {
        var shapeGeometry = new THREE.ShapeGeometry(shape);
        var shapeVertices = shapeGeometry.attributes.position.array;
        var shapeIndices = [];

        // 创建索引
        for (var i = 0; i < shapeVertices.length / 3; i++) {
          shapeIndices.push(i + indexOffset);
        }

        // 添加到总数据中
        allVertices.push(...shapeVertices);
        allIndices.push(...shapeIndices);
        indexOffset += shapeVertices.length / 3;
      });

      // 设置几何体属性
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(allVertices, 3)
      );
      geometry.setIndex(allIndices);
      geometry.computeBoundingSphere();
    }

    return geometry;
  }

  // 处理多边形坐标
  function processPolygon(coordinates, shapes) {
    if (!coordinates || coordinates.length === 0) {
      return;
    }

    // 外环
    var outerRing = coordinates[0];
    if (!outerRing || outerRing.length < 3) {
      return;
    }

    // 创建形状
    var shape = new THREE.Shape();

    // 转换第一个点
    var firstPoint = threeLayer.coordinateToVector3(outerRing[0], 0);
    shape.moveTo(firstPoint.x, firstPoint.y);

    // 添加其他点
    for (var i = 1; i < outerRing.length; i++) {
      var point = threeLayer.coordinateToVector3(outerRing[i], 0);
      shape.lineTo(point.x, point.y);
    }

    // 闭合形状
    shape.closePath();

    // 处理内环（岛屿）
    for (var j = 1; j < coordinates.length; j++) {
      var innerRing = coordinates[j];
      if (!innerRing || innerRing.length < 3) {
        continue;
      }

      // 创建孔洞
      var hole = new THREE.Path();

      // 转换第一个点
      var firstHolePoint = threeLayer.coordinateToVector3(innerRing[0], 0);
      hole.moveTo(firstHolePoint.x, firstHolePoint.y);

      // 添加其他点
      for (var k = 1; k < innerRing.length; k++) {
        var holePoint = threeLayer.coordinateToVector3(innerRing[k], 0);
        hole.lineTo(holePoint.x, holePoint.y);
      }

      // 闭合孔洞
      hole.closePath();

      // 添加孔洞到形状
      shape.holes.push(hole);
    }

    // 添加形状到数组
    shapes.push(shape);
  }
        // =================== model 加载 ================================
        // 递归出所有mesh
        function getMesh(s, arr, name = "") {
            s.forEach((v) => {
                if (v.children && v.children.length > 0) {
                    getMesh(v.children, arr, v.name);
                } else {
                    if (v instanceof THREE.Mesh) {
                        if (name) {
                            v.name = name;
                        }
                        arr.push(v);
                    }
                }
            });
        }

        function initObjModel() {
            var onProgress = function (xhr) {
                if (xhr.lengthComputable) {
                    var percentComplete = (xhr.loaded / xhr.total) * 100;
                    // 每次加载完毕将mesh放进数组
                    if (percentComplete === 100) {
                        objectArr = [];
                        scene.traverse(function (s) {
                            if (s && s.type === "Scene") {
                                getMesh(s.children, objectArr);
                            }
                        });
                    }
                }
            };
            var onError = function (xhr) { 
                console.error("模型加载错误:", xhr);
            };
            var mtlLoader = new MTLLoader();
         //   mtlLoader.setPath("");
            // 工程船
            mtlLoader.load("/assets/objs/工程船.mtl", function (materials) {
                console.log("工程船材质加载成功");
                materials.preload();
                var objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
              //  objLoader.setPath("objs/");
                objLoader.load(
                    "/assets/objs/工程船.obj",
                    function (object) {
                        console.log("工程船模型加载成功");
                        // 遍历所有mesh，设置材质的side属性为DoubleSide
                        object.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {
                                if (child.material) {
                                    // 如果是单个材质
                                    if (
                                        typeof child.material === "object" &&
                                        child.material.isMaterial
                                    ) {
                                        child.material.side = THREE.DoubleSide;
                                    }
                                    // 如果是材质数组
                                    else if (Array.isArray(child.material)) {
                                        child.material.forEach(function (material) {
                                            material.side = THREE.DoubleSide;
                                        });
                                    }
                                }
                            }
                        });

                        // 使用map的坐标系统
                        var position = threeLayer.coordinateToVector3([ 119.99367,35.71827], 0);
                        object.position.copy(position);
                        object.position.x -= 50;
                        object.position.y -= 50; // 由于场景旋转，现在y轴是水平方向
                        object.scale.set(0.001, 0.001, 0.001); // 调整工程船缩放比例
                        // 确保模型与场景旋转同步，与地图平面对齐
                        object.rotation.x = Math.PI / 2;
                        object.name = "engineerShip";
                        engineerShip = object;
                        scene.add(object);
                        console.log("工程船已添加到场景");
                    },
                    onProgress,
                    onError
                );
            });
            // 运输船
            mtlLoader.load("/assets/objs/运输船.mtl", function (materials) {
                console.log("运输船材质加载成功");
                materials.preload();
                var objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
               // objLoader.setPath("objs/");
                objLoader.load(
                    "/assets/objs/运输船.obj",
                    function (object) {
                        console.log("运输船模型加载成功");
                        // 遍历所有mesh，设置材质的side属性为DoubleSide
                        object.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {
                                if (child.material) {
                                    // 如果是单个材质
                                    if (
                                        typeof child.material === "object" &&
                                        child.material.isMaterial
                                    ) {
                                        child.material.side = THREE.DoubleSide;
                                    }
                                    // 如果是材质数组
                                    else if (Array.isArray(child.material)) {
                                        child.material.forEach(function (material) {
                                            material.side = THREE.DoubleSide;
                                        });
                                    }
                                }
                            }
                        });

                        // 使用map的坐标系统
                        var position = threeLayer.coordinateToVector3([ 119.99367,35.71827], 0);
                        object.position.copy(position);
                        object.position.x += 50;
                        object.position.y += 50; // 由于场景旋转，现在y轴是水平方向
                        object.scale.set(0.02, 0.02, 0.02); // 调整运输船缩放比例，与工程船保持一致
                        // 确保模型与场景旋转同步，与地图平面对齐
                        object.rotation.x = Math.PI / 2;
                        object.name = "thingsShip";
                        thingsShip = object;
                        scene.add(object);
                        console.log("运输船已添加到场景");
                    },
                    onProgress,
                    onError
                );
            });
            // 直升机
            mtlLoader.load("/assets/objs/直升机.mtl", function (materials) {
                console.log("直升机材质加载成功");
                materials.preload();
                var objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
              //  objLoader.setPath("objs/");
                objLoader.load(
                    "/assets/objs/直升机.obj",
                    function (object) {
                        console.log("直升机模型加载成功");
                        // 遍历所有mesh，设置材质的side属性为DoubleSide
                        object.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {
                                if (child.material) {
                                    // 如果是单个材质
                                    if (
                                        typeof child.material === "object" &&
                                        child.material.isMaterial
                                    ) {
                                        child.material.side = THREE.DoubleSide;
                                    }
                                    // 如果是材质数组
                                    else if (Array.isArray(child.material)) {
                                        child.material.forEach(function (material) {
                                            material.side = THREE.DoubleSide;
                                        });
                                    }
                                }
                            }
                        });

                        // 使用map的坐标系统
                        var position = threeLayer.coordinateToVector3([ 119.99367,35.59827], 0);
                        object.position.copy(position);
                        object.scale.set(100, 100, 100); // 调整直升机缩放比例，与其他模型保持一致
                        // 确保模型与场景旋转同步，与地图平面对齐
                        object.rotation.x = Math.PI / 2;
                        object.name = "helicopter";
                        helicopter = object;
                        scene.add(object);
                        console.log("直升机已添加到场景");
                    },
                    onProgress,
                    onError
                );
            });
           
        }

  // ===================== 动画 ======================
  var frameCount = 0;
  // 船只浮动相关参数
  var floatOffset = 0;
  var floatSpeed = 0.01; // 浮动速度
  var floatAmplitude = 0.2; // 浮动幅度
  var draftDepth = 0.1; // 吃水深度
  
  function initAnimate() {
    frameCount++;
    floatOffset += floatSpeed;
    
    // 降低水面动画更新频率，每两帧更新一次，提高性能
    if (frameCount % 2 === 0 && water && water.material && water.material.uniforms["time"]) {
      water.material.uniforms["time"].value += 1.0 / 30.0; // 调整时间增量以匹配降低的更新频率
    }
    
    // 计算当前浮动值（使用正弦函数）
    var currentFloat = Math.sin(floatOffset) * floatAmplitude;
    
    if (engineerShip) {
      // 设置工程师船的基础位置（考虑吃水深度）
      var baseY = threeLayer.coordinateToVector3([120, 35.6], 0).z  - draftDepth;
      // 应用浮动效果
      engineerShip.position.z = baseY + currentFloat;
      // 保持XZ平面上的移动
      // engineerShip.position.z += 0.01;
    }

    if (thingsShip) {
      // 设置物资船的基础位置（考虑吃水深度）
      var baseY = threeLayer.coordinateToVector3([120, 35.6], 0).z  - draftDepth;
      // 应用浮动效果
      thingsShip.position.z = baseY + currentFloat;
      // 保持XZ平面上的移动
      // thingsShip.position.z += 0.01;
    }
    // 降低ThreeLayer重绘频率，每三帧重绘一次，提高性能
    if (frameCount % 3 === 0 && threeLayer) {
      threeLayer.redraw();
    }

    requestAnimationFrame(initAnimate);
  }

  return threeLayer;
}