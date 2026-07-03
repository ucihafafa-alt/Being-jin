const $ = (id) => document.getElementById(id);
const form = $('healthForm');
const result = $('result');

const packageInfo = {
  '1': { title: '1 сарын эхлэл', months: 1, price: '11,900₮', days: 30 },
  '2': { title: '2 сарын тогтворжилт', months: 2, price: '20,500₮', days: 60 },
  '3': { title: '3 сарын бүрэн өөрчлөлт', months: 3, price: '30,000₮', days: 90 }
};

const routeInfo = {
  active: {
    title: 'Хөдөлгөөнтэй төлөвлөгөө',
    monthlyMin: 2.4,
    monthlyMax: 4.0,
    note: 'Өдөр тутмын алхалт, гэрийн хөнгөн дасгал, хоолны хэмжээг зөв тааруулах зам.'
  },
  low: {
    title: 'Хөдөлгөөн багатай төлөвлөгөө',
    monthlyMin: 1.6,
    monthlyMax: 3.2,
    note: 'Суугаа ажилтай, зав багатай хүнд хоолны цаг, хэмжээ, ус, нойр, амттаны хэрэглээг засах зам.'
  },
  support: {
    title: 'Дэмжих бүтээгдэхүүнтэй төлөвлөгөө',
    monthlyMin: 2.0,
    monthlyMax: 4.0,
    note: 'Нэмэлт бүтээгдэхүүнийг хооллолт, ус, дадалтай хамт зөв дэмжлэг болгон ашиглах зам. Зөвхөн бүтээгдэхүүнээр үр дүн амлахгүй.'
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
    risks: ['Жингээ хадгалах, бэлхүүс болон хоолны дадлаа тогтвортой байлгах нь чухал.', 'Хэт огцом турах шаардлагагүй байж болно.'],
    harms: ['Хэт бага идэх, олон төрлийн тураах зүйл турших нь ядрах, буцааж жин нэмэх эрсдэлтэй.']
  },
  overweight: {
    level: 'Илүүдэл жин', tone: 'warnText',
    risks: ['Цусны даралт ихсэх эрсдэл нэмэгдэх боломжтой.', 'Цусан дахь сахар, өөх тосны солилцоо алдагдах эрсдэлд анхаарна.', 'Нуруу, өвдөг, үе мөчид ачаалал нэмэгдэх боломжтой.'],
    harms: ['Удаан үргэлжилбэл ядрах, амьсгаадах, нойр муудах, гэдэс-бэлхүүсний өөх нэмэгдэх хандлагатай.']
  },
  obese1: {
    level: 'Таргалалт I түвшин', tone: 'dangerText',
    risks: ['Даралт, 2-р хэлбэрийн чихрийн шижин, өөх тосны өөрчлөлтийн эрсдэлийг анхаарах хэрэгтэй.', 'Зүрх судасны ачаалал, элэг өөхлөх, үе мөчний ачаалал нэмэгдэх боломжтой.', 'Нойрны чанар муудах, амьсгаадах, стрессдэх байдал нэмэгдэх хандлагатай.'],
    harms: ['Хурдан хугацаанд хүчээр өлсгөх биш, 1–3 сарын тогтвортой дадлаар ачааллыг бууруулах нь зөв.']
  },
  obese2: {
    level: 'Таргалалт II түвшин', tone: 'dangerText',
    risks: ['Цусны даралт, сахар, зүрх судас, элэг өөхлөх болон үе мөчний ачааллын эрсдэлийг онцгой анхаарна.', 'Хэрэв даралт, сахар, зүрх, бөөр, жирэмсэн/хөхүүл зэрэг асуудал байвал эмчийн зөвлөгөөтэй хамт хэрэгжүүлэх нь зөв.'],
    harms: ['Огцом турах оролдлого нь ядрах, булчин алдах, буцааж нэмэх эрсдэлтэй тул үе шаттай төлөвлөгөө шаардлагатай.']
  },
  obese3: {
    level: 'Таргалалт III түвшин', tone: 'dangerText',
    risks: ['Халдварт бус өвчлөлийн эрсдэл өндөр байж болзошгүй: даралт, сахар, зүрх судас, элэг өөхлөх, нойрны амьсгалын асуудал, үе мөчний ачаалал.', 'Мэргэжлийн эмчийн үзлэг, шинжилгээтэй хамт жингийн төлөвлөгөө хэрэгжүүлэхийг зөвлөж байна.'],
    harms: ['Хэт хурдан турах, өлсөх, хүчтэй бүтээгдэхүүн хэрэглэх нь эрсдэлтэй. Аажим, хяналттай, тогтвортой арга хамгийн чухал.']
  }
};

