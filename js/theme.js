// ==============================
// GLOBAL THEME
// ==============================

export function applyTheme(theme) {

    const isDark = theme === "dark";

    document.documentElement.classList.toggle(
        "dark-mode",
        isDark
    );

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    document.body.classList.toggle(
        "light-mode",
        !isDark
    );
}


// ==============================
// LOAD THEME
// ==============================

export function loadTheme() {

    let theme = "light";

    try {

        const savedAppearance =
            JSON.parse(
                localStorage.getItem("appearance")
            );

        if (
            savedAppearance &&
            (
                savedAppearance.themeMode === "dark" ||
                savedAppearance.themeMode === "light"
            )
        ) {

            theme =
                savedAppearance.themeMode;

        }

    } catch (error) {

        console.error(
            "Theme Load Error:",
            error
        );

    }

    applyTheme(theme);

    return theme;
}


// ==============================
// TOGGLE THEME
// ==============================

export function toggleTheme() {

    const currentTheme =
        document.body.classList.contains("dark-mode")
            ? "dark"
            : "light";

    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    applyTheme(newTheme);


    // Preserve existing appearance settings

    let appearance = {};

    try {

        appearance =
            JSON.parse(
                localStorage.getItem("appearance")
            ) || {};

    } catch (error) {

        appearance = {};

    }


    appearance.themeMode =
        newTheme;


    localStorage.setItem(
        "appearance",
        JSON.stringify(appearance)
    );

}