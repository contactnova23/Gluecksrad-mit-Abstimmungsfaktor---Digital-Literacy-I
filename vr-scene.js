(() => {
  const canvas = document.getElementById('vr-world-canvas');
  if (!canvas) return;

  async function boot() {
    let THREE;
    try {
      THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    } catch (error) {
      console.warn('3D-Welt konnte nicht geladen werden. Die helle Fallback-Welt bleibt sichtbar.', error);
      canvas.style.display = 'none';
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xeaf0dc, 0.014);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });

    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 180);
    scene.add(camera);

    // ---------- Sky ----------
    const skyGeometry = new THREE.SphereGeometry(110, 32, 18);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0xcfe3ff) },
        middleColor: { value: new THREE.Color(0xf5f8ff) },
        bottomColor: { value: new THREE.Color(0xfff0d2) },
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
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, 18.0, 0.0)).y * 0.5 + 0.5;
          vec3 col = mix(bottomColor, middleColor, smoothstep(0.0, 0.55, h));
          col = mix(col, topColor, smoothstep(0.55, 1.0, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    scene.add(new THREE.Mesh(skyGeometry, skyMaterial));

    // ---------- Lighting ----------
    const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x6f8d63, 2.15);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffdfaa, 4.2);
    sun.position.set(12, 22, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xd8ecff, 1.15);
    fill.position.set(-15, 9, 4);
    scene.add(fill);

    // ---------- Procedural textures ----------
    function makeCobbleTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#d8c7a8');
      grad.addColorStop(1, '#baa789');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      const stoneW = 52;
      const stoneH = 30;
      for (let row = 0; row < 18; row += 1) {
        const y = row * stoneH - 10;
        const offset = (row % 2) * (stoneW / 2);
        for (let col = -1; col < 12; col += 1) {
          const x = col * stoneW + offset;
          const jitter = ((row * 17 + col * 13) % 7) - 3;

          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2 + jitter * 0.25, stoneW - 5, stoneH - 5, 7);
          ctx.fillStyle = row % 3 === 0 ? '#ccb99a' : row % 3 === 1 ? '#d6c4a5' : '#c3b092';
          ctx.fill();

          ctx.strokeStyle = 'rgba(111,89,59,0.20)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255,255,255,0.18)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 7);
          ctx.lineTo(x + stoneW - 10, y + 7);
          ctx.stroke();
        }
      }

      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2.2, 16);
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    function makePlasterTexture(base = '#eadfc7') {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 1200; i += 1) {
        const alpha = 0.02 + Math.random() * 0.035;
        ctx.fillStyle = Math.random() > 0.5
          ? `rgba(255,255,255,${alpha})`
          : `rgba(100,80,55,${alpha})`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
      }

      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.4, 1.4);
      return texture;
    }

    function makeCloudTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 256, 128);

      const blobs = [
        [70, 68, 45], [108, 54, 54], [150, 67, 48], [128, 80, 58], [185, 78, 32],
      ];
      for (const [x, y, r] of blobs) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.92)');
        g.addColorStop(0.55, 'rgba(255,255,255,0.65)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }

    const cobble = makeCobbleTexture();
    const plasterWarm = makePlasterTexture('#eadfc7');
    const plasterCream = makePlasterTexture('#f2e8d2');

    // ---------- Ground & street ----------
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 95),
      new THREE.MeshStandardMaterial({ color: 0x8aa47b, roughness: 0.96 })
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, -0.04, -15);
    lawn.receiveShadow = true;
    scene.add(lawn);

    const street = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 92),
      new THREE.MeshStandardMaterial({
        map: cobble,
        color: 0xffffff,
        roughness: 0.88,
        metalness: 0.0,
      })
    );
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.015, -14);
    street.receiveShadow = true;
    scene.add(street);

    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xd9c8a8, roughness: 0.92 });
    for (const x of [-5.3, 5.3]) {
      const walk = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 88), sidewalkMaterial);
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(x, 0.035, -13);
      walk.receiveShadow = true;
      scene.add(walk);
    }

    // ---------- Helpers ----------
    function roundedRectShape(w, h, r) {
      const shape = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      return shape;
    }

    function roundedBox(w, h, d, material, radius = 0.16) {
      const shape = roundedRectShape(w, h, Math.min(radius, Math.min(w, h) * 0.15));
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: d,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.07,
        bevelSegments: 2,
        curveSegments: 6,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    }

    function windowPane(material, x, y, z, scaleX = 0.36, scaleY = 0.55) {
      const frame = new THREE.Group();

      const trim = new THREE.Mesh(
        new THREE.PlaneGeometry(scaleX + 0.11, scaleY + 0.11),
        new THREE.MeshStandardMaterial({ color: 0xd0b88f, roughness: 0.75 })
      );
      trim.position.z = 0.002;
      frame.add(trim);

      const pane = new THREE.Mesh(new THREE.PlaneGeometry(scaleX, scaleY), material);
      pane.position.z = 0.008;
      frame.add(pane);

      frame.position.set(x, y, z);
      return frame;
    }

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x8db1c1,
      roughness: 0.28,
      metalness: 0.06,
      emissive: 0x5d6f74,
      emissiveIntensity: 0.10,
    });

    const warmWindowMat = new THREE.MeshStandardMaterial({
      color: 0xf3cf8f,
      roughness: 0.35,
      emissive: 0xf4bd63,
      emissiveIntensity: 0.32,
    });

    const roofColors = [0xa66b45, 0xb8794e, 0x9f6947, 0xb68057];
    const awningColors = [0x8e5f91, 0x597d75, 0xb37c5f, 0x6e7895];

    function addBalcony(group, facadeZ, y, width) {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.10, 0.42),
        new THREE.MeshStandardMaterial({ color: 0xd4c3a2, roughness: 0.82 })
      );
      slab.position.set(0, y, facadeZ + 0.24);
      slab.castShadow = true;
      group.add(slab);

      for (let x = -width / 2 + 0.12; x <= width / 2 - 0.08; x += 0.22) {
        const rail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.30, 8),
          new THREE.MeshStandardMaterial({ color: 0x6f6755, roughness: 0.66 })
        );
        rail.position.set(x, y + 0.18, facadeZ + 0.38);
        group.add(rail);
      }

      const topRail = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.035, 0.035),
        new THREE.MeshStandardMaterial({ color: 0x6f6755, roughness: 0.66 })
      );
      topRail.position.set(0, y + 0.33, facadeZ + 0.38);
      group.add(topRail);
    }

    function createBuilding(side, z, index) {
      const group = new THREE.Group();

      const width = 3.2 + (index % 3) * 0.38;
      const height = 4.4 + (index % 4) * 0.52;
      const depth = 4.0 + (index % 2) * 0.6;

      const mat = new THREE.MeshStandardMaterial({
        map: index % 2 ? plasterWarm : plasterCream,
        color: 0xffffff,
        roughness: 0.88,
      });

      const body = roundedBox(width, height, depth, mat, 0.14);
      body.position.y = height / 2;
      group.add(body);

      // soft cornice
      const cornice = roundedBox(
        width + 0.20,
        0.20,
        depth + 0.12,
        new THREE.MeshStandardMaterial({ color: 0xd6c19b, roughness: 0.82 }),
        0.06
      );
      cornice.position.y = height - 0.26;
      group.add(cornice);

      // roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(width * 0.72, 1.35, 4),
        new THREE.MeshStandardMaterial({
          color: roofColors[index % roofColors.length],
          roughness: 0.90,
        })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = height + 0.65;
      roof.castShadow = true;
      group.add(roof);

      // facade is local +Z, then entire group rotates toward street
      const facadeZ = depth / 2 + 0.09;
      const rows = Math.max(2, Math.floor(height / 1.35));
      for (let row = 0; row < rows; row += 1) {
        const y = 1.1 + row * 1.05;
        for (const x of [-0.78, 0, 0.78]) {
          if (Math.abs(x) > width / 2 - 0.32) continue;
          const pane = windowPane((row + index) % 4 === 0 ? warmWindowMat : windowMat, x, y, facadeZ, 0.34, 0.50);
          group.add(pane);
        }
      }

      if (index % 2 === 0) {
        addBalcony(group, facadeZ, Math.min(height - 1.25, 2.2), Math.min(width - 0.45, 2.5));
      }

      // awning at ground floor
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(2.1, width - 0.45), 0.12, 0.72),
        new THREE.MeshStandardMaterial({ color: awningColors[index % awningColors.length], roughness: 0.75 })
      );
      awning.position.set(0, 1.08, facadeZ + 0.30);
      awning.rotation.x = -0.16;
      awning.castShadow = true;
      group.add(awning);

      // flower boxes
      for (const x of [-0.72, 0.72]) {
        const planter = new THREE.Mesh(
          new THREE.BoxGeometry(0.58, 0.16, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x8f6748, roughness: 0.90 })
        );
        planter.position.set(x, 1.80, facadeZ + 0.14);
        group.add(planter);

        const flowers = new THREE.Group();
        const flowerColors = [0xd8788d, 0xf0c45f, 0x9878c4, 0xf3eee2];
        for (let i = 0; i < 6; i += 1) {
          const f = new THREE.Mesh(
            new THREE.SphereGeometry(0.055 + (i % 2) * 0.01, 8, 6),
            new THREE.MeshStandardMaterial({ color: flowerColors[(i + index) % flowerColors.length], roughness: 0.72 })
          );
          f.position.set(-0.22 + i * 0.09, 0.09 + (i % 2) * 0.04, 0);
          flowers.add(f);
        }
        flowers.position.set(x, 1.90, facadeZ + 0.20);
        group.add(flowers);
      }

      group.position.set(side === 'left' ? -7.4 : 7.4, 0, z);
      group.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

      scene.add(group);
      return group;
    }

    const buildingGroups = [];
    const zPositions = [13, 8.5, 4, -0.5, -5, -9.5, -14, -18.5, -23];
    zPositions.forEach((z, i) => {
      buildingGroups.push(createBuilding('left', z, i));
      buildingGroups.push(createBuilding('right', z, i + 1));
    });

    // ---------- Street lamps ----------
    function createLamp(x, z, sideIndex) {
      const g = new THREE.Group();
      const metal = new THREE.MeshStandardMaterial({ color: 0x514c42, roughness: 0.56, metalness: 0.28 });

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.75, 12), metal);
      post.position.y = 1.38;
      post.castShadow = true;
      g.add(post);

      const arm = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 20, Math.PI), metal);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(sideIndex * 0.23, 2.62, 0);
      g.add(arm);

      const globeMat = new THREE.MeshStandardMaterial({
        color: 0xffe3a8,
        emissive: 0xffc76a,
        emissiveIntensity: 0.85,
        roughness: 0.30,
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), globeMat);
      globe.position.set(sideIndex * 0.46, 2.63, 0);
      g.add(globe);

      const light = new THREE.PointLight(0xffcf7f, 0.9, 4.0, 2);
      light.position.copy(globe.position);
      g.add(light);

      g.position.set(x, 0, z);
      scene.add(g);
    }

    for (let i = 0; i < 8; i += 1) {
      const z = 10 - i * 5.1;
      createLamp(-4.2, z, 1);
      createLamp(4.2, z, -1);
    }

    // ---------- Palms / ornamental trees ----------
    function createPalm(x, z, mirror = 1) {
      const g = new THREE.Group();

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.18, 3.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x8d714c, roughness: 0.94 })
      );
      trunk.position.y = 1.8;
      trunk.rotation.z = 0.035 * mirror;
      trunk.castShadow = true;
      g.add(trunk);

      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x6c9f68,
        roughness: 0.82,
        side: THREE.DoubleSide,
      });

      for (let i = 0; i < 9; i += 1) {
        const angle = (i / 9) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.75, 1, 5), leafMat);
        leaf.position.set(Math.cos(angle) * 0.40, 3.60, Math.sin(angle) * 0.40);
        leaf.rotation.z = Math.PI / 2.8;
        leaf.rotation.y = -angle + Math.PI / 2;
        leaf.rotation.x = -0.22;
        g.add(leaf);
      }

      g.position.set(x, 0, z);
      scene.add(g);
      return g;
    }

    const palms = [];
    for (let i = 0; i < 7; i += 1) {
      const z = 7 - i * 6.2;
      palms.push(createPalm(-5.0, z, 1));
      palms.push(createPalm(5.0, z, -1));
    }

    // ---------- Benches / planters ----------
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8e6746, roughness: 0.88 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbb998, roughness: 0.88 });

    for (let i = 0; i < 5; i += 1) {
      const z = 5 - i * 7.4;
      for (const side of [-1, 1]) {
        const bench = new THREE.Group();

        const seat = roundedBox(1.2, 0.10, 0.42, woodMat, 0.03);
        seat.position.y = 0.46;
        bench.add(seat);

        const back = roundedBox(1.2, 0.55, 0.09, woodMat, 0.03);
        back.position.set(0, 0.73, -0.16);
        bench.add(back);

        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), stoneMat);
        const leg2 = leg1.clone();
        leg1.position.set(-0.45, 0.21, 0);
        leg2.position.set(0.45, 0.21, 0);
        bench.add(leg1, leg2);

        bench.position.set(side * 5.0, 0, z);
        bench.rotation.y = side < 0 ? 0.07 : Math.PI - 0.07;
        scene.add(bench);
      }
    }

    // ---------- Castle ----------
    function createCastle() {
      const castle = new THREE.Group();
      const ivory = new THREE.MeshStandardMaterial({ color: 0xeee4cf, roughness: 0.82 });
      const trim = new THREE.MeshStandardMaterial({ color: 0xd7bd8b, roughness: 0.78 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xc8865c, roughness: 0.84 });

      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(8.7, 32, 18),
        new THREE.MeshStandardMaterial({ color: 0x8fa77c, roughness: 0.96 })
      );
      hill.scale.set(1.55, 0.36, 0.72);
      hill.position.set(0, -1.3, 0);
      hill.receiveShadow = true;
      castle.add(hill);

      const center = roundedBox(5.2, 4.2, 3.5, ivory, 0.18);
      center.position.y = 2.6;
      castle.add(center);

      const keep = roundedBox(2.5, 5.7, 2.6, ivory, 0.18);
      keep.position.set(0, 4.3, 0.15);
      castle.add(keep);

      const towerPositions = [
        [-3.5, 2.9, 0.2], [3.5, 2.9, 0.2],
        [-2.2, 4.8, -0.2], [2.2, 4.8, -0.2],
      ];

      towerPositions.forEach(([x, y, z], i) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 5.0 + (i > 1 ? 1.4 : 0), 16), ivory);
        tower.position.set(x, y, z);
        tower.castShadow = true;
        castle.add(tower);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.12, 2.0, 16), roofMat);
        roof.position.set(x, y + 3.25 + (i > 1 ? 0.7 : 0), z);
        roof.castShadow = true;
        castle.add(roof);

        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), trim);
        cap.position.set(x, roof.position.y + 1.03, z);
        castle.add(cap);
      });

      // windows
      for (const x of [-1.3, 0, 1.3]) {
        const pane = windowPane(warmWindowMat, x, 3.0, 1.82, 0.42, 0.72);
        castle.add(pane);
      }

      castle.position.set(0, 1.6, -37);
      castle.scale.setScalar(1.0);
      scene.add(castle);
      return castle;
    }

    const castle = createCastle();

    // ---------- Mountains ----------
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x91a987, roughness: 1.0 });
    const mountainMat2 = new THREE.MeshStandardMaterial({ color: 0xa4b89a, roughness: 1.0 });
    for (let i = 0; i < 12; i += 1) {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(7 + (i % 3) * 2.4, 2),
        i % 2 ? mountainMat : mountainMat2
      );
      m.scale.set(1.8, 0.72 + (i % 4) * 0.12, 0.62);
      m.position.set(-34 + i * 6.3, 2 + (i % 3) * 1.2, -54 - (i % 4) * 4);
      scene.add(m);
    }

    // ---------- Clouds ----------
    const cloudTexture = makeCloudTexture();
    const cloudSprites = [];
    for (let i = 0; i < 14; i += 1) {
      const mat = new THREE.SpriteMaterial({
        map: cloudTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.38 + (i % 4) * 0.05,
        color: 0xffffff,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(-38 + (i * 7.1) % 76, 13 + (i % 4) * 2.1, -35 - (i % 5) * 8);
      const scale = 7 + (i % 3) * 2.6;
      sprite.scale.set(scale * 1.8, scale, 1);
      scene.add(sprite);
      cloudSprites.push(sprite);
    }

    // ---------- Floating light particles ----------
    const particleCount = window.innerWidth < 700 ? 90 : 170;
    const positions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = -10 + Math.random() * 20;
      positions[i * 3 + 1] = 0.5 + Math.random() * 8;
      positions[i * 3 + 2] = 14 - Math.random() * 50;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffd88c,
      size: 0.07,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ---------- Journey detection ----------
    const entryChoice = document.getElementById('entry-choice');
    const createPanel = document.getElementById('create-panel');
    const joinPanel = document.getElementById('join-panel');
    const voteSection = document.getElementById('vote-section');
    const resultsSection = document.getElementById('results-section');
    const questionInput = document.getElementById('question-input');
    const answersContainer = document.getElementById('answers-container');
    const spinBtn = document.getElementById('spin-btn');
    const stopBtn = document.getElementById('stop-btn');
    const winnerDisplay = document.getElementById('winner-display');

    const stops = [
      { x: 0.0, y: 3.15, z: 17.2, lookX: 0, lookY: 2.2, lookZ: 2.5, fov: 48 },
      { x: -0.45, y: 3.05, z: 12.5, lookX: -0.2, lookY: 2.2, lookZ: -2.0, fov: 47 },
      { x: 0.30, y: 3.00, z: 8.4, lookX: 0.1, lookY: 2.1, lookZ: -5.0, fov: 46.5 },
      { x: -0.15, y: 2.95, z: 4.3, lookX: 0.0, lookY: 2.0, lookZ: -8.5, fov: 46 },
      { x: 0.35, y: 2.90, z: 0.2, lookX: 0.2, lookY: 2.0, lookZ: -12.0, fov: 45.5 },
      { x: -0.30, y: 2.90, z: -3.8, lookX: -0.1, lookY: 2.15, lookZ: -17.0, fov: 45 },
      { x: 0.15, y: 2.95, z: -7.0, lookX: 0.0, lookY: 2.3, lookZ: -23.0, fov: 44.5 },
    ];

    let currentStep = 0;
    let targetStep = 0;
    let walkStart = 0;

    function isVisible(el) {
      return el && !el.hidden;
    }

    function filledAnswerCount() {
      if (!answersContainer) return 0;
      return Array.from(answersContainer.querySelectorAll('.answer-input'))
        .filter((input) => input.value.trim().length > 0).length;
    }

    function detectStep() {
      if (isVisible(resultsSection)) {
        const winner = winnerDisplay?.textContent || '';
        if (winner.includes('Gewinner:')) return 6;
        if (spinBtn?.disabled || stopBtn?.disabled === false) return 6;
        return 5;
      }

      if (isVisible(voteSection)) return 4;

      if (isVisible(joinPanel)) return 1;

      if (isVisible(createPanel)) {
        const hasQuestion = Boolean(questionInput?.value.trim());
        const answers = filledAnswerCount();
        if (!hasQuestion) return 1;
        if (answers < 2) return 2;
        return 3;
      }

      return 0;
    }

    function updateTargetStep() {
      const next = Math.max(0, Math.min(stops.length - 1, detectStep()));
      if (next !== targetStep) {
        targetStep = next;
        walkStart = performance.now();
        document.body.classList.add('vr-walking');
        window.setTimeout(() => document.body.classList.remove('vr-walking'), 1150);
      }
    }

    const observed = [
      entryChoice, createPanel, joinPanel, voteSection, resultsSection,
      spinBtn, stopBtn, winnerDisplay,
    ].filter(Boolean);

    const observer = new MutationObserver(updateTargetStep);
    observed.forEach((el) => {
      observer.observe(el, {
        attributes: true,
        attributeFilter: ['hidden', 'disabled', 'class'],
        childList: true,
        characterData: true,
        subtree: true,
      });
    });

    questionInput?.addEventListener('input', updateTargetStep);
    answersContainer?.addEventListener('input', updateTargetStep);

    // ---------- Pointer look ----------
    let pointerX = 0;
    let pointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;

    window.addEventListener('pointermove', (event) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
    });

    const current = { ...stops[0] };
    const look = new THREE.Vector3(stops[0].lookX, stops[0].lookY, stops[0].lookZ);

    updateTargetStep();

    // ---------- Animation ----------
    function damp(value, target, factor) {
      return value + (target - value) * factor;
    }

    const clock = new THREE.Clock();

    function animate(now) {
      requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.04);
      const target = stops[targetStep];

      current.x = damp(current.x, target.x, 0.035);
      current.y = damp(current.y, target.y, 0.035);
      current.z = damp(current.z, target.z, 0.035);
      current.lookX = damp(current.lookX, target.lookX, 0.035);
      current.lookY = damp(current.lookY, target.lookY, 0.035);
      current.lookZ = damp(current.lookZ, target.lookZ, 0.035);
      current.fov = damp(current.fov, target.fov, 0.035);

      smoothPointerX = damp(smoothPointerX, pointerX, 0.035);
      smoothPointerY = damp(smoothPointerY, pointerY, 0.035);

      const walkAge = Math.max(0, now - walkStart);
      const walkT = Math.min(1, walkAge / 1100);
      const walkFade = 1 - walkT;
      const bob = walkAge < 1100
        ? Math.sin(walkAge * 0.020) * 0.035 * walkFade
        : 0;

      camera.position.set(
        current.x + smoothPointerX * 0.20,
        current.y - smoothPointerY * 0.11 + bob,
        current.z
      );

      camera.fov = current.fov + (walkAge < 1100 ? Math.sin(Math.PI * walkT) * 1.2 : 0);
      camera.updateProjectionMatrix();

      look.set(
        current.lookX + smoothPointerX * 0.45,
        current.lookY - smoothPointerY * 0.24,
        current.lookZ
      );
      camera.lookAt(look);

      // clouds drift
      const t = now * 0.000035;
      cloudSprites.forEach((cloud, i) => {
        cloud.position.x += 0.0025 + (i % 3) * 0.0005;
        if (cloud.position.x > 44) cloud.position.x = -44;
        cloud.position.y += Math.sin(t * 8 + i) * 0.0007;
      });

      // palm leaves gently sway as entire trees
      palms.forEach((palm, i) => {
        palm.rotation.z = Math.sin(now * 0.00055 + i * 0.6) * 0.012;
      });

      // particle float
      const pos = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i += 1) {
        pos[i * 3 + 1] += Math.sin(now * 0.0011 + phases[i]) * 0.0009 + dt * 0.018;
        pos[i * 3] += Math.cos(now * 0.0007 + phases[i]) * 0.0007;
        if (pos[i * 3 + 1] > 8.6) pos[i * 3 + 1] = 0.5;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // tiny castle glow / life
      castle.rotation.y = Math.sin(now * 0.00018) * 0.003;

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.6));
    });
  }

  boot();
})();