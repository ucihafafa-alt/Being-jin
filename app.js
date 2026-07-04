const $ = (id) => document.getElementById(id);
const result = $('result');
let lastReport = null;

const packageInfo = {
  '1': { months: 1, title: '1 сарын эхлэл', price: '11,900₮', desc: '30 хоногийн хооллолт, ус, нойр, хөдөлгөөний энгийн төлөвлөгөө.' },
  '2': { months: 2, title: '2 сарын тогтворжилт', price: '20,500₮', desc: 'Эхний 30 хоногийн дадлыг үргэлжлүүлж, буцааж нэмэхгүй тогтвортой горим.' },
  '3': { months: 3, title: '3 сарын бүрэн өөрчлөлт', price: '30,000₮', desc: '90 хоногийн хооллолт, дадал, жингийн тэнцвэрийн бүрэн төлөвлөгөө.' },
  '6': { months: 6, title: '6 сарын эрүүл дадал', price: '55,000₮', desc: 'Жингээ бууруулаад тогтвортой барих урт хугацааны дадлын төлөвлөгөө.' }
};

const routeInfo = {
  active: { title: 'Хөдөлгөөнтэй төлөвлөгөө', monthlyMin: 2, monthlyMax: 4, note: 'Алхалт, гэрийн хөнгөн дасгал, хооллолтын зохицуулалттай.' },
  low: { title: 'Хөдөлгөөн багатай төлөвлөгөө', monthlyMin: 1.5, monthlyMax: 3.2, note: 'Суугаа ажилтай, зав багатай хүнд хоолны цаг, хэмжээ, ус, нойр дээр төвлөрнө.' },
  support: { title: 'Дэмжих бүтээгдэхүүнтэй төлөвлөгөө', monthlyMin: 2, monthlyMax: 4, note: 'Дэмжих бүтээгдэхүүн дангаараа биш. Хооллолт, ус, нойр, дадалтай хамт хэрэгжинэ.' }
};

const riskTexts = {
  under: {
    level: 'Жин бага ангилал', tone: 'warn',
    risks: ['дархлаа болон булчингийн хүч сулрах', 'ядрах, сульдах мэдрэмж нэмэгдэх', 'хоол тэжээлийн дутагдалтай холбоотой асуудал үүсэх магадлал'],
    harms: ['Хэт бага жин нь биеийн нөөцийг багасгаж, ядралтыг нэмэгдүүлж болзошгүй.', 'Турах төлөвлөгөө биш, тэнцвэртэй хооллолт, биеийн хүч сэргээх чиглэл илүү тохиромжтой.']
  },
  normal: {
    level: 'Хэвийн жингийн ангилал', tone: 'ok',
    risks: ['жингээ тогтвортой барих шаардлага', 'бэлхүүс их байвал далд өөхлөлтийн эрсдэл', 'ус, нойр, хөдөлгөөн алдагдвал жин нэмэх магадлал'],
    harms: ['БЖИ хэвийн байсан ч бэлхүүс, суугаа хэв маяг, чихэрлэг хэрэглээ өндөр бол эрсдэл нэмэгдэж болно.', 'Зорилго нь хэт турах биш, эрүүл дадлыг тогтвортой хадгалах юм.']
  },
  over: {
    level: 'Илүүдэл жингийн ангилал', tone: 'warn',
    risks: ['даралт ихсэх эрсдэл', 'цусан дахь сахар, өөх тосны өөрчлөлт', 'элэг өөхлөх эрсдэл', 'нуруу, өвдөг, үе мөчинд ачаалал нэмэгдэх', 'нойр муудах, амьсгаадах мэдрэмж нэмэгдэх'],
    harms: ['Илүүдэл жин удаан үргэлжилбэл биеийн судас, үе мөч, элэг, нойрны чанарт ачаалал өгч болзошгүй.', 'Энэ үед огцом өлсөхөөс илүү хоолны хэмжээ, цаг, ус, нойр, хөдөлгөөнийг зэрэг засах нь зөв.']
  },
  obese1: {
    level: 'Таргалалтын 1-р түвшин', tone: 'danger',
    risks: ['даралт ихсэх магадлал нэмэгдэх', '2-р хэлбэрийн чихрийн шижингийн эрсдэл', 'зүрх судасны ачаалал нэмэгдэх', 'элэг өөхлөх эрсдэл', 'үе мөч, нуруу, өвдөгний ачаалал', 'нойр, амьсгалын хүндрэл'],
    harms: ['Таргалалт нэмэгдэх тусам өдөр тутмын алхалт, ажиллах эрч хүч, нойр, сэтгэлзүйд хүртэл нөлөөлж болно.', 'Энэ нь ганц гоо сайхны асуудал биш, биеийн бүх системд ачаалал өгөх дохио юм.']
  },
  obese2: {
    level: 'Таргалалтын 2-р түвшин', tone: 'danger',
    risks: ['даралт, сахар, зүрх судасны эрсдэл өндөрсөх', 'элэг өөхлөлт, бодисын солилцооны ачаалал', 'өвдөг, нуруу, үе мөчний өвдөлт нэмэгдэх', 'амьсгаадах, нойрны чанар муудах', 'өдөр тутмын хөдөлгөөн хязгаарлагдах'],
    harms: ['Энэ түвшинд бие өөрөө байнгын ачаалалтай ажиллаж эхэлдэг.', 'Төлөвлөгөөг тайван, тогтвортой, хяналттай хэрэгжүүлэх шаардлагатай.']
  },
  obese3: {
    level: 'Таргалалтын 3-р түвшин буюу өндөр эрсдэл', tone: 'danger',
    risks: ['даралт, сахар, зүрх судасны эрсдэл мэдэгдэхүйц нэмэгдэх', 'амьсгал, нойр, элэг, үе мөчний ачаалал өндөрсөх', 'өдөр тутмын хөдөлгөөн, ажиллах чадварт нөлөөлөх', 'эмчийн хяналт шаардлагатай байх магадлал'],
    harms: ['Энэ үед хурдан турах гэж өөрийгөө зовоох биш, мэргэжлийн хяналттай, аюулгүй алхмаар эхлэх хэрэгтэй.', 'Хэрэв даралт, сахар, зүрх, бөөр, элэг зэрэг асуудал байгаа бол эмчийн зөвлөгөөтэй хамт төлөвлөгөө хэрэгжүүлнэ.']
  }
};

