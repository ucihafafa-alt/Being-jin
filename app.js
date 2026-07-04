const $ = (id) => document.getElementById(id);
const form = $('healthForm');
const result = $('result');
let lastReport = null;

const packageInfo = {
  '1': { title: '1 сарын эхлэл', months: 1, price: '11,900₮', days: 30, desc: '30 хоногийн хооллолт, ус, нойр, хөнгөн хөдөлгөөний эхлэл.' },
  '2': { title: '2 сарын тогтворжилт', months: 2, price: '20,500₮', days: 60, desc: 'Эхний дадлыг үргэлжлүүлж, буцааж нэмэхгүй тогтвортой горим.' },
  '3': { title: '3 сарын бүрэн өөрчлөлт', months: 3, price: '30,000₮', days: 90, desc: '90 хоногийн хооллолт, дадал, жингийн тэнцвэрийн бүрэн төлөвлөгөө.' },
  '6': { title: '6 сарын урт хугацааны хөтөлбөр', months: 6, price: '55,000₮', days: 180, desc: 'Эрүүл амьдралын хэв маягийг бүрэн суулгах удаан хугацааны төлөвлөгөө.' }
};

const routeInfo = {
  active: {
    title: 'Хөдөлгөөнтэй төлөвлөгөө',
    monthlyMin: 2.0,
    monthlyMax: 4.0,
    note: 'Алхалт, гэрийн хөнгөн дасгал, хоолны хэмжээг зөв тааруулах зам.'
  },
  low: {
    title: 'Хөдөлгөөн багатай төлөвлөгөө',
    monthlyMin: 1.5,
    monthlyMax: 3.0,
    note: 'Суугаа ажилтай, зав багатай хүнд хоолны цаг, хэмжээ, ус, нойр, амттаны хэрэглээг засах зам.'
  },
  support: {
    title: 'Дэмжих бүтээгдэхүүнтэй төлөвлөгөө',
    monthlyMin: 2.0,
    monthlyMax: 4.0,
    note: 'Дэмжих бүтээгдэхүүнийг хооллолт, ус, нойр, дадалтай хамт хэрэглэх зам. Зөвхөн бүтээгдэхүүнээр үр дүн амлахгүй.'
  }
};

