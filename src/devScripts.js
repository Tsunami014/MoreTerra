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



window.setAllDebugOverlays = function (visible) {
    document.querySelectorAll('#devopts .dbcb').forEach(cb => {
        cb.checked = visible;
        cb.dispatchEvent(new Event('change'));
    });
};


function _getDebugThreeClasses() {
    const localPlayer = main.players.get(main.localPlayerId);
    if (!localPlayer) return null;
    return {
        Mesh: localPlayer.accessoryMesh.constructor,
        PlaneGeometry: localPlayer.accessoryMesh.geometry.constructor,
        MeshBasicMaterial: localPlayer.accessoryMesh.material.constructor,
    };
}

function _clearDebugGroup(key) {
    const group = main[key];
    if (!group) return;
    for (const mesh of group.meshes) {
        main.scene.remove(mesh);
        mesh.geometry.dispose();
    }
    for (const mat of group.materials) mat.dispose();
    main[key] = null;
}

function _drawEdgeLoop(Mesh, PlaneGeometry, material, points, opts = {}) {
    const { thickness = 0.08, y = 0.06, closed = true, renderOrder = 4 } = opts;
    const meshes = [];
    const count = closed ? points.length : points.length - 1;

    for (let i = 0; i < count; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const dx = b.x - a.x, dz = b.z - a.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 1e-4) continue;

        const geometry = new PlaneGeometry(length, thickness);
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = -Math.atan2(dz, dx);
        mesh.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
        mesh.renderOrder = renderOrder;
        main.scene.add(mesh);
        meshes.push(mesh);
    }
    return meshes;
}

function _circlePoints(cx, cz, radius, segments = 20) {
    const pts = [];
    for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * radius, z: cz + Math.sin(a) * radius });
    }
    return pts;
}

function _rectCorners(cx, cz, width, depth, rotation = 0) {
    const hw = width / 2, hd = depth / 2;
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => ({
        x: cx + lx * cos - lz * sin,
        z: cz + lx * sin + lz * cos,
    }));
}

window.setBoundsPolygonVisible = function(visible) {
    _clearDebugGroup('_boundsPolygonGroup');
    if (!visible) return;

    const poly = main.levelLoader.getCurrentLevel()?.boundsPolygon;
    if (!poly || poly.length < 2) return;

    const THREE = _getDebugThreeClasses();
    if (!THREE) return console.warn('[MoreTerra] No local player yet');

    const material = new THREE.MeshBasicMaterial({
        color: 0xff3333, transparent: true, opacity: 0.85, depthWrite: false, side: 2,
    });
    const meshes = _drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, material, poly, {
        thickness: 0.08, y: 0.06,
    });

    main._boundsPolygonGroup = { meshes, materials: [material] };
};

window.setCollidersVisible = function(visible) {
    _clearDebugGroup('_colliderGroup');
    if (!visible) return;

    const THREE = _getDebugThreeClasses();
    if (!THREE) return console.warn('[MoreTerra] No local player yet');

    const material = new THREE.MeshBasicMaterial({
        color: 0x33aaff, transparent: true, opacity: 0.85, depthWrite: false, side: 2,
    });
    const allMeshes = [];

    for (const c of main.colliders) {
        const points = c.type === 'cylinder'
            ? _circlePoints(c.x, c.z, c.radius, 20)
            : _rectCorners(c.x, c.z, c.width, c.depth, c.rotation || 0);

        allMeshes.push(..._drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, material, points, {
            thickness: 0.06, y: 0.055,
        }));
    }

    main._colliderGroup = { meshes: allMeshes, materials: [material] };
};

window.setExitZonesVisible = function(visible) {
    _clearDebugGroup('_exitZoneGroup');
    if (!visible) return;

    const zones = main.levelLoader.getExitZones();
    if (!zones || zones.length === 0) return;

    const THREE = _getDebugThreeClasses();
    if (!THREE) return console.warn('[MoreTerra] No local player yet');

    const material = new THREE.MeshBasicMaterial({
        color: 0xffee33, transparent: true, opacity: 0.85, depthWrite: false, side: 2,
    });
    const allMeshes = [];

    for (const z of zones) {
        const points = _rectCorners(z.x, z.z, z.width, z.depth, z.rotation || 0);
        allMeshes.push(..._drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, material, points, {
            thickness: 0.08, y: 0.07,
        }));
    }

    main._exitZoneGroup = { meshes: allMeshes, materials: [material] };
};

window.setSpawnPointsVisible = function(visible) {
    _clearDebugGroup('_spawnPointGroup');
    if (!visible) return;

    const spawns = main.levelLoader.getCurrentLevel()?.spawns;
    if (!spawns || spawns.length === 0) return;

    const THREE = _getDebugThreeClasses();
    if (!THREE) return console.warn('[MoreTerra] No local player yet');

    const material = new THREE.MeshBasicMaterial({
        color: 0x33ff77, transparent: true, opacity: 0.9, depthWrite: false, side: 2,
    });
    const allMeshes = [];
    const DOT_RADIUS = 0.35;

    for (const spawn of spawns) {
        const points = _circlePoints(spawn.x, spawn.z, DOT_RADIUS, 16);
        allMeshes.push(..._drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, material, points, {
            thickness: DOT_RADIUS * 2, y: 0.08,
        }));
    }

    main._spawnPointGroup = { meshes: allMeshes, materials: [material] };
};

window.setBuildGridVisible = function(visible) {
    main.setBuildGridVisible(visible);
};
