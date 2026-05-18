:: @fileoverview runSimpleServer.bat runs a local node web server for public/
@echo off
clear
setlocal
cd ..
start "simpleServer" cmd /t:1f /k "set NO_COLOR=1 && node ./simpleServer/simpleServer.js --webroot ../public/"
endlocal
