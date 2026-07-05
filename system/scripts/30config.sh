#!/bin/sh

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd $SCRIPT_DIR/../config && find . -type f -exec sudo install -D -C -p -v --backup=simple --mode=644 --group=root --owner=root '{}' '/{}' \;
