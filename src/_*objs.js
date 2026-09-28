const MANIF = {
    sprites: {
        template: {
            path: "/tf/rock1.webp",
            width: 2,
            height: 1.5,
            anchor: { x: 0.5, y: 0 }, // The normalised (0-1) point in the image which is placed on the centre
            /* Optional:

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
            ],*/
        },
        portal: {
            path: "/tf/portal.webp",
            width: 0.8,
            height: 2.2,
            anchor: { x: 0.5, y: 0 },
        },

rock1: {
  path: "/tf/assets/rock1.webp",
  width: 2,
  height: 1.5,
  anchor: {
    x: 0.5,
    y: 0
  },
  colliders: [
    {
      type: "cylinder",
      radius: 0.5,
      offsetX: 0,
      offsetZ: -0.1
    }
  ]
},
rock2: {
  path: "/tf/assets/rock2.webp",
  width: 1.8,
  height: 1,
  anchor: {
    x: 0.5,
    y: 0
  },
  colliders: [
    {
      type: "cylinder",
      radius: 0.4,
      offsetX: 0,
      offsetZ: -0.1
    }
  ]
},
rock3: {
  path: "/tf/assets/rock3.webp",
  width: 1.8,
  height: 1,
  anchor: {
    x: 0.5,
    y: 0
  },
  colliders: [
    {
      type: "cylinder",
      radius: 0.4,
      offsetX: 0,
      offsetZ: -0.1
    }
  ]
},
rock4: {
  path: "/tf/assets/rock4.webp",
  width: 1.3,
  height: 0.8,
  anchor: {
    x: 0.5,
    y: 0
  },
  colliders: [
    {
      type: "cylinder",
      radius: 0.3,
      offsetX: 0,
      offsetZ: -0.1
    }
  ]
},
mystereeple: {
  path: "/tf/mystereeple.webp",
  width: 1.5,
  height: 2,
  anchor: {
    x: 0.5,
    y: 0
  }
},

    }
}
