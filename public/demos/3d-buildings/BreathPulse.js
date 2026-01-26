const BreathPulse = (function () {
  // 默认配置选项
  const OPTIONS = {
    elevation: 0, // 海拔高度
    color: "#0099FF", // 呼吸脉冲颜色
    opacity: 0.5, // 不透明度
    radius: 1000, // 脉冲圆环半径
    wallHeight: 10, // 墙体高度（未使用）
  };

  // 顶点着色器代码
  const vertexs = {
    normal_vertex:
      "\n  precision lowp float;\n  precision lowp int;\n  varying vec2 vUv;\n  void main() {\n    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  }\n",
  };

  // 片段着色器代码
  const fragments = {
    circleBreathPulse_fragment:
      "\n  precision lowp float;\n  precision lowp int;\n  varying vec2 vUv;\n  uniform float time;\n  uniform vec3 color;\n  uniform float opacity;\n\n  void main() {\n    vec2 uv = vUv - 0.5;\n    float dir = length(uv);\n\n    float speed = 3.0,\n          time2 = time * speed,\n          radius = 0.4 + 0.04 * sin(time2),\n          thickness = 0.07 + 0.05 * cos(time2);\n    gl_FragColor = vec4(smoothstep(thickness/2., 0., abs(dir-radius))) * vec4(color, opacity);\n  }\n",
  };

  /**
   * BreathPulse类 - 创建呼吸脉冲效果
   * 使用自定义着色器实现圆形呼吸效果，圆环半径和厚度随时间变化
   */
  class BreathPulse {
    /**
     * 构造函数
     * @param {Array} lonlat - 经纬度坐标 [经度, 纬度]
     * @param {Object} options - 配置选项
     * @param {Object} layer - maptalks的three图层实例
     */
    constructor(lonlat, options, layer) {
      // 合并用户选项与默认选项
      options = maptalks.Util.extend({}, OPTIONS, options, { layer, lonlat });
      // 验证经纬度参数
      if (!(lonlat && Array.isArray(lonlat))) {
        throw new Error("lonlat is invalid");
      }

      // 保存图层引用
      this.layer = layer;
      // 创建自定义着色器材质
      let material = new THREE.ShaderMaterial({
        // 合并uniform变量（着色器中的全局变量）
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog, // 雾效uniform
          {
            time: {
              // 时间变量，用于动画
              type: "f",
              value: 0,
            },
            color: {
              // 颜色变量
              type: "c",
              value: new THREE.Color(options.color || "#0099FF"),
            },
            opacity: {
              // 不透明度变量
              type: "f",
              value: options.opacity || 0.5,
            },
          },
        ]),
        // 顶点着色器
        vertexShader: vertexs.normal_vertex,
        // 片段着色器
        fragmentShader: fragments.circleBreathPulse_fragment,
        // 混合模式：加法混合
        blending: THREE.AdditiveBlending,
        // 开启透明度
        transparent: !0,
        // 禁用深度写入
        depthWrite: !1,
        // 开启深度测试
        depthTest: !0,
        // 双面渲染
        side: THREE.DoubleSide,
      });
      // 获取海拔高度
      const z = options.elevation || 0;
      // 将地理坐标转换为3D世界坐标中的半径
      let r = layer.distanceToVector3(options.radius, options.radius).x;
      // 创建网格对象
      this.mesh = new THREE.Mesh(this.createGeometry(r * 2), material);
      // 将经纬度转换为3D世界坐标
      const polyPice = layer.coordinateToVector3(lonlat, z);
      // 设置网格位置
      this.mesh.position.copy(polyPice);
      // 初始隐藏
      this.mesh.visible = false;
    }

    /**
     * 创建几何体
     * @param {number} radius - 圆形平面的半径
     * @returns {THREE.PlaneBufferGeometry} 平面几何体
     */
    createGeometry(radius = 5) {
      return new THREE.PlaneBufferGeometry(radius, radius);
    }

    /**
     * 动画更新函数
     * 每帧调用，更新时间变量以驱动呼吸动画
     */
    _animation() {
      this.mesh.material.uniforms.time.value += 0.005;
    }

    /**
     * 显示呼吸脉冲效果
     */
    show() {
      this.mesh.visible = true;
    }

    /**
     * 隐藏呼吸脉冲效果
     */
    hide() {
      this.mesh.visible = false;
    }
  }

  // 返回BreathPulse类
  return BreathPulse;
})();
