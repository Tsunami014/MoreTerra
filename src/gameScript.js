var main = null;

window.tfQuests = {
  _last: {},
  _synced: false,
  _progress: {}, // quest id -> [step index (-1 for completed), completed tasks from this step]
  refresh: function() {
    const room = main.networkClient.getRoom()
    const { defs, progress } = this._last
    if (defs) room.dispatchMessage('quest.definitions', defs)
    if (progress) room.dispatchMessage('quest.progress', progress)
  },
  clear_all_progress: function() {
    this._progress = {}
    this.save()
    this.refresh()
  },
  save: function() {
    localStorage.setItem("tf_quests", JSON.stringify(this._progress))
  },

  start: function(qid) {
    if (!this._progress[qid]) this.restart(qid)
  },
  restart: function(qid) {
    this._progress[qid] = [0, []]
    this.refresh()
  },
  completeTask: function(qid, tid, checkDone=true) {
    if (!this._progress[qid]) {
      this._progress[qid] = [0, [tid]]
    } else {
      this._progress[qid][1].push(tid)
    }
    if (checkDone) {
      const [up2, donetasks] = this._progress[qid]
      if (!QUESTS[qid].allSteps[up2].tasks.some(
        it=>donetasks.contains(it.id)
      )) {
        return this.completeStep(qid)
      }
    }
    this.refresh()
  },
  completeStep: function(qid, checkDone=true) {
    if (!this._progress[qid]) {
      this._progress[qid] = [0, []]
    } else {
      const [up2, donetasks] = this._progress[qid]
      if (checkDone && up2 >= QUESTS[qid].allSteps.length-1) {
        return this.completeQuest(qid)
      }
      this._progress[qid] = [up2+1, donetasks]
    }
    this.refresh()
  },
  completeQuest: function(qid) {
    if (!this._progress[qid]) {
      this._progress[qid] = [-1, []]
    } else {
      this._progress[qid] = [-1, this._progress[qid][1]]
    }
    this.refresh()
  },

  getProgress: function(qid) {
    const progr = this._progress[qid]
    if (!progr) return null
    const [up2, donetasks] = progr
    const q = QUESTS[qid]
    const done = up2 == -1
    return {
      completed: done,
      donesteps: done? q.allSteps : q.allSteps.slice(0, up2),
      curstepid: done? null : q.allSteps[up2].id,
      donetasks: donetasks,
    }
  },

  getDefs: function() {
    return Object.entries(QUESTS).map(([qid, q])=>{
      const [up2, donetasks] = this._progress[qid] ?? [0, []]
      return {
        questId: qid, title: q.title,
        currentStep: q.allSteps[up2],
        completedSteps: q.allSteps.slice(0, up2)
      }
    })
  },
  getProgress: function() {
    return Object.entries(this._progress).map(([qid, [up2, donetasks]]) => {
      return {
        questId: qid, completed: up2 == -1,
        currentStepIndex: up2 == -1? QUESTS[qid].allSteps.length-1 : up2,
        completedTasks: donetasks
      }
    });
  },
}
try {
  tfQuests._progress = JSON.parse(localStorage.getItem("tf_quests")) ?? {}
} catch (e) {}

function setMain(nmain, netclient) {
  main = nmain;
  const oem = main.emit
  main.emit = function(e, ...args) {
    const out = oem.call(this, e, ...args)
    if (e == "afterLevelTransition") {
      return out.then(()=>{
        tmpobj.remove()
        dev.refreshDebugOverlays()
      })
    }
    return out
  };
  const oll = main.loadLevel
  main.loadLevel = async function(...args) {
    await oll.call(this, ...args)
    fixczinp()
  }
  console.log(main)

  const room = netclient.getRoom()
  const proto = Object.getPrototypeOf(room)
  if (!proto.__tfPatched) {
    proto.__tfPatched = true;

    const olddm = proto.dispatchMessage
    proto.dispatchMessage = function (type, msg) {
      if (type === 'quest.definitions') {
        tfQuests._last.defs = msg
        msg = { ...msg, quests: [...msg.quests, ...structuredClone(tfQuests.getDefs())] }
      } else if (type === 'quest.progress') {
        tfQuests._last.progress = msg
        tfQuests.save()
        const silent = !tfQuests._synced
        tfQuests._synced = true
        msg = { ...msg, silent, progress: [...msg.progress, ...structuredClone(tfQuests.getProgress())] }
      }
      return olddm.call(this, type, msg)
    }
  }

  console.log("[Terraformed] Injected the GameCanvas!")
}

function check() {
  if (main === null) {
    console.error("[Terraformed] Not ready!");
    return false;
  }
  return true;
}


const devopts = document.getElementById('devopts')
const objopts = document.getElementById('objopts')

function extraCamZ() {
  if (devopts.style.display == "none") return 0
  return 1.75
}

function syncPos() {
  const playr = main.players.get(main.localPlayerId)
  playr.prevPhysX = playr.serverX
  playr.prevPhysZ = playr.serverZ
  playr.physicsState.x = playr.serverX
  playr.physicsState.z = playr.serverZ
  playr.state.velX = 0
  playr.state.velZ = 0
  playr.errorX = 0
  playr.errorZ = 0
  playr.pendingInputs = []
  tele({ x: playr.serverX, z: playr.serverZ })
}


const oldPref = "OLD-"
var current = null;

