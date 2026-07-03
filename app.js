const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const form = $('#healthForm');
const report = $('#report');
const reportContent = $('#reportContent');
const reportTitle = $('#reportTitle');
const reportMeta = $('#reportMeta');

const BMI_CATEGORIES = [
  { max: 18.5, label: 'Жин багатай', tone: 'warn', note: 'Жинг хасах төлөвлөгөө бус, шим тэжээлээ нөхөх чиглэл илүү тохирно.' },
  { max: 25, label: 'Хэвийн жингийн хүрээ', tone: 'ok', note: 'Одоогийн дадлаа тогтвортой хадгалах нь гол зорилго.' },
  { max: 30, label: 'Илүүдэл жингийн хүрээ', tone: 'warn', note: 'Хооллолт, хөдөлгөөн, нойрны дадлаа засахад тохиромжтой үе.' },
  { max: 35, label: 'Таргалалтын I зэрэг', tone: 'danger', note: 'Жин бууруулах төлөвлөгөөг аажмаар, тууштай эхлүүлэх шаардлагатай.' },
  { max: 40, label: 'Таргалалтын II зэрэг', tone: 'danger', note: 'Дадлаа өөрчлөхөөс гадна эмчийн зөвлөгөө авах нь зүйтэй.' },
  { max: Infinity, label: 'Таргалалтын III зэрэг', tone: 'danger', note: 'Эмч, мэргэжилтний хяналттайгаар төлөвлөгөө эхлүүлэхийг зөвлөе.' }
];

function getFormData(formEl) {
  const fd = new FormData(formEl);
  const signals = fd.getAll('signals').filter(Boolean);
  return {
    name: (fd.get('name') || 'Хэрэглэгч').toString().trim() || 'Хэрэглэгч',
    age: Number(fd.get('age')),
    gender: fd.get('gender'),
    height: Number(fd.get('height')),
    weight: Number(fd.get('weight')),
    goalWeight: Number(fd.get('goalWeight')),
    waist: Number(fd.get('waist')) || 0,
    sittingHours: Number(fd.get('sittingHours')),
    workType: fd.get('workType'),
    meals: fd.get('meals'),
    lastMeal: fd.get('lastMeal'),
    water: fd.get('water'),
    sweet: fd.get('sweet'),
    carb: fd.get('carb'),
    sleep: fd.get('sleep'),
    stress: fd.get('stress'),
    planType: fd.get('planType'),
    signals
  };
}

