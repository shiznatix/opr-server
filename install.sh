#!/bin/bash

####
# Requirements:
# 1) Run as sudo
# 2) Have a user called pi
# 3) Have node > 6 installed
# 4) Have npm installed
####

if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

echo "Installing Omxplayer Remote - Server..."

cd "$(dirname "$0")"

echo "NPM install..."
sudo -u pi npm install

INIT_SCRIPT_TEMPLAT=`cat opr-server.template`
INIT_SCRIPT="${INIT_SCRIPT_TEMPLAT/\%INSTALL_PATH\%/$PWD}"

echo "Copy init script..."
echo "$INIT_SCRIPT" > "/etc/init.d/opr-server"
chmod +x /etc/init.d/opr-server

echo "Creating log file..."
mkdir -p /var/log/opr
touch /var/log/opr/server.log

echo "Installation complete!"