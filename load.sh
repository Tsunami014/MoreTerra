#!/bin/sh

rm -rf extract
unzip $1 -d extract &>/dev/null

mv extract/shared/src/assets/manifest.json src/manif.json
rm -rf src/levels
mv extract/shared/src/levels/ src

rm -rf src/images/*
while read -r f; do
  mv "$f" src/images/"$(basename "$f")"
done < <(find extract/client -name "*.webp")

echo "Loaded in assets from requested file!"
