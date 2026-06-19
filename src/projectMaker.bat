:: @fileoverview projectMaker.bat runs a node script that creates a project
@echo off
setlocal
:: %~d0  is the drive, %~p0  is the code's dir, %* are the parameters
echo running local version
:: echo %~d0%~p0 %*
node %~d0%~p0 %*
endlocal
