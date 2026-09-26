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
file2const() {
    echo "const $1 = '$(sed -e 's/\\/\\\\/g' -e "s/'/\\\\'/g" "$2" | paste -sd' ' - | tr -s ' ')'"
}
OUT="$(file2const XTRACSS src/extra.css)
$(cat src/_*.js)"

# Firefox
mkdir -p dist/firefox
cp firefox/manifest.json dist/firefox
cat src/replace.js <(
    {
        echo 'const dataPref = `'
        cat src/gameUI.js src/gameScript.js
        echo '`;'
        file2const DEVMENU src/devMenu.html
    }
) src/gameCanvas.js firefox/redirect.js > dist/firefox/redirect.js
echo "$OUT" > dist/firefox/out.js
cp -r src/images dist/firefox/images
cp -r src/levels dist/firefox/levels
echo "Built firefox extension at dist/firefox"
