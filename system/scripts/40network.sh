#!/bin/sh

sudo pacman -S iw iwd --noconfirm
sudo systemctl enable --now iw

sudo pacman -S networkmanager --noconfirm
sudo systemctl enable --now NetworkManager

sudo ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
sudo systemctl enable --now systemd-resolved
sudo systemctl enable --now systemd-networkd
