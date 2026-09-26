var main = null;
var outsky = null;
var insky = [0, 0, 0];
function setMain(nmain) {
  main = nmain;
  console.log("[MoreTerra] Injected the GameCanvas!")
  console.log(main)
}
function check() {
  if (main === null) {
    console.error("[MoreTerra] Not ready!");
    return false;
  }
  return true;
}


const testWorld = 'mm_test'
const oldPref = "OLD-"
var current = null;

function printPos() {
  if (!check()) return;
  const playr = main.players.get(main.localPlayerId)
  console.log("x:", playr.renderX.toFixed(4), "z:", playr.renderZ.toFixed(4), "lvl:", current??(oldPref+localStorage.getItem("lastLevelId")))
}
function getExtraInfo(t) {
  if (!check()) return Math.round(t)+"ms - MoreTerra error!";
  const playr = main.players.get(main.localPlayerId)
  return Math.round(t)+"ms," +
    " x: "+playr.renderX.toFixed(2) +
    " z: "+playr.renderZ.toFixed(2)
}

function toggleDbug() {
  const dbuginf = document.getElementById('devopts')
  dbuginf.style.display = dbuginf.style.display == ""? "none" : ""
}

export function getCurrentLvl() {
  if (!check()) return {};
  var ld = main.assetManager.levelDataCache;
  if (current === null) {
    return [ld.get(oldPref+localStorage.getItem("lastLevelId")), true];
  }
  return [ld.get(current), current.startsWith(oldPref)];
}
export function inMoreTerra() {
  return !getCurrentLvl()[1]
}

function networkMove() {
  return !inMoreTerra();
}


async function clearLevel() {
  main.npcs.forEach((e) => {
    main.scene.remove(e.mesh), main.disposeObject(e.mesh);
  })
  main.npcs.clear()
  main.interactableSprites.clear()
  main.nearbySprite = null
  main.onNearbySpriteChange?.(null)
  main.activeZoneIds.clear()
}
async function loadLevel(lvlId, spawn) {
  if (outsky === null) {
    const bg = main.scene.background
    outsky = [bg.r, bg.g, bg.b]
  }
  await clearLevel()
  localStorage.setItem("lastLevelId", lvlId)
  await main.loadLevel(lvlId, spawn)

  const [lvl, isTown] = getCurrentLvl()
  var goto = null
  for (const spn of lvl.spawns) {
    if (spn.tag == spawn) {
      goto = spn
      break
    }
  }
  if (goto === null) {
    goto = lvl.spawn
  }
  tele(goto)

  var indoor = lvl.levelType == "indoor"
  main.cloudSprites.forEach(c=>{c.visible = !indoor})

  const bg = main.scene.background
  if (indoor) {
    bg.r = insky[0]; bg.g = insky[1]; bg.b = insky[2];
  } else {
    bg.r = outsky[0]; bg.g = outsky[1]; bg.b = outsky[2];
  }
  if (isTown) {
    // Move down to sync with server again
    // Wait so that you aren't travelling before the loading starts if you load too fast
    await new Promise(resolve => setTimeout(resolve, 200));
    await main.networkClient.sendMove(0, 0.5, 0, 0, 0, 0, 0, 0);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  main.emit("afterLevelTransition")
}

export async function teleport(to, spawn) {
  if (!check()) return;
  const lvlId = localStorage.getItem("lastLevelId")
  if (to === "") { to = lvlId; }
  await main.assetManager.ensureEssential(to)
  console.log("[MoreTerra] Teleporting to", to, spawn)
  const ld = main.assetManager.levelDataCache;
  if (ld.get(oldPref+to)) { to = oldPref+to; }
  ld.set(lvlId, ld.get(to))
  current = to

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
        l?.(!0), await loadLevel(lvlId, spawn), main.inputEnabled = true;
    },
    () => {
        l?.(!1);
    }
  )
}

window.testWorld = async function(base, spawn) {
  if (!check()) return;
  current = testWorld
  var load
  if (base !== undefined) {
    if (base === "") { base = localStorage.getItem("lastLevelId"); }
    await main.assetManager.ensureEssential(base)
    if (main.assetManager.levelDataCache.get(oldPref+base)) { base = oldPref+base; }
    load = main.assetManager.levelDataCache.get(base)
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

function nxtNpcDialog(npc, id) {
  if (id == "") return;
  for (const d of npc.dialogueTree) {
    if (d.id == id) {
      const nt = d.nodeType || "npc";
      if (nt == "npc") {
        if (d.text.startsWith("~~ACTION")) {
          // Split by newline
          d.text.split(String.fromCharCode(10)).forEach(txt=>{
            if (txt.startsWith("~")) checkApply({action: {type: txt.slice(1)}})
          })
          return;
        }
        NpcDialog({ name: npc.name, img: npc.sprite+".webp" }, d.text, ()=>{
          nxtNpcDialog(npc, d.nextNodeId)
        })
      } else if (nt == "player") {
        Choices(d.choices.map(c=>{ return c.label }), idx=>{
          nxtNpcDialog(npc, d.choices[idx].nextNodeId)
        })
      } else {
        console.warn("[MoreTerra] Unknown npc action: "+nt)
      }
      break;
    }
  }
}
function runNpc(npc) {
  if (!npc.dialogueTree || npc.dialogueTree.length == 0) return;
  nxtNpcDialog(npc, npc.dialogueTree[0].id)
}


function checkApply(obj) {
  if (obj.action.type.startsWith("mm_")) {
    let spl = obj.action.type.split("_").slice(1)
    if (spl[0] == "enter") {
      teleport("catacombs", "")
    } else if (spl[0] == "exit") {
      teleport("", "")
    } else if (spl[0] == "npc") {
      runNpc(obj.action.data)
    } else {
      console.warn("[MoreTerra] Unknown object action: "+spl[0])
    }
    return "everythings_fine"
  }
}


function handleEZaction(type, params) {
  //console.log(act)
  if (type == "exit_level") {
    teleport(params.targetLevelId, params.targetSpawnTag)
  } else {
    console.warn("[MoreTerra] Unknown exit zone action: "+type)
  }
}
function wrapExitZone(handl) {
  if (!handl) return handl
  function out(ext) {
    if (inMoreTerra()) {
      ext.actions.forEach(a=>{ handleEZaction(a.type, a.params) })
      return true
    }
    return handl(ext)
  }
  return out;
}
