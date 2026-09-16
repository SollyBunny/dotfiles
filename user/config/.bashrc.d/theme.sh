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
