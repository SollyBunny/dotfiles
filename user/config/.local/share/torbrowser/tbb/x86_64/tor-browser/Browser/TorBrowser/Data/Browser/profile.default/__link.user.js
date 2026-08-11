user_pref("xpinstall.signatures.required", false);
user_pref("xpinstall.whitelist.required", false);

user_pref("browser.toolbars.bookmarks.visibility", "never");
user_pref("sidebar.visibility", "hide-sidebar");

user_pref("browser.uiCustomization.state", `{"placements":{"widget-overflow-fixed-list":["preferences-button","developer-button"],"unified-extensions-area":["sponsorblocker_ajay_app-browser-action","pywalfox_frewacom_org-browser-action","keepassxc-browser_keepassxc_org-browser-action","_88ebde3a-4581-4c6b-8019-2a05a9e3e938_-browser-action","_762f9885-5a13-4abd-9c77-433dcd38b8fd_-browser-action"],"nav-bar":["back-button","forward-button","stop-reload-button","vertical-spacer","urlbar-container","zoom-controls","downloads-button","fxa-toolbar-menu-button","reset-pbm-toolbar-button","ublock0_raymondhill_net-browser-action","unified-extensions-button"],"toolbar-menubar":["menubar-items"],"TabsToolbar":["tabbrowser-tabs","new-tab-button","alltabs-button"],"vertical-tabs":[],"PersonalToolbar":["personal-bookmarks"]},"seen":["pywalfox_frewacom_org-browser-action","reset-pbm-toolbar-button","ublock0_raymondhill_net-browser-action","developer-button","keepassxc-browser_keepassxc_org-browser-action","screenshot-button","sponsorblocker_ajay_app-browser-action","_88ebde3a-4581-4c6b-8019-2a05a9e3e938_-browser-action","_762f9885-5a13-4abd-9c77-433dcd38b8fd_-browser-action"],"dirtyAreaCache":["unified-extensions-area","nav-bar","vertical-tabs","toolbar-menubar","TabsToolbar","PersonalToolbar","widget-overflow-fixed-list"],"currentVersion":24,"newElementCount":4}`);

user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.tabs.allow_transparent_browser");

user_pref("browser.aboutConfig.showWarning", false);

user_pref("signon.rememberSignons", true);
user_pref("preferences-relay-integration-checkbox2", false); // https://relay.firefox.com/

// ctrl-shift-alt-i
user_pref("devtools.debugger.remote-enabled", true);
user_pref("devtools.chrome.enabled", true);

// Torbrowser
user_pref("intl.language_notification.shown", true);
user_pref("torbrowser.about_torconnect.user_has_ever_clicked_connect", true);
user_pref("torbrowser.settings.quickstart.enabled", true);

// Extensions
user_pref("extensions.webextensions.ExtensionStorageIDB.migrated.pywalfox@frewacom.org", true);
