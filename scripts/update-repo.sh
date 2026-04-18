#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$SCRIPT_DIR/../repo"
PACKAGES_DIR="$SCRIPT_DIR/../packages"

mkdir -p "$REPO_DIR"

cp "$PACKAGES_DIR"/*.deb "$REPO_DIR/"

cd "$REPO_DIR"
dpkg-scanpackages --multiversion . /dev/null | gzip -9c > Packages.gz
dpkg-scanpackages --multiversion . /dev/null > Packages

apt-ftparchive release . > Release

GPG_KEY_ID=$(gpg --list-secret-keys --keyid-format long 2>/dev/null | grep sec | head -1 | awk '{print $2}' | cut -d'/' -f2)

if [ -z "${GPG_KEY_ID}" ]; then
    echo "Error: No GPG secret key found"
    exit 1
fi

gpg --batch --yes --default-key "${GPG_KEY_ID}" -abs -o Release.gpg Release
gpg --batch --yes --default-key "${GPG_KEY_ID}" --clearsign -o InRelease Release

gpg --batch --yes --export --armor "${GPG_KEY_ID}" > public.gpg

cp "$SCRIPT_DIR/install.sh" "$REPO_DIR/"

echo "APT repository updated in $REPO_DIR"
