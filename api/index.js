// api/index.js — Vercel Serverless Function (CommonJS)
 
// Отключаем встроенный bodyParser — читаем сырое тело вручную
module.exports.config = {
  api: { bodyParser: false }
};
 
// Читаем тело POST-запроса
function readBody(req) {
  return new Promise(function(resolve) {
    var data = '';
    req.on('data', function(chunk) { data += chunk.toString(); });
    req.on('end',  function() { resolve(data); });
    req.on('error',function() { resolve(''); });
  });
}
 
// Парсим application/x-www-form-urlencoded
function parseForm(body) {
  var result = {};
  if (!body) return result;
  body.split('&').forEach(function(pair) {
    var idx = pair.indexOf('=');
    if (idx === -1) return;
    var key = decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '));
    var val = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
    result[key] = val;
  });
  return result;
}
 
// Экранируем строку для вставки в JS
function esc(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g,  "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}
 
module.exports = async function handler(req, res) {
  // Разрешаем показ в iframe с любого домена
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
 
  if (req.method === 'POST') {
    var rawBody = await readBody(req);
    var fields  = parseForm(rawBody);
 
    var domain      = fields['domain']             || '';
    var accessToken = fields['auth[access_token]'] || '';
    var accountId   = fields['account[id]']        || '';
 
    console.log('[DDS] POST | domain:', domain, '| accountId:', accountId, '| hasToken:', !!accessToken);
 
    return res.status(200).send(widgetHTML(domain, accessToken, accountId));
  }
 
  // GET — проверка что деплой работает
  return res.status(200).send(
    '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;color:#444">' +
    '<h3>&#x2713; ДДС виджет задеплоен</h3>' +
    '<p>Откройте через дашборд Аспро.Cloud.<br>' +
    'Вставьте этот URL в поле <b>iframe.src</b> манифеста.</p>' +
    '</body></html>'
  );
};
 
function widgetHTML(domain, accessToken, accountId) {
  var d  = esc(domain);
  var t  = esc(accessToken);
  var id = esc(accountId);
 
  return '<!DOCTYPE html>\n' +
'<html lang="ru">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
'<title>ДДС</title>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0}\n' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;background:#f8f9fd;color:#111827;padding:12px}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="root" style="color:#9ca3af;font-size:12px">ДДС — загрузка\u2026</div>\n' +
'<script>\n' +
'var DOMAIN="' + d + '";\n' +
'var ACCESS_TOKEN="' + t + '";\n' +
'var ACCOUNT_ID="' + id + '";\n' +
'\n' +
'var VSIP_ACCS={"ВСИП - Альфа ВСИП":1,"ВСИП - ВСИП Депозиты":1,"ВСИП - Счет ВТБ":1,"ВСИП - Счет РХСБ":1,"ВСИП - Счет Сбербанк":1,"ВСИП - Счет Совкомбанк":1,"ВСИП - Расчетный счет  8876":1,"ВСИП - Расчетный счет 8876":1};\n' +
'var TT_ACCS={"ООО &quot;ТИМ-ТРЕЙД&quot; - Альфа ТТ (ВСИП)":1};\n' +
'var OFF_PROJ={24:1,26:1,27:1};\n' +
'var PROJ_NAMES={1:"Кемерово",3:"Южно-Сахалинск",13:"Барнаул",12:"Киров",23:"Сыктывкар",9:"Рузаевка",6:"Десногорск",100:"Центральный договор",101:"Прочие проекты"};\n' +
'var PROJ_ORDER=[1,3,13,12,23,9,6,100,101];\n' +
'var PROJ_GROUP={2:100,18:100,19:100,29:100,30:100,31:100,32:100,33:100,17:101,20:101,22:101};\n' +
'var ART_CAT={"Перевод между счетами (поступление)":"skip","Перевод между счетами (списание)":"skip","Получение кредита":"skip","Выплата кредита":"skip","Оказание услуг":"pjIn","Возврат ДС. за заказы":"refund","Проценты к получению":"pr","Зарплата":"zp","Командировки":"km","Страхование":"ins","Расходы на услуги банков":"bk","Прочее":"po","Аренда":"po","Бухгалтерия":"po","Интернет и связь":"po","Налоги и взносы":"po","Налоги - НДС":"po","Расходы на лизинг":"po","Проценты к уплате":"po","Оборудование":"po","Возвраты клиентам":"po","Нераспределенные":"po","Нераспределенные (списание)":"po","Тесты и испытания":"po","Услуги по сертификации":"po","Составление исполнительной документации":"po"};\n' +
'\n' +
'function fmt(v){if(!v&&v!==0)return"\u2014";if(v===0)return"\u2014";return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);}\n' +
'function parseNum(s){if(!s)return 0;return parseFloat(String(s).replace(/&nbsp;/g," ").replace(/&thinsp;/g," ").replace(/&#\\d+;/g,"").replace(/[^\\d,.\\-]/g,"").replace(",","."))||0;}\n' +
'function d2y(s){if(!s||s.length!==10)return"";return s.slice(6)+"-"+s.slice(3,5)+"-"+s.slice(0,2);}\n' +
'function getRange(){var now=new Date(),y=now.getFullYear(),m=now.getMonth(),p=function(n){return n<10?"0"+n:""+n;},end=Math.min(now.getDate(),new Date(y,m+1,0).getDate()),mo=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];return{ymd:y+"-"+p(m+1),start:y+"-"+p(m+1)+"-01",end:y+"-"+p(m+1)+"-"+p(end),firstDay:"01."+p(m+1)+"."+y,lastDay:p(end)+"."+p(m+1)+"."+y,label:mo[m]+" "+y};}\n' +
'\n' +
'function lsKey(ym){return"dds8_"+ACCOUNT_ID+"_"+ym;}\n' +
'function getFixed(ym){try{var s=localStorage.getItem(lsKey(ym));return s?JSON.parse(s):null;}catch(e){return null;}}\n' +
'function setFixed(ym,vsip,tt){try{localStorage.setItem(lsKey(ym),JSON.stringify({vsip:vsip,tt:tt}));}catch(e){}}\n' +
'function clearFixed(ym){try{localStorage.removeItem(lsKey(ym));}catch(e){}}\n' +
'\n' +
'function readBalance(group){var text="";try{text=window.parent.document.body.innerText||"";}catch(e){return null;}var m;if(group==="vsip"){m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*p\\.\\s*\\n\\s*ВСИП/);if(!m)m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*р\\.\\s*\\n\\s*ВСИП/);}else{m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*p\\.\\s*\\n\\s*ООО/);if(!m)m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*р\\.\\s*\\n\\s*ООО/);}return m?parseNum(m[1]):null;}\n' +
'\n' +
'function apiFetch(path,body){return fetch("https://"+DOMAIN+path,{method:"POST",credentials:"include",headers:{"Content-Type":"application/x-www-form-urlencoded","Authorization":"Bearer "+ACCESS_TOKEN},body:body}).then(function(r){return r.ok?r.json():Promise.reject("HTTP "+r.status);});}\n' +
'\n' +
'function buildReport(txRows,payinRows,range){\n' +
'  var txProjMap={};\n' +
'  (payinRows||[]).forEach(function(row){var idM=String(row[0]||"").match(/new_create_payin\\/(\\d+)/),pidM=String(row[8]||"").match(/project\\/(\\d+)/);if(idM&&pidM)txProjMap[+idM[1]]=+pidM[1];});\n' +
'  var pr=0,zp=0,km=0,bk=0,ins=0,po=0,pjIn=0,pjOut=0,refund=0,pjInByProj={},pjOutByProj={},vsipNetto=0,ttNetto=0;\n' +
'  txRows.forEach(function(row){\n' +
'    var dt=d2y(row[0]);if(!dt||dt<range.start||dt>range.end)return;\n' +
'    var inc=parseNum(row[1]),out=parseNum(row[2]),acc=row[8],art=row[9];\n' +
'    var isVsip=!!VSIP_ACCS[acc],isTT=!!TT_ACCS[acc];\n' +
'    if(!isVsip&&!isTT)return;\n' +
'    if(isVsip)vsipNetto+=inc-out;if(isTT)ttNetto+=inc-out;\n' +
'    var txIdM=String(row[12]||"").match(/\\/(\\d+)$/),txId=txIdM?+txIdM[1]:0;\n' +
'    var rawPid=txId?txProjMap[txId]:0,pid=(rawPid&&PROJ_GROUP[rawPid])?PROJ_GROUP[rawPid]:rawPid;\n' +
'    var pidOk=pid&&!!PROJ_NAMES[pid],pidOff=rawPid&&!!OFF_PROJ[rawPid];\n' +
'    var cat=ART_CAT[art];if(cat==="skip")return;\n' +
'    if(inc>0){if(cat==="pr")pr+=inc;else if(cat==="pjIn"&&pidOk){pjIn+=inc;pjInByProj[pid]=(pjInByProj[pid]||0)+inc;}else if(cat==="refund"&&pidOk)refund+=inc;}\n' +
'    if(out>0){if(cat==="zp")zp+=out;else if(cat==="km")km+=out;else if(cat==="ins")ins+=out;else if(cat==="bk")bk+=out;else if(cat==="po")po+=out;else if(!pidOff){pjOut+=out;if(pid&&pidOk)pjOutByProj[pid]=(pjOutByProj[pid]||0)+out;}}\n' +
'  });\n' +
'  var vsipEnd=readBalance("vsip"),ttEnd=readBalance("tt");\n' +
'  var fixed=getFixed(range.ymd),vsipStart,ttStart;\n' +
'  if(fixed){vsipStart=fixed.vsip;ttStart=fixed.tt;if(vsipEnd===null)vsipEnd=vsipStart+vsipNetto;if(ttEnd===null)ttEnd=ttStart+ttNetto;}\n' +
'  else if(vsipEnd!==null&&ttEnd!==null){vsipStart=vsipEnd-vsipNetto;ttStart=ttEnd-ttNetto;setFixed(range.ymd,vsipStart,ttStart);}\n' +
'  else{vsipStart=0;ttStart=0;vsipEnd=vsipNetto;ttEnd=ttNetto;}\n' +
'  var te=pjOut+zp+km+bk+ins+po;\n' +
'  return{vsipStart:vsipStart,ttStart:ttStart,vsipEnd:vsipEnd,ttEnd:ttEnd,totalStart:vsipStart+ttStart,totalEnd:(vsipEnd||0)+(ttEnd||0),pr:pr,pjIn:pjIn,refund:refund,pjOut:pjOut,zp:zp,km:km,bk:bk,ins:ins,po:po,te:te,pjInByProj:pjInByProj,pjOutByProj:pjOutByProj,cnt:txRows.length,firstDay:range.firstDay,lastDay:range.lastDay,label:range.label,ymd:range.ymd};\n' +
'}\n' +
'\n' +
'function TR(l,v,o){o=o||{};var n=fmt(v),c=o.color||(o.green&&v>0?"#16a34a":o.negRed&&v<0?"#dc2626":"");if(o.muted)c="#9ca3af";var s2="text-align:right;white-space:nowrap;padding:5px 6px;font-size:12px;"+(c?"color:"+c+";":""),s1="padding:5px 6px;font-size:12px;"+(o.indent?"padding-left:18px;":""),sr=(o.sep?"border-top:1px solid #e5e7eb;":"")+(o.bold?"font-weight:600;":"");return\'<tr style="\'+sr+\'"><td style="\'+s1+\'">\'+l+\'</td><td style="\'+s2+\'">\'+n+\'</td></tr>\';}\n' +
'function SEC(t){return\'<tr><td colspan="2" style="padding:9px 6px 3px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-top:1px solid #e5e7eb;">\'+t+\'</td></tr>\';}\n' +
'\n' +
'function renderHTML(r,live){\n' +
'  var rows=[],totalIn=0;\n' +
'  rows.push(TR("Остаток "+r.firstDay+" \u00b7 ВСИП",r.vsipStart));\n' +
'  rows.push(TR("Остаток "+r.firstDay+" \u00b7 ТТ",r.ttStart,{negRed:true}));\n' +
'  rows.push(TR("ИТОГО на "+r.firstDay,r.totalStart,{bold:true,sep:true}));\n' +
'  rows.push(TR("Остаток "+r.lastDay+" \u00b7 ВСИП",r.vsipEnd));\n' +
'  rows.push(TR("Остаток "+r.lastDay+" \u00b7 ТТ",r.ttEnd,{negRed:true}));\n' +
'  rows.push(TR("ИТОГО на "+r.lastDay,r.totalEnd,{bold:true,sep:true,green:true}));\n' +
'  rows.push(SEC("Поступления"));\n' +
'  var hasPjIn=Object.keys(r.pjInByProj).length>0;\n' +
'  if(hasPjIn){PROJ_ORDER.forEach(function(pid){var v=r.pjInByProj[pid];if(v){rows.push(TR(PROJ_NAMES[pid],v,{green:true,indent:true}));totalIn+=v;}});}\n' +
'  else if(r.pjIn){rows.push(TR("Поступления по проектам",r.pjIn,{green:true,indent:true}));totalIn+=r.pjIn;}\n' +
'  if(r.pr){rows.push(TR("Процентные доходы",r.pr,{green:true,indent:true}));totalIn+=r.pr;}\n' +
'  if(r.refund){rows.push(TR("Возвраты",r.refund,{green:true,indent:true}));totalIn+=r.refund;}\n' +
'  rows.push(TR("Итого поступлений",totalIn,{bold:true,sep:true,green:true}));\n' +
'  rows.push(SEC("Расходы по проектам"));\n' +
'  var hasPjOut=Object.keys(r.pjOutByProj).length>0;\n' +
'  if(hasPjOut){PROJ_ORDER.forEach(function(pid){var v=r.pjOutByProj[pid]||0;rows.push(TR(PROJ_NAMES[pid],v,{indent:true,muted:!v}));});}\n' +
'  rows.push(TR("Итого проекты",r.pjOut,{bold:true,sep:hasPjOut}));\n' +
'  rows.push(SEC("Офисные расходы"));\n' +
'  rows.push(TR("Зарплата",r.zp,{indent:true,muted:!r.zp}));\n' +
'  rows.push(TR("Командировочные",r.km,{indent:true,muted:!r.km}));\n' +
'  rows.push(TR("Страхование",r.ins,{indent:true,muted:!r.ins}));\n' +
'  rows.push(TR("Банковские комиссии",r.bk,{indent:true,muted:!r.bk}));\n' +
'  rows.push(TR("Прочие расходы офиса",r.po,{indent:true,muted:!r.po}));\n' +
'  rows.push(TR("ВСЕГО РАСХОДОВ",r.te,{bold:true,sep:true}));\n' +
'  var ctrl=r.totalStart+totalIn-r.te-r.totalEnd,cOk=Math.abs(ctrl)<1;\n' +
'  rows.push(TR(cOk?"Контрольная сумма":"Контрольная сумма \u26a0",ctrl,{sep:true,color:cOk?"#16a34a":"#dc2626"}));\n' +
'  var st=live?"<span style=\\"color:#16a34a\\">\u25cf live \u00b7 "+r.cnt+" \u0442\u0440.</span>":"<span style=\\"color:#9ca3af\\">данные на "+r.lastDay+"</span>";\n' +
'  return "<div style=\\"display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;\\"><div><div style=\\"font-size:14px;font-weight:600;\\">ДДС \u2014 "+r.label+"</div><div style=\\"font-size:11px;color:#9ca3af;margin-top:2px;\\">"+r.firstDay+" \u2014 "+r.lastDay+"</div></div><div style=\\"display:flex;align-items:center;gap:6px;flex-shrink:0;\\"><span id=\\"dds-status\\" style=\\"font-size:11px;\\">"+st+"</span><button id=\\"dds-btn\\" style=\\"background:none;border:1px solid #d1d5db;color:#6b7280;font-size:10px;padding:2px 8px;border-radius:4px;cursor:pointer;\\">\u21bb</button><button id=\\"dds-reset\\" style=\\"background:none;border:1px solid #d1d5db;color:#9ca3af;font-size:10px;padding:2px 6px;border-radius:4px;cursor:pointer;\\">\u21b3\u2080</button></div></div><table style=\\"width:100%;border-collapse:collapse;\\">"+rows.join("")+"</table><div style=\\"margin-top:8px;font-size:10px;color:#9ca3af;\\">обновлено: "+new Date().toLocaleTimeString("ru-RU")+"</div>";\n' +
'}\n' +
'\n' +
'function loadData(resetStart){\n' +
'  var d=document.getElementById("root"),range=getRange();\n' +
'  if(resetStart)clearFixed(range.ymd);\n' +
'  var st=document.getElementById("dds-status");\n' +
'  if(st){st.textContent="загрузка\u2026";st.style.color="#9ca3af";}\n' +
'  var body="sort=date&order=asc&offset=0&limit=2500";\n' +
'  Promise.all([\n' +
'    apiFetch("/_module/fin/rest/transaction/list/",body),\n' +
'    apiFetch("/_module/fin/rest/payin/list/",body).catch(function(){return null;})\n' +
'  ]).then(function(res){\n' +
'    var rows=res[0].data||[];\n' +
'    if(rows.length>0){var rep=buildReport(rows,res[1]?res[1].data:[],range);d.innerHTML=renderHTML(rep,true);}\n' +
'    else{d.innerHTML="<div style=\\"padding:12px;color:#9ca3af;font-size:12px;\\">Нет данных за "+range.label+"</div>";}\n' +
'    var btn=document.getElementById("dds-btn");if(btn)btn.onclick=function(){loadData(false);};\n' +
'    var rst=document.getElementById("dds-reset");if(rst)rst.onclick=function(){loadData(true);};\n' +
'  }).catch(function(err){\n' +
'    var st2=document.getElementById("dds-status");\n' +
'    if(st2){st2.textContent="ошибка "+err;st2.style.color="#dc2626";}\n' +
'    else{d.innerHTML="<div style=\\"padding:12px;color:#dc2626;font-size:12px;\\">Ошибка: "+err+"<br><small>domain:"+DOMAIN+" token:"+(!!ACCESS_TOKEN)+"</small></div>";}\n' +
'    console.error("[DDS]",err,"domain:",DOMAIN,"token:",!!ACCESS_TOKEN);\n' +
'  });\n' +
'}\n' +
'\n' +
'loadData(false);\n' +
'setInterval(function(){loadData(false);},5*60*1000);\n' +
'console.log("[DDS widget] started | domain:",DOMAIN,"| token:",!!ACCESS_TOKEN);\n' +
'</script>\n' +
'</body>\n' +
'</html>';
}
