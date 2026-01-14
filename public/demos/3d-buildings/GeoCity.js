const GeoCity = (function () {
  const OPTIONS = {
    elevation: 0,
    bdColor: "#18bca9",
    opacity: 0.8,
    merge: false,
    levelHight: 1,
    altitudeKey: "Floor",
  };

  class GeoCity {
    constructor(options, layer, onClick) {
      this.options = maptalks.Util.extend({}, OPTIONS, options, {});
      this.layer = layer;
      this.onClick = onClick;
      this.features = [];
      this.meshs = [];
      this.material = this.getBuildingsMaterial(options.color, options.opacity);
    }

    setData(buildings) {
      this.remove();
      let that = this;
      if (!(buildings && Array.isArray(buildings))) {
        throw new Error("buildings is invalid");
      }
      this.features = [];
      buildings.forEach(function (b) {
        that.features = that.features.concat(b.features);
      });
      this.generateMeshs(this.features);
      this.layer.addMesh(this.meshs);
    }

    hide() {
      this.meshs.forEach(function (mesh) {
        mesh.hide();
      });
    }

    show() {
      this.meshs.forEach(function (mesh) {
        mesh.animateShow({
          duration: 3000,
        });
      });
    }

    remove() {
      this.layer.removeMesh(this.meshs);
    }

    generateMeshs(features) {
      let that = this;
      let heightPerLevel = this.options.levelHight;
      let altitudeKey = this.options.altitudeKey;
      let color = this.options.bdColor;
      const topColor = new THREE.Color(color);
      if (this.options.merge) {
        this.material.vertexColors = THREE.VertexColors;
        let polygons = features.map((f) => {
          const polygon = maptalks.GeoJSON.toGeometry(f);
          let levels = f.properties[altitudeKey] || 1;
          polygon.setProperties({
            height: heightPerLevel * levels,
          });
          return polygon;
        });

        const mesh = this.layer.toExtrudePolygons(
          polygons,
          { interactive: false },
          this.material
        );

        const bufferGeometry = mesh.getObject3d().geometry;
        const geometry = new THREE.Geometry().fromBufferGeometry(
          bufferGeometry
        );

        const { vertices, faces, faceVertexUvs } = geometry;
        for (let i = 0, len = faces.length; i < len; i++) {
          const { a, b, c } = faces[i];
          const p1 = vertices[a],
            p2 = vertices[b],
            p3 = vertices[c];
          if (p1.z > 0 && p2.z > 0 && p3.z > 0) {
            const vertexColors = faces[i].vertexColors;
            for (let j = 0, len1 = vertexColors.length; j < len1; j++) {
              vertexColors[j].r = topColor.r;
              vertexColors[j].g = topColor.g;
              vertexColors[j].b = topColor.b;
            }
            const uvs = faceVertexUvs[0][i];
            for (let j = 0, len1 = uvs.length; j < len1; j++) {
              uvs[j].x = 0;
              uvs[j].y = 0;
            }
          }
        }
        mesh.getObject3d().geometry = new THREE.BufferGeometry().fromGeometry(
          geometry
        );
        bufferGeometry.dispose();
        geometry.dispose();
        this.meshs.push(mesh);
      } else {
        features.forEach(function (g) {
          let levels = g.properties[altitudeKey] || 1;
          var mesh = that.layer.toExtrudePolygon(
            maptalks.GeoJSON.toGeometry(g),
            {
              height: levels * heightPerLevel * 3, // 增加比例系数根据实际定义房屋高度
              topColor: color,
            },
            that.material
          );
          mesh.on("click", function (e) {
            if (that.onClick && typeof that.onClick == "function")
              that.onClick(e, g.properties);
          });
          that.meshs.push(mesh);
        });
      }
    }

    getBuildingsMaterial(color = "#18bca9", opacity = 0.8) {
      const texture = new THREE.TextureLoader().load(
        "/demos/3d-buildings/building.png"
      );
      texture.needsUpdate = true;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 4);
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        color: color,
      });
      material.opacity = opacity;
      return material;
    }

    _animation() {}
  }

  return GeoCity;
})();
