#!/usr/bin/env bash
#
# setup-mic-cancellation.sh
#
# Builds a PipeWire microphone chain:
#
#   hardware mic -> WebRTC echo canceller -> RNNoise -> "rnnoise_source"
#
# The echo canceller removes whatever is playing on your default output
# (speaker bleed) using that sink's monitor, and RNNoise removes steady
# background noise. The result is exposed as a virtual microphone.
#
# Files managed by this script (nothing else is touched):
#   ~/.config/pipewire/pipewire.conf.d/50-mic-echo-cancel.conf
#   ~/.config/pipewire/pipewire.conf.d/98-mic-tuning.conf
#   ~/.config/pipewire/pipewire.conf.d/99-mic-rnnoise.conf

set -euo pipefail

CONF_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/pipewire/pipewire.conf.d"
EC_CONF="$CONF_DIR/50-mic-echo-cancel.conf"
TUNE_CONF="$CONF_DIR/98-mic-tuning.conf"
RN_CONF="$CONF_DIR/99-mic-rnnoise.conf"

QUANTUM=512
DEVICE=""
DO_RESTART=1
ASSUME_YES=0
SOURCE_NAME="rnnoise_source"

die()  { printf 'error: %s\n' "$*" >&2; exit 1; }
info() { printf '\033[1;34m::\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }

usage() {
    cat <<'EOF'
Usage: setup-mic-cancellation.sh [options]

Options:
  -d, --device NAME   Use this source instead of showing the picker
  -q, --quantum N     PipeWire quantum (default 512; 256 = lower latency)
      --no-restart    Write the config but do not restart PipeWire
  -y, --yes           Restart without asking
  -h, --help          Show this help
EOF
}

run_root() {
    if (( EUID == 0 )); then
        "$@"
    else
        sudo "$@"
    fi
}

pkg_installed() {
    command -v pacman >/dev/null 2>&1 && pacman -Qq "$1" >/dev/null 2>&1
}

ensure_package() {
    local pkg=$1
    if pkg_installed "$pkg"; then
        return 0
    fi
    command -v pacman >/dev/null 2>&1 || {
        warn "cannot install '$pkg' automatically (pacman not found)"
        return 1
    }
    info "Installing $pkg"
    run_root pacman -S --needed --noconfirm "$pkg"
}

ensure_rtkit() {
    ensure_package rtkit || return 1

    if ! systemctl is-enabled --quiet rtkit-daemon 2>/dev/null; then
        info "Enabling rtkit-daemon"
        run_root systemctl enable rtkit-daemon
    fi
    if ! systemctl is-active --quiet rtkit-daemon 2>/dev/null; then
        info "Starting rtkit-daemon"
        run_root systemctl start rtkit-daemon
    fi
}

# Print "name<TAB>description" for each real capture device.
list_devices() {
    pactl list sources | awk '
        function wanted(n) {
            return n != "" &&
                   n !~ /\.monitor$/ &&
                   n != "source_ec" &&
                   n != "rnnoise_source" &&
                   n !~ /echo-cancel/
        }
        /^Source #/ {
            if (wanted(name)) print name "\t" desc
            name = ""
            desc = ""
            next
        }
        /^[[:space:]]*Name:/ {
            name = $2
        }
        /^[[:space:]]*Description:/ {
            desc = $0
            sub(/^[[:space:]]*Description:[[:space:]]*/, "", desc)
        }
        END {
            if (wanted(name)) print name "\t" desc
        }
    '
}

escape_config_value() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# ---------------------------------------------------------------- arguments

