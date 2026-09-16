#!/bin/bash

export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

SSH_KEY_PATH="$HOME/.ssh/id_ed25519"

if [ ! -f "$SSH_KEY_PATH" ]; then
	ssh-keygen -t ed25519 -f "$SSH_KEY_PATH" -N ""
fi
