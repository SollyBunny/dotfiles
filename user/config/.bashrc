#
# ~/.bashrc
#

if [ -d "$HOME/.bashrc.d" ]; then
    for file in "$HOME/.bashrc.d"/*.sh; do
        [ -r "$file" ] && [ -f "$file" ] && source "$file"
    done
    if [[ $- == *i* ]] && [ -d "$HOME/.bashrc.d/interactive" ]; then
        for file in "$HOME/.bashrc.d/interactive"/*.sh; do
            [ -r "$file" ] && [ -f "$file" ] && source "$file"
        done
    fi
fi
