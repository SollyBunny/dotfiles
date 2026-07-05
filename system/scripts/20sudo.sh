#!/bin/sh

command -v sudo >/dev/null 2>&1 && exit

yay -S doas-sudo-shim
