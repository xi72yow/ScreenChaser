import "./variables.css";
import "./style.css";
import "./AppShell.css";
import "./Devices.css";

import "./ThemeToggle/index.ts";

import "./Logo/index.ts";

import Modal from "./core/modal/index.ts";

const modal = new Modal();

import logoFull from "/logo_full.svg";
import logoIcon from "/logo_icon.svg";
import { setupCounter } from "./counter.ts";

/* document.querySelector<HTMLDivElement>("#app")!.innerHTML =  `
  <div>
    <a href="https://vitejs.dev" target="_blank">
   sl-button-rc="${logsl-buttonull}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${logoIcon}" class="logo vanilla" alt="TypeScript logo" />
    </a>
            <button id="counter" type="button"></button>
          </div>
      <button id="counter" type="button" onclick="toggleTheme()"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
    <sl-icon name="github"></sl-icon>
    <sl-button>Button</sl-button>
  </div>
`; 

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!); */
