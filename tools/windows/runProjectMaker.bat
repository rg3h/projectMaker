:: @fileoverview runProjectMaker.bat runs a node script that creates a project
@echo off
setlocal

:: %~d0 is the drive and %~p0 is the code's directory
:: pushd works for UNC paths (\\server\...) where cd does not

:: pushd %~d0%~p0..\..\src
:: cmd /c node . %*
:: popd
cmd /c node ..\..\src\. %*

endlocal
