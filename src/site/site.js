/** Small enhancements for the generated pages. Everything works without this file. */

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("#site-nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("open");
      toggle.focus();
    }
  });
}

const list = document.querySelector(".project-list");
if (list) {
  const chosen = { status: "", category: "" };
  const cards = [...list.querySelectorAll(".project")];
  const count = document.querySelector("[data-count]");
  const empty = document.querySelector(".empty");

  const apply = () => {
    let shown = 0;
    for (const card of cards) {
      const match =
        (!chosen.status || card.dataset.status === chosen.status) &&
        (!chosen.category || card.dataset.category === chosen.category);
      card.hidden = !match;
      if (match) shown++;
    }
    count.textContent = String(shown);
    empty.hidden = shown > 0;
    const params = new URLSearchParams();
    if (chosen.status) params.set("status", chosen.status);
    if (chosen.category) params.set("category", chosen.category);
    const query = params.toString();
    history.replaceState(null, "", query ? `?${query}${location.hash}` : location.pathname + location.hash);
  };

  for (const group of document.querySelectorAll("[data-filter]")) {
    const key = group.dataset.filter;
    const chips = [...group.querySelectorAll(".chip")];
    const select = (value) => {
      chosen[key] = value;
      for (const chip of chips) chip.setAttribute("aria-pressed", String(chip.dataset.value === value));
    };
    for (const chip of chips) {
      chip.addEventListener("click", () => {
        select(chip.dataset.value);
        apply();
      });
    }
    const initial = new URLSearchParams(location.search).get(key);
    if (initial && chips.some((c) => c.dataset.value === initial)) select(initial);
  }
  if (chosen.status || chosen.category) apply();
}
