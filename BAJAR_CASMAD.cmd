@echo off
setlocal
cd /d "%~dp0"

title CASMAD - BAJAR DE GITHUB

echo.
echo ==========================================
echo      CASMAD - BAJAR DE GITHUB
echo ==========================================
echo.

if exist "test-results" (
    git restore -- test-results >nul 2>&1
    git clean -fd test-results >nul 2>&1
)

echo [1/4] Comprobando cambios locales...

for /f "delims=" %%i in ('git status --porcelain') do (
    echo.
    echo ==========================================
    echo   ATENCION: HAY CAMBIOS LOCALES
    echo ==========================================
    echo.
    git status --short
    echo.
    echo Para proteger tu trabajo, BAJAR se detuvo.
    echo Si estos cambios son importantes, usa primero:
    echo.
    echo        SUBIR_CASMAD.cmd
    echo.
    pause
    exit /b 1
)

echo No hay cambios locales pendientes.
echo.

echo [2/4] Buscando la ultima version en GitHub...
git fetch origin
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo conectar con GitHub.
    pause
    exit /b 1
)

echo.
echo [3/4] Actualizando CASMAD...
git pull --ff-only origin main
if errorlevel 1 (
    echo.
    echo ERROR: No fue posible actualizar automaticamente.
    echo Puede existir un commit local pendiente de subir.
    pause
    exit /b 1
)

echo.
echo [4/4] Verificando dependencias...
call pnpm install
if errorlevel 1 (
    echo.
    echo ADVERTENCIA: El codigo se actualizo, pero pnpm install fallo.
    echo Revisa Node.js / pnpm.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   CASMAD ACTUALIZADO DESDE GITHUB
echo ==========================================
echo.
git status
echo.
echo Ahora puedes ejecutar:
echo.
echo        pnpm dev
echo.
pause
