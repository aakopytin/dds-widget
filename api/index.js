module.exports.config = { api: { bodyParser: false } };

function readBody(req) {
  return new Promise(function(resolve) {
    var d = '';
    req.on('data', function(c) { d += c.toString(); });
    req.on('end',  function()  { resolve(d); });
    req.on('error',function()  { resolve(''); });
  });
}

function parseForm(body) {
  var r = {};
  if (!body) return r;
  body.split('&').forEach(function(pair) {
    var i = pair.indexOf('=');
    if (i < 0) return;
    r[decodeURIComponent(pair.slice(0, i).replace(/\+/g,' '))] =
      decodeURIComponent(pair.slice(i+1).replace(/\+/g,' '));
  });
  return r;
}

module.exports = async function handler(req, res) {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'POST') {
    var raw    = await readBody(req);
    var fields = parseForm(raw);
    var domain      = fields['domain']             || '';
    var accountId   = fields['account[id]']        || '';
    var accessToken = fields['auth[access_token]'] || '';
    console.log('[DDS] POST | domain:', domain, '| account:', accountId, '| hasToken:', !!accessToken);
    return res.status(200).send(html(domain, accountId, accessToken));
  }

  return res.status(200).send('<html><body style="font-family:sans-serif;padding:20px">' +
    '<h3>&#x2713; ДДС виджет работает</h3></body></html>');
};

function esc(s) {
  return String(s||'').replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$/g,'\\$');
}

function html(domain, accountId, accessToken) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ДДС</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:12px;
     background:#f8f9fd;color:#111827;padding:10px}
table{width:100%;border-collapse:collapse}
td{padding:4px 6px}
td:last-child{text-align:right;white-space:nowrap}
details summary{font-size:10px;color:#9ca3af;cursor:pointer;padding:4px 0}
details table td{font-size:10px;color:#555;padding:2px 4px}
</style>
</head>
<body>
<div id="root" style="color:#9ca3af">ДДС — загрузка…</div>
<script>
var DOMAIN="${esc(domain)}";
var ACCOUNT_ID="${esc(accountId)}";
var TOKEN="${esc(accessToken)}";

var VSIP={
  "Альфа ВСИП":1,"ВСИП Депозиты":1,"Счет ВТБ":1,
  "Счет РХСБ":1,"Счет Сбербанк":1,"Счет Совкомбанк":1
};
var TT={"Альфа ТТ (ВСИП)":1};
var OFF={24:1,26:1,27:1};
var PN={1:"Кемерово",3:"Южно-Сахалинск",13:"Барнаул",12:"Киров",
        23:"Сыктывкар",9:"Рузаевка",7:"Иволгинск",6:"Десногорск",
        100:"Центральный договор",101:"Прочие проекты"};
var PO=[1,3,13,12,23,9,7,6,100,101];
var PG={2:100,18:100,19:100,29:100,30:100,31:100,32:100,33:100,17:101,20:101,22:101};
var AC={
  "Перевод между счетами (поступление)":"skip",
  "Перевод между счетами (списание)":"skip",
  "Получение кредита":"skip","Выплата кредита":"skip",
  "Оказание услуг":"pjIn","Возврат ДС. за заказы":"refund",
  "Проценты к получению":"pr",
  "Зарплата":"zp","Командировки":"km","Страхование":"ins",
  "Расходы на услуги банков":"bk",
  "Налоги и взносы":"po","Налоги - НДС":"po","Прочее":"po",
  "Аренда":"po","Бухгалтерия":"po","Интернет и связь":"po",
  "Расходы на лизинг":"po","Проценты к уплате":"po","Оборудование":"po",
  "Возвраты клиентам":"po","Нераспределенные":"po",
  "Нераспределенные (списание)":"po","Тесты и испытания":"po",
  "Услуги по сертификации":"po",
  "Составление исполнительной документации":"po",
  "СМР (Без детализации)":"pjOut","СМР Вент+кондиц":"pjOut",
  "Материалы (Вентиляция)":"pjOut","Материалы (Отопление)":"pjOut",
  "Материалы (Потолки)":"pjOut","Материалы (Проемы)":"pjOut",
  "Материалы (Стены)":"pjOut","Материалы (Транспорт, Логистика)":"pjOut",
  "Материалы (Электрика)":"pjOut","Материалы черновые":"pjOut",
  "Проектирование-Изыскание":"pjOut"
};

function fmt(v){if(!v&&v!==0)return"—";if(v===0)return"—";return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);}
function fmtI(v){return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0);}
function num(s){if(!s&&s!==0)return 0;return parseFloat(String(s).replace(/[^\\d.\\-]/g,""))||0;}
function getRange(){
  var now=new Date(),y=now.getFullYear(),m=now.getMonth();
  var p=function(n){return n<10?"0"+n:""+n;};
  var end=Math.min(now.getDate(),new Date(y,m+1,0).getDate());
  var mo=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  return{ymd:y+"-"+p(m+1),s0:y+"-"+p(m+1)+"-01",s1:y+"-"+p(m+1)+"-"+p(end),
         d0:"01."+p(m+1)+"."+y,d1:p(end)+"."+p(m+1)+"."+y,label:mo[m]+" "+y};
}

