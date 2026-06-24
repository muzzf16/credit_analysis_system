#!/bin/bash
# Script: deploy-backend.sh
# Copy semua source code backend ke dalam container dan restart
# Gunakan ini setiap kali ada perubahan kode backend

CONTAINER="bpr_bapera_api"
SRC="/opt/credit_analysis_system/backend/src"

echo "📦 Copying backend source ke container $CONTAINER..."
docker cp "$SRC/." "$CONTAINER:/app/src/"

echo "🔄 Restarting container..."
docker restart "$CONTAINER"

echo "⏳ Menunggu container siap..."
sleep 5

echo "📋 Log terbaru:"
docker logs "$CONTAINER" --tail 10

echo "✅ Deploy selesai!"
