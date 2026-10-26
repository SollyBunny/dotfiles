// Allow the LibreWolf overrides file to load privileged browser-context
// scripts. Firefox only reads this pref from the default branch while it
// evaluates autoconfig files, so it cannot be set from user.js.
pref("general.config.sandbox_enabled", false);
