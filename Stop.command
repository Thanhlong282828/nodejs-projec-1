#!/bin/zsh
cd "${0:A:h}"
docker compose --profile full stop web app scheduler notifications
