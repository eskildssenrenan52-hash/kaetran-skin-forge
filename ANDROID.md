# APK Android offline

O APK é uma casca Android nativa que inclui a distribuição estática completa do jogo em `android/app/src/main/assets/game/`. A activity abre `https://appassets.androidplatform.net/assets/game/index.html` por meio do `WebViewAssetLoader`; essa origem é servida somente a partir dos assets empacotados no próprio APK. Não há site hospedado, login, permissão de Internet ou aplicativo de terceiros necessário para iniciar e jogar. O Android fornece o WebView do sistema.

Ao abrir o app, ele inicia uma campanha ou retoma o save local automaticamente. O site continua mantendo seu menu inicial normal. O progresso fica no armazenamento local privado do app; desinstalar o APK apaga esses saves.

## Requisitos de build

- Bun e dependências fixadas em `bun.lock` (`bun install --frozen-lockfile`).
- JDK completo 17 ou superior, com `javac` e `jlink` (um JRE sozinho não basta).
- Android SDK Platform 35 e Build Tools 35.
- Gradle compatível com o Android Gradle Plugin do projeto (o build deste repositório usa Gradle 8.9).
- Configure `JAVA_HOME` e `ANDROID_HOME`/`ANDROID_SDK_ROOT`.

A configuração inicial pode baixar dependências de build; isso não cria dependência de rede no jogo instalado.

## Gerar o APK debug

Na raiz do repositório, execute `./build-apk.sh` (Linux/macOS com Bash) ou `build-apk.bat` (Windows com Bun, Bash e Gradle). O wrapper executa `scripts/package-android-offline.sh`, que cria um bundle Vite cliente independente de SSR, copia a tela de jogo, CSS, JavaScript e assets locais para `android/app/src/main/assets/game/`, e compila o app nativo.

Alternativamente:

```bash
bun install --frozen-lockfile
bun run apk
```

Saída: `android/app/build/outputs/apk/debug/app-debug.apk`. Esse APK é assinado com a chave debug para testes; distribuição de loja requer assinatura release própria.

## Verificação

Execute `bun run test` e `bun x tsc --noEmit` para validar lógica e tipos. `bash scripts/package-android-offline.sh` também confere a entrada estática e o atlas FX de 80 animações × 5 quadros. Abra o APK em um Android/emulador com rede desligada para a validação final no dispositivo.
