const portal = "9999999999999_portall"
const mtpth = "/moreterra/assets/"
const MANIF = {
    sprites: {
        /* Most of these are optional
        name: {
            path: mtpth+"file.webp"
            width: 1,
            height: 1,
            anchor: { x: ..., y: ... }, // The normalised (0-1) point in the image which is placed on the centre
            zOffset: 0,
            baseFade: false, // Fade the image at the base
            sway: false, // Make the asset sway when the user touches
            renderMode: "flat", // Only include if you want the object to lay flat on the floor instead of stand up
            colliders: [
                { // Rectangle collider if no type set
                    width: 1,
                    depth: 1,
                    offsetX: 0,
                    offsetY: 0,
                }, {
                    type: "cylinder",
                    radius: 1,
                    offsetX: 0,
                    offsetY: 0,
                }
            ],
        }
        */
        [portal]: {
            path: mtpth+"portal.webp",
            width: 0.8,
            height: 2.2,
            anchor: { x: 0.5, y: 0 },
        },
    }
}
