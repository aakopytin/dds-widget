// api/index.js — Vercel Serverless Function
// Аспро открывает iframe через POST-форму и передаёт auth[access_token].
// Функция читает токен из тела запроса и отдаёт готовый HTML виджета.

// Отключаем bodyParser — будем читать сырое тело и парсить вручную
export const config = {
  api: { bodyParser: false }
};

// Читаем сырое тело запроса
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}

// Парсим application/x-www-form-urlencoded вручную
function parseForm(body) {
  const result = {};
  if (!body) return result;
  body.split('&').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '));
    const val = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
    result[key] = val;
  });
  return result;
}

export default async function handler(req, res) {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'POST') {
    const rawBody = await readBody(req);
    const fields  = parseForm(rawBody);

    const domain      = fields['domain']              || '';
    const accessToken = fields['auth[access_token]']  || '';
    const accountId   = fields['account[id]']         || '';

    // Для отладки — логируем полученные поля (без токена)
    console.log('[DDS] POST received, domain:', domain, 'accountId:', accountId, 'hasToken:', !!accessToken);

    return res.status(200).send(widgetHTML(domain, accessToken, accountId));
  }

  // GET — показываем статус деплоя
  return res.status(200).send(
    '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;color:#444">' +
    '<h3>✓ ДДС виджет задеплоен</h3>' +
    '<p>Откройте через дашборд Аспро.Cloud.<br>' +
    'Этот URL вставьте в поле <b>iframe.src</b> манифеста.</p>' +
    '</body></html>'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTML ВИДЖЕТА
// ═══════════════════════════════════════════════════════════════════════════════
function widgetHTML(domain, accessToken, accountId) {
  const d  = esc(domain);
  const t  = esc(accessToken);
  const id = esc(accountId);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ДДС</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;background:#f8f9fd;color:#111827;padding:12px}
</style>
</head>
<body>
<div id="root" style="color:#9ca3af;font-size:12px">ДДС — загрузка…</div>
<script>
var DOMAIN       = '${d}';
var ACCESS_TOKEN = '${t}';
var ACCOUNT_ID   = '${id}';

// ── Константы (идентичны dds_tm_v8.js) ───────────────────────────────────────
var VSIP_ACCS={'ВСИП - Альфа ВСИП':1,'ВСИП - ВСИП Депозиты':1,'ВСИП - Счет ВТБ':1,'ВСИП - Счет РХСБ':1,'ВСИП - Счет Сбербанк':1,'ВСИП - Счет Совкомбанк':1,'ВСИП - Расчетный счет  8876':1,'ВСИП - Расчетный счет 8876':1};
var TT_ACCS={'ООО &quot;ТИМ-ТРЕЙД&quot; - Альфа ТТ (ВСИП)':1};
var OFF_PROJ={24:1,26:1,27:1};
var PROJ_NAMES={1:'Кемерово',3:'Южно-Сахалинск',13:'Барнаул',12:'Киров',23:'Сыктывкар',9:'Рузаевка',6:'Десногорск',100:'Центральный договор',101:'Прочие проекты'};
var PROJ_ORDER=[1,3,13,12,23,9,6,100,101];
var PROJ_GROUP={2:100,18:100,19:100,29:100,30:100,31:100,32:100,33:100,17:101,20:101,22:101};
var ART_CAT={'Перевод между счетами (поступление)':'skip','Перевод между счетами (списание)':'skip','Получение кредита':'skip','Выплата кредита':'skip','Оказание услуг':'pjIn','Возврат ДС. за заказы':'refund','Проценты к получению':'pr','Зарплата':'zp','Командировки':'km','Страхование':'ins','Расходы на услуги банков':'bk','Прочее':'po','Аренда':'po','Бухгалтерия':'po','Интернет и связь':'po','Налоги и взносы':'po','Налоги - НДС':'po','Расходы на лизинг':'po','Проценты к уплате':'po','Оборудование':'po','Возвраты клиентам':'po','Нераспределенные':'po','Нераспределенные (списание)':'po','Тесты и испытания':'po','Услуги по сертификации':'po','Составление исполнительной документации':'po'};

// ── Утилиты ───────────────────────────────────────────────────────────────────
function fmt(v){if(!v&&v!==0||v===0)return'—';return new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);}
function parseNum(s){if(!s)return 0;return parseFloat(String(s).replace(/&nbsp;/g,' ').replace(/&thinsp;/g,' ').replace(/&#\\d+;/g,'').replace(/[^\\d,.\\-]/g,'').replace(',','.'))||0;}
function d2y(s){if(!s||s.length!==10)return'';return s.slice(6)+'-'+s.slice(3,5)+'-'+s.slice(0,2);}
function getRange(){var now=new Date(),y=now.getFullYear(),m=now.getMonth(),p=function(n){return n<10?'0'+n:''+n;},end=Math.min(now.getDate(),new Date(y,m+1,0).getDate()),mo=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];return{ymd:y+'-'+p(m+1),start:y+'-'+p(m+1)+'-01',end:y+'-'+p(m+1)+'-'+p(end),firstDay:'01.'+p(m+1)+'.'+y,lastDay:p(end)+'.'+p(m+1)+'.'+y,label:mo[m]+' '+y};}

// ── localStorage ──────────────────────────────────────────────────────────────
function lsKey(ym){return'dds8_'+ACCOUNT_ID+'_'+ym;}
function getFixed(ym){try{var s=localStorage.getItem(lsKey(ym));return s?JSON.parse(s):null;}catch(e){return null;}}
function setFixed(ym,vsip,tt){try{localStorage.setItem(lsKey(ym),JSON.stringify({vsip:vsip,tt:tt}));}catch(e){}}
function clearFixed(ym){try{localStorage.removeItem(lsKey(ym));}catch(e){}}

// ── Остатки из DOM родителя ────────────────────────────────────────────────────
function readBalance(group){
  var text='';
  try{text=window.parent.document.body.innerText||'';}catch(e){return null;}
  var m;
  if(group==='vsip'){m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*p\\.\\s*\\n\\s*ВСИП/);if(!m)m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*р\\.\\s*\\n\\s*ВСИП/);}
  else{m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*p\\.\\s*\\n\\s*ООО/);if(!m)m=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*р\\.\\s*\\n\\s*ООО/);}
  return m?parseNum(m[1]):null;
}

