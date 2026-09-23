#!/bin/sh
rm -rf dist

# Replace file
{
    echo "// Auto-generated"
    echo "const PATCH = {"
    gen() {
        echo "  $1: {"
        printf '  prefix: "%s", data: [\n' "$3/"
        for f in "$2"/*; do
            printf '    "%s",\n' "$(basename "$f")"
        done
        if [[ -v 4 ]]; then
            echo "]}}"
        else
            echo "  ]},"
        fi
    }
    gen IMGS src/images images
    gen LEVELS src/levels levels end

    echo "PATCH.IMGS.data.push('portal.webp')"
} > src/replace.js
echo "Generated replace file"

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
