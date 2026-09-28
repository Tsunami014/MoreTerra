window.dev = {}

//// -- Load custom testing levels --

const testWorldId = 'mm_test'

window.dev.testWorld = async function(base, spawn) {
    if (!check()) return;
    current = testWorldId
    var load;
    if (base !== undefined) {
        if (base === "") { base = localStorage.getItem("lastLevelId"); }
        await main.assetManager.ensureEssential(base)
        if (main.assetManager.levelDataCache.get(oldPref+base)) { base = oldPref+base; }
        load = structuredClone(main.assetManager.levelDataCache.get(base))
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
            cameraZoom: 0.9,
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
                gridRows: 1,
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
    load.id = testWorldId
    load.name = "Test world"
    main.assetManager.levelDataCache.set(testWorldId, load)

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
            l?.(!0), await loadLevel(testWorldId, spawn??''), main.inputEnabled = true;
        },
        () => {
            l?.(!1);
        }
    )
}
window.dev.execWorld = async function(data, spawn) {
    main.assetManager.levelDataCache.set(testWorldId, data)
    dev.testWorld(testWorldId, spawn)
}


window.dev.openEditLvlOverlay = function() {
    LvlEditOverlay()
}


//// -- Bounds polygon tools --

var useBounds = true
window.dev.setUseBounds = function(use) { useBounds = use }
window.dev.rmBounds = function() {
    main.levelLoader.getCurrentLevel().boundsPolygon = []
    dev.refreshDebugOverlays()
}
window.dev.addBoundPoint = function() {
    const playr = main.players.get(main.localPlayerId)
    main.levelLoader.getCurrentLevel().boundsPolygon.push({
        x: parseFloat(playr.renderX.toFixed(4)),
        z: parseFloat(playr.renderZ.toFixed(4))
    })
    dev.refreshDebugOverlays()
}

var useColls = true
window.dev.setUseColliders = function(use) { useColls = use }
function checkColls(colls) {
    if (colls == null || useColls) return colls
    return []
}
var useExits = true
window.dev.setUseExits = function(use) { useExits = use }
function checkExits(xits) {
    if (xits == null || useExits) return xits
    return []
}


//// -- Temporary object --

window.tmpobj = {}
window.tmpobj.obj = null
window.tmpobj.permanentise = function() {
    window.tmpobj.obj = null
}

window.tmpobj.create = function(type="template", obj, inplace=false) {
    window.tmpobj.remove(!inplace)
    var tmptyp;
    if (inplace) {
        tmptyp = obj.type
    } else {
        tmptyp = 'temptyp_' + Date.now()
        MANIF.sprites[tmptyp] = structuredClone(MANIF.sprites[type])
        main.assetManager.loadManifSprite(tmptyp)
    }
    const mesh = main.assetManager.createSprite(tmptyp)
    if (!mesh) {
        console.warn('[MoreTerra] Temp sprite failed to instantiate!')
        return
    }
    var telep = false
    if (!obj) {
        obj = { id: 'tempobj_' + Date.now(), type: tmptyp, x: 0, z: 0, rotation: 0, scale: 1, flipX: false, baseFade: false }
        telep = true
    }
    main.scene.add(mesh)
    main.levelLoader.getLevelObjects().set(obj.id, mesh)
    main.levelLoader.getCurrentLevel().objects.push(obj)
    window.tmpobj.obj = { obj, mesh }

    if (telep) window.tmpobj.teleport() // Also reloads colliders
    else {
        updateMesh(obj, mesh)
        main.colliders = main.levelLoader.getColliders()
    }
}

function updateMesh(obj, mesh) {
    mesh.position.x = obj.x
    mesh.position.z = obj.z
    mesh.rotation.y = obj.rotation || 0
    mesh.scale.setScalar(obj.scale ?? 1)
    if (obj.flipX) mesh.scale.x = -Math.abs(mesh.scale.x)
}
function updatelvl(patch) {
    const { obj, mesh } = window.tmpobj.obj
    Object.assign(obj, patch)
    updateMesh(obj, mesh)
    main.colliders = main.levelLoader.getColliders();
}
window.tmpobj.teleport = function() {
    if (!window.tmpobj.obj) return;
    const p = main.players.get(main.localPlayerId);
    updatelvl({ x: p.renderX, z: p.renderZ });
}
function updatemanif(patch) {
    const { obj, mesh } = window.tmpobj.obj
    Object.assign(MANIF.sprites[obj.type], patch)
    window.tmpobj.create(obj.type, obj, true)
}
function updateboth(patch) {
    const { obj, _ } = window.tmpobj.obj
    Object.assign(obj, patch)
    Object.assign(MANIF.sprites[obj.type], patch)
    window.tmpobj.create(obj.type, obj, true)
}

window.tmpobj.remove = function(rmmanif=true) {
    if (!window.tmpobj.obj) return;
    const { obj, mesh } = window.tmpobj.obj
    if (rmmanif) delete MANIF.sprites[obj.type]
    const objs = main.levelLoader.getCurrentLevel().objects
    objs.splice(objs.indexOf(obj), 1)
    main.levelLoader.getLevelObjects().delete(obj.id)
    main.scene.remove(mesh)
    main.disposeObject(mesh)
    window.tmpobj.obj = null

    main.colliders = main.levelLoader.getColliders()
}

