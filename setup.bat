@echo off
echo ===================================================
echo Auto-Editor GUI - Setup and Installation Script
echo ===================================================
echo.

echo Checking for existing installations...

echo [1/5] Creating output folder...
if exist "output" (
    echo Output folder already exists. Skipping creation.
) else (
    node create-folder.js
    if %ERRORLEVEL% NEQ 0 (
        echo Error creating output folder. Please check permissions.
        pause
        exit /b 1
    )
)

echo [2/5] Installing Python dependencies...
echo This may take a few minutes. If it appears to be stuck, press Ctrl+C to skip.
echo.

REM Set a timeout for the pip install command (5 minutes)
set TIMEOUT=300

REM Check if auto-editor is already installed
pip show auto-editor >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Auto-Editor is already installed. Skipping Python dependencies installation.
) else (
    REM Start the pip install with a timeout
    timeout /t %TIMEOUT% /nobreak > nul 2>&1 & pip install -e . & if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Warning: Python dependencies installation timed out or failed.
        echo You may need to manually install auto-editor using: pip install -e .
        echo Continuing with setup...
        echo.
    )
)

echo [3/5] Installing root directory Node.js dependencies...
if exist "node_modules" (
    echo Root Node.js dependencies already installed. Skipping installation.
) else (
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error installing Node.js dependencies. Please make sure Node.js is installed.
        pause
        exit /b 1
    )
)

echo [4/5] Installing frontend Node.js dependencies...
cd frontend
if exist "node_modules" (
    echo Frontend Node.js dependencies already installed. Skipping installation.
) else (
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error installing frontend dependencies.
        cd ..
        pause
        exit /b 1
    )
)
cd ..

echo [5/5] Building TypeScript files...
if exist "dist" (
    echo TypeScript files already built. Skipping build step.
) else (
    npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo Error building TypeScript files.
        pause
        exit /b 1
    )
)

echo.
echo ===================================================
echo Installation completed successfully!
echo ===================================================
echo.
echo To start the application:
echo 1. Run start.bat to launch the application directly
echo    OR
echo 2. Open two command prompts
echo 3. In the first one, run: cd frontend ^&^& npm run dev
echo 4. In the second one, run: npm run start
echo.
echo Enjoy using Auto-Editor GUI!
echo.
echo Would you like to start the application now? (Y/N)
set /p START_NOW=
if /i "%START_NOW%"=="Y" (
    call start.bat
    exit /b 0
) else (
    pause
)