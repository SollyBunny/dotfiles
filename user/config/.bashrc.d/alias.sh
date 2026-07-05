#!/bin/bash

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls="ls -lsha --color=auto"
alias grep="grep --color=auto --exclude-dir=.git"

complete -F _command doas
