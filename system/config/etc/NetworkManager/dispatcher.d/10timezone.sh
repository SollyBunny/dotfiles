#!/bin/sh

IFACE="$1"
ACTION="$2"

case "$ACTION" in
    up)
        # skip common VPN interfaces
        case "$IFACE" in
            tun*|tap*|wg*)
                exit 0
                ;;
        esac

		TIMEZONE="$(curl --fail --silent --max-time 5 https://ipapi.co/timezone)"
		STATUS=$?

		if [ $STATUS -ne 0 ]; then
		    echo "curl failed with status $STATUS"
		    exit 1
		fi

		if [ -n "$TIMEZONE" ]; then
		    timedatectl set-timezone "$TIMEZONE"
		    echo "Set timezone to $TIMEZONE"
		fi
        
    ;;
esac
