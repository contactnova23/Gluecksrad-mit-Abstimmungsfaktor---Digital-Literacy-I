(() => {
  const canvas = document.getElementById('vr-world-canvas');
  if (!canvas) return;

  async function boot() {
    let THREE;

    try {
      THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    } catch (error) {
      console.warn('3D-Welt konnte nicht geladen werden. Die App bleibt vollständig nutzbar.', error);
      canvas.style.display = 'none';
      document.body.classList.add('webgl-unavailable');
      return;
    }

    // ---------- Geräteleistung ----------
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean(navigator.connection?.saveData);
    const hardwareThreads = navigator.hardwareConcurrency || 8;
    const deviceMemory = navigator.deviceMemory || 8;

    const quality = (
      reducedMotion || saveData || hardwareThreads <= 4 || deviceMemory <= 4
        ? 'low'
        : mobile || hardwareThreads <= 8 || deviceMemory <= 8
          ? 'balanced'
          : 'high'
    );

    const shadowsEnabled = quality === 'high' && !mobile;
    const pixelRatioCap = quality === 'high' ? 1.25 : quality === 'balanced' ? 1.0 : 0.85;
    const targetFps = reducedMotion ? 15 : quality === 'high' ? 50 : quality === 'balanced' ? 32 : 24;
    const frameInterval = 1000 / targetFps;

    // ---------- Renderer, Szene, Kamera ----------
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd9ece8, quality === 'low' ? 0.0158 : 0.0129);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality === 'high',
      alpha: false,
      powerPreference: 'high-performance',
    });

    function applyRendererSize() {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
    }

    applyRendererSize();
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.shadowMap.enabled = shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;

    const camera = new THREE.PerspectiveCamera(
      47,
      window.innerWidth / window.innerHeight,
      0.1,
      140
    );
    scene.add(camera);

    // ---------- Geteilte Geometrien und Materialien ----------
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const unitCylinder8 = new THREE.CylinderGeometry(1, 1, 1, 8);
    const yAxis = new THREE.Vector3(0, 1, 0);

    const materials = {
      plaster: [
        new THREE.MeshStandardMaterial({ color: 0xf4e8d4, roughness: 0.95 }),
        new THREE.MeshStandardMaterial({ color: 0xfff4e2, roughness: 0.94 }),
        new THREE.MeshStandardMaterial({ color: 0xe8d7ba, roughness: 0.96 }),
        new THREE.MeshStandardMaterial({ color: 0xf6ead7, roughness: 0.94 }),
      ],
      sandstone: new THREE.MeshStandardMaterial({ color: 0xd79778, roughness: 0.91 }),
      paleStone: new THREE.MeshStandardMaterial({ color: 0xe5dcc7, roughness: 0.94 }),
      darkStone: new THREE.MeshStandardMaterial({ color: 0x8f8b7d, roughness: 0.96 }),
      timber: new THREE.MeshStandardMaterial({ color: 0x8a6647, roughness: 0.96 }),
      wood: new THREE.MeshStandardMaterial({ color: 0xa97d54, roughness: 0.91 }),
      lightWood: new THREE.MeshStandardMaterial({ color: 0xc9a475, roughness: 0.90 }),
      darkWood: new THREE.MeshStandardMaterial({ color: 0x795238, roughness: 0.96 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x747974, roughness: 0.64, metalness: 0.24 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0xc4a45f, roughness: 0.58, metalness: 0.16 }),
      grass: new THREE.MeshStandardMaterial({ color: 0x98b690, roughness: 1 }),
      mud: new THREE.MeshStandardMaterial({ color: 0xb4a68d, roughness: 1 }),
      water: new THREE.MeshStandardMaterial({
        color: 0x86bcc5,
        roughness: 0.28,
        metalness: 0.03,
        transparent: true,
        opacity: 0.78,
      }),
      window: new THREE.MeshStandardMaterial({
        color: 0xb7d5d9,
        emissive: 0x6e9293,
        emissiveIntensity: 0.10,
        roughness: 0.42,
      }),
      warmWindow: new THREE.MeshStandardMaterial({
        color: 0xf1d597,
        emissive: 0xb7853f,
        emissiveIntensity: 0.18,
        roughness: 0.48,
      }),
      roof: [
        new THREE.MeshStandardMaterial({ color: 0xc47d68, roughness: 0.96 }),
        new THREE.MeshStandardMaterial({ color: 0x829ca3, roughness: 0.96 }),
        new THREE.MeshStandardMaterial({ color: 0xd08b6e, roughness: 0.96 }),
        new THREE.MeshStandardMaterial({ color: 0xa98b73, roughness: 0.96 }),
      ],
      cloth: [
        new THREE.MeshStandardMaterial({ color: 0x6f9eaa, roughness: 0.90, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0xd69a7d, roughness: 0.92, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0x91b79c, roughness: 0.92, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0xd9bf79, roughness: 0.91, side: THREE.DoubleSide }),
        new THREE.MeshStandardMaterial({ color: 0xf4e9cf, roughness: 0.94, side: THREE.DoubleSide }),
      ],
    };

    function makeBox(width, height, depth, material) {
      const mesh = new THREE.Mesh(unitBox, material);
      mesh.scale.set(width, height, depth);
      mesh.castShadow = shadowsEnabled;
      mesh.receiveShadow = shadowsEnabled;
      return mesh;
    }

    function makeCylinder(radiusTop, radiusBottom, height, segments, material) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
        material
      );
      mesh.castShadow = shadowsEnabled;
      mesh.receiveShadow = shadowsEnabled;
      return mesh;
    }

    function beamBetween(start, end, thickness, material, depth = thickness) {
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const mesh = makeBox(thickness, length, depth, material);
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(yAxis, direction.normalize());
      return mesh;
    }

    function gableRoofGeometry() {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -0.5, 0.0, -0.5,
         0.5, 0.0, -0.5,
         0.0, 0.62, -0.5,
        -0.5, 0.0,  0.5,
         0.5, 0.0,  0.5,
         0.0, 0.62,  0.5,
      ], 3));
      geometry.setIndex([
        0, 1, 2,
        4, 3, 5,
        0, 2, 5, 0, 5, 3,
        2, 1, 4, 2, 4, 5,
        0, 3, 4, 0, 4, 1,
      ]);
      geometry.computeVertexNormals();
      return geometry;
    }

    const sharedGableRoof = gableRoofGeometry();

    // ---------- Himmel ----------
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(96, quality === 'low' ? 18 : 26, quality === 'low' ? 10 : 14),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          topColor: { value: new THREE.Color(0x8cc9df) },
          middleColor: { value: new THREE.Color(0xe2f1ee) },
          horizonColor: { value: new THREE.Color(0xf7e6c3) },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 middleColor;
          uniform vec3 horizonColor;
          varying vec3 vWorldPosition;
          void main() {
            float heightValue = normalize(vWorldPosition + vec3(0.0, 14.0, 0.0)).y * 0.5 + 0.5;
            vec3 color = mix(horizonColor, middleColor, smoothstep(0.05, 0.58, heightValue));
            color = mix(color, topColor, smoothstep(0.58, 1.0, heightValue));
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      })
    );
    scene.add(sky);

    // ---------- Licht ----------
    scene.add(new THREE.HemisphereLight(0xf4fbf7, 0x8fa384, 2.05));

    const sun = new THREE.DirectionalLight(0xffedc0, 3.15);
    sun.position.set(13, 22, 8);
    sun.castShadow = shadowsEnabled;

    if (shadowsEnabled) {
      sun.shadow.mapSize.set(768, 768);
      sun.shadow.camera.left = -22;
      sun.shadow.camera.right = 22;
      sun.shadow.camera.top = 22;
      sun.shadow.camera.bottom = -22;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 70;
      sun.shadow.bias = -0.00035;
    }

    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xd9eef1, 0.82);
    fill.position.set(-12, 8, 5);
    scene.add(fill);

    // ---------- Prozedurales Pflaster ----------
    function createCobbleTexture() {
      const size = quality === 'low' ? 256 : 384;
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = size;
      textureCanvas.height = size;
      const context = textureCanvas.getContext('2d');
      const scale = size / 256;

      const gradient = context.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, '#d4c7b0');
      gradient.addColorStop(1, '#b7aa96');
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);

      const stoneWidth = 38 * scale;
      const stoneHeight = 24 * scale;

      for (let row = 0; row < 13; row += 1) {
        const offset = row % 2 ? stoneWidth / 2 : 0;
        for (let column = -1; column < 9; column += 1) {
          const x = column * stoneWidth + offset;
          const y = row * stoneHeight - 5 * scale;
          const tone = (row * 7 + column * 3) % 4;
          const colors = ['#d4c7b1', '#c4b7a2', '#ddd0b9', '#b9ad9b'];

          context.beginPath();
          context.roundRect(
            x + 2 * scale,
            y + 2 * scale,
            stoneWidth - 4 * scale,
            stoneHeight - 4 * scale,
            5 * scale
          );
          context.fillStyle = colors[tone];
          context.fill();
          context.strokeStyle = 'rgba(76,68,57,0.19)';
          context.lineWidth = 1.15 * scale;
          context.stroke();

          context.fillStyle = 'rgba(255,250,226,0.18)';
          context.fillRect(x + 7 * scale, y + 5 * scale, stoneWidth * 0.42, 1.2 * scale);
        }
      }

      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.5, 13.5);
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    const cobbleMaterial = new THREE.MeshStandardMaterial({
      map: createCobbleTexture(),
      roughness: 0.98,
    });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(72, 92), materials.grass);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.08, -14);
    ground.receiveShadow = shadowsEnabled;
    scene.add(ground);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 88), cobbleMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.005, -13);
    road.receiveShadow = shadowsEnabled;
    scene.add(road);

    const marketSquare = new THREE.Mesh(
      new THREE.PlaneGeometry(19.5, 17.2),
      new THREE.MeshStandardMaterial({ map: cobbleMaterial.map, roughness: 0.99 })
    );
    marketSquare.material.map = cobbleMaterial.map.clone();
    marketSquare.material.map.needsUpdate = true;
    marketSquare.material.map.repeat.set(3.2, 3.0);
    marketSquare.rotation.x = -Math.PI / 2;
    marketSquare.position.set(0, 0.012, -23.2);
    marketSquare.receiveShadow = shadowsEnabled;
    scene.add(marketSquare);

    for (const x of [-5.25, 5.25]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 84), materials.mud);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, -0.01, -12.5);
      edge.receiveShadow = shadowsEnabled;
      scene.add(edge);
    }

    // ---------- Stadthäuser ----------
    function addFacadeDetails(group, side, height, depthX, widthZ, index) {
      const streetX = side * -(depthX / 2 + 0.018);
      const facadeRotation = side > 0 ? -Math.PI / 2 : Math.PI / 2;

      const verticalOffsets = [-widthZ * 0.32, 0, widthZ * 0.32];
      verticalOffsets.forEach((zOffset) => {
        const beam = makeBox(0.09, height - 0.34, 0.10, materials.timber);
        beam.position.set(streetX + side * -0.025, height / 2, zOffset);
        group.add(beam);
      });

      for (const y of [1.12, 2.20, Math.min(height - 0.52, 3.35)]) {
        if (y > height - 0.35) continue;
        const beam = makeBox(0.09, 0.11, widthZ - 0.34, materials.timber);
        beam.position.set(streetX + side * -0.03, y, 0);
        group.add(beam);
      }

      const windowRows = height > 4.8 ? [1.65, 2.75, 3.72] : [1.58, 2.68];
      windowRows.forEach((y, row) => {
        [-0.92, 0.92].forEach((zOffset, column) => {
          const windowMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.42, 0.56),
            (index + row + column) % 5 === 0 ? materials.warmWindow : materials.window
          );
          windowMesh.position.set(streetX + side * -0.072, y, zOffset);
          windowMesh.rotation.y = facadeRotation;
          group.add(windowMesh);

          for (const shutterOffset of [-0.28, 0.28]) {
            const shutter = makeBox(0.055, 0.53, 0.16, materials.wood);
            shutter.position.set(streetX + side * -0.047, y, zOffset + shutterOffset);
            group.add(shutter);
          }
        });
      });

      const door = makeBox(0.10, 1.05, 0.56, materials.darkWood);
      door.position.set(streetX + side * -0.045, 0.53, 0);
      group.add(door);
    }

    const buildingZ = [10.5, 5.0, -0.5, -6.0, -11.5, -17.0];
    buildingZ.forEach((z, rowIndex) => {
      [-1, 1].forEach((side) => {
        const group = new THREE.Group();
        const height = 4.0 + ((rowIndex + (side > 0 ? 1 : 0)) % 3) * 0.62;
        const depthX = 3.15 + (rowIndex % 2) * 0.38;
        const widthZ = 4.35;

        const body = makeBox(depthX, height, widthZ, materials.plaster[(rowIndex + (side > 0 ? 1 : 0)) % materials.plaster.length]);
        body.position.y = height / 2;
        group.add(body);

        const stoneFoot = makeBox(depthX + 0.08, 0.34, widthZ + 0.04, materials.paleStone);
        stoneFoot.position.y = 0.17;
        group.add(stoneFoot);

        const roof = new THREE.Mesh(sharedGableRoof, materials.roof[(rowIndex + (side > 0 ? 2 : 0)) % materials.roof.length]);
        roof.scale.set(depthX * 1.12, 1.35, widthZ * 1.10);
        roof.position.y = height;
        roof.castShadow = shadowsEnabled;
        group.add(roof);

        if (rowIndex % 2 === 0) {
          const overhang = makeBox(0.55, 0.13, 2.45, materials.wood);
          overhang.position.set(side * -(depthX / 2 + 0.26), 1.18, 0);
          overhang.rotation.z = side * 0.10;
          group.add(overhang);
        }

        const chimney = makeBox(0.34, 0.92, 0.34, materials.paleStone);
        chimney.position.set(side * 0.45, height + 0.72, rowIndex % 2 ? 0.72 : -0.72);
        group.add(chimney);

        addFacadeDetails(group, side, height, depthX, widthZ, rowIndex * 2 + (side > 0 ? 1 : 0));
        group.position.set(side * 7.15, 0, z);
        scene.add(group);
      });
    });

    // ---------- Basler Stadttor-Silhouette statt Märchenschloss ----------
    function archShape(width, height) {
      const radius = width / 2;
      const shape = new THREE.Shape();
      shape.moveTo(-radius, 0);
      shape.lineTo(-radius, height - radius);
      shape.absarc(0, height - radius, radius, Math.PI, 0, false);
      shape.lineTo(radius, 0);
      shape.closePath();
      return shape;
    }

    const cityGate = new THREE.Group();

    const wallLeft = makeBox(12.0, 3.8, 2.1, materials.sandstone);
    wallLeft.position.set(-8.3, 1.9, 0);
    cityGate.add(wallLeft);

    const wallRight = wallLeft.clone();
    wallRight.position.x = 8.3;
    cityGate.add(wallRight);

    const gatehouse = makeBox(5.3, 5.6, 2.6, materials.sandstone);
    gatehouse.position.y = 2.8;
    cityGate.add(gatehouse);

    const arch = new THREE.Mesh(
      new THREE.ShapeGeometry(archShape(1.85, 2.85)),
      new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 1, side: THREE.DoubleSide })
    );
    arch.position.set(0, 0.01, 1.315);
    cityGate.add(arch);

    for (const x of [-3.5, 3.5]) {
      const tower = makeCylinder(1.10, 1.22, 6.15, quality === 'low' ? 10 : 14, materials.sandstone);
      tower.position.set(x, 3.08, 0);
      cityGate.add(tower);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.42, 2.05, quality === 'low' ? 10 : 14),
        materials.roof[1]
      );
      roof.position.set(x, 7.14, 0);
      roof.castShadow = shadowsEnabled;
      cityGate.add(roof);
    }

    const gateRoof = new THREE.Mesh(sharedGableRoof, materials.roof[0]);
    gateRoof.scale.set(5.75, 1.7, 2.95);
    gateRoof.position.y = 5.58;
    gateRoof.castShadow = shadowsEnabled;
    cityGate.add(gateRoof);

    for (let index = 0; index < 8; index += 1) {
      const merlon = makeBox(0.42, 0.46, 0.42, materials.paleStone);
      merlon.position.set(-2.15 + index * 0.62, 5.86, 1.02);
      cityGate.add(merlon);
    }

    cityGate.position.set(0, 0, -38.2);
    scene.add(cityGate);

    // Kirchturm als Basler Stadt-Silhouette.
    const church = new THREE.Group();
    const churchBody = makeBox(2.2, 6.2, 2.2, materials.plaster[2]);
    churchBody.position.y = 3.1;
    church.add(churchBody);
    const churchRoof = new THREE.Mesh(new THREE.ConeGeometry(1.65, 4.1, 4), materials.roof[0]);
    churchRoof.rotation.y = Math.PI / 4;
    churchRoof.position.y = 8.05;
    church.add(churchRoof);
    const churchCrossVertical = makeBox(0.09, 0.88, 0.09, materials.iron);
    churchCrossVertical.position.y = 10.4;
    church.add(churchCrossVertical);
    const churchCrossHorizontal = makeBox(0.48, 0.08, 0.08, materials.iron);
    churchCrossHorizontal.position.y = 10.48;
    church.add(churchCrossHorizontal);
    church.position.set(-10.8, 0, -42.5);
    scene.add(church);

    // ---------- Szenengruppen ----------
    const approachScene = new THREE.Group();
    const assemblyScene = new THREE.Group();
    const resultsScene = new THREE.Group();
    scene.add(approachScene, assemblyScene, resultsScene);

    let activeStep = 0;
    let detailsBuilt = false;
    let fortuneRotor = null;
    let fortuneClacker = null;
    let fortuneWheelMode = 'idle';
    let fortuneWheelSpeed = 0;
    const swayItems = [];
    const cloudSprites = [];

    function setStageVisibility(step) {
      activeStep = step;
      approachScene.visible = step <= 2;
      assemblyScene.visible = step >= 2 && step <= 4;
      resultsScene.visible = step >= 5;
    }

    setStageVisibility(0);

    // ---------- Marktobjekte ----------
    function createStall(x, z, clothIndex, rotationY = 0, parent = approachScene) {
      const stall = new THREE.Group();

      for (const px of [-0.72, 0.72]) {
        for (const pz of [-0.46, 0.46]) {
          const post = makeCylinder(0.052, 0.062, 2.18, 8, materials.wood);
          post.position.set(px, 1.09, pz);
          stall.add(post);
        }
      }

      const counter = makeBox(1.58, 0.16, 0.78, materials.lightWood);
      counter.position.y = 0.91;
      stall.add(counter);

      const counterFront = makeBox(1.48, 0.72, 0.10, materials.wood);
      counterFront.position.set(0, 0.48, 0.39);
      stall.add(counterFront);

      const canopy = makeBox(1.82, 0.11, 1.22, materials.cloth[clothIndex % 4]);
      canopy.position.y = 2.18;
      canopy.rotation.z = 0.015;
      stall.add(canopy);

      for (const stripeX of [-0.55, 0, 0.55]) {
        const stripe = makeBox(0.18, 0.025, 1.23, materials.cloth[4]);
        stripe.position.set(stripeX, 2.245, 0);
        stall.add(stripe);
      }

      for (let index = 0; index < 5; index += 1) {
        const good = new THREE.Mesh(
          new THREE.SphereGeometry(0.11 + (index % 2) * 0.025, 7, 5),
          new THREE.MeshStandardMaterial({
            color: [0xd88472, 0x7fae8e, 0xd5b45f, 0xa77b5b, 0xc28f68][index],
            roughness: 1,
          })
        );
        good.position.set(-0.50 + index * 0.25, 1.09, 0.05 + (index % 2) * 0.09);
        stall.add(good);
      }

      stall.position.set(x, 0, z);
      stall.rotation.y = rotationY;
      parent.add(stall);
      return stall;
    }

    function createBarrel(x, z, scale = 1, parent = approachScene) {
      const group = new THREE.Group();
      const body = makeCylinder(0.31, 0.31, 0.72, 12, materials.wood);
      body.scale.set(1, 1, 0.92);
      body.position.y = 0.36;
      group.add(body);

      for (const y of [0.10, 0.36, 0.62]) {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.022, 6, 14), materials.iron);
        hoop.rotation.x = Math.PI / 2;
        hoop.position.y = y;
        group.add(hoop);
      }

      group.scale.setScalar(scale);
      group.position.set(x, 0, z);
      parent.add(group);
      return group;
    }

    function createCrate(x, z, scale = 1, parent = approachScene) {
      const group = new THREE.Group();
      const box = makeBox(0.72, 0.54, 0.64, materials.lightWood);
      box.position.y = 0.27;
      group.add(box);

      for (const y of [0.08, 0.46]) {
        const slat = makeBox(0.76, 0.07, 0.68, materials.darkWood);
        slat.position.y = y;
        group.add(slat);
      }

      group.scale.setScalar(scale);
      group.position.set(x, 0, z);
      parent.add(group);
      return group;
    }

    function createSack(x, z, scale = 1, parent = approachScene) {
      const sack = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 9, 7),
        new THREE.MeshStandardMaterial({ color: 0xd3c29f, roughness: 1 })
      );
      sack.scale.set(0.82 * scale, 1.08 * scale, 0.72 * scale);
      sack.position.set(x, 0.32 * scale, z);
      sack.castShadow = shadowsEnabled;
      parent.add(sack);
      return sack;
    }

    function createBanner(x, z, clothIndex, side, parent) {
      const group = new THREE.Group();
      const pole = makeCylinder(0.042, 0.052, 3.65, 8, materials.wood);
      pole.position.y = 1.825;
      group.add(pole);

      const crossbar = makeCylinder(0.026, 0.026, 1.05, 8, materials.wood);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(side * 0.47, 3.28, 0);
      group.add(crossbar);

      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 1.02, 1, 3), materials.cloth[clothIndex % 4]);
      cloth.position.set(side * 0.44, 2.75, 0.01);
      group.add(cloth);

      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.92), materials.cloth[4]);
      stripe.position.set(side * 0.44, 2.75, 0.02);
      group.add(stripe);

      group.position.set(x, 0, z);
      parent.add(group);
      swayItems.push({ object: group, base: 0, amplitude: 0.018, speed: 0.8 + clothIndex * 0.1 });
      return group;
    }

    function createTargetStand(x, z, rotationY, parent) {
      const group = new THREE.Group();
      const leftLeg = makeBox(0.11, 1.82, 0.11, materials.wood);
      leftLeg.position.set(-0.46, 0.91, 0);
      group.add(leftLeg);
      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.46;
      group.add(rightLeg);

      const bar = makeBox(1.14, 0.12, 0.12, materials.wood);
      bar.position.y = 1.66;
      group.add(bar);

      const disk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.48, 0.09, 20),
        materials.cloth[4]
      );
      disk.rotation.x = Math.PI / 2;
      disk.position.set(0, 1.62, 0.02);
      group.add(disk);

      const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.095, 20), materials.cloth[0]);
      outer.rotation.x = Math.PI / 2;
      outer.position.set(0, 1.62, 0.07);
      group.add(outer);

      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.10, 18), materials.cloth[1]);
      center.rotation.x = Math.PI / 2;
      center.position.set(0, 1.62, 0.12);
      group.add(center);

      group.position.set(x, 0, z);
      group.rotation.y = rotationY;
      parent.add(group);
      return group;
    }

    function createCrowd(parent, entries) {
      if (!entries.length) return;

      const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.24, 0.82, 8);
      const headGeometry = new THREE.SphereGeometry(0.16, 8, 6);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96 });
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0xd5a77e, roughness: 0.98 });
      const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, entries.length);
      const heads = new THREE.InstancedMesh(headGeometry, headMaterial, entries.length);
      const dummy = new THREE.Object3D();
      const colors = [0xc78170, 0x7ca68a, 0xd0ad5e, 0x7299aa, 0xa49abb, 0xc99368, 0x8c988d];

      entries.forEach((entry, index) => {
        dummy.position.set(entry[0], 0.48, entry[1]);
        dummy.rotation.set(0, entry[2] || 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bodies.setMatrixAt(index, dummy.matrix);
        bodies.setColorAt(index, new THREE.Color(colors[index % colors.length]));

        dummy.position.y = 1.03;
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        heads.setMatrixAt(index, dummy.matrix);
      });

      bodies.instanceMatrix.needsUpdate = true;
      heads.instanceMatrix.needsUpdate = true;
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
      parent.add(bodies, heads);
    }

    function createFountain(parent) {
      const fountain = new THREE.Group();
      const base = makeCylinder(1.34, 1.50, 0.28, 24, materials.paleStone);
      base.position.y = 0.14;
      fountain.add(base);
      const basin = makeCylinder(0.98, 1.14, 0.26, 24, materials.paleStone);
      basin.position.y = 0.47;
      fountain.add(basin);
      const water = makeCylinder(0.93, 0.93, 0.025, 24, materials.water);
      water.position.y = 0.62;
      fountain.add(water);
      const pillar = makeCylinder(0.15, 0.23, 1.18, 12, materials.paleStone);
      pillar.position.y = 1.08;
      fountain.add(pillar);
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.48, 8), materials.bronze);
      finial.position.y = 1.88;
      fountain.add(finial);
      fountain.position.set(-0.4, 0, -14.2);
      parent.add(fountain);
    }

    function createLuckHarbor(parent) {
      const booth = new THREE.Group();
      const table = makeBox(2.45, 0.20, 0.95, materials.lightWood);
      table.position.y = 0.95;
      booth.add(table);

      for (const x of [-0.96, 0.96]) {
        const leg = makeBox(0.13, 0.95, 0.13, materials.wood);
        leg.position.set(x, 0.46, 0);
        booth.add(leg);
      }

      const back = makeBox(2.35, 1.42, 0.12, materials.cloth[0]);
      back.position.set(0, 1.72, -0.38);
      booth.add(back);

      const trimTop = makeBox(2.50, 0.10, 0.16, materials.bronze);
      trimTop.position.set(0, 2.47, -0.36);
      booth.add(trimTop);
      const trimBottom = trimTop.clone();
      trimBottom.position.y = 1.00;
      booth.add(trimBottom);

      const urn = makeCylinder(0.30, 0.40, 0.72, 14, materials.darkWood);
      urn.position.set(0, 1.37, 0);
      booth.add(urn);
      const urnRim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.055, 8, 18), materials.bronze);
      urnRim.rotation.x = Math.PI / 2;
      urnRim.position.set(0, 1.75, 0);
      booth.add(urnRim);

      for (let index = 0; index < 4; index += 1) {
        const prize = makeCylinder(0.09 + index * 0.01, 0.12, 0.25 + index * 0.03, 10, index % 2 ? materials.bronze : materials.iron);
        prize.position.set(-0.78 + index * 0.52, 1.19, -0.02);
        booth.add(prize);
      }

      booth.position.set(-5.1, 0, -24.0);
      booth.rotation.y = 0.10;
      parent.add(booth);
      return booth;
    }

    function createHeraldStage(parent) {
      const stage = new THREE.Group();
      const platform = makeBox(2.7, 0.26, 1.75, materials.wood);
      platform.position.y = 0.13;
      stage.add(platform);

      for (const x of [-0.9, 0, 0.9]) {
        const plank = makeBox(0.08, 0.29, 1.78, materials.lightWood);
        plank.position.set(x, 0.15, 0);
        stage.add(plank);
      }

      const lecternBody = makeBox(0.62, 0.92, 0.42, materials.wood);
      lecternBody.position.set(0, 0.73, -0.12);
      stage.add(lecternBody);
      const lecternTop = makeBox(0.76, 0.12, 0.56, materials.lightWood);
      lecternTop.position.set(0, 1.22, -0.07);
      lecternTop.rotation.x = -0.16;
      stage.add(lecternTop);

      const pole = makeCylinder(0.04, 0.05, 2.85, 8, materials.wood);
      pole.position.set(1.0, 1.43, -0.55);
      stage.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.70, 1.05, 1, 3), materials.cloth[1]);
      flag.position.set(0.65, 2.02, -0.54);
      stage.add(flag);

      stage.position.set(-0.8, 0, -24.9);
      parent.add(stage);
      swayItems.push({ object: flag, base: 0, amplitude: 0.028, speed: 0.86, local: true });
      return stage;
    }

    function createFortuneWheel(parent) {
      const frame = new THREE.Group();
      const centerY = 2.72;
      const wheelRadius = 1.42;

      const base = makeBox(3.6, 0.16, 1.52, materials.wood);
      base.position.y = 0.08;
      frame.add(base);

      const footLeft = makeBox(1.05, 0.20, 1.70, materials.lightWood);
      footLeft.position.set(-1.18, 0.18, 0);
      frame.add(footLeft);
      const footRight = footLeft.clone();
      footRight.position.x = 1.18;
      frame.add(footRight);

      const legCoordinates = [
        [new THREE.Vector3(-1.55, 0.18, 0.58), new THREE.Vector3(-0.74, 3.73, 0.18)],
        [new THREE.Vector3( 1.55, 0.18, 0.58), new THREE.Vector3( 0.74, 3.73, 0.18)],
        [new THREE.Vector3(-1.55, 0.18,-0.58), new THREE.Vector3(-0.74, 3.73,-0.18)],
        [new THREE.Vector3( 1.55, 0.18,-0.58), new THREE.Vector3( 0.74, 3.73,-0.18)],
      ];

      legCoordinates.forEach(([start, end]) => {
        frame.add(beamBetween(start, end, 0.18, materials.wood, 0.18));
      });

      const crossbeam = makeBox(2.10, 0.23, 0.30, materials.lightWood);
      crossbeam.position.set(0, 3.62, 0);
      frame.add(crossbeam);

      const axle = makeCylinder(0.12, 0.12, 0.70, 16, materials.iron);
      axle.rotation.x = Math.PI / 2;
      axle.position.set(0, centerY, 0);
      frame.add(axle);

      const rotor = new THREE.Group();
      rotor.position.set(0, centerY, 0.06);

      const backDisk = new THREE.Mesh(
        new THREE.CylinderGeometry(1.20, 1.20, 0.08, 32),
        materials.lightWood
      );
      backDisk.rotation.x = Math.PI / 2;
      backDisk.position.z = -0.03;
      rotor.add(backDisk);

      const wedgeColors = [
        0xe19b84, 0x8fb9a3, 0xe3c16f, 0x7fa8bf,
        0xb3a4cf, 0xe2aa72, 0x86b4b3, 0xd892a4,
        0x94aabd, 0xd3bc75, 0xc98e74, 0x7daaa0,
      ];

      wedgeColors.forEach((color, index) => {
        const wedge = new THREE.Mesh(
          new THREE.CylinderGeometry(
            1.16,
            1.16,
            0.09,
            30,
            1,
            false,
            index * (Math.PI * 2 / wedgeColors.length),
            (Math.PI * 2 / wedgeColors.length) - 0.025
          ),
          new THREE.MeshStandardMaterial({ color, roughness: 0.91 })
        );
        wedge.rotation.x = Math.PI / 2;
        wedge.position.z = 0.02;
        rotor.add(wedge);
      });

      const outerRim = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius, 0.14, 12, 44), materials.wood);
      outerRim.position.z = 0.08;
      rotor.add(outerRim);

      const bronzeBand = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.045, 8, 40), materials.bronze);
      bronzeBand.position.z = 0.13;
      rotor.add(bronzeBand);

      for (let index = 0; index < 12; index += 1) {
        const angle = index * Math.PI / 6;
        const spoke = makeBox(0.07, 1.17, 0.07, materials.lightWood);
        spoke.position.set(Math.sin(angle) * 0.58, Math.cos(angle) * 0.58, 0.13);
        spoke.rotation.z = -angle;
        rotor.add(spoke);
      }

      const pegGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.20, 8);
      const pegs = new THREE.InstancedMesh(pegGeometry, materials.iron, 24);
      const pegDummy = new THREE.Object3D();
      for (let index = 0; index < 24; index += 1) {
        const angle = index * Math.PI * 2 / 24;
        pegDummy.position.set(Math.sin(angle) * 1.42, Math.cos(angle) * 1.42, 0.17);
        pegDummy.rotation.set(Math.PI / 2, 0, 0);
        pegDummy.updateMatrix();
        pegs.setMatrixAt(index, pegDummy.matrix);
      }
      pegs.instanceMatrix.needsUpdate = true;
      rotor.add(pegs);

      const hub = makeCylinder(0.19, 0.19, 0.42, 18, materials.bronze);
      hub.rotation.x = Math.PI / 2;
      hub.position.z = 0.18;
      rotor.add(hub);

      frame.add(rotor);
      fortuneRotor = rotor;

      const clackerPivot = new THREE.Group();
      clackerPivot.position.set(0, centerY + wheelRadius + 0.24, 0.27);
      const clackerMount = makeBox(0.44, 0.15, 0.20, materials.wood);
      clackerMount.position.y = 0.06;
      clackerPivot.add(clackerMount);
      const clacker = makeBox(0.10, 0.52, 0.10, materials.iron);
      clacker.position.set(0, -0.25, 0.02);
      clackerPivot.add(clacker);
      frame.add(clackerPivot);
      fortuneClacker = clackerPivot;

      frame.position.set(4.25, 0, -23.1);
      frame.rotation.y = -0.10;
      parent.add(frame);
      return frame;
    }

    function createPennantLine(parent) {
      const group = new THREE.Group();
      const cord = makeBox(11.5, 0.025, 0.025, materials.darkWood);
      cord.position.y = 4.45;
      group.add(cord);

      const triangle = new THREE.Shape();
      triangle.moveTo(-0.20, 0.0);
      triangle.lineTo(0.20, 0.0);
      triangle.lineTo(0, -0.55);
      triangle.closePath();
      const geometry = new THREE.ShapeGeometry(triangle);

      for (let index = 0; index < 13; index += 1) {
        const flag = new THREE.Mesh(geometry, materials.cloth[index % 4]);
        flag.position.set(-5.4 + index * 0.9, 4.42, 0);
        flag.rotation.y = index % 2 ? 0.08 : -0.08;
        group.add(flag);
      }

      group.position.set(0, 0, -17.3);
      parent.add(group);
      swayItems.push({ object: group, base: 0, amplitude: 0.012, speed: 0.62 });
    }

    function buildDetails() {
      if (detailsBuilt) return;
      detailsBuilt = true;

      // Ankunft am Markt.
      createStall(-5.7, 7.7, 0, 0.10, approachScene);
      createStall(5.7, 4.0, 2, -0.10, approachScene);
      createStall(-5.8, -1.0, 1, 0.08, approachScene);
      createBarrel(-4.8, 5.4, 0.86, approachScene);
      createBarrel(4.9, 1.6, 0.78, approachScene);
      createCrate(-4.9, -3.0, 0.92, approachScene);
      createSack(4.7, 6.4, 0.95, approachScene);
      createSack(5.15, 6.6, 0.72, approachScene);
      createBanner(-5.8, 2.2, 0, 1, approachScene);
      createBanner(5.8, -4.0, 1, -1, approachScene);
      createCrowd(approachScene, [
        [-3.7, 6.0, 0.2], [3.8, 3.1, -0.3], [-4.0, 0.2, 0.5],
        [4.1, -2.2, -0.5], [-3.6, -4.7, 0.1],
      ]);

      // Versammlung, Schieß- und Geschicklichkeitsspiele.
      createFountain(assemblyScene);
      createStall(-5.9, -10.4, 3, 0.12, assemblyScene);
      createStall(5.9, -12.1, 0, -0.10, assemblyScene);
      createTargetStand(-4.8, -17.8, 0.12, assemblyScene);
      createTargetStand(4.8, -17.8, -0.12, assemblyScene);
      createCrate(-4.2, -13.2, 0.82, assemblyScene);
      createBarrel(4.0, -15.0, 0.76, assemblyScene);
      createBanner(-5.7, -15.2, 2, 1, assemblyScene);
      createBanner(5.7, -15.6, 3, -1, assemblyScene);
      createPennantLine(assemblyScene);
      createCrowd(assemblyScene, [
        [-3.5, -11.3, 0.4], [3.7, -12.8, -0.3], [-2.9, -15.8, 0.1],
        [2.8, -16.0, -0.2], [-4.0, -18.9, 0.4], [4.0, -19.0, -0.4],
      ]);

      // Glückshafen und Gewinnerausruf.
      createLuckHarbor(resultsScene);
      createHeraldStage(resultsScene);
      createFortuneWheel(resultsScene);
      createStall(-6.0, -20.6, 2, 0.10, resultsScene);
      createBarrel(-6.2, -26.5, 0.86, resultsScene);
      createCrate(-4.4, -27.0, 0.86, resultsScene);
      createSack(1.6, -26.7, 0.86, resultsScene);
      createBanner(-6.2, -27.4, 0, 1, resultsScene);
      createBanner(6.2, -27.0, 1, -1, resultsScene);
      createCrowd(resultsScene, [
        [-3.8, -21.0, 0.4], [-2.6, -20.5, 0.2], [1.4, -20.6, -0.1],
        [2.3, -21.5, -0.2], [-3.6, -26.3, 0.5], [-2.1, -27.0, 0.2],
        [1.1, -27.0, -0.2], [2.5, -26.2, -0.4],
      ]);

      // Wolken nur auf ausreichender Hardware.
      if (quality !== 'low') {
        const cloudCanvas = document.createElement('canvas');
        cloudCanvas.width = 192;
        cloudCanvas.height = 96;
        const cloudContext = cloudCanvas.getContext('2d');
        [[50, 55, 32], [86, 42, 40], [125, 57, 34], [101, 64, 43]].forEach(([x, y, radius]) => {
          const gradient = cloudContext.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, 'rgba(255,255,252,0.86)');
          gradient.addColorStop(0.58, 'rgba(245,251,248,0.48)');
          gradient.addColorStop(1, 'rgba(245,251,248,0)');
          cloudContext.fillStyle = gradient;
          cloudContext.beginPath();
          cloudContext.arc(x, y, radius, 0, Math.PI * 2);
          cloudContext.fill();
        });

        const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
        cloudTexture.colorSpace = THREE.SRGBColorSpace;
        const count = quality === 'high' ? 6 : 4;

        for (let index = 0; index < count; index += 1) {
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: cloudTexture,
            transparent: true,
            depthWrite: false,
            opacity: 0.26 + (index % 2) * 0.05,
          }));
          sprite.position.set(-30 + index * 11.5, 12 + (index % 3) * 2.0, -28 - (index % 3) * 7);
          const size = 6.0 + (index % 3) * 1.7;
          sprite.scale.set(size * 1.8, size, 1);
          scene.add(sprite);
          cloudSprites.push(sprite);
        }
      }

      setStageVisibility(activeStep);
      if (shadowsEnabled) renderer.shadowMap.needsUpdate = true;
    }

    const scheduleIdle = window.requestIdleCallback
      ? (callback) => window.requestIdleCallback(callback, { timeout: 500 })
      : (callback) => window.setTimeout(callback, 110);
    scheduleIdle(buildDetails);

    // ---------- Kameraweg ----------
    const stops = [
      { x: 0.00, y: 3.02, z: 16.5, lookX: 0.00, lookY: 2.00, lookZ: 2.0, fov: 47.0 },
      { x: -0.28, y: 2.98, z: 12.1, lookX: -0.12, lookY: 2.02, lookZ: -2.7, fov: 46.5 },
      { x: 0.24, y: 2.94, z: 8.2, lookX: 0.10, lookY: 2.02, lookZ: -6.6, fov: 46.0 },
      { x: -0.18, y: 2.91, z: 4.2, lookX: -0.10, lookY: 2.00, lookZ: -10.8, fov: 45.4 },
      { x: 0.26, y: 2.88, z: 0.2, lookX: 0.06, lookY: 2.02, lookZ: -15.3, fov: 44.8 },
      { x: -0.10, y: 2.94, z: -5.7, lookX: 1.65, lookY: 2.18, lookZ: -22.8, fov: 43.8 },
      { x: 0.80, y: 2.93, z: -8.8, lookX: 2.65, lookY: 2.42, lookZ: -23.2, fov: 41.8 },
    ];

    const currentPose = { ...stops[0] };
    let startPose = { ...stops[0] };
    let targetPose = { ...stops[0] };
    let targetStep = 0;
    let journeyStartedAt = performance.now();
    const journeyDuration = reducedMotion ? 1 : 940;

    function easeInOutCubic(value) {
      return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    function lerp(start, end, amount) {
      return start + (end - start) * amount;
    }

    function snapshotPose() {
      return {
        x: currentPose.x,
        y: currentPose.y,
        z: currentPose.z,
        lookX: currentPose.lookX,
        lookY: currentPose.lookY,
        lookZ: currentPose.lookZ,
        fov: currentPose.fov,
      };
    }

    function setJourney(step) {
      const next = Math.max(0, Math.min(stops.length - 1, step));
      setStageVisibility(next);

      if (next === targetStep) return;
      startPose = snapshotPose();
      targetPose = { ...stops[next] };
      targetStep = next;
      journeyStartedAt = performance.now();

      document.body.classList.add('vr-walking');
      window.setTimeout(() => document.body.classList.remove('vr-walking'), journeyDuration + 120);
    }

    // ---------- App-Fortschritt erkennen ----------
    const welcomePanel = document.getElementById('welcome-panel');
    const entryChoice = document.getElementById('entry-choice');
    const createPanel = document.getElementById('create-panel');
    const modePanel = document.getElementById('mode-panel');
    const joinPanel = document.getElementById('join-panel');
    const voteSection = document.getElementById('vote-section');
    const resultsSection = document.getElementById('results-section');
    const winnerDisplay = document.getElementById('winner-display');

    function isVisible(element) {
      return Boolean(element && !element.hidden);
    }

    function detectStep() {
      if (isVisible(resultsSection)) {
        if ((winnerDisplay?.textContent || '').includes('Bestimmt wurde:')) return 6;
        return 5;
      }
      if (isVisible(voteSection)) return 4;
      if (isVisible(modePanel)) return 3;
      if (isVisible(createPanel) || isVisible(joinPanel)) return 2;
      if (isVisible(entryChoice)) return 1;
      if (isVisible(welcomePanel)) return 0;
      return 0;
    }

    function refreshJourney() {
      setJourney(detectStep());
    }

    const watchedElements = [
      welcomePanel,
      entryChoice,
      createPanel,
      modePanel,
      joinPanel,
      voteSection,
      resultsSection,
      winnerDisplay,
    ].filter(Boolean);

    const observer = new MutationObserver(refreshJourney);
    watchedElements.forEach((element) => {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['hidden', 'disabled', 'class'],
        childList: true,
        characterData: true,
        subtree: true,
      });
    });

    document.addEventListener('glueckshafen:stage', (event) => {
      const stage = event.detail?.stage;
      const stageSteps = {
        welcome: 0,
        'market-entry': 1,
        'scribe-stall': 2,
        'town-caller': 2,
        assembly: 3,
        voting: 4,
        results: 5,
        'wheel-spin': 5,
        'wheel-stop': 5,
        winner: 6,
      };

      if (stage in stageSteps) setJourney(stageSteps[stage]);

      if (stage === 'wheel-spin') {
        fortuneWheelMode = 'spinning';
        fortuneWheelSpeed = Math.max(fortuneWheelSpeed, 5.8);
      } else if (stage === 'wheel-stop') {
        fortuneWheelMode = 'stopping';
        fortuneWheelSpeed = Math.max(fortuneWheelSpeed, 5.2);
      } else if (stage === 'winner') {
        fortuneWheelMode = 'stopping';
        fortuneWheelSpeed = Math.max(fortuneWheelSpeed, 1.2);
      }
    });

    // ---------- Dezente Blickbewegung ----------
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;

    if (!coarsePointer && !reducedMotion) {
      window.addEventListener('pointermove', (event) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      window.addEventListener('pointerleave', () => {
        pointerX = 0;
        pointerY = 0;
      });
    }

    // ---------- Erste sichtbare Darstellung ----------
    camera.position.set(stops[0].x, stops[0].y, stops[0].z);
    camera.lookAt(new THREE.Vector3(stops[0].lookX, stops[0].lookY, stops[0].lookZ));
    renderer.render(scene, camera);
    document.body.classList.add('webgl-ready');

    // ---------- Animation ----------
    const lookTarget = new THREE.Vector3();
    let lastFrame = performance.now();
    let lastRenderedFov = camera.fov;
    let animationFrame = 0;
    let running = false;

    function updateFortuneWheel(delta, now) {
      if (!fortuneRotor || !resultsScene.visible) return;

      if (fortuneWheelMode === 'spinning') {
        fortuneWheelSpeed += (7.2 - fortuneWheelSpeed) * Math.min(1, delta * 2.8);
      } else if (fortuneWheelMode === 'stopping') {
        fortuneWheelSpeed *= Math.exp(-1.52 * delta);
        if (fortuneWheelSpeed < 0.06) {
          fortuneWheelSpeed = 0;
          fortuneWheelMode = 'idle';
        }
      } else {
        fortuneWheelSpeed *= Math.exp(-3.8 * delta);
      }

      if (fortuneWheelSpeed > 0.001) {
        fortuneRotor.rotation.z -= fortuneWheelSpeed * delta;
      }

      if (fortuneClacker) {
        const tick = Math.sin(fortuneRotor.rotation.z * 12) * Math.min(0.22, fortuneWheelSpeed * 0.035);
        fortuneClacker.rotation.z = tick;
      }

      if (fortuneWheelMode === 'idle' && activeStep === 6 && !reducedMotion) {
        fortuneRotor.rotation.z += Math.sin(now * 0.0011) * delta * 0.012;
      }
    }

    function animate(now) {
      if (!running) return;
      animationFrame = requestAnimationFrame(animate);
      if (now - lastFrame < frameInterval) return;

      const delta = Math.min((now - lastFrame) / 1000, 0.055);
      lastFrame = now;

      const rawProgress = journeyDuration <= 1
        ? 1
        : Math.min(1, (now - journeyStartedAt) / journeyDuration);
      const progress = easeInOutCubic(rawProgress);

      currentPose.x = lerp(startPose.x, targetPose.x, progress);
      currentPose.y = lerp(startPose.y, targetPose.y, progress);
      currentPose.z = lerp(startPose.z, targetPose.z, progress);
      currentPose.lookX = lerp(startPose.lookX, targetPose.lookX, progress);
      currentPose.lookY = lerp(startPose.lookY, targetPose.lookY, progress);
      currentPose.lookZ = lerp(startPose.lookZ, targetPose.lookZ, progress);
      currentPose.fov = lerp(startPose.fov, targetPose.fov, progress);

      smoothPointerX += (pointerX - smoothPointerX) * 0.075;
      smoothPointerY += (pointerY - smoothPointerY) * 0.075;

      const walking = rawProgress < 1 ? Math.sin(Math.PI * rawProgress) : 0;
      const walkBob = reducedMotion ? 0 : Math.sin(rawProgress * Math.PI * 8) * 0.024 * walking;

      camera.position.set(
        currentPose.x + smoothPointerX * 0.14,
        currentPose.y - smoothPointerY * 0.075 + walkBob,
        currentPose.z
      );

      const nextFov = currentPose.fov + (reducedMotion ? 0 : walking * 0.58);
      if (Math.abs(nextFov - lastRenderedFov) > 0.015) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
        lastRenderedFov = nextFov;
      }

      lookTarget.set(
        currentPose.lookX + smoothPointerX * 0.28,
        currentPose.lookY - smoothPointerY * 0.14,
        currentPose.lookZ
      );
      camera.lookAt(lookTarget);

      if (!reducedMotion) {
        swayItems.forEach((item, index) => {
          const sway = Math.sin(now * 0.001 * item.speed + index * 0.73) * item.amplitude;
          item.object.rotation.z = item.base + sway;
        });

        cloudSprites.forEach((cloud, index) => {
          cloud.position.x += delta * (0.13 + index * 0.012);
          if (cloud.position.x > 36) cloud.position.x = -36;
        });
      }

      updateFortuneWheel(delta, now);
      renderer.render(scene, camera);
    }

    function startAnimation() {
      if (running) return;
      running = true;
      lastFrame = performance.now() - frameInterval;
      animationFrame = requestAnimationFrame(animate);
    }

    function stopAnimation() {
      running = false;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    });

    let resizeFrame = 0;
    window.addEventListener('resize', () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        applyRendererSize();
        renderer.render(scene, camera);
      });
    }, { passive: true });

    refreshJourney();
    startAnimation();
  }

  boot();
})();
