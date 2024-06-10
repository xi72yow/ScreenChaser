import logo from "./logo_full.svg";

const logoElement = document.createElement("object");
logoElement.data = logo;

logoElement.classList.add("logo");

document.querySelector(".logo-icon")!.appendChild(logoElement);

// Listen for the "themeChange" event
document.addEventListener("themeChange", (event: any) => {
  const svgDoc = logoElement.contentDocument!;
  const theme = event.detail.state;

  if (theme === "dark") {
    svgDoc.querySelector("svg")!.setAttribute("fill", "#f8f8f2");
  } else {
    svgDoc.querySelector("svg")!.setAttribute("fill", "#21222c");
  }
});
