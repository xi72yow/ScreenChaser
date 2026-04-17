#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$SCRIPT_DIR/dist"
BUILD_IMAGE="localhost/screenchaser-build:latest"

echo "Building screenchaser in Podman container..."

podman build -t "$BUILD_IMAGE" -f "$SCRIPT_DIR/Containerfile.build" "$SCRIPT_DIR"

mkdir -p "$OUT_DIR"
CONTAINER_ID=$(podman create "$BUILD_IMAGE")
podman cp "$CONTAINER_ID:/build/target/debian/." "$OUT_DIR/"
podman rm "$CONTAINER_ID" > /dev/null

podman rmi "$BUILD_IMAGE" 2>/dev/null || true

DEB=$(ls "$OUT_DIR"/*.deb 2>/dev/null | head -1)
echo ""
echo "Done! -> $DEB"

if [ "$1" = "--install" ] || [ "$1" = "-i" ]; then
    echo "Installing..."
    sudo apt install --reinstall "$DEB"
else
    echo "Install with: sudo apt install --reinstall $DEB"
fi
