@echo off
REM Backend only - run on host so DNS (Supabase) works when Docker backend fails
cd /d "%~dp0"
if not exist ".env" (
  echo .env not found. Copy from .env.example and set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  pause
  exit /b 1
)

REM Windows: py launcher or python
where py >nul 2>&1
if %errorlevel% equ 0 (
  py -m pip install -r requirements.txt
  py main.py
) else (
  python -m pip install -r requirements.txt
  python main.py
)
pause
