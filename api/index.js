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
    var domain    = fields['domain']      || '';
    var accountId = fields['account[id]'] || '';
    return res.status(200).send(html(domain, accountId));
  }

  return res.status(200).send('<html><body style="font-family:sans-serif;padding:20px">' +
    '<h3>&#x2713; ДДС виджет работает</h3></body></html>');
};

function esc(s) {
  return String(s||'').replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$/g,'\\$');
}

function html(domain, accountId) {
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

var VSIP={
  "Альфа ВСИП":1,"ВСИП Депозиты":1,"Счет ВТБ":1,
  "Счет РХСБ":1,"Счет Сбербанк":1,"Расчетный счет 9637":1
};
var TT={"Альфа ТТ (ВСИП)":1,"ТТ Депозиты":1};
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

function fmt(v){
  if(!v&&v!==0)return"—";if(v===0)return"—";
  return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
}
function fmtI(v){
  return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0);
}
function num(s){
  if(!s&&s!==0)return 0;
  return parseFloat(String(s).replace(/[^\\d.\\-]/g,""))||0;
}
function getRange(){
  var now=new Date(),y=now.getFullYear(),m=now.getMonth();
  var p=function(n){return n<10?"0"+n:""+n;};
  var end=Math.min(now.getDate(),new Date(y,m+1,0).getDate());
  var mo=["Январь","Февраль","Март","Апрель","Май","Июнь",
          "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  return{ymd:y+"-"+p(m+1),s0:y+"-"+p(m+1)+"-01",
         s1:y+"-"+p(m+1)+"-"+p(end),
         d0:"01."+p(m+1)+"."+y,d1:p(end)+"."+p(m+1)+"."+y,
         label:mo[m]+" "+y};
}

var lk=function(ym){return"dds_"+ACCOUNT_ID+"_"+ym;};
function getF(ym){try{var s=localStorage.getItem(lk(ym));return s?JSON.parse(s):null;}catch(e){return null;}}
function setF(ym,v,t){try{localStorage.setItem(lk(ym),JSON.stringify({v:v,t:t}));}catch(e){}}
function clrF(ym){try{localStorage.removeItem(lk(ym));}catch(e){}}

// Загружаем все страницы напрямую из браузера (same-origin, куки работают)
function loadAllPages(path, onProgress) {
  return new Promise(function(resolve, reject) {
    var allItems = [];
    var page = 1;

    function nextPage() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://'+DOMAIN+path+'&page='+page, true);
      xhr.withCredentials = true;
      xhr.onload = function() {
        if (xhr.status !== 200) { reject('HTTP '+xhr.status); return; }
        try {
          var d = JSON.parse(xhr.responseText);
          var items = d?.response?.items || [];
          var total = d?.response?.total || 0;
          allItems = allItems.concat(items);
          if (onProgress) onProgress(allItems.length, total);
          if (allItems.length >= total || items.length === 0 || page > 60) {
            resolve(allItems);
          } else {
            page++;
            nextPage();
          }
        } catch(e) { reject(e.message); }
      };
      xhr.onerror = function() { reject('network error'); };
      xhr.send();
    }
    nextPage();
  });
}

function loadEntity(path) {
  return loadAllPages(path, null);
}

function calc(txMonth,accs,cats,rng){
  var aMap={},cMap={};
  accs.forEach(function(a){aMap[a.id]=a.name||"";});
  cats.forEach(function(c){cMap[c.id]=c.name||"";});

  // Остатки из виджетов на странице
  var vEnd=null,tEnd=null;
  try{
    var domText=window.parent.document.body.innerText||"";
    var allM=[...domText.matchAll(/([-\\d][\\d\\s]*)\\s*[рp]\\.\\s*\\n([^\\n]+)/g)];
    allM.forEach(function(m){
      var s=num(m[1].replace(/\\s/g,""));
      var name=m[2].trim();
      if(name==="ВСИП")vEnd=s;
      if(/Альфа ТТ/.test(name))tEnd=(tEnd||0)+s;
      if(/ТТ Депозиты/.test(name))tEnd=(tEnd||0)+s;
    });
  }catch(e){}

  var pr=0,zp=0,km=0,bk=0,ins=0,po=0,pjIn=0,pjOut=0,refund=0;
  var piP={},poP={},poDet=[];
  var vNet=0,tNet=0;

  txMonth.forEach(function(tx){
    var an=aMap[tx.org_account_id]||"";
    var cn=cMap[tx.category_id]||"";
    var pid=tx.project_id||0;
    var inc=num(tx.income)||0,out=num(tx.outcome)||0;
    var isV=!!VSIP[an],isT=!!TT[an];
    if(!isV&&!isT)return;
    if(isV)vNet+=inc-out;
    if(isT)tNet+=inc-out;
    var rp=pid,gp=(rp&&PG[rp])?PG[rp]:rp;
    var pOk=gp&&!!PN[gp],pOff=rp&&!!OFF[rp];
    var cat=AC[cn];
    if(cat==="skip")return;
    if(inc>0){
      if(cat==="pr")pr+=inc;
      else if(cat==="pjIn"&&pOk){pjIn+=inc;piP[gp]=(piP[gp]||0)+inc;}
      else if(cat==="refund"&&pOk)refund+=inc;
    }
    if(out>0){
      if(cat==="zp")zp+=out;
      else if(cat==="km")km+=out;
      else if(cat==="ins")ins+=out;
      else if(cat==="bk")bk+=out;
      else if(cat==="po"){po+=out;poDet.push({date:tx.date,cat:cn,out:out});}
      else if(!pOff){pjOut+=out;if(gp&&pOk)poP[gp]=(poP[gp]||0)+out;}
    }
  });

  var fixed=getF(rng.ymd),vSt,tSt;
  if(fixed){
    vSt=fixed.v;tSt=fixed.t;
    if(vEnd===null)vEnd=vSt+vNet;
    if(tEnd===null)tEnd=tSt+tNet;
  }else if(vEnd!==null&&tEnd!==null){
    vSt=vEnd-vNet;tSt=tEnd-tNet;
    setF(rng.ymd,vSt,tSt);
  }else{
    vSt=0;tSt=0;vEnd=vNet;tEnd=tNet;
  }

  var te=pjOut+zp+km+bk+ins+po;
  return{vSt:vSt,tSt:tSt,vEnd:vEnd,tEnd:tEnd,
    tS:vSt+tSt,tE:(vEnd||0)+(tEnd||0),
    pr:pr,pjIn:pjIn,refund:refund,
    pjOut:pjOut,zp:zp,km:km,bk:bk,ins:ins,po:po,te:te,
    piP:piP,poP:poP,poDet:poDet,
    cnt:txMonth.length,d0:rng.d0,d1:rng.d1,label:rng.label,ymd:rng.ymd};
}

