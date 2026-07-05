#!/bin/sh

if ! command -v node >/dev/null 2>&1; then
	su -c "pacman -Sy --noconfirm nodejs"
fi

if [ "$#" -gt 0 ]; then
	node "$@"
else
	node ./run.mjs
fi

