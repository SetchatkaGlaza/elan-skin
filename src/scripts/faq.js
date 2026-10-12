/**
 * ÉLAN SKIN — модуль «faq».
 * FAQ-аккордеон: мышь, Enter/Space (нативные кнопки), стрелки, Home/End.
 */

export function initFaq() {
  const root = document.querySelector("[data-faq]");
  if (!root) return;

  const buttons = [...root.querySelectorAll(".faq__q")];

  const setOpen = (btn, open) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    // закрытый ответ не должен попадать в порядок табуляции
    if (open) panel.removeAttribute("inert");
    else panel.setAttribute("inert", "");
  };

  buttons.forEach((btn) => {
    setOpen(btn, false);
    btn.addEventListener("click", () => setOpen(btn, btn.getAttribute("aria-expanded") !== "true"));
  });

  root.addEventListener("keydown", (event) => {
    const current = buttons.indexOf(document.activeElement);
    if (current === -1) return;
    let next = null;
    if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
    else if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = buttons.length - 1;
    if (next !== null) {
      event.preventDefault();
      buttons[next].focus();
    }
  });
}
