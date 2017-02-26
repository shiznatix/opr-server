#!/bin/bash

####
# Requirements:
# 1) Run as sudo
####

if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

echo "Un-installing Omxplayer Remote - Server..."

echo "Stopping..."
service opr-server stop

echo "Removing from startup..."
update-rc.d -f opr-server remove

echo "Removing startup script..."
rm /etc/init.d/opr-server

echo "Removing logs..."
rm /var/log/opr/server.log

echo "Complete!"