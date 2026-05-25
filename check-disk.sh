#!/bin/bash
echo "=== Disk Usage ==="
df -h / | grep /
echo ""
echo "=== Docker Usage ==="
docker system df
echo ""
echo "=== Coolify Backups ==="
du -sh /data/coolify/backups 2>/dev/null || echo "No backups found yet"