function printPos() {
  if (!check()) return;
  const playr = main.players.get(main.localPlayerId)
  console.log("x:", playr.renderX.toFixed(4), "z:", playr.renderZ.toFixed(4), "lvl:", current??(oldPref+localStorage.getItem("lastLevelId")))
  const aliases = Object.fromEntries(
    Object.entries(main.assetManager.manifest.spriteAliases).map(([k, v]) => [v, k])
  )

  console.log("Object types in this level:", Object.fromEntries(
    main.levelLoader.getCurrentLevel().objects.map(o => [
      o.type, aliases[o.type] ?? o.type
    ])
  ))
}
function getExtraInfo(t) {
  if (!check()) return Math.round(t)+"ms, Terraformed error!";
  const playr = main.players.get(main.localPlayerId)
  return Math.round(t)+"ms," +
    " x: "+playr.renderX.toFixed(2) +
    " z: "+playr.renderZ.toFixed(2)
}

function forceHideDbug() {
  devopts.style.display = "none"
  objopts.style.display = "none"
}
function toggleDbug() {
  const active = document.activeElement
  if (active && active != document.body) {return}
  devopts.style.display = devopts.style.display == ""? "none" : ""
  objopts.style.display = "none"
}
window.toggleObjOpts = function() {
  objopts.style.display = objopts.style.display == ""? "none" : ""
}

export function getCurrentLvl() {
  if (!check()) return {};
  var ld = main.assetManager.levelDataCache;
  if (current === null) {
    return [ld.get(oldPref+localStorage.getItem("lastLevelId")), true];
  }
  return [ld.get(current), current.startsWith(oldPref)];
}
export function inTerraformed() {
  return !getCurrentLvl()[1]
}

var uovaf = false
function networkMove() {
  if (!uovaf) {
    uovaf = true
    setTimeout(()=>{
      uovaf = false
      dev.updNearestObjVisible()
    }, 100)
  }
  return !inTerraformed();
}


var outsky = null;
var insky = [0, 0, 0];

async function clearLevel() {
  main.npcs.forEach((e) => {
    main.scene.remove(e.mesh), main.disposeObject(e.mesh);
  })
  main.npcs.clear()
  main.npcColliders.clear()
  main.farmItems.forEach((e) => {
    main.scene.remove(e.mesh), main.disposeObject(e.mesh);
  });
  main.farmItems.clear();
  main.farmColliders.clear();
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

  if (isTown) await main.migrateRoom();

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

  dev.refreshDebugOverlays()
}

export async function teleport(to, spawn, then) {
  if (!check()) return;
  tmpobj.remove()
  const lvlId = localStorage.getItem("lastLevelId")
  if (to === "") { to = lvlId; }
  await main.assetManager.ensureEssential(to)
  console.log("[Terraformed] Teleporting to", to, spawn)
  const ld = main.assetManager.levelDataCache;
  if (ld.get(oldPref+to)) { to = oldPref+to; }
  ld.set(lvlId, ld.get(to))
  current = to

  let player = main.players.get(main.localPlayerId);
  let n = player.mesh.position.clone().project(main.camera),
    r = (n.x + 1) / 2,
    i = (-n.y + 1) / 2;
  main.setInputEnabled(!1);
  let onchng = main.onTransitionStateChange
  main.sceneTransition.play(
    r, i,
    async () => {
      onchng?.(!0)
      await loadLevel(lvlId, spawn)
      main.inputEnabled = true
      if (then) then()
    },
    () => {
        onchng?.(!1)
    }
  )
}
window.travelTo = teleport;

function nxtNpcDialog(npc, id) {
  if (id == "") return;
  for (const d of npc.dialogueTree) {
    if (d.id == id) {
      const nt = d.nodeType || "npc";
      if (nt == "npc") {
        if (d.text.startsWith("~~")) {
          // Split by newline
          d.text.split(String.fromCharCode(10)).slice(1).forEach(txt=>{
            checkApply({action: JSON.parse(txt.replaceAll("'", '"'))})
          })
          nxtNpcDialog(npc, d.nextNodeId)
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
        console.warn("[Terraformed] Unknown npc action: "+nt)
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
  const act = obj.action
  if (act.type.startsWith("tf_")) {
    const cmd = act.type.split("_").slice(1)[0]
    if (cmd == "enter") {
      teleport("catacombs", "", ()=>{
        tfQuests.start("tfq_intro")
      })
    } else if (cmd == "exit") {
      teleport("", "")
    } else if (cmd == "npc") {
      runNpc(act.data)
    } else if (cmd == "startQ") {
      tfQuests.start(act.qid)
    } else if (cmd == "completeQtask") {
      tfQuests.completeTask(act.qid, act.qid)
    } else if (cmd == "completeQstep") {
      tfQuests.completeStep(act.qid)
    } else if (cmd == "completeQuest") {
      tfQuests.completeQuest(act.qid)
    } else {
      console.warn("[Terraformed] Unknown object action: "+cmd)
    }
    return "everythings_fine"
  }
}


function handleEZaction(type, params) {
  //console.log(act)
  if (type == "exit_level") {
    teleport(params.targetLevelId, params.targetSpawnTag)
  } else {
    console.warn("[Terraformed] Unknown exit zone action: "+type)
  }
}
function wrapExitZone(handl) {
  if (!handl) return handl
  function out(ext) {
    if (inTerraformed()) {
      ext.actions.forEach(a=>{ handleEZaction(a.type, a.params) })
      return true
    }
    return handl(ext)
  }
  return out;
}
