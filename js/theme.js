import { loadTheme, saveTheme } from "./storage.js";
import { $$ } from "./utils.js";
export function initTheme() {
  const apply = theme => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
    const icon = theme === "dark" ? "bx-sun" : "bx-moon";
    const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    const themeBtn = document.querySelector("#themeBtn");
    if (themeBtn) { themeBtn.innerHTML = `<i class="bx ${icon}"></i><span>${label}</span>`; }
    document.querySelector("#topThemeBtn").innerHTML = `<i class="bx ${icon}"></i>`;
    $$(".theme-choice").forEach(button => button.classList.toggle("active", button.dataset.setTheme === theme));
  };
  apply(loadTheme());
  const toggle = () => apply(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  document.querySelector("#themeBtn").addEventListener("click", toggle);
  document.querySelector("#topThemeBtn").addEventListener("click", toggle);
  $$(".theme-choice").forEach(button => button.addEventListener("click", () => apply(button.dataset.setTheme)));
}