function n(v){ return Number(v || 0); }
function round(v, d=1){ return Math.round(v * Math.pow(10,d)) / Math.pow(10,d); }
function moneyLabel(v){ return `${round(v,1)} кг`; }
function selected(name){ return document.querySelector(`input[name="${name}"]:checked`)?.value; }
function val(id){ return $(id).value.trim(); }

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
  return `Бэлхүүсний тойрог ${waist} см байна. Гэсэн ч зөвхөн бэлхүүсээр дүгнэхгүй, BMI, хооллолт, хөдөлгөөн, нойрыг хамтад нь харна.`;
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

function getData(){
  return {
    name: val('name') || 'Хэрэглэгч',
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
    route: selected('route'),
    pack: selected('package')
  };
}

function renderResult(data){
  const hM = data.height / 100;
  const bmi = data.weight / (hM * hM);
  const cat = bmiCategory(bmi);
  const risk = riskTexts[cat];
  const route = routeInfo[data.route];
  const pack = packageInfo[data.pack];
  const targetLoss = Math.max(0, data.weight - data.targetWeight);
  const healthyUpper = 24.9 * hM * hM;
  const lossToHealthyUpper = Math.max(0, data.weight - healthyUpper);
  const oneMonthMax = route.monthlyMax;
  const oneMonthMin = route.monthlyMin;
  const chosenMax = route.monthlyMax * pack.months;
  const chosenMin = route.monthlyMin * pack.months;
  const threeMonthMax = route.monthlyMax * 3;
  const remainingAfterChosen = Math.max(0, targetLoss - chosenMax);
  const remainingAfterMonth = Math.max(0, targetLoss - oneMonthMax);
  const remainingAfter3 = Math.max(0, targetLoss - threeMonthMax);
  const waistText = waistRisk(data.gender, data.waist);
  const habits = habitRisks(data);
  const medicalNote = data.medical !== 'тодорхой бичээгүй' ? `<p class="dangerText">Эрүүл мэндийн анхаарах зүйл бичсэн байна: ${escapeHtml(data.medical)}. Энэ тохиолдолд төлөвлөгөөг эмчийн зөвлөгөөтэй хамт хэрэгжүүлэх нь зүйтэй.</p>` : '';
  const orderText = makeOrderText(data, bmi, risk, route, pack, targetLoss, oneMonthMax, threeMonthMax);

  result.classList.remove('hidden');
  result.innerHTML = `
    <div class="resultHeader">
      <div class="scoreCard">
        <span class="tag">Урьдчилсан үнэлгээ</span>
        <h2>${escapeHtml(data.name)} таны BMI</h2>
        <div class="bmiNumber">${round(bmi,1)}</div>
        <p class="${risk.tone}">${risk.level}</p>
        <p>Энэ нь онош биш. Жин, бэлхүүс, дадал, хооллолтын мэдээлэлд тулгуурласан чиглүүлэх үнэлгээ.</p>
      </div>
      <div class="metricGrid">
        <div class="metric"><span>Одоогийн жин</span><b>${moneyLabel(data.weight)}</b></div>
        <div class="metric"><span>Зорилтот жин</span><b>${moneyLabel(data.targetWeight)}</b></div>
        <div class="metric"><span>Зорилтот хасах жин</span><b>${moneyLabel(targetLoss)}</b></div>
        <div class="metric"><span>Хэвийн BMI дээд хүрээнд ойртох</span><b>${moneyLabel(lossToHealthyUpper)}</b></div>
      </div>
    </div>

    <div class="riskPanel">
      <div class="panel">
        <h3>Халдварт бус өвчлөлийн болзошгүй эрсдэлийн дохио</h3>
        <ul>${risk.risks.map(x => `<li>${x}</li>`).join('')}</ul>
        ${waistText ? `<p class="warnText">${waistText}</p>` : ''}
      </div>
      <div class="panel">
        <h3>Хор уршиг ба анхаарах зуршил</h3>
        <ul>${risk.harms.map(x => `<li>${x}</li>`).join('')}${habits.map(x => `<li>${x}</li>`).join('')}</ul>
        ${medicalNote}
      </div>
    </div>

    <div class="riskPanel">
      <div class="panel">
        <h3>Таны сонгосон зам</h3>
        <p><b>${route.title}</b></p>
        <p>${route.note}</p>
        <ul>
          <li>Эрүүлээр 1 сард ойролцоогоор <b>${moneyLabel(oneMonthMin)} – ${moneyLabel(oneMonthMax)}</b> хүртэл бууруулах боломжит тооцоо.</li>
          <li>3 сарын дээд тооцоо: <b>${moneyLabel(threeMonthMax)}</b> хүртэл.</li>
          <li>Таны зорилтот хасах жин: <b>${moneyLabel(targetLoss)}</b>.</li>
          <li>1 сарын дээд тооцоогоор зорилтоос үлдэх жин: <b>${moneyLabel(remainingAfterMonth)}</b>.</li>
          <li>3 сарын дээд тооцоогоор зорилтоос үлдэх жин: <b>${moneyLabel(remainingAfter3)}</b>.</li>
        </ul>
      </div>
      <div class="panel">
        <h3>Сонгосон төлөвлөгөө</h3>
        <p><b>${pack.title}</b> — <b>${pack.price}</b></p>
        <ul>
          <li>${pack.days} хоногийн хувийн төлөвлөгөө.</li>
          <li>Энэ багцын хугацаанд эрүүлээр бууруулах боломжит хүрээ: <b>${moneyLabel(chosenMin)} – ${moneyLabel(chosenMax)}</b>.</li>
          <li>Энэ багцын дээд тооцоогоор зорилтоос үлдэх жин: <b>${moneyLabel(remainingAfterChosen)}</b>.</li>
          <li>Үр дүн нь биеийн онцлог, сахилга, нойр, ус, хооллолт, хөдөлгөөнөөс шалтгаална.</li>
        </ul>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <h3>Бүрэн төлөвлөгөөнд юу багтах вэ?</h3>
      <ul>
        <li>Өглөө, өдөр, оройн хоолны энгийн сонголтууд.</li>
        <li>Өндөг, тараг, аарц, овьёос, ногоотой шөл, мах, тахиа, будаа, байцаа, лууван, өргөст хэмх зэрэг өдөр тутмын хүнсээр зохицуулах арга.</li>
        <li>Хоолны хэмжээ, цаг, ус, нойр, амттан, гурил будааны зохицуулалт.</li>
        <li>Хөдөлгөөнтэй, хөдөлгөөн багатай, дэмжих бүтээгдэхүүнтэй гэсэн таны сонгосон замд тохирсон хувилбар.</li>
        <li>1-рт эрүүлжих, 2-рт жин бууруулах, 3-рт халдварт бус өвчлөлийн эрсдэлээс сэргийлэх дадлын чиглэл.</li>
      </ul>
    </div>

    <div class="orderBox">
      <h3>Бүрэн төлөвлөгөө авахад бэлэн боллоо</h3>
      <p>Доорх хураангуйг хуулж page-д илгээнэ. Төлбөр баталгаажсаны дараа таны сонгосон ${pack.months} сарын дэлгэрэнгүй хооллолт, ус, нойр, хөдөлгөөний төлөвлөгөө гарна.</p>
      <div class="orderActions">
        <button class="btn secondary" type="button" onclick="copyOrder()">Хураангуй хуулах</button>
        <button class="btn ghost" type="button" onclick="window.print()">PDF / Хэвлэх</button>
      </div>
      <textarea class="copyArea" id="copyArea" readonly>${orderText}</textarea>
      <p class="fineprint">Энэхүү систем нь мэдээллийг серверт хадгалахгүй. Бөглөсөн хүн хураангуйгаа өөрөө хуулж илгээнэ.</p>
    </div>
  `;
  result.scrollIntoView({behavior:'smooth', block:'start'});
}

