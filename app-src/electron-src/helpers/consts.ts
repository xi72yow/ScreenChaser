import isDev from "./is-dev";

const hostname = "localhost";
const port = 3000;
const showChaserWindowInProd = isDev;

export { hostname, port, showChaserWindowInProd };
