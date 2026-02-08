# Concia — APK Android (wrapper WebView)

Este repo es un **visor web** (React + Vite). Para verlo como app Android, incluí un wrapper mínimo en `android/` que sirve el build desde assets usando `https://appassets.androidplatform.net/` (WebViewAssetLoader) para evitar problemas con módulos ES en `file://`.

## Requisitos

- Android Studio instalado (incluye Android SDK + build tools).
- Un teléfono Android con “Opciones de desarrollador” + “Depuración USB” (opcional, si instalas por `adb`).

## Generar el APK (debug)

1) Build web para Android (base `./`) y sincroniza a assets:

```bash
npm run android:prepare
```

2) Construye el APK:

```bash
cd android
./gradlew assembleDebug
```

3) Ruta del APK:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Instalar en el móvil

Opción A (recomendada): desde Android Studio → Run (elige tu dispositivo).

Opción B (por terminal):

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Nota importante (rutas)

Como el wrapper corre en `appassets.androidplatform.net`, el visor usa **HashRouter** automáticamente. Es normal ver rutas tipo:

- `#/onboarding`
- `#/planes/elige`
- `#/sesion`