var lk=function(ym){return"dds_"+ACCOUNT_ID+"_"+ym;};
function getF(ym){try{var s=localStorage.getItem(lk(ym));return s?JSON.parse(s):null;}catch(e){return null;}}
function setF(ym,v,t){try{localStorage.setItem(lk(ym),JSON.stringify({v:v,t:t}));}catch(e){}}
function clrF(ym){try{localStorage.removeItem(lk(ym));}catch(e){}}

// Запросы через серверный прокси /api/data
function loadAll(entity) {
  return fetch("/api/data", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({domain: DOMAIN, entity: entity})
  }).then(function(r) {
    return r.ok ? r.json() : Promise.reject("HTTP " + r.status);
  }).then(function(d) {
    return d.items || [];
  });
}

function calc(txMonth,txAll,accs,cats,rng){
  var aMap={},cMap={};
  accs.forEach(function(a){aMap[a.id]=a.name||"";});
  cats.forEach(function(c){cMap[c.id]=c.name||"";});

  // Считаем остатки суммируя ВСЕ транзакции от начала истории до конца месяца
  // Включаем ВСЕ категории включая переводы (они реально меняют остаток счёта)
  var vEnd=0, tEnd=0;
  txAll.forEach(function(tx){
    if(!tx.date||tx.date>rng.s1)return;
    var an=aMap[tx.org_account_id]||"";
    var inc=num(tx.income)||0, out=num(tx.outcome)||0;
    if(VSIP[an]){vEnd+=inc-out;}
    if(TT[an])  {tEnd+=inc-out;}
  });

    var pr=0,zp=0,km=0,bk=0,ins=0,po=0,pjIn=0,pjOut=0,refund=0;
  var piP={},poP={},poDet=[],vNet=0,tNet=0;

  txMonth.forEach(function(tx){
    var an=aMap[tx.org_account_id]||"",cn=cMap[tx.category_id]||"";
    var pid=tx.project_id||0;
    var inc=num(tx.income)||0,out=num(tx.outcome)||0;
    var isV=!!VSIP[an],isT=!!TT[an];
    if(!isV&&!isT)return;
    if(isV)vNet+=inc-out;if(isT)tNet+=inc-out;
    var rp=pid,gp=(rp&&PG[rp])?PG[rp]:rp;
    var pOk=gp&&!!PN[gp],pOff=rp&&!!OFF[rp];
    var cat=AC[cn];if(cat==="skip")return;
    if(inc>0){
      if(cat==="pr")pr+=inc;
      else if(cat==="pjIn"&&pOk){pjIn+=inc;piP[gp]=(piP[gp]||0)+inc;}
      else if(cat==="refund"&&pOk)refund+=inc;
    }
    if(out>0){
      if(cat==="zp")zp+=out;else if(cat==="km")km+=out;
      else if(cat==="ins")ins+=out;else if(cat==="bk")bk+=out;
      else if(cat==="po"){po+=out;poDet.push({date:tx.date,cat:cn,out:out});}
      else if(!pOff){pjOut+=out;if(gp&&pOk)poP[gp]=(poP[gp]||0)+out;}
    }
  });

  // Остаток на начало месяца = все движения до начала месяца
  var vSt=0, tSt=0;
  txAll.forEach(function(tx){
    if(!tx.date||tx.date>=rng.s0)return;
    var an=aMap[tx.org_account_id]||"";
    var inc=num(tx.income)||0, out=num(tx.outcome)||0;
    if(VSIP[an]){vSt+=inc-out;}
    if(TT[an])  {tSt+=inc-out;}
  });

  var te=pjOut+zp+km+bk+ins+po;
  return{vSt:vSt,tSt:tSt,vEnd:vEnd,tEnd:tEnd,tS:vSt+tSt,tE:(vEnd||0)+(tEnd||0),
    pr:pr,pjIn:pjIn,refund:refund,pjOut:pjOut,zp:zp,km:km,bk:bk,ins:ins,po:po,te:te,
    piP:piP,poP:poP,poDet:poDet,cnt:txMonth.length,d0:rng.d0,d1:rng.d1,label:rng.label,ymd:rng.ymd};
}

