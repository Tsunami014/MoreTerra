function modifyJSON(url, js) {
    //console.log(js)
    for (const nam in PORTAL_LOCATIONS) {
        if (url.includes(nam)) {
            const pos = PORTAL_LOCATIONS[nam]
            js.objects.push({
                id: portal,
                type: portal,
                x: pos[0],
                z: pos[1],
                rotation: pos[2]||0,
                scale: 1.2,
                action: { label: "Travel", type: "mm_enter" },
            })
            break
        }
    }
    if (js.npcs && js.npcs.length > 0 && 'id' in js.npcs[0]) {
        js.npcs.map(npc=>{
            var labl;
            if (npc.name.startsWith("~")) {
                labl = npc.name.slice(1)
            } else {
                labl = "talk to "+npc.name
            }
            js.objects.push({
                ...npc, type: npc.sprite,
                action: { label: labl, type: "mm_npc", data: npc },
            })
        })
        js.npcs = []
    }
}

const oldPref = "OLD-"
inst = null
var UILABLS;
function hook() {
    document.addEventListener("DOMContentLoaded", () => {
        // Do stuff with the index file
        idx = document.head.innerHTML.indexOf("index")
        file = document.head.innerHTML.slice(idx,document.head.innerHTML.indexOf(".", idx)) + ".js"
        import('/assets/'+file).then(module => {
            document.getElementById('root').insertAdjacentHTML('beforeend', DEVMENU)

            indxclsFound = false
            for (o in module) {
                ob = module[o]
                try {
                    "test" in ob
                } catch (e) {
                    continue;
                }
                if ("header" in ob) {
                    if (UILABLS) console.warn("[MoreTerra] Found multiple candidates for UI labels..?")
                    UILABLS = ob
                }
                if ("getInstance" in ob) {
                    if (indxclsFound) console.warn("[MoreTerra] Found multiple candidates for index class..?")
                    indxclsFound = true
                    proto = ob.prototype

                    oldgsi = proto.getSpriteIds
                    proto.getSpriteIds = function () {
                        return oldgsi.call(this).concat(Object.keys(MANIF.sprites))
                    }
                    oldgsd = proto.getSpriteDefinition
                    proto.getSpriteDefinition = function (obj) {
                        if (obj in MANIF.sprites) {
                            return MANIF.sprites[obj];
                        }
                        return oldgsd.call(this, obj);
                    }
                    oldload = proto._loadEssential
                    var init = true
                    proto._loadEssential = async function (...args) {
                        await oldload.call(this, ...args)
                        for (const nam in PORTAL_LOCATIONS) {
                            if (!this.levelDataCache.get(oldPref+nam)) {
                                const dat = this.getLevelData(nam)
                                if (dat === null) {
                                    const ts = this.levelDataPromises.get(nam)
                                    if (ts) {
                                        ts.then(obj=>{
                                            this.levelDataCache.set(oldPref+nam, obj)
                                        })
                                    }
                                } else {
                                    this.levelDataCache.set(oldPref+nam, dat)
                                }
                            }
                        }
                        if (init) {
                            init = false
                            for (const [nam, conts] of Object.entries(MANIF.sprites)) {
                                try {
                                    this.textures.set(nam, await this.getOrLoadTexture(conts.path));
                                } catch (t) {
                                    console.warn(`[MoreTerra] [deferred] Failed to load sprite "${nam}":`, t),
                                    this.textures.set(nam, this.createFallbackTexture("MM"+nam));
                                }
                            }
                        }
                    }
                    console.log("[MoreTerra] Successfully injected custom objects!")
                }
            }
            if (!UILABLS) {
                console.error("[MoreTerra] Unable to find UI labels!")
            }
            if (!indxclsFound) {
                console.error("[MoreTerra] Unable to find an instanceable object in the module!")
            }
        });
        if (XTRACSS) {
            const style = document.createElement('style');
            style.textContent = XTRACSS;
            document.head.appendChild(style)
        }
    })
}
