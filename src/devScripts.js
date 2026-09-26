window.testWorld = async function(base, spawn) {
  if (!check()) return;
  current = testWorld
  var load
  if (base !== undefined) {
    if (base === "") { base = localStorage.getItem("lastLevelId"); }
    await main.assetManager.ensureEssential(base)
    if (main.assetManager.levelDataCache.get(oldPref+base)) { base = oldPref+base; }
    load = main.assetManager.levelDataCache.get(base)
    if (!load) {
      console.error("Unknown level id:", base)
      return;
    }
  } else {
    load = {
      width: 20,
      height: 20,
      boundsPolygon: [
        { "x": -10, "z": -10 },
        { "x": 10, "z": -10 },
        { "x": 10, "z": 10 },
        { "x": -10, "z": 10 },
      ],
      levelType: "outdoor",
      cameraZoom: 1,
      spawn: { x: 0, z: 0 },
      spawns: [
        {
          id: "1776290095610_gxzpr9s",
          tag: "default",
          x: 0,
          z: 0,
          isPrimary: true
        },
      ],
      objects: [],
      colliders: [],
      npcs: [],
      exitZones: [],
      terrain: {
        gridCols: 1,
        gridRows: 2,
        cellSize: 20,
        tiles: [
          [ "ground" ],
        ],
        groundTiles: [
          [ null ],
        ]
      },
      lights: [
        {
          type: "ambient",
          color: "#deddda",
          intensity: 2.8
        },
        {
          type: "sun",
          color: "#b5835a",
          intensity: 1
        },
      ]
    }
  }
  load.id = testWorld
  load.name = "Test world"
  main.assetManager.levelDataCache.set(testWorld, load)

  console.log("[MoreTerra] Teleporting to test world"+(base? " replicating "+base : ""))
  let player = main.players.get(main.localPlayerId);
  let n = player.mesh.position.clone().project(main.camera),
    r = (n.x + 1) / 2,
    i = (-n.y + 1) / 2;
  main.setInputEnabled(!1);
  let c = main.sceneTransition,
    l = main.onTransitionStateChange;
  c.play(
    r, i,
    async () => {
        l?.(!0), await loadLevel(testWorld, spawn??''), main.inputEnabled = true;
    },
    () => {
        l?.(!1);
    }
  )
}

window.setBoundsPolygonVisible = function(visible) {
    if (main._boundsPolygonSegments) {
        for (const seg of main._boundsPolygonSegments) {
            main.scene.remove(seg);
            seg.geometry.dispose();
            seg.material.dispose();
        }
        main._boundsPolygonSegments = null;
    }

    if (!visible) return;

    const level = main.levelLoader.getCurrentLevel();
    const poly = level?.boundsPolygon;

    if (!poly || poly.length < 2) return;

    const localPlayer = main.players.get(main.localPlayerId);
    if (!localPlayer) {
        console.warn('[MoreTerra] No local player yet');
        return;
    }

    const Mesh = localPlayer.accessoryMesh.constructor;
    const PlaneGeometry = localPlayer.accessoryMesh.geometry.constructor;
    const MeshBasicMaterial = localPlayer.accessoryMesh.material.constructor;

    const THICKNESS = 0.08;
    const Y_OFFSET  = 0.06;

    const material = new MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: 2, // Some magic used everywhere aparently
    });

    const segments = [];
    const n = poly.length;

    for (let i = 0; i < n; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % n];

        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 1e-4) continue;

        const midX = (a.x + b.x) / 2;
        const midZ = (a.z + b.z) / 2;
        const angle = Math.atan2(dz, dx); // Rotation around Y needed to align with this edge

        const geometry = new PlaneGeometry(length, THICKNESS);
        const mesh = new Mesh(geometry, material);

        mesh.rotation.x = -Math.PI / 2; // Lay flat on the ground
        mesh.rotation.z = -angle;
        mesh.position.set(midX, Y_OFFSET, midZ);
        mesh.renderOrder = 4;

        main.scene.add(mesh);
        segments.push(mesh);
    }

    main._boundsPolygonSegments = segments;
}

