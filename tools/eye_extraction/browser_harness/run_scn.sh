#!/bin/sh
# usage: run_scn.sh scenario.js
(cd /home/claude/touchless-human-anatomy-explorer-Leap && python3 -m http.server 8765 >/dev/null 2>&1 & echo $! > /tmp/http.pid)
sleep 1
cd /home/claude/testenv && SCENARIO=$1 timeout ${2:-200} xvfb-run -a -s "-screen 0 1280x800x24" node_modules/.bin/electron --no-sandbox shot.js 2>&1 | grep -vE "dbus|libva|GLib|Gtk|ERROR:|deprecated|trace-warnings"
kill $(cat /tmp/http.pid) 2>/dev/null
