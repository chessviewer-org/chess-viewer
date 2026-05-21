#!/bin/bash
git add .
git commit -m "chore: Backup: $(date '+%d:%m:%Y %H:%M:%S')" --no-verify
git push backup develop --force
echo "Created Backup"
