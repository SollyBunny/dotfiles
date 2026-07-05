#!/bin/sh

command -v yay >/dev/null 2>&1 && exit

doas pacman --noconfirm -Sy git fakeroot debugedit
cd /tmp/
git clone --depth 1 https://aur.archlinux.org/yay-bin.git
cd /tmp/yay-bin/
makepkg
doas pacman -U yay-bin-*.pkg.tar.zst
rm -rf /tmp/yay-bin
