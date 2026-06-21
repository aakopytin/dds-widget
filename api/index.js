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
    var domain    = fields['domain']    || '';
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

function widgetHTML(domain, accountId) {
  var d  = esc(domain);
  var id = esc(accountId);

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
var DOMAIN='${d}';
var ACCOUNT_ID='${id}';

// ── Константы (идентичны dds_tm_v8.js) ───────────────────────────────────────
// Фильтрация по именам счетов и статьям учёта
var VSIP_NAMES={'Альфа ВСИП':1,'ВСИП Депозиты':1,'Счет ВТБ':1,'Счет РХСБ':1,'Счет Сбербанк':1,'Расчетный счет 9637':1};
var TT_NAMES={'Альфа ТТ (ВСИП)':1};
var OFF_PROJ={24:1,26:1,27:1};
var PROJ_NAMES={1:'Кемерово',3:'Южно-Сахалинск',13:'Барнаул',12:'Киров',23:'Сыктывкар',9:'Рузаевка',6:'Десногорск',100:'Центральный договор',101:'Прочие проекты'};
var PROJ_ORDER=[1,3,13,12,23,9,6,100,101];
var PROJ_GROUP={2:100,18:100,19:100,29:100,30:100,31:100,32:100,33:100,17:101,20:101,22:101};
var ART_CAT={
  // Переводы — пропускаем
  'Перевод между счетами (поступление)':'skip',
  'Перевод между счетами (списание)':'skip',
  'Получение кредита':'skip','Выплата кредита':'skip',
  // Поступления
  'Оказание услуг':'pjIn','Возврат ДС. за заказы':'refund','Проценты к получению':'pr',
  // Офисные расходы
  'Зарплата':'zp','Командировки':'km','Страхование':'ins','Расходы на услуги банков':'bk',
  'Налоги и взносы':'po','Налоги - НДС':'po',
  'Прочее':'po','Аренда':'po','Бухгалтерия':'po','Интернет и связь':'po',
  'Расходы на лизинг':'po','Проценты к уплате':'po','Оборудование':'po',
  'Возвраты клиентам':'po','Нераспределенные':'po','Нераспределенные (списание)':'po',
  'Тесты и испытания':'po','Услуги по сертификации':'po',
  'Составление исполнительной документации':'po',
  // Новые статьи из API (расходы по проектам)
  'СМР (Без детализации)':'pjOut',
  'СМР Вент+кондиц':'pjOut',
  'Материалы (Вентиляция)':'pjOut',
  'Материалы (Отопление)':'pjOut',
  'Материалы (Потолки)':'pjOut',
  'Материалы (Проемы)':'pjOut',
  'Материалы (Стены)':'pjOut',
  'Материалы (Транспорт, Логистика)':'pjOut',
  'Материалы (Электрика)':'pjOut',
  'Материалы черновые':'pjOut',
  'Проектирование-Изыскание':'pjOut'
};

// ── Утилиты ───────────────────────────────────────────────────────────────────
function fmt(v){if(!v&&v!==0||v===0)return'—';return new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);}
function parseNum(s){if(!s)return 0;return parseFloat(String(s).replace(/[^\\d.\\-]/g,''))||0;}
function getRange(){
  var now=new Date(),y=now.getFullYear(),m=now.getMonth();
  var p=function(n){return n<10?'0'+n:''+n;};
  var end=Math.min(now.getDate(),new Date(y,m+1,0).getDate());
  var mo=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  return{
    ymd:y+'-'+p(m+1),
    startDate:y+'-'+p(m+1)+'-01',
    endDate:y+'-'+p(m+1)+'-'+p(end),
    firstDay:'01.'+p(m+1)+'.'+y,
    lastDay:p(end)+'.'+p(m+1)+'.'+y,
    label:mo[m]+' '+y
  };
}

function lsKey(ym){return'dds8_'+ACCOUNT_ID+'_'+ym;}
function getFixed(ym){try{var s=localStorage.getItem(lsKey(ym));return s?JSON.parse(s):null;}catch(e){return null;}}
function setFixed(ym,vsip,tt){try{localStorage.setItem(lsKey(ym),JSON.stringify({vsip:vsip,tt:tt}));}catch(e){}}
function clearFixed(ym){try{localStorage.removeItem(lsKey(ym));}catch(e){}}

// ── Запросы через серверный прокси /api/data ──────────────────────────────────
function loadEntity(entity){
  return fetch('/api/data',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({domain:DOMAIN,entity:entity})
  }).then(function(r){return r.ok?r.json():Promise.reject('HTTP '+r.status);})
    .then(function(d){return d.items||[];});
}

