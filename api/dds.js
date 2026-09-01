function readBody(req) {
return new Promise(function(resolve) {
var d = '';
req.on('data', function(c) { d += c.toString(); });
req.on('end', function() { resolve(d); });
req.on('error',function() { resolve(''); });
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

async function handler(req, res) {
res.setHeader('X-Frame-Options', 'ALLOWALL');
res.setHeader('Content-Security-Policy', "frame-ancestors *");
res.setHeader('Content-Type', 'text/html; charset=utf-8');

if (req.method === 'POST') {
var raw = await readBody(req);
var fields = parseForm(raw);
var domain = fields['domain'] || '';
var accountId = fields['account[id]'] || '';
var accessToken = fields['auth[access_token]'] || '';
var vercelHost = req.headers['host'] || '';
console.log('[DDS] POST | domain:', domain, '| account:', accountId, '| hasToken:', !!accessToken, '| host:', vercelHost);
return res.status(200).send(html(domain, accountId, accessToken, vercelHost));
}

return res.status(200).send('<html><body style="font-family:sans-serif;padding:20px"><h3>&#x2713; ДДС виджет работает</h3></body></html>');
}

handler.config = { api: { bodyParser: false } };
module.exports = handler;

function esc(s) {
return String(s||'').replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$/g,'\\$');
}

function html(domain, accountId, accessToken, vercelHost) {
var d=domain,a=accountId,t=accessToken,h=vercelHost;
return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ДДС</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;background:#f8f9fd;color:#111827;padding:4px 6px;overflow-x:hidden}
table{border-collapse:collapse}
td{padding:1px 2px}
details summary{font-size:11px;color:#9ca3af;cursor:pointer;padding:4px 0}
details table td{font-size:11px;color:#555;padding:2px 4px}
</style>
</head>
<body>
<div id="filters" style="display:flex;gap:6px;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb">
<span style="font-size:11px;color:#9ca3af">с</span>
<input type="date" id="sel-start" style="font-size:11px;border:1px solid #d1d5db;border-radius:3px;padding:2px 6px;color:#374151;background:#fff;cursor:pointer" title="Начало периода">
<span style="font-size:11px;color:#9ca3af">по</span>
<input type="date" id="sel-date" style="font-size:11px;border:1px solid #d1d5db;border-radius:3px;padding:2px 6px;color:#374151;background:#fff;cursor:pointer" title="Конец периода">
</div>
<div id="root" style="color:#9ca3af">ДДС — загрузка…</div>
<div id="budget-wrap" style="margin-top:20px;padding-top:14px;border-top:2px solid #e5e7eb">
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
    <span style="font-size:12px;font-weight:700;color:#374151">Бюджет-факт по проекту</span>
    <select id="bgt-proj" style="font-size:11px;border:1px solid #d1d5db;border-radius:3px;padding:2px 6px;color:#374151;background:#fff">
      <option value="12">Киров</option>
      <option value="1">Кемерово</option>
      <option value="13">Барнаул</option>
      <option value="23">Сыктывкар</option>
      <option value="3">Ю-Сахалинск</option>
      <option value="9">Рузаевка</option>
      <option value="6">Десногорск</option>
      <option value="7">Иволгинск</option>
      <option value="10">Большое Болдино</option>
    </select>
    <select id="bgt-month" style="font-size:11px;border:1px solid #d1d5db;border-radius:3px;padding:2px 6px;color:#374151;background:#fff"></select>
  </div>
  <div id="bgt-root" style="color:#9ca3af;font-size:11px">загрузка…</div>
</div>
<script>
(function(){
var DOMAIN="${esc(d)}";
var ACCOUNT_ID="${esc(a)}";
var TOKEN="${esc(t)}";
var API_BASE="${esc(h)}"?"https://${esc(h)}":(location.origin||"");

var VSIP={2:1,4:1,5:1,6:1,7:1,8:1,166:1};  // 166=Альфа Т (ТБанк)
var TT={18:1};  // 26 (Счет СМ ТТ) не включается в расчёт
var OFF={24:1};
var PN={1:"Кемерово",3:"Южно-Сахалинск",10:"Большое Болдино",25:"Южно-Сахалинск",13:"Барнаул",12:"Киров",23:"Сыктывкар",9:"Рузаевка",7:"Иволгинск",6:"Десногорск",102:"Голутвинский",100:"Центральный договор",101:"Прочие проекты"};
var PO=[1,3,10,13,12,23,9,7,6,102,100,101];
var PG={2:100,4:101,18:100,19:100,21:101,29:100,30:100,31:100,32:100,33:102,17:101,20:101,22:101,28:101};
var AC={
"Перевод между счетами (поступление)":"tr","Перевод между счетами (списание)":"tr",
"Получение кредита":"skIn","Выплата кредита":"skOut",
"Оказание услуг":"pjIn","Оказание услуг проекту":"pjIn","Возврат ДС. за заказы":"refund",
"Проценты к получению":"pr","НДС исходящий":"pr","Налог - НДС":"pr",
"Зарплата":"zp","Налоги с зарплаты":"zp","Командировки":"km","Страхование":"ins",
"Расходы на услуги банков":"bk","Банковские услуги":"bk","Расходы на лизинг":"lz",
"Аренда":"ar","Бухгалтерия":"buh","Налоги и взносы":"ntax","Налоги - НДС":"ntax",
"Прочее":"po","Интернет и связь":"po","Проценты к уплате":"pct","Оборудование":"po",
"Возвраты клиентам":"pjOut","Нераспределенные":"po","Нераспределенные (списание)":"po","Офис":"po",
"СМР (Без детализации)":"pjOut","СМР Вент+кондиц":"pjOut",
"Материалы (Вентиляция)":"pjOut","Материалы (Отопление)":"pjOut","Материалы (Потолки)":"pjOut",
"Материалы (Проемы)":"pjOut","Материалы (Стены)":"pjOut","Материалы (Транспорт, Логистика)":"pjOut",
"Материалы (Электрика)":"pjOut","Материалы черновые":"pjOut",
"Проектирование-Изыскание":"pjOut","Составление исполнительной документации":"svc",
"Услуги по сертификации":"svc","Тесты и испытания":"svc","Банковские гарантии":"bg"
};

function fmt(v){if(v===null||v===undefined||v===0)return"—";return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(v));}
function fmtI(v){return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0);}
function _ddsNum(s){if(!s&&s!==0)return 0;return parseFloat(String(s).replace(/[^0-9.-]/g,""))||0;}
function getRange(){
  var p=function(v){return v<10?"0"+v:""+v;};
  var now=new Date();
  var todayStr=now.getFullYear()+"-"+p(now.getMonth()+1)+"-"+p(now.getDate());
  var monthStartStr=now.getFullYear()+"-"+p(now.getMonth()+1)+"-01";
  var ss=document.getElementById("sel-start");
  var se=document.getElementById("sel-date");
  var s0=ss&&ss.value?ss.value:monthStartStr;
  var s1=se&&se.value?se.value:todayStr;
  if(s0>s1)s0=s1;
  var d0=s0.slice(8)+"."+s0.slice(5,7)+"."+s0.slice(0,4);
  var d1=s1.slice(8)+"."+s1.slice(5,7)+"."+s1.slice(0,4);
  return{s0:s0,s1:s1,d0:d0,d1:d1,label:d0+" — "+d1,ymd:s0.slice(0,7)};
}

var lk=function(ym){return"dds_"+ACCOUNT_ID+"_"+ym;};
function clrF(ym){try{localStorage.removeItem(lk(ym));}catch(e){}}

function loadAll(entity,extra){
  var all=[],page=1;
  function next(){
    var p=new URLSearchParams(extra||{});
    p.set('entity',entity);p.set('limit','100');p.set('page',String(page));
    return fetch(API_BASE+'/api/data?'+p.toString()).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.json();
    }).then(function(d){
      if(d.error)throw new Error(JSON.stringify(d.error));
      var items=(d.response&&d.response.items)||[];
      var total=(d.response&&d.response.total)||0;
      all=all.concat(items);
      if(all.length>=total||items.length===0)return all;
      page++;return next();
    });
  }
  return next();
}

function calc(txMonth,txAll,cats,plsData,rng,cutoff,contrMap){
  var cMap={};
  cats.forEach(function(c){cMap[c.id]=c.name||"";});

  var vSt=0,tSt=0,vEnd=0,tEnd=0;
  txAll.forEach(function(tx){
    if(!tx.date)return;
    var aid=tx.org_account_id;
    var inc=_ddsNum(tx.income)||0,out=_ddsNum(tx.outcome)||0;
    if(tx.date<rng.s0){if(VSIP[aid])vSt+=inc-out;if(TT[aid])tSt+=inc-out;}
    var effEnd=cutoff||rng.s1;
    if(tx.date<=effEnd){if(VSIP[aid])vEnd+=inc-out;if(TT[aid])tEnd+=inc-out;}
  });

  var vPr=0,tPr=0,vPjIn=0,tPjIn=0,piP_v={},piP_t={};
  var vRefund=0,tRefund=0,vPoIn=0,tPoIn=0;
  var refPG_v={},refPG_t={};
  var vPjOut=0,tPjOut=0,vPjOutOff=0,tPjOutOff=0,poP_v={},poP_t={};
  var vZp=0,tZp=0,vKm=0,tKm=0,vIns=0,tIns=0,vBk=0,tBk=0;
  var vLz=0,tLz=0,vAr=0,tAr=0,vBuh=0,tBuh=0,vNtax=0,tNtax=0;
  var vPo=0,tPo=0,vPct=0,tPct=0,vBg=0,tBg=0;
  var trIn_v=0,trOut_v=0,trIn_t=0,trOut_t=0;
  var vSkIn=0,tSkIn=0,vSkOut=0,tSkOut=0;
  var poDet=[];

  // Pre-pass: determine which transfer reference_ids are internal (both legs same org)
  var trRef={};
  txMonth.forEach(function(tx){
    var ref=tx.reference_id;if(!ref)return;
    var aid=tx.org_account_id,cn=cMap[tx.category_id]||"";
    if(AC[cn]!=="tr")return;
    var isV=!!VSIP[aid],isT=!!TT[aid];if(!isV&&!isT)return;
    if(!trRef[ref])trRef[ref]={vIn:0,vOut:0,tIn:0,tOut:0};
    var inc=_ddsNum(tx.income)||0,out=_ddsNum(tx.outcome)||0;
    if(isV){trRef[ref].vIn+=inc;trRef[ref].vOut+=out;}
    if(isT){trRef[ref].tIn+=inc;trRef[ref].tOut+=out;}
  });

  txMonth.forEach(function(tx){
    var aid=tx.org_account_id,cn=cMap[tx.category_id]||"";
    var pid=tx.project_id||0;
    var inc=_ddsNum(tx.income)||0,out=_ddsNum(tx.outcome)||0;
    var isV=!!VSIP[aid],isT=!!TT[aid];
    if(!isV&&!isT)return;
    var rp=pid,gp=(rp&&PG[rp])?PG[rp]:rp;
    var pOk=gp&&!!PN[gp],pOff=rp&&!!OFF[rp];
    var cat=AC[cn];

    if(cat==="tr"){
      var ref=tx.reference_id,rf=ref?trRef[ref]:null;
      // skip internal transfers: both legs of same org present in period
      var intV=rf&&rf.vIn>0&&rf.vOut>0&&!rf.tIn&&!rf.tOut;
      var intT=rf&&rf.tIn>0&&rf.tOut>0&&!rf.vIn&&!rf.vOut;
      if(isV&&!intV){trIn_v+=inc;trOut_v+=out;}
      if(isT&&!intT){trIn_t+=inc;trOut_t+=out;}
      return;
    }
    if(inc!==0){
      if(cat==="pr"){if(isV)vPr+=inc;if(isT)tPr+=inc;}
      else if(cat==="pjIn"&&pOk){if(isV){vPjIn+=inc;piP_v[gp]=(piP_v[gp]||0)+inc;}if(isT){tPjIn+=inc;piP_t[gp]=(piP_t[gp]||0)+inc;}}
      else if(cat==="refund"){if(isV){vRefund+=inc;if(pOk||pOff)refPG_v[gp]=1;}if(isT){tRefund+=inc;if(pOk||pOff)refPG_t[gp]=1;}}
      else if(cat==="skIn"){if(isV)vSkIn+=inc;if(isT)tSkIn+=inc;}
      else{if(isV)vPoIn+=inc;if(isT)tPoIn+=inc;}
    }
    if(out!==0){
      if(cat==="zp"){if(isV)vZp+=out;if(isT)tZp+=out;}
      else if(cat==="km"){if(isV)vKm+=out;if(isT)tKm+=out;}
      else if(cat==="ins"){if(isV)vIns+=out;if(isT)tIns+=out;}
      else if(cat==="bk"){if(isV)vBk+=out;if(isT)tBk+=out;}
      else if(cat==="lz"){if(isV)vLz+=out;if(isT)tLz+=out;}
      else if(cat==="ar"){if(isV)vAr+=out;if(isT)tAr+=out;}
      else if(cat==="buh"){if(isV)vBuh+=out;if(isT)tBuh+=out;}
      else if(cat==="ntax"){if(isV)vNtax+=out;if(isT)tNtax+=out;}
      else if(cat==="pct"){if(isV)vPct+=out;if(isT)tPct+=out;}
      else if(cat==="bg"){
        if(pOff){if(isV)vBg+=out;if(isT)tBg+=out;}
        else{if(isV){vPjOut+=out;if(gp&&pOk)poP_v[gp]=(poP_v[gp]||0)+out;}if(isT){tPjOut+=out;if(gp&&pOk)poP_t[gp]=(poP_t[gp]||0)+out;}}
      }
      else if(cat==="skOut"){if(isV)vSkOut+=out;if(isT)tSkOut+=out;}
      else if(cat==="svc"){
        if(pOk){if(isV){vPjOut+=out;if(gp)poP_v[gp]=(poP_v[gp]||0)+out;}if(isT){tPjOut+=out;if(gp)poP_t[gp]=(poP_t[gp]||0)+out;}}
        else{if(isV)vPo+=out;if(isT)tPo+=out;poDet.push({date:tx.date,cat:cn,out:out,contr:(contrMap&&tx.crm_account_id&&contrMap[tx.crm_account_id])||"",org:isV?"ВСИП":"ТТ"});}
      }
      else if(cat==="po"){if(isV)vPo+=out;if(isT)tPo+=out;poDet.push({date:tx.date,cat:cn,out:out,contr:(contrMap&&tx.crm_account_id&&contrMap[tx.crm_account_id])||"",org:isV?"ВСИП":"ТТ"});}
      else if(cat==="pjOut"){
        if(pOk&&!pOff){if(isV){vPjOut+=out;if(gp)poP_v[gp]=(poP_v[gp]||0)+out;}if(isT){tPjOut+=out;if(gp)poP_t[gp]=(poP_t[gp]||0)+out;}}
        else{if(isV)vPjOutOff+=out;if(isT)tPjOutOff+=out;}
      }
      else if(pOff){if(isV)vPjOutOff+=out;if(isT)tPjOutOff+=out;}
      else{if(isV){vPjOut+=out;if(gp&&pOk)poP_v[gp]=(poP_v[gp]||0)+out;}if(isT){tPjOut+=out;if(gp&&pOk)poP_t[gp]=(poP_t[gp]||0)+out;}}
    }
  });

  // ─── НДС из transaction_pls ──────────────────────────────────────────────
  // 3147 income → доходные строки per-project (piP) или Возвраты (refPG)
  // 3144 outcome → расходные строки per-project (poP) или офисные (vVatOffV)
  // !pOk + pid=27 → vVatTr; !pOk + прочие → vVatOffV (3144) / vVatTr (3147)

  // ref_id → AC-категория расходной транзакции (для разбивки офисного НДС по строкам)
  var refCat_v={},refCat_t={};
  txMonth.forEach(function(tx){
    if(!tx.reference_id)return;
    var aid=tx.org_account_id,cn=cMap[tx.category_id]||"",cat=AC[cn];
    if(!cat)return;
    if(VSIP[aid])refCat_v[tx.reference_id]=cat;
    if(TT[aid])refCat_t[tx.reference_id]=cat;
  });

  var vVatPiP={},tVatPiP={},vVatPoP={},tVatPoP={};
  var vVatTr=0,tVatTr=0,vVatTrIn=0,tVatTrIn=0,vVatTrOut=0,tVatTrOut=0;
  var vVatRefV=0,tVatRefV=0;
  var vVatOffV=0,tVatOffV=0;
  var vVatTotalIn=0,tVatTotalIn=0,vVatTotalOut=0,tVatTotalOut=0;
  var vVatZp=0,tVatZp=0,vVatKm=0,tVatKm=0,vVatBk=0,tVatBk=0;
  var vVatIns=0,tVatIns=0,vVatLz=0,tVatLz=0,vVatAr=0,tVatAr=0;
  var vVatBuh=0,tVatBuh=0,vVatNtax=0,tVatNtax=0,vVatPo=0,tVatPo=0;
  var vVatPct=0,tVatPct=0,vVatBg=0,tVatBg=0,vVatPjOutOff=0,tVatPjOutOff=0;

  (plsData||[]).forEach(function(p){
    if(!p.date||p.date<rng.s0||p.date>rng.s1)return;
    var is3144=p.category_id===3144,is3147=p.category_id===3147;
    if(!is3144&&!is3147)return;
    var pid=p.project_id||0;
    var gp=(pid&&PG[pid])?PG[pid]:pid;
    var pOk=gp&&!!PN[gp];
    if(is3147){
      // НДС поступлений: pid=27 всегда→trIn; per-project→piP; refund→refV; else→vVatTr
      var inc47=_ddsNum(p.income)||0;if(!inc47)return;
      // pid=27 must be checked BEFORE pOk — project 27 may exist in PN
      if(pid===27){
        if(p.org_id===1){var rf27a=p.reference_id?trRef[p.reference_id]:null;var intV27a=rf27a&&rf27a.vIn>0&&rf27a.vOut>0&&!rf27a.tIn&&!rf27a.tOut;if(!intV27a){vVatTrIn+=inc47;vVatTr+=inc47;}}
        else if(p.org_id===2){tVatTrIn+=inc47;tVatTr+=inc47;}
        return;
      }
      if(!pOk){if(p.org_id===1){if(refPG_v[gp]){vVatRefV+=inc47;vVatTotalIn+=inc47;}else{vVatTr+=inc47;}}else if(p.org_id===2){if(refPG_t[gp]){tVatRefV+=inc47;tVatTotalIn+=inc47;}else{tVatTr+=inc47;}}return;}
      if(p.org_id===1){
        if((piP_v[gp]||0)>0){vVatPiP[gp]=(vVatPiP[gp]||0)+inc47;}
        else if(refPG_v[gp]){vVatRefV+=inc47;}
        else{vVatTr+=inc47;}
        vVatTotalIn+=inc47;
      }else if(p.org_id===2){
        if((piP_t[gp]||0)>0){tVatPiP[gp]=(tVatPiP[gp]||0)+inc47;}
        else if(refPG_t[gp]){tVatRefV+=inc47;}
        else{tVatTr+=inc47;}
        tVatTotalIn+=inc47;
      }
    }
    if(is3144){
      // НДС платежей: pid=27 всегда→trOut; per-project→poP; прочие→vVatOffV
      var out44=_ddsNum(p.outcome)||0;if(!out44)return;
      // pid=27 must be checked BEFORE pOk — project 27 may exist in PN
      if(pid===27){
        if(p.org_id===1){var rf27b=p.reference_id?trRef[p.reference_id]:null;var intV27b=rf27b&&rf27b.vIn>0&&rf27b.vOut>0&&!rf27b.tIn&&!rf27b.tOut;if(!intV27b){vVatTrOut+=out44;vVatTr+=out44;}}
        else if(p.org_id===2){tVatTrOut+=out44;tVatTr+=out44;}
        return;
      }
      if(!pOk){
        {
          if(p.org_id===1){
            vVatOffV+=out44;vVatTotalOut+=out44;
            var oc=refCat_v[p.reference_id]||"po";
            if(oc==="zp")vVatZp+=out44;else if(oc==="km")vVatKm+=out44;else if(oc==="bk")vVatBk+=out44;
            else if(oc==="ins")vVatIns+=out44;else if(oc==="lz")vVatLz+=out44;else if(oc==="ar")vVatAr+=out44;
            else if(oc==="buh")vVatBuh+=out44;else if(oc==="ntax")vVatNtax+=out44;
            else if(oc==="pct")vVatPct+=out44;else if(oc==="bg")vVatBg+=out44;else if(oc==="pjOut")vVatPjOutOff+=out44;else vVatPo+=out44;
          }else if(p.org_id===2){
            tVatOffV+=out44;tVatTotalOut+=out44;
            var oc2=refCat_t[p.reference_id]||"po";
            if(oc2==="zp")tVatZp+=out44;else if(oc2==="km")tVatKm+=out44;else if(oc2==="bk")tVatBk+=out44;
            else if(oc2==="ins")tVatIns+=out44;else if(oc2==="lz")tVatLz+=out44;else if(oc2==="ar")tVatAr+=out44;
            else if(oc2==="buh")tVatBuh+=out44;else if(oc2==="ntax")tVatNtax+=out44;
            else if(oc2==="pct")tVatPct+=out44;else if(oc2==="bg")tVatBg+=out44;else if(oc2==="pjOut")tVatPjOutOff+=out44;else tVatPo+=out44;
          }
        }
        return;
      }
      if(p.org_id===1){vVatPoP[gp]=(vVatPoP[gp]||0)+out44;vVatTotalOut+=out44;}
      else if(p.org_id===2){tVatPoP[gp]=(tVatPoP[gp]||0)+out44;tVatTotalOut+=out44;}
    }
  });

  // Зеркалирование НДС трансферов: Аспро пишет только одну сторону ВСИП↔ТТ
  var tVatTrInD=tVatTrIn||vVatTrOut, tVatTrOutD=tVatTrOut||vVatTrIn;
  var vVatTrInD=vVatTrIn||tVatTrOut, vVatTrOutD=vVatTrOut||tVatTrIn;

  var pjIn=vPjIn+tPjIn,pr=vPr+tPr,refund=vRefund+tRefund,poIn=vPoIn+tPoIn;
  var tot=pjIn+pr+refund+poIn;
  var pjOut=vPjOut+tPjOut;
  var pjOutOff=vPjOutOff+tPjOutOff;
  var zp=vZp+tZp,km=vKm+tKm,bk=vBk+tBk,ins=vIns+tIns;
  var lz=vLz+tLz,ar=vAr+tAr,buh=vBuh+tBuh,ntax=vNtax+tNtax;
  var po=vPo+tPo,pct=vPct+tPct,bg=vBg+tBg;
  var te=pjOut+pjOutOff+zp+km+bk+ins+lz+ar+buh+ntax+po+pct+bg;
  var skIn=vSkIn+tSkIn,skOut=vSkOut+tSkOut;
  var trNetto=(trIn_v+trIn_t)-(trOut_v+trOut_t);
  var tS=vSt+tSt,tE=vEnd+tEnd;
  var ctrl=tS+tot+skIn-(te+skOut-trNetto)-tE;
  var vCtrl=vSt+(vPjIn+vPr+vRefund+vPoIn+vSkIn+trIn_v)-(vPjOut+vPjOutOff+vZp+vKm+vBk+vIns+vLz+vAr+vBuh+vNtax+vPo+vPct+vBg+vSkOut+trOut_v)-vEnd;
  var tCtrl=tSt+(tPjIn+tPr+tRefund+tPoIn+tSkIn+trIn_t)-(tPjOut+tPjOutOff+tZp+tKm+tBk+tIns+tLz+tAr+tBuh+tNtax+tPo+tPct+tBg+tSkOut+trOut_t)-tEnd;
  var cOk=Math.abs(ctrl)<1;

  return{vSt:vSt,tSt:tSt,vEnd:vEnd,tEnd:tEnd,tS:tS,tE:tE,
    vPr:vPr,tPr:tPr,pr:pr,vPjIn:vPjIn,tPjIn:tPjIn,piP_v:piP_v,piP_t:piP_t,pjIn:pjIn,
    vRefund:vRefund,tRefund:tRefund,refund:refund,vPoIn:vPoIn,tPoIn:tPoIn,poIn:poIn,tot:tot,
    vPjOut:vPjOut,tPjOut:tPjOut,pjOut:pjOut,vPjOutOff:vPjOutOff,tPjOutOff:tPjOutOff,pjOutOff:pjOutOff,poP_v:poP_v,poP_t:poP_t,
    vZp:vZp,tZp:tZp,zp:zp,vKm:vKm,tKm:tKm,km:km,vIns:vIns,tIns:tIns,ins:ins,
    vBk:vBk,tBk:tBk,bk:bk,vLz:vLz,tLz:tLz,lz:lz,vAr:vAr,tAr:tAr,ar:ar,
    vBuh:vBuh,tBuh:tBuh,buh:buh,vNtax:vNtax,tNtax:tNtax,ntax:ntax,
    vPo:vPo,tPo:tPo,po:po,vPct:vPct,tPct:tPct,pct:pct,vBg:vBg,tBg:tBg,bg:bg,te:te,
    trIn_v:trIn_v,trOut_v:trOut_v,trIn_t:trIn_t,trOut_t:trOut_t,trNetto:trNetto,
    vSkIn:vSkIn,tSkIn:tSkIn,skIn:skIn,vSkOut:vSkOut,tSkOut:tSkOut,skOut:skOut,
    vVatPiP:vVatPiP,tVatPiP:tVatPiP,vVatPoP:vVatPoP,tVatPoP:tVatPoP,
    vVatTr:vVatTr,tVatTr:tVatTr,vVatTrIn:vVatTrIn,tVatTrIn:tVatTrIn,vVatTrOut:vVatTrOut,tVatTrOut:tVatTrOut,
    vVatTrInD:vVatTrInD,tVatTrInD:tVatTrInD,vVatTrOutD:vVatTrOutD,tVatTrOutD:tVatTrOutD,
    vVatRefV:vVatRefV,tVatRefV:tVatRefV,
    vVatOffV:vVatOffV,tVatOffV:tVatOffV,
    vVatZp:vVatZp,tVatZp:tVatZp,vVatKm:vVatKm,tVatKm:tVatKm,vVatBk:vVatBk,tVatBk:tVatBk,
    vVatIns:vVatIns,tVatIns:tVatIns,vVatLz:vVatLz,tVatLz:tVatLz,vVatAr:vVatAr,tVatAr:tVatAr,
    vVatBuh:vVatBuh,tVatBuh:tVatBuh,vVatNtax:vVatNtax,tVatNtax:tVatNtax,vVatPo:vVatPo,tVatPo:tVatPo,
    vVatPct:vVatPct,tVatPct:tVatPct,vVatBg:vVatBg,tVatBg:tVatBg,vVatPjOutOff:vVatPjOutOff,tVatPjOutOff:tVatPjOutOff,
    vVatTotalIn:vVatTotalIn,tVatTotalIn:tVatTotalIn,vVatTotalOut:vVatTotalOut,tVatTotalOut:tVatTotalOut,
    ctrl:ctrl,vCtrl:vCtrl,tCtrl:tCtrl,cOk:cOk,poDet:poDet,cnt:txMonth.length,d0:rng.d0,d1:rng.d1,label:rng.label,ymd:rng.ymd};
}

function HDR(){
  var sb="width:9px;padding:1px 2px;font-size:11px;font-weight:700;color:#374151;border-bottom:2px solid #9ca3af;text-align:right;white-space:nowrap;overflow:hidden";
  var sl="width:14px;padding:1px 2px;font-size:11px;font-weight:700;color:#374151;border-bottom:2px solid #9ca3af;overflow:hidden;white-space:nowrap;text-overflow:ellipsis";
  return"<tr><td style='"+sl+"'></td><td style='"+sb+"'>Итого</td></tr>";
}
function TR6(l,tot,v,nv,t,nt,cls,ind){
  var cn="";if(cls==="g"&&(tot||0)>0)cn="color:#16a34a";if(cls==="r"&&(tot||0)<0)cn="color:#dc2626";if(cls==="m")cn="color:#6b7280";
  var sl="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:1px 2px;color:#1f2937;font-size:12px"+(ind?";padding-left:8px":"");
  var sc="padding:1px 2px;text-align:right;white-space:nowrap;font-size:12px;color:#1f2937"+(cn?";"+cn:"");
  return"<tr><td style='"+sl+"'>"+l+"</td><td style='"+sc+"'>"+fmt(tot)+"</td></tr>";
}
function SEP6(l,tot,v,nv,t,nt,cls){
  var cn="";if(cls==="g"&&(tot||0)>0)cn="color:#16a34a";if(cls==="r"&&(tot||0)<0)cn="color:#dc2626";
  var s="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:1px 2px;font-weight:700;font-size:12px;color:#111827;border-top:1px solid #d1d5db";
  var sc=s+";text-align:right;white-space:nowrap"+(cn?";"+cn:"");
  return"<tr><td style='"+s+"'>"+l+"</td><td style='"+sc+"'>"+fmt(tot)+"</td></tr>";
}
function SEC(l){return"<tr><td colspan='2' style='padding:5px 4px 1px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;border-top:1px solid #e5e7eb'>"+l+"</td></tr>";}


function render(r,live){
  var rows=[];rows.push(HDR());
  rows.push(TR6("Остаток "+r.d0+" · ВСИП",r.vSt,r.vSt,null,null,null,"",""));
  rows.push(TR6("Остаток "+r.d0+" · ТТ",r.tSt,null,null,r.tSt,null,r.tSt<0?"r":"",""));
  rows.push(SEP6("ИТОГО на "+r.d0,r.tS,r.vSt,null,r.tSt,null,""));
  rows.push(TR6("Остаток "+r.d1+" · ВСИП",r.vEnd,r.vEnd,null,null,null,"",""));
  rows.push(TR6("Остаток "+r.d1+" · ТТ",r.tEnd,null,null,r.tEnd,null,r.tEnd<0?"r":"",""));
  rows.push(SEP6("ИТОГО на "+r.d1,r.tE,r.vEnd,null,r.tEnd,null,r.tE>=0?"g":"r"));

  rows.push(SEC("Поступления"));
  var hasPi=Object.keys(r.piP_v).length>0||Object.keys(r.piP_t).length>0;
  if(hasPi){
    PO.forEach(function(p){
      var pv=r.piP_v[p]||0,pt=r.piP_t[p]||0;
      if(pv||pt)rows.push(TR6(PN[p],pv+pt,pv,pv>0?r.vVatPiP[p]||0:null,pt,pt>0?r.tVatPiP[p]||0:null,"g",1));
    });
  }else if(r.pjIn){
    rows.push(TR6("Поступления по проектам",r.pjIn,r.vPjIn,null,r.tPjIn,null,"g",1));
  }
  if(r.pr)rows.push(TR6("Процентные доходы",r.pr,r.vPr,null,r.tPr,null,"g",1));
  if(r.refund)rows.push(TR6("Возвраты",r.refund,r.vRefund,r.vVatRefV||null,r.tRefund,r.tVatRefV||null,"g",1));
  if(r.poIn)rows.push(TR6("Прочие поступления",r.poIn,r.vPoIn,null,r.tPoIn,null,"g",1));
  rows.push(SEP6("Итого поступлений",r.tot,r.vPjIn+r.vPr+r.vRefund+r.vPoIn,r.vVatTotalIn,r.tPjIn+r.tPr+r.tRefund+r.tPoIn,r.tVatTotalIn,"g"));

  rows.push(SEC("Расходы по проектам"));
  var hasPo=Object.keys(r.poP_v).length>0||Object.keys(r.poP_t).length>0;
  if(hasPo){
    PO.forEach(function(p){
      var pv=r.poP_v[p]||0,pt=r.poP_t[p]||0;
      if(pv||pt)rows.push(TR6(PN[p],pv+pt,pv,r.vVatPoP[p]||0,pt,r.tVatPoP[p]||0,"",1));
    });
  }
  rows.push(SEP6("Итого проекты",r.pjOut,r.vPjOut,r.vVatTotalOut-r.vVatOffV||null,r.tPjOut,r.tVatTotalOut-r.tVatOffV||null,""));

  rows.push(SEC("Офисные расходы"));
  if(r.zp)rows.push(TR6("Зарплата",r.zp,r.vZp,r.vVatZp||null,r.tZp,r.tVatZp||null,"",1));
  if(r.km)rows.push(TR6("Командировочные",r.km,r.vKm,r.vVatKm||null,r.tKm,r.tVatKm||null,"",1));
  if(r.ins)rows.push(TR6("Страхование",r.ins,r.vIns,r.vVatIns||null,r.tIns,r.tVatIns||null,"",1));
  if(r.bk)rows.push(TR6("Банковские комиссии",r.bk,r.vBk,r.vVatBk||null,r.tBk,r.tVatBk||null,"",1));
  if(r.lz)rows.push(TR6("Лизинг",r.lz,r.vLz,r.vVatLz||null,r.tLz,r.tVatLz||null,"",1));
  if(r.ar)rows.push(TR6("Аренда",r.ar,r.vAr,r.vVatAr||null,r.tAr,r.tVatAr||null,"",1));
  if(r.buh)rows.push(TR6("Бухгалтерия",r.buh,r.vBuh,r.vVatBuh||null,r.tBuh,r.tVatBuh||null,"",1));
  if(r.ntax)rows.push(TR6("Налоги и взносы",r.ntax,r.vNtax,r.vVatNtax||null,r.tNtax,r.tVatNtax||null,"",1));
  if(r.pct)rows.push(TR6("Проценты к уплате",r.pct,r.vPct,r.vVatPct||null,r.tPct,r.tVatPct||null,"",1));
  if(r.bg)rows.push(TR6("Банковские гарантии",r.bg,r.vBg,r.vVatBg||null,r.tBg,r.tVatBg||null,"",1));
  if(r.pjOutOff)rows.push(TR6("Возвр. клиентам",r.pjOutOff,r.vPjOutOff,r.vVatPjOutOff||null,r.tPjOutOff,r.tVatPjOutOff||null,"",1));
  if(r.po)rows.push(TR6("Прочие офисные",r.po,r.vPo,r.vVatPo||null,r.tPo,r.tVatPo||null,"",1));
  var offV=r.vZp+r.vKm+r.vBk+r.vIns+r.vLz+r.vAr+r.vBuh+r.vNtax+r.vPo+r.vPct+r.vBg+r.vPjOutOff;
  var offT=r.tZp+r.tKm+r.tBk+r.tIns+r.tLz+r.tAr+r.tBuh+r.tNtax+r.tPo+r.tPct+r.tBg+r.tPjOutOff;
  rows.push(SEP6("Итого офисные",r.zp+r.km+r.bk+r.ins+r.lz+r.ar+r.buh+r.ntax+r.po+r.pct+r.bg+(r.pjOutOff||0),offV,r.vVatOffV||null,offT,r.tVatOffV||null,""));

  rows.push(SEC("Переводы между счетами"));
  if(r.trIn_v||r.trIn_t){
    rows.push(TR6("Получено",r.trIn_v+r.trIn_t,r.trIn_v,r.vVatTrInD||null,r.trIn_t,r.tVatTrInD||null,"g",1));
  }
  if(r.trOut_v||r.trOut_t){
    rows.push(TR6("Списано",r.trOut_v+r.trOut_t,r.trOut_v,r.vVatTrOutD||null,r.trOut_t,r.tVatTrOutD||null,"",1));
  }
  rows.push(SEP6("Нетто переводы",r.trNetto,(r.trIn_v-r.trOut_v),(r.vVatTrInD-r.vVatTrOutD)||null,(r.trIn_t-r.trOut_t),(r.tVatTrInD-r.tVatTrOutD)||null,r.trNetto>0?"g":r.trNetto<0?"r":""));

  if(r.skIn||r.skOut){
    rows.push(SEC("Финансирование (займы)"));
    if(r.skIn)rows.push(TR6("Получение займов",r.skIn,r.vSkIn,null,r.tSkIn,null,"g",1));
    if(r.skOut)rows.push(TR6("Погашение займов",r.skOut,r.vSkOut,null,r.tSkOut,null,"",1));
    rows.push(SEP6("Нетто займы",r.skIn-r.skOut,r.vSkIn-r.vSkOut,null,r.tSkIn-r.tSkOut,null,r.skIn-r.skOut>0?"g":r.skIn-r.skOut<0?"r":""));
  }

  rows.push(SEP6("ВСЕГО РАСХОДОВ",r.te+r.skOut-r.trNetto,null,r.vVatTotalOut||null,null,r.tVatTotalOut||null,""));
  rows.push(SEP6(r.cOk?"Контрольная сумма":"Контрольная сумма ⚠",r.ctrl,r.vCtrl,null,r.tCtrl,null,r.cOk?"g":"r"));

  var st=live?'<span style="color:#16a34a">● live · '+r.cnt+' тр.</span>':'<span style="color:#9ca3af">данные на '+r.d1+'</span>';
  return'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">'
    +'<div><div style="font-size:14px;font-weight:600">ДДС — '+r.label+'</div>'
    +'<div style="font-size:11px;color:#9ca3af;margin-top:1px">'+r.d0+' — '+r.d1+'</div></div>'
    +'<div style="display:flex;align-items:center;gap:5px;flex-shrink:0">'
    +'<span id="st" style="font-size:11px">'+st+'</span>'
    +'<button id="btn" style="background:none;border:1px solid #d1d5db;color:#6b7280;font-size:11px;padding:1px 6px;border-radius:3px;cursor:pointer">↻</button>'
    +'<button id="rst" style="background:none;border:1px solid #d1d5db;color:#9ca3af;font-size:11px;padding:1px 5px;border-radius:3px;cursor:pointer">⟳₀</button>'
    +'</div></div>'
    +'<table style="table-layout:fixed;width:100%">'+rows.join('')+'</table>'
    +'<div style="margin-top:5px;font-size:11px;color:#9ca3af">обновлено: '+new Date().toLocaleTimeString("ru-RU")+'</div>';
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
    tr.innerHTML="<td style='padding:2px 4px;font-size:10px;color:#666;white-space:nowrap'>"+p.date+"</td>"
      +"<td style='padding:2px 4px;font-size:10px;color:#9ca3af;white-space:nowrap'>"+(p.org||"")+"</td>"
      +"<td style='padding:2px 4px;font-size:10px;color:#374151;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'>"+(p.contr||"—")+"</td>"
      +"<td style='padding:2px 4px;font-size:10px;color:#666'>"+p.cat+"</td>"
      +"<td style='padding:2px 4px;font-size:10px;text-align:right;white-space:nowrap'>"+fmtI(p.out)+"</td>";
    t.appendChild(tr);
  });
  d.appendChild(t);document.getElementById("root").appendChild(d);
}

function load(reset){
  var el=document.getElementById("root"),rng=getRange();
  var selDate=document.getElementById("sel-date");
  var cutoff=selDate?selDate.value:"";
  if(!cutoff){var _n=new Date();var _p=function(v){return v<10?"0"+v:""+v;};cutoff=_n.getFullYear()+"-"+_p(_n.getMonth()+1)+"-"+_p(_n.getDate());}
  if(cutoff<rng.s0)cutoff=rng.s0;if(cutoff>rng.s1)cutoff=rng.s1;
  if(reset)clrF(rng.ymd);
  var s=document.getElementById("st");
  if(s){s.textContent="загрузка…";s.style.color="#9ca3af";}
  Promise.all([
    loadAll("transaction"),
    loadAll("categories"),
    loadAll("transaction_pls",{"filter[category_id]":"3144,3147"}).catch(function(){return[];}),
    loadAll("crm_account").catch(function(){return[];})
  ]).then(function(res){
    var txAll=res[0],cats=res[1],pls=res[2],contrArr=res[3];
    var contrMap={};(contrArr||[]).forEach(function(c){if(c.id)contrMap[c.id]=c.name||"";});
    var rng=getRange();
    var txM=txAll.filter(function(tx){return tx.date&&tx.date>=rng.s0&&tx.date<=cutoff;});
    if(txM.length){
      var r=calc(txM,txAll,cats,pls,rng,cutoff,contrMap);
      el.innerHTML=render(r,true);
      renderPoDet(r.poDet);
    }else{
      el.innerHTML="<div style='padding:12px;font-size:11px;color:#666'>Нет данных за "+rng.label+" ("+rng.s0+" — "+rng.s1+")</div>";
    }
    var b=document.getElementById("btn");if(b)b.onclick=function(){load(false);};
    var rb=document.getElementById("rst");if(rb)rb.onclick=function(){load(true);};
  }).catch(function(e){
    el.innerHTML="<div style='padding:12px;color:#dc2626'>Ошибка: "+e+"</div>";
    console.error("[DDS]",e);
  });
}

(function(){
  var n=new Date(),p=function(v){return v<10?"0"+v:""+v;};
  var todayStr=n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate());
  var monthStartStr=n.getFullYear()+"-"+p(n.getMonth()+1)+"-01";
  var ss=document.getElementById("sel-start");
  var se=document.getElementById("sel-date");
  if(ss){ss.value=monthStartStr;ss.addEventListener("change",function(){load(false);});}
  if(se){se.value=todayStr;se.addEventListener("change",function(){load(false);});}
})();

