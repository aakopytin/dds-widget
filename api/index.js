module.exports.config = { api: { bodyParser: false } };

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

module.exports = async function handler(req, res) {
res.setHeader('X-Frame-Options', 'ALLOWALL');
res.setHeader('Content-Security-Policy', "frame-ancestors *");
res.setHeader('Content-Type', 'text/html; charset=utf-8');

if (req.method === 'POST') {
var raw = await readBody(req);
var fields = parseForm(raw);
var domain = fields['domain'] || '';
var accountId = fields['account[id]'] || '';
var accessToken = fields['auth[access_token]'] || '';
console.log('[DDS] POST | domain:', domain, '| account:', accountId, '| hasToken:', !!accessToken);
return res.status(200).send(html(domain, accountId, accessToken));
}

return res.status(200).send('<html><body style="font-family:sans-serif;padding:20px">' +
'<h3>&#x2713; ÐÐÐ¡ Ð²Ð¸Ð´Ð¶ÐµÑ ÑÐ°Ð±Ð¾ÑÐ°ÐµÑ</h3></body></html>');
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
<title>ÐÐÐ¡</title>
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
<div id="filters" style="display:flex;gap:6px;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e5e7eb"><span style="font-size:11px;color:#6b7280">C</span><input type="date" id="d0" style="font-size:11px;border:1px solid #d1d5db;border-radius:3px;padding:2px 4px;color:#374151"><span style="font-size:11px;color:#6b7280">Ð¿Ð¾</span><input type="date" id="d1" style="font-size:11px;border:1px solid #d1d5db;border-radius:3px;padding:2px 4px;color:#374151"></div>
<div id="root" style="color:#9ca3af">ÐÐÐ¡ â Ð·Ð°Ð³ÑÑÐ·ÐºÐ°â¦</div>
<script>
var DOMAIN="${esc(domain)}";
var ACCOUNT_ID="${esc(accountId)}";
var TOKEN="${esc(accessToken)}";

var VSIP={
"ÐÐ»ÑÑÐ° ÐÐ¡ÐÐ":1,"ÐÐ¡ÐÐ ÐÐµÐ¿Ð¾Ð·Ð¸ÑÑ":1,"Ð¡ÑÐµÑ ÐÐ¢Ð":1,
"Ð¡ÑÐµÑ Ð Ð¥Ð¡Ð":1,"Ð¡ÑÐµÑ Ð¡Ð±ÐµÑÐ±Ð°Ð½Ðº":1,"Ð¡ÑÐµÑ Ð¡Ð¾Ð²ÐºÐ¾Ð¼Ð±Ð°Ð½Ðº":1
};
var TT={"ÐÐ»ÑÑÐ° Ð¢Ð¢ (ÐÐ¡ÐÐ)":1};
var OFF={24:1,26:1,27:1};
var PN={1:"ÐÐµÐ¼ÐµÑÐ¾Ð²Ð¾",3:"Ð®Ð¶Ð½Ð¾-Ð¡Ð°ÑÐ°Ð»Ð¸Ð½ÑÐº",13:"ÐÐ°ÑÐ½Ð°ÑÐ»",12:"ÐÐ¸ÑÐ¾Ð²",
23:"Ð¡ÑÐºÑÑÐ²ÐºÐ°Ñ",9:"Ð ÑÐ·Ð°ÐµÐ²ÐºÐ°",7:"ÐÐ²Ð¾Ð»Ð³Ð¸Ð½ÑÐº",6:"ÐÐµÑÐ½Ð¾Ð³Ð¾ÑÑÐº",
100:"Ð¦ÐµÐ½ÑÑÐ°Ð»ÑÐ½ÑÐ¹ Ð´Ð¾Ð³Ð¾Ð²Ð¾Ñ",101:"ÐÑÐ¾ÑÐ¸Ðµ Ð¿ÑÐ¾ÐµÐºÑÑ"};
var PO=[1,3,13,12,23,9,7,6,100,101];
var PG={2:100,18:100,19:100,29:100,30:100,31:100,32:100,33:100,17:101,20:101,22:101};
var AC={
"ÐÐµÑÐµÐ²Ð¾Ð´ Ð¼ÐµÐ¶Ð´Ñ ÑÑÐµÑÐ°Ð¼Ð¸ (Ð¿Ð¾ÑÑÑÐ¿Ð»ÐµÐ½Ð¸Ðµ)":"tr",
"ÐÐµÑÐµÐ²Ð¾Ð´ Ð¼ÐµÐ¶Ð´Ñ ÑÑÐµÑÐ°Ð¼Ð¸ (ÑÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ)":"tr",
"ÐÐ¾Ð»ÑÑÐµÐ½Ð¸Ðµ ÐºÑÐµÐ´Ð¸ÑÐ°":"skip","ÐÑÐ¿Ð»Ð°ÑÐ° ÐºÑÐµÐ´Ð¸ÑÐ°":"skip",
"ÐÐºÐ°Ð·Ð°Ð½Ð¸Ðµ ÑÑÐ»ÑÐ³":"pjIn","ÐÐ¾Ð·Ð²ÑÐ°Ñ ÐÐ¡. Ð·Ð° Ð·Ð°ÐºÐ°Ð·Ñ":"refund",
"ÐÑÐ¾ÑÐµÐ½ÑÑ Ðº Ð¿Ð¾Ð»ÑÑÐµÐ½Ð¸Ñ":"pr",
"ÐÐ°ÑÐ¿Ð»Ð°ÑÐ°":"zp","ÐÐ¾Ð¼Ð°Ð½Ð´Ð¸ÑÐ¾Ð²ÐºÐ¸":"km","Ð¡ÑÑÐ°ÑÐ¾Ð²Ð°Ð½Ð¸Ðµ":"ins",
"Ð Ð°ÑÑÐ¾Ð´Ñ Ð½Ð° ÑÑÐ»ÑÐ³Ð¸ Ð±Ð°Ð½ÐºÐ¾Ð²":"bk",
"ÐÐ°Ð»Ð¾Ð³Ð¸ Ð¸ Ð²Ð·Ð½Ð¾ÑÑ":"po","ÐÐ°Ð»Ð¾Ð³Ð¸ - ÐÐÐ¡":"po","ÐÑÐ¾ÑÐµÐµ":"po",
"ÐÑÐµÐ½Ð´Ð°":"po","ÐÑÑÐ³Ð°Ð»ÑÐµÑÐ¸Ñ":"po","ÐÐ½ÑÐµÑÐ½ÐµÑ Ð¸ ÑÐ²ÑÐ·Ñ":"po",
"Ð Ð°ÑÑÐ¾Ð´Ñ Ð½Ð° Ð»Ð¸Ð·Ð¸Ð½Ð³":"po","ÐÑÐ¾ÑÐµÐ½ÑÑ Ðº ÑÐ¿Ð»Ð°ÑÐµ":"po","ÐÐ±Ð¾ÑÑÐ´Ð¾Ð²Ð°Ð½Ð¸Ðµ":"po",
"ÐÐ¾Ð·Ð²ÑÐ°ÑÑ ÐºÐ»Ð¸ÐµÐ½ÑÐ°Ð¼":"po","ÐÐµÑÐ°ÑÐ¿ÑÐµÐ´ÐµÐ»ÐµÐ½Ð½ÑÐµ":"po",
"ÐÐµÑÐ°ÑÐ¿ÑÐµÐ´ÐµÐ»ÐµÐ½Ð½ÑÐµ (ÑÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ)":"po","Ð¢ÐµÑÑÑ Ð¸ Ð¸ÑÐ¿ÑÑÐ°Ð½Ð¸Ñ":"po",
"Ð£ÑÐ»ÑÐ³Ð¸ Ð¿Ð¾ ÑÐµÑÑÐ¸ÑÐ¸ÐºÐ°ÑÐ¸Ð¸":"po",
"Ð¡Ð¾ÑÑÐ°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð¸ÑÐ¿Ð¾Ð»Ð½Ð¸ÑÐµÐ»ÑÐ½Ð¾Ð¹ Ð´Ð¾ÐºÑÐ¼ÐµÐ½ÑÐ°ÑÐ¸Ð¸":"po",
"Ð¡ÐÐ  (ÐÐµÐ· Ð´ÐµÑÐ°Ð»Ð¸Ð·Ð°ÑÐ¸Ð¸)":"pjOut","Ð¡ÐÐ  ÐÐµÐ½Ñ+ÐºÐ¾Ð½Ð´Ð¸Ñ":"pjOut",
"ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ (ÐÐµÐ½ÑÐ¸Ð»ÑÑÐ¸Ñ)":"pjOut","ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ (ÐÑÐ¾Ð¿Ð»ÐµÐ½Ð¸Ðµ)":"pjOut",
"ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ (ÐÐ¾ÑÐ¾Ð»ÐºÐ¸)":"pjOut","ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ (ÐÑÐ¾ÐµÐ¼Ñ)":"pjOut",
"ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ (Ð¡ÑÐµÐ½Ñ)"ÐÐ¾Ñt","ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ (Ð¢ÑÐ°Ð½ÑÐ¿Ð¾ÑÑ, ÐÐ¾Ð³Ð¸ÑÑÐ¸ÐºÐ°)":"pjOut",
"ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ (Ð­Ð»ÐµÐºÑÑÐ¸ÐºÐ°)":"pjOut","ÐÐ°ÑÐµÑÐ¸Ð°Ð»Ñ ÑÐµÑÐ½Ð¾Ð²ÑÐµ":"pjOut",
"ÐÑÐ¾ÐµÐºÑÐ¸ÑÐ¾Ð²Ð°Ð½Ð¸Ðµ-ÐÐ·ÑÑÐºÐ°Ð½Ð¸Ðµ":"pjOut"
};

function fmt(v){if(!v&&v!==0)return"â";if(v===0)return"â";return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);}
function fmtI(v){return new Intl.NumberFormat("ru-RU",{minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0);}
function num(s){if(!s&&s!==0)return 0;return parseFloat(String(s).replace(/[^\\d.\\-]/g,""))||0;}
function padZ(n){return n<10?"0"+n:""+n;}
function getRange(){
var d0el=document.getElementById("d0"),d1el=document.getElementById("d1");
var now=new Date(),y=now.getFullYear(),m=now.getMonth();
var end=Math.min(now.getDate(),new Date(y,m+1,0).getDate());
var defS0=y+"-"+padZ(m+1)+"-01";
var defS1=y+"-"+padZ(m+1)+"-"+padZ(end);
var s0=(d0el&&d0el.value)||defS0;
var s1=(d1el&&d1el.value)||defS1;
var pts0=s0.split("-"),pts1=s1.split("-");
var d0=padZ(parseInt(pts0[2],10))+"."+padZ(parseInt(pts0[1],10))+"."+pts0[0];
var d1=padZ(parseInt(pts1[2],10))+"."+padZ(parseInt(pts1[1],10))+"."+pts1[0];
var ymd=s0.slice(0,7);
var mo=["Ð¯Ð½Ð²Ð°ÑÑ","Ð¤ÐµÐ²ÑÐ°Ð»Ñ","ÐÐ°ÑÑ","ÐÐ¿ÑÐµÐ»Ñ","ÐÐ°Ð¹","ÐÑÐ½Ñ","ÐÑÐ»Ñ","ÐÐ²Ð³ÑÑÑ","Ð¡ÐµÐ½ÑÑÐ±ÑÑ","ÐÐºÑÑÐ±ÑÑ","ÐÐ¾ÑÐ±ÑÑ","ÐÐµÐºÐ°Ð±ÑÑ"];
var label=s0.slice(0,7)===s1.slice(0,7)?mo[parseInt(pts0[1],10)-1]+" "+pts0[0]:d0+" â "+d1;
return{ymd:ymd,s0:s0,s1:s1,d0:d0,d1:d1,label:label};
}

var lk=function(ym){return"dds_"+ACCOUNT_ID+"_"+ym;};
function getF(ym){try{var s=localStorage.getItem(lk(ym));return s?JSON.parse(s):null;}catch(e){return null;}}
function setF(ym,v,t){try{localStorage.setItem(lk(ym),JSON.stringify({v:v,t:t}));}catch(e){}}
function clrF(ym){try{localStorage.removeItem(lk(ym));}catch(e){}}

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

var vEnd=0, tEnd=0;
txAll.forEach(function(tx){
if(!tx.date||tx.date>rng.s1)return;
var an=aMap[tx.org_account_id]||"";
var inc=num(tx.income)||0, out=num(tx.outcome)||0;
if(VSIP[an]){vEnd+=inc-out;}
if(TT[an]) {tEnd+=inc-out;}
});

var pr=0,zp=0,km=0,bk=0,ins=0,po=0,pjIn=0,pjOut=0,refund=0,trIn=0,trOut=0;
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
if(cat==="tr"){
if(rp===24||rp===26){if(inc>0)trIn+=inc;if(out>0)trOut+=out;}
return;
}
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

var vSt=0, tSt=0;
txAll.forEach(function(tx){
if(!tx.date||tx.date>=rng.s0)return;
var an=aMap[tx.org_account_id]||"";
var inc=num(tx.income)||0, out=num(tx.outcome)||0;
if(VSIP[an]){vSt+=inc-out;}
if(TT[an]) {tSt+=inc-out;}
});

var te=pjOut+zp+km+bk+ins+po;
return{vSt:vSt,tSt:tSt,vEnd:vEnd,tEnd:tEnd,tS:vSt+tSt,tE:(vEnd||0)+(tEnd||0),
pr:pr,pjIn:pjIn,refund:refund,pjOut:pjOut,zp:zp,km:km,bk:bk,ins:ins,po:po,te:te,trIn:trIn,trOut:trOut,
piP:piP,poP:poP,poDet:poDet,cnt:txMonth.length,d0:rng.d0,d1:rng.d1,label:rng.label,ymd:rng.ymd};
}

