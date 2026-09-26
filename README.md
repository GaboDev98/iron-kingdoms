# Reinos de Hierro

RPG medieval 3D en tercera persona ambientado en el Danelaw hacia el año 950. Hecho con [Three.js](https://threejs.org) y [Vite](https://vite.dev).

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior
- [Visual Studio Code](https://code.visualstudio.com) (o el IDE que prefieras)
- Git y una cuenta de GitHub

## Empezar a desarrollar

```bash
npm install
npm run dev
```

Abre la dirección que muestra la terminal (normalmente `http://localhost:5173`). Cada vez que guardes un archivo, el navegador se recarga solo. Para probar en tu celular, conéctalo a la misma red wifi y abre la dirección `Network` que aparece en la terminal.

## Estructura

| Archivo | Qué contiene |
|---|---|
| `index.html` | La interfaz: HUD, mochila, diálogos y pantalla inicial |
| `src/styles.css` | Estilos de la interfaz |
| `src/data.js` | Pueblos, objetos, misiones, enemigos y tienda. **Empieza aquí para añadir contenido** |
| `src/game.js` | Mundo 3D, personajes, combate, misiones, guardado y controles |
| `src/main.js` | Punto de entrada: carga fuentes, estilos y el juego |
| `electron/main.cjs` | Ventana de la app de escritorio |
| `capacitor.config.json` | Configuración de las apps Android e iOS |
| `.github/workflows/deploy.yml` | Publicación automática en GitHub Pages |

## Subirlo a GitHub

1. Crea un repositorio vacío en GitHub (sin README ni .gitignore), por ejemplo `reinos-de-hierro`.
2. En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "primera version del juego"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/reinos-de-hierro.git
git push -u origin main
```

## Publicar en distintas plataformas

### Web (GitHub Pages)

1. En tu repositorio, ve a **Settings → Pages** y en **Source** elige **GitHub Actions**.
2. Haz push a `main`. El flujo `deploy.yml` compila y publica el juego.
3. Quedará en `https://TU_USUARIO.github.io/reinos-de-hierro/`.

La carpeta `dist/` que genera `npm run build` también sirve para [itch.io](https://itch.io) (sube un zip de su contenido como juego HTML), Netlify o cualquier hosting estático.

### Android

Necesitas [Android Studio](https://developer.android.com/studio).

```bash
npx cap add android   # solo la primera vez
npm run android       # compila, sincroniza y abre Android Studio
```

Desde Android Studio ejecutas en un emulador o dispositivo, y generas el APK o AAB firmado para Google Play (**Build → Generate Signed Bundle / APK**).

### iOS

Necesitas una Mac con Xcode y una cuenta de Apple Developer para publicar.

```bash
npx cap add ios   # solo la primera vez
npm run ios       # compila, sincroniza y abre Xcode
```

### Escritorio (Windows, macOS, Linux)

```bash
npm run desktop         # abre el juego en una ventana de escritorio
npm run desktop:build   # genera el instalador en la carpeta release/
```

Cada sistema genera su propio instalador: en Windows sale un `.exe`, en macOS un `.dmg` y en Linux un `.AppImage`.

### Versión de un solo archivo

```bash
npm run build:single
```

Genera `dist-single/index.html`, con todo incluido en un único archivo. Es útil para compartirlo o volver a subirlo a Claude como artifact.

## Antes de publicar en tiendas

- Cambia `appId` (`com.reinosdehierro.juego`) en `capacitor.config.json` y en `package.json` por uno tuyo, por ejemplo `com.tunombre.reinosdehierro`. En Google Play y la App Store no se puede cambiar después de publicar.
- Añade íconos y pantallas de carga (para Android e iOS puedes usar `@capacitor/assets`).

## Guardado

La partida se guarda en el almacenamiento local de cada dispositivo o navegador. La sincronización con la cuenta de Claude solo funciona dentro del artifact de claude.ai; fuera de ahí el juego la ignora sin errores.

## Nota técnica

Three.js está fijado en la versión `0.128.0`, con la que el juego fue probado. Las versiones más nuevas cambian el cálculo de la iluminación: si actualizas, revisa la intensidad de las luces en `src/game.js`.
