#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
command -v bun >/dev/null || { echo "Erro: Bun não encontrado."; exit 1; }
command -v gradle >/dev/null || { echo "Erro: Gradle não encontrado. Instale Android SDK/Gradle ou use Android Studio."; exit 1; }
bun install --frozen-lockfile
bun run apk
echo "APK offline criado em: android/app/build/outputs/apk/debug/app-debug.apk"
