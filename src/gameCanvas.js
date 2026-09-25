function patchData(data) {
    // Load the labels with an external function
    const suff = ";const LABLS = " + data.match(/[a-zA-Z0-9_]+(?=\.textBox)/)

    // Copy the teleport function
    const pref = "const tele = "+data.match(/(?<=onMessage\(.forceTeleport., *)([^{]+{(?:[^{}]+)})/)[0].replaceAll("this", "main") + ";"

    return pref + dataPref + data
        // Pick up the main class when networkClient is created
        .replace(/(?<=this\.networkClient ?=)/, "setMain(this)||")
        // Make ctrl keys also sprint, and added a P keybind
        .replace(/(?<=,\s*sprint: ?\[)([^\]]+\]),?/, "`ControlLeft`,`ControlRight`,$1,mm_printpos:[`KeyP`],")
        // Implement handler for P keybind
        .replace(/if ?\(([a-zA-Z0-9]+\()(.interact.,?)([^)]*)/, "if ($1`mm_printpos`,$3)){printPos()}$&")
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
    + suff;
}
