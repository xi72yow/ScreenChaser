import "./Button.css";
import moonIcon from "./icons/moon-stars.svg";
import sunIcon from "./icons/sun.svg";

document.documentElement.setAttribute("data-theme", "dark");

const darkIconColor = "#6272a4";
const lightIconColor = "#ffb86c";

const iconButton = document.createElement("button");

iconButton.classList.add("theme-toggle");

const svg = document.createElement("object");
svg.style.pointerEvents = "none";
svg.type = "image/svg+xml";
svg.data = sunIcon;
svg.classList.add("icon");
iconButton.appendChild(svg);

svg.addEventListener("load", () => {
  const svgDoc = svg.contentDocument!;
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    svgDoc.querySelector("svg")!.setAttribute("stroke", lightIconColor);
    return;
  }
  svgDoc.querySelector("svg")!.setAttribute("stroke", darkIconColor);
});

function toggleTheme() {
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
    svg.data = moonIcon;
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    svg.data = sunIcon;
  }
}

iconButton.addEventListener("click", () => {
  toggleTheme();
});

document.body.querySelector(".app-footer")!.appendChild(iconButton);
