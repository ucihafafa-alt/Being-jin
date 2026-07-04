const $ = (id) => document.getElementById(id);
const result = $('result');
let lastReport = null;
let lastSelectedPackageKey = null;

const PAYMENT_CONFIG = {
  backend: 'firebase',
  reportBaseUrl: 'https://ucihafafa-alt.github.io/Being-jin/report.html',
  accounts: [
    { bank: 'ХААН банк', holder: 'ДАНСНЫ НЭР ЭНД БИЧНЭ', number: 'ДАНСНЫ ДУГААР ЭНД БИЧНЭ', link: '' },
    { bank: 'Голомт банк', holder: 'ДАНСНЫ НЭР ЭНД БИЧНЭ', number: 'ДАНСНЫ ДУГААР ЭНД БИЧНЭ', link: '' },
    { bank: 'Худалдаа хөгжлийн банк', holder: 'ДАНСНЫ НЭР ЭНД БИЧНЭ', number: 'ДАНСНЫ ДУГААР ЭНД БИЧНЭ', link: '' },
    { bank: 'Төрийн банк', holder: 'ДАНСНЫ НЭР ЭНД БИЧНЭ', number: 'ДАНСНЫ ДУГААР ЭНД БИЧНЭ', link: '' }
  ]
};

const packageInfo = {
  '1': { months: 1, title: '1 сарын эхлэл', price: '11,900₮', desc: '30 хоногийн энгийн хооллолт, ус, нойр, хөдөлгөөний суурь төлөвлөгөө.' },
  '2': { months: 2, title: '2 сарын тогтворжилт', price: '20,500₮', desc: 'Эхний 30 хоногийн дадлыг үргэлжлүүлж, буцааж нэмэхгүй горимд оруулах төлөвлөгөө.' },
  '3': { months: 3, title: '3 сарын өөрчлөлт', price: '30,000₮', desc: '90 хоногийн хооллолт, дадал, жингийн тэнцвэрийн төлөвлөгөө.' },
  '6': { months: 6, title: '6 сарын бүрэн хөтөлбөр', price: '55,000₮', desc: 'Эрүүл хооллолт, биеэ эрүүлжүүлэх дадал, жингээ тогтвортой бууруулах урт хугацааны төлөвлөгөө.' }
};

const routeInfo = {
  active: { title: 'Хөдөлгөөнтэй хэлбэр', monthlyMin: 2, monthlyMax: 4, note: 'алхалт, гэрийн хөнгөн дасгал, хооллолтын зохицуулалттай хэрэгжинэ' },
  low: { title: 'Хөдөлгөөн багатай хэлбэр', monthlyMin: 1.5, monthlyMax: 3.2, note: 'суугаа ажилтай, зав багатай хүнд хоолны цаг, хэмжээ, ус, нойр дээр төвлөрнө' },
  support: { title: 'Дэмжих бүтээгдэхүүнтэй хэлбэр', monthlyMin: 2, monthlyMax: 4, note: 'дэмжих бүтээгдэхүүн дангаараа биш, хооллолт, ус, нойр, дадалтай хамт хэрэгжинэ' }
};

