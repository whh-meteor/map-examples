var stats;
var map, threeLayer;
var scene, camera, renderer;
var water;
// 鼠标点击定位
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
// 鼠标移动定位
var raycaster2 = new THREE.Raycaster();
var mouse2 = new THREE.Vector2();
var objectArr = []; // 存放场景中所有mesh
// 提示框
var infoModal, labelRenderer;

var engineerShip, thingsShip, helicopter;

// ===============  开启帧数检测 ======================
function initStats() {
  stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  stats.dom.style.position = "absolute";
  stats.dom.style.right = "0px";
  stats.dom.style.left = "unset";
  stats.dom.style.top = "0px";
  document.body.appendChild(stats.dom);

  function animate() {
    stats.begin();
    stats.end();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// ===========  初始化地图  ========================
function initMap() {
  map = new maptalks.Map("map", {
    center: [120, 35.6],
    zoom: 10,
    baseLayer: new maptalks.TileLayer("base", {
      urlTemplate:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      subdomains: ["a", "b", "c"],
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }),
  });
}

// ===========  初始化ThreeLayer  ========================
function initThreeLayer() {
  threeLayer = new maptalks.ThreeLayer("three", {
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
    forceRenderOnZooming: true,
  });

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

    // 初始化模型
    initObjModel();

    // 初始化2D渲染器
    init2DRenderer();

    // 初始化动画
    initAnimate();
  };

  threeLayer.addTo(map);
}

// =========== 2D渲染器构建 =====================
function init2DRenderer() {
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = 0;
  labelRenderer.domElement.style.pointerEvents = "none";
  document.body.appendChild(labelRenderer.domElement);
}

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
  var light = new THREE.DirectionalLight(0xffffff, 0.8);
  scene.add(light);

  // 加载水的法线纹理
  var textureLoader = new THREE.TextureLoader();
  textureLoader.load("objs/waternormals.jpg", function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    // 加载geojson文件来定义水面形状
    fetch("objs/water_shape.geojson")
      .then((response) => response.json())
      .then((geojson) => {
        // 解析geojson，创建水面几何体
        var waterGeometry = createWaterGeometryFromGeoJSON(geojson);

        if (waterGeometry) {
          water = new THREE.Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: texture,
            alpha: 1.0,
            sunDirection: light.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: 0x00456e,
            distortionScale: 5.7,
            fog: scene.fog !== undefined,
          });

          // 确保水面在最底层
          water.renderOrder = -100;

          scene.add(water);
        }
      })
      .catch((error) => {
        console.error("Error loading geojson:", error);
        // 如果加载失败，使用默认的平面几何体
        var waterGeometry = new THREE.PlaneBufferGeometry(10000, 10000);
        water = new THREE.Water(waterGeometry, {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals: texture,
          alpha: 1.0,
          sunDirection: light.position.clone().normalize(),
          sunColor: 0xffffff,
          waterColor: 0x00456e,
          distortionScale: 5.7,
          fog: scene.fog !== undefined,
        });

        // 定位水面到地图中心，z=0表示在地图平面上
        var waterPosition = threeLayer.coordinateToVector3([120, 35.6], 0);
        water.position.copy(waterPosition);

        // 确保水面在最底层
        water.renderOrder = -100;

        scene.add(water);
      });
  });
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
  var onError = function (xhr) {};
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath("../objs/");
  // 工程船
  mtlLoader.load("工程船.mtl", function (materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath("objs/");
    objLoader.load(
      "工程船.obj",
      function (object) {
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
        var position = threeLayer.coordinateToVector3([120, 35.6], 0);
        object.position.copy(position);
        object.position.x -= 50;
        object.position.y -= 50; // 由于场景旋转，现在y轴是水平方向
        object.scale.set(0.005, 0.005, 0.005);
        // 确保模型与场景旋转同步，与地图平面对齐
        object.rotation.x = Math.PI / 2;
        object.name = "engineerShip";
        engineerShip = object;
        scene.add(object);
      },
      onProgress,
      onError
    );
  });
  // 运输船
  mtlLoader.load("运输船.mtl", function (materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath("objs/");
    objLoader.load(
      "运输船.obj",
      function (object) {
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
        var position = threeLayer.coordinateToVector3([120, 35.6], 0);
        object.position.copy(position);
        object.position.x += 50;
        object.position.y += 50; // 由于场景旋转，现在y轴是水平方向
        object.scale.set(0.2, 0.2, 0.2);
        // 确保模型与场景旋转同步，与地图平面对齐
        object.rotation.x = Math.PI / 2;
        object.name = "thingsShip";
        thingsShip = object;
        scene.add(object);
      },
      onProgress,
      onError
    );
  });
  // 直升机
  mtlLoader.load("直升机.mtl", function (materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath("objs/");
    objLoader.load(
      "直升机.obj",
      function (object) {
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
        var position = threeLayer.coordinateToVector3([120, 35.6], 30);
        object.position.copy(position);
        object.scale.set(100, 100, 100);
        // 确保模型与场景旋转同步，与地图平面对齐
        object.rotation.x = Math.PI / 2;
        object.name = "helicopter";
        helicopter = object;
        scene.add(object);
      },
      onProgress,
      onError
    );
  });
  // 飞机信息牌
  var planeInfo = document.createElement("div");
  planeInfo.className = "the-modal";
  planeInfo.innerHTML = "<div>治电护航直升机</div>" + "<div>ZZES 007 </div>";
  planeInfo.classList.add("hide");
  infoModal = new THREE.CSS2DObject(planeInfo);
  scene.add(infoModal);
}

