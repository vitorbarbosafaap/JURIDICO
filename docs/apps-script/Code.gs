/**
 * Jurídico Pitzi — Google Sheets backend (Fase 4)
 *
 * Deploy this as a Web App bound to a Google Sheet (the "RELATÓRIO
 * ACOMPANHAMENTO JURÍDICO" spreadsheet or a new one dedicated to the app).
 * Each collection (processos, clientes, prazos, etc.) is stored as ONE JSON
 * blob in cell A1 of a sheet tab named after the collection — this mirrors
 * the app's storage contract exactly (read the whole collection, write the
 * whole collection back), so there's no per-row diffing to get wrong.
 *
 * SETUP
 * 1. Open (or create) the Google Sheet you want to use as the database.
 * 2. Extensions → Apps Script. Paste this file's contents in as Code.gs.
 * 3. (Optional but recommended) Project Settings → Script Properties → add
 *    a property named API_KEY with a long random value. If set, every
 *    request must include a matching `key` parameter.
 * 4. Deploy → New deployment → type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone (the API key is what actually gates access —
 *      Apps Script Web Apps cannot check arbitrary request headers before
 *      routing, so "Anyone" + API key is the standard pattern here)
 * 5. Copy the deployment URL into Configurações → Integração de Dados →
 *    Google Sheets → "Web App URL" in the app, along with the same API key.
 * 6. Click "Testar conexão" in the app before switching the active backend.
 */

function doGet(e) {
  try {
    if (e.parameter.action !== 'list') {
      return jsonOutput_({ ok: false, error: 'Ação inválida.' });
    }
    checkKey_(e.parameter.key);
    var collection = e.parameter.collection;
    if (!collection) return jsonOutput_({ ok: false, error: 'Parâmetro "collection" ausente.' });
    if (collection === '__ping__') return jsonOutput_({ ok: true, data: [] });
    return jsonOutput_({ ok: true, data: readCollection_(collection) });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action !== 'save') {
      return jsonOutput_({ ok: false, error: 'Ação inválida.' });
    }
    checkKey_(body.key);
    if (!body.collection) return jsonOutput_({ ok: false, error: 'Campo "collection" ausente.' });
    writeCollection_(body.collection, body.data || []);
    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function checkKey_(providedKey) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (expected && providedKey !== expected) {
    throw new Error('Chave de API inválida.');
  }
}

function readCollection_(name) {
  var sheet = getOrCreateSheet_(name);
  var raw = sheet.getRange(1, 1).getValue();
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeCollection_(name, data) {
  var sheet = getOrCreateSheet_(name);
  sheet.getRange(1, 1).setValue(JSON.stringify(data));
  sheet.getRange(1, 2).setValue('Atualizado em: ' + new Date().toISOString());
}

function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
