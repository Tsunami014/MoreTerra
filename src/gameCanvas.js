function patchData(data) {
    var pref = "";

    // Safely copy the labels for your usage
    const lablsMatch = data.match(/[^{]+textBox:[^}]+/g);
    if (lablsMatch) {
        pref += "const LABLS = {" + lablsMatch.join(",").replace(/,\s*,/g, ",") + "};";
    } else {
        console.warn("[MoreTerra] Failed to match LABLS regex. The game code may have updated.");
    }

    // Copy the teleport function
    pref += "const tele = "+data.match(/(?<=onMessage\(.forceTeleport., *)([^{]+{(?:[^{}]+)})/)[0].replaceAll("this", "main") + ";"
    return pref + dataPref + data
        // Pick up the main class when networkClient is created
        .replace(/(?<=this\.networkClient ?= ?)/, "setMain(this)||")
        // Add a new keybind
        .replace(/(?<={)\s*(?=if ?\(([^=]+)===? ?.KeyF)/, "if ($1 === 'KeyP') { printPos() }")
        // Override berry and stuff display
        .replace(/(?<=> ?(\w+\.)(berries|acorns|stamps))/g, "+' ('+get_$2($1$2)+')'")
        .replace(/(\w+\.)(berries|acorns|stamps)(?=})/g, "$1$2+get_$2($1$2)+' '")
        // Allow ctrl to sprint as well as shift
        .replace(/(?<=([a-zA-Z0-9_.]+)\(.Shift([a-zA-Z]+).\))/, "||$1('Control$2')")
        // Wrap setting the exit zone handler
        .replace(/(?<=onExitZoneIntercept ?=) ?(.+?)(?=[,)};])/g, "wrapExitZone($1)")
        // Override sending movement to the network
        .replace(/(?=this\.networkClient\.sendMove)/, "networkMove()&&")
        // Override get nearby sprite to send out our sprites too
        .replace(/(getNearbySprite.+?\()(.+?)(?=\.action\.type\))/, "$1checkApply($2)||$2")
        // Override to add an object action that does nothing
        .replace(/(?=open_devlog_terminal:)/, ` everythings_fine: () => {}, `);
}
