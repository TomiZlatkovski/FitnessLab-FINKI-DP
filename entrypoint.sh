#!/bin/sh
set -eu

mkdir -p /app/data /app/assets/coaches/uploads
chown -R node:node /app/data /app/assets/coaches/uploads

exec setpriv --reuid=node --regid=node --clear-groups "$@"
