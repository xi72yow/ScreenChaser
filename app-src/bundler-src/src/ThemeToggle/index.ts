import moonIcon from "@core/icons/moon-stars.svg";
import sunIcon from "@core/icons/sun.svg";
import IconButton from "@core/IconButton";

document.documentElement.setAttribute("data-theme", "dark");

const darkIconColor = "#6272a4";
const lightIconColor = "#ffb86c";

export type ThemeChangeEventDetail = {
  state: "dark" | "light";
};

function toggleTheme() {
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  const currentState = document.documentElement.getAttribute("data-theme");
  const newState = currentState === "dark" ? "dark" : "light";

  const themeChangeEvent = new CustomEvent<ThemeChangeEventDetail>(
    "themeChange",
    {
      bubbles: true,
      cancelable: true,
      detail: {
        state: newState,
      },
    }
  );
  document.dispatchEvent(themeChangeEvent);
}

new IconButton({
  selector: ".app-footer",
  stateOneIcon: sunIcon,
  stateTwoIcon: moonIcon,
  stateOneStrokeColor: darkIconColor,
  stateTwoStrokeColor: lightIconColor,
  onClick: (state) => {
    toggleTheme();
  },
});
