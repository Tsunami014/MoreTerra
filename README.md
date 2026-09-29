# Terraformed
A client-side mod for [Terra](terra.hackclub.com)!

## Features
- **A whole new world to explore!** See the well behind the cidery to travel...
- Hopefully fixed shift to sprint to prevent it from selecting everything
- A convenient UI button to open the devlogs from anywhere

### Dev features
- The popup on hold 'V' now has more info in it
- Press 'P' to print info to the console, including the player position and level and all object types currently loaded
- Press 'M' to (attempt to, may need to press multiple times) sync your position if you are rubber banding all over the place
- Press 'T' to toggle a developer panel with some extremely useful features for testing, debugging, and creating new levels!
<!-- - There is a function in the console `travelTo` that can be used to travel to any level by ID. Be careful about which ones you need to prefix! -->

## Extra info for developers
- When fiddling around with new objects, it's best to load a testing level (or even just the current, to make it into a testing level) so server weirdness don't cause rubber banding issues.

- The "Show nearest object" switch also console logs what the nearest object is

- Terra likes loading every level that exists on startup, so in the Network tab if you filter for 'json' you should be able to see all levels (and also some extras like the manifest)
    - Note that all the Terra image assets need to be prefixed with `assets/`
    - Also note that Terra ground tiles need to be in the format `assets/sprites/terrain/$$.webp` (meaning some images end up being suffixed with `.webp.webp`, funly enough)

- Please note that the outlines for collisions is offset by the player's radius, and I'm not bothered to fix that.

## Building
Run `build.sh`

### Firefox
Go to `about:debugging#/runtime/this-firefox` and load the temporary addon of the `dist/firefox/manifest.json` (**MAKE SURE YOU ARE IN `dist/firefox` AND NOT `firefox/`**). I suggest pressing 'Inspect' for an easy window to refresh and see logs in.

## Publishing
Run `publish.sh` (**after building**), and the resultant files will be in `dist/pub/`