function TR(l,v,cls,ind){var n=fmt(v),c="";if(cls==="g"&&v>0)c="color:#16a34a";if(cls==="r"&&v<0)c="color:#dc2626";if(cls==="m")c="color:#9ca3af";var s1="padding:4px 6px"+(ind?";padding-left:14px":"");var s2="padding:4px 6px;text-align:right;white-space:nowrap"+(c?";"+c:"");return"<tr><td style='"+s1+"'>"+l+"</td><td style='"+s2+"'>"+n+"</td></tr>";}
function SEP(l,v,cls){var n=fmt(v),c="";if(cls==="g"&&v>0)c="color:#16a34a";if(cls==="r"&&v<0)c="color:#dc2626";var s="padding:4px 6px;font-weight:600;border-top:1px solid #e5e7eb";return"<tr><td style='"+s+"'>"+l+"</td><td style='"+s+";text-align:right;white-space:nowrap"+(c?";"+c:"")+"'>"+n+"</td></tr>";}
function SEC(l){return"<tr><td colspan='2' style='padding:7px 6px 2px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-top:1px solid #e5e7eb'>"+l+"</td></tr>";}

function render(r,live){
  var rows=[],tot=0;
  rows.push(TR("Остаток "+r.d0+" · ВСИП",r.vSt,"",""));
  rows.push(TR("Остаток "+r.d0+" · ТТ",r.tSt,r.tSt<0?"r":"",""));
  rows.push(SEP("ИТОГО на "+r.d0,r.tS,""));
  rows.push(TR("Остаток "+r.d1+" · ВСИП",r.vEnd,"",""));
  rows.push(TR("Остаток "+r.d1+" · ТТ",r.tEnd,r.tEnd<0?"r":"",""));
  rows.push(SEP("ИТОГО на "+r.d1,r.tE,r.tE>=0?"g":"r"));
  rows.push(SEC("Поступления"));
  var hasPi=Object.keys(r.piP).length>0;
  if(hasPi){PO.forEach(function(p){var v=r.piP[p];if(v){rows.push(TR(PN[p],v,"g",1));tot+=v;}});}
  else if(r.pjIn){rows.push(TR("Поступления по проектам",r.pjIn,"g",1));tot+=r.pjIn;}
  if(r.pr){rows.push(TR("Процентные доходы",r.pr,"g",1));tot+=r.pr;}
  if(r.refund){rows.push(TR("Возвраты",r.refund,"g",1));tot+=r.refund;}
  rows.push(SEP("Итого поступлений",tot,"g"));
  rows.push(SEC("Расходы по проектам"));
  var hasPo=Object.keys(r.poP).length>0;
  if(hasPo){PO.forEach(function(p){var v=r.poP[p]||0;rows.push(TR(PN[p],v,v?"":"m",1));});}
  rows.push(SEP("Итого проекты",r.pjOut,""));
  rows.push(SEC("Офисные расходы"));
  rows.push(TR("Зарплата",r.zp,r.zp?"":"m",1));
  rows.push(TR("Командировочные",r.km,r.km?"":"m",1));
  rows.push(TR("Страхование",r.ins,r.ins?"":"m",1));
  rows.push(TR("Банковские комиссии",r.bk,r.bk?"":"m",1));
  rows.push(TR("Прочие расходы офиса",r.po,r.po?"":"m",1));
  rows.push(SEP("ВСЕГО РАСХОДОВ",r.te,""));
  var ctrl=r.tS+tot-r.te-r.tE,cOk=Math.abs(ctrl)<1;
  rows.push(SEP(cOk?"Контрольная сумма":"Контрольная сумма ⚠",ctrl,cOk?"g":"r"));
  var st=live?'<span style="color:#16a34a">● live · '+r.cnt+' тр.</span>':'<span style="color:#9ca3af">данные на '+r.d1+'</span>';
  return'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">'
    +'<div><div style="font-size:13px;font-weight:600">ДДС — '+r.label+'</div>'
    +'<div style="font-size:10px;color:#9ca3af;margin-top:1px">'+r.d0+' — '+r.d1+'</div></div>'
    +'<div style="display:flex;align-items:center;gap:5px;flex-shrink:0">'
    +'<span id="st" style="font-size:10px">'+st+'</span>'
    +'<button id="btn" style="background:none;border:1px solid #d1d5db;color:#6b7280;font-size:10px;padding:1px 6px;border-radius:3px;cursor:pointer">↻</button>'
    +'<button id="rst" style="background:none;border:1px solid #d1d5db;color:#9ca3af;font-size:10px;padding:1px 5px;border-radius:3px;cursor:pointer">⟳₀</button>'
    +'</div></div>'
    +'<table>'+rows.join('')+'</table>'
    +'<div style="margin-top:5px;font-size:10px;color:#9ca3af">обновлено: '+new Date().toLocaleTimeString("ru-RU")+'</div>';
}

