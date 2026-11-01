# Golden Arrow Odyssey

Golden Arrow Odyssey é um RPG de ação 2D em Canvas, com campanha, Saga, arquipélago, combate procedural, dungeons e versão Android offline. A rota web do jogo é `/odyssey`; o APK abre diretamente uma partida local.

## Conteúdo recente

- Os chefes têm cinco fases progressivas. O HP foi multiplicado por cinco; apenas contato e investida corpo a corpo causam dano triplicado, sem aplicar esse multiplicador a projéteis ou telegráficos.
- A Cidadela de Gehenna é um desafio pós-campanha com entrada física no extremo remoto do mundo. Ela se abre depois de derrotar Azrakel na Saga.
- A Cidadela tem 100 andares procedurais, dez alas temáticas, guardiões nos andares 10–90 e o Rei Demônio no trono do 100º. Há checkpoints a cada cinco andares e o melhor piso fica salvo separadamente do Abismo.
- Guardiões deixam Brasas de Gehenna, usadas para forjar o Gume do Trono. Azrakel entrega a Coroa Desperta e aciona um epílogo cinematográfico.
- A expansão usa artes pixel-art originais geradas por IA para o portão, sentinelas, relíquia, Azrakel e salão do trono.

## Desenvolvimento e validação

Requer Bun; o arquivo `bun.lock` fixa as dependências.

```sh
bun install --frozen-lockfile
bun run dev
```

Para executar a suíte e a verificação de tipos:

```sh
bun x vitest run
bun x tsc --noEmit
```

## APK Android offline

As instruções completas estão em [ANDROID.md](ANDROID.md). O empacotador inclui HTML, JavaScript, fontes, imagens, áudio, efeitos e os cem pisos gerados no aplicativo. O jogo não precisa acessar um site nem de permissão de Internet; a Activity inicia a rota local do jogo automaticamente. Como é um WebView empacotado, ele usa o WebView de sistema que já acompanha o Android.

No Linux, com Android SDK, build-tools, Gradle e JDK 21 configurados:

```sh
bash build-apk.sh
```

O APK de depuração aparece em `android/app/build/outputs/apk/debug/app-debug.apk`. O artefato debug é assinado com a chave de desenvolvimento do Android; para distribuição pública, configure a assinatura de release conforme o guia Android.
