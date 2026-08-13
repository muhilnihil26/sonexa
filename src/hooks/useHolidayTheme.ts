import { useEffect, useState } from "react";

export function useHolidayTheme() {
  const [theme, setTheme] = useState("");

  useEffect(() => {
    // Dynamic Event Sync (Holiday Mode)
    const now = new Date();
    const month = now.getMonth();
    const date = now.getDate();

    let newTheme = "";

    // August 13 - 16: Indian Independence Day (Saffron, White, Green)
    if (month === 7 && date >= 13 && date <= 16) {
      newTheme = "india";
    }

    // Example for future:
    // if (month === 11 && date >= 20 && date <= 26) { newTheme = "christmas"; }

    setTheme(newTheme);

    if (newTheme) {
      document.documentElement.setAttribute("data-theme", newTheme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  return theme;
}