const riskTexts = {
  under: {
    level: 'Жин багадалт', tone: 'warnText',
    risks: ['Дархлаа, ядрах, булчингийн масс багасах эрсдэлд анхаарах.', 'Хэт тураах төлөвлөгөө тохиромжгүй байж болно.'],
    harms: ['Хоолны чанар, уураг, нойр, эрч хүчийг эхлээд тогтворжуулах шаардлагатай.']
  },
  normal: {
    level: 'Хэвийн жингийн хүрээ', tone: 'okText',
    risks: ['БЖИ хэвийн харагдаж байна. Гэхдээ бэлхүүс, хоолны дадал, нойр, хөдөлгөөнөө хамтад нь анхаарна.', 'Хэт огцом турах шаардлагагүй байж болно.'],
    harms: ['Хэт бага идэх, олон зүйл турших нь ядрах, буцааж жин нэмэх эрсдэлтэй.']
  },
  overweight: {
    level: 'Илүүдэл жин', tone: 'warnText',
    risks: ['Цусны даралт ихсэх эрсдэл нэмэгдэх боломжтой.', 'Цусан дахь сахар, өөх тосны солилцоо алдагдах эрсдэлд анхаарна.', 'Нуруу, өвдөг, үе мөчид ачаалал нэмэгдэх боломжтой.'],
    harms: ['Удаан үргэлжилбэл ядрах, амьсгаадах, нойр муудах, гэдэс-бэлхүүсний өөх нэмэгдэх хандлагатай.']
  },
  obese1: {
    level: 'Таргалалт I түвшин', tone: 'dangerText',
    risks: ['Даралт, 2-р хэлбэрийн чихрийн шижин, өөх тосны өөрчлөлтийн эрсдэлийг анхаарах хэрэгтэй.', 'Зүрх судасны ачаалал, элэг өөхлөх, үе мөчний ачаалал нэмэгдэх боломжтой.', 'Нойр муудах, амьсгаа давчдах, ядрах дохио илэрч болзошгүй.'],
    harms: ['Одоо анхаарахгүй удаан явбал өдөр тутмын хөдөлгөөн, ажиллах чадвар, нойр, сэтгэл санаанд хүртэл нөлөөлөх эрсдэлтэй.']
  },
  obese2: {
    level: 'Таргалалт II түвшин', tone: 'dangerText',
    risks: ['Даралт, чихрийн шижин, зүрх судасны эрсдэлийг нухацтай анхаарах түвшин.', 'Элэг өөхлөлт, үе мөч, нуруу, амьсгалын ачаалал нэмэгдэх магадлалтай.', 'Бэлхүүс их байвал бодисын солилцооны эрсдэл илүү өндөр байж болно.'],
    harms: ['Хэт хурдан тураах биш, эмчийн хяналттай, аажим, тогтвортой дадал хэрэгтэй.']
  },
  obese3: {
    level: 'Таргалалт III түвшин', tone: 'dangerText',
    risks: ['Халдварт бус өвчлөлийн эрсдэлийг өндөр түвшинд анхаарах шаардлагатай.', 'Зүрх судас, даралт, сахар, элэг, үе мөч, нойр-амьсгалын ачаалал нэмэгдсэн байж болзошгүй.', 'Өөрөө дур мэдэн хатуу дэглэм, хүчтэй бүтээгдэхүүн хэрэглэхээс зайлсхийх хэрэгтэй.'],
    harms: ['Энэ түвшинд мэргэжлийн эмчийн зөвлөгөөтэй хамт, аажим тогтвортой төлөвлөгөө хэрэгжүүлэх нь илүү аюулгүй.']
  }
};

