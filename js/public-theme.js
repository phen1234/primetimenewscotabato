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
            toggle.innerHTML = isDark
    ? `<svg viewBox="0 0 24 24" aria-hidden="true">
         <circle cx="12" cy="12" r="4"></circle>
         <path d="M12 2v2"></path>
         <path d="M12 20v2"></path>
         <path d="M4.93 4.93l1.41 1.41"></path>
         <path d="M17.66 17.66l1.41 1.41"></path>
         <path d="M2 12h2"></path>
         <path d="M20 12h2"></path>
         <path d="M4.93 19.07l1.41-1.41"></path>
         <path d="M17.66 6.34l1.41-1.41"></path>
       </svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true">
         <path d="M21 12.79A9 9 0 1 1 11.21 3
                  A7 7 0 0 0 21 12.79Z"></path>
       </svg>`;


           
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


// SEE MORE SA VIDEO DESCRIPTION
document.addEventListener('DOMContentLoaded', () => {
  const desc = document.getElementById('videoDescription');
  
  if (desc && desc.scrollHeight > 96) { // 96 dapat same sa max-height
    const btn = document.createElement('button');
    btn.classList.add('see-more-btn');
    btn.textContent = 'Basahin pa';
    
    btn.addEventListener('click', () => {
      desc.classList.toggle('expanded');
      btn.textContent = desc.classList.contains('expanded') ? 'Ipasara' : 'Basahin pa';
    });
    
    desc.after(btn); // Ilalagay yung button after ng description
  }
});
