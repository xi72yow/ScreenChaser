# Electron with Next.js application

This app use Next.js inside an Electron application to avoid a lot of configuration, use Next.js router as view and use server-render to speed up the initial render of the application. Both Next.js and Electron layers are written in TypeScript and compiled to JavaScript during the build process.

| Part       | Source code (Typescript) | Builds (JavaScript) |
| ---------- | ------------------------ | ------------------- |
| Next.js    | `/next-src`              | `/renderer`         |
| Electron   | `/electron-src`          | `/main`             |
| Production |                          | `/dist`             |

For development it's going to run a HTTP server and let Next.js handle routing. In production it use `output: 'export'` to pre-generate HTML static files and use them in your app instead of running an HTTP server.

## How to develop

Run `bash pnpm dev` in this folder, or run `bash pnpm dev:app` at the projects root. Then an electron app opens, and you can develop in next-src folder with hot reload. When you change the code in the electron-src folder, you must rerun the command.

Available commands:

```bash
"clean": "rimraf dist main next-src/out next-src/.next",
"dev": "pnpm run build-electron && electron .",
"build-renderer": "next build next-src",
"build-electron": "tsc -p electron-src",
"build-steps": "pnpm run build-renderer && pnpm run build-electron",
"pack-app": "pnpm run build-steps && electron-builder --dir",
"build": "pnpm run build-steps && electron-builder",
"type-check": "tsc -p ./next-src/tsconfig.json && tsc -p ./electron-src/tsconfig.json"
```

## Notes

You can create the production app using `pnpm build:app` at the projects root. 

_note regarding types:_

- There were no types available for `electron-next` at the time of creating this example, so until they are available there is a file `electron-next.d.ts` in `electron-src` directory.
