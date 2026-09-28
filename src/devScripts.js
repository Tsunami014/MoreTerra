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

window.dev.returnToTown = async function() {
    await teleport(oldPref+"town-square")
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
    // If there isn't at least one collider, it will clamp the position for no reason..?
    return [{ type: "cylinder", x: 1e9, z: 1e9, radius: 0 }]
}
var useExits = true
window.dev.setUseExits = function(use) { useExits = use }


//// -- Temporary object --

window.tmpobj = {}
window.tmpobj.obj = null
window.tmpobj.permanentise = function() {
    window.tmpobj.obj = null
}

window.tmpobj.create = function(type="template", obj) {
    const tmptyp = 'temptyp_' + Date.now()
    var old = MANIF.sprites[type]
    if (!old) old = main.assetManager.manifest.sprites[type]
    if (!old) {
        console.error('[MoreTerra] Unable to create temp sprite because type "'+type+'" does not exist!')
        return
    }
    MANIF.sprites[tmptyp] = structuredClone(old)
    window.tmpobj.remove(false)
    main.assetManager.loadManifSprite(tmptyp)
    const mesh = main.assetManager.createSprite(tmptyp)
    if (!mesh) {
        console.warn('[MoreTerra] Temp sprite failed to instantiate!')
        return
    }
    var telep = false
    if (!obj) {
        obj = { id: 'tempobj_' + Date.now(), x: 0, z: 0, rotation: 0, scale: 1, flipX: false, baseFade: false }
        telep = true
    }
    obj.type = tmptyp
    main.scene.add(mesh)
    main.levelLoader.getLevelObjects().set(obj.id, mesh)
    main.levelLoader.getCurrentLevel().objects.push(obj)
    window.tmpobj.obj = { obj, mesh }

    if (telep) window.tmpobj.teleport() // Also reloads colliders
    else {
        updateMesh(obj, mesh)
        window.tmpobj.updinps()
    }
}

function updateMesh(obj, mesh) {
    mesh.position.x = obj.x
    mesh.position.z = obj.z
    mesh.rotation.y = obj.rotation || 0
    mesh.scale.setScalar(obj.scale ?? 1)
    if (obj.flipX) mesh.scale.x = -Math.abs(mesh.scale.x)
}
function patch(obj, p) {
    for (const [path, value] of Object.entries(p)) {
        const keys = path.split(".");
        const last = keys.pop();
        const target = keys.reduce((o, k) => o[k], obj);
        target[last] = value;
    }
}
function updatelvl(p) {
    const { obj, mesh } = window.tmpobj.obj
    patch(obj, p)
    updateMesh(obj, mesh)
    window.tmpobj.updinps()
}
window.tmpobj.teleport = function() {
    if (!window.tmpobj.obj) return;
    const p = main.players.get(main.localPlayerId);
    updatelvl({ x: parseFloat(p.renderX.toFixed(4)), z: parseFloat(p.renderZ.toFixed(4)) });
}
function updatemanif(p) {
    const { obj, mesh } = window.tmpobj.obj
    patch(MANIF.sprites[obj.type], p)
    window.tmpobj.create(obj.type, obj)
}
function updateboth(p) {
    const obj = window.tmpobj.obj.obj
    patch(obj, p)
    patch(MANIF.sprites[obj.type], p)
    window.tmpobj.create(obj.type, obj)
}

window.tmpobj.remove = function(upd=true) {
    if (!window.tmpobj.obj) return;
    const { obj, mesh } = window.tmpobj.obj
    delete MANIF.sprites[obj.type]
    const objs = main.levelLoader.getCurrentLevel().objects
    objs.splice(objs.indexOf(obj), 1)
    main.levelLoader.getLevelObjects().delete(obj.id)
    main.scene.remove(mesh)
    main.disposeObject(mesh)
    window.tmpobj.obj = null

    if (upd) window.tmpobj.updinps()
}

window.tmpobj.copy = function(manif) {
    if (!window.tmpobj.obj) {
        console.warn("[MoreTerra] Cannot copy, there's no current temp object!")
        return
    }
    const obj = window.tmpobj.obj.obj
    var tocopy = JSON.stringify(manif? MANIF.sprites[obj.type] : obj, null, 2)
    if (manif) {
        // Make it like a JS object instead of JSON
        tocopy = tocopy.replace(/"(\w+)":/g, '$1:')
    }

    navigator.clipboard.writeText(tocopy)
    console.log("[MoreTerra] Copied!")
}

{ // The html for the objMenu should exist by now
    const inps = document.getElementById("objopts").querySelectorAll('input, select')

    inps.forEach(e=>{
        const both = e.classList.contains('bothattr')
        const manif = e.classList.contains('manifattr')
        const lvl = e.classList.contains('lvlattr')

        const typ = e.dataset.typ
        const pth = e.dataset.dat
        e.onchange = (event)=>{
            var val;
            if (typ === "bool") val = event.target.checked
            else {
                val = event.target.value
                if (typ === "num") val = parseFloat(val)||0
            }
            const patch = { [pth]: val }
            if (both) updateboth(patch);
            else if (lvl) updatelvl(patch);
            else if (manif) updatemanif(patch);
        }

        e.updval = (obj)=>{
            e.disabled = obj == null
            if (obj) {
                if (manif) obj = MANIF.sprites[obj.type]
                const nval = pth.split(".").reduce((o, k) => o == null? null:o[k], obj)
                if (typ === "bool") e.checked = nval
                else e.value = nval
            } else { e.value = null }
        }
    })

    const collinp = document.getElementById("collidersinp")
    window.tmpobj.updinps = function(init=false) {
        if (!init) main.colliders = main.levelLoader.getColliders()
        if (window.tmpobj.obj) {
            const obj = window.tmpobj.obj.obj
            inps.forEach(e=>e.updval(obj))
            collinp.value = JSON.stringify(MANIF.sprites[obj.type].colliders??[], null, 2)
            collinp.disabled = false
        } else {
            inps.forEach(e=>e.updval(null))
            collinp.value = ""
            collinp.disabled = true
        }
        if (!init) dev.refreshDebugOverlays()
    }
    window.tmpobj.updcolls = function() {
        const out = JSON.parse(collinp.value||"[]")
        updatemanif({ colliders: out })
    }
    window.tmpobj.updinps(true)
}


//// -- Camera zoom input --

const camzinp = document.getElementById("camzoominp")
camzinp.onchange = ()=>{
    const lvl = main.levelLoader.getCurrentLevel()
    if (lvl) lvl.cameraZoom = camzinp.value??1.2
}
function fixczinp() {
    const lvl = main.levelLoader.getCurrentLevel()
    if (lvl) {
        camzinp.disabled = false
        camzinp.value = lvl.cameraZoom
    } else {
        camzinp.disabled = true
        camzinp.value = null
    }
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
