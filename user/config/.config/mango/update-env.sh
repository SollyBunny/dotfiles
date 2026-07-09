#!/usr/bin/env bash

set -euo pipefail

notify-send "Reloaded MangoWM config"

cd "$(dirname "$0")"

formatted_env=$(
	env -i HOME="$HOME" bash -l -c "env" | grep -vE '^(PWD|SHLVL|_)=' | while IFS='=' read -r key value; do
		printf 'env=%s,%s\n' "$key" "$value"
	done
)

if [[ -f env.conf ]] && cmp -s <(printf '%s\n' "$formatted_env") env.conf; then
	exit 0
fi

printf '%s\n' "$formatted_env" > env.conf

mmsg dispatch reload_config & disown
notify-send "Reloaded MangoWM env"
