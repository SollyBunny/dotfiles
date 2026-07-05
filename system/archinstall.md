## WiFi

```sh
iwctl station wlan0 get-networks
iwctl station wlan0 connect ...
```

## Format disk

```sh
parted /dev/sda
mklabel gpt
mkpart ESP fat32 1MiB 513MiB
set 1 esp on
mkpart primary 513MiB 100%
quit
```

```sh
cryptsetup luksFormat /dev/sda2
cryptsetup open /dev/sda2 diskcrypt
pgcreate /dev/mapper/diskcrypt
vgcreate diskvg /dev/mapper/diskcrypt
lvcreate -L 16G diskvg -n swap
lvcreate -l 100%FREE diskvg -n root
```

```sh
mkfs.fat -F32 /dev/sda1
mkswap /dev/diskvg/swap
mkfs.btrfs /dev/diskvg/root
```

## Filesystem

```sh
mount /dev/diskvg/root /mnt
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
umount /mnt
```

```sh
mount -o subvol=@ /dev/diskvg/root /mnt
mkdir -p /mnt/home /mnt/snapshots /mnt/boot/efi
mount -o subvol=@home /dev/diskvg/root /mnt/home
mount -o subvol=@snapshots /dev/diskvg/root /mnt/snapshots
mount /dev/sda1 /mnt/boot/efi
swapon /dev/diskvg/swap
```

## Pacstrap

```sh
pacstrap /mnt base linux-lts linux-firmware btrfs-progs lvm2 grub efibootmgr cryptsetup iw iwd nano doas micro htop
genfstab -L /mnt > /mnt/etc/fstab
arch-chroot /mnt
```

```sh
# doas.conf
permit keepenv persist :wheel
permit keepenv nopass nolog root
```

## Grub

In `/etc/default/grub`
```
GRUB_CMDLINE_LINUX="rd.luks.name=d93e264b-6223-4020-8bbd-cf165cbc5898=diskcrypt rd.luks.key=d93e264b-6223-4020-8bbd-cf165cbc5898=/etc/cryptsetup-keys.d/cryptlvm.key root=/dev/mapper/vg0-root"
GRUB_ENABLE_CRYPTODISK=y
```

```sh
grub-install --target=x86_64-efi --efi-directory=/boot/efi --removable
```

```sh
grub-mkconfig -o /boot/grub/grub.cfg
```

In `/etc/mkinitcpio.conf`
```
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt lvm2 filesystems fsck)
```

```sh
mkinitcpio -P
```

Install should now be bootable, ensure you have WiFi and valid passwords

## Users

```sh
usermod -aG wheel root
passwd
useradd <username> -m -G wheel -u 1000
passwd <username>
```

## Avoid entering password twice

https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#Avoiding_having_to_enter_the_passphrase_twice
https://wiki.archlinux.org/title/Dm-crypt/Device_encryption#With_a_keyfile_embedded_in_the_initramfs
```sh
dd bs=512 count=4 if=/dev/random iflag=fullblock | install -m 0600 /dev/stdin /etc/cryptsetup-keys.d/cryptlvm.key
cryptsetup -v luksAddKey /dev/sda2 /etc/cryptsetup-keys.d/cryptlvm.key
```

```
# /etc/mkinitcpio.conf
FILES=(/etc/cryptsetup-keys.d/cryptlvm.key)
```

```
# /etc/default/grub
GRUB_CMDLINE_LINUX="... cryptkey=rootfs:/etc/cryptsetup-keys.d/cryptlvm.key"
```

## SSH

```sh
pacman -S cloudflared lynx
```

```
# .ssh/config
Host *.sollybunny.xyz
    ProxyCommand /usr/bin/cloudflared access ssh --hostname %h
Host *.aureliakunekomp.xyz
    ProxyCommand /usr/bin/cloudflared access ssh --hostname %h
```

```sh
ssh-copy-id user@hostname
```

## Yay

```sh
doas pacman -S fakeroot debugedit
cd /tmp
git clone --depth 1 https://aur.archlinux.org/yay-bin.git
git clone --depth 1 https://aur.archlinux.org/doas-sudo-shim.git
cd yay-bin
makepkg
doas pacman -U *.pkg.tar.zst
cd ..
cd doas-sudo-shim
makepkg
doas pacman -U *.pkg.tar.zst
cd
rm /tmp/yay-bin /tmp/doas-sudo-shim -rf
```

## Useful programs

```sh
doas pacman -S htop nano micro git patch lynx fastfetch curl wget
doas pacman -S ddcutil usbutils
doas pacman -S less which
doas pacman -S zip unrar tar
doas pacman -S python nodejs npm pnpm
doas pacman -S clang base-devel
```

## Random stuff

```sh
doas timedatectl set-ntp true
doas hostnamectl hostname newhostname
```

## Window manager

```sh
doas pacman -S wireplumber pipewire pipewire-pulse pipewire-alsa pipewire-jack
doas pacman -S wev libnotify
doas pacman -S adw-gtk-theme nwg-look
```

```sh
yay -S mangowm noctalia-git noctalia-greeter-git greetd librewolf-bin python-pywalfox
systemctl enable greetd
```

```
# /etc/greetd/config.toml
command = "cage -s noctalia-greeter"
```
