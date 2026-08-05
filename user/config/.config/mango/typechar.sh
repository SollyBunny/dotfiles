#!/bin/sh

if [ $# -ne 2 ]; then
	echo "usage: $0 <lower> <upper>"
	exit 1
fi

keylower="$1"
keyupper="$2"
capslock=$(cat /sys/class/leds/*::capslock/brightness 2>/dev/null)

if [ "$capslock" = "1" ]; then
	key="$keyupper"
else
	key="$keylower"
fi

if [ "$key" == "NONE" ]; then
	exit 0
fi

exec wtype "$key"
