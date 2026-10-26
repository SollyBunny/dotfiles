# Browser scripts

LibreWolf already uses Firefox's autoconfig mechanism for
`librewolf.cfg`. That mechanism is usually the only way to run privileged
JavaScript in the browser UI, so the dotfiles hook into it instead of
installing a separate loader.

## How it fits together

- `system/config/usr/lib/librewolf/defaults/pref/zz-dotfiles.js` disables the
  autoconfig sandbox. It must be a default pref in the application directory;
  a `user.js` pref is read too late.
- `user/config/.config/librewolf/librewolf/__link.librewolf.overrides.cfg`
  is the overrides file LibreWolf loads from the profile. It registers
  `chrome/scripts/chrome.manifest` and loads the scripts in this folder.
- `10browser.mjs` links `user/data/librewolf/chrome` into the profile, so the
  files here are the live copies.

Run `./run.sh` to install the system pref and refresh the profile links, then
restart LibreWolf. If the profile links are already current, `./run.sh system`
is enough to install the pref.

## Script types

- `*.sys.mjs` runs once, as a privileged module, when the browser starts.
  This is the right place for background code and observers.
- `*.uc.js` is injected into every browser window after delayed startup.
- Files starting with `_` are ignored.

Changing a script requires a restart.

`userChrome.css` is watched and hot reloaded by `reload-userChrome.sys.mjs` with `gio monitor` (GIO's inotify backend).
Other `*.css` files are also watched and can be `@import`ed.

To verify it is running, open the Browser Console (`Ctrl+Shift+J`) after
restarting. It logs `[userChrome reload] Watching ... with gio`, and then
`[userChrome reload] Reloaded ... stylesheet(s)` whenever it reloads a file.
If `gio monitor` cannot start or exits, the script logs the error and shows a
`userChrome reload` alert. It does not fall back to polling.
`userContent.css` is not watched because it applies to content processes.

## Security

`general.config.sandbox_enabled=false` lets everything evaluated by
autoconfig run with full browser privileges. Only put scripts you trust in
this folder, and be aware that the overrides file itself now has that access
as well.
