# APK offline com Bun

## Requisitos

- Bun (dependências fixadas em `bun.lock`).
- JDK completo 17 ou superior, incluindo `javac` e `jlink`.
- Android SDK Platform 35 e Build Tools 35.
- Gradle compatível com o Android Gradle Plugin (este repositório usa Gradle 8.9) ou Android Studio atual.
- `JAVA_HOME` e `ANDROID_HOME`/`ANDROID_SDK_ROOT` configurados.

## Linux/macOS

```bash
bun install --frozen-lockfile
./build-apk.sh
```

O wrapper executa `scripts/package-android-offline.sh`, que gera um bundle Vite cliente, estático e independente do servidor SSR, e copia HTML, JavaScript, CSS, FX e demais assets locais para `android/app/src/main/assets/game/`. Em seguida, Gradle compila o APK debug.

## Windows

Execute `build-apk.bat` com Bun, Bash (Git Bash ou WSL), Gradle e Android SDK disponíveis. Alternativamente, rode `bash scripts/package-android-offline.sh` na raiz e abra `android/` no Android Studio.

## Saída e execução

O arquivo é `android/app/build/outputs/apk/debug/app-debug.apk`. A activity abre o conteúdo empacotado no próprio APK, inicia ou retoma uma jornada automaticamente e não precisa de site, login, Internet ou outro app instalado. Os saves ficam no armazenamento local privado. A primeira compilação ainda pode baixar dependências de build; use assinatura release própria para distribuição fora de testes.