// ── API fetch с токеном ────────────────────────────────────────────────────────
function apiFetch(path,body){
  return fetch('https://'+DOMAIN+path,{
    method:'POST',
    credentials:'include',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'Authorization':'Bearer '+ACCESS_TOKEN
    },
    body:body
  }).then(function(r){return r.ok?r.json():Promise.reject('HTTP '+r.status);});
}

// ── Построение отчёта (идентично dds_tm_v8.js) ───────────────────────────────
function buildReport(txRows,payinRows,range){
  var txProjMap={};
  (payinRows||[]).forEach(function(row){var idM=String(row[0]||'').match(/new_create_payin\\/(\\d+)/),pidM=String(row[8]||'').match(/project\\/(\\d+)/);if(idM&&pidM)txProjMap[+idM[1]]=+pidM[1];});
  var pr=0,zp=0,km=0,bk=0,ins=0,po=0,pjIn=0,pjOut=0,refund=0,pjInByProj={},pjOutByProj={},vsipNetto=0,ttNetto=0;
  txRows.forEach(function(row){
    var dt=d2y(row[0]);if(!dt||dt<range.start||dt>range.end)return;
    var inc=parseNum(row[1]),out=parseNum(row[2]),acc=row[8],art=row[9];
    var isVsip=!!VSIP_ACCS[acc],isTT=!!TT_ACCS[acc];
    if(!isVsip&&!isTT)return;
    if(isVsip)vsipNetto+=inc-out;if(isTT)ttNetto+=inc-out;
    var txIdM=String(row[12]||'').match(/\\/(\\d+)$/),txId=txIdM?+txIdM[1]:0;
    var rawPid=txId?txProjMap[txId]:0,pid=(rawPid&&PROJ_GROUP[rawPid])?PROJ_GROUP[rawPid]:rawPid;
    var pidOk=pid&&!!PROJ_NAMES[pid],pidOff=rawPid&&!!OFF_PROJ[rawPid];
    var cat=ART_CAT[art];if(cat==='skip')return;
    if(inc>0){if(cat==='pr')pr+=inc;else if(cat==='pjIn'&&pidOk){pjIn+=inc;pjInByProj[pid]=(pjInByProj[pid]||0)+inc;}else if(cat==='refund'&&pidOk)refund+=inc;}
    if(out>0){if(cat==='zp')zp+=out;else if(cat==='km')km+=out;else if(cat==='ins')ins+=out;else if(cat==='bk')bk+=out;else if(cat==='po')po+=out;else if(!pidOff){pjOut+=out;if(pid&&pidOk)pjOutByProj[pid]=(pjOutByProj[pid]||0)+out;}}
  });
  var vsipEnd=readBalance('vsip'),ttEnd=readBalance('tt');
  var fixed=getFixed(range.ymd),vsipStart,ttStart;
  if(fixed){vsipStart=fixed.vsip;ttStart=fixed.tt;if(vsipEnd===null)vsipEnd=vsipStart+vsipNetto;if(ttEnd===null)ttEnd=ttStart+ttNetto;}
  else if(vsipEnd!==null&&ttEnd!==null){vsipStart=vsipEnd-vsipNetto;ttStart=ttEnd-ttNetto;setFixed(range.ymd,vsipStart,ttStart);}
  else{vsipStart=0;ttStart=0;vsipEnd=vsipNetto;ttEnd=ttNetto;}
  var te=pjOut+zp+km+bk+ins+po;
  return{vsipStart:vsipStart,ttStart:ttStart,vsipEnd:vsipEnd,ttEnd:ttEnd,totalStart:vsipStart+ttStart,totalEnd:(vsipEnd||0)+(ttEnd||0),pr:pr,pjIn:pjIn,refund:refund,pjOut:pjOut,zp:zp,km:km,bk:bk,ins:ins,po:po,te:te,pjInByProj:pjInByProj,pjOutByProj:pjOutByProj,cnt:txRows.length,firstDay:range.firstDay,lastDay:range.lastDay,label:range.label,ymd:range.ymd};
}

