/**
 * DearMy Bakeshop: Google Sheet to website bridge.
 *
 * Paste this into the Sheet's Extensions > Apps Script editor (see README.md in this folder).
 *
 * What it does
 *   1. Adds a "Website" menu to the Sheet: "Check my sheet" and "Publish to website".
 *   2. Serves the Bakes and Hours tabs as JSON (web app) so the site build can read them.
 *
 * Script properties (Project Settings > Script properties):
 *   API_KEY          any long random string; the site build sends it as ?key=
 *   DEPLOY_HOOK_URL  the host's deploy hook URL (Cloudflare Pages / Netlify / Vercel)
 */

var BAKES_TAB = 'Bakes';
var HOURS_TAB = 'Hours';

/* ---------------------------------------------------------------- */
/* Menu                                                              */
/* ---------------------------------------------------------------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Check my sheet', 'checkSheet')
    .addItem('Publish to website', 'publishSite')
    .addToUi();
}

/** Tells the owner which rows will be skipped, and why, before they publish. */
function checkSheet() {
  var data = readSheet_();
  var ui = SpreadsheetApp.getUi();
  var msg = data.bakes.length + ' bake(s) will show on the website.\n';
  if (data.problems.length) {
    msg += '\nFix these first:\n- ' + data.problems.join('\n- ');
  } else {
    msg += '\nEverything looks good. Use Website > Publish to website.';
  }
  ui.alert('Check my sheet', msg, ui.ButtonSet.OK);
}

/** Pings the host's deploy hook so the website rebuilds with the current Sheet. */
function publishSite() {
  var ui = SpreadsheetApp.getUi();
  var hook = PropertiesService.getScriptProperties().getProperty('DEPLOY_HOOK_URL');
  if (!hook) {
    ui.alert('Publishing is not set up yet. Ask your web person to add DEPLOY_HOOK_URL.');
    return;
  }

  var data = readSheet_();
  if (data.problems.length) {
    var go = ui.alert(
      'Some rows have problems',
      'These rows will be left off the website:\n- ' + data.problems.join('\n- ') + '\n\nPublish anyway?',
      ui.ButtonSet.YES_NO
    );
    if (go !== ui.Button.YES) return;
  }

  var res = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
  var code = res.getResponseCode();
  if (code >= 200 && code < 300) {
    ui.alert('Publishing started', 'Your changes will be live in about 2 minutes.', ui.ButtonSet.OK);
  } else {
    ui.alert('Could not publish (error ' + code + '). Please tell your web person.');
  }
}

/* ---------------------------------------------------------------- */
/* Web app: GET ...?key=API_KEY returns the content as JSON          */
/* ---------------------------------------------------------------- */

function doGet(e) {
  var key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!key || !e || !e.parameter || e.parameter.key !== key) {
    return json_({ ok: false, error: 'bad key' });
  }
  try {
    var data = readSheet_();
    return json_({ ok: true, bakes: data.bakes, hours: data.hours, problems: data.problems });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------------------------------------------------------- */
/* Reading the tabs                                                  */
/* ---------------------------------------------------------------- */

/** "For dear my" -> "fordearmy". Lets the owner rename or reorder columns safely. */
function norm_(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function table_(tabName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  if (!sheet) throw new Error('There is no tab called "' + tabName + '".');
  var values = sheet.getDataRange().getDisplayValues();
  if (!values.length) return [];
  var headers = values[0].map(norm_);
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = { row: r + 1 };
    var blank = true;
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      obj[headers[c]] = String(values[r][c]).trim();
      if (obj[headers[c]]) blank = false;
    }
    if (!blank) rows.push(obj);
  }
  return rows;
}

function pick_(row, names) {
  for (var i = 0; i < names.length; i++) {
    if (row[names[i]]) return row[names[i]];
  }
  return '';
}

/** Turns a Google Drive share link into a direct image link. Other URLs pass through. */
function photoUrl_(raw) {
  var url = String(raw || '').trim();
  if (!url) return '';
  var m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  if (url.indexOf('drive.google.com') !== -1 && m) {
    return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1600';
  }
  return url;
}

function isYes_(v) {
  return ['true', 'yes', 'y', 'x', '1', 'checked'].indexOf(String(v).toLowerCase()) !== -1;
}

function readSheet_() {
  var problems = [];
  var bakes = [];

  table_(BAKES_TAB).forEach(function (r) {
    var name = pick_(r, ['name']);
    // "On website?" blank counts as hidden, so half-finished rows never go live.
    var live = isYes_(pick_(r, ['onwebsite', 'available', 'show']));
    if (!live) return;

    var photo = photoUrl_(pick_(r, ['photo', 'photolink', 'image']));
    if (!photo) problems.push('Row ' + r.row + ' (' + (name || 'no name') + '): no photo. A placeholder will show.');

    bakes.push({
      row: r.row,
      name: name,
      category: pick_(r, ['type', 'category']),
      price: pick_(r, ['price']),
      description: pick_(r, ['description']),
      dearTo: pick_(r, ['fordearmy', 'dearto']),
      photo: photo,
      alt: pick_(r, ['photodescription', 'alt', 'alttext']),
    });
  });

  var hours = table_(HOURS_TAB).map(function (r) {
    return { days: pick_(r, ['days', 'day']), time: pick_(r, ['time', 'hours']) };
  });

  // Mirrors the website's own checks so "Check my sheet" matches what will be skipped.
  var types = ['bread', 'pastry', 'pastries', 'cake', 'cakes and slices', 'cookie', 'cookies'];
  var seenProblem = {};
  bakes.forEach(function (b) {
    var why = [];
    if (!b.name) why.push('no name');
    if (types.indexOf(b.category.toLowerCase()) === -1) why.push('type "' + b.category + '" is not one of the list');
    if (!(parseFloat(String(b.price).replace(/[^0-9.]/g, '')) > 0)) why.push('price is not a number');
    if (!b.description) why.push('no description');
    if (why.length && !seenProblem[b.row]) {
      seenProblem[b.row] = true;
      problems.push('Row ' + b.row + ' (' + (b.name || 'no name') + '): ' + why.join(', ') + '. Left off the website.');
    }
  });

  return { bakes: bakes, hours: hours, problems: problems };
}
