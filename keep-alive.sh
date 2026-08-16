#!/bin/bash
# Persistent dev server monitor
cd /home/z/my-project

while true; do
  # Check if port 3000 is listening
  if ! ss -tlnp 2>/dev/null | grep -q ':3000 '; then
    # Kill any zombie processes
    fuser -k 3000/tcp 2>/dev/null
    sleep 2
    # Start fresh
    bun run dev >> /home/z/my-project/dev.log 2>&1 &
    echo "[$(date)] Restarted dev server (PID: $!)" >> /home/z/my-project/dev.log
    sleep 10
  fi
  sleep 15
done