function TR(l,v,cls,indent){
  var n=fmt(v),c="";
  if(cls==="g"&&v>0)c="color:#16a34a";
  if(cls==="r"&&v<0)c="color:#dc2626";
  if(cls==="m")c="color:#9ca3af";
  var s1="padding:4px 6px"+(indent?";padding-left:14px":"");
  var s2="padding:4px 6px;text-align:right;white-space:nowrap"+(c?";"+c:"");
  return"<tr><td style='"+s1+"'>"+l+"</td><td style='"+s2+"'>"+n+"</td></tr>";
}
function SEP(l,v,cls){
  var n=fmt(v),c="";
  if(cls==="g"&&v>0)c="color:#16a34a";
  if(cls==="r"&&v<0)c="color:#dc2626";
  var s="padding:4px 6px;font-weight:600;border-top:1px solid #e5e7eb";
  return"<tr><td style='"+s+"'>"+l+"</td><td style='"+s+";text-align:right;white-space:nowrap"+(c?";"+c:"")+"'>"+n+"</td></tr>";
}
function SEC(l){
  return"<tr><td colspan='2' style='padding:7px 6px 2px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-top:1px solid #e5e7eb'>"+l+"</td></tr>";
}

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
  var st=live?'<span style="color:#16a34a">● live · '+r.cnt+' тр.</span>'
             :'<span style="color:#9ca3af">данные на '+r.d1+'</span>';
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
  var d=document.createElement("details");
  var s=document.createElement("summary");
  var tot=poDet.reduce(function(a,p){return a+p.out;},0);
  s.textContent="Прочие расходы ("+poDet.length+" тр. на "+fmtI(tot)+" р.)";
  d.appendChild(s);
  var t=document.createElement("table");
  t.style.cssText="width:100%;border-collapse:collapse;margin-top:4px";
  poDet.sort(function(a,b){return b.out-a.out;}).forEach(function(p){
    var tr=document.createElement("tr");
    tr.innerHTML="<td style='padding:2px 4px;font-size:10px;color:#666'>"+p.date
      +"</td><td style='padding:2px 4px;font-size:10px;color:#666'>"+p.cat
      +"</td><td style='padding:2px 4px;font-size:10px;text-align:right'>"+fmtI(p.out)+"</td>";
    t.appendChild(tr);
  });
  d.appendChild(t);
  document.getElementById("root").appendChild(d);
}

function load(reset){
  var el=document.getElementById("root"),rng=getRange();
  if(reset)clrF(rng.ymd);
  var s=document.getElementById("st");
  if(s){s.textContent="загрузка…";s.style.color="#9ca3af";}
  else{el.innerHTML="<div style='color:#9ca3af;font-size:12px'>ДДС — загрузка…</div>";}

  // Все запросы идут напрямую из браузера — same-origin с Аспро, куки работают
  var txPath="/api/v1/module/fin/transaction/list?count=50&sort=date&order=asc";
  var accPath="/api/v1/module/fin/bank_account/list?count=50";
  var catPath="/api/v1/module/fin/categories/list?count=50";

  Promise.all([
    loadEntity(txPath),
    loadEntity(accPath),
    loadEntity(catPath)
  ]).then(function(res){
    var txAll=res[0],accs=res[1],cats=res[2];
    var txM=txAll.filter(function(tx){return tx.date&&tx.date>=rng.s0&&tx.date<=rng.s1;});
    console.log("[DDS] tx:",txAll.length,"month:",txM.length,"accs:",accs.length,"cats:",cats.length);
    if(txM.length){
      var r=calc(txM,accs,cats,rng);
      el.innerHTML=render(r,true);
      renderPoDet(r.poDet);
    }else{
      el.innerHTML="<div style='padding:12px;color:#9ca3af'>Нет данных за "+rng.label+"</div>";
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
console.log("[DDS] started | domain:",DOMAIN);
</script>
</body>
</html>`;
}
