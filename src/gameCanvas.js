function patchData(data) {
    // Load the labels with an external function
    const suff = ";const LABLS = " + data.match(/[a-zA-Z0-9_]+(?=\.textBox)/)

    // Copy the teleport function
    const pref = "const tele = "+data.match(/(?<=onMessage\(.forceTeleport., *)([^{]+{(?:[^{}]+)})/)[0].replaceAll("this", "main") + ";"

    return pref + dataPref + data
        // Pick up the main class when networkClient is created
        .replace(/(?<=this\.networkClient ?=)/, "setMain(this)||")
        // Add a new keybind
        .replace(/(?<={)\s*(?=if ?\(([^=]+)===? ?.KeyF)/, "if ($1 === 'KeyP') { printPos() }")
        // Allow ctrl to sprint as well as shift
        .replace(/(?<=([a-zA-Z0-9_.]+)\(.Shift([a-zA-Z]+).\))/, "||$1('Control$2')")
        // Wrap setting the exit zone handler
        .replace(/(?<=onExitZoneIntercept ?=) ?(.+?)(?=[,)};])/g, "wrapExitZone($1)")
        // Override sending movement to the network
        .replace(/(?=this\.networkClient\.sendMove)/, "networkMove()&&")
        // Override get nearby sprite to send out our sprites too
        .replace(/(?<=getNearbySprite\(\)\s?{\s*return )(.+?)(?=;|})/, "checkApply($1)||$1")
        // Override to add an object action that does nothing
        .replace(/(?=open_devlog_terminal:)/, ` everythings_fine: () => {}, `)
    + suff;
}
