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
gpg --batch --yes --default-key xi72yow -abs -o Release.gpg Release
gpg --batch --yes --default-key xi72yow --clearsign -o InRelease Release

gpg --batch --yes --export --armor xi72yow > public.gpg

echo "APT repository updated in $REPO_DIR"
