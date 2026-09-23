#!/bin/sh
rm -rf dist

# All
OUT=$(cat src/_*.js)

# Firefox
mkdir -p dist/firefox
cp firefox/manifest.json dist/firefox
cat src/replace.js <(
        {
            echo 'const dataPref = `'
            cat src/gameUI.js src/gameScript.js
            echo '`;'
        }
    ) src/gameCanvas.js firefox/redirect.js > dist/firefox/redirect.js
echo "$OUT" > dist/firefox/out.js
cp -r src/images dist/firefox/images
cp src/portal.webp dist/firefox/images/portal.webp
cp -r src/levels dist/firefox/levels
cp src/manif.json dist/firefox/manif.json
echo "Built firefox extension at dist/firefox"