function TR(l,v,cls,ind){var n=fmt(v),c="";if(cls==="g"&&v>0)c="color:#16a34a";if(cls==="r"&&v<0)c="color:#dc2626";if(cls==="m")c="color:#9ca3af";var s1="padding:4px 6px"+(ind?";padding-left:14px":"");var s2="padding:4px 6px;text-align:right;white-space:nowrap"+(c?";"+c:"");return"<tr><td style='"+s1+"'>"+l+"</td><td style='"+s2+"'>"+n+"</td></tr>";}
function SEP(l,v,cls){var n=fmt(v),c="";if(cls==="g"&&v>0)c="color:#16a34a";if(cls==="r"&&v<0)c="color:#dc2626";var s="padding:4px 6px;font-weight:600;border-top:1px solid #e5e7eb";return"<tr><td style='"+s+"'>"+l+"</td><td style='"+s+";text-align:right;white-space:nowrap"+(c?";"+c:"")+"'>"+n+"</td></tr>";}
function SEC(l){return"<tr><td colspan='2' style='padding:7px 6px 2px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-top:1px solid #e5e7eb'>"+l+"</td></tr>";}

function render(r,live){
var rows=[],tot=0;
rows.push(TR("ÐÑÑÐ°ÑÐ¾Ðº "+r.d0+" Â· ÐÐ¡ÐÐ",r.vSt,"",""));
rows.push(TR("ÐÑÑÐ°ÑÐ¾Ðº "+r.d0+" Â· Ð¢Ð¢",r.tSt,r.tSt<0?"r":"",""));
rows.push(SEP("ÐÐ¢ÐÐÐ Ð½Ð° "+r.d0,r.tS,""));
rows.push(TR("ÐÑÑÐ°ÑÐ¾Ðº "+r.d1+" Â· ÐÐ¡ÐÐ",r.vEnd,"",""));
rows.push(TR("ÐÑÑÐ°ÑÐ¾Ðº "+r.d1+" Â· Ð¢Ð¢",r.tEnd,r.tEnd<0?"r":"",""));
rows.push(SEP("ÐÐ¢ÐÐÐ Ð½Ð° "+r.d1,r.tE,r.tE>=0?"g":"r"));
rows.push(SEC("ÐÐ¾ÑÑÑÐ¿Ð»ÐµÐ½Ð¸Ñ"));
var hasPi=Object.keys(r.piP).length>0;
if(hasPi){PO.forEach(function(p){var v=r.piP[p];if(v){rows.push(TR(PN[p],v,"g",1));tot+=v;}});}
else if(r.pjIn){rows.push(TR("ÐÐ¾ÑÑÑÐ¿Ð»ÐµÐ½Ð¸Ñ Ð¿Ð¾ Ð¿ÑÐ¾ÐµÐºÑÐ°Ð¼",r.pjIn,"g",1));tot+=r.pjIn;}
if(r.pr){rows.push(TR("ÐÑÐ¾ÑÐµÐ½ÑÐ½ÑÐµ Ð´Ð¾ÑÐ¾Ð´Ñ",r.pr,"g",1));tot+=r.pr;}
if(r.refund){rows.push(TR("ÐÐ¾Ð·Ð²ÑÐ°ÑÑ",r.refund,"g",1));tot+=r.refund;}
rows.push(SEP("ÐÑÐ¾Ð³Ð¾ Ð¿Ð¾ÑÑÑÐ¿Ð»ÐµÐ½Ð¸Ð¹",tot,"g"));
rows.push(SEC("Ð Ð°ÑÑÐ¾Ð´Ñ Ð¿Ð¾ Ð¿ÑÐ¾ÐµÐºÑÐ°Ð¼"));
var hasPo=Object.keys(r.poP).length>0;
if(hasPo){PO.forEach(function(p){var v=r.poP[p]||0;rows.push(TR(PN[p],v,v?"":"m",1));});}
rows.push(SEP("ÐÑÐ¾Ð³Ð¾ Ð¿ÑÐ¾ÐµÐºÑÑ",r.pjOut,""));
rows.push(SEC("ÐÑÐ¸ÑÐ½ÑÐµ ÑÐ°ÑÑÐ¾Ð´Ñ"));
rows.push(TR("ÐÐ°ÑÐ¿Ð»Ð°ÑÐ°",r.zp,r.zp?"":"m",1));
rows.push(TR("ÐÐ¾Ð¼Ð°Ð½Ð´Ð¸ÑÐ¾Ð²Ð¾ÑÐ½ÑÐµ",r.km,r.km?"":"m",1));
rows.push(TR("Ð¡ÑÑÐ°ÑÐ¾Ð²Ð°Ð½Ð¸Ðµ",r.ins,r.ins?"":"m",1));
rows.push(TR("ÐÐ°Ð½ÐºÐ¾Ð²ÑÐºÐ¸Ðµ ÐºÐ¾Ð¼Ð¸ÑÑÐ¸Ð¸",r.bk,r.bk?"":"m",1));
rows.push(TR("ÐÑÐ¾ÑÐ¸Ðµ ÑÐ°ÑÑÐ¾Ð´Ñ Ð¾ÑÐ¸ÑÐ°",r.po,r.po?"":"m",1));
rows.push(SEP("ÐÑÐ¾Ð³Ð¾ Ð¾ÑÐ¸ÑÐ½ÑÐµ",r.te,""));
var trNetto=r.trIn-r.trOut;
var ctrl=r.tS+tot-(r.te-trNetto)-r.tE,cOk=Math.abs(ctrl)<1;
rows.push(SEC("ÐÐµÑÐµÐ²Ð¾Ð´Ñ Ð¼ÐµÐ¶Ð´Ñ ÑÑÐµÑÐ°Ð¼Ð¸"));
rows.push(TR("ÐÐ¾ÑÑÑÐ¿Ð»ÐµÐ½Ð¸Ñ",r.trIn,r.trIn>0?"g":"m",1));
rows.push(TR("Ð¡Ð¿Ð¸ÑÐ°Ð½Ð¸Ñ",r.trOut,r.trOut>0?"":"m",1));
rows.push(SEP("ÐÑÐ¾Ð³Ð¾ Ð¿ÐµÑÐµÐ²Ð¾Ð´Ñ Ð½ÐµÑÑÐ¾",trNetto,trNetto>0?"g":trNetto<0?"r":""));
rows.push(SEP("ÐÐ¡ÐÐÐ Ð ÐÐ¡Ð¥ÐÐÐÐ",r.te-trNetto,""));
rows.push(SEP(cOk?"ÐÐ¾Ð½ÑÑÐ¾Ð»ÑÐ½Ð°Ñ ÑÑÐ¼Ð¼Ð°":"ÐÐ¾Ð½ÑÑÐ¾Ð»ÑÐ½Ð°Ñ ÑÑÐ¼Ð¼Ð° â ",ctrl,cOk?"g":"r"));
var st=live?'<span style="color:#16a34a">â live Â· '+r.cnt+' ÑÑ.</span>':'<span style="color:#9ca3af">Ð´Ð°Ð½Ð½ÑÐµ Ð½Ð° '+r.d1+'</span>';
return'<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb;">'
+'<div><div style="font-size:13px;font-weight:600">ÐÐÐ¡ â '+r.label+'</div>'
+'<div style="font-size:10px;color:#9ca3af;margin-top:1px">'+r.d0+' â '+r.d1+'</div></div>'
+'<div style="display:flex;align-items:center;gap:5px;flex-shrink:0">'
+'<span id="st" style="font-size:10px">'+st+'</span>'
+'<button id="btn" style="background:none;border:1px solid #d1d5db;color:#6b7280;font-size:10px;padding:1px 6px;border-radius:3px;cursor:pointer">â»</button>'
+'<button id="rst" style="background:none;border:1px solid #d1d5db;color:#9ca3af;font-size:10px;padding:1px 5px;border-radius:3px;cursor:pointer">â³â</button>'
+'</div></div>'
+'<table>'+rows.join('')+'</table>'
+'<div style="margin-top:5px;font-size:10px;color:#9ca3af">Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾: '+new Date().toLocaleTimeString("ru-RU")+'</div>';
}