// ── Построение отчёта ─────────────────────────────────────────────────────────
function buildReport(txItems, accountItems, catItems, range){
  // Строим карты: id → name для счетов и статей
  var accountMap={};
  accountItems.forEach(function(a){ accountMap[a.id]=a.name||''; });

  var catMap={};
  catItems.forEach(function(c){ catMap[c.id]=c.name||''; });

  var pr=0,zp=0,km=0,bk=0,ins=0,po=0,pjIn=0,pjOut=0,refund=0;
  var pjInByProj={},pjOutByProj={};
  var vsipNetto=0,ttNetto=0;

  txItems.forEach(function(tx){
    // Фильтр по дате
    var date=tx.date||'';
    if(!date||date<range.startDate||date>range.endDate)return;

    var inc=parseNum(tx.income)||0;
    var out=parseNum(tx.outcome)||0;
    var accName=accountMap[tx.org_account_id]||'';
    var catName=catMap[tx.category_id]||'';
    var projId=tx.project_id||0;

    var isVsip=!!VSIP_NAMES[accName];
    var isTT=!!TT_NAMES[accName];
    if(!isVsip&&!isTT)return;

    if(isVsip)vsipNetto+=inc-out;
    if(isTT)ttNetto+=inc-out;

    // Группировка проекта
    var rawPid=projId;
    var pid=(rawPid&&PROJ_GROUP[rawPid])?PROJ_GROUP[rawPid]:rawPid;
    var pidOk=pid&&!!PROJ_NAMES[pid];
    var pidOff=rawPid&&!!OFF_PROJ[rawPid];

    var cat=ART_CAT[catName];
    if(cat==='skip')return;

    if(inc>0){
      if(cat==='pr')pr+=inc;
      else if(cat==='pjIn'&&pidOk){pjIn+=inc;pjInByProj[pid]=(pjInByProj[pid]||0)+inc;}
      else if(cat==='refund'&&pidOk)refund+=inc;
    }
    if(out>0){
      if(cat==='zp')zp+=out;
      else if(cat==='km')km+=out;
      else if(cat==='ins')ins+=out;
      else if(cat==='bk')bk+=out;
      else if(cat==='po')po+=out;
      else if(!pidOff){pjOut+=out;if(pid&&pidOk)pjOutByProj[pid]=(pjOutByProj[pid]||0)+out;}
    }
  });

  // Остатки из DOM родителя (если same-origin)
  var vsipEnd=null,ttEnd=null;
  try{
    var text=window.parent.document.body.innerText||'';
    var mv=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*p\\.\\s*\\n\\s*ВСИП/)||text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*р\\.\\s*\\n\\s*ВСИП/);
    var mt=text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*p\\.\\s*\\n\\s*ООО/)||text.match(/([-\\d][\\d\\s\\u00a0]*(?:,\\d+)?)\\s*р\\.\\s*\\n\\s*ООО/);
    if(mv)vsipEnd=parseNum(mv[1].replace(/[\\s\\u00a0]/g,'').replace(',','.'));
    if(mt)ttEnd=parseNum(mt[1].replace(/[\\s\\u00a0]/g,'').replace(',','.'));
  }catch(e){}

  var fixed=getFixed(range.ymd),vsipStart,ttStart;
  if(fixed){
    vsipStart=fixed.vsip;ttStart=fixed.tt;
    if(vsipEnd===null)vsipEnd=vsipStart+vsipNetto;
    if(ttEnd===null)ttEnd=ttStart+ttNetto;
  }else if(vsipEnd!==null&&ttEnd!==null){
    vsipStart=vsipEnd-vsipNetto;ttStart=ttEnd-ttNetto;
    setFixed(range.ymd,vsipStart,ttStart);
  }else{
    vsipStart=0;ttStart=0;
    vsipEnd=vsipNetto;ttEnd=ttNetto;
  }

  var te=pjOut+zp+km+bk+ins+po;
  return{
    vsipStart:vsipStart,ttStart:ttStart,vsipEnd:vsipEnd,ttEnd:ttEnd,
    totalStart:vsipStart+ttStart,totalEnd:(vsipEnd||0)+(ttEnd||0),
    pr:pr,pjIn:pjIn,refund:refund,
    pjOut:pjOut,zp:zp,km:km,bk:bk,ins:ins,po:po,te:te,
    pjInByProj:pjInByProj,pjOutByProj:pjOutByProj,
    cnt:txItems.length,
    firstDay:range.firstDay,lastDay:range.lastDay,label:range.label,ymd:range.ymd
  };
}

