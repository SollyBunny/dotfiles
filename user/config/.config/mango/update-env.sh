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

for pid in $(pgrep -x noctalia); do
	if tr '\0' '\n' < /proc/$pid/environ 2>/dev/null | grep -q "WAYLAND_DISPLAY=$WAYLAND_DISPLAY"; then
		kill "$pid"
	fi
done

setsid noctalia &

sleep 1

notify-send "Reloaded MangoWM env / Restarted noctalia"