function renderPoDet(poDet){
  if(!poDet||!poDet.length)return;
  var d=document.createElement("details"),s=document.createElement("summary");
  var tot=poDet.reduce(function(a,p){return a+p.out;},0);
  s.textContent="Прочие расходы ("+poDet.length+" тр. на "+fmtI(tot)+" р.)";
  d.appendChild(s);
  var t=document.createElement("table");t.style.cssText="width:100%;border-collapse:collapse;margin-top:4px";
  poDet.sort(function(a,b){return b.out-a.out;}).forEach(function(p){
    var tr=document.createElement("tr");
    tr.innerHTML="<td style='padding:2px 4px;font-size:10px;color:#666'>"+p.date+"</td><td style='padding:2px 4px;font-size:10px;color:#666'>"+p.cat+"</td><td style='padding:2px 4px;font-size:10px;text-align:right'>"+fmtI(p.out)+"</td>";
    t.appendChild(tr);
  });
  d.appendChild(t);document.getElementById("root").appendChild(d);
}

function load(reset){
  var el=document.getElementById("root"),rng=getRange();
  if(reset)clrF(rng.ymd);
  var s=document.getElementById("st");
  if(s){s.textContent="загрузка…";s.style.color="#9ca3af";}

  // Запрашиваем остатки у родительского окна через postMessage
  function getBalances(){
    return new Promise(function(resolve){
      var done=false;
      window.addEventListener('message',function handler(e){
        if(!e.data||e.data.type!=='dds_balances')return;
        window.removeEventListener('message',handler);
        done=true;
        resolve(e.data);
      });
      try{window.parent.postMessage({type:'dds_get_balances'},'*');}catch(e){}
      // Таймаут 2 сек — если родитель не ответил, продолжаем без остатков
      setTimeout(function(){if(!done)resolve(null);},2000);
    });
  }

  Promise.all([
    loadAll("transaction"),
    loadAll("bank_account"),
    loadAll("categories")
  ]).then(function(res){
    var txAll=res[0],accs=res[1],cats=res[2];
    var txM=txAll.filter(function(tx){return tx.date&&tx.date>=rng.s0&&tx.date<=rng.s1;});
    console.log("[DDS] tx:",txAll.length,"month:",txM.length,"accs:",accs.length,"cats:",cats.length);
    if(txM.length){
      var r=calc(txM,txAll,accs,cats,rng);
      el.innerHTML=render(r,true);
      renderPoDet(r.poDet);
    }else{
      el.innerHTML="<div style='padding:12px;font-size:11px;color:#666'>"
        +"Нет данных за "+rng.label+"<br>"
        +"tx всего: "+txAll.length+", за месяц: "+txM.length+"<br>"
        +"диапазон: "+rng.s0+" — "+rng.s1+"<br>"
        +"domain: "+DOMAIN+"<br>"
        +"token: "+(TOKEN?TOKEN.slice(0,20)+"...":"нет")
        +"</div>";
    }
    var b=document.getElementById("btn");if(b)b.onclick=function(){load(false);};
    var rb=document.getElementById("rst");if(rb)rb.onclick=function(){load(true);};
  }).catch(function(e){
    el.innerHTML="<div style='padding:12px;color:#dc2626'>Ошибка: "+e+"</div>";
    console.error("[DDS]",e);
  });
}

load(false);
setInterval(function(){load(false);},5*60*1000);
console.log("[DDS] started | domain:",DOMAIN,"| token:",!!TOKEN);
</script>
</body>
</html>`;
}
