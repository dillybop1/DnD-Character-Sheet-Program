@echo off
setlocal

set "SCRIPT_DIR=%~dp0"

if exist "C:\BuildTools\Common7\Tools\VsDevCmd.bat" (
  set "VS_DEV_CMD=C:\BuildTools\Common7\Tools\VsDevCmd.bat"
)

if not defined VS_DEV_CMD if exist "%ProgramFiles%\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" (
  set "VS_DEV_CMD=%ProgramFiles%\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"
)

if not defined VS_DEV_CMD if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" (
  set "VS_DEV_CMD=%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"
)

if not defined VS_DEV_CMD (
  echo Could not find VsDevCmd.bat. Install Visual Studio 2022 Build Tools with the C++ workload first.
  exit /b 1
)

call "%VS_DEV_CMD%" -arch=x64 >nul
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

pushd "%SCRIPT_DIR%"
npm.cmd run tauri dev
set "EXIT_CODE=%ERRORLEVEL%"
popd

exit /b %EXIT_CODE%
