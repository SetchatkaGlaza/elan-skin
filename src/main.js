/**
 * ÉLAN SKIN — точка входа лендинга.
 * Подключает модули интерфейса и запускает их после загрузки DOM.
 */

import { initNavigation } from "./scripts/navigation.js";
import { initCart } from "./scripts/cart.js";
import { initFaq } from "./scripts/faq.js";
import { initBuy } from "./scripts/buy.js";
import { initTextureVideo } from "./scripts/media.js";
import { initReveal, initParallax, initTilt } from "./scripts/animations.js";
import { initDialogs, initSubscribe } from "./scripts/ui.js";

/** Инициализация всех модулей страницы. Каждый модуль сам проверяет наличие своей разметки. */
function boot() {
  initNavigation();
  initDialogs();
  initCart();
  initBuy();
  initFaq();
  initTextureVideo();
  initSubscribe();
  initReveal();
  initParallax();
  initTilt();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