function renderPoDet(poDet){
if(!poDet||!poDet.length)return;
var d=document.createElement("details"),s=document.createElement("summary");
var tot=poDet.reduce(function(a,p){return a+p.out;},0);
s.textContent="ÐÑÐ¾ÑÐ¸Ðµ ÑÐ°ÑÑÐ¾Ð´Ñ ("+poDet.length+" ÑÑ. Ð½Ð° "+fmtI(tot)+" Ñ.)";
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
if(s){s.textContent="Ð·Ð°Ð³ÑÑÐ·ÐºÐ°â¦";s.style.color="#9ca3af";}

Promise.all([
loadAll("transaction"),
loadAll("bank_account"),
loadAll("categories")
]).then(function(res){
var txAll=res[0],accs=res[1],cats=res[2];
var rng=getRange();
var txM=txAll.filter(function(tx){return tx.date&&tx.date>=rng.s0&&tx.date<=rng.s1;});
console.log("[DDS] tx:",txAll.length,"period:",txM.length,"accs:",accs.length,"cats:",cats.length);
if(txM.length){
var r=calc(txM,txAll,accs,cats,rng);
el.innerHTML=render(r,true);
renderPoDet(r.poDet);
}else{
el.innerHTML="<div style='padding:12px;font-size:11px;color:#666'>"
+"ÐÐµÑ Ð´Ð°Ð½Ð½ÑÑ Ð·Ð° "+rng.label+"<br>"
+"tx Ð²ÑÐµÐ³Ð¾: "+txAll.length+", Ð·Ð° Ð¿ÐµÑÐ¸Ð¾Ð´: "+txM.length+"<br>"
+"Ð´Ð¸Ð°Ð¿Ð°Ð·Ð¾Ð½: "+rng.s0+" â "+rng.s1+"<br>"
+"domain: "+DOMAIN+"<br>"
+"token: "+(TOKEN?TOKEN.slice(0,20)+"...":"Ð½ÐµÑ")
+"</div>";
}
var b=document.getElementById("btn");if(b)b.onclick=function(){load(false);};
var rb=document.getElementById("rst");if(rb)rb.onclick=function(){load(true);};
}).catch(function(e){
el.innerHTML="<div style='padding:12px;color:#dc2626'>ÐÑÐ¸Ð±ÐºÐ°: "+e+"</div>";
console.error("[DDS]",e);
});
}

(function(){
var now=new Date(),y=now.getFullYear(),m=now.getMonth();
var end=Math.min(now.getDate(),new Date(y,m+1,0).getDate());
var pad=function(n){return n<10?"0"+n:""+n;};
var d0el=document.getElementById("d0"),d1el=document.getElementById("d1");
if(d0el){d0el.value=y+"-"+pad(m+1)+"-01";d0el.addEventListener("change",function(){load(false);});}
if(d1el){d1el.value=y+"-"+pad(m+1)+"-"+pad(end);d1el.addEventListener("change",function(){load(false);});}
})();

load(false);
setInterval(function(){load(false);},5*60*1000);
console.log("[DDS] started | domain:",DOMAIN,"| token:",!!TOKEN);
</script>
</body>
</html>`;
}
