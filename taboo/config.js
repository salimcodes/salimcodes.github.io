/*
 * AfriTaboo — Phase 1 (Elicitation) configuration
 * ------------------------------------------------
 * ENDPOINT: paste the Google Apps Script "Web app" URL here after deploying
 *           backend/Code.gs (see README.md). Leave empty to run in
 *           "local test mode": submissions are kept on the device and can be
 *           downloaded as JSON, nothing is sent anywhere.
 */
window.AFRITABOO_CONFIG = {
  ENDPOINT: "",

  // Shown on the consent screen. Leave empty to hide the contact line.
  CONTACT_EMAIL: "",

  // Bump when you change questions, so rows can be traced to a form version.
  FORM_VERSION: "p1-2026.11.24",

  // Soft targets used for gentle encouragement in the UI.
  SUGGESTED_MIN_TABOOS: 3,
  MAX_TABOOS_PER_SUBMISSION: 40,

  // Show the "N taboos shared so far" counter on the welcome screen.
  SHOW_PUBLIC_COUNT: true
};
