#!/bin/bash
set -e

REPO_URL="https://xi72yow.github.io/ScreenChaser"
KEYRING="/usr/share/keyrings/screenchaser-archive-keyring.gpg"

echo "Installing ScreenChaser..."

curl -fsSL "$REPO_URL/public.gpg" | gpg --dearmor -o "$KEYRING"

echo "deb [signed-by=$KEYRING] $REPO_URL ./" > /etc/apt/sources.list.d/screenchaser.list

apt-get update
apt-get install -y screenchaser-daemon

echo "ScreenChaser installed."
echo "Start with: screenchaser-daemon"
echo "Or enable the user service: systemctl --user enable --now screenchaser"
