/* =========================================
   PRIMETIME NEWS - PUBLIC THEME SWITCHER
   Runs only on public (non-admin) pages.
   ========================================= */
(function () {
    const STORAGE_KEY = "primetimePublicTheme";

    function getSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "dark" || saved === "light") return saved;

        try {
            const appearance = JSON.parse(localStorage.getItem("appearance"));
            if (appearance?.themeMode === "dark" || appearance?.themeMode === "light") {
                return appearance.themeMode;
            }
        } catch (_) {}

        return "light";
    }

    function applyTheme(theme) {
        const isDark = theme === "dark";
        document.documentElement.classList.toggle("dark-mode", isDark);
        document.documentElement.classList.toggle("light-mode", !isDark);

        if (document.body) {
            document.body.classList.toggle("dark-mode", isDark);
            document.body.classList.toggle("light-mode", !isDark);
        }

        const toggle = document.getElementById("publicThemeToggle");
        if (toggle) {
            toggle.innerHTML = isDark ? "☀️" : "🌙";
            toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
            toggle.setAttribute("title", isDark ? "Light Mode" : "Dark Mode");
        }
    }

    function createToggle() {
        if (document.getElementById("publicThemeToggle")) return;

        const button = document.createElement("button");
        button.id = "publicThemeToggle";
        button.className = "public-theme-toggle";
        button.type = "button";
        button.addEventListener("click", function () {
            const next = document.body.classList.contains("dark-mode") ? "light" : "dark";
            localStorage.setItem(STORAGE_KEY, next);
            applyTheme(next);
        });

        document.body.appendChild(button);
        applyTheme(getSavedTheme());
    }

    const initialTheme = getSavedTheme();
    document.documentElement.classList.toggle("dark-mode", initialTheme === "dark");
    document.documentElement.classList.toggle("light-mode", initialTheme !== "dark");

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            applyTheme(initialTheme);
            createToggle();
        });
    } else {
        applyTheme(initialTheme);
        createToggle();
    }
})();
