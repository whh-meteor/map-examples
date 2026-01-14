const BreathPulse = (function () {
  const OPTIONS = {
    elevation: 0,
    color: "#0099FF",
    opacity: 0.5,
    radius: 1000,
    wallHeight: 10,
  };

  const vertexs = {
    normal_vertex:
      "\n  precision lowp float;\n  precision lowp int;\n  varying vec2 vUv;\n  void main() {\n    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n  }\n",
  };

  const fragments = {
    circleBreathPulse_fragment:
      "\n  precision lowp float;\n  precision lowp int;\n  varying vec2 vUv;\n  uniform float time;\n  uniform vec3 color;\n  uniform float opacity;\n\n  void main() {\n    vec2 uv = vUv - 0.5;\n    float dir = length(uv);\n\n    float speed = 3.0,\n          time2 = time * speed,\n          radius = 0.4 + 0.04 * sin(time2),\n          thickness = 0.07 + 0.05 * cos(time2);\n    gl_FragColor = vec4(smoothstep(thickness/2., 0., abs(dir-radius))) * vec4(color, opacity);\n  }\n",
  };

  class BreathPulse {
    constructor(lonlat, options, layer) {
      options = maptalks.Util.extend({}, OPTIONS, options, { layer, lonlat });
      if (!(lonlat && Array.isArray(lonlat))) {
        throw new Error("lonlat is invalid");
      }

      this.layer = layer;
      let material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            time: {
              type: "f",
              value: 0,
            },
            color: {
              type: "c",
              value: new THREE.Color(options.color || "#0099FF"),
            },
            opacity: {
              type: "f",
              value: options.opacity || 0.5,
            },
          },
        ]),
        vertexShader: vertexs.normal_vertex,
        fragmentShader: fragments.circleBreathPulse_fragment,
        blending: THREE.AdditiveBlending,
        transparent: !0,
        depthWrite: !1,
        depthTest: !0,
        side: THREE.DoubleSide,
      });
      const z = options.elevation || 0;
      let r = layer.distanceToVector3(options.radius, options.radius).x;
      this.mesh = new THREE.Mesh(this.createGeometry(r * 2), material);
      const polyPice = layer.coordinateToVector3(lonlat, z);
      this.mesh.position.copy(polyPice);
      this.mesh.visible = false;
    }

    createGeometry(radius = 5) {
      return new THREE.PlaneBufferGeometry(radius, radius);
    }

    _animation() {
      this.mesh.material.uniforms.time.value += 0.005;
    }

    show() {
      this.mesh.visible = true;
    }

    hide() {
      this.mesh.visible = false;
    }
  }

  return BreathPulse;
})();
