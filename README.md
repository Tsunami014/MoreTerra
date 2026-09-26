# MoreTerra
A browser extension to add more to Terra!

## Features
- **A whole new world to explore!**
- Hold ctrl to run as well as shift (stops from highlighting everything all the time)

### Dev features
- The popup on hold 'V' now has more info in it
- Press 'P' to print position info in the console
- Press 'T' to toggle a developer panel with very useful things in it!

## Extra info for developers
- Terra likes loading every level that exists on startup, so in the Network tab if you filter for 'json' you should be able to see all levels (and also some extras like the manifest)
    - Note that all the Terra image assets need to be prefixed with `assets/`
    - Also note that Terra ground tiles need to be in the format `assets/sprites/terrain/$$.webp` (meaning some images end up being suffixed with `.webp.webp`, funly enough)

## Building
Run `build.sh`

### Firefox
Go to `about:debugging#/runtime/this-firefox` and load the temporary addon of the `dist/firefox/manifest.json` (**MAKE SURE YOU ARE IN `dist/firefox` AND NOT `firefox/`**). I suggest pressing 'Inspect' for an easy window to refresh and see logs in.
