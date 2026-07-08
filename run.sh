#!/bin/sh

help() {
	echo "Usage: $0 -h [$(printf "%s\n" */run.mjs | xargs -n1 dirname | paste -sd "|")]"
	exit 1
}

if [[ $# -ne 0 && $# -ne 1 ]]; then
	help
fi

if ! command -v node >/dev/null 2>&1; then
	su -c "pacman -Sy --noconfirm nodejs"
fi

if [[ $# -eq 0 ]]; then
	node ./run.mjs
else
	if [[ -f "$1/run.mjs" ]]; then
		node "$1/run.mjs"
	else
		echo "Error: $1/run.mjs does not exist"
		help
	fi
fi
