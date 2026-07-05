#!/bin/bash

case "$(hostnamectl hostname)" in
	aureliapc)
		export TERM_THEME_COLOR="221;221;255"
	;;
	aureliaclunc)
		export TERM_THEME_COLOR="255;255;128"
	;;
	*)
		export TERM_THEME_COLOR="255;255;255"
	;;
esac

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

rgbtohex() {
	local r g b
	IFS=';' read -r r g b <<< "$1"
	printf '#%02x%02x%02x\n' "$r" "$g" "$b"
}

export TERM_THEME_HEX="$(rgbtohex "$TERM_THEME_COLOR")"

fastfetch() {
	command fastfetch --color "$TERM_THEME_HEX" "$@"
}

settitle() {
	printf "\e]0;%s\a" "$1"
}

escape() {
	printf "\[%s\]" "$1"
}

_postexec() {
	if [ -n "$BASH_COMMAND" ]; then
		settitle "$BASH_COMMAND — $(whoami)@$(hostnamectl hostname)"
	fi
}

PS1=\
"$(escape $'$(settitle "\W — \u@\H")')"\
"$(escape $'\e[0m') "\
"$(escape $'\e[0;1m\e[38;2;0;0;0m\e[48;2;'${TERM_THEME_COLOR}'m') \u@\H \W "\
"$(escape $'\e[0;1m') \$ "\
"$(escape $'\e[0m')"

echo
fastfetch -c ~/.config/fastfetch/small.jsonc

unset escape
unset rgbtohex

if test -n "$KITTY_INSTALLATION_DIR"; then
	export KITTY_SHELL_INTEGRATION="enabled"
	source "$KITTY_INSTALLATION_DIR/shell-integration/bash/kitty.bash"
fi

trap _postexec DEBUG