// ── HTML таблица (идентично dds_tm_v8.js) ────────────────────────────────────
function TR(label,val,opts){opts=opts||{};var num=fmt(val),c=opts.color||(opts.green&&val>0?'#16a34a':opts.negRed&&val<0?'#dc2626':'');if(opts.muted)c='#9ca3af';var s2='text-align:right;white-space:nowrap;padding:5px 6px;font-size:12px;'+(c?'color:'+c+';':''),s1='padding:5px 6px;font-size:12px;'+(opts.indent?'padding-left:18px;':''),sr=(opts.sep?'border-top:1px solid #e5e7eb;':'')+(opts.bold?'font-weight:600;':'');return'<tr style="'+sr+'"><td style="'+s1+'">'+label+'</td><td style="'+s2+'">'+num+'</td></tr>';}
function SEC(txt){return'<tr><td colspan="2" style="padding:9px 6px 3px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-top:1px solid #e5e7eb;">'+txt+'</td></tr>';}

function renderHTML(r,live){
  var rows=[],totalIn=0;
  rows.push(TR('Остаток '+r.firstDay+' · ВСИП',r.vsipStart));
  rows.push(TR('Остаток '+r.firstDay+' · ТТ',r.ttStart,{negRed:true}));
  rows.push(TR('ИТОГО на '+r.firstDay,r.totalStart,{bold:true,sep:true}));
  rows.push(TR('Остаток '+r.lastDay+' · ВСИП',r.vsipEnd));
  rows.push(TR('Остаток '+r.lastDay+' · ТТ',r.ttEnd,{negRed:true}));
  rows.push(TR('ИТОГО на '+r.lastDay,r.totalEnd,{bold:true,sep:true,green:true}));
  rows.push(SEC('Поступления'));
  var hasPjIn=Object.keys(r.pjInByProj).length>0;
  if(hasPjIn){PROJ_ORDER.forEach(function(pid){var v=r.pjInByProj[pid];if(v){rows.push(TR(PROJ_NAMES[pid],v,{green:true,indent:true}));totalIn+=v;}});}
  else if(r.pjIn){rows.push(TR('Поступления по проектам',r.pjIn,{green:true,indent:true}));totalIn+=r.pjIn;}
  if(r.pr){rows.push(TR('Процентные доходы',r.pr,{green:true,indent:true}));totalIn+=r.pr;}
  if(r.refund){rows.push(TR('Возвраты',r.refund,{green:true,indent:true}));totalIn+=r.refund;}
  rows.push(TR('Итого поступлений',totalIn,{bold:true,sep:true,green:true}));
  rows.push(SEC('Расходы по проектам'));
  var hasPjOut=Object.keys(r.pjOutByProj).length>0;
  if(hasPjOut){PROJ_ORDER.forEach(function(pid){var v=r.pjOutByProj[pid]||0;rows.push(TR(PROJ_NAMES[pid],v,{indent:true,muted:!v}));});}
  rows.push(TR('Итого проекты',r.pjOut,{bold:true,sep:hasPjOut}));
  rows.push(SEC('Офисные расходы'));
  rows.push(TR('Зарплата',r.zp,{indent:true,muted:!r.zp}));
  rows.push(TR('Командировочные',r.km,{indent:true,muted:!r.km}));
  rows.push(TR('Страхование',r.ins,{indent:true,muted:!r.ins}));
  rows.push(TR('Банковские комиссии',r.bk,{indent:true,muted:!r.bk}));
  rows.push(TR('Прочие расходы офиса',r.po,{indent:true,muted:!r.po}));
  rows.push(TR('ВСЕГО РАСХОДОВ',r.te,{bold:true,sep:true}));
  var ctrl=r.totalStart+totalIn-r.te-r.totalEnd,cOk=Math.abs(ctrl)<1;
  rows.push(TR(cOk?'Контрольная сумма':'Контрольная сумма ⚠',ctrl,{sep:true,color:cOk?'#16a34a':'#dc2626'}));
  var st=live?'<span style="color:#16a34a">● live · '+r.cnt+' тр.</span>':'<span style="color:#9ca3af">данные на '+r.lastDay+'</span>';
  return '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;"><div><div style="font-size:14px;font-weight:600;">ДДС — '+r.label+'</div><div style="font-size:11px;color:#9ca3af;margin-top:2px;">'+r.firstDay+' — '+r.lastDay+'</div></div><div style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><span id="dds-status" style="font-size:11px;">'+st+'</span><button id="dds-btn" style="background:none;border:1px solid #d1d5db;color:#6b7280;font-size:10px;padding:2px 8px;border-radius:4px;cursor:pointer;">↻</button><button id="dds-reset" style="background:none;border:1px solid #d1d5db;color:#9ca3af;font-size:10px;padding:2px 6px;border-radius:4px;cursor:pointer;">⟳₀</button></div></div><table style="width:100%;border-collapse:collapse;">'+rows.join('')+'</table><div style="margin-top:8px;font-size:10px;color:#9ca3af;">обновлено: '+new Date().toLocaleTimeString('ru-RU')+'</div>';
}