const riskTexts = {
  under: {
    level: 'жин бага ангилал', tone: 'warn',
    risks: ['ядрах, сульдах', 'булчингийн хүч багасах', 'хоол тэжээлийн дутагдалтай холбоотой асуудал үүсэх'],
    harms: ['Жин бага үед турах бус, тэнцвэртэй хооллолт, биеийн хүч сэргээх чиглэл илүү тохиромжтой.', 'Хэт хасах оролдлого биеийн нөөцийг багасгаж болзошгүй.']
  },
  normal: {
    level: 'хэвийн жингийн ангилал', tone: 'ok',
    risks: ['жин буцааж нэмэгдэх', 'бэлхүүс их байвал хэвлийн өөхлөлт нэмэгдэх', 'ус, нойр, хөдөлгөөн алдагдвал бие хүндрэх'],
    harms: ['Жин хэвийн байсан ч бэлхүүс, суугаа хэв маяг, чихэрлэг хэрэглээ өндөр бол далд эрсдэл нэмэгдэж болно.', 'Энэ үед гол зорилго нь хэт турах биш, эрүүл жингээ хадгалах юм.']
  },
  over: {
    level: 'илүүдэл жингийн ангилал', tone: 'warn',
    risks: ['даралт ихсэх', 'цусан дахь сахар, өөх тосны өөрчлөлт', 'элэг өөхлөх', 'нуруу, өвдөг, үе мөчинд ачаалал нэмэгдэх', 'нойр муудах, амьсгаадах'],
    harms: ['Илүүдэл жин удаан үргэлжилбэл судас, үе мөч, элэг, нойрны чанарт ачаалал өгч болзошгүй.', 'Огцом өлсөхөөс илүү хоолны хэмжээ, цаг, ус, нойр, хөдөлгөөнийг зэрэг засах нь зөв.']
  },
  obese1: {
    level: 'таргалалтын 1-р түвшин', tone: 'danger',
    risks: ['даралт ихсэх', '2-р хэлбэрийн чихрийн шижингийн эрсдэл нэмэгдэх', 'зүрх судасны ачаалал нэмэгдэх', 'элэг өөхлөх', 'нуруу, өвдөг, үе мөч өвдөх', 'нойр болон амьсгалд хүндрэл мэдрэгдэх'],
    harms: ['Энэ нь зөвхөн гоо сайхны асуудал биш, биеийн олон системд ачаалал өгч буй дохио байж болно.', 'Өдөр тутмын алхалт, ажиллах эрч хүч, нойр, сэтгэл санаанд хүртэл нөлөөлж болзошгүй.']
  },
  obese2: {
    level: 'таргалалтын 2-р түвшин', tone: 'danger',
    risks: ['даралт, сахар, зүрх судасны эрсдэл өндөрсөх', 'элэг өөхлөлт, бодисын солилцооны ачаалал нэмэгдэх', 'өвдөг, нуруу, үе мөчний өвдөлт нэмэгдэх', 'амьсгаадах, нойр муудах', 'өдөр тутмын хөдөлгөөн хязгаарлагдах'],
    harms: ['Энэ түвшинд бие өөрөө байнгын ачаалалтай ажиллаж эхэлдэг.', 'Төлөвлөгөөг тайван, тогтвортой, хяналттай хэрэгжүүлэх шаардлагатай.']
  },
  obese3: {
    level: 'таргалалтын 3-р түвшин буюу өндөр эрсдэл', tone: 'danger',
    risks: ['даралт, сахар, зүрх судасны эрсдэл мэдэгдэхүйц нэмэгдэх', 'амьсгал, нойр, элэг, үе мөчний ачаалал өндөрсөх', 'өдөр тутмын хөдөлгөөн, ажиллах чадварт нөлөөлөх', 'эмчийн хяналт шаардлагатай байх магадлал'],
    harms: ['Энэ үед хурдан турах гэж өөрийгөө зовоох биш, аюулгүй алхмаар эхлэх хэрэгтэй.', 'Хэрэв даралт, сахар, зүрх, бөөр, элэг зэрэг асуудал байгаа бол эмчийн зөвлөгөөтэй хамт төлөвлөгөө хэрэгжүүлнэ.']
  }
};

const displayMap = {
  male:'Эрэгтэй', female:'Эмэгтэй', sedentary:'Ихэнхдээ суугаа', mixed:'Суух, алхах холимог', active:'Хөдөлгөөнтэй ажил',
  before19:'19:00 цагаас өмнө', '19to21':'19:00–21:00', after21:'21:00 цагаас хойш', low:'Бага', medium:'Дунд', high:'Их',
  home:'Гэртээ хийх боломжтой', outside:'Ихэвчлэн гадуур'
};

