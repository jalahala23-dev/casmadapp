@echo off
setlocal
cd /d "%~dp0"

title CASMAD - SUBIR A GITHUB

echo.
echo ==========================================
echo      CASMAD - SUBIR A GITHUB
echo ==========================================
echo.

if exist "test-results" (
    git restore -- test-results >nul 2>&1
    git clean -fd test-results >nul 2>&1
)

echo [1/5] Revisando cambios...
git status --short
echo.

echo [2/5] Preparando archivos...
git add -A

git diff --cached --quiet
if %errorlevel%==0 (
    echo No hay cambios nuevos para guardar.
) else (
    echo [3/5] Creando commit...
    git commit -m "Sincronizacion automatica CASMAD"
    if errorlevel 1 (
        echo.
        echo ERROR: No se pudo crear el commit.
        echo Revisa el mensaje anterior.
        pause
        exit /b 1
    )
)

echo.
echo [4/5] Actualizando desde GitHub antes de subir...
git pull --rebase origin main
if errorlevel 1 (
    echo.
    echo ERROR: Git encontro un conflicto o no pudo actualizar.
    echo NO se hizo push.
    echo Revisa el mensaje anterior antes de continuar.
    pause
    exit /b 1
)

echo.
echo [5/5] Subiendo a GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo ERROR: No se pudo subir a GitHub.
    echo Revisa tu conexion o autenticacion.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   CASMAD GUARDADO EN GITHUB CORRECTAMENTE
echo ==========================================
echo.
git status
echo.
pause
