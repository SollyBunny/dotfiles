#!/bin/bash

case "$(hostnamectl hostname)" in
aureliapc)
	export USER_COLOR="221;221;255"
	;;
aureliaclunc)
	export USER_COLOR="255;255;128"
	;;
*)
	export USER_COLOR="255;255;255"
	;;
esac
