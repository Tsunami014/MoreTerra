function patchData(data) {
    // Load the labels with an external function
    var suff = ";const LABLS = " + data.match(/[a-zA-Z0-9_]+(?=\.textBox)/)

    // Copy the teleport function
    var pref = "const tele = "+data.match(/(?<=onMessage\(.forceTeleport., *)([^{]+{(?:[^{}]+)})/)[0].replaceAll("this", "main") + ";"

    // Store the list of actions globally
    suff += ";window.actions = " + data.match(/[a-zA-Z0-9_]+(?= ?= ?{\s*open_devlog_terminal:)/)

    // Grab these for later
    const bagClasses = data.match(/[a-zA-Z0-9_]+(?=\.bagIcon)/)[0]

    return pref + dataPref + data
        // Pick up the main class when networkClient is created
        .replace(/(?<=this\.networkClient ?=)/, "setMain(this)||")
        // Make ctrl keys also sprint, and add a P and ` keybind
        .replace(/(?<=,\s*sprint: ?\[)([^\]]+\]),?/, "`ControlLeft`,`ControlRight`,$1,mm_printpos:[`KeyP`],mm_dbug:[`KeyT`],")
        // Implement handler for P and ` keybinds
        .replace(/if ?\(([a-zA-Z0-9]+\()(.interact.,?)([^)]*)/,
            "if (document.activeElement?.classList.contains(`hogfocus`)) {return}"+
            "if ($1`mm_printpos`,$3)) {printPos()}"+
            "if ($1`mm_dbug`,$3)) {toggleDbug()}"+
        "$&")
        // Make the information popup also have other interesting info
        .replace(/(?<=renderInfoDisplayCanvas\(([^,) ]+).*?\) ?{)([^}]*?)`\${Math\.round\(\1\)}ms`/, "$2getExtraInfo($1)")
        // Wrap setting the exit zone handler
        .replace(/(?<=onExitZoneIntercept ?=) ?(.+?)(?=[,)};])/g, "wrapExitZone($1)")
        // Override sending movement to the network
        .replace(/(?=this\.networkClient\.sendMove)/, "networkMove()&&")
        // Override reading the object's action
        .replace(/([a-zA-Z0-9_]+)(\.action\.type),/, "checkApply($1)||$1$2,")
        // Add an action type that does nothing
        .replace(/(?=open_devlog_terminal:)/, ` everythings_fine: () => {}, `)
        // Add a UI element to quickly open devlogs
        .replace(/`[^`]+\/assets\/sprites\/ui\/bag\.svg[^`]+(?=`)/, `$&</div></div>
            <button style="display: block;" onclick="window.actions['open_devlog_terminal']()" class="\${${bagClasses}.bag}">
                <img class="\${${bagClasses}.bagIcon}" src=/images/devlogs.webp alt=Devlogs>
            </button>
        `+DEVMENU)
    + suff;
}
