
// v20: detailed monthly daily meal plan report + cache killer
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(()=>{});
  if (window.caches) caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(()=>{});
}

const $ = (id)=>document.getElementById(id);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function qs(k){return new URLSearchParams(location.search).get(k)||'';}
function localFind(id){return (JSON.parse(localStorage.getItem('ebej_admin_requests')||'[]')).find(r=>r.id===id);}
function num(v){ return Number(v || 0); }
function round(v,p=1){ return Math.round(Number(v||0)*Math.pow(10,p))/Math.pow(10,p); }
function display(v){
  const map={male:'Эрэгтэй',female:'Эмэгтэй',sedentary:'Суугаа ажил',mixed:'Суух/алхах холимог',active:'Хөдөлгөөнтэй ажил',home:'Гэртээ хоол хийх боломжтой',outside:'Гадуур хооллох нь их',low:'Бага',medium:'Дунд',high:'Их',before19:'19:00-с өмнө','19to21':'19:00–21:00',after21:'21:00-с хойш'};
  return map[v] || v || 'тодорхойгүй';
}
function isLowRoute(req){ return (req.data?.route === 'low') || String(req.routeTitle||'').includes('боломжгүй') || String(req.routeTitle||'').includes('бага'); }
function isActiveRoute(req){ return (req.data?.route === 'active') || String(req.routeTitle||'').includes('Хөдөлгөөнтэй'); }
function isSupportRoute(req){ return (req.data?.route === 'support') || String(req.routeTitle||'').includes('бүтээгдэхүүн'); }
function cleanAvoid(text){
  const t=String(text||'').trim().toLowerCase();
  if(!t || ['байхгүй','baihgui','bhgui','үгүй','ugui','no','none','-'].includes(t.replace(/[\s.,!?_-]+/g,''))) return [];
  return t.split(/[,，;\/]+/).map(x=>x.trim()).filter(Boolean);
}
function containsAvoid(meal, avoid){ return avoid.some(a => meal.toLowerCase().includes(a)); }
function swapAvoid(meal, avoid){
  if(!avoid.length || !containsAvoid(meal,avoid)) return meal;
  return meal + ' /харшилтай эсвэл иддэггүй орц байвал өндөг, тахиа, үхрийн мах, тараг, байцаа, өргөст хэмх зэрэг ойролцоо энгийн сонголтоор солино/';
}
function portionGuide(req){
  const d=req.data||{}; const bmi=num(req.bmi); const target=num(req.targetLoss);
  const sex=d.gender==='male'?'эрэгтэй':'эмэгтэй';
  const protein=bmi>=30?'1.5 алга хэмжээний уураг':'1 алга хэмжээний уураг';
  const carb=bmi>=30?'тал нударгаас 1 нударга хүртэл будаа/гурвалжин будаа/хар талх':'1 нударга хэмжээний нүүрс ус';
  const dinnerCarb=bmi>=30?'оройд будаа, гурилыг таллаж эсвэл шөл/ногоогоор солино':'оройн нүүрс усыг бага хэмжээгээр барина';
  return `<ul>
    <li>Таны мэдээллээр ${esc(sex)}, ${esc(d.age)} настай, БЖИ ${esc(req.bmi)} байна. Гол зорилго: ${esc(target)} кг хасах.</li>
    <li>Нэг үндсэн хоолонд: ${protein}, 2 атга ногоо, ${carb}.</li>
    <li>${dinnerCarb}. Орой 21:00-с хойш хүнд хоол идэхгүй.</li>
    <li>Ус: эхний 7 хоногт одоогийн хэмжээн дээр 300–500 мл нэмээд, дараа нь өдөрт 1.8–2.5 л хүргэнэ.</li>
    <li>Чихэрлэг ундаа, жүүс, боов, чихэр, шарсан гуриллаг хоолыг 7 хоногт 1–2 удаагаас хэтрүүлэхгүй.</li>
  </ul>`;
}
function riskAdvice(req){
  const d=req.data||{}; const arr=[]; const bmi=num(req.bmi);
  if(bmi>=30) arr.push('БЖИ өндөр байгаа тул даралт, сахар, элэг өөхлөлт, үе мөч, нойр амьсгалын ачаалал нэмэгдэх эрсдэлтэй. Энэ нь айлгах зүйл биш, харин одооноос хоол, ус, нойр, дадлаа засах дохио юм.');
  else if(bmi>=25) arr.push('Илүүдэл жингийн ангилалд орж байгаа тул хэвлийн өөхлөлт, цусан дахь сахар, даралт, нойр, үе мөчний ачааллыг анхаарах хэрэгтэй.');
  else arr.push('Жин харьцангуй боломжийн байвал хэт турах биш, эрүүл жингээ хадгалах дадал чухал.');
  if(num(d.waist)>0) arr.push(`Бэлхүүс ${esc(d.waist)} см гэж оруулсан. Бэлхүүс нэмэгдэх нь хэвлийн өөхлөлтийн дохио байж болох тул оройн нүүрс ус, чихэрлэг хэрэглээг хамгийн түрүүнд багасгана.`);
  if(num(d.sittingHours)>=7) arr.push('Удаан суудаг хэв маягтай тул дасгал хийхгүй байсан ч цаг тутам 2–3 минут босох, мөр, нуруу, хөлөө хөдөлгөх дадал оруулна.');
  if(num(d.sleepHours)<6) arr.push('Нойр бага байгаа тул хоолны дуршил, стресс, оройн идэх хүсэл нэмэгдэх эрсдэлтэй. Эхний сараас унтах цагийг тогтворжуулах хэрэгтэй.');
  if(d.sweet==='high'||d.drink==='high') arr.push('Чихэрлэг зүйл/хийжүүлсэн ундаа өндөр байвал жин буурах явц хамгийн их удааширдаг. Үүнийг эхний 14 хоногт шат дараатай бууруулна.');
  return arr.map(x=>`<li>${esc(x)}</li>`).join('');
}
const breakfasts=[
  '2 өндөг + өргөст хэмх/улаан лооль + хар талх 1 зүсэм',
  'Овьёос 4–5 халбага + тараг/сүү бага + алим тал',
  'Аарц 150–200 гр + самар бага эсвэл алим тал',
  'Өндөгтэй ногоотой хуурга /тос бага/ + халуун цай',
  'Тараг 250 мл + овьёос 3 халбага + шанцай бага',
  'Бантан жижиг аяга + ногоо нэмсэн хувилбар',
  'Үхрийн махтай шөлний бага порц + ногоо',
  'Омлет 2 өндөг + байцаа/луувангийн салат',
  'Гурвалжин будаа бага + өндөг 1–2 + ногоо',
  'Аарцтай смүүти маяг: аарц + ус/сүү бага + алим бага'
];
const lunches=[
  'Үхрийн махтай ногоотой шөл + будаа тал аяга',
  'Тахианы цээж/гуяны мах + байцааны салат + гурвалжин будаа тал аяга',
  'Өндөгтэй ногоотой хуурга + өргөст хэмх + хар талх 1 зүсэм',
  'Баншгүй/бага гурилтай ногоотой шөл + мах 1 алга',
  'Загас эсвэл тахиа + улаан лооль/өргөст хэмх + хөц будаа бага',
  'Гэрийн цуйван бол гурилыг таллаж, ногоо/махыг нэмсэн бага порц',
  'Будаатай хуурга бол будаа тал, ногоо 2 дахин их, тос бага',
  'Махтай байцааны ороомог/жигнэсэн ногоо + тараг бага',
  'Хар талхтай мах/өндөгний сэндвич + ногоо их',
  'Хонины/үхрийн махтай шөл, өөхийг багасгаж, гурилгүй эсвэл бага гурилтай'
];
const dinners=[
  'Ногоотой шөл + мах бага, будаа/гурилгүй',
  'Тараг 250 мл + өндөг 1 + өргөст хэмх',
  'Тахианы махтай салат /майонезгүй/ + халуун цай',
  'Аарц 150 гр + алим тал /өлсвөл/',
  'Өндөг 1–2 + байцааны салат + ус',
  'Үхрийн махтай тунгалаг шөл + лууван/байцаа',
  'Загас/тахиа + жигнэсэн ногоо',
  'Бантан жижиг аяга, тос багатай',
  'Оройн хоол хүнд бол өдрийн хоолны 1/2 порц + ногоо нэмнэ',
  'Хоол идэхгүй алгасахгүй: тараг/аарц/өндөгний хөнгөн сонголт'
];
const snacks=[
  'Алим тал эсвэл 1 жижиг алим', 'Тараг 150–200 мл', 'Өргөст хэмх/лууван', 'Самар 8–10 ширхэг', 'Аарц 100 гр', 'Халуун ус/ногоон цай, чихэргүй', 'Жимс бага + ус', 'Өндөг 1 /их өлсвөл/'
];
function dayMeal(day, month, req){
  const avoid=cleanAvoid(req.data?.avoidFood);
  const shift=(month-1)*3;
  const b=swapAvoid(breakfasts[(day+shift)%breakfasts.length],avoid);
  const l=swapAvoid(lunches[(day+shift*2)%lunches.length],avoid);
  const dn=swapAvoid(dinners[(day+shift*3)%dinners.length],avoid);
  const sn=swapAvoid(snacks[(day+shift)%snacks.length],avoid);
  return {b,l,d:dn,s:sn};
}
function habitForDay(day, req){
  const d=req.data||{};
  const waterBase = num(d.waterLiters)<1.5 ? 'одоо уудаг хэмжээнээс 300–500 мл-ээр нэмнэ' : '1.8–2.5 л усыг өдөрт хувааж ууна';
  if(isLowRoute(req)){
    const habits=['90 минут тутам 2 минут босож алхах','лифтний оронд 1–2 давхар алхах боломж байвал ашиглах','сууж байхдаа мөр, хүзүү, шагайгаа 2 минут хөдөлгөх','оройн хоолоо 19:00–20:30 дотор дуусгах','утсаа харах зуураа 5 минут зөөлөн алхах','унтахаас 2 цагийн өмнө хүнд хоол зогсоох','өдрийн нийт алхмыг өмнөхөөс 500 алхмаар нэмэх'];
    return `${waterBase}. ${habits[day%habits.length]}. Дасгал хийхгүй төлөвлөгөө тул гол ачаалал хоолны хэмжээ, цаг, ус, нойр дээр байна.`;
  }
  if(isActiveRoute(req)){
    const acts=['20 минут тайван алхалт','25 минут алхалт + 5 минут сунгалт','гэрийн 3 дасгал: суугаа босоо 10, хананд түлхэлт 10, хэвлий таталт 10','30 минут алхалт','10 минут сунгалт + 15 минут алхалт','амралтын хөнгөн алхалт 20 минут','7 хоногийн жин/бэлхүүсээ тэмдэглэх'];
    return `${waterBase}. ${acts[day%acts.length]}. Өөрийгөө ядраахгүй.`;
  }
  const sup=['бүтээгдэхүүн хэрэглэдэг бол зөвхөн зааврын дагуу, ус сайн ууж хэрэглэнэ','хоол алгасахгүй, бүтээгдэхүүнийг хоол орлуулах гэж ашиглахгүй','бие тавгүйрхвэл бүтээгдэхүүнээ зогсоож мэргэжлийн хүнээс асууна','ус, нойр, хоолны цагийг хамгийн түрүүнд тогтворжуулна'];
  return `${waterBase}. ${sup[day%sup.length]}.`;
}
function stageText(month){
  if(month===1) return '1-р сар: биеэ дасгах, хоолны цаг, ус, оройн хоолыг тогтворжуулах үе.';
  if(month===2) return '2-р сар: дуршил, чихэрлэг хэрэглээ, порцын хэмжээг тогтвортой болгох үе.';
  if(month===3) return '3-р сар: жин буурах явцыг хадгалж, буцааж нэмэхгүй дадал суулгах үе.';
  if(month<=5) return `${month}-р сар: хэмнэлээ баталгаажуулж, гэрийн хоолны хувилбарыг олон болгох үе.`;
  return '6-р сар: үр дүнгээ тогтоож, дараагийн 6 сарын өөрөө барих системд шилжих үе.';
}
function buildMonthPlan(month, req){
  const rows=[];
  for(let d=1; d<=30; d++){
    const m=dayMeal(d, month, req);
    rows.push(`<article class="dayCard"><h4>${month}-р сар · ${d} дэх өдөр</h4><div><b>Өглөө:</b> ${esc(m.b)}</div><div><b>Өдөр:</b> ${esc(m.l)}</div><div><b>Орой:</b> ${esc(m.d)}</div><div><b>Завсар:</b> ${esc(m.s)}</div><div><b>Ус/дадал:</b> ${esc(habitForDay(d, req))}</div></article>`);
  }
  return `<details class="monthBlock" ${month===1?'open':''}><summary><b>${esc(stageText(month))}</b></summary><div class="dayGrid">${rows.join('')}</div></details>`;
}
function planSummary(req){
  const months=Number(req.packageMonths||1);
  const route=isLowRoute(req)?'дасгал шаардахгүй, суугаа амьдралд таарсан':'хөнгөн хөдөлгөөнтэй';
  return `${months} сарын энэ тайлан нь таны нас, өндөр, жин, зорилт, БЖИ, бэлхүүс, суугаа цаг, ус, нойр, хооллолтын зуршилд тулгуурласан. Үнэтэй, олддоггүй орц биш — өндөг, тараг, аарц, байцаа, лууван, өргөст хэмх, үхэр/тахианы мах, шөл, гурвалжин будаа, хөц будаа зэрэг өдөр тутмын хүнсээр ${route} хэрэгжихээр бичигдсэн.`;
}
function render(req){
  const d=req.data||{};
  const status=req.status||'pending';
  if(status!=='approved'){
    $('reportView').innerHTML='<div class="panel"><h2>Тайлан хараахан баталгаажаагүй байна.</h2><p>Админ төлбөрийг баталгаажуулсны дараа энэ link ажиллана.</p></div>'; return;
  }
  const months=Math.max(1, Math.min(6, Number(req.packageMonths||1)));
  const monthBlocks=Array.from({length:months},(_,i)=>buildMonthPlan(i+1,req)).join('');
  const avoid=d.avoidFood&&d.avoidFood!=='байхгүй'?`<div class="panel"><h3>Иддэггүй / харшилтай хүнс</h3><p>${esc(d.avoidFood)} гэж бичсэн тул тухайн орц таарвал ойролцоо уураг/ногоогоор сольж хэрэглэнэ.</p></div>`:'';
  $('reportView').innerHTML=`
    <div class="versionPill">v20 detailed report</div>
    <div class="resultHeader">
      <div class="scoreCard">
        <span class="tag">PDF тайлан</span>
        <h2>${esc(d.name||'Таны')} — Эрүүл Бие, Эрүүл Жин</h2>
        <div class="bmiNumber">${esc(req.bmi||'')}</div>
        <p>${esc(req.category||'')}</p>
        <p>Сонгосон багц: <b>${esc(req.packageTitle||'')}</b></p>
      </div>
      <div class="metricGrid">
        <div class="metric"><span>Одоогийн жин</span><b>${esc(d.weight||'')} кг</b></div>
        <div class="metric"><span>Зорилтот жин</span><b>${esc(d.targetWeight||'')} кг</b></div>
        <div class="metric"><span>Хасах зорилт</span><b>${esc(req.targetLoss||'')} кг</b></div>
        <div class="metric"><span>Хэлбэр</span><b>${esc(req.routeTitle||'')}</b></div>
      </div>
    </div>
    <div class="panel"><h3>Таны тайлангийн гол чиглэл</h3><p>${esc(planSummary(req))}</p></div>
    <div class="panel"><h3>Хэмжээ ба порцын дүрэм</h3>${portionGuide(req)}</div>
    <div class="panel"><h3>Эрсдэлийн тайлбар</h3><ul>${riskAdvice(req)}</ul><p class="smallNote">Энэ нь эмчийн онош биш. Хэрэв даралт, сахар, зүрх судас, бөөр, элэг, жирэмсэн/хөхүүл, хүчтэй зовиур байгаа бол эмчийн зөвлөгөөтэй хамт хэрэгжүүлнэ.</p></div>
    ${avoid}
    <div class="panel"><h3>${months} сарын өдөр бүрийн хоол ба дадлын төлөвлөгөө</h3><p>Доорх төлөвлөгөөг өдөр бүр дагана. Хэрэв тухайн өдрийн хоол тохирохгүй бол ижил бүлгийн хүнсээр солино: мах ↔ өндөг/тахиа/загас, будаа ↔ гурвалжин/хөц будаа/хар талх, ногоо ↔ байцаа/өргөст хэмх/лууван.</p></div>
    ${monthBlocks}
    <div class="panel"><h3>7 хоног бүр шалгах зүйл</h3><ul><li>Өглөө өлөн дээрээ 7 хоногт 1 удаа жингээ үзнэ.</li><li>Бэлхүүсээ 7 хоногт 1 удаа хэмжинэ.</li><li>Нойр, өтгөн хаталт, амьсгаадах, ядрах мэдрэмжээ тэмдэглэнэ.</li><li>Жин буухгүй 10 хоног бол оройн хоол, чихэрлэг, гурил будаа, усны хэмжээг эхэлж шалгана.</li></ul></div>
    <div class="askActions"><button class="btn primary" onclick="window.print()">PDF / Хэвлэх</button></div>
  `;
}
async function init(){
  const id=qs('id');
  if(!id){$('reportView').innerHTML='<div class="panel">Тайлангийн ID алга.</div>'; return;}
  if(window.EBEJ_FIREBASE_READY && window.EBEJ_DB){
    try{
      const doc=await window.EBEJ_DB.collection('requests').doc(id).get();
      if(!doc.exists){ $('reportView').innerHTML='<div class="panel">Тайлан олдсонгүй.</div>'; return; }
      return render({...doc.data(), id: doc.id});
    }catch(e){
      console.error(e);
      $('reportView').innerHTML='<div class="panel">Тайлан уншихад алдаа гарлаа. Тайлан батлагдсан эсэх эсвэл Firebase rules тохиргоогоо шалгана уу.</div>'; return;
    }
  }
  const req=localFind(id);
  if(req) render(req); else $('reportView').innerHTML='<div class="panel">Firebase config бөглөөгүй байна.</div>';
}
init();