// ===================== 创建文字贴图 ======================
/**
 * text 文字
 * options.fontColor 文字颜色
 * options.bgColor 背景颜色
 */
function createFont(text, options = { bgColor: "", fontColor: "" }) {
  var canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  var c = canvas.getContext("2d");
  // 矩形区域填充背景
  c.fillStyle = options.bgColor || "#ff0000";
  c.fillRect(0, 0, 512, 128);
  c.beginPath();
  // 文字
  c.beginPath();
  c.translate(256, 64);
  c.fillStyle = options.fontColor || "#ffffff"; //文本填充颜色
  c.font = "bold 36px 微软雅黑"; //字体样式设置
  c.textBaseline = "middle"; //文本与fillText定义的纵坐标
  c.textAlign = "center"; //文本居中(以fillText定义的横坐标)
  c.fillText(text, 0, 0);
  var texture = new THREE.CanvasTexture(canvas);
  var textMaterial = new THREE.MeshPhongMaterial({
    map: texture, // 设置纹理贴图
    // side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  textMaterial.map.needsUpdate = true;
  return textMaterial;
}

// ===================== 方向键控制摄像头 =======================
function initArrowKeydown() {
  document.addEventListener("keydown", handleKeyDown, false);

  function handleKeyDown(e) {
    var e = e || window.event;
    var keyCode = event.keyCode
      ? event.keyCode
      : event.which
      ? event.which
      : event.charCode;
    if ("37, 38, 39, 40, 65, 87, 68, 83".indexOf(keyCode) === -1) {
      return;
    } else {
      switch (e.keyCode) {
        case 37:
        case 65:
          CameraMove("x", -0.1);
          break;
        case 38:
        case 87:
          CameraMove("y", 0.1);
          break;
        case 39:
        case 68:
          CameraMove("x", 0.1);
          break;
        case 83:
        case 40:
          CameraMove("y", -0.1);
          break;
      }
    }
  }

  function CameraMove(direction, distance) {
    // 注意：在ThreeLayer中，相机由map控制，这里我们移动地图中心
    var center = map.getCenter();
    if (direction === "x") {
      center.x += distance * 0.01;
    } else if (direction === "y") {
      center.y += distance * 0.01;
    }
    map.setCenter(center);
  }
}

// ===================== 动画 ======================
function initAnimate() {
  if (water) {
    water.material.uniforms["time"].value += 1.0 / 60.0;
  }

  if (engineerShip) {
    // 由于场景旋转，现在y轴是地图平面的前后方向
    engineerShip.position.y += 0.1;
    if (
      engineerShip.position.y >=
      threeLayer.coordinateToVector3([120, 35.6], 0).y + 50
    ) {
      engineerShip.position.x += 0.01;
      engineerShip.rotation.y += 0.001;
    }
  }

  if (thingsShip) {
    // 由于场景旋转，现在y轴是地图平面的前后方向
    thingsShip.position.y += 0.1;
    if (
      thingsShip.position.y >=
      threeLayer.coordinateToVector3([120, 35.6], 0).y + 60
    ) {
      thingsShip.position.x += 0.01;
      thingsShip.rotation.y += 0.001;
    }
  }

  if (labelRenderer && scene && camera) {
    labelRenderer.render(scene, camera);
  }

  // 强制 ThreeLayer 重新渲染，确保动画能够持续显示
  if (threeLayer) {
    threeLayer.redraw();
  }

  requestAnimationFrame(initAnimate);
}

// ===================== 鼠标点击触发 ======================
function handleMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(objectArr);
  // console.log('当前点击的Mash', intersects)
  if (intersects && intersects.length > 0) {
  }
}

// ================== 鼠标移动触发 =========================
function handleMouseMove(event) {
  mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster2.setFromCamera(mouse2, camera);
  var intersects = raycaster2.intersectObjects(objectArr);
  if (intersects && intersects.length > 0) {
    if (intersects[0].object.name.indexOf("helicopter") !== -1) {
      var obj = intersects[0].object;
      infoModal.position.copy(obj.parent.position);
      infoModal.position.z -= 100;
      infoModal.position.y += 10;
      infoModal.element.classList.remove("hide");
    } else {
      infoModal.element.classList.add("hide");
    }
  } else {
    infoModal.element.classList.add("hide");
  }
}

// ===================== 等比缩放 ==========================
function handleWindowResize() {
  if (labelRenderer) {
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  }
}

function initAll() {
  initStats();
  initMap();
  initThreeLayer();
  initArrowKeydown();
  document.addEventListener("click", handleMouseDown, false);
  document.addEventListener("mousemove", handleMouseMove, false);
  handleWindowResize();
  window.addEventListener("resize", handleWindowResize, false);
}

window.onload = function () {
  initAll();
};
