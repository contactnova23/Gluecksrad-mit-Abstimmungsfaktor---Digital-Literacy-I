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
      return;
    }

    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf0ead7, mobile ? 0.016 : 0.0135);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: 'high-performance',
    });

    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        mobile ? 1.0 : 1.25
      )
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const shadowsEnabled = !mobile && !lowPower;
    renderer.shadowMap.enabled = shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      150
    );
    scene.add(camera);

    // ---------- Shared materials ----------
    const plasterMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xeee2ca, roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ color: 0xf4ead6, roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ color: 0xe8dcc5, roughness: 0.90 }),
    ];

    const roofMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xa96d49, roughness: 0.90 }),
      new THREE.MeshStandardMaterial({ color: 0xb77d54, roughness: 0.90 }),
      new THREE.MeshStandardMaterial({ color: 0x9d6747, roughness: 0.90 }),
    ];

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xd3c19d,
      roughness: 0.88,
    });

    const greenMaterial = new THREE.MeshStandardMaterial({
      color: 0x78996d,
      roughness: 0.96,
    });

    const darkGreenMaterial = new THREE.MeshStandardMaterial({
      color: 0x5f815e,
      roughness: 0.92,
    });

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d6847,
      roughness: 0.90,
    });

    // ---------- Sky ----------
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(100, 24, 14),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          topColor: { value: new THREE.Color(0xcfe3ff) },
          midColor: { value: new THREE.Color(0xf4f8ff) },
          bottomColor: { value: new THREE.Color(0xfff0d1) },
        },
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 bottomColor;
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos + vec3(0.0, 16.0, 0.0)).y * 0.5 + 0.5;
            vec3 c = mix(bottomColor, midColor, smoothstep(0.0, 0.58, h));
            c = mix(c, topColor, smoothstep(0.58, 1.0, h));
            gl_FragColor = vec4(c, 1.0);
          }
        `,
      })
    );
    scene.add(sky);

    // ---------- Lighting ----------
    scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x728968, 1.95));

    const sun = new THREE.DirectionalLight(0xffdda7, 3.5);
    sun.position.set(13, 22, 10);
    sun.castShadow = shadowsEnabled;

    if (shadowsEnabled) {
      sun.shadow.mapSize.set(512, 512);
      sun.shadow.camera.left = -24;
      sun.shadow.camera.right = 24;
      sun.shadow.camera.top = 24;
      sun.shadow.camera.bottom = -24;
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 72;
      sun.shadow.bias = -0.0004;
    }

    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xd9ebff, 0.85);
    fill.position.set(-14, 10, 6);
    scene.add(fill);

    // ---------- Procedural cobblestone texture ----------
    function cobbleTexture() {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#d8c7a8');
      grad.addColorStop(1, '#baa88b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      const w = 38;
      const h = 23;

      for (let row = 0; row < 13; row += 1) {
        const offset = row % 2 ? w / 2 : 0;

        for (let col = -1; col < 9; col += 1) {
          const x = col * w + offset;
          const y = row * h - 5;

          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 6);
          ctx.fillStyle =
            row % 3 === 0 ? '#ccb99a' :
            row % 3 === 1 ? '#d6c4a5' :
            '#c3b092';
          ctx.fill();

          ctx.strokeStyle = 'rgba(94,76,53,0.18)';
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
      }

      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.6, 13);
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    // ---------- Ground ----------
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(72, 88),
      new THREE.MeshStandardMaterial({ color: 0x8da77d, roughness: 0.98 })
    );
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, -0.04, -13);
    lawn.receiveShadow = shadowsEnabled;
    scene.add(lawn);

    const street = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, 86),
      new THREE.MeshStandardMaterial({
        map: cobbleTexture(),
        roughness: 0.90,
      })
    );
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, 0.01, -12);
    street.receiveShadow = shadowsEnabled;
    scene.add(street);

    const sidewalkGeometry = new THREE.PlaneGeometry(1.7, 84);
    for (const x of [-5.05, 5.05]) {
      const walk = new THREE.Mesh(sidewalkGeometry, stoneMaterial);
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(x, 0.025, -12);
      walk.receiveShadow = shadowsEnabled;
      scene.add(walk);
    }

    // ---------- Shared low-cost building geometry ----------
    const bodyGeometry = new THREE.BoxGeometry(1, 1, 1);

    function roofGeometry() {
      const geometry = new THREE.BufferGeometry();

      const positions = new Float32Array([
        -0.5, 0, -0.5,
         0.5, 0, -0.5,
         0.0, 0.58, -0.5,

        -0.5, 0,  0.5,
         0.5, 0,  0.5,
         0.0, 0.58,  0.5,
      ]);

      const indices = [
        0, 1, 2,
        4, 3, 5,
        0, 2, 5, 0, 5, 3,
        2, 1, 4, 2, 4, 5,
        0, 3, 4, 0, 4, 1,
      ];

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      return geometry;
    }

    const sharedRoofGeometry = roofGeometry();
    const awningGeometry = new THREE.BoxGeometry(1, 0.09, 0.55);

    const buildingSpecs = [];
    const zList = [10.5, 5.0, -0.5, -6.0, -11.5, -17.0];

    zList.forEach((z, index) => {
      for (const side of [-1, 1]) {
        buildingSpecs.push({
          side,
          z,
          height: 4.1 + ((index + (side > 0 ? 1 : 0)) % 3) * 0.58,
          depthX: 3.0 + (index % 2) * 0.34,
          widthZ: 4.25,
          materialIndex: (index + (side > 0 ? 1 : 0)) % plasterMaterials.length,
          roofIndex: (index + (side > 0 ? 2 : 0)) % roofMaterials.length,
          awningColor: [
            0x8f668f,
            0x607f73,
            0xb77c5c,
            0x727d99,
          ][(index + (side > 0 ? 1 : 0)) % 4],
        });
      }
    });

    const buildingGroups = [];

    for (const spec of buildingSpecs) {
      const group = new THREE.Group();
      const x = spec.side * 7.1;

      const body = new THREE.Mesh(
        bodyGeometry,
        plasterMaterials[spec.materialIndex]
      );
      body.scale.set(spec.depthX, spec.height, spec.widthZ);
      body.position.y = spec.height / 2;
      body.castShadow = shadowsEnabled;
      body.receiveShadow = shadowsEnabled;
      group.add(body);

      const cornice = new THREE.Mesh(
        bodyGeometry,
        stoneMaterial
      );
      cornice.scale.set(spec.depthX + 0.15, 0.18, spec.widthZ + 0.12);
      cornice.position.y = spec.height - 0.22;
      cornice.castShadow = shadowsEnabled;
      group.add(cornice);

      const roof = new THREE.Mesh(
        sharedRoofGeometry,
        roofMaterials[spec.roofIndex]
      );
      roof.scale.set(spec.depthX * 1.08, 1.35, spec.widthZ * 1.08);
      roof.position.y = spec.height;
      roof.castShadow = shadowsEnabled;
      group.add(roof);

      const awning = new THREE.Mesh(
        awningGeometry,
        new THREE.MeshStandardMaterial({
          color: spec.awningColor,
          roughness: 0.78,
        })
      );
      awning.scale.set(1.0, 1.0, 2.0);
      awning.position.set(
        spec.side * -(spec.depthX / 2 + 0.28),
        1.12,
        0
      );
      awning.rotation.z = spec.side * 0.10;
      awning.castShadow = shadowsEnabled;
      group.add(awning);

      // broad balcony: only every other building; no expensive rail bars
      if ((Math.abs(spec.z) * 10) % 11 < 6) {
        const balcony = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.10, 2.3),
          stoneMaterial
        );
        balcony.position.set(
          spec.side * -(spec.depthX / 2 + 0.18),
          Math.min(2.35, spec.height - 1.2),
          0
        );
        balcony.castShadow = shadowsEnabled;
        group.add(balcony);

        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.42, 2.15),
          new THREE.MeshStandardMaterial({
            color: 0x776f5d,
            roughness: 0.70,
          })
        );
        rail.position.set(
          spec.side * -(spec.depthX / 2 + 0.39),
          balcony.position.y + 0.22,
          0
        );
        group.add(rail);
      }

      group.position.set(x, 0, spec.z);
      scene.add(group);
      buildingGroups.push({ group, spec });
    }

    // ---------- Castle ----------
    const castle = new THREE.Group();
    const ivory = new THREE.MeshStandardMaterial({
      color: 0xeee4cf,
      roughness: 0.84,
    });
    const castleRoof = new THREE.MeshStandardMaterial({
      color: 0xc9875e,
      roughness: 0.86,
    });

    const castleCore = new THREE.Mesh(
      bodyGeometry,
      ivory
    );
    castleCore.scale.set(5.2, 4.1, 3.6);
    castleCore.position.y = 2.45;
    castleCore.castShadow = shadowsEnabled;
    castle.add(castleCore);

    const keep = new THREE.Mesh(
      bodyGeometry,
      ivory
    );
    keep.scale.set(2.4, 5.5, 2.5);
    keep.position.set(0, 4.1, 0.1);
    keep.castShadow = shadowsEnabled;
    castle.add(keep);

    for (const [x, z, taller] of [
      [-3.2, 0.2, false],
      [ 3.2, 0.2, false],
      [-1.9,-0.3, true ],
      [ 1.9,-0.3, true ],
    ]) {
      const height = taller ? 6.1 : 5.0;

      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.78, 0.88, height, 14),
        ivory
      );
      tower.position.set(x, height / 2, z);
      tower.castShadow = shadowsEnabled;
      castle.add(tower);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.02, 1.85, 14),
        castleRoof
      );
      roof.position.set(x, height + 0.92, z);
      roof.castShadow = shadowsEnabled;
      castle.add(roof);
    }

    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(8.5, 24, 12),
      greenMaterial
    );
    hill.scale.set(1.45, 0.34, 0.72);
    hill.position.y = -1.35;
    hill.receiveShadow = shadowsEnabled;
    castle.add(hill);

    castle.position.set(0, 1.55, -34);
    scene.add(castle);

    // ---------- Mountains ----------
    const mountainGeometry = new THREE.IcosahedronGeometry(1, 1);
    const mountainMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x91aa87, roughness: 1 }),
      new THREE.MeshStandardMaterial({ color: 0xa4b89a, roughness: 1 }),
    ];

    for (let i = 0; i < 8; i += 1) {
      const mountain = new THREE.Mesh(
        mountainGeometry,
        mountainMaterials[i % 2]
      );

      mountain.scale.set(
        9.0 + (i % 3) * 1.7,
        5.0 + (i % 3) * 1.0,
        5.0
      );
      mountain.position.set(
        -31 + i * 8.7,
        1.8 + (i % 2) * 1.0,
        -48 - (i % 3) * 3
      );
      scene.add(mountain);
    }

    // ---------- First visible frame immediately ----------
    const stops = [
      { x:  0.00, y: 3.05, z: 16.2, lookX:  0.00, lookY: 2.10, lookZ:  2.0, fov: 48.0 },
      { x: -0.32, y: 3.00, z: 12.2, lookX: -0.10, lookY: 2.08, lookZ: -2.5, fov: 47.3 },
      { x:  0.22, y: 2.96, z:  8.5, lookX:  0.10, lookY: 2.04, lookZ: -6.0, fov: 46.8 },
      { x: -0.16, y: 2.93, z:  4.8, lookX:  0.00, lookY: 2.02, lookZ: -9.8, fov: 46.3 },
      { x:  0.28, y: 2.90, z:  1.0, lookX:  0.12, lookY: 2.02, lookZ:-13.5, fov: 45.8 },
      { x: -0.22, y: 2.91, z: -2.7, lookX: -0.08, lookY: 2.12, lookZ:-18.0, fov: 45.3 },
      { x:  0.10, y: 2.96, z: -6.0, lookX:  0.00, lookY: 2.30, lookZ:-23.0, fov: 44.8 },
    ];

    const currentPose = { ...stops[0] };
    let startPose = { ...stops[0] };
    let targetPose = { ...stops[0] };
    let targetStep = 0;
    let journeyStartedAt = performance.now();
    const journeyDuration = reducedMotion ? 1 : 900;

    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
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

      if (next === targetStep) return;

      startPose = snapshotPose();
      targetPose = { ...stops[next] };
      targetStep = next;
      journeyStartedAt = performance.now();

      document.body.classList.add('vr-walking');
      window.setTimeout(
        () => document.body.classList.remove('vr-walking'),
        journeyDuration + 120
      );
    }

    // ---------- App progress detection ----------
    const entryChoice = document.getElementById('entry-choice');
    const createPanel = document.getElementById('create-panel');
    const modePanel = document.getElementById('mode-panel');
    const joinPanel = document.getElementById('join-panel');
    const voteSection = document.getElementById('vote-section');
    const resultsSection = document.getElementById('results-section');
    const spinBtn = document.getElementById('spin-btn');
    const winnerDisplay = document.getElementById('winner-display');

    function isVisible(element) {
      return Boolean(element && !element.hidden);
    }

    function detectStep() {
      if (isVisible(resultsSection)) {
        if ((winnerDisplay?.textContent || '').includes('Gewinner:')) return 6;
        return spinBtn?.disabled ? 6 : 5;
      }

      if (isVisible(voteSection)) return 4;
      if (isVisible(modePanel)) return 3;
      if (isVisible(createPanel)) return 2;
      if (isVisible(joinPanel)) return 1;

      return 0;
    }

    function refreshJourney() {
      setJourney(detectStep());
    }

    const watchedElements = [
      entryChoice,
      createPanel,
      modePanel,
      joinPanel,
      voteSection,
      resultsSection,
      spinBtn,
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

    // ---------- Render first frame NOW ----------
    camera.position.set(stops[0].x, stops[0].y, stops[0].z);
    camera.lookAt(
      new THREE.Vector3(
        stops[0].lookX,
        stops[0].lookY,
        stops[0].lookZ
      )
    );

    renderer.shadowMap.needsUpdate = shadowsEnabled;
    renderer.render(scene, camera);
    document.body.classList.add('webgl-ready');

    // ---------- Deferred details ----------
    let cloudSprites = [];
    let particleGeometry = null;
    let particlePhases = null;
    let particleCount = 0;
    const swayingTrees = [];
    const animatedDecorations = [];
    const lanternLights = [];

    function buildDeferredDetails() {
      // ----- Instanced windows -----
      const windowInstances = [];
      const trimInstances = [];

      for (const { group, spec } of buildingGroups) {
        const baseX = group.position.x;
        const streetFaceX =
          baseX - spec.side * (spec.depthX / 2 + 0.012);

        const rows = spec.height > 4.9 ? [1.55, 2.65, 3.75] : [1.55, 2.65];

        for (const y of rows) {
          for (const zOffset of [-1.10, 0, 1.10]) {
            if (Math.abs(zOffset) > spec.widthZ / 2 - 0.28) continue;

            windowInstances.push({
              x: streetFaceX,
              y,
              z: spec.z + zOffset,
              rotationY: spec.side > 0 ? -Math.PI / 2 : Math.PI / 2,
              warm: ((Math.round(spec.z * 10) + Math.round(y * 10)) % 5) === 0,
            });

            trimInstances.push({
              x: streetFaceX + spec.side * 0.007,
              y,
              z: spec.z + zOffset,
              rotationY: spec.side > 0 ? -Math.PI / 2 : Math.PI / 2,
            });
          }
        }
      }

      const trimGeo = new THREE.PlaneGeometry(0.50, 0.67);
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0xd0b88f,
        roughness: 0.78,
        side: THREE.DoubleSide,
      });
      const trims = new THREE.InstancedMesh(
        trimGeo,
        trimMat,
        trimInstances.length
      );

      const windowGeo = new THREE.PlaneGeometry(0.38, 0.54);
      const windowMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.30,
        emissive: 0x637981,
        emissiveIntensity: 0.08,
        side: THREE.DoubleSide,
      });
      const windows = new THREE.InstancedMesh(
        windowGeo,
        windowMat,
        windowInstances.length
      );

      const object = new THREE.Object3D();

      trimInstances.forEach((item, index) => {
        object.position.set(item.x, item.y, item.z);
        object.rotation.set(0, item.rotationY, 0);
        object.updateMatrix();
        trims.setMatrixAt(index, object.matrix);
      });

      windowInstances.forEach((item, index) => {
        object.position.set(
          item.x - Math.sign(item.x) * 0.006,
          item.y,
          item.z
        );
        object.rotation.set(0, item.rotationY, 0);
        object.updateMatrix();
        windows.setMatrixAt(index, object.matrix);

        windows.setColorAt(
          index,
          new THREE.Color(
            item.warm ? 0xf2c982 : 0x84aebc
          )
        );
      });

      trims.instanceMatrix.needsUpdate = true;
      windows.instanceMatrix.needsUpdate = true;
      if (windows.instanceColor) windows.instanceColor.needsUpdate = true;

      scene.add(trims, windows);

      // ----- Instanced street lamps -----
      const lampZ = [8, 2.5, -3, -8.5, -14, -19.5];
      const lampPositions = [];

      for (const z of lampZ) {
        lampPositions.push([-4.15, z], [4.15, z]);
      }

      const postMesh = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.055, 0.074, 2.65, 10),
        new THREE.MeshStandardMaterial({
          color: 0x514a40,
          roughness: 0.58,
          metalness: 0.18,
        }),
        lampPositions.length
      );

      const globeMesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.12, 10, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffe0a1,
          emissive: 0xffc76a,
          emissiveIntensity: 0.75,
          roughness: 0.34,
        }),
        lampPositions.length
      );

      lampPositions.forEach(([x, z], index) => {
        object.position.set(x, 1.33, z);
        object.rotation.set(0, 0, 0);
        object.updateMatrix();
        postMesh.setMatrixAt(index, object.matrix);

        object.position.set(x, 2.66, z);
        object.updateMatrix();
        globeMesh.setMatrixAt(index, object.matrix);
      });

      postMesh.instanceMatrix.needsUpdate = true;
      globeMesh.instanceMatrix.needsUpdate = true;
      scene.add(postMesh, globeMesh);

      // Only three real lights, not one per lantern.
      for (const [x, z] of [
        [-4.15, 5.2],
        [ 4.15,-5.8],
        [-4.15,-16.8],
      ]) {
        const light = new THREE.PointLight(
          0xffcf86,
          0.65,
          5.4,
          2
        );
        light.position.set(x, 2.7, z);
        scene.add(light);
        lanternLights.push(light);
      }

      // ----- Instanced ornamental trees -----
      const treePositions = [];
      for (const z of [7.0, 0.8, -5.4, -11.6, -17.8]) {
        treePositions.push([-5.5, z], [5.5, z]);
      }

      const trunkMesh = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.10, 0.15, 2.6, 9),
        woodMaterial,
        treePositions.length
      );

      const canopyMesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.82, 12, 8),
        darkGreenMaterial,
        treePositions.length * 3
      );

      treePositions.forEach(([x, z], index) => {
        object.position.set(x, 1.3, z);
        object.rotation.set(0, 0, 0);
        object.updateMatrix();
        trunkMesh.setMatrixAt(index, object.matrix);

        for (let part = 0; part < 3; part += 1) {
          object.position.set(
            x + (part - 1) * 0.42,
            2.85 + (part === 1 ? 0.34 : 0),
            z + (part === 1 ? 0 : (part === 0 ? -0.18 : 0.18))
          );
          object.scale.set(
            part === 1 ? 1.05 : 0.88,
            part === 1 ? 1.02 : 0.84,
            part === 1 ? 1.02 : 0.88
          );
          object.updateMatrix();
          canopyMesh.setMatrixAt(index * 3 + part, object.matrix);
          object.scale.set(1, 1, 1);
        }
      });

      trunkMesh.instanceMatrix.needsUpdate = true;
      canopyMesh.instanceMatrix.needsUpdate = true;
      scene.add(trunkMesh, canopyMesh);

      // ----- Fountain near destination -----
      const fountain = new THREE.Group();

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.55, 1.70, 0.32, 24),
        stoneMaterial
      );
      base.position.y = 0.16;
      fountain.add(base);

      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.28, 0.28, 24),
        stoneMaterial
      );
      bowl.position.y = 0.52;
      fountain.add(bowl);

      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(1.04, 1.04, 0.03, 24),
        new THREE.MeshStandardMaterial({
          color: 0x8dccdd,
          roughness: 0.20,
          metalness: 0.02,
          transparent: true,
          opacity: 0.84,
        })
      );
      water.position.y = 0.68;
      fountain.add(water);

      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.25, 1.25, 14),
        stoneMaterial
      );
      pillar.position.y = 1.14;
      fountain.add(pillar);

      fountain.position.set(0, 0, -25.0);
      scene.add(fountain);

      // ----- Medieval plaza details -----
      function createBanner(colorHex, accentHex) {
        const group = new THREE.Group();

        const bar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 1.25, 8),
          new THREE.MeshStandardMaterial({ color: 0x7f5731, roughness: 0.78 })
        );
        bar.rotation.z = Math.PI / 2;
        group.add(bar);

        const cloth = new THREE.Mesh(
          new THREE.PlaneGeometry(0.86, 1.15, 1, 4),
          new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.88,
            side: THREE.DoubleSide,
          })
        );
        cloth.position.set(0.34, -0.56, 0);
        group.add(cloth);

        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 1.05),
          new THREE.MeshStandardMaterial({
            color: accentHex,
            roughness: 0.86,
            side: THREE.DoubleSide,
          })
        );
        stripe.position.set(0.34, -0.56, 0.006);
        group.add(stripe);

        return { group, cloth };
      }

      [
        { x: -6.1, y: 3.8, z: -17.0, side: 1, colors: [0x7e4e32, 0xe6c27c] },
        { x:  6.1, y: 3.8, z: -13.0, side: -1, colors: [0x5f7b4d, 0xf3dfab] },
        { x: -6.1, y: 3.8, z:  -6.3, side: 1, colors: [0x6d4256, 0xf3d29d] },
        { x:  6.1, y: 3.8, z:  -1.2, side: -1, colors: [0x7d5b33, 0xf6ead0] },
      ].forEach((item, index) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.065, 4.2, 10),
          woodMaterial
        );
        pole.position.set(item.x, 2.1, item.z);
        scene.add(pole);

        const banner = createBanner(item.colors[0], item.colors[1]);
        banner.group.position.set(item.x + item.side * 0.06, 3.75, item.z);
        banner.group.rotation.y = item.side > 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(banner.group);

        animatedDecorations.push({
          mesh: banner.group,
          baseRotationZ: 0,
          amplitude: 0.05 + index * 0.01,
          speed: 0.8 + index * 0.18,
          axis: 'z',
        });
      });

      function createMarketStall(x, z, mainColor, canopyColor) {
        const stall = new THREE.Group();

        const top = new THREE.Mesh(
          new THREE.BoxGeometry(1.65, 0.1, 1.12),
          new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.82 })
        );
        top.position.y = 1.9;
        stall.add(top);

        const fabricStripe = new THREE.Mesh(
          new THREE.BoxGeometry(1.65, 0.03, 0.18),
          new THREE.MeshStandardMaterial({ color: 0xf4e4bf, roughness: 0.7 })
        );
        fabricStripe.position.set(0, 1.92, 0.28);
        stall.add(fabricStripe);
        const fabricStripe2 = fabricStripe.clone();
        fabricStripe2.position.z = -0.28;
        stall.add(fabricStripe2);

        for (const px of [-0.65, 0.65]) {
          for (const pz of [-0.42, 0.42]) {
            const leg = new THREE.Mesh(
              new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8),
              woodMaterial
            );
            leg.position.set(px, 0.95, pz);
            stall.add(leg);
          }
        }

        const counter = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.68, 0.75),
          new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.84 })
        );
        counter.position.set(0, 0.38, 0);
        stall.add(counter);

        stall.position.set(x, 0, z);
        scene.add(stall);
      }

      createMarketStall(-6.6, -23.6, 0xa57a4b, 0x687f52);
      createMarketStall(6.8, -22.8, 0x946540, 0x7f4e31);

      // ----- Wooden fortune wheel at the town square -----
      const squareWheel = new THREE.Group();

      const wheelStand = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 2.1, 0.32),
        woodMaterial
      );
      wheelStand.position.set(0, 1.05, 0);
      squareWheel.add(wheelStand);

      const crossBeam = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.22, 0.22),
        woodMaterial
      );
      crossBeam.position.set(0, 2.15, 0);
      squareWheel.add(crossBeam);

      for (const offset of [-0.95, 0.95]) {
        const brace = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 2.0, 0.18),
          woodMaterial
        );
        brace.position.set(offset, 1.0, 0);
        brace.rotation.z = offset < 0 ? 0.44 : -0.44;
        squareWheel.add(brace);
      }

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.25, 0.12, 12, 36),
        new THREE.MeshStandardMaterial({ color: 0x704523, roughness: 0.86 })
      );
      ring.position.set(0, 2.15, 0);
      squareWheel.add(ring);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.34, 18),
        new THREE.MeshStandardMaterial({ color: 0xc7a068, roughness: 0.58, metalness: 0.08 })
      );
      hub.rotation.x = Math.PI / 2;
      hub.position.set(0, 2.15, 0);
      squareWheel.add(hub);

      const spokeMaterial = new THREE.MeshStandardMaterial({ color: 0x8c6235, roughness: 0.84 });
      for (let i = 0; i < 8; i += 1) {
        const spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.15, 8),
          spokeMaterial
        );
        spoke.position.set(0, 2.15, 0);
        spoke.rotation.z = (Math.PI / 8) + (i * Math.PI / 4);
        squareWheel.add(spoke);
      }

      const wedgeColors = [0x7d4334, 0x637644, 0x8c6738, 0x586e79, 0x7a586b, 0x9b5a37];
      wedgeColors.forEach((color, index) => {
        const wedge = new THREE.Mesh(
          new THREE.CylinderGeometry(1.10, 1.10, 0.08, 24, 1, false, index * (Math.PI * 2 / wedgeColors.length), (Math.PI * 2 / wedgeColors.length) - 0.035),
          new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
        );
        wedge.rotation.x = Math.PI / 2;
        wedge.position.set(0, 2.15, -0.02);
        squareWheel.add(wedge);
      });

      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.35, 5),
        new THREE.MeshStandardMaterial({ color: 0xe2bf7d, roughness: 0.56, metalness: 0.08 })
      );
      pointer.position.set(0, 3.65, 0.08);
      pointer.rotation.z = Math.PI;
      squareWheel.add(pointer);

      squareWheel.position.set(0, 0, -20.8);
      scene.add(squareWheel);
      animatedDecorations.push({
        mesh: squareWheel,
        baseRotationZ: 0,
        amplitude: 0.012,
        speed: 0.55,
        axis: 'y',
        originY: squareWheel.rotation.y,
      });

      // ----- Clouds -----
      function cloudTexture() {
        const c = document.createElement('canvas');
        c.width = 192;
        c.height = 96;
        const ctx = c.getContext('2d');

        for (const [x, y, radius] of [
          [50, 55, 34],
          [86, 43, 42],
          [124, 56, 35],
          [102, 63, 45],
        ]) {
          const g = ctx.createRadialGradient(
            x, y, 0,
            x, y, radius
          );
          g.addColorStop(0, 'rgba(255,255,255,0.90)');
          g.addColorStop(0.58, 'rgba(255,255,255,0.58)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        const texture = new THREE.CanvasTexture(c);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      }

      const cloudMap = cloudTexture();
      const cloudCount = mobile ? 6 : 9;

      for (let index = 0; index < cloudCount; index += 1) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: cloudMap,
            transparent: true,
            depthWrite: false,
            opacity: 0.34 + (index % 3) * 0.05,
          })
        );

        sprite.position.set(
          -32 + (index * 8.2) % 64,
          12 + (index % 3) * 2.3,
          -29 - (index % 4) * 7
        );

        const scale = 6.3 + (index % 3) * 2.0;
        sprite.scale.set(scale * 1.75, scale, 1);
        scene.add(sprite);
        cloudSprites.push(sprite);
      }

      // ----- Tiny light particles -----
      particleCount = mobile ? 55 : 95;
      const positions = new Float32Array(particleCount * 3);
      particlePhases = new Float32Array(particleCount);

      for (let index = 0; index < particleCount; index += 1) {
        positions[index * 3] = -9 + Math.random() * 18;
        positions[index * 3 + 1] = 0.6 + Math.random() * 6.8;
        positions[index * 3 + 2] = 12 - Math.random() * 44;
        particlePhases[index] = Math.random() * Math.PI * 2;
      }

      particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      const points = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color: 0xffd68a,
          size: mobile ? 0.055 : 0.065,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
        })
      );

      scene.add(points);

      // Static geometry only: one final shadow-map render.
      if (shadowsEnabled) {
        renderer.shadowMap.needsUpdate = true;
      }
    }

    const scheduleDeferred =
      window.requestIdleCallback
        ? (fn) => window.requestIdleCallback(fn, { timeout: 450 })
        : (fn) => window.setTimeout(fn, 100);

    scheduleDeferred(buildDeferredDetails);

    // ---------- Animation ----------
    const lookTarget = new THREE.Vector3();

    let lastFrame = 0;
    const frameInterval =
      reducedMotion ? 1000 / 15 :
      mobile ? 1000 / 30 :
      1000 / 50;

    function animate(now) {
      requestAnimationFrame(animate);

      if (now - lastFrame < frameInterval) return;
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      const rawT =
        journeyDuration <= 1
          ? 1
          : Math.min(
              1,
              (now - journeyStartedAt) / journeyDuration
            );

      const t = easeInOutCubic(rawT);

      currentPose.x = lerp(startPose.x, targetPose.x, t);
      currentPose.y = lerp(startPose.y, targetPose.y, t);
      currentPose.z = lerp(startPose.z, targetPose.z, t);
      currentPose.lookX = lerp(startPose.lookX, targetPose.lookX, t);
      currentPose.lookY = lerp(startPose.lookY, targetPose.lookY, t);
      currentPose.lookZ = lerp(startPose.lookZ, targetPose.lookZ, t);
      currentPose.fov = lerp(startPose.fov, targetPose.fov, t);

      smoothPointerX +=
        (pointerX - smoothPointerX) * 0.07;
      smoothPointerY +=
        (pointerY - smoothPointerY) * 0.07;

      const walkFade =
        rawT < 1
          ? Math.sin(Math.PI * rawT)
          : 0;

      const walkBob =
        reducedMotion
          ? 0
          : Math.sin(rawT * Math.PI * 8) *
            0.028 *
            walkFade;

      camera.position.set(
        currentPose.x + smoothPointerX * 0.16,
        currentPose.y -
          smoothPointerY * 0.09 +
          walkBob,
        currentPose.z
      );

      camera.fov =
        currentPose.fov +
        (reducedMotion ? 0 : walkFade * 0.85);
      camera.updateProjectionMatrix();

      lookTarget.set(
        currentPose.lookX + smoothPointerX * 0.34,
        currentPose.lookY - smoothPointerY * 0.18,
        currentPose.lookZ
      );
      camera.lookAt(lookTarget);

      // Very light continuous animation only.
      for (let index = 0; index < cloudSprites.length; index += 1) {
        const cloud = cloudSprites[index];
        cloud.position.x += dt * (0.18 + (index % 3) * 0.025);

        if (cloud.position.x > 36) {
          cloud.position.x = -36;
        }
      }

      for (let index = 0; index < animatedDecorations.length; index += 1) {
        const item = animatedDecorations[index];
        const sway = Math.sin(now * 0.001 * item.speed + index) * item.amplitude;

        if (item.axis === 'z') {
          item.mesh.rotation.z = (item.baseRotationZ || 0) + sway;
        } else if (item.axis === 'y') {
          item.mesh.rotation.y = (item.originY || 0) + sway;
        }
      }

      for (let index = 0; index < lanternLights.length; index += 1) {
        const light = lanternLights[index];
        light.intensity = 0.58 + Math.sin(now * 0.0024 + index * 1.7) * 0.06;
      }

      if (particleGeometry && particlePhases) {
        const positions =
          particleGeometry.attributes.position.array;

        for (let index = 0; index < particleCount; index += 1) {
          positions[index * 3 + 1] +=
            dt * 0.045;

          positions[index * 3] +=
            Math.cos(now * 0.00055 + particlePhases[index]) *
            dt *
            0.012;

          if (positions[index * 3 + 1] > 7.8) {
            positions[index * 3 + 1] = 0.6;
          }
        }

        particleGeometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      camera.aspect =
        window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
      );

      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio || 1,
          window.innerWidth <= 700 ? 1.0 : 1.25
        )
      );
    });
  }

  boot();
})();