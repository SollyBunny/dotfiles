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

## Random stuff

```sh
doas hostnamectl hostname newhostname
```

## CrypTab / FSTab

```
# /etc/fstab
/dev/mapper/diskvg-swap	none      	swap	defaults 0 0
/dev/mapper/diskvg-root	/         	btrfs	rw,relatime,ssd,space_cache=v2,subvol=/@,compress=zstd:3 0 0
/dev/mapper/diskvg-root	/home     	btrfs	rw,relatime,ssd,space_cache=v2,subvol=/@home,compress=zstd:3 0 0
/dev/mapper/diskvg-root	/snapshots	btrfs	rw,relatime,ssd,space_cache=v2,subvol=/@snapshots 0 0
# /dev/nvme0n1p1
UUID=F039-CA64			/boot/efi 	vfat	rw,relatime,fmask=0022,dmask=0022,codepage=437,iocharset=ascii,shortname=mixed,utf8,errors=remount-ro 0 2
```

```
# /etc/crypttab
datadisk UUID="1a1600c6-af53-4ffe-a309-21bd00220f87" /etc/datadisk.key nofail
```
