import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

/** Абсолютный путь к HTML-странице проекта */
const page = (name) => fileURLToPath(new URL(`./${name}`, import.meta.url));

export default defineConfig({
  // "./" — сайт открывается и с корня домена, и из подпапки (например, на GitHub Pages)
  base: "./",
  build: {
    target: "es2020",
    // изображения и шрифты остаются отдельными файлами (кэшируются браузером)
    assetsInlineLimit: 0,
    rollupOptions: {
      // многостраничная сборка: лендинг + страницы-документы
      input: {
        main: page("index.html"),
        privacy: page("privacy.html"),
        terms: page("terms.html"),
        delivery: page("delivery.html"),
      },
    },
  },
});
