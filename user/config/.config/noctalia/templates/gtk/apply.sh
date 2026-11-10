#!/usr/bin/env bash
set -euo pipefail

# Ensure the generated noctalia.css is imported and select the matching adw-gtk3
# variant. Mirrors the built-in GTK template's apply.sh for one toolkit at a time.
usage() {
    echo "Usage: apply.sh (gtk3|gtk4) (dark|light)" >&2
    exit 1
}

[ $# -eq 2 ] || usage
toolkit="$1"
mode="$2"

case "$toolkit" in
    gtk3) dir_name="gtk-3.0"; label="GTK3" ;;
    gtk4) dir_name="gtk-4.0"; label="GTK4" ;;
    *) usage ;;
esac
case "$mode" in
    dark|light) ;;
    *) usage ;;
esac

gtk_import='@import url("noctalia.css");'
config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/$dir_name"
gtk_css="$config_dir/gtk.css"
colors_file="$config_dir/noctalia.css"

theme_exists() {
    local name="$1"
    local -a paths=(
        "$HOME/.themes"
        "${XDG_DATA_HOME:-$HOME/.local/share}/themes"
        /usr/share/themes
        /usr/local/share/themes
    )
    if [ -n "${XDG_DATA_DIRS:-}" ]; then
        IFS=':' read -ra xdg_dirs <<< "$XDG_DATA_DIRS"
        for dir in "${xdg_dirs[@]}"; do
            [ -n "$dir" ] && paths+=("$dir/themes")
        done
    fi
    for base in "${paths[@]}"; do
        [ -d "$base/$name" ] && return 0
    done
    return 1
}

if [ ! -f "$colors_file" ]; then
    echo "Error: $label noctalia.css not found at $colors_file" >&2
    exit 1
fi

mkdir -p "$config_dir"

# noctalia.css imports the extension index. When the built-in GTK template is
# disabled nobody else creates it, so provide an empty index to keep the import valid.
if [ ! -e "$config_dir/noctalia-extensions.css" ]; then
    : > "$config_dir/noctalia-extensions.css"
fi

if [ -e "$gtk_css" ] || [ -L "$gtk_css" ]; then
    content=$(cat "$gtk_css")
    if [[ "$content" == *"noctalia.css"* ]] && [[ "$content" == *"@import"* ]]; then
        :
    else
        target="$gtk_css"
        if [ -L "$gtk_css" ]; then
            resolved=$(readlink -f "$gtk_css")
            if [ -w "$resolved" ]; then
                target="$resolved"
            else
                # Read-only symlink (e.g. NixOS): convert to a local file
                rm "$gtk_css"
            fi
        fi
        printf '%s\n\n%s\n' "$content" "$gtk_import" > "$target"
        echo "Appended $label noctalia.css import to gtk.css"
    fi
else
    printf '%s\n' "$gtk_import" > "$gtk_css"
    echo "Created $label gtk.css with noctalia.css import"
fi

target_theme="adw-gtk3-dark"
[ "$mode" = "light" ] && target_theme="adw-gtk3"

if ! theme_exists "$target_theme"; then
    echo "Theme '$target_theme' not found, skipping GTK theme set"
    exit 0
fi

if command -v gsettings >/dev/null \
        && [[ "$(gsettings list-schemas 2>/dev/null || true)" == *"org.gnome.desktop.interface"* ]]; then
    gsettings set org.gnome.desktop.interface gtk-theme "$target_theme" \
        || echo "Error running gsettings set gtk-theme" >&2
elif command -v dconf >/dev/null; then
    dconf write /org/gnome/desktop/interface/gtk-theme "'$target_theme'" \
        || echo "Error running dconf write gtk-theme" >&2
else
    echo "No gsettings or dconf found, skip GTK theme set"
fi