// ── Загрузка ──────────────────────────────────────────────────────────────────
function loadData(resetStart){
  var d=document.getElementById('root'),range=getRange();
  if(resetStart)clearFixed(range.ymd);
  var st=document.getElementById('dds-status');
  if(st){st.textContent='загрузка…';st.style.color='#9ca3af';}
  var body='sort=date&order=asc&offset=0&limit=2500';
  Promise.all([
    apiFetch('/_module/fin/rest/transaction/list/',body),
    apiFetch('/_module/fin/rest/payin/list/',body).catch(function(){return null;})
  ]).then(function(res){
    var rows=res[0].data||[];
    if(rows.length>0){
      var rep=buildReport(rows,res[1]?res[1].data:[],range);
      d.innerHTML=renderHTML(rep,true);
    }else{
      d.innerHTML='<div style="padding:12px;color:#9ca3af;font-size:12px;">Нет данных за '+range.label+'</div>';
    }
    var btn=document.getElementById('dds-btn');if(btn)btn.onclick=function(){loadData(false);};
    var rst=document.getElementById('dds-reset');if(rst)rst.onclick=function(){loadData(true);};
  }).catch(function(err){
    var st2=document.getElementById('dds-status');
    if(st2){st2.textContent='ошибка '+err;st2.style.color='#dc2626';}
    else{d.innerHTML='<div style="padding:12px;color:#dc2626;font-size:12px;">Ошибка: '+err+'<br><small>domain:'+DOMAIN+' token:'+(!!ACCESS_TOKEN)+'</small></div>';}
    console.error('[DDS]',err,'domain:',DOMAIN,'token:',!!ACCESS_TOKEN);
  });
}

loadData(false);
setInterval(function(){loadData(false);},5*60*1000);
console.log('[DDS widget] started | domain:',DOMAIN,'| token:',!!ACCESS_TOKEN);
</script>
</body>
</html>`;
}

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}
