// api/index.js — Vercel Serverless Function
// Принимает POST от Аспро, отдаёт HTML виджета.

module.exports.config = { api: { bodyParser: false } };

function readBody(req) {
  return new Promise(function(resolve) {
    var data = '';
    req.on('data', function(c) { data += c.toString(); });
    req.on('end',  function()  { resolve(data); });
    req.on('error',function()  { resolve(''); });
  });
}

function parseForm(body) {
  var result = {};
  if (!body) return result;
  body.split('&').forEach(function(pair) {
    var idx = pair.indexOf('=');
    if (idx === -1) return;
    var k = decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '));
    var v = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
    result[k] = v;
  });
  return result;
}

function esc(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'POST') {
    var raw    = await readBody(req);
    var fields = parseForm(raw);
    var domain    = fields['domain']      || '';
    var accountId = fields['account[id]'] || '';
    console.log('[DDS] POST | domain:', domain, '| accountId:', accountId);
    return res.status(200).send(widgetHTML(domain, accountId));
  }

  return res.status(200).send(
    '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;color:#444">' +
    '<h3>&#x2713; ДДС виджет работает</h3>' +
    '<p>Откройте через дашборд Аспро.Cloud.</p>' +
    '</body></html>'
  );
};

// =============================================================================
// HTML ВИДЖЕТА
// =============================================================================
function widgetHTML(domain, accountId) {
  var d  = esc(domain);
  var id = esc(accountId);

  var js = buildJS(d, id);

  return '<!DOCTYPE html>\n'
    + '<html lang="ru">\n'
    + '<head>\n'
    + '<meta charset="UTF-8">\n'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    + '<title>ДДС</title>\n'
    + '<style>\n'
    + '*{box-sizing:border-box;margin:0;padding:0}\n'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:12px;background:#f8f9fd;color:#111827;padding:10px}\n'
    + '</style>\n'
    + '</head>\n'
    + '<body>\n'
    + '<div id="root" style="color:#9ca3af;font-size:12px">ДДС — загрузка\u2026</div>\n'
    + '<script>\n'
    + js
    + '\n</script>\n'
    + '</body>\n'
    + '</html>';
}

