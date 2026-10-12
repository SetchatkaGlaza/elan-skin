/**
 * ÉLAN SKIN — модуль «cart».
 * Демонстрационная корзина: состояние в localStorage, мини-корзина, счётчик в шапке.
 */

import { formatPrice, toast, openDialog, wireDialogLifecycle } from "./ui.js";

const STORAGE_KEY = "elan-skin:cart:v1";
const MAX_QTY = 10;

/** Каталог демонстрационных товаров */
export const CATALOG = {
  serum: {
    title: "Daily Hydration Serum",
    meta: "30 мл",
    price: 2490,
    image: "images/product-buy-640.webp",
  },
  gift: {
    title: "Daily Hydration Serum",
    meta: "30 мл · подарочная коробка",
    price: 2790,
    image: "images/packaging-640.webp",
  },
  set: {
    title: "Набор «Сыворотка + крем»",
    meta: "Концепт · 30 мл + 50 мл",
    price: 4990,
    image: "images/set-offer-640.webp",
  },
};

let items = []; // [{ id, qty }]
let els = {};
let lastTrigger = null;

/* ---------- Хранилище ---------- */

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it) => it && CATALOG[it.id] && Number.isInteger(it.qty) && it.qty > 0)
      .map((it) => ({ id: it.id, qty: Math.min(it.qty, MAX_QTY) }));
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* хранилище недоступно — корзина живёт до перезагрузки */
  }
}

/* ---------- Подсчёты ---------- */

const count = () => items.reduce((n, it) => n + it.qty, 0);
const total = () => items.reduce((sum, it) => sum + CATALOG[it.id].price * it.qty, 0);

/* ---------- Отрисовка ---------- */

function render(newId) {
  const n = count();

  // Счётчик в шапке
  els.count.textContent = String(n);
  els.count.hidden = n === 0;
  els.openBtn.setAttribute("aria-label", n ? `Открыть корзину. Товаров: ${n}` : "Открыть корзину. Корзина пуста");

  // Список
  els.empty.hidden = n > 0;
  els.checkout.disabled = n === 0;
  els.total.textContent = formatPrice(total());
  els.list.replaceChildren(
    ...items.map((it) => {
      const p = CATALOG[it.id];
      const li = document.createElement("li");
      li.className = "cart-item" + (it.id === newId ? " is-new" : "");
      li.dataset.id = it.id;
      li.innerHTML = `
        <img class="cart-item__img" src="${p.image}" alt="" width="76" height="76" />
        <div>
          <p class="cart-item__title"></p>
          <p class="cart-item__meta"></p>
        </div>
        <p class="cart-item__price">${formatPrice(p.price * it.qty)}</p>
        <div class="cart-item__controls">
          <div class="qty qty--sm" role="group" aria-label="Количество">
            <button class="qty__btn" type="button" data-act="minus" aria-label="Уменьшить количество"${it.qty <= 1 ? " disabled" : ""}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
            </button>
            <output class="qty__value">${it.qty}</output>
            <button class="qty__btn" type="button" data-act="plus" aria-label="Увеличить количество"${it.qty >= MAX_QTY ? " disabled" : ""}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          <button class="cart-item__remove" type="button" data-act="remove">Удалить</button>
        </div>`;
      // тексты вставляем через textContent
      li.querySelector(".cart-item__title").textContent = p.title;
      li.querySelector(".cart-item__meta").textContent = p.meta;
      li.querySelector(".cart-item__remove").setAttribute("aria-label", `Удалить из корзины: ${p.title}, ${p.meta}`);
      return li;
    }),
  );
}

function bump() {
  els.openBtn.classList.remove("is-bump");
  void els.openBtn.offsetWidth;
  els.openBtn.classList.add("is-bump");
}

/* ---------- Действия ---------- */

export function addToCart(id, qty = 1) {
  if (!CATALOG[id]) return false;
  const existing = items.find((it) => it.id === id);
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  else items.push({ id, qty: Math.min(MAX_QTY, qty) });
  save();
  render(id);
  bump();
  return true;
}

function changeQty(id, delta) {
  const it = items.find((x) => x.id === id);
  if (!it) return;
  it.qty = Math.min(MAX_QTY, Math.max(1, it.qty + delta));
  save();
  render();
  // возвращаем фокус на ту же кнопку после перерисовки
  const sel = `.cart-item[data-id="${id}"] [data-act="${delta > 0 ? "plus" : "minus"}"]`;
  const btn = els.list.querySelector(sel);
  if (btn && !btn.disabled) btn.focus();
  else els.list.querySelector(`.cart-item[data-id="${id}"] [data-act]:not(:disabled)`)?.focus();
}

function removeItem(id) {
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return;
  const title = `${CATALOG[id].title}, ${CATALOG[id].meta}`;
  items.splice(idx, 1);
  save();
  render();
  toast(`Удалено из корзины: ${title}`);
  // фокус на следующий элемент или на закрытие
  (els.list.querySelector("[data-act]:not(:disabled)") ?? els.close).focus();
}

export function openCart(trigger) {
  lastTrigger = trigger ?? document.activeElement;
  openDialog(els.dialog);
}

export function closeCart() {
  els.dialog.close();
}

/* ---------- Инициализация ---------- */

export function initCart() {
  els = {
    dialog: document.querySelector("[data-cart]"),
    openBtn: document.querySelector("[data-cart-open]"),
    close: document.querySelector("[data-cart-close]"),
    count: document.querySelector("[data-cart-count]"),
    list: document.querySelector("[data-cart-list]"),
    empty: document.querySelector("[data-cart-empty]"),
    total: document.querySelector("[data-cart-total]"),
    checkout: document.querySelector("[data-checkout]"),
  };
  if (!els.dialog) return;

  items = load();
  render();

  wireDialogLifecycle(els.dialog);
  els.dialog.addEventListener("close", () => lastTrigger?.focus?.());

  els.openBtn.addEventListener("click", () => openCart(els.openBtn));
  els.close.addEventListener("click", closeCart);

  els.list.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.closest(".cart-item").dataset.id;
    if (btn.dataset.act === "plus") changeQty(id, 1);
    else if (btn.dataset.act === "minus") changeQty(id, -1);
    else if (btn.dataset.act === "remove") removeItem(id);
  });

  els.checkout.addEventListener("click", () => {
    toast("Демо-режим: заказ не отправляется в реальный магазин.");
  });

  // Набор из секции «Дополнительное предложение»
  document.querySelector("[data-add-set]")?.addEventListener("click", (event) => {
    addToCart("set");
    toast("Набор добавлен в корзину");
    openCart(event.currentTarget);
  });

  // Синхронизация между вкладками
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      items = load();
      render();
    }
  });
}
