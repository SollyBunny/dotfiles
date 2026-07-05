#!/bin/sh

if ! command -v node >/dev/null 2>&1; then
	su -c "pacman -Sy --noconfirm nodejs"
fi

node --experimental-ffi ./run.mjs