while (($#)); do
    case "$1" in
        -d|--device)
            (($# >= 2)) || die "$1 needs a value"
            DEVICE=$2
            shift 2
            ;;
        -q|--quantum)
            (($# >= 2)) || die "$1 needs a value"
            QUANTUM=$2
            shift 2
            ;;
        --no-restart)
            DO_RESTART=0
            shift
            ;;
        -y|--yes)
            ASSUME_YES=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            die "unknown option: $1 (try --help)"
            ;;
    esac
done

[[ $QUANTUM =~ ^[0-9]+$ ]] || die "quantum must be a number"
(( QUANTUM >= 32 && QUANTUM <= 8192 )) || die "quantum out of range (32-8192)"

command -v pactl >/dev/null 2>&1 || die "pactl not found (install pipewire-pulse)"
pactl info >/dev/null 2>&1 || die "PipeWire/PulseAudio is not running"
if (( EUID != 0 )) && ! command -v sudo >/dev/null 2>&1; then
    warn "sudo not found; package and rtkit service steps will be skipped"
fi

# ------------------------------------------------------ remove previous output

mkdir -p "$CONF_DIR"
for f in "$EC_CONF" "$TUNE_CONF" "$RN_CONF"; do
    rm -f -- "$f"
done

# ------------------------------------------------------------- device picker

mapfile -t SOURCE_LINES < <(list_devices)
((${#SOURCE_LINES[@]})) || die "no capture devices found"

NAMES=()
DESCS=()
for line in "${SOURCE_LINES[@]}"; do
    NAMES+=("${line%%$'\t'*}")
    if [[ $line == *$'\t'* ]]; then
        DESCS+=("${line#*$'\t'}")
    else
        DESCS+=("")
    fi
done

if [[ -n $DEVICE ]]; then
    found=0
    for name in "${NAMES[@]}"; do
        [[ $name == "$DEVICE" ]] && found=1
    done
    (( found )) || die "unknown device '$DEVICE'. Available: ${NAMES[*]}"
else
    [[ -t 0 ]] || die "no TTY for the picker; pass --device NAME"

    current=$(pactl get-default-source 2>/dev/null || true)
    default=1
    for i in "${!NAMES[@]}"; do
        [[ ${NAMES[i]} == "$current" ]] && default=$((i + 1))
    done

    printf '\nAvailable input devices:\n\n'
    for i in "${!NAMES[@]}"; do
        printf '  %2d) %s\n' "$((i + 1))" "${DESCS[i]:-${NAMES[i]}}"
        printf '      %s\n' "${NAMES[i]}"
    done
    printf '\n'

    while :; do
        read -r -p "Select microphone [1-${#NAMES[@]}] (default ${default}): " answer || exit 1
        answer=${answer:-$default}
        if [[ $answer =~ ^[0-9]+$ ]] && ((answer >= 1 && answer <= ${#NAMES[@]})); then
            DEVICE=${NAMES[answer - 1]}
            break
        fi
        printf 'Invalid selection.\n'
    done
fi

info "Selected microphone: $DEVICE"

# ------------------------------------------------------------ write new config

DEV_ESC=$(escape_config_value "$DEVICE")
MIN=$((QUANTUM < 128 ? QUANTUM : 128))
MAX=$((QUANTUM > 1024 ? QUANTUM : 1024))

cat >"$EC_CONF" <<EOF
# Generated by setup-mic-cancellation.sh - re-run the script instead of editing.
#
# Speaker-bleed echo cancellation. monitor.mode reads the default output's
# monitor as the reference, so playback is not rerouted.
context.modules = [
    { name = libpipewire-module-echo-cancel
        flags = [ nofail ]
        args = {
            monitor.mode = true
            capture.props = {
                node.name        = "ec_capture"
                node.description = "Echo-cancellation capture"
                media.name       = "Echo-cancellation capture"
                node.passive     = true
                target.object    = "$DEV_ESC"
            }
            source.props = {
                node.name        = "source_ec"
                node.description = "Mic (Echo Cancelled)"
                media.name       = "Mic (Echo Cancelled)"
            }
            aec.args = {
                webrtc.extended_filter       = false
                webrtc.noise_suppression     = false
                webrtc.transient_suppression = false
            }
        }
    }
]
EOF

cat >"$TUNE_CONF" <<EOF
# Generated by setup-mic-cancellation.sh - re-run the script instead of editing.
#
# quantum $QUANTUM @ 48 kHz = ~$((QUANTUM * 1000 / 48000)) ms of graph buffering.
context.properties = {
    default.clock.quantum     = $QUANTUM
    default.clock.min-quantum = $MIN
    default.clock.max-quantum = $MAX
}
EOF

cat >"$RN_CONF" <<EOF
# Generated by setup-mic-cancellation.sh - re-run the script instead of editing.
#
# Expects source_ec from 50-mic-echo-cancel.conf and exposes rnnoise_source.
context.modules = [
    { name = libpipewire-module-filter-chain
        flags = [ nofail ]
        args = {
            node.description = "Mic (Echo + Noise Cancelled)"
            media.name       = "Mic (Echo + Noise Cancelled)"
            filter.graph = {
                nodes = [
                    {
                        type   = ladspa
                        name   = rnnoise
                        plugin = "librnnoise_ladspa"
                        label  = noise_suppressor_mono
                        control = {
                            "VAD Threshold (%)" = 50.0
                        }
                    }
                ]
            }
            audio.position = [ MONO ]
            capture.props = {
                node.name     = "rnnoise.capture"
                node.passive  = true
                target.object = "source_ec"
            }
            playback.props = {
                node.name        = "$SOURCE_NAME"
                media.class      = "Audio/Source"
                node.description = "Mic (Echo + Noise Cancelled)"
            }
        }
    }
]
EOF

info "Wrote $EC_CONF"
info "Wrote $TUNE_CONF"
info "Wrote $RN_CONF"

# --------------------------------------------------------------- dependencies

ensure_package noise-suppression-for-voice ||
    warn "RNNoise plugin missing; the noise-suppression stage will not load"
ensure_rtkit || warn "rtkit unavailable; PipeWire will not use real-time scheduling"

# ------------------------------------------------------------------ apply

if (( DO_RESTART && !ASSUME_YES )); then
    read -r -p "Restart PipeWire now (brief audio interruption)? [Y/n]: " answer || answer=y
    case ${answer:-y} in
        [nN]*) DO_RESTART=0 ;;
    esac
fi

if (( DO_RESTART )); then
    units=()
    for unit in pipewire pipewire-pulse wireplumber; do
        if systemctl --user cat "$unit" >/dev/null 2>&1; then
            units+=("$unit")
        fi
    done
    if ((${#units[@]})); then
        info "Restarting ${units[*]}"
        systemctl --user restart "${units[@]}"
    fi

    # Give WirePlumber a moment to create the virtual source.
    for _ in {1..50}; do
        if pactl list short sources 2>/dev/null | awk '{print $2}' | grep -qx "$SOURCE_NAME"; then
            break
        fi
        sleep 0.1
    done

    if pactl list short sources 2>/dev/null | awk '{print $2}' | grep -qx "$SOURCE_NAME"; then
        pactl set-default-source "$SOURCE_NAME" ||
            warn "could not set default source to $SOURCE_NAME"
    else
        warn "$SOURCE_NAME did not appear; check: journalctl --user -u pipewire"
    fi
else
    info "Config written; restart PipeWire later to apply:"
    info "  systemctl --user restart pipewire pipewire-pulse wireplumber"
fi

# ---------------------------------------------------------------- summary

cat <<EOF

Microphone : $DEVICE
Chain      : mic -> echo cancel -> RNNoise -> $SOURCE_NAME
Default    : $(pactl get-default-source 2>/dev/null || echo "unknown")
Latency    : ~$((QUANTUM * 1000 / 48000)) ms graph buffer (quantum $QUANTUM)

Test it in a call or an echo test. The raw microphone is still selectable.
EOF
