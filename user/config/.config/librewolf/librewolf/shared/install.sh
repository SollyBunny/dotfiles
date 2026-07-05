#!/bin/bash

# Run this after making a new profile

set -euo pipefail

grep '^Path=' ../profiles.ini |
cut -d= -f2 |
while IFS= read -r profile; do
    profile_dir="../$profile"

    rm -rf -- "$profile_dir/chrome" "$profile_dir/extensions" "$profile_dir/user.js"

    ln -s -- ../shared/chrome "$profile_dir/chrome"
    ln -s -- ../shared/extensions "$profile_dir/extensions"
    ln -s -- ../shared/user.js "$profile_dir/user.js"
done
