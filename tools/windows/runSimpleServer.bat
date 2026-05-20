:: @fileoverview runSimpleServer.bat runs a local node web server for public/
@echo off
clear
setlocal
color 1F

:: %~d0 is the drive and %~p0 is the code's directory
:: pushd works for UNC paths (\\server\...) where cd does not
pushd %~d0%~p0..\simpleServer

set NO_COLOR=1
cmd /k node . --webroot ../../public

endlocal