function buildJS(domain, accountId) {
  return [
    'var DOMAIN = "' + domain + '";',
    'var ACCOUNT_ID = "' + accountId + '";',
    '',
    '// Счета ВСИП и ТТ (имена из публичного API Аспро)',
    'var VSIP_NAMES = {',
    '  "Альфа ВСИП":1, "ВСИП Депозиты":1, "Счет ВТБ":1,',
    '  "Счет РХСБ":1, "Счет Сбербанк":1, "Расчетный счет 9637":1',
    '};',
    'var TT_NAMES = { "Альфа ТТ (ВСИП)": 1 };',
    '',
    'var OFF_PROJ = {24:1, 26:1, 27:1};',
    'var PROJ_NAMES = {',
    '  1:"Кемерово", 3:"Южно-Сахалинск", 13:"Барнаул", 12:"Киров",',
    '  23:"Сыктывкар", 9:"Рузаевка", 7:"Иволгинск", 6:"Десногорск",',
    '  100:"Центральный договор", 101:"Прочие проекты"',
    '};',
    'var PROJ_ORDER = [1,3,13,12,23,9,7,6,100,101];',
    'var PROJ_GROUP = {2:100,18:100,19:100,29:100,30:100,31:100,32:100,33:100,17:101,20:101,22:101};',
    '',
    '// Статьи учёта',
    'var ART_CAT = {',
    '  "Перевод между счетами (поступление)": "skip",',
    '  "Перевод между счетами (списание)":    "skip",',
    '  "Получение кредита": "skip",',
    '  "Выплата кредита":   "skip",',
    '  "Оказание услуг":               "pjIn",',
    '  "Возврат ДС. за заказы":         "refund",',
    '  "Проценты к получению":          "pr",',
    '  "Зарплата":                      "zp",',
    '  "Командировки":                  "km",',
    '  "Страхование":                   "ins",',
    '  "Расходы на услуги банков":      "bk",',
    '  "Налоги и взносы":               "po",',
    '  "Налоги - НДС":                  "po",',
    '  "Прочее":                        "po",',
    '  "Аренда":                        "po",',
    '  "Бухгалтерия":                   "po",',
    '  "Интернет и связь":              "po",',
    '  "Расходы на лизинг":             "po",',
    '  "Проценты к уплате":             "po",',
    '  "Оборудование":                  "po",',
    '  "Возвраты клиентам":             "po",',
    '  "Нераспределенные":              "po",',
    '  "Нераспределенные (списание)":   "po",',
    '  "Тесты и испытания":             "po",',
    '  "Услуги по сертификации":        "po",',
    '  "Составление исполнительной документации": "po",',
    '  "СМР (Без детализации)":         "pjOut",',
    '  "СМР Вент+кондиц":              "pjOut",',
    '  "Материалы (Вентиляция)":        "pjOut",',
    '  "Материалы (Отопление)":         "pjOut",',
    '  "Материалы (Потолки)":           "pjOut",',
    '  "Материалы (Проемы)":            "pjOut",',
    '  "Материалы (Стены)":             "pjOut",',
    '  "Материалы (Транспорт, Логистика)": "pjOut",',
    '  "Материалы (Электрика)":         "pjOut",',
    '  "Материалы черновые":            "pjOut",',
    '  "Проектирование-Изыскание":      "pjOut"',
    '};',
    '',
    '// Утилиты',
    'function fmt(v) {',
    '  if (!v && v !== 0) return "\u2014";',
    '  if (v === 0) return "\u2014";',
    '  return new Intl.NumberFormat("ru-RU", {minimumFractionDigits:2, maximumFractionDigits:2}).format(v);',
    '}',
    'function parseNum(s) {',
    '  if (!s && s !== 0) return 0;',
    '  return parseFloat(String(s).replace(/[^\\d.\\-]/g, "")) || 0;',
    '}',
    'function getRange() {',
    '  var now = new Date(), y = now.getFullYear(), m = now.getMonth();',
    '  var p = function(n){ return n < 10 ? "0"+n : ""+n; };',
    '  var end = Math.min(now.getDate(), new Date(y, m+1, 0).getDate());',
    '  var mo = ["Январь","Февраль","Март","Апрель","Май","Июнь",',
    '            "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];',
    '  return {',
    '    ymd:       y+"-"+p(m+1),',
    '    startDate: y+"-"+p(m+1)+"-01",',
    '    endDate:   y+"-"+p(m+1)+"-"+p(end),',
    '    firstDay:  "01."+p(m+1)+"."+y,',
    '    lastDay:   p(end)+"."+p(m+1)+"."+y,',
    '    label:     mo[m]+" "+y',
    '  };',
    '}',
    '',
    '// localStorage',
    'function lsKey(ym) { return "dds8_"+ACCOUNT_ID+"_"+ym; }',
    'function getFixed(ym) {',
    '  try { var s=localStorage.getItem(lsKey(ym)); return s?JSON.parse(s):null; } catch(e){return null;}',
    '}',
    'function setFixed(ym,vsip,tt) {',
    '  try { localStorage.setItem(lsKey(ym),JSON.stringify({vsip:vsip,tt:tt})); } catch(e){}',
    '}',
    'function clearFixed(ym) {',
    '  try { localStorage.removeItem(lsKey(ym)); } catch(e){}',
    '}',
    '',
    '// Чтение остатков из DOM родителя',
    '// Формат на странице: "19 495 371 p.\\nВСИП" и "-1 974 449 p.\\nООО"',
    'function readBalances() {',
    '  var result = {vsip: null, tt: null};',
    '  try {',
    '    var text = window.parent.document.body.innerText || "";',
    '    var mv = text.match(/([-\\d][\\d\\s]*)[\\s]*[рp]\\.\\s*\\n\\s*ВСИП/);',
    '    var mt = text.match(/([-\\d][\\d\\s]*)[\\s]*[рp]\\.\\s*\\n\\s*ООО/);',
    '    if (mv) result.vsip = parseNum(mv[1].replace(/\\s/g,""));',
    '    if (mt) result.tt   = parseNum(mt[1].replace(/\\s/g,""));',
    '  } catch(e) {}',
    '  return result;',
    '}',
    '',
    '// Запрос через серверный прокси',
    'function loadEntity(entity) {',
    '  return fetch("/api/data", {',
    '    method: "POST",',
    '    headers: {"Content-Type":"application/json"},',
    '    body: JSON.stringify({domain: DOMAIN, entity: entity})',
    '  }).then(function(r) {',
    '    return r.ok ? r.json() : Promise.reject("HTTP "+r.status);',
    '  }).then(function(d) { return d.items || []; });',
    '}',
    '',
    '// Построение отчёта',
    'function buildReport(txItems, accountItems, catItems, range) {',
    '  var accountMap = {};',
    '  accountItems.forEach(function(a) { accountMap[a.id] = a.name || ""; });',
    '  var catMap = {};',
    '  catItems.forEach(function(c) { catMap[c.id] = c.name || ""; });',
    '',
    '  var pr=0, zp=0, km=0, bk=0, ins=0, po=0, pjIn=0, pjOut=0, refund=0;',
    '  var pjInByProj={}, pjOutByProj={};',
    '  var vsipNetto=0, ttNetto=0;',
    '',
    '  txItems.forEach(function(tx) {',
    '    var date = tx.date || "";',
    '    if (!date || date < range.startDate || date > range.endDate) return;',
    '',
    '    var inc     = parseNum(tx.income)  || 0;',
    '    var out     = parseNum(tx.outcome) || 0;',
    '    var accName = accountMap[tx.org_account_id] || "";',
    '    var catName = catMap[tx.category_id] || "";',
    '    var projId  = tx.project_id || 0;',
    '',
    '    var isVsip = !!VSIP_NAMES[accName];',
    '    var isTT   = !!TT_NAMES[accName];',
    '    if (!isVsip && !isTT) return;',
    '',
    '    if (isVsip) vsipNetto += inc - out;',
    '    if (isTT)   ttNetto   += inc - out;',
    '',
    '    var rawPid = projId;',
    '    var pid    = (rawPid && PROJ_GROUP[rawPid]) ? PROJ_GROUP[rawPid] : rawPid;',
    '    var pidOk  = pid && !!PROJ_NAMES[pid];',
    '    var pidOff = rawPid && !!OFF_PROJ[rawPid];',
    '',
    '    var cat = ART_CAT[catName];',
    '    if (cat === "skip") return;',
    '',
    '    if (inc > 0) {',
    '      if      (cat === "pr")               pr += inc;',
    '      else if (cat === "pjIn"  && pidOk) { pjIn += inc; pjInByProj[pid]  = (pjInByProj[pid]  || 0) + inc; }',
    '      else if (cat === "refund"&& pidOk)   refund += inc;',
    '    }',
    '    if (out > 0) {',
    '      if      (cat === "zp")  zp  += out;',
    '      else if (cat === "km")  km  += out;',
    '      else if (cat === "ins") ins += out;',
    '      else if (cat === "bk")  bk  += out;',
    '      else if (cat === "po")  po  += out;',
    '      else if (cat === "pjOut" && !pidOff) { pjOut += out; if(pid&&pidOk) pjOutByProj[pid] = (pjOutByProj[pid]||0)+out; }',
    '      else if (!cat && !pidOff) { pjOut += out; if(pid&&pidOk) pjOutByProj[pid] = (pjOutByProj[pid]||0)+out; }',
    '    }',
    '  });',
    '',
    '  // Остатки считаем из транзакций:',
    '  // fixed_balance + все движения от fixed_balance_date до endDate',
    '  var vsipFixedBal = 0, ttFixedBal = 0;',
    '  var vsipFixedDate = "1900-01-01", ttFixedDate = "1900-01-01";',
    '  accountItems.forEach(function(a) {',
    '    var name = a.name || "";',
    '    if (VSIP_NAMES[name]) {',
    '      vsipFixedBal  += parseNum(a.fixed_balance) || 0;',
    '      if (a.fixed_balance_date && a.fixed_balance_date > vsipFixedDate)',
    '        vsipFixedDate = a.fixed_balance_date;',
    '    }',
    '    if (TT_NAMES[name]) {',
    '      ttFixedBal  += parseNum(a.fixed_balance) || 0;',
    '      if (a.fixed_balance_date && a.fixed_balance_date > ttFixedDate)',
    '        ttFixedDate = a.fixed_balance_date;',
    '    }',
    '  });',
    '  // Считаем все движения от фиксированной даты до конца диапазона',
    '  var vsipTotal = 0, ttTotal = 0;',
    '  txAll.forEach(function(tx) {',
    '    if (!tx.date) return;',
    '    var inc = parseNum(tx.income) || 0;',
    '    var out = parseNum(tx.outcome) || 0;',
    '    var accName = accountMap[tx.org_account_id] || "";',
    '    var cat = ART_CAT[catMap[tx.category_id] || ""];',
    '    if (cat === "skip") return;',
    '    if (VSIP_NAMES[accName] && tx.date >= vsipFixedDate && tx.date <= range2.endDate)',
    '      vsipTotal += inc - out;',
    '    if (TT_NAMES[accName]   && tx.date >= ttFixedDate   && tx.date <= range2.endDate)',
    '      ttTotal   += inc - out;',
    '  });',
    '  var vsipEnd = vsipFixedBal + vsipTotal;',
    '  var ttEnd   = ttFixedBal   + ttTotal;',
    '',
    '  var fixed = getFixed(range.ymd);',
    '  var vsipStart, ttStart;',
    '  if (fixed) {',
    '    vsipStart = fixed.vsip; ttStart = fixed.tt;',
    '    if (vsipEnd === null) vsipEnd = vsipStart + vsipNetto;',
    '    if (ttEnd   === null) ttEnd   = ttStart   + ttNetto;',
    '  } else if (vsipEnd !== null && ttEnd !== null) {',
    '    vsipStart = vsipEnd - vsipNetto;',
    '    ttStart   = ttEnd   - ttNetto;',
    '    setFixed(range.ymd, vsipStart, ttStart);',
    '  } else {',
    '    vsipStart = 0; ttStart = 0;',
    '    vsipEnd   = vsipNetto; ttEnd = ttNetto;',
    '  }',
    '',
    '  var te = pjOut + zp + km + bk + ins + po;',
    '  return {',
    '    vsipStart:vsipStart, ttStart:ttStart, vsipEnd:vsipEnd, ttEnd:ttEnd,',
    '    totalStart: vsipStart + ttStart,',
    '    totalEnd:   (vsipEnd||0) + (ttEnd||0),',
    '    pr:pr, pjIn:pjIn, refund:refund,',
    '    pjOut:pjOut, zp:zp, km:km, bk:bk, ins:ins, po:po, te:te,',
    '    pjInByProj:pjInByProj, pjOutByProj:pjOutByProj,',
    '    cnt:txItems.length,',
    '    firstDay:range.firstDay, lastDay:range.lastDay,',
    '    label:range.label, ymd:range.ymd',
    '  };',
    '}',
    '',
    '// HTML таблица',
    'function TR(l, v, o) {',
    '  o = o||{};',
    '  var n = fmt(v);',
    '  var c = o.color || (o.green && v > 0 ? "#16a34a" : o.negRed && v < 0 ? "#dc2626" : "");',
    '  if (o.muted) c = "#9ca3af";',
    '  var s2 = "text-align:right;white-space:nowrap;padding:4px 6px;font-size:12px;" + (c ? "color:"+c+";" : "");',
    '  var s1 = "padding:4px 6px;font-size:12px;" + (o.indent ? "padding-left:16px;" : "");',
    '  var sr = (o.sep  ? "border-top:1px solid #e5e7eb;" : "") + (o.bold ? "font-weight:600;" : "");',
    '  return "<tr style=\\""+sr+"\\"><td style=\\""+s1+"\\">"+l+"</td><td style=\\""+s2+"\\">"+n+"</td></tr>";',
    '}',
    'function SEC(t) {',
    '  return "<tr><td colspan=\\"2\\" style=\\"padding:7px 6px 2px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-top:1px solid #e5e7eb;\\">"+t+"</td></tr>";',
    '}',
    '',
    'function renderHTML(r, live) {',
    '  var rows = [], totalIn = 0;',
    '  rows.push(TR("Остаток "+r.firstDay+" \u00b7 \u0412\u0421\u0418\u041f", r.vsipStart));',
    '  rows.push(TR("Остаток "+r.firstDay+" \u00b7 \u0422\u0422",            r.ttStart, {negRed:true}));',
    '  rows.push(TR("\u0418\u0422\u041e\u0413\u041e \u043d\u0430 "+r.firstDay, r.totalStart, {bold:true, sep:true}));',
    '  rows.push(TR("Остаток "+r.lastDay +" \u00b7 \u0412\u0421\u0418\u041f", r.vsipEnd));',
    '  rows.push(TR("Остаток "+r.lastDay +" \u00b7 \u0422\u0422",             r.ttEnd,   {negRed:true}));',
    '  rows.push(TR("\u0418\u0422\u041e\u0413\u041e \u043d\u0430 "+r.lastDay,  r.totalEnd, {bold:true, sep:true, green:true}));',
    '',
    '  rows.push(SEC("\u041f\u043e\u0441\u0442\u0443\u043f\u043b\u0435\u043d\u0438\u044f"));',
    '  var hasPjIn = Object.keys(r.pjInByProj).length > 0;',
    '  if (hasPjIn) {',
    '    PROJ_ORDER.forEach(function(pid) {',
    '      var v = r.pjInByProj[pid];',
    '      if (v) { rows.push(TR(PROJ_NAMES[pid], v, {green:true, indent:true})); totalIn += v; }',
    '    });',
    '  } else if (r.pjIn) {',
    '    rows.push(TR("\u041f\u043e\u0441\u0442\u0443\u043f\u043b\u0435\u043d\u0438\u044f \u043f\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u0430\u043c", r.pjIn, {green:true, indent:true}));',
    '    totalIn += r.pjIn;',
    '  }',
    '  if (r.pr)     { rows.push(TR("\u041f\u0440\u043e\u0446\u0435\u043d\u0442\u043d\u044b\u0435 \u0434\u043e\u0445\u043e\u0434\u044b", r.pr,     {green:true, indent:true})); totalIn += r.pr; }',
    '  if (r.refund) { rows.push(TR("\u0412\u043e\u0437\u0432\u0440\u0430\u0442\u044b",                    r.refund, {green:true, indent:true})); totalIn += r.refund; }',
    '  rows.push(TR("\u0418\u0442\u043e\u0433\u043e \u043f\u043e\u0441\u0442\u0443\u043f\u043b\u0435\u043d\u0438\u0439", totalIn, {bold:true, sep:true, green:true}));',
    '',
    '  rows.push(SEC("\u0420\u0430\u0441\u0445\u043e\u0434\u044b \u043f\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u0430\u043c"));',
    '  var hasPjOut = Object.keys(r.pjOutByProj).length > 0;',
    '  if (hasPjOut) {',
    '    PROJ_ORDER.forEach(function(pid) {',
    '      var v = r.pjOutByProj[pid] || 0;',
    '      rows.push(TR(PROJ_NAMES[pid], v, {indent:true, muted:!v}));',
    '    });',
    '  }',
    '  rows.push(TR("\u0418\u0442\u043e\u0433\u043e \u043f\u0440\u043e\u0435\u043a\u0442\u044b", r.pjOut, {bold:true, sep:hasPjOut}));',
    '',
    '  rows.push(SEC("\u041e\u0444\u0438\u0441\u043d\u044b\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u044b"));',
    '  rows.push(TR("\u0417\u0430\u0440\u043f\u043b\u0430\u0442\u0430",             r.zp,  {indent:true, muted:!r.zp}));',
    '  rows.push(TR("\u041a\u043e\u043c\u0430\u043d\u0434\u0438\u0440\u043e\u0432\u043e\u0447\u043d\u044b\u0435",     r.km,  {indent:true, muted:!r.km}));',
    '  rows.push(TR("\u0421\u0442\u0440\u0430\u0445\u043e\u0432\u0430\u043d\u0438\u0435",         r.ins, {indent:true, muted:!r.ins}));',
    '  rows.push(TR("\u0411\u0430\u043d\u043a\u043e\u0432\u0441\u043a\u0438\u0435 \u043a\u043e\u043c\u0438\u0441\u0441\u0438\u0438", r.bk,  {indent:true, muted:!r.bk}));',
    '  rows.push(TR("\u041f\u0440\u043e\u0447\u0438\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u044b \u043e\u0444\u0438\u0441\u0430", r.po,  {indent:true, muted:!r.po}));',
    '  rows.push(TR("\u0412\u0421\u0415\u0413\u041e \u0420\u0410\u0421\u0425\u041e\u0414\u041e\u0412", r.te, {bold:true, sep:true}));',
    '',
    '  var ctrl = r.totalStart + totalIn - r.te - r.totalEnd;',
    '  var cOk  = Math.abs(ctrl) < 1;',
    '  rows.push(TR(cOk ? "\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c\u043d\u0430\u044f \u0441\u0443\u043c\u043c\u0430" : "\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c\u043d\u0430\u044f \u0441\u0443\u043c\u043c\u0430 \u26a0", ctrl,',
    '    {sep:true, color: cOk ? "#16a34a" : "#dc2626"}));',
    '',
    '  var st = live',
    '    ? \'<span style="color:#16a34a">\u25cf live \u00b7 \'+r.cnt+\' \u0442\u0440.</span>\'',
    '    : \'<span style="color:#9ca3af">\u0434\u0430\u043d\u043d\u044b\u0435 \u043d\u0430 \'+r.lastDay+\'</span>\';',
    '',
    '  return \'<div style="display:flex;align-items:flex-start;justify-content:space-between;\'',
    '    + \'margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">\'',
    '    + \'<div><div style="font-size:13px;font-weight:600;">\u0414\u0414\u0421 \u2014 \'+r.label+\'</div>\'',
    '    + \'<div style="font-size:10px;color:#9ca3af;margin-top:1px;">\'+r.firstDay+\' \u2014 \'+r.lastDay+\'</div></div>\'',
    '    + \'<div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">\'',
    '    + \'<span id="dds-status" style="font-size:10px;">\'+st+\'</span>\'',
    '    + \'<button id="dds-btn" style="background:none;border:1px solid #d1d5db;color:#6b7280;font-size:10px;padding:1px 6px;border-radius:3px;cursor:pointer;">\u21bb</button>\'',
    '    + \'<button id="dds-reset" style="background:none;border:1px solid #d1d5db;color:#9ca3af;font-size:10px;padding:1px 5px;border-radius:3px;cursor:pointer;">\u21b3\u2080</button>\'',
    '    + \'</div></div>\'',
    '    + \'<table style="width:100%;border-collapse:collapse;">\'+rows.join("")+\'</table>\'',
    '    + \'<div style="margin-top:6px;font-size:10px;color:#9ca3af;">\u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u043e: \'+new Date().toLocaleTimeString("ru-RU")+\'</div>\';',
    '}',
    '',
    '// Загрузка данных',
    'function loadData(resetStart) {',
    '  var d = document.getElementById("root");',
    '  var range = getRange();',
    '  if (resetStart) clearFixed(range.ymd);',
    '  var st = document.getElementById("dds-status");',
    '  if (st) { st.textContent = "\u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026"; st.style.color = "#9ca3af"; }',
    '',
    '  Promise.all([',
    '    loadEntity("transaction"),',
    '    loadEntity("bank_account"),',
    '    loadEntity("categories")',
    '  ]).then(function(res) {',
    '    var txAll   = res[0];',
    '    var accounts = res[1];',
    '    var cats    = res[2];',
    '    var range2  = getRange();',
    '    var monthTx = txAll.filter(function(tx) {',
    '      return tx.date && tx.date >= range2.startDate && tx.date <= range2.endDate;',
    '    });',
    '    console.log("[DDS] tx:", txAll.length, "month:", monthTx.length, "accounts:", accounts.length, "cats:", cats.length);',
    '    if (monthTx.length > 0) {',
    '      var rep = buildReport(monthTx, accounts, cats, range2);',
    '      d.innerHTML = renderHTML(rep, true);',
    '    } else {',
    '      d.innerHTML = \'<div style="padding:12px;color:#9ca3af;font-size:12px;">\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0437\u0430 \'+range2.label+\'</div>\';',
    '    }',
    '    var btn = document.getElementById("dds-btn");',
    '    if (btn) btn.onclick = function() { loadData(false); };',
    '    var rst = document.getElementById("dds-reset");',
    '    if (rst) rst.onclick = function() { loadData(true); };',
    '  }).catch(function(err) {',
    '    var st2 = document.getElementById("dds-status");',
    '    if (st2) { st2.textContent = "\u043e\u0448\u0438\u0431\u043a\u0430 "+err; st2.style.color = "#dc2626"; }',
    '    else { d.innerHTML = \'<div style="padding:12px;color:#dc2626;font-size:12px;">\u041e\u0448\u0438\u0431\u043a\u0430: \'+err+\'</div>\'; }',
    '    console.error("[DDS]", err);',
    '  });',
    '}',
    '',
    'loadData(false);',
    'setInterval(function() { loadData(false); }, 5 * 60 * 1000);',
    'console.log("[DDS widget] started | domain:", DOMAIN);',
  ].join('\n');
}