function val(id){ return $(id).value.trim(); }
function n(v){ return Number(v || 0); }
function selected(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
function round(num, p=1){ return Math.round(num * Math.pow(10,p)) / Math.pow(10,p); }
function kg(num){ return `${round(Math.max(0,num),1)} кг`; }
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function showVal(v){ return displayMap[v] || v || 'тодорхойгүй'; }

function isNoneLikeText(str){
  const raw = String(str || '').trim().toLowerCase();
  if (!raw) return true;
  const compact = raw.replace(/[\s.,!?;:()\-—_]+/g, '');
  const noneWords = ['байхгүй','байхгуй','үгүй','угүй','үгvй','ugui','gvi','gui','baihgui','bhgui','bhgvi','no','none','0','-','эрүүл','eruul','өвчингүй','uvchingui','зовиургүй','zoviurgui'];
  if (noneWords.includes(compact)) return true;
  if (compact.includes('байхгүй') || compact.includes('байхгуй') || compact.includes('baihgui') || compact.includes('bhgui') || compact.includes('bhgvi') || compact.includes('өвчинбайхгүй') || compact.includes('uvchinbaihgui')) return true;
  return false;
}

function normalizeOpenText(str, fallback='байхгүй'){
  const raw = String(str || '').trim();
  return isNoneLikeText(raw) ? fallback : raw;
}

function hasMedicalConcern(str){
  return !isNoneLikeText(str);
}

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
  if (gender === 'male' && waist >= 94) return 'Бэлхүүсний хэмжээ өндөр байна. Хэвлийн өөхлөлт нь даралт, сахар, зүрх судас, элэг өөхлөх эрсдэлийг нэмэгдүүлж болзошгүй.';
  if (gender === 'female' && waist >= 80) return 'Бэлхүүсний хэмжээ өндөр байна. Хэвлийн өөхлөлт нь бодисын солилцоо, сахар, даралт, элэг өөхлөх эрсдэлийг нэмэгдүүлж болзошгүй.';
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

function possibleSymptoms(data, cat){
  const s = [];
  if (['over','obese1','obese2','obese3'].includes(cat)) {
    s.push('бага алхахад амьсгаадах', 'нуруу, өвдөг, үе мөч өвдөх', 'орой бие хүндрэх, хавагнах', 'нойр муудах эсвэл өглөө ядран босох');
  }
  if (data.sittingHours >= 7) s.push('удаан суусны дараа хөл бадайрах, нуруу чилэх');
  if (data.sleepHours < 6) s.push('стрессдэх, амттан идэх хүсэл нэмэгдэх');
  if (data.sweet === 'high' || data.drink === 'high') s.push('ам цангах, хоолны дуршил тогтворгүй болох');
  if (data.lastMeal === 'after21') s.push('шөнө дүүрэх, өглөө хүнд босох');
  return [...new Set(s)].slice(0,7);
}

function strengths(data){
  const arr = [];
  if (data.waterLiters >= 1.5) arr.push('ус уух дадлаа тогтворжуулах боломж байна');
  if (data.sleepHours >= 7) arr.push('нойрны цаг боломжийн байна');
  if (data.cook !== 'outside') arr.push('гэрийн энгийн хоолоор төлөвлөгөө хэрэгжүүлэх боломж байна');
  if (data.sweet !== 'high') arr.push('чихэрлэг хэрэглээг хянах боломж байна');
  return arr.length ? arr : ['өөрчлөлт эхлүүлэх хүсэл, мэдээллээ бөглөсөн нь хамгийн эхний давуу тал'];
}

function getData(){
  return {
    name: val('name') || 'Танд', age: n(val('age')), gender: val('gender'), height: n(val('height')),
    weight: n(val('weight')), targetWeight: n(val('targetWeight')), waist: n(val('waist')),
    workType: val('workType'), sittingHours: n(val('sittingHours')), sleepHours: n(val('sleepHours')),
    waterLiters: n(val('waterLiters')), meals: n(val('meals')), lastMeal: val('lastMeal'),
    sweet: val('sweet'), carb: val('carb'), drink: val('drink'), cook: val('cook'),
    avoidFood: normalizeOpenText(val('avoidFood'), 'байхгүй'), medical: normalizeOpenText(val('medical'), 'байхгүй'), route: selected('route')
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
  const symptoms = possibleSymptoms(data, r.cat);
  const medicalNote = hasMedicalConcern(data.medical) ? `<p class="dangerText">Эрүүл мэндийн анхаарах зүйл: ${escapeHtml(data.medical)}. Төлөвлөгөө сонгохдоо энэ мэдээллийг заавал харгалзана.</p>` : ``;

  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="resultHeader">
      <div class="scoreCard">
        <span class="tag">Таны тайлан тодорхойлогдлоо</span>
        <h2>${escapeHtml(data.name)} таны Биеийн жингийн индекс</h2>
        <div class="bmiNumber">${round(r.bmi,1)}</div>
        <p class="${r.risk.tone}">${r.risk.level}</p>
        <p>Таны оруулсан өндөр, жин, бэлхүүс, амьдралын хэв маягт тулгуурласан урьдчилсан тайлбар.</p>
      </div>
      <div class="metricGrid">
        <div class="metric"><span>Одоогийн жин</span><b>${kg(data.weight)}</b></div>
        <div class="metric"><span>Зорилтот жин</span><b>${kg(data.targetWeight)}</b></div>
        <div class="metric"><span>Хасахыг хүсэж буй жин</span><b>${kg(r.targetLoss)}</b></div>
        <div class="metric"><span>Бэлхүүс</span><b>${data.waist ? data.waist + ' см' : 'бичээгүй'}</b></div>
      </div>
    </div>

    <div class="riskPanel">
      <div class="panel">
        <h3>Энэ хэвээр үргэлжилбэл ямар эрсдэл нэмэгдэх вэ?</h3>
        <ul>${r.risk.risks.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        ${waistText ? `<p class="warnText">${escapeHtml(waistText)}</p>` : ''}
      </div>
      <div class="panel">
        <h3>Яагаад одоо анхаарах хэрэгтэй вэ?</h3>
        <ul>
          ${r.risk.harms.map(x => `<li>${escapeHtml(x)}</li>`).join('')}
          ${habits.map(x => `<li>${escapeHtml(x)}</li>`).join('')}
        </ul>
        ${medicalNote}
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Илүүдэл жин, суугаа хэв маягтай үед илэрч болзошгүй зовиурууд</h3>
      <ul>${symptoms.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
      <p>Эдгээрээс илэрч байвал биеийн ачааллаа багасгаж, төлөвлөгөөг тайван эхлүүлэх нь зөв.</p>
    </div>

    <div class="askBox">
      <h3>${escapeHtml(data.name)}, та одоо ${data.age} настай. Та энэ хэвээрээ байсаар байх уу?</h3>
      <p>Өөрөөсөө асуугаарай. Дотор хүн чинь “тийм ээ, энэ хэвээрээ байя” гэж байна уу, эсвэл “би өөрчилмөөр байна” гэж байна уу?</p>
      <div class="askActions">
        <button type="button" class="btn light" onclick="showPackages()">Өөрчилмөөр байна</button>
        <button type="button" class="btn dangerGhost" onclick="showFarewell()">Одоохондоо үгүй</button>
      </div>
      <div id="farewell" class="farewell hidden">Баярлалаа. Бид хэзээд танд туслахад бэлэн шүү. Өөрийн биеийн дохиогоо сонсож, ус, нойр, хоолны цаг, хөдөлгөөний энгийн дадлаа бага багаар сайжруулаарай.</div>
      <div id="packageArea" class="packageArea hidden"></div>
    </div>
  `;
  result.scrollIntoView({behavior:'smooth', block:'start'});
}

function packageRangeHtml(pack, route, targetLoss){
  if (pack.months === 6) {
    const targetText = targetLoss > 0 ? `Таны зорилтот хасах жин: ${kg(targetLoss)}.` : '';
    return `6 сарын хугацаанд эрүүл хооллолт, биеэ эрүүлжүүлэх дадлаар нийт 20–30 кг хүртэл бууруулах зорилтот шат. ${targetText} Үр дүн нь таны эхний жин, зорилт, тууштай байдлаас хамаарна.`;
  }
  const min = route.monthlyMin * pack.months;
  const max = route.monthlyMax * pack.months;
  const goalMax = Math.min(targetLoss, max);
  const remain = Math.max(0, targetLoss - max);
  return `Энэ хугацаанд аажмаар ${kg(min)} – ${kg(max)} хүртэл бууруулах зорилттой. Таны зорилтоос энэ багцаар дээддээ ${kg(goalMax)}, үлдэх нь ${kg(remain)}.`;
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
      <p>Таны хувьд <b>${st.map(escapeHtml).join(', ')}</b> гэсэн давуу тал харагдаж байна.</p>
      <p>Гэхдээ таны Биеийн жингийн индекс <b>${round(bmi,1)}</b>, одоогийн ангилал <b>${risk.level}</b> байна. Энэ байдлыг удаан үргэлжлүүлбэл даралт, сахар, зүрх судас, элэг өөхлөлт, үе мөч, нойр амьсгалын ачаалал зэрэг эрсдэл нэмэгдэж болзошгүй.</p>
      <p>Таны анхаарах гол зүйл: ${riskPoints.length ? riskPoints.map(escapeHtml).join(' ') : 'өдөр тутмын хоол, ус, нойр, хөдөлгөөний дадлаа тогтвортой хадгалах.'}</p>
      <p><b>Таны сонгосон хэлбэр:</b> ${route.title}. Энэ нь ${route.note}.</p>
      <p><b>Эрүүл Бие — Эрүүл Жин</b> багц нь таны өгсөн хариултад тулгуурлан 1–6 сарын хооллолт, ус, нойр, хөдөлгөөний хувийн төлөвлөгөө гаргана. 6 сарын хөтөлбөр нь эрүүл хооллолт болон биеийг эрүүлжүүлэх дадлаар нийт 20–30 кг хүртэл бууруулах зорилтот шаттай. Энэ нь таны эхний жин, зорилт, биеийн онцлог, тууштай байдлаас хамаарна.</p>
    </div>
    <div class="miniPackages">
      ${Object.entries(packageInfo).map(([key, pack]) => `
        <article class="miniPackage ${key === '6' ? 'featured' : ''}">
          <h4>${pack.title}</h4>
          <p class="price">${pack.price}</p>
          <small>${pack.desc}</small>
          <small>${packageRangeHtml(pack, route, targetLoss)}</small>
          <button type="button" class="btn primary" onclick="selectPackage('${key}')">Энэ багцыг сонгох</button>
        </article>
      `).join('')}
    </div>
    <div id="paymentBox" class="paymentBox hidden"></div>
    <textarea class="copyArea hidden" id="copyArea" readonly placeholder="Багц сонгоход хураангуй энд гарна"></textarea>
    <p class="fineprint">Багцаа сонгоод төлбөрийн хүсэлтээ системээр админ руу илгээнэ. Админ мөнгө орсон эсэхийг шалгаад баталсны дараа тайлангийн холбоос таны утасны дугаарт очно.</p>
  `;
  area.scrollIntoView({behavior:'smooth', block:'start'});
};


function bankOptionsHtml(){
  return PAYMENT_CONFIG.accounts.map((acc, idx) => `
    <label class="bankChoice">
      <input type="radio" name="payBank" value="${idx}" ${idx === 0 ? 'checked' : ''} onchange="updateBankDetails()" />
      <span>${escapeHtml(acc.bank)}</span>
    </label>
  `).join('');
}

function selectedPaymentBank(){
  const idx = Number(document.querySelector('input[name="payBank"]:checked')?.value || 0);
  return PAYMENT_CONFIG.accounts[idx] || PAYMENT_CONFIG.accounts[0];
}

function bankDetailsHtml(acc){
  const linkPart = acc.link ? `<a class="bankLink" href="${escapeHtml(acc.link)}" target="_blank" rel="noopener">${escapeHtml(acc.bank)} апп / холбоос нээх</a>` : `<span class="bankLink mutedLink">Банкны холбоосыг app.js дотор нэмнэ</span>`;
  return `
    <div class="invoiceLine"><span>Сонгосон банк</span><b>${escapeHtml(acc.bank)}</b></div>
    <div class="invoiceLine"><span>Дансны нэр</span><b>${escapeHtml(acc.holder)}</b></div>
    <div class="invoiceLine"><span>Дансны дугаар</span><b>${escapeHtml(acc.number)}</b></div>
    <div class="invoiceLine"><span>Банкны холбоос</span>${linkPart}</div>
  `;
}

window.updateBankDetails = function(){
  const holder = $('bankDetails');
  if (holder) holder.innerHTML = bankDetailsHtml(selectedPaymentBank());
};


function buildRequestObject(phone, bank){
  if (!lastReport || !lastSelectedPackageKey) return null;
  const { data, bmi, risk, route, targetLoss } = lastReport;
  const pack = packageInfo[lastSelectedPackageKey];
  const id = `EBEJ-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  return {
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    phone,
    bank,
    packageKey: lastSelectedPackageKey,
    packageTitle: pack.title,
    packagePrice: pack.price,
    packageMonths: pack.months,
    data,
    bmi: round(bmi,1),
    category: risk.level,
    routeTitle: route.title,
    routeNote: route.note,
    targetLoss: round(targetLoss,1),
    reportBaseUrl: PAYMENT_CONFIG.reportBaseUrl
  };
}

function buildPaymentRequest(phone, bank){
  const req = buildRequestObject(phone, bank);
  if (!req) return '';
  const d = req.data;
  return `Эрүүл Бие — Эрүүл Жин төлбөрийн хүсэлт\n\nХүсэлтийн дугаар: ${req.id}\nНэр: ${d.name}\nУтас: ${phone}\nСонгосон багц: ${req.packageTitle}\nТөлөх дүн: ${req.packagePrice}\nТөлсөн банк: ${bank.bank}\nГүйлгээний утга: ${d.name} - ${phone} - ${req.packageMonths} сар\n\nТайлангийн мэдээлэл\nНас: ${d.age}\nХүйс: ${showVal(d.gender)}\nӨндөр: ${d.height} см\nОдоогийн жин: ${d.weight} кг\nЗорилтот жин: ${d.targetWeight} кг\nХасахыг хүсэж буй жин: ${req.targetLoss} кг\nБэлхүүс: ${d.waist || 'бичээгүй'} см\nБиеийн жингийн индекс: ${req.bmi} — ${req.category}\nСонгосон хэлбэр: ${req.routeTitle}\n\nАдмин мөнгө орсон эсэхийг шалгаад баталсны дараа тайлангийн холбоосыг энэ дугаарт илгээнэ.`;
}

function storeLocalRequest(req){
  const key = 'ebej_admin_requests';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift(req);
  localStorage.setItem(key, JSON.stringify(list));
}

async function sendRequestToAdmin(req){
  if (window.EBEJ_FIREBASE_READY && window.EBEJ_DB) {
    await window.EBEJ_DB.collection('requests').doc(req.id).set(req);
    return { ok:true, firebase:true };
  }
  storeLocalRequest(req);
  return { ok:true, local:true };
}


window.copyBankInfo = async function(){
  const bank = selectedPaymentBank();
  const text = `Банк: ${bank.bank}\nДансны нэр: ${bank.holder}\nДансны дугаар: ${bank.number}`;
  try { await navigator.clipboard.writeText(text); alert('Дансны мэдээлэл хууллаа.'); }
  catch(e){ alert(text); }
};

window.submitPaymentRequest = async function(){
  const phone = String($('payerPhone')?.value || '').trim();
  if (phone.length < 6) { alert('Тайлангийн холбоос авах утасны дугаараа зөв бичнэ үү.'); return; }
  const bank = selectedPaymentBank();
  const req = buildRequestObject(phone, bank);
  const requestText = buildPaymentRequest(phone, bank);
  if ($('copyArea')) $('copyArea').value = requestText;
  try { await sendRequestToAdmin(req); } catch(e) { alert('Хүсэлт илгээхэд алдаа гарлаа. Интернэт эсвэл админ тохиргоогоо шалгана уу.'); return; }
  try { await navigator.clipboard.writeText(requestText); } catch(e) {}
  const sent = $('requestSent');
  if (sent) sent.classList.remove('hidden');
  alert('Хүсэлт системийн админ хэсэг рүү илгээгдлээ. Админ мөнгө орсон эсэхийг шалгаад баталсны дараа тайлангийн холбоос таны дугаарт очно.');
};

window.selectPackage = function(key){
  if (!lastReport) return;
  lastSelectedPackageKey = key;
  const { data, bmi, risk, route, targetLoss } = lastReport;
  const pack = packageInfo[key];
  const defaultPhone = '';
  const summary = `Эрүүл Бие — Эрүүл Жин төлбөрийн хүсэлт\n\nНэр: ${data.name}\nУтас: ${defaultPhone}\nСонгосон багц: ${pack.title}\nТөлөх дүн: ${pack.price}\nБиеийн жингийн индекс: ${round(bmi,1)} — ${risk.level}`;
  $('copyArea').value = summary;
  const pay = $('paymentBox');
  pay.classList.remove('hidden');
  pay.innerHTML = `
    <h3>Төлбөрийн хүсэлт админ руу илгээх</h3>
    <p><b>${escapeHtml(data.name)}</b>, таны сонгосон багц: <b>${escapeHtml(pack.title)}</b>. Доорх дансаар төлбөрөө хийгээд утасны дугаараа бичиж хүсэлтээ админ руу илгээнэ. Админ мөнгө орсон эсэхийг шалгаад баталсны дараа тайлангийн холбоос таны оруулсан дугаарт очно.</p>
    <div class="invoiceGrid">
      <div class="invoiceLine"><span>Төлөх дүн</span><b>${escapeHtml(pack.price)}</b></div>
      <div class="invoiceLine"><span>Гүйлгээний утга</span><b>${escapeHtml(data.name)} - утасны дугаар - ${pack.months} сар</b></div>
    </div>

    <div class="paymentForm">
      <label>Тайлангийн холбоос авах утасны дугаар
        <input id="payerPhone" type="tel" inputmode="tel" placeholder="Жишээ: 99112233" required />
      </label>

      <div class="bankSelectTitle">Төлбөр хийх банкаа сонгоно уу</div>
      <div class="bankGrid">${bankOptionsHtml()}</div>

      <div id="bankDetails" class="invoiceGrid bankDetails">${bankDetailsHtml(PAYMENT_CONFIG.accounts[0])}</div>

      <div class="askActions">
        <button class="btn secondary" type="button" onclick="copyBankInfo()">Дансны мэдээлэл хуулах</button>
        <button class="btn primary" type="button" onclick="submitPaymentRequest()">Админд хүсэлт илгээх</button>
      </div>

      <div id="requestSent" class="pdfReady hidden">
        Таны хүсэлт системийн админ хэсэг рүү илгээгдлээ. Админ мөнгө орсон эсэхийг шалгаад баталсны дараа тайлангийн холбоос таны утасны дугаарт очно.
        <div class="askActions">
          <button class="btn light" type="button" onclick="copyOrder()">Хүсэлт дахин хуулах</button>
        </div>
      </div>
    </div>

    <p class="smallNote">Энэ хэсгээс шууд PDF татахгүй. Эхлээд системээр хүсэлт админ руу илгээгдэнэ. Админ баталгаажуулсны дараа тайлангийн холбоос таны утасны дугаарт очно.</p>
  `;
  pay.scrollIntoView({behavior:'smooth', block:'start'});
};

window.copyOrder = async function(){
  const text = $('copyArea')?.value || '';
  if (!text) { alert('Эхлээд багцаа сонгоно уу.'); return; }
  try { await navigator.clipboard.writeText(text); alert('Хүсэлт хууллаа.'); }
  catch(e){ alert('Хуулж чадсангүй. Текстийг гараар copy хийнэ үү.'); }
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
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
  });
}