function val(id){ return ($(id)?.value || '').trim(); }
function n(v){ return Number(v || 0); }
function selected(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
function round(x,d=1){ return Number(x || 0).toFixed(d).replace(/\.0$/, ''); }
function kg(x){ return `${round(Math.max(0, x),1)} кг`; }
function escapeHtml(str){ return String(str).replace(/[&<>'"]/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }

function bmiCategory(bmi){
  if (bmi < 18.5) return 'under';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese1';
  if (bmi < 40) return 'obese2';
  return 'obese3';
}

function waistRisk(gender, waist){
  if (!waist) return '';
  const limit = gender === 'male' ? 90 : 80;
  if (waist >= limit) return `Бэлхүүсний тойрог ${waist} см байна. ${gender === 'male' ? 'Эрэгтэйд' : 'Эмэгтэйд'} ${limit} см болон түүнээс дээш үед хэвлийн өөхлөлт, бодисын солилцооны эрсдэлийг илүү анхаарах шаардлагатай.`;
  return `Бэлхүүсний тойрог ${waist} см байна. Гэсэн ч зөвхөн бэлхүүсээр дүгнэхгүй, БЖИ, хооллолт, хөдөлгөөн, нойрыг хамтад нь харна.`;
}

function habitRisks(data){
  const arr = [];
  if (data.sittingHours >= 7) arr.push('Өдөрт удаан сууж байгаа нь илчлэг зарцуулалтыг багасгаж, бэлхүүс нэмэгдэхэд нөлөөлж болзошгүй.');
  if (data.sleepHours < 6) arr.push('Нойр бага байгаа нь өлсөх мэдрэмж, амттаны дуршил, стресс идэлтийг нэмэгдүүлэх боломжтой.');
  if (data.waterLiters < 1.5) arr.push('Усны хэрэглээ бага байна. Усны дадал тогтохгүй бол өлсөх, амттан хүсэх мэдрэмжтэй андуурагдах тохиолдол бий.');
  if (data.lastMeal === 'after21') arr.push('Орой хэт орой хооллох нь жингийн тэнцвэрт сөргөөр нөлөөлөх боломжтой.');
  if (data.sweet === 'high') arr.push('Амттан, чихэрлэг хэрэглээ өндөр байгаа нь илчлэгийн илүүдэл үүсгэх гол шалтгаан байж болно.');
  if (data.carb === 'high') arr.push('Гурил, будаа, боов боорцог их хэрэглэдэг бол хэмжээг зөв тааруулах шаардлагатай.');
  if (data.drink === 'high') arr.push('Хийжүүлсэн ундаа, шүүс их хэрэглэх нь шингэн илчлэгээр жин нэмэхэд нөлөөлнө.');
  return arr.length ? arr : ['Том эрсдэлтэй зуршил цөөн харагдаж байна. Гэхдээ хоолны хэмжээ, цаг, ус, нойрыг тогтвортой болгох нь чухал.'];
}

function strengths(data){
  const arr = [];
  if (data.targetWeight && data.targetWeight < data.weight) arr.push('зорилтот жингээ тодорхой тавьсан');
  if (data.waterLiters >= 1.5) arr.push('усны хэрэглээ эхлэхэд боломжийн байна');
  if (data.sleepHours >= 7) arr.push('нойрны цаг харьцангуй сайн байна');
  if (data.cook !== 'outside') arr.push('гэрийн энгийн хүнсээр төлөвлөгөө хэрэгжүүлэх боломж байна');
  if (data.sweet !== 'high') arr.push('чихэрлэг хэрэглээг хянах боломжтой харагдаж байна');
  return arr.length ? arr : ['өөрчлөлт эхлүүлэх хүсэл, мэдээллээ бөглөсөн нь хамгийн эхний давуу тал'];
}

function getData(){
  return {
    name: val('name') || 'Танд',
    age: n(val('age')),
    gender: val('gender'),
    height: n(val('height')),
    weight: n(val('weight')),
    targetWeight: n(val('targetWeight')),
    waist: n(val('waist')),
    workType: val('workType'),
    sittingHours: n(val('sittingHours')),
    sleepHours: n(val('sleepHours')),
    waterLiters: n(val('waterLiters')),
    meals: n(val('meals')),
    lastMeal: val('lastMeal'),
    sweet: val('sweet'),
    carb: val('carb'),
    drink: val('drink'),
    cook: val('cook'),
    avoidFood: val('avoidFood') || 'тодорхойгүй',
    medical: val('medical') || 'тодорхой бичээгүй',
    route: selected('route')
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
  const plusRisks = [...r.risk.risks];
  const oneMax = r.route.monthlyMax;
  const threeMax = r.route.monthlyMax * 3;
  const sixMax = r.route.monthlyMax * 6;
  const oneMin = r.route.monthlyMin;
  const threeMin = r.route.monthlyMin * 3;
  const sixMin = r.route.monthlyMin * 6;
  const safeForGoal1 = Math.min(r.targetLoss, oneMax);
  const safeForGoal3 = Math.min(r.targetLoss, threeMax);
  const safeForGoal6 = Math.min(r.targetLoss, sixMax);
  const medicalNote = data.medical !== 'тодорхой бичээгүй' ? `<p class="dangerText">Эрүүл мэндийн анхаарах зүйл бичсэн байна: ${escapeHtml(data.medical)}. Энэ тохиолдолд төлөвлөгөөг эмчийн зөвлөгөөтэй хамт хэрэгжүүлэх нь зүйтэй.</p>` : '';

  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="resultHeader">
      <div class="scoreCard">
        <span class="tag">Үнэгүй урьдчилсан үнэлгээ</span>
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
        <h3>Халдварт бус өвчлөлийн болзошгүй үр дагавар</h3>
        <ul>${plusRisks.map(x => `<li>${x}</li>`).join('')}</ul>
        ${waistText ? `<p class="warnText">${waistText}</p>` : ''}
      </div>
      <div class="panel">
        <h3>Яагаад аюултай вэ?</h3>
        <ul>
          ${r.risk.harms.map(x => `<li>${x}</li>`).join('')}
          ${habits.map(x => `<li>${x}</li>`).join('')}
        </ul>
        ${medicalNote}
      </div>
    </div>

    <div class="riskPanel">
      <div class="panel">
        <h3>Таны сонгосон аргачлал</h3>
        <p><b>${r.route.title}</b></p>
        <p>${r.route.note}</p>
        <ul>
          <li>Эрүүлээр 1 сард дээд тал нь ойролцоогоор <b>${kg(oneMax)}</b> хүртэл бууруулах тооцоо.</li>
          <li>1 сарын боломжит хүрээ: <b>${kg(oneMin)} – ${kg(oneMax)}</b>.</li>
          <li>3 сарын боломжит хүрээ: <b>${kg(threeMin)} – ${kg(threeMax)}</b>.</li>
          <li>6 сарын боломжит хүрээ: <b>${kg(sixMin)} – ${kg(sixMax)}</b>.</li>
        </ul>
      </div>
      <div class="panel">
        <h3>Таны зорилтот жингийн бодит тооцоо</h3>
        <ul>
          <li>Таны зорилтот хасах жин: <b>${kg(r.targetLoss)}</b>.</li>
          <li>1 сарын дээд тооцоогоор зорилтоос хасах боломжтой: <b>${kg(safeForGoal1)}</b>.</li>
          <li>3 сарын дээд тооцоогоор зорилтоос хасах боломжтой: <b>${kg(safeForGoal3)}</b>.</li>
          <li>6 сарын дээд тооцоогоор зорилтоос хасах боломжтой: <b>${kg(safeForGoal6)}</b>.</li>
          <li>Хэт хурдан хасах биш, эрүүл, тогтвортой хязгаараар тооцсон болно.</li>
        </ul>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Үнэгүй үнэлгээний дүгнэлт</h3>
      <p>Одоо та өөрийн БЖИ, жингийн ангилал, халдварт бус өвчлөлийн болзошгүй эрсдэлийн дохио, эрүүлээр хасах боломжит дээд хязгаараа харлаа.</p>
      <p>Дараагийн алхам бол таны өгсөн хариултуудад тулгуурласан хооллолт, ус, нойр, хөдөлгөөний дэлгэрэнгүй төлөвлөгөө авах эсэхээ шийдэх юм.</p>
    </div>

    <div class="askBox">
      <h3>Та өөрийн биеийн онцлогт тохирсон 1–6 сарын “Эрүүл Бие — Эрүүл Жин” багцаа сонсмоор байна уу?</h3>
      <p>Тийм гэвэл таны нэр, БЖИ, давуу тал, эрсдэлийн дохио, сонгосон аргачлалд тулгуурлан багцуудыг танилцуулна.</p>
      <div class="askActions">
        <button type="button" class="btn light" onclick="showPackages()">Тийм, багц харъя</button>
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
      <p>Таны анхаарах гол зүйл: ${riskPoints.map(escapeHtml).join(' ')}</p>
      <p>Тиймээс өөртөө болон хайртай хүмүүстээ үлгэр дуурайлал болж, эрүүл мэнддээ өнөөдрөөс анхаараарай.</p>
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
  $('copyArea').select();
};

window.copyOrder = async function(){
  const text = $('copyArea')?.value || '';
  if (!text) { alert('Эхлээд багцаа сонгоно уу.'); return; }
  try{
    await navigator.clipboard.writeText(text);
    alert('Хураангуй хууллаа. Одоо page рүү илгээж болно.');
  }catch(e){
    $('copyArea').select();
    document.execCommand('copy');
    alert('Хураангуй хууллаа.');
  }
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = getData();
  if (data.targetWeight >= data.weight) {
    alert('Зорилтот жин одоогийн жингээс бага байх ёстой. Жин барих зорилготой бол одоогийнхоос 1–2 кг бага тоо оруулж үзнэ үү.');
    return;
  }
  if (data.height <= 0 || data.weight <= 0) {
    alert('Өндөр, жингээ зөв бөглөнө үү.');
    return;
  }
  renderResult(data);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
