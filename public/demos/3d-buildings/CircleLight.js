/**
 * CircleLight 类 - 创建圆形扫描灯光效果
 * 用于在3D场景中生成一个从中心点向外扫描的圆形灯光效果
 */
const CircleLight = (function () {
  class CircleLight {
    /**
     * 构造函数
     * @param {Object} app - 应用实例，包含threeLayer和gltfLoader
     */
    constructor(app) {
      let that = this;
      // 保存threeLayer引用
      this.layer = app.threeLayer;
      // 保存gltfLoader引用
      this.gltfLoader = app.gltfLoader;
      // 可见性状态
      this.visible = false;
      // 动画帧ID
      this.animate = undefined;
      // 动画计数器
      this.idxc = -1;
      // 当前目标点索引
      this.idx = -1;

      /**
       * 动画循环函数
       * 用于更新扫描灯光的位置和状态
       */
      let ainimation = function () {
        try {
          // 移除 alert，避免阻塞动画
          // 确保动画循环始终执行，不受 visible 状态影响
          if (that.layer && that.targetPos && that.cube && that.spotLight) {
            that.idxc += 0.5;
            const index = Math.round(that.idxc);

            if (index >= that.targetPos.length) {
              that.idxc = -1;
              that.idx = -1;
            } else if (index >= 0 && index > that.idx) {
              that.idx = index;
              // 把 cube 移动到新目标后，确保 world 矩阵更新，然后再更新 helper
              that.cube.position.copy(that.targetPos[that.idx]);

              // 强制更新 worldMatrix（true 表示递归更新子孙）
              that.cube.updateMatrixWorld(true);

              // 确保 spotLight.target 的 world 矩阵也被更新（target 是 cube）
              if (that.spotLight.target) {
                that.spotLight.target.updateMatrixWorld(true);
              }
              // 最后更新 helper（在 render 之前）
              if (that.spotLightHelper) {
                that.spotLightHelper.update();
              }
            }

            // 每一帧都更新辅助对象，确保它跟随灯光旋转

            that.spotLightHelper.update();

            // 执行呼吸脉冲动画
            if (that.breathPulse) {
              that.breathPulse._animation();
            }
            // 执行圆形脉冲动画
            if (that.circlePulse) {
              that.circlePulse._animation();
            }

            // 只有在可见时才渲染场景
            if (that.visible) {
              that.layer.renderScene();
            }
          }
        } catch (error) {
          console.error("Animation error:", error);
        }
        // 请求下一帧动画，确保动画循环持续执行
        requestAnimationFrame(ainimation);
      };

      // 立即启动动画循环
      this.animate = requestAnimationFrame(ainimation);
    }

    /**
     * 设置灯光数据
     * @param {Object} options - 配置选项
     * @param {string} options.lightColor - 灯光颜色，默认为"#18bca9"
     * @param {number} options.lightLength - 灯光长度，默认为1000
     * @param {Array} options.center - 中心点坐标，默认为[120.1497, 35.912]
     * @param {number} options.lightHeight - 灯光高度，默认为100
     * @param {number} options.targetHight - 目标点高度，默认为10
     */
    setData({
      lightColor = "#18bca9",
      lightLength = 1000,
      center = [120.1297, 35.912],
      lightHeight = 100,
      targetHight = 0.1,
    }) {
      // 先移除已有的效果
      this.remove();
      let that = this;
      // 保存中心点
      this.center = center;
      // 创建圆形区域
      const circle = new maptalks.Circle(this.center, lightLength * 0.9, {
        numberOfShellPoints: 360, // 圆形的边数
      });
      // 获取圆形的顶点
      const shell = circle.getShell();
      // 计算目标点位置（确保目标点在地面或指定高度）
      let targetPos = (this.targetPos = shell.map((coordinate) => {
        return that.layer.coordinateToVector3(coordinate, targetHight);
      }));

      // 创建聚光灯
      let spotLight = (this.spotLight = new THREE.SpotLight(
        new THREE.Color(lightColor)
      ));
      // 设置灯光强度（根据高度调整，高度越低强度需要越大）
      spotLight.intensity = lightHeight < 10 ? 500 : 100;
      // 设置灯光角度（根据高度调整，高度越低角度需要越大）
      spotLight.angle = lightHeight < 10 ? 0.2 : 0.2;
      // 设置灯光衰减（减少衰减，使光线能更远）
      spotLight.decay = 0.2;
      // 设置灯光半影
      spotLight.penumbra = 0.8;
      // 设置灯光指数（减少指数，使光线更分散）
      spotLight.exponent = 0.1;
      // 计算灯光距离
      let r = this.layer.distanceToVector3(
        lightLength * 0.9,
        lightLength * 0.9
      ).x;
      // 设置灯光距离（确保足够远）
      spotLight.distance = r * 1;
      // 设置灯光位置（基于中心点和高度）
      const lightPosition = that.layer.coordinateToVector3(center, lightHeight);
      spotLight.position.copy(lightPosition);
      console.log("🚀 ~ setData ~ Light position set to:", lightPosition);
      // 初始隐藏灯光
      spotLight.visible = false;

      // 创建目标立方体（用于聚光灯追踪）
      const cubeGeometry = new THREE.CubeGeometry(0.1, 0.1, 0.1);
      const cubeMaterial = new THREE.MeshLambertMaterial({
        color: "red",
      });
      let cube = (this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial));
      // 初始隐藏立方体
      cube.visible = false;
      // 设置立方体初始位置
      cube.position.copy(that.targetPos[0]);
      // 设置聚光灯目标为立方体
      spotLight.target = cube;
      // 确保目标立方体被添加到场景中
      that.layer.getScene().add(cube);

      let spotLightHelper = (this.spotLightHelper = new THREE.SpotLightHelper(
        spotLight
      ));
      // 初始隐藏圆锥体
      spotLightHelper.children[0].material = this.LineMaterial();
      spotLightHelper.visible = false;
      console.log("🚀 ~创建spotLightHelper:", spotLightHelper);

      // 创建呼吸脉冲效果
      this.breathPulse = new BreathPulse(
        center,
        { height: 0, radius: lightLength },
        this.layer
      );
      // 初始隐藏呼吸脉冲
      this.breathPulse.hide();
      // 创建圆形脉冲效果
      this.circlePulse = new CirclePulse(
        center,
        { height: 0, radius: lightLength },
        this.layer
      );
      // 初始隐藏圆形脉冲
      this.circlePulse.hide();

      console.log("🚀 ~ setData ~ Adding meshes to scene");
      console.log("🚀 ~ setData ~ spotLight:", spotLight);
      console.log("🚀 ~ setData ~ spotLightHelper:", spotLightHelper);
      console.log("🚀 ~ setData ~ cube:", cube);

      // 直接添加到Three.js场景中，而不是通过layer.addMesh
      this.layer.getScene().add(this.circlePulse.mesh);
      this.layer.getScene().add(this.breathPulse.mesh);
      this.layer.getScene().add(spotLightHelper);
      this.layer.getScene().add(spotLight);
      this.layer.getScene().add(cube);

      console.log("🚀 ~ setData ~ Meshes added to scene");
      console.log(
        "🚀 ~ setData ~ Scene children count:",
        this.layer.getScene().children.length
      );

      // 加载塔模型
      this.gltfLoader.load("/demos/3d-buildings/tower.glb", function (gltf) {
        let obj = gltf.scene;
        var group = new THREE.Group();
        // 遍历模型，为每个网格创建线框
        obj.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            group.add(that.WireFrameMesh(child.geometry));
          }
        });
        // 设置模型缩放
        group.scale.set(0.003, 0.003, 0.003);
        // 设置模型旋转
        group.rotation.set((-Math.PI * 1) / 2, (-Math.PI * 1) / 2, 0);
        // 将模型转换为maptalks模型
        let tower = (that.tower = that.layer.toModel(group, {
          coordinate: center,
          altitude: 0,
        }));
        // 初始隐藏塔模型
        tower.visible = false;
        // 添加塔模型到图层
        that.layer.addMesh(tower);
        // 显示效果
        that.show();
      });
    }

    /**
     * 隐藏效果
     */
    hide() {
      // 设置可见性为false
      this.visible = false;
      // 隐藏塔模型
      this.tower ? this.tower.hide() : 0;
      // 隐藏呼吸脉冲
      this.breathPulse ? this.breathPulse.hide() : 0;
      // 隐藏圆形脉冲
      this.circlePulse ? this.circlePulse.hide() : 0;
      // 隐藏圆锥体
      this.spotLightHelper ? (this.spotLightHelper.visible = false) : 0;
      // 隐藏聚光灯
      this.spotLight ? (this.spotLight.visible = false) : 0;
      // 隐藏立方体
      this.cube ? (this.cube.visible = false) : 0;
    }

    /**
     * 显示效果
     */
    show() {
      console.log("🚀 ~ CircleLight.show() called");
      console.log("🚀 ~ show ~ this.spotLight:", this.spotLight);
      console.log("🚀 ~ show ~ this.spotLightHelper:", this.spotLightHelper);
      console.log("🚀 ~ show ~ this.cube:", this.cube);
      console.log("🚀 ~ show ~ this.breathPulse:", this.breathPulse);
      console.log("🚀 ~ show ~ this.circlePulse:", this.circlePulse);

      // 设置可见性为true
      this.visible = true;

      // 显示塔模型
      if (this.tower) {
        this.tower.show();
        console.log("🚀 ~ show ~ tower shown");
      }

      // 显示呼吸脉冲
      if (this.breathPulse) {
        this.breathPulse.show();
        console.log("🚀 ~ show ~ breathPulse shown");
      }

      // 显示圆形脉冲
      if (this.circlePulse) {
        this.circlePulse.show();
        console.log("🚀 ~ show ~ circlePulse shown");
      }

      // 显示聚光灯辅助对象
      if (this.spotLightHelper) {
        this.spotLightHelper.visible = true;
        console.log("🚀 ~ show ~ spotLightHelper.visible set to true");
      }

      // 显示聚光灯
      if (this.spotLight) {
        this.spotLight.visible = true;
        console.log("🚀 ~ show ~ spotLight.visible set to true");
      }

      // 显示立方体
      if (this.cube) {
        this.cube.visible = true;
        console.log("🚀 ~ show ~ cube.visible set to true");
      }

      // 强制渲染一次场景
      if (this.layer) {
        this.layer.renderScene();
        console.log("🚀 ~ show ~ scene rendered");
      }
    }

    /**
     * 移除效果
     */
    remove() {
      const scene = this.layer.getScene();
      // 移除呼吸脉冲
      if (this.breathPulse && this.breathPulse.mesh) {
        scene.remove(this.breathPulse.mesh);
      }
      // 移除圆形脉冲
      if (this.circlePulse && this.circlePulse.mesh) {
        scene.remove(this.circlePulse.mesh);
      }
      // 移除圆锥体
      if (this.spotLightHelper) scene.remove(this.spotLightHelper);
      // 移除聚光灯
      if (this.spotLight) scene.remove(this.spotLight);
      // 移除立方体
      if (this.cube) scene.remove(this.cube);

      // 移除塔模型
      const meshesToRemove = [];
      if (this.tower) meshesToRemove.push(this.tower);
      if (meshesToRemove.length > 0) {
        this.layer.removeMesh(meshesToRemove);
      }
      // 取消动画循环
      cancelAnimationFrame(this.animate);
    }

    /**
     * 创建线框材质
     * @returns {THREE.LineBasicMaterial} 线框材质
     */
    LineMaterial() {
      let lineMaterial = new THREE.LineBasicMaterial({
        color: "#57d8ff", // 线框颜色
        transparent: true, // 开启透明
        linewidth: 1, // 线宽
        opacity: 0.8, // 透明度
      });
      // 设置多边形偏移
      lineMaterial.polygonOffset = true;
      // 开启深度测试
      lineMaterial.depthTest = true;
      // 设置多边形偏移因子
      lineMaterial.polygonOffsetFactor = 1;
      // 设置多边形偏移单位
      lineMaterial.polygonOffsetUnits = 1.0;
      return lineMaterial;
    }

    /**
     * 创建线框网格
     * @param {THREE.Geometry} geometry - 几何体
     * @returns {THREE.LineSegments} 线框网格
     */
    WireFrameMesh(geometry) {
      // 创建边缘几何体
      let edges = new THREE.EdgesGeometry(geometry, 1);
      // 创建线框网格
      return new THREE.LineSegments(edges, this.LineMaterial());
    }
  }

  return CircleLight;
})();
