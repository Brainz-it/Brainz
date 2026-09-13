/**
 * Enregistre les réponses RSVP et les vœux du livre d'or dans cette feuille Google Sheets.
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
 *
 * Deux onglets sont utilisés : « RSVP » (réponses) et « Livre d'or » (vœux affichés sur le site).
 */
var RSVP_HEADERS = ["Date", "Nom", "Présence"];
var WISH_HEADERS = ["Date", "Nom", "Vœu", "Affiché"];

function sheetNamed(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    // le premier onglet vide devient l'onglet RSVP, sinon on crée
    var first = ss.getSheets()[0];
    if (name === "RSVP" && first.getLastRow() === 0) { sh = first; sh.setName(name); }
    else sh = ss.insertSheet(name);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.type === "wish") {
    var ws = sheetNamed("Livre d'or", WISH_HEADERS);
    ws.appendRow([new Date(), String(p.name || "").slice(0, 80), String(p.wish || "").slice(0, 500), "oui"]);
  } else {
    var rs = sheetNamed("RSVP", RSVP_HEADERS);
    rs.appendRow([new Date(), p.name || "", p.presence || ""]);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

// GET …/exec?action=wishes → les 50 derniers vœux dont la colonne « Affiché » vaut « oui »
// (mettez « non » dans la feuille pour masquer un vœu). Sans paramètre : {"ok":true}
function doGet(e) {
  var p = (e && e.parameter) || {};
  var out = { ok: true };
  if (p.action === "wishes") {
    var ws = sheetNamed("Livre d'or", WISH_HEADERS);
    var rows = ws.getLastRow() > 1 ? ws.getRange(2, 1, ws.getLastRow() - 1, 4).getValues() : [];
    out.wishes = rows.filter(function (r) { return String(r[3]).toLowerCase() !== "non" && r[2]; })
      .map(function (r) { return { date: Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), "dd/MM/yyyy"), name: r[1], wish: r[2] }; })
      .reverse().slice(0, 50);
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
