/**
 * Enregistre les réponses RSVP du site dans cette feuille Google Sheets.
 *
 * Installation (5 minutes) :
 *  1. Créez une feuille Google Sheets vide.
 *  2. Menu Extensions → Apps Script. Remplacez tout le contenu par ce fichier. Enregistrez.
 *  3. Déployer → Nouveau déploiement → type « Application Web ».
 *     Exécuter en tant que : Moi. Qui a accès : Tout le monde. Déployer.
 *  4. Autorisez l'accès quand Google le demande.
 *  5. Copiez l'URL de l'application Web (…/exec) dans content/site.json :
 *       "rsvp": { "sendVia": "googlesheet", "googleSheetEndpoint": "https://script.google.com/macros/s/…/exec" }
 *
 * Après toute modification du script, refaites Déployer → Gérer les déploiements → Modifier → Nouvelle version.
 */
var HEADERS = ["Date", "Nom", "Présence", "Accompagné(e)", "Nom du +1", "Message"];

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var p = (e && e.parameter) || {};
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([new Date(), p.name || "", p.presence || "", p.accompanied || "", p.plusOne || "", p.word || ""]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// Permet de tester l'URL dans un navigateur : doit afficher {"ok":true}
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