load(false);
setInterval(function(){load(false);},5*60*1000);

// ===== БЮДЖЕТ-ФАКТ =====
function loadBudget(){
  var projEl=document.getElementById("bgt-proj");
  var monthEl=document.getElementById("bgt-month");
  if(!projEl||!monthEl)return;
  var proj=parseInt(projEl.value);
  var ym=monthEl.value;
  if(!ym)return;
  var ms=ym+"-01";
  var yr=parseInt(ym.slice(0,4)),mo=parseInt(ym.slice(5,7));
  var mEnd=new Date(yr,mo,0).getDate();
  var me=ym+"-"+(mEnd<10?"0":"")+mEnd;
  var bgtEl=document.getElementById("bgt-root");
  bgtEl.innerHTML="<span style='color:#9ca3af;font-size:11px'>загрузка...</span>";
  Promise.all([
    loadAll("plan_money",{"filter[plan_paid_date][start_date]":ms,"filter[plan_paid_date][end_date]":me}),
    loadAll("transaction",{"filter[date][start_date]":ms,"filter[date][end_date]":me}),
    loadAll("categories")
  ]).then(function(res){
    var plans=res[0]||[],txns=res[1]||[],cats=res[2]||[];
    var cMap={};
    cats.forEach(function(c){cMap[parseInt(c.id)]={name:c.name||"",parent_id:parseInt(c.parent_id)||0};});
    function rootParent(cid){
      var cur=cid,n=0;
      while(cur&&n++<10){var c=cMap[cur];if(!c||!c.parent_id)return cur;cur=c.parent_id;}
      return cur||cid;
    }
    // Бюджет: org_account_id=36, project_id=proj, type=40
    var bud={};
    plans.forEach(function(p){
      if(parseInt(p.org_account_id)!==36)return;
      if(parseInt(p.project_id)!==proj)return;
      if(parseInt(p.type)!==40)return;
      var cid=parseInt(p.category_id);
      bud[cid]=(bud[cid]||0)+(parseFloat(p.total)||0);
    });
    // Факт: только расходы, исключить org_id=3 и переводы/НДС
    var fct={};
    var SKIP={1004:1,1007:1,3144:1,3147:1,3157:1,3158:1};
    txns.forEach(function(tx){
      if(parseInt(tx.project_id)!==proj)return;
      if(parseInt(tx.org_id)===3)return;
      var cid=parseInt(tx.category_id);
      if(SKIP[cid])return;
      var amt=(parseFloat(tx.outcome)||0)-(parseFloat(tx.income)||0);
      if(amt<=0)return;
      fct[cid]=(fct[cid]||0)+amt;
    });
    var allCids={};
    Object.keys(bud).forEach(function(k){allCids[k]=1;});
    Object.keys(fct).forEach(function(k){allCids[k]=1;});
    var MAT=4,SMR=3109;
    var gMat=[],gSmr=[],gOth=[];
    Object.keys(allCids).forEach(function(k){
      var cid=parseInt(k),rp=rootParent(cid);
      if(rp===MAT)gMat.push(cid);
      else if(rp===SMR)gSmr.push(cid);
      else gOth.push(cid);
    });
    var byNm=function(a,b){return((cMap[a]&&cMap[a].name)||"").localeCompare((cMap[b]&&cMap[b].name)||"","ru");};
    gMat.sort(byNm);gSmr.sort(byNm);gOth.sort(byNm);
    var fmt=function(v){return new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(Math.round(v||0));};
    var TD="padding:2px 6px;font-size:11px;";
    var TDR=TD+"text-align:right;white-space:nowrap;";
    function dClr(d){return d<-100?"#dc2626":d>100?"#15803d":"#6b7280";}
    function row(lbl,b,f,ind,bold,bg){
      var d=b-f,fw=bold?"font-weight:600;":"";
      return "<tr style='background:"+(bg||"transparent")+"'>"
        +"<td style='"+TD+fw+"padding-left:"+(ind||4)+"px'>"+lbl+"</td>"
        +"<td style='"+TDR+fw+"'>"+fmt(b)+"</td>"
        +"<td style='"+TDR+fw+"'>"+fmt(f)+"</td>"
        +"<td style='"+TDR+fw+"color:"+dClr(d)+"'>"+fmt(d)+"</td>"
        +"</tr>";
    }
    function section(cids,lbl){
      if(!cids.length)return"";
      var sB=0,sF=0,rows="";
      cids.forEach(function(cid){
        var b=bud[cid]||0,f=fct[cid]||0;
        sB+=b;sF+=f;
        rows+=row((cMap[cid]&&cMap[cid].name)||("кат."+cid),b,f,14,false,"");
      });
      return row(lbl,sB,sF,4,true,"#eff6ff")+rows+row("Итого: "+lbl,sB,sF,4,false,"#f3f4f6");
    }
    var tB=0,tF=0;
    Object.keys(bud).forEach(function(k){tB+=bud[k]||0;});
    Object.keys(fct).forEach(function(k){tF+=fct[k]||0;});
    var html="<table style='width:100%;border-collapse:collapse;border:1px solid #e5e7eb'>"
      +"<thead><tr style='background:#f8f9fd;border-bottom:2px solid #e5e7eb'>"
      +"<th style='"+TD+"text-align:left;font-weight:600'>Статья</th>"
      +"<th style='"+TDR+"font-weight:600'>Бюджет</th>"
      +"<th style='"+TDR+"font-weight:600'>Факт</th>"
      +"<th style='"+TDR+"font-weight:600'>Остаток</th>"
      +"</tr></thead><tbody>"
      +section(gMat,"Материалы")
      +section(gSmr,"СМР")
      +section(gOth,"Прочие")
      +row("ИТОГО",tB,tF,4,true,"#e0e7ff")
      +"</tbody></table>";
    bgtEl.innerHTML=html;
  }).catch(function(e){
    bgtEl.innerHTML="<span style='color:#dc2626;font-size:11px'>Ошибка: "+e+"</span>";
  });
}
(function(){
  var mp=document.getElementById("bgt-month");
  if(mp){
    var n=new Date(),cy=n.getFullYear(),cm=n.getMonth()+1;
    for(var i=0;i<12;i++){
      var d2=new Date(cy,cm-1-i,1);
      var y2=d2.getFullYear(),m2=d2.getMonth()+1;
      var ym2=y2+"-"+(m2<10?"0":"")+m2;
      var opt=document.createElement("option");
      opt.value=ym2;opt.textContent=(m2<10?"0":"")+m2+"."+y2;
      if(i===0)opt.selected=true;
      mp.appendChild(opt);
    }
    mp.addEventListener("change",loadBudget);
  }
  var pp=document.getElementById("bgt-proj");
  if(pp)pp.addEventListener("change",loadBudget);
  loadBudget();
})();

})();
</script>
</body>
</html>`;
}