// ── HTML таблица ──────────────────────────────────────────────────────────────
function TR(l,v,o){o=o||{};var n=fmt(v),c=o.color||(o.green&&v>0?'#16a34a':o.negRed&&v<0?'#dc2626':'');if(o.muted)c='#9ca3af';var s2='text-align:right;white-space:nowrap;padding:5px 6px;font-size:12px;'+(c?'color:'+c+';':''),s1='padding:5px 6px;font-size:12px;'+(o.indent?'padding-left:18px;':''),sr=(o.sep?'border-top:1px solid #e5e7eb;':'')+(o.bold?'font-weight:600;':'');return'<tr style="'+sr+'"><td style="'+s1+'">'+l+'</td><td style="'+s2+'">'+n+'</td></tr>';}
function SEC(t){return'<tr><td colspan="2" style="padding:9px 6px 3px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-top:1px solid #e5e7eb;">'+t+'</td></tr>';}

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
  return'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;"><div><div style="font-size:14px;font-weight:600;">ДДС — '+r.label+'</div><div style="font-size:11px;color:#9ca3af;margin-top:2px;">'+r.firstDay+' — '+r.lastDay+'</div></div><div style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><span id="dds-status" style="font-size:11px;">'+st+'</span><button id="dds-btn" style="background:none;border:1px solid #d1d5db;color:#6b7280;font-size:10px;padding:2px 8px;border-radius:4px;cursor:pointer;">↻</button><button id="dds-reset" style="background:none;border:1px solid #d1d5db;color:#9ca3af;font-size:10px;padding:2px 6px;border-radius:4px;cursor:pointer;">⟳₀</button></div></div><table style="width:100%;border-collapse:collapse;">'+rows.join('')+'</table><div style="margin-top:8px;font-size:10px;color:#9ca3af;">обновлено: '+new Date().toLocaleTimeString('ru-RU')+'</div>';
}

// ── Загрузка ──────────────────────────────────────────────────────────────────
function loadData(resetStart){
  var d=document.getElementById('root'),range=getRange();
  if(resetStart)clearFixed(range.ymd);
  var st=document.getElementById('dds-status');
  if(st){st.textContent='загрузка…';st.style.color='#9ca3af';}

  // Загружаем параллельно: транзакции + справочники счетов и статей
  Promise.all([
    loadEntity('transaction'),
    loadEntity('bank_account'),
    loadEntity('categories')
  ]).then(function(res){
    var txItems=res[0], accountItems=res[1], catItems=res[2];

    // Фильтруем транзакции по текущему месяцу
    var monthTx=txItems.filter(function(tx){
      return tx.date&&tx.date>=range.startDate&&tx.date<=range.endDate;
    });

    console.log('[DDS] tx total:',txItems.length,'month:',monthTx.length,'accounts:',accountItems.length,'cats:',catItems.length);

    if(monthTx.length>0){
      var rep=buildReport(monthTx,accountItems,catItems,range);

      var hasData=rep.pjIn||rep.pjOut||rep.pr||rep.zp||rep.km||rep.bk||rep.ins||rep.po;
      if(!hasData){
        // Показываем первую транзакцию целиком для диагностики
        var first=monthTx[0]||{};
        var accountMap2={};accountItems.forEach(function(a){accountMap2[a.id]=a.name||'';});
        var catMap2={};catItems.forEach(function(c){catMap2[c.id]=c.name||'';});
        // Показываем поля первых 3 транзакций
        var rows=monthTx.slice(0,3).map(function(tx){
          return 'date:'+tx.date
            +' | acc_id:'+tx.org_account_id+' ('+accountMap2[tx.org_account_id]+')'
            +' | cat_id:'+tx.category_id+' ('+catMap2[tx.category_id]+')'
            +' | in:'+tx.income+' | out:'+tx.outcome
            +' | type:'+tx.type;
        }).join('<br>');
        // Все ключи первой транзакции
        var keys=Object.keys(first).join(', ');
        d.innerHTML='<div style="padding:8px;font-size:10px;color:#444;line-height:1.8;word-break:break-all;">'
          +'<b>Фильтр не пропускает. Поля транзакции:</b><br>'+keys
          +'<br><br><b>Первые 3 транзакции:</b><br>'+rows
          +'</div>';
        return;
      }
      d.innerHTML=renderHTML(rep,true);
    }else{
      d.innerHTML='<div style="padding:12px;color:#9ca3af;font-size:12px;">Нет транзакций за '+range.label+'</div>';
    }
    var btn=document.getElementById('dds-btn');if(btn)btn.onclick=function(){loadData(false);};
    var rst=document.getElementById('dds-reset');if(rst)rst.onclick=function(){loadData(true);};
  }).catch(function(err){
    var st2=document.getElementById('dds-status');
    if(st2){st2.textContent='ошибка '+err;st2.style.color='#dc2626';}
    else{d.innerHTML='<div style="padding:12px;color:#dc2626;font-size:12px;">Ошибка: '+err+'</div>';}
    console.error('[DDS]',err);
  });
}

loadData(false);
setInterval(function(){loadData(false);},5*60*1000);
console.log('[DDS widget] started | domain:',DOMAIN);
</script>
</body>
</html>`;
}
