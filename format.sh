#!/bin/sh

npx prettier --write "**/*.{js,mjs,json,yml,yaml,toml,css}"
find . -type f -name '*.sh' -exec shfmt -w {} +