function makeOrderText(data, bmi, risk, route, pack, targetLoss, oneMonthMax, threeMonthMax){
  return `Эрүүл Бие — Эрүүл Жин төлөвлөгөө авах хүсэлт\n\nНэр: ${data.name}\nНас: ${data.age}\nХүйс: ${data.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}\nӨндөр: ${data.height} см\nОдоогийн жин: ${data.weight} кг\nЗорилтот жин: ${data.targetWeight} кг\nЗорилтот хасах жин: ${round(targetLoss,1)} кг\nБэлхүүс: ${data.waist || 'бичээгүй'} см\nBMI: ${round(bmi,1)} — ${risk.level}\n\nСонгосон зам: ${route.title}\n1 сарын эрүүл дээд тооцоо: ${round(oneMonthMax,1)} кг хүртэл\n3 сарын эрүүл дээд тооцоо: ${round(threeMonthMax,1)} кг хүртэл\n\nСонгосон багц: ${pack.title} — ${pack.price}\nСуугаа цаг: ${data.sittingHours}\nНойр: ${data.sleepHours} цаг\nУс: ${data.waterLiters} литр\nХооллох тоо: ${data.meals}\nОройн хоол: ${data.lastMeal}\nАмттан: ${data.sweet}\nГурил/будаа: ${data.carb}\nУндаа/шүүс: ${data.drink}\nХоол хийх боломж: ${data.cook}\nИддэггүй/харшилтай хүнс: ${data.avoidFood}\nЭрүүл мэндийн анхаарах зүйл: ${data.medical}\n\nДэлгэрэнгүй ${pack.months} сарын төлөвлөгөө гаргуулъя.`;
}

function escapeHtml(str){
  return String(str).replace(/[&<>'"]/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s]));
}

window.copyOrder = async function(){
  const text = $('copyArea')?.value || '';
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
    alert('Зорилтот жин одоогийн жингээс бага байх ёстой.');
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