function val(id){ return $(id).value.trim(); }
function n(v){ return Number(v || 0); }
function selected(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
function round(num, p=1){ return Math.round(num * Math.pow(10,p)) / Math.pow(10,p); }
function kg(num){ return `${round(Math.max(0,num),1)} кг`; }
function escapeHtml(str){ return String(str).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function bmiCategory(bmi){
  if (bmi < 18.5) return 'under';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'over';
  if (bmi < 35) return 'obese1';
  if (bmi < 40) return 'obese2';
  return 'obese3';
}

function waistRisk(gender, waist){
  if (!waist) return '';
  if (gender === 'male' && waist >= 94) return 'Бэлхүүсний хэмжээ өндөр байна. Хэвлийн өөхлөлт нь даралт, сахар, зүрх судас, элэг өөхлөх эрсдэлийн дохио байж болно.';
  if (gender === 'female' && waist >= 80) return 'Бэлхүүсний хэмжээ өндөр байна. Хэвлийн өөхлөлт нь бодисын солилцоо, сахар, даралт, элэг өөхлөх эрсдэлийн дохио байж болно.';
  return 'Бэлхүүсний хэмжээ хэт өндөр ангилалд харагдахгүй байна. Гэхдээ хоол, ус, нойр, хөдөлгөөний дадлаа хадгалах хэрэгтэй.';
}

function habitRisks(data){
  const arr = [];
  if (data.sittingHours >= 7 || data.workType === 'sedentary') arr.push('удаан суух хэв маяг нь жин нэмэх, нуруу өвдөх, цусны эргэлт удаашрахад нөлөөлж болзошгүй');
  if (data.sleepHours < 6) arr.push('нойр дутуу байх нь хоолны дуршил, стресс, жин нэмэх хандлагыг нэмэгдүүлж болно');
  if (data.waterLiters < 1.5) arr.push('усны хэрэглээ бага байвал өлсөх мэдрэмж, ядралт, хоолны хэмжээ нэмэгдэх хандлага гарч болно');
  if (data.lastMeal === 'after21') arr.push('оройн хоол хэт орой байх нь хоол шингэх, нойр, жингийн тэнцвэрт сөргөөр нөлөөлж болно');
  if (data.sweet === 'high') arr.push('чихэрлэг хэрэглээ өндөр байх нь илүүдэл илчлэг, цусан дахь сахарын хэлбэлзэлд нөлөөлнө');
  if (data.carb === 'high') arr.push('гурил, будаа, боов боорцгийн хэмжээ их байвал жин буурах явц удааширч болно');
  if (data.drink === 'high') arr.push('хийжүүлсэн ундаа, шүүс их уух нь шингэн сахар, илүүдэл илчлэг нэмэх эрсдэлтэй');
  return arr;
}

function strengths(data){
  const arr = [];
  if (data.waterLiters >= 1.5) arr.push('усны хэрэглээгээ сайжруулах суурь боломжтой');
  if (data.sleepHours >= 7) arr.push('нойрны цаг харьцангуй боломжийн');
  if (data.cook !== 'outside') arr.push('гэрийн хоолоор төлөвлөгөө хэрэгжүүлэх боломжтой');
  if (data.sweet !== 'high') arr.push('чихэрлэг хэрэглээг хянах боломжтой');
  return arr.length ? arr : ['өөрчлөлт эхлүүлэх хүсэл, мэдээллээ бөглөсөн нь хамгийн эхний давуу тал'];
}

function getData(){
  return {
    name: val('name') || 'Танд', age: n(val('age')), gender: val('gender'), height: n(val('height')),
    weight: n(val('weight')), targetWeight: n(val('targetWeight')), waist: n(val('waist')),
    workType: val('workType'), sittingHours: n(val('sittingHours')), sleepHours: n(val('sleepHours')),
    waterLiters: n(val('waterLiters')), meals: n(val('meals')), lastMeal: val('lastMeal'),
    sweet: val('sweet'), carb: val('carb'), drink: val('drink'), cook: val('cook'),
    avoidFood: val('avoidFood') || 'тодорхойгүй', medical: val('medical') || 'тодорхой бичээгүй', route: selected('route')
  };
}

function calcReport(data){
  const hM = data.height / 100;
  const bmi = data.weight / (hM * hM);
  const cat = bmiCategory(bmi);
  const risk = riskTexts[cat];
  const route = routeInfo[data.route];
  const targetLoss = Math.max(0, data.weight - data.targetWeight);
  const healthyUpper = 24.9 * hM * hM;
  const lossToHealthyUpper = Math.max(0, data.weight - healthyUpper);
  return { bmi, cat, risk, route, targetLoss, healthyUpper, lossToHealthyUpper };
}

function renderResult(data){
  const r = calcReport(data);
  lastReport = { data, ...r };
  const waistText = waistRisk(data.gender, data.waist);
  const habits = habitRisks(data);
  const medicalNote = data.medical !== 'тодорхой бичээгүй' ? `<p class="dangerText">Эрүүл мэндийн анхаарах зүйл бичсэн байна: ${escapeHtml(data.medical)}. Энэ тохиолдолд төлөвлөгөөг эмчийн зөвлөгөөтэй хамт хэрэгжүүлэх нь зүйтэй.</p>` : '';

  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="resultHeader">
      <div class="scoreCard">
        <span class="tag">Үнэгүй БЖИ үнэлгээ</span>
        <h2>${escapeHtml(data.name)} таны БЖИ</h2>
        <div class="bmiNumber">${round(r.bmi,1)}</div>
        <p class="${r.risk.tone}">${r.risk.level}</p>
        <p>Энэ нь онош биш. Жин, бэлхүүс, дадал, хооллолтын мэдээлэлд тулгуурласан чиглүүлэх үнэлгээ.</p>
      </div>
      <div class="metricGrid">
        <div class="metric"><span>Одоогийн жин</span><b>${kg(data.weight)}</b></div>
        <div class="metric"><span>Зорилтот жин</span><b>${kg(data.targetWeight)}</b></div>
        <div class="metric"><span>Зорилтот хасах жин</span><b>${kg(r.targetLoss)}</b></div>
        <div class="metric"><span>Хэвийн БЖИ дээд хүрээнд ойртох</span><b>${kg(r.lossToHealthyUpper)}</b></div>
      </div>
    </div>

    <div class="riskPanel">
      <div class="panel">
        <h3>Халдварт бус өвчлөлийн болзошгүй эрсдэл</h3>
        <ul>${r.risk.risks.map(x => `<li>${x}</li>`).join('')}</ul>
        ${waistText ? `<p class="warnText">${waistText}</p>` : ''}
      </div>
      <div class="panel">
        <h3>Яагаад анхаарах хэрэгтэй вэ?</h3>
        <ul>
          ${r.risk.harms.map(x => `<li>${x}</li>`).join('')}
          ${habits.map(x => `<li>${x}</li>`).join('')}
        </ul>
        ${medicalNote}
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Үнэгүй үнэлгээний дүгнэлт</h3>
      <p>Та одоо өөрийн БЖИ, жингийн ангилал, халдварт бус өвчлөлийн болзошгүй эрсдэлийн дохиогоо харлаа.</p>
      <p>Дараагийн алхамд таны өгсөн хариултад тулгуурласан 1, 2, 3, 6 сарын хувийн төлөвлөгөөний мэдээлэл авах эсэхээ өөрөө шийднэ.</p>
    </div>

    <div class="askBox">
      <h3>Та өөрийн биеийн онцлогт тохирсон “Эрүүл Бие — Эрүүл Жин” төлөвлөгөөний мэдээлэл авмаар байна уу?</h3>
      <p>Тийм гэвэл таны нэр, БЖИ, давуу тал, эрсдэлийн дохио, сонгосон аргачлалд тулгуурлан дараагийн мэдээлэл гарна.</p>
      <div class="askActions">
        <button type="button" class="btn light" onclick="showPackages()">Тийм</button>
        <button type="button" class="btn dangerGhost" onclick="showFarewell()">Үгүй</button>
      </div>
      <div id="farewell" class="farewell hidden">Баярлалаа. Бид хэзээд танд туслахад бэлэн шүү. Өөрийн биеийн дохиогоо сонсож, ус, нойр, хоолны цаг, хөдөлгөөний энгийн дадлаа бага багаар сайжруулаарай.</div>
      <div id="packageArea" class="packageArea hidden"></div>
    </div>
  `;
  result.scrollIntoView({behavior:'smooth', block:'start'});
}

function packageRangeHtml(pack, route, targetLoss){
  const min = route.monthlyMin * pack.months;
  const max = route.monthlyMax * pack.months;
  const goalMax = Math.min(targetLoss, max);
  const remain = Math.max(0, targetLoss - max);
  return `Энэ хугацаанд эрүүлээр ${kg(min)} – ${kg(max)} хүртэл. Таны зорилтоос энэ багцаар дээддээ ${kg(goalMax)} хасах тооцоо, үлдэх нь ${kg(remain)}.`;
}

window.showFarewell = function(){
  $('farewell').classList.remove('hidden');
  $('packageArea').classList.add('hidden');
};

window.showPackages = function(){
  if (!lastReport) return;
  const { data, bmi, risk, route, targetLoss } = lastReport;
  const st = strengths(data);
  const riskPoints = habitRisks(data).slice(0,3);
  const area = $('packageArea');
  $('farewell').classList.add('hidden');
  area.classList.remove('hidden');
  area.innerHTML = `
    <div class="personalIntro">
      <h3>${escapeHtml(data.name)} сайн уу.</h3>
      <p>Өөрийн чинь хувьд <b>${st.map(escapeHtml).join(', ')}</b> гэсэн давуу тал харагдаж байна.</p>
      <p>Гэхдээ БЖИ <b>${round(bmi,1)}</b> буюу <b>${risk.level}</b> ангилалд байна. Энэ нь удаан үргэлжилбэл даралт, сахар, зүрх судас, элэг өөхлөлт, үе мөч, нойр амьсгалын ачаалал зэрэг халдварт бус өвчлөлийн эрсдэлийг нэмэгдүүлж болзошгүй.</p>
      <p>Таны анхаарах гол зүйл: ${riskPoints.length ? riskPoints.map(escapeHtml).join(' ') : 'өдөр тутмын хоол, ус, нойр, хөдөлгөөний дадлаа тогтвортой хадгалах.'}</p>
      <p>Тиймээс өөртөө болон хайртай хүмүүстээ үлгэр дуурайлал болж, эрүүл мэнддээ өнөөдрөөс анхаараарай.</p>
      <p><b>Таны сонгосон аргачлал:</b> ${route.title}. ${route.note}</p>
    </div>
    <div class="miniPackages">
      ${Object.entries(packageInfo).map(([key, pack]) => `
        <article class="miniPackage ${key === '3' ? 'featured' : ''}">
          <h4>${pack.title}</h4>
          <p class="price">${pack.price}</p>
          <small>${pack.desc}</small>
          <small>${packageRangeHtml(pack, route, targetLoss)}</small>
          <button type="button" class="btn primary" onclick="selectPackage('${key}')">Энэ багцыг сонгох</button>
        </article>
      `).join('')}
    </div>
    <textarea class="copyArea" id="copyArea" readonly placeholder="Багц сонгоход хураангуй энд гарна"></textarea>
    <div class="askActions"><button class="btn secondary" type="button" onclick="copyOrder()">Хураангуй хуулах</button><button class="btn ghost" type="button" onclick="window.print()">PDF / Хэвлэх</button></div>
    <p class="fineprint">Систем таны мэдээллийг серверт хадгалахгүй. Бүрэн төлөвлөгөө авах бол хураангуйгаа хуулж page рүү илгээнэ.</p>
  `;
  area.scrollIntoView({behavior:'smooth', block:'start'});
};

window.selectPackage = function(key){
  if (!lastReport) return;
  const { data, bmi, risk, route, targetLoss } = lastReport;
  const pack = packageInfo[key];
  const min = route.monthlyMin * pack.months;
  const max = route.monthlyMax * pack.months;
  const goalMax = Math.min(targetLoss, max);
  const remain = Math.max(0, targetLoss - max);
  const text = `Эрүүл Бие — Эрүүл Жин багц авах хүсэлт\n\nНэр: ${data.name}\nНас: ${data.age}\nХүйс: ${data.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}\nӨндөр: ${data.height} см\nОдоогийн жин: ${data.weight} кг\nЗорилтот жин: ${data.targetWeight} кг\nЗорилтот хасах жин: ${round(targetLoss,1)} кг\nБэлхүүс: ${data.waist || 'бичээгүй'} см\nБЖИ: ${round(bmi,1)} — ${risk.level}\n\nСонгосон аргачлал: ${route.title}\nЭрүүлээр 1 сарын дээд тооцоо: ${round(route.monthlyMax,1)} кг хүртэл\nСонгосон багцын боломжит хүрээ: ${round(min,1)}–${round(max,1)} кг\nЭнэ багцаар зорилтоос хасах дээд тооцоо: ${round(goalMax,1)} кг\nҮлдэх зорилт: ${round(remain,1)} кг\n\nСонгосон багц: ${pack.title} — ${pack.price}\nСуугаа цаг: ${data.sittingHours}\nНойр: ${data.sleepHours} цаг\nУс: ${data.waterLiters} литр\nХооллох тоо: ${data.meals}\nОройн хоол: ${data.lastMeal}\nАмттан: ${data.sweet}\nГурил/будаа: ${data.carb}\nУндаа/шүүс: ${data.drink}\nХоол хийх боломж: ${data.cook}\nИддэггүй/харшилтай хүнс: ${data.avoidFood}\nЭрүүл мэндийн анхаарах зүйл: ${data.medical}\n\nМиний өгсөн хариултад тулгуурласан ${pack.months} сарын дэлгэрэнгүй төлөвлөгөө гаргуулъя.`;
  $('copyArea').value = text;
  $('copyArea').focus();
};

window.copyOrder = async function(){
  const text = $('copyArea')?.value || '';
  if (!text) { alert('Эхлээд багцаа сонгоно уу.'); return; }
  try { await navigator.clipboard.writeText(text); alert('Хураангуй хууллаа. Одоо page рүү илгээж болно.'); }
  catch(e){ alert('Хуулж чадсангүй. Доорх текстийг гараар copy хийнэ үү.'); }
};

$('healthForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = getData();
  if (data.targetWeight >= data.weight) {
    alert('Зорилтот жин одоогийн жингээс бага байх хэрэгтэй. Хэрэв жин нэмэх зорилготой бол тусдаа зөвлөгөө шаардлагатай.');
    return;
  }
  renderResult(data);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
