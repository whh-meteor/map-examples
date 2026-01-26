const GeoCity = (function () {
  // 默认配置选项
  const OPTIONS = {
    elevation: 0, // 建筑物基础海拔高度
    bdColor: "#18bca9", // 建筑物边框颜色
    opacity: 0.8, // 建筑物不透明度
    merge: false, // 是否合并建筑物网格
    levelHight: 1, // 每层楼的高度比例
    altitudeKey: "Floor", // 楼层高度的属性键名
  };

  /**
   * GeoCity类 - 用于创建3D城市建筑物模型
   * 通过GeoJSON数据生成3D建筑物，支持自定义高度、颜色和材质
   */
  class GeoCity {
    /**
     * 构造函数
     * @param {Object} options - 配置选项，会与默认选项合并
     * @param {Object} layer - maptalks的three图层实例
     * @param {Function} onClick - 建筑物点击事件回调函数
     */
    constructor(options, layer, onClick) {
      // 合并用户选项与默认选项
      this.options = maptalks.Util.extend({}, OPTIONS, options, {});
      // 保存图层引用
      this.layer = layer;
      // 保存点击事件回调
      this.onClick = onClick;
      // 存储建筑物要素数据
      this.features = [];
      // 存储建筑物网格对象
      this.meshs = [];
      // 创建建筑物材质
      this.material = this.getBuildingsMaterial(options.color, options.opacity);
    }

    /**
     * 设置建筑物数据
     * @param {Array} buildings - 建筑物数据数组，每个元素包含features属性
     */
    setData(buildings) {
      // 先移除已有的建筑物
      this.remove();
      let that = this;
      // 验证输入数据
      if (!(buildings && Array.isArray(buildings))) {
        throw new Error("buildings is invalid");
      }
      // 重置要素数组
      this.features = [];
      // 合并所有建筑物的要素
      buildings.forEach(function (b) {
        that.features = that.features.concat(b.features);
      });
      // 生成建筑物网格
      this.generateMeshs(this.features);
      // 将网格添加到图层
      this.layer.addMesh(this.meshs);
    }

    /**
     * 隐藏所有建筑物
     */
    hide() {
      this.meshs.forEach(function (mesh) {
        mesh.hide();
      });
    }

    /**
     * 显示所有建筑物，带动画效果
     */
    show() {
      this.meshs.forEach(function (mesh) {
        mesh.animateShow({
          duration: 3000, // 动画持续时间为3秒
        });
      });
    }

    /**
     * 移除所有建筑物网格
     */
    remove() {
      this.layer.removeMesh(this.meshs);
    }

    /**
     * 根据要素生成建筑物网格
     * @param {Array} features - 建筑物要素数组
     */
    generateMeshs(features) {
      let that = this;
      // 获取每层高度
      let heightPerLevel = this.options.levelHight;
      // 获取高度属性键名
      let altitudeKey = this.options.altitudeKey;
      // 获取建筑物颜色
      let color = this.options.bdColor;
      // 创建颜色对象
      const topColor = new THREE.Color(color);

      // 如果选择合并建筑物
      if (this.options.merge) {
        // 启用顶点颜色
        this.material.vertexColors = THREE.VertexColors;
        // 将要素转换为多边形
        let polygons = features.map((f) => {
          const polygon = maptalks.GeoJSON.toGeometry(f);
          // 获取楼层数
          let levels = f.properties[altitudeKey] || 1;
          // 设置多边形高度属性
          polygon.setProperties({
            height: heightPerLevel * levels,
          });
          return polygon;
        });

        // 创建拉伸多边形网格
        const mesh = this.layer.toExtrudePolygons(
          polygons,
          { interactive: false }, // 禁用交互
          this.material
        );

        // 获取网格的几何体
        const bufferGeometry = mesh.getObject3d().geometry;
        // 转换为旧版几何体以便修改
        const geometry = new THREE.Geometry().fromBufferGeometry(
          bufferGeometry
        );

        // 获取几何体的顶点、面和UV坐标
        const { vertices, faces, faceVertexUvs } = geometry;
        // 遍历所有面
        for (let i = 0, len = faces.length; i < len; i++) {
          const { a, b, c } = faces[i];
          const p1 = vertices[a],
            p2 = vertices[b],
            p3 = vertices[c];
          // 只处理顶部的面（z坐标大于0）
          if (p1.z > 0 && p2.z > 0 && p3.z > 0) {
            const vertexColors = faces[i].vertexColors;
            // 设置顶部面的颜色
            for (let j = 0, len1 = vertexColors.length; j < len1; j++) {
              vertexColors[j].r = topColor.r;
              vertexColors[j].g = topColor.g;
              vertexColors[j].b = topColor.b;
            }
            // 重置UV坐标
            const uvs = faceVertexUvs[0][i];
            for (let j = 0, len1 = uvs.length; j < len1; j++) {
              uvs[j].x = 0;
              uvs[j].y = 0;
            }
          }
        }
        // 将修改后的几何体转换回BufferGeometry
        mesh.getObject3d().geometry = new THREE.BufferGeometry().fromGeometry(
          geometry
        );
        // 释放几何体内存
        bufferGeometry.dispose();
        geometry.dispose();
        // 添加到网格数组
        this.meshs.push(mesh);
      } else {
        // 不合并建筑物，为每个要素创建单独的网格
        features.forEach(function (g) {
          // 获取楼层数
          let levels = g.properties[altitudeKey] || 1;
          // 创建拉伸多边形网格
          var mesh = that.layer.toExtrudePolygon(
            maptalks.GeoJSON.toGeometry(g),
            {
              height: levels * heightPerLevel * 3, // 计算建筑物高度
              topColor: color, // 设置顶部颜色
            },
            that.material
          );
          // 添加点击事件
          mesh.on("click", function (e) {
            if (that.onClick && typeof that.onClick == "function")
              that.onClick(e, g.properties);
          });
          // 添加到网格数组
          that.meshs.push(mesh);
        });
      }
    }

    /**
     * 创建建筑物材质
     * @param {string} color - 建筑物颜色
     * @param {number} opacity - 不透明度
     * @returns {THREE.MeshPhongMaterial} 创建的材质
     */
    getBuildingsMaterial(color = "#18bca9", opacity = 0.8) {
      // 加载建筑物纹理
      const texture = new THREE.TextureLoader().load(
        "/demos/3d-buildings/building.png"
      );
      // 更新纹理
      texture.needsUpdate = true;
      // 设置纹理重复方式
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      // 设置纹理重复次数
      texture.repeat.set(1, 4);
      // 创建Phong材质
      const material = new THREE.MeshPhongMaterial({
        map: texture, // 使用纹理贴图
        transparent: true, // 开启透明度
        color: color, // 设置颜色
      });
      // 设置不透明度
      material.opacity = opacity;
      return material;
    }

    /**
     * 动画函数（空实现，预留扩展）
     */
    _animation() {}
  }

  // 返回GeoCity类
  return GeoCity;
})();
