const portal = "9999999999999_portall"
const MANIF = {
    sprites: {
        [portal]: {
            anchor: { x: 0.5, y: 0 },
            height: 2.2,
            path: "/moreterra/assets/portal.webp",
            width: 0.8
        }
    }
}
fetch("/manif.json").then(out=>{
    out.json().then(js=>{
        for (const key in js) {
            if (key in MANIF) {
                Object.assign(MANIF[key], js[key])
            } else {
                MANIF[key] = js[key]
            }
        }
        for (const group of Object.values(MANIF)) {
            for (const obj of Object.values(group)) {
                if (obj.path && !obj.path.startsWith("/")) {
                    obj.path = "/" + obj.path;
                }
            }
        }
        console.log("[MoreTerra] Updated manifest!")
    })
})
