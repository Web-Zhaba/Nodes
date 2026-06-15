#!/bin/bash
FILE="/data/coolify/services/kj5hv5pp52zr6x55dwg31bb1/docker-compose.yml"
sed -i "s|'/usr/local/etc/auth/templates/confirm.html'|'file:///usr/local/etc/auth/templates/confirm.html'|g" "$FILE"
grep -i MAILER_TEMPLATES_CONFIRMATION "$FILE"
