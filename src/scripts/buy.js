/**
 * ÉLAN SKIN — модуль «buy».
 * Блок покупки: галерея, выбор комплектации, количество, добавление в корзину.
 */

import { addToCart } from "./cart.js";
import { formatPrice, prefersReducedMotion, toast } from "./ui.js";

const SIZES = { small: 640, large: 1254 };

/* ---------- Галерея ---------- */

function initGallery(root) {
  const main = root.querySelector("[data-gallery-main]");
  const thumbs = [...root.querySelectorAll(".thumb")];
  const prev = root.querySelector("[data-gallery-prev]");
  const next = root.querySelector("[data-gallery-next]");
  if (!main || !thumbs.length) return { show() {} };

  let current = Math.max(0, thumbs.findIndex((t) => t.classList.contains("is-active")));
  let swapTimer;

  const show = (index) => {
    const i = (index + thumbs.length) % thumbs.length;
    if (i === current) return;
    current = i;
    const thumb = thumbs[i];
    const name = thumb.dataset.name;

    thumbs.forEach((t, n) => {
      const active = n === i;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-pressed", String(active));
    });

    const apply = () => {
      main.src = `images/${name}-${SIZES.large}.webp`;
      main.srcset = `images/${name}-${SIZES.small}.webp ${SIZES.small}w, images/${name}-${SIZES.large}.webp ${SIZES.large}w`;
      main.alt = thumb.dataset.alt || "";
    };

    if (prefersReducedMotion()) {
      apply();
      return;
    }
    // плавная смена: гасим, меняем, показываем после загрузки
    clearTimeout(swapTimer);
    main.classList.add("is-swapping");
    swapTimer = setTimeout(() => {
      apply();
      const done = () => main.classList.remove("is-swapping");
      if (main.complete) done();
      else {
        main.addEventListener("load", done, { once: true });
        main.addEventListener("error", done, { once: true });
      }
    }, 220);
  };

  thumbs.forEach((t, i) => t.addEventListener("click", () => show(i)));
  prev?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => show(current + 1));

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    else if (event.key === "ArrowRight") show(current + 1);
  });

  return { show };
}

/* ---------- Анимация «улетающей» точки в корзину ---------- */

function flyToCart(fromEl) {
  if (prefersReducedMotion() || typeof Element.prototype.animate !== "function") return;
  const target = document.querySelector("[data-cart-open]");
  if (!target || !fromEl) return;

  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 14;
  const dot = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, {
    position: "fixed",
    zIndex: "1000",
    left: "0",
    top: "0",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    background: "var(--nude, #D9BFA5)",
    boxShadow: "0 0 0 4px rgba(217, 191, 165, 0.35)",
    pointerEvents: "none",
  });
  document.body.append(dot);

  const sx = a.left + a.width / 2 - size / 2;
  const sy = a.top + a.height / 2 - size / 2;
  const ex = b.left + b.width / 2 - size / 2;
  const ey = b.top + b.height / 2 - size / 2;
  const mx = (sx + ex) / 2;
  const my = Math.min(sy, ey) - 80;

  const anim = dot.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) scale(1)`, opacity: 1 },
      { transform: `translate(${mx}px, ${my}px) scale(1.2)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${ex}px, ${ey}px) scale(0.4)`, opacity: 0.2 },
    ],
    { duration: 750, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
  );
  anim.addEventListener("finish", () => dot.remove());
  anim.addEventListener("cancel", () => dot.remove());
}

/* ---------- Форма покупки ---------- */

export function initBuy() {
  const form = document.querySelector("[data-buy-form]");
  if (!form) return;

  const gallery = initGallery(document.querySelector("[data-gallery]") ?? document.body);
  const radios = [...form.querySelectorAll('input[name="variant"]')];
  const priceOut = form.querySelector("[data-price-output]");
  const qtyOut = form.querySelector("[data-qty-value]");
  const minus = form.querySelector("[data-qty-minus]");
  const plus = form.querySelector("[data-qty-plus]");
  const submit = form.querySelector("[data-add-to-cart]");
  const MAX = 10;
  let qty = 1;
  let addedTimer;

  const selected = () => radios.find((r) => r.checked) ?? radios[0];

  const refresh = () => {
    const unit = Number(selected().dataset.price);
    qtyOut.textContent = String(qty);
    priceOut.textContent = formatPrice(unit * qty);
    minus.disabled = qty <= 1;
    plus.disabled = qty >= MAX;
  };

  radios.forEach((r) =>
    r.addEventListener("change", () => {
      // фото в галерее соответствует выбранной комплектации
      const index = Number(r.dataset.galleryIndex);
      if (!Number.isNaN(index)) gallery.show(index);
      refresh();
    }),
  );

  minus.addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    refresh();
  });
  plus.addEventListener("click", () => {
    qty = Math.min(MAX, qty + 1);
    refresh();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const variant = selected();
    const ok = addToCart(variant.value, qty);
    if (!ok) {
      toast("Не удалось добавить товар. Попробуйте ещё раз.");
      return;
    }
    flyToCart(submit);
    toast(qty > 1 ? `Добавлено в корзину: ${qty} шт.` : "Товар добавлен в корзину");

    submit.classList.add("is-added");
    clearTimeout(addedTimer);
    addedTimer = setTimeout(() => submit.classList.remove("is-added"), 1600);

    qty = 1;
    refresh();
  });

  refresh();
}
