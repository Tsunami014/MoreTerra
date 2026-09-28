function patchGameCanvas(data) {
    // Load the labels with an external function
    var suff = ";const LABLS = " + data.match(/\w+(?=\.textBox)/)

    // Copy the teleport function
    var pref = "const tele = "+data.match(/(?<=onMessage\(.forceTeleport., *)([^{]+{(?:[^{}]+)})/)[0].replaceAll("this", "main") + ";"

    // Store the list of actions globally
    suff += ";window.actions = " + data.match(/\w+(?= ?= ?{\s*open_devlog_terminal:)/)

    // Grab these for later
    const bagClasses = data.match(/\w+(?=\.bagIcon)/)[0]

    const out = pref + dataPref + data
        // Pick up the main class when networkClient is created
        .replace(/(?<=this\.networkClient ?=)/, "setMain(this)||")
        // Make ctrl keys also sprint, and add more keybinds
        .replace(/(?<=,\s*sprint: ?\[)([^\]]+\]),?/, "`ControlLeft`,`ControlRight`,$1,tf_printpos:[`KeyP`],tf_dbug:[`KeyT`],tf_updpos:[`KeyM`],")
        // Implement handler for extra keybinds
        .replace(/(if ?\(\w+\()(?:.interact.,?)([^{]*)/,
            "if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {return}"+
            "$1`tf_printpos`,$2{printPos()}"+
            "$1`tf_dbug`,$2{toggleDbug()}"+
            "$1`tf_updpos`,$2{syncPos()}"+
        "$&")
        // Make the information popup also have other interesting info
        .replace(/(?<=renderInfoDisplayCanvas\(([^,) ]+).*?\) ?{)([^}]*?)`\${Math\.round\(\1\)}ms`/, "$2getExtraInfo($1)")
        // Override getting the bounds polygon
        .replace(/(\w+\??\.)+boundsPolygon/g, "(useBounds&&$&)")
        // Override getting the colliders
        .replace(/this\.colliders,/g, "checkColls($&),")
        // Override getting the exit zones
        .replace(/getExitZones\(\) ?{/g, "$&if(!useExits) { return []; }")
        // Wrap setting the exit zone handler
        .replace(/(?<=onExitZoneIntercept ?=) ?(.+?)(?=[,)};])/g, "wrapExitZone($1)")
        // Override sending movement to the network
        .replace(/(?=this\.networkClient\.sendMove)/, "networkMove()&&")
        // Override reading the object's action
        .replace(/(\w+)(\.action\.type),/, "checkApply($1)||$1$2,")
        // Add an action type that does nothing
        .replace(/(?=open_devlog_terminal:)/, ` everythings_fine: () => {}, `)
        // Add a UI element to quickly open devlogs
        .replace(/`[^`]+\/assets\/sprites\/ui\/bag\.svg[^`]+(?=`)/, `$&</div></div>
            <button style="display: block;" onclick="window.actions['open_devlog_terminal']()" class="\${${bagClasses}.bag}">
                <img class="\${${bagClasses}.bagIcon}" src=/images/devlogs.webp alt=Devlogs>
            </button>
        `)
    + suff;
    // console.log(out)
    return out
}
