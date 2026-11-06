/* MarketHub prototype — small interactions only. No framework, no build step. */

(function () {
  const toast = document.getElementById("toast");
  let toastTimer = 0;
  let cartCount = 2;

  const vnd = (value) => Number(value).toLocaleString("vi-VN") + "₫";

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function syncCartCount() {
    document.querySelectorAll(".cart-count").forEach((node) => {
      if (node.closest(".panel__link")) return;
      node.textContent = String(cartCount);
    });
  }

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    if (add) {
      event.preventDefault();
      cartCount += 1;
      syncCartCount();
      showToast("Đã thêm “" + add.dataset.add + "” vào giỏ hàng.");
      return;
    }

    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton) {
      const wrapper = qtyButton.closest(".qty");
      const input = wrapper && wrapper.querySelector("input");
      if (!input) return;
      const min = Number(input.min || 1);
      const max = Number(input.max || 99);
      const next = Math.max(min, Math.min(max, Number(input.value || 1) + Number(qtyButton.dataset.qty)));
      input.value = String(next);
      return;
    }

    const swatch = event.target.closest(".swatch");
    if (swatch) {
      const group = swatch.parentElement;
      group.querySelectorAll(".swatch").forEach((button) => button.setAttribute("aria-pressed", "false"));
      swatch.setAttribute("aria-pressed", "true");
      const label = swatch.textContent.trim();
      const head = document.querySelector(".option-head span:last-child");
      if (head) head.textContent = label;
      const price = document.querySelector(".pdp-price");
      if (price && swatch.dataset.price) {
        price.firstChild.nodeValue = vnd(swatch.dataset.price) + " ";
      }
      return;
    }

    const thumb = event.target.closest(".gallery__thumb");
    if (thumb) {
      document.querySelectorAll(".gallery__thumb").forEach((button) => button.setAttribute("aria-current", "false"));
      thumb.setAttribute("aria-current", "true");
      const main = document.getElementById("gallery-main");
      if (main && thumb.dataset.img) main.src = thumb.dataset.img;
      return;
    }

    const remove = event.target.closest("[data-remove]");
    if (remove) {
      const line = remove.closest(".cart-line");
      if (line) {
        line.remove();
        cartCount = Math.max(0, cartCount - 1);
        syncCartCount();
        showToast("Đã xoá “" + remove.dataset.remove + "” khỏi giỏ hàng.");
      }
      return;
    }

  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-nav]");
    if (!form) return;
    event.preventDefault();
    window.location.href = form.dataset.nav;
  });

  document.querySelectorAll(".mobile-nav__panel a").forEach((link) => {
    link.addEventListener("click", () => {
      const details = link.closest("details");
      if (details) details.removeAttribute("open");
    });
  });
})();