window.tmpobj.copy = function(manif) {
    if (!window.tmpobj.obj) {
        console.warn("[MoreTerra] Cannot copy, there's no current temp object!")
        return
    }
    const { obj, _ } = window.tmpobj.obj
    var tocopy = JSON.stringify(manif? MANIF.sprites[obj.type] : obj, null, 2)
    if (manif) {
        // Make it like a JS object instead of JSON
        tocopy = tocopy.replace(/"(\w+)":/g, '$1:')
    }

    navigator.clipboard.writeText(tocopy)
    console.log("[MoreTerra] Copied!")
}

{ // The html for the objMenu should exist by now
    document.getElementById("objopts").querySelectorAll('input, select').forEach(e=>{
        const both = e.classList.contains('bothattr')
        const manif = e.classList.contains('manifattr')
        const lvl = e.classList.contains('lvlattr')

        const typ = e.dataset.typ
        e.oninput = (event)=>{
            var val;
            if (typ === "bool") val = event.target.checked
            else {
                val = event.target.value
                if (typ === "num") val = parseFloat(val)
            }
            const patch = { [e.dataset.dat]: val }
            if (both) updateboth(patch);
            else if (lvl) updatelvl(patch);
            else if (manif) updatemanif(patch);
        }
    })
}


//// -- Debug drawing overlays --

window.dev.setAllDebugOverlays = function(visible) {
    document.querySelectorAll('#devopts .dbcb'+(visible? "":", #pointlightcb")).forEach(cb => {
        cb.checked = visible;
        cb.dispatchEvent(new Event('change'));
    });
};
window.dev.refreshDebugOverlays = function() {
    document.querySelectorAll('#devopts .dbcb, #pointlightcb').forEach(cb => {
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

const DOT_RADIUS = 0.35;

window.dev.setBoundsPolygonVisible = function(visible) {
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

window.dev.setCollidersVisible = function(visible) {
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
            ? _circlePoints(c.x, c.z, c.radius)
            : _rectCorners(c.x, c.z, c.width, c.depth, c.rotation || 0);

        allMeshes.push(..._drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, material, points, {
            thickness: 0.06, y: 0.055,
        }));
    }

    main._colliderGroup = { meshes: allMeshes, materials: [material] };
};

window.dev.setExitZonesVisible = function(visible) {
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

window.dev.setPointLightsVisible = function(visible) {
    _clearDebugGroup('_pointLightGroup');
    if (!visible) return;

    const lights = main.levelLoader.getCurrentLevel()?.lights;
    if (!lights) return;
    const pointls = lights.filter(i=>i.type === "point")
    if (pointls.length === 0) return;

    const THREE = _getDebugThreeClasses();
    if (!THREE) return console.warn('[MoreTerra] No local player yet');

    const allMats = {};
    const allMeshes = [];

    for (const l of pointls) {
        const points = _circlePoints(l.x, l.z, l.radius, 35);
        var mat;
        if (l.color in allMats) {
            mat = allMats[l.color]
        } else {
            mat = new THREE.MeshBasicMaterial({
                color: l.color, transparent: true, opacity: 0.8, depthWrite: false, side: 2,
            });
            allMats[l.color] = mat
        }
        allMeshes.push(..._drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, mat, points, {
            thickness: 0.06, y: l.y,
        }));

        const points2 = _circlePoints(l.x, l.z, DOT_RADIUS, 8);
        allMeshes.push(..._drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, mat, points2, {
            thickness: DOT_RADIUS * 2, y: l.y,
        }));
    }

    main._pointLightGroup = { meshes: allMeshes, materials: Object.values(allMats) };
};

window.dev.setSpawnPointsVisible = function(visible) {
    _clearDebugGroup('_spawnPointGroup');
    if (!visible) return;

    const spawns = main.levelLoader.getCurrentLevel()?.spawns;
    if (!spawns || spawns.length === 0) return;

    const THREE = _getDebugThreeClasses();
    if (!THREE) return console.warn('[MoreTerra] No local player yet');

    const material = new THREE.MeshBasicMaterial({
        color: 0x33ff77, transparent: true, opacity: 0.9, depthWrite: false, side: 2,
    });
    const primmaterial = new THREE.MeshBasicMaterial({
        color: 0x22bbaa, transparent: true, opacity: 0.9, depthWrite: false, side: 2,
    });
    const allMeshes = [];

    for (const spawn of spawns) {
        const points = _circlePoints(spawn.x, spawn.z, DOT_RADIUS, 16);
        allMeshes.push(..._drawEdgeLoop(THREE.Mesh, THREE.PlaneGeometry, spawn.isPrimary? primmaterial:material, points, {
            thickness: DOT_RADIUS * 2, y: 0.08,
        }));
    }

    main._spawnPointGroup = { meshes: allMeshes, materials: [material, primmaterial] };
};

window.dev.setBuildGridVisible = function(visible) {
    main.setBuildGridVisible(visible);
};
