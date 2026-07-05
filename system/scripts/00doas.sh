#!/bin/sh

if command -v doas >/dev/null 2>&1 && [ -f /etc/doas.conf ]; then
	exit
fi

echo -n "Root " && su -c "pacman -Sy opendoas"
doas install -D -C -p -v --backup=simple --mode=644 --group=root --owner=root ../config/etc/doas.conf /etc/doas.conf