function calculateBMI(weight, heightCm) {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

function getBmiCategory(bmi) {
  return BMI_CATEGORIES.find(cat => bmi < cat.max);
}

function round1(num) { return Math.round(num * 10) / 10; }

function genderText(gender) {
  return gender === 'male' ? 'Эрэгтэй' : gender === 'female' ? 'Эмэгтэй' : 'Бусад / хэлэхгүй';
}
function planText(type) {
  if (type === 'active') return 'Хөдөлгөөнтэй төлөвлөгөө';
  if (type === 'lowmove') return 'Хөдөлгөөн багатай төлөвлөгөө';
  return 'Дэмжих бүтээгдэхүүнтэй төлөвлөгөө';
}
function workText(v) {
  return v === 'sedentary' ? 'Ихэнхдээ суугаа' : v === 'mixed' ? 'Сууж/алхаж холимог' : 'Хөдөлгөөнтэй ажил';
}

function healthyWeightRange(heightCm) {
  const h = heightCm / 100;
  return {
    min: round1(18.5 * h * h),
    max: round1(24.9 * h * h)
  };
}

function getRiskLevel(data, bmi) {
  let score = 0;
  if (bmi >= 25) score += 1;
  if (bmi >= 30) score += 2;
  if (bmi >= 35) score += 2;
  if (data.waist && (data.waist / data.height) >= 0.5) score += 1;
  if (data.sittingHours >= 8) score += 1;
  if (data.water === 'low') score += 1;
  if (data.lastMeal === 'late') score += 1;
  if (data.sweet === 'high') score += 1;
  if (data.carb === 'high') score += 1;
  if (data.sleep === 'low') score += 1;
  if (data.stress === 'high') score += 1;
  const seriousSignals = ['pressure', 'sugar', 'breath'];
  if (data.signals.some(s => seriousSignals.includes(s))) score += 2;

  if (score <= 2) return { label: 'Бага анхаарах түвшин', tone: 'ok', score };
  if (score <= 6) return { label: 'Дунд анхаарах түвшин', tone: 'warn', score };
  return { label: 'Өндөр анхаарах түвшин', tone: 'danger', score };
}

function habitFindings(data) {
  const items = [];
  if (data.sittingHours >= 8 || data.workType === 'sedentary') items.push('Өдөрт удаан суух хэмнэл давамгай байна. Энэ нь зарцуулдаг энерги багасах, оройн хоол ихдэх, нуруу өвдөгт ачаалал нэмэгдэх шалтгаан болж болно.');
  if (data.lastMeal === 'late') items.push('Орой 21:00 цагаас хойш хооллох зуршил байна. Энэ үед хүнд хоол, гурил, амттан багасгах нь эхний том өөрчлөлт болно.');
  if (data.water === 'low') items.push('Усны хэрэглээ бага байна. Ус бага уух нь өлсөх мэдрэмжийг ихэсгэж, амттан идэх хүслийг нэмэгдүүлэх талтай.');
  if (data.sweet === 'high') items.push('Амттан, чихэрлэг зүйл өндөр хэрэглээтэй байна. Эхний 30 хоногт шууд хорихоос илүү давтамжийг бууруулах нь тогтвортой.');
  if (data.carb === 'high') items.push('Гурил, будаа, талх, боов хоол бүрт давамгай байна. Тавагны тэнцвэрийг өөрчлөх хэрэгтэй.');
  if (data.sleep === 'low') items.push('Нойр 6 цагаас бага байна. Нойр муудах үед хоолны дуршил, стрессийн идэлт нэмэгдэх хандлагатай.');
  if (data.stress === 'high') items.push('Стресс өндөр байна. Стрессийн үед шөнө орой идэх, амттан хайх, түргэн хоол сонгох дадал нэмэгддэг.');
  if (!items.length) items.push('Таны өгөгдлөөр хамгийн том алдаа маш тод харагдахгүй байна. Одоо гол нь порц, алхалт, нойр, усны тогтвортой дэглэм барих хэрэгтэй.');
  return items;
}

function signalAdvice(signals) {
  if (!signals.length || signals.includes('none')) return ['Илэрч буй зовиур сонгоогүй байна. Гэхдээ жингээ огцом бус, аажмаар бууруулах зарчмыг баримтална.'];
  const map = {
    back: 'Нуруу өвдөх зовиуртай бол үсрэлт, огцом бөхийлтөөс зайлсхийж, алхалт болон зөөлөн сунгалтаар эхэлнэ.',
    knee: 'Өвдөг өвдөх зовиуртай бол гүйх, үсрэх дасгал биш, алхалт, суугаа сунгалт, бага ачааллын дасгалаар эхэлнэ.',
    breath: 'Амьсгаадах зовиуртай бол ачааллыг огцом нэмэхгүй. Эхний долоо хоногт 5–10 минутын хөнгөн алхалтаас эхэлнэ.',
    sleep: 'Нойр муу бол оройн хоол, дэлгэц, кофеин, унтах цагийн тогтмол байдлыг хамгийн түрүүнд засна.',
    pressure: 'Даралт ихэсдэг бол жин бууруулах төлөвлөгөөг эхлэхээс өмнө эсвэл зэрэгцүүлэн эмчийн зөвлөгөө авах нь зүйтэй.',
    sugar: 'Сахарын асуудалтай бол хоолны өөрчлөлт болон нэмэлт бүтээгдэхүүн хэрэглэхээс өмнө эмчтэй зөвлөлдөх хэрэгтэй.',
    digestion: 'Хоол боловсруулах зовиуртай бол огцом хоол хасахгүй, хүнд тослог, оройн их хоол, хийжүүлсэн ундааг багасгана.'
  };
  return signals.filter(s => map[s]).map(s => map[s]);
}

function nutritionAdvice(data) {
  const list = [
    'Тавагны зарчим: тал хэсгийг ногоо, дөрөвний нэгийг уураг, дөрөвний нэгийг будаа/гурил/төмс зэрэг нүүрс ус болгоно.',
    'Өлсөж өөрийгөө зовоохгүй. Харин порцоо 10–20% багасгаж, оройн хүнд хоолыг хөнгөн болгоно.',
    'Өглөө эсвэл өдөр уурагтай хоол нэмэх: өндөг, мах, загас, тараг, аарц, буурцаг, самар зэргийг тохируулж хэрэглэнэ.'
  ];
  if (data.water === 'low') list.push('Усаа эхний 7 хоногт өдөрт 1–1.5 литр, дараа нь өөрийн биед тохируулан 1.5–2 литр хүргэхийг зорь.');
  if (data.sweet !== 'low') list.push('Амттанг шууд 0 болгохгүй. Эхний 7 хоногт өдөр бүрээс 7 хоногт 3 удаа, дараа нь 1–2 удаа болгож бууруул.');
  if (data.carb === 'high') list.push('Гурил, будаа, талхыг хоол бүрт биш өдөрт 1–2 удаа болгон багасгаж, мах/ногооны хэмжээг нэм.');
  if (data.lastMeal !== 'early') list.push('Оройн хоолоо унтахаас 3 цагийн өмнө дуусгахыг зорь. Хэрэв орой өлсвөл хүнд хоол биш тараг, өндөг, ногоотой хөнгөн сонголт хэрэглэ.');
  if (data.meals === '1-2') list.push('Өдөрт 1–2 удаа л хооллодог бол хэт өлсөөд орой их идэх магадлалтай. 3 жижиг/дунд хоолны хэмнэл рүү аажмаар ор.');
  if (data.meals === '4plus') list.push('Олон удаа иддэг бол зууш бүрийн илчлэгийг анхаар. Чихэр, боовны оронд уурагтай эсвэл эслэгтэй жижиг сонголт хий.');
  return list;
}

function planIntro(data) {
  if (data.planType === 'active') {
    return 'Энэ хувилбар нь алхалт, гэрийн хөнгөн дасгал, хооллолтын зохицуулалтыг хослуулна. Зорилго нь хэт ядраах биш, өдөр бүрийн хөдөлгөөнийг тогтвортой болгох.';
  }
  if (data.planType === 'lowmove') {
    return 'Энэ хувилбар нь дасгал хийх цаг бага, суугаа ажилтай хүмүүст зориулсан. Гол хүч нь порц, ус, нойр, оройн хоол, бичил хөдөлгөөн дээр төвлөрнө.';
  }
  return 'Энэ хувилбар нь хооллолт, ус, нойр, дадлаа өөрчлөх төлөвлөгөөн дээр нэмэлт дэмжлэгийг сонгосон хүмүүст зориулсан. Нэмэлт бүтээгдэхүүн нь үндсэн хоол, ус, нойр, хөдөлгөөнийг орлохгүй.';
}

function weeklyPlan(data) {
  if (data.planType === 'active') {
    return [
      ['1-р 7 хоног', 'Өдөр бүр 15–20 минут алхалт. Оройн хоолны порцыг 10% багасгана. Усны хэрэглээг тогтооно. 2 өдөр нь 10 минут сунгалт хийнэ.'],
      ['2-р 7 хоног', 'Алхалтыг 25–30 минут болгоно. 7 хоногт 3 өдөр гэрийн дасгал: суултгүй хувилбар, хананд тулж суух, мөр/гар/гэдэсний хөнгөн дасгал.'],
      ['3-р 7 хоног', 'Алхалт 30–40 минут, 7 хоногт 4 өдөр. Амттан, гурил, оройн хүнд хоолыг тогтвортой бууруулна.'],
      ['4-р 7 хоног', 'Алхалт 40 минут хүртэл. Дасгал 4 өдөр. Жингээс гадна бэлхүүс, нойр, амьсгаадалт, хувцасны сулралыг тэмдэглэнэ.']
    ];
  }
  if (data.planType === 'lowmove') {
    return [
      ['1-р 7 хоног', 'Өдөрт 3 удаа 5 минут босож алхах. Ус нэмэх. Оройн хоолыг хөнгөн болгох. Амттанг 30% бууруулах.'],
      ['2-р 7 хоног', 'Ажил дээр 60–90 минут тутам 2–3 минут босох. Лифтний оронд боломжтой үед шатаар 1–2 давхар. Порц 10–15% багасгах.'],
      ['3-р 7 хоног', 'Өдөр бүр нийт 15–20 минутын жижиг алхалт цуглуулах. Гурил/будааг хоол бүрт биш өдөрт 1–2 удаа болгох.'],
      ['4-р 7 хоног', 'Бичил хөдөлгөөнөө тогтмол болгох. Оройн хоол, ус, нойрны цагийг хадгалах. Дараагийн сарын зорилтоо шинэчлэх.']
    ];
  }
  return [
    ['1-р 7 хоног', 'Нэмэлт дэмжлэг сонгосон ч үндсэн суурь нь ус, порц, оройн хоол. Эхний 7 хоногт биеийн хариу урвалыг ажиглана.'],
    ['2-р 7 хоног', 'Хоолны дуршил, гэдэс дүүрэх, нойр, энергийн түвшинг тэмдэглэнэ. Хүнд зовиур илэрвэл хэрэглэхээ зогсоож мэргэжлийн хүнээс асууна.'],
    ['3-р 7 хоног', 'Дэмжлэг + хооллолтын хэмнэл + 15–25 минут хөнгөн алхалт. Амттан, гурил, хийжүүлсэн ундааг багасгана.'],
    ['4-р 7 хоног', 'Жин, бэлхүүс, нойр, хоолны дуршлын өөрчлөлтөө дүгнэнэ. Нэмэлт дэмжлэгийг дангаар биш дадалтай хамт үргэлжлүүлэх эсэхээ шийднэ.']
  ];
}

function dailyPlan(data) {
  const base = [
    ['1–3', 'Ус, хоолны цаг, оройн хоолоо тэмдэглэ. Жингээ өглөө өлөн дээрээ нэг удаа хэмж.'],
    ['4–7', 'Порцоо 10% багасга. Амттан/боов иддэг бол давтамжаа бууруул. Орой хэт хүнд хоол идэхгүй.'],
    ['8–10', 'Өдрийн хоолонд уураг нэм. Усны хэмжээг тогтвортой болго. Суугаа үед богино завсарлага ав.'],
    ['11–14', 'Гурил, будаа, талхыг хяна. Оройн хоолыг унтахаас 3 цагийн өмнө дуусгахыг зорь.'],
    ['15–17', 'Бэлхүүсээ хэмж. Хамгийн их жин нэмүүлдэг 1 зуршлаа сонгоод 50% бууруул.'],
    ['18–21', 'Хоолны тавагны тэнцвэрээ барь. Нойр 7 цагт ойртуулах оролдлого хий.'],
    ['22–24', 'Амттан, хийжүүлсэн ундаа, шөнийн хоолны давтамжаа дахин бууруул.'],
    ['25–27', 'Жин, бэлхүүс, хувцасны сулрал, амьсгаадалт, нойрны өөрчлөлтөө тэмдэглэ.'],
    ['28–30', '30 хоногийн үр дүнгээ дүгнэ. Дараагийн 30 хоногийн зорилтоо жижиг, бодит хэмжээгээр шинэчил.']
  ];
  if (data.planType === 'active') {
    return base.map((row, idx) => [row[0], row[1] + (idx % 2 === 0 ? ' Алхалт 20–40 минут.' : ' Гэрийн хөнгөн дасгал 10–20 минут.')]);
  }
  if (data.planType === 'lowmove') {
    return base.map(row => [row[0], row[1] + ' Дасгал хийхгүй өдөр ч 3–5 минутын босолт/алхалтыг 3 удаа хий.']);
  }
  return base.map(row => [row[0], row[1] + ' Нэмэлт дэмжлэг хэрэглэж байгаа бол ус, хоол, нойроо заавал зэрэг баримтал.']);
}

function createReport(data) {
  const bmi = calculateBMI(data.weight, data.height);
  const bmiRounded = round1(bmi);
  const bmiCat = getBmiCategory(bmi);
  const range = healthyWeightRange(data.height);
  const risk = getRiskLevel(data, bmi);
  const waistHeightRatio = data.waist ? round1((data.waist / data.height) * 100) : null;
  const kgToGoal = round1(data.weight - data.goalWeight);
  const date = new Date().toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });

  reportTitle.textContent = `${data.name} — Биеийн Мэлмий тайлан`;
  reportMeta.textContent = `${date} • ${genderText(data.gender)} • ${data.age} нас • ${planText(data.planType)}`;

  if (data.age < 18) {
    reportContent.innerHTML = `
      <div class="panel">
        <h3>18-аас доош насны анхааруулга</h3>
        <p>Энэ системийн BMI ангилал, жин бууруулах төлөвлөгөө нь насанд хүрэгчдэд зориулагдсан. 18-аас доош насанд өсөлт, биеийн хөгжил харгалзах шаардлагатай тул эцэг эх, эмч, хоол зүйчийн зөвлөгөөгөөр төлөвлөгөө гаргана уу.</p>
      </div>`;
    return;
  }

  const findings = habitFindings(data).map(x => `<li>${x}</li>`).join('');
  const signals = signalAdvice(data.signals).map(x => `<li>${x}</li>`).join('');
  const nutrition = nutritionAdvice(data).map(x => `<li>${x}</li>`).join('');
  const weeks = weeklyPlan(data).map(([w, text]) => `<div class="week"><strong>${w}</strong><span>${text}</span></div>`).join('');
  const days = dailyPlan(data).map(([d, text]) => `<tr><td><strong>${d} дахь өдөр</strong></td><td>${text}</td></tr>`).join('');

  const waistHtml = data.waist ? `
    <div class="kpi">
      <span>Бэлхүүс/өндөр</span>
      <strong>${waistHeightRatio}%</strong>
      <em class="badge ${waistHeightRatio >= 50 ? 'warn' : 'ok'}">${waistHeightRatio >= 50 ? 'Анхаарах дохио' : 'Хэвийн талдаа'}</em>
    </div>` : `
    <div class="kpi">
      <span>Бэлхүүс</span>
      <strong>—</strong>
      <em class="badge warn">Мэдээлэл оруулаагүй</em>
    </div>`;

  const supportWarning = data.planType === 'support' ? `
    <div class="footer-note">
      <strong>Нэмэлт бүтээгдэхүүнтэй төлөвлөгөөний санамж:</strong>
      Нэмэлт бүтээгдэхүүн нь хооллолт, ус, нойр, хөдөлгөөнийг орлохгүй. Даралт, сахар, ходоод гэдэс, элэг бөөрний асуудалтай эсвэл эм тогтмол хэрэглэдэг бол хэрэглэхээс өмнө эмчээс асуугаарай. “Дадал өөрчлөхгүйгээр шууд турна” гэсэн амлалтанд найдахгүй байх нь зөв.
    </div>` : '';

  reportContent.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi">
        <span>BMI</span>
        <strong>${bmiRounded}</strong>
        <em class="badge ${bmiCat.tone}">${bmiCat.label}</em>
      </div>
      <div class="kpi">
        <span>Одоогийн жин</span>
        <strong>${data.weight} кг</strong>
        <em class="badge warn">Зорилт: ${data.goalWeight} кг</em>
      </div>
      <div class="kpi">
        <span>Зорилт хүртэл</span>
        <strong>${kgToGoal > 0 ? kgToGoal + ' кг' : 'тогтворжуулах'}</strong>
        <em class="badge ${kgToGoal > 0 ? 'warn' : 'ok'}">30 хоногт аажмаар</em>
      </div>
      ${waistHtml}
    </div>

    <div class="report-grid">
      <div class="panel">
        <h3>Жингийн ангиллын тайлбар</h3>
        <p>Таны BMI: <strong>${bmiRounded}</strong>. Ангилал: <strong>${bmiCat.label}</strong>. ${bmiCat.note}</p>
        <p>Таны өндөрт насанд хүрэгчдийн хэвийн BMI хүрээгээр тооцсон жингийн ойролцоо хүрээ: <strong>${range.min}–${range.max} кг</strong>. Энэ нь заавал яг хүрэх ёстой тоо биш, зөвхөн баримжаа юм.</p>
      </div>
      <div class="panel">
        <h3>Анхаарах түвшин</h3>
        <p><strong>${risk.label}</strong>. Энэ нь өвчин оношилж байгаа хэрэг биш. Харин таны өгөгдөл дээр үндэслэн хооллолт, хөдөлгөөн, нойр, зовиурын талаас илүү анхаарах хэрэгтэй эсэхийг харуулж байна.</p>
        <p>Ажлын хэв маяг: <strong>${workText(data.workType)}</strong>. Өдөрт суудаг цаг: <strong>${data.sittingHours} цаг</strong>.</p>
      </div>
    </div>

    <div class="report-grid">
      <div class="panel">
        <h3>Жин нэмэхэд нөлөөлж буй гол дадал</h3>
        <ul>${findings}</ul>
      </div>
      <div class="panel">
        <h3>Зовиуртай холбоотой зөвлөмж</h3>
        <ul>${signals}</ul>
      </div>
    </div>

    <div class="panel">
      <h3>Хооллолтын хувийн зөвлөмж</h3>
      <ul>${nutrition}</ul>
    </div>

    <div class="panel">
      <h3>${planText(data.planType)}</h3>
      <p>${planIntro(data)}</p>
      <div class="timeline">${weeks}</div>
    </div>

    <div class="panel">
      <h3>30 хоногийн өдөрчилсөн төлөвлөгөө</h3>
      <table class="day-table">
        <thead><tr><th>Хугацаа</th><th>Хийх зүйл</th></tr></thead>
        <tbody>${days}</tbody>
      </table>
    </div>

    ${supportWarning}

    <div class="footer-note">
      <strong>Эцсийн санамж:</strong>
      Энэ тайлан нь эмчилгээ, онош биш. Даралт, сахар, зүрх судас, жирэмслэлт, архаг өвчин, хүчтэй зовиур байгаа бол мэргэжлийн эмчид үзүүлж, өөрт тохирох ачаалал болон хоолны өөрчлөлтийг баталгаажуулаарай.
    </div>
  `;
}

function buildSummary(data) {
  const bmi = round1(calculateBMI(data.weight, data.height));
  const bmiCat = getBmiCategory(bmi);
  return [
    `Биеийн Мэлмий хураангуй`,
    `Нэр/код: ${data.name}`,
    `Нас: ${data.age}`,
    `Хүйс: ${genderText(data.gender)}`,
    `Өндөр: ${data.height} см`,
    `Жин: ${data.weight} кг`,
    `Зорилтот жин: ${data.goalWeight} кг`,
    `BMI: ${bmi} (${bmiCat.label})`,
    `Сонгосон төлөвлөгөө: ${planText(data.planType)}`,
    `Суугаа цаг: ${data.sittingHours}`,
    `Ус: ${data.water}`,
    `Анхаарах дадал: ${habitFindings(data).join(' / ')}`
  ].join('\n');
}

function toast(message) {
  const existing = $('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

let lastData = null;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const data = getFormData(form);
  lastData = data;
  createReport(data);
  report.classList.remove('hidden');
  report.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('#printBtn').addEventListener('click', () => window.print());

$('#copyBtn').addEventListener('click', async () => {
  if (!lastData) return;
  try {
    await navigator.clipboard.writeText(buildSummary(lastData));
    toast('Хураангуй хуулагдлаа');
  } catch (error) {
    toast('Хуулах боломжгүй байна');
  }
});

$('#resetBtn').addEventListener('click', () => {
  form.reset();
  report.classList.add('hidden');
  lastData = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#demoBtn').addEventListener('click', () => {
  const values = {
    name: 'Хэрэглэгч 01', age: 38, gender: 'male', height: 170, weight: 95,
    goalWeight: 85, waist: 104, sittingHours: 8, workType: 'sedentary', meals: '3',
    lastMeal: 'late', water: 'low', sweet: 'high', carb: 'high', sleep: 'mid', stress: 'mid', planType: 'lowmove'
  };
  Object.entries(values).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;
    if (field instanceof RadioNodeList) {
      const match = Array.from(field).find(input => input.value === value);
      if (match) match.checked = true;
    } else {
      field.value = value;
    }
  });
  const checks = ['back', 'knee', 'sleep'];
  $$('input[name="signals"]').forEach(input => input.checked = checks.includes(input.value));
  toast('Жишээ мэдээлэл бөглөгдлөө');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
