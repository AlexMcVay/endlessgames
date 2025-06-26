@echo off
echo ================================================
echo Enhanced Dictionary API Setup for Windows
echo ================================================

echo.
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

echo Python found!

echo.
echo Creating virtual environment...
if exist .venv (
    echo Virtual environment already exists, removing old one...
    rmdir /s /q .venv
)
python -m venv .venv

echo.
echo Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Setting up database...
if exist dictionary.db (
    echo Existing database found. Do you want to rebuild it? (y/N)
    set /p choice="Enter choice: "
    if /i "%choice%"=="y" (
        del dictionary.db
        echo Old database removed.
    )
)

echo.
echo Choose setup option:
echo 1. Quick setup (basic word list, ~5000 words, 2-5 minutes)
echo 2. Standard setup (comprehensive word list, ~50000 words, 10-30 minutes)
echo 3. Full setup (with definitions from API, ~10000 definitions, 30-60 minutes)
echo 4. Custom setup
set /p setup_choice="Enter choice (1-4): "

if "%setup_choice%"=="1" (
    echo Running quick setup...
    python app.py
) else if "%setup_choice%"=="2" (
    echo Running standard setup...
    python comprehensive_setup.py --no-definitions --max-definitions 0
) else if "%setup_choice%"=="3" (
    echo Running full setup with API definitions...
    echo This will take longer as it fetches definitions from external APIs...
    python comprehensive_setup.py --max-definitions 10000
) else if "%setup_choice%"=="4" (
    echo Custom setup options:
    set /p max_defs="Maximum definitions to fetch (0 for none): "
    python comprehensive_setup.py --max-definitions %max_defs%
) else (
    echo Invalid choice, defaulting to quick setup...
    python app.py
)

echo.
echo ================================================
echo Setup completed successfully!
echo ================================================
echo.
echo To start the API server:
echo   1. Open Command Prompt in this directory
echo   2. Run: .venv\Scripts\activate.bat
echo   3. Run: python app.py
echo.
echo Or use the enhanced API:
echo   Run: python enhanced_api.py
echo.
echo The API will be available at: http://localhost:5000
echo.
echo For Java Spring Boot version:
echo   1. Navigate to java/ directory
echo   2. Run: mvn spring-boot:run
echo   3. API available at: http://localhost:8080
echo.
pause
