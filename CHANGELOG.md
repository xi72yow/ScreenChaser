# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/) and
[Conventional Commits](https://www.conventionalcommits.org/).

## [0.6.1] -- 2026-04-18

### Bug Fixes

- Export same gpg key that signs the apt release

### Documentation

- Replace em-dashes with neutral punctuation

## [0.6.0] -- 2026-04-18

### Bug Fixes

- Device reachability check, scan name sync, debounced config save
- Udp timeout, fps log level, scan saves initial device config
- Number input float support for buffer seconds and button clamping

### CI

- Use shell calls for git-cliff to fix empty version output
- Automate versioning and changelog with git-cliff

### Chore

- Track tray-icon and png in dependabot
- Bump the all-actions group with 6 updates
- Add frontend gitignore and lockfile

### Documentation

- Restore demo video in readme
- Rewrite readme for rust daemon

### Features

- Tray icon with window restore and clean shutdown
- Device enable/disable toggle in config modal
- Update all dependencies to latest versions
- Async capture init, status indicator, toast notifications
- Rust credo compliance, deb packaging, ci pipeline, bugfixes
- Webview window hide on close, external links open system browser
- Gpu downscale shader replaces cpu jpeg, fix icon rendering
- Live preview, configurable settings, custom led fields
- Replace electron ipc with websocket, add network scan

## [0.5.0] -- 2026-04-14

### Bug Fixes

- Fix left and right reverse in ledFieldGen
- Use schema min and max for number input
- Adjust stripe data
- Fix around setup chasing
- Open link in user browser
- Basic functionality after new repo structure
- Do not insert neoPixelCount as string in db
- Not open chaser window when not used
- Stop sending on running effect
- Video-chaser functionality on new db
- Debounce setConfig, adjust attributes for configs
- Avoid jumping in black bar detection
- Fix automatic scan on windows
- Save user view port for stripe-Creator
- Ci node version
- Fix build typos
- Fix input stripe on neopixel and device change
- Fix core typos
- Swatches random, hide color chooser on click
- Manager typo
- Save navbar open states, number input neopixelcount
- Fix rounding in re scale
- Stripe input after last update
- Restart static light after stop
- Adjust chasing for nano stripes, fix black bar detection on multiple chasers
- Stat calculator error on new devices at runtime
- Dying light color setting
- Base stripe on led count change
- Render on null error
- Do not start effect on chaser restart
- Blurry preview after reopen chaser tab, error preventing
- Exit app an main window close
- Zoom distance
- Lights off

### Chore

- Dev deps bump, webgpu processing setup, adjust device scanning
- Some cleanup, start device switch
- Add partial for api post data
- Update numberInput styles
- Robust path naming, start creating number input
- Hide modal by default
- Style modal component and add device creationButton
- Adjust modal component, refactor reusable import paths
- Adjust Logo theme reaction, refactor for reusable icon Button
- Commitment to CascadiaCode
- The way to lightweight screenchaser
- Bump deps
- Disable auto scan
- Small adjustments
- Change from video based to stream based approach
- Basic fps calculator
- Working assembly-script usage
- Start decay implement
- Migrate tabler icons to v2
- Adjust ui for new bias core
- Simple dashboard-card with responsive grid
- Basic but predictable speedometer
- Unlimited invite link for discord
- Remove unused modules, try victory speedometer
- Adjust readme
- Badges replacement in readme
- Add discord badge to readme
- Specify dev usage in app readme
- Update app readme
- Remove guards
- Basic manual device management
- Start rethink dashboard
- Replace yarn with pnpm, remove nextron, new esp8266 firmware (35fps)
- Adjustments for performance firmware
- Emitter for wled-firmware
- Add commands to root
- Update dashboard-data
- Wifi connection, udp tests
- Create new development environment
- Remove unused function
- Delete all databases
- Database migration only after v1.0.0, currently create new
- Hide old helper, 2 digits 0% at dashboard
- Fix build errors
- All functionality after db swap
- Prepare for multi configs
- Prepare inputs for auto forms, refactor for database management
- Start new data concept
- Update node version
- Data emitter returns calculated max power
- Experimental full config chaser ui
- Adjust types
- Next full config chasing rdy in back
- Fix black bar detection
- Make more chaser setups possible
- Add templates
- Adjust logo
- Logo Adjustments
- Add url for build virtual room
- Adjust gitignore
- Back to version from package.json
- Dev connection to virtual room
- OnEmit for Manager
- Add onEmit param to dataEmitter
- Add error boundary
- Hoist #1
- Hoisting
- Win ci node version
- Hoisting for ci
- Ci
- Adjust wording of ci tasks
- Export rgbtohex
- Show changed info stripe input
- Removed experimental stuff
- Copy sc-core before build
- Fix prop to build
- Use form state neopixelcount
- Save stripe creators work on ctrl+s
- Shuttle moving back and forward
- Start creating new effect
- Prepare for custom animation
- Depended base-stripe render on bouncing balls
- Some minor changes
- Some minor changes
- Start new base-stripe creator
- Delete useless informations
- Prepare version tagging with change log
- Multi chaser on multi windows running chaser visible on dashboard
- Logo color depends on color Scheme
- Now we can get an effect identifier
- Catch emit with no stripe data
- Updates

### Features

- Rust rewrite with wayland capture, gpu pipeline, wled output and webview
- Optimistic caching, live desktop stream, fix db loops
- Add ledfield Editor base
- Working webgpu processing
- Update pnpm lockfile, enhance icon button functionality, and improve scan device button behavior
- Implement error handling and LED field generation logic
- Adjust modal/input behavior
- Add prod scanNetwork behavior
- Add device scanning indicator
- Implement indexed-db sate management and device opener with restyling
- Watcher for electron code changes, dev setup complete
- Add wled connector
- New build process for light weight version
- Add dns service discovery to find wled devices
- Slide out for toasts, type and icon possible
- Label and helpertext, add validation
- Working web-assembly color decay with variable buffer
- New bias core
- Upgrade stripe creator usability
- Find video sources by name when id changed
- Multi config app
- Dynamic rendered task forms
- Check for new version on app start
- Update settings network-tab and overview -> exclude device
- Exclude devices
- Create relase.md file with checksums
- Load and check saved configuration
- Automatic releases with GitHub actions
- Screenchaser is now an official monorepo
- Custom animation
- Base stripe input preview (also rdy for animation)
- Config new bubbles effect
- New bubble effect
- Detect black bar at the bottom
- Use Engine for Base stripe Creator basics
- Refresh serial ports and send info to the user
- Easy WiFi settings
- Better meteor tail calculation
- Tail for balls effect
- Choose whole screen as chaser source
- New Global settings
- Effects Manager
- Window zoom on strg + scroll
- Lights off
- Crate dashboard

### Performance

- Video first, webgl powered chasing
- Chaser for video is ready
- Chasing in backgrund
- Debaunced manager

### Refactor

- Enhance code structure
- Adjust Manager, "neoPixelCount" in whole Project
- Use new core typos in app
- Full typos
- Types and cleanup
- Export random functions
- Add specific types
- Chaser hidden page
- Confirm hook
- Core is esm module
- Start, start-all for manager
- Use manager


