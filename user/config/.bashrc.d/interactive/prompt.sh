#!/bin/bash

rgbtohex() {
	local r g b
	IFS=';' read -r r g b <<<"$1"
	printf '#%02x%02x%02x\n' "$r" "$g" "$b"
}

export USER_COLOR_HEX="$(rgbtohex "$USER_COLOR")"

fastfetch() {
	command fastfetch --color "$USER_COLOR_HEX" "$@"
}

settitle() {
	printf "\e]0;%s\a" "$1"
}

escape() {
	printf "\[%s\]" "$1"
}

_git_prompt() {
	local branch added=0 deleted=0 entry

	branch="$(git symbolic-ref --quiet --short HEAD 2>/dev/null)" ||
		branch="$(git rev-parse --short HEAD 2>/dev/null)" || return

	while IFS=$'\t' read -r added_lines deleted_lines _; do
		[[ "$added_lines" =~ ^[0-9]+$ ]] && ((added += added_lines))
		[[ "$deleted_lines" =~ ^[0-9]+$ ]] && ((deleted += deleted_lines))
	done < <(GIT_OPTIONAL_LOCKS=0 git diff HEAD --numstat 2>/dev/null)

	while IFS= read -r entry; do
		[ -n "$entry" ] && ((added++))
	done < <(GIT_OPTIONAL_LOCKS=0 git ls-files --others --exclude-standard 2>/dev/null)

	if ((added > 0 && deleted > 0)); then
		printf '%s\tboth' "$branch"
	elif ((added > 0)); then
		printf '%s\tadd' "$branch"
	elif ((deleted > 0)); then
		printf '%s\tdel' "$branch"
	elif [ -n "$(GIT_OPTIONAL_LOCKS=0 git status --porcelain 2>/dev/null)" ]; then
		printf '%s\tboth' "$branch"
	else
		printf '%s\tclean' "$branch"
	fi
}

_set_prompt() {
	local last_status=$?
	local color dir pwd_display git_branch git_state git_mark git_mark_color
	local cmd_marker cmd_value
	local reset black white bold nobold user_bg cmd_bg pwd_bg git_bg
	local venv_dir venv_display venv_bg venv_fg

	color="${USER_COLOR:-255;255;255}"
	reset="$(escape $'\e[0m')"
	black="$(escape $'\e[30m')"
	white="$(escape $'\e[97m')"
	bold="$(escape $'\e[1m')"
	nobold="$(escape $'\e[22m')"
	user_bg="$(escape $'\e[48;2;'"$color"$'m')"
	cmd_bg="$(escape $'\e[46m')"
	pwd_bg="$(escape $'\e[43m')"
	git_bg="$(escape $'\e[40m')"
	venv_bg="$(escape $'\e[48;5;24m')"
	venv_fg="$(escape $'\e[38;5;226m')"

	dir="${PWD/#$HOME/\~}"
	pwd_display="${PWD//\\/\\\\}"
	pwd_display="${pwd_display//\$/\\\$}"
	pwd_display="${pwd_display//\`/\\\`}"
	pwd_display="${PWD//\//$bold\/$nobold}"
	cmd_marker="#"
	cmd_value='\#'
	if [ "$last_status" -ne 0 ] && [ "$last_status" -ne 127 ] && [ "$last_status" -ne 130 ]; then
		cmd_marker="!"
		cmd_value="$last_status"
	fi

	IFS=$'\t' read -r git_branch git_state <<<"$(_git_prompt)"

	settitle "${dir##*/} — $(whoami)@$(hostnamectl hostname)"

	PS1=""
	[ "$EUID" -eq 0 ] && PS1+=" "
	PS1+="${reset}${black}${cmd_bg} ${cmd_marker}${cmd_value} ${reset}"
	PS1+=" ${reset}${black}${user_bg} \u${bold}@${nobold}\h ${reset}"
	PS1+=" ${reset}${black}${pwd_bg} ${pwd_display} ${reset}"

	if [ -n "$VIRTUAL_ENV" ] && [ -d "$VIRTUAL_ENV" ]; then
	    venv_dir="$(realpath --relative-to="$PWD" "$VIRTUAL_ENV")"
	    venv_display="${venv_dir//\\/\\\\}"
	    venv_display="${venv_display//\$/\\\$}"
	    venv_display="${venv_display//\`/\\\`}"

	    PS1+=" ${reset}${venv_fg}${venv_bg}  ${venv_display} ${reset}"
	fi

	if [ -n "$git_branch" ]; then
		git_mark=""
		git_mark_color=""
		case "$git_state" in
		add)
			git_mark="*"
			git_mark_color="$(escape $'\e[92m')"
			;;
		del)
			git_mark="*"
			git_mark_color="$(escape $'\e[91m')"
			;;
		both)
			git_mark="*"
			git_mark_color="$(escape $'\e[38;5;208m')"
			;;
		esac

		PS1+=" ${reset}${white}${git_bg}  ${git_branch}${git_mark_color}${git_mark}${white} ${reset}"
	fi
	PS1+=$'\n'"${reset}${bold}> ${reset}"
}

_postexec() {
	if [ -n "$BASH_COMMAND" ]; then
		settitle "$BASH_COMMAND — $(whoami)@$(hostnamectl hostname)"
	fi
}

PROMPT_COMMAND="_set_prompt"

fastfetch -c ~/.config/fastfetch/small.jsonc

unset rgbtohex

if test -n "$KITTY_INSTALLATION_DIR"; then
	export KITTY_SHELL_INTEGRATION="enabled"
	source "$KITTY_INSTALLATION_DIR/shell-integration/bash/kitty.bash"
fi

trap _postexec DEBUG
