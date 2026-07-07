import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, COLLECTION_NAME } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const form = $("healthForm");
const msg = $("formMessage");
const resultCard = $("resultCard");
const resultContent = $("resultContent");
const submitBtn = $("submitBtn");

let db = null;
let firebaseReady = false;
let lastPayload = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseReady = !firebaseConfig.apiKey.includes("PASTE_");
} catch (error) {
  console.error(error);
}

$("year").textContent = new Date().getFullYear();

// Хуучин GitHub cache/service-worker-ээс болж засвар харагдахгүй байхыг багасгана.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
    .catch(() => {});
}
if ("caches" in window) {
  caches.keys()
    .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    .catch(() => {});
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  try {
    const data = readForm();
    const result = buildResult(data);
    showResult(data, result);

    const payload = {
      createdAt: serverTimestamp(),
      localDate: new Date().toISOString(),
      registerNumber: data.registerNumber,
      fullName: data.fullName,
      age: data.age,
      ageGroup: data.ageGroup,
      gender: data.gender,
      residencyStatus: data.residencyStatus,
      bag: data.bag,
      height: data.height,
      weight: data.weight,
      bmi: result.bmi,
      bmiCategory: result.bmiCategory,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      infectionRisk: result.infectionRisk,
      lifestyleRiskCount: result.lifestyleRiskCount,
      highRisk: result.highRisk,
      needsFollowUp: result.needsFollowUp,
      answers: data.answers,
      keyFactors: result.keyFactors,
      nextSteps: result.nextSteps,
      advices: result.advices,
      adviceSummary: result.adviceSummary,
      healthConclusion: result.healthConclusion,
      purpose: "Зүүнбүрэн сумын ЭМТ урьдчилан сэргийлэх үзлэг, зөвлөгөө, нэгтгэл тайлан"
    };
    lastPayload = payload;

    if (!firebaseReady) {
      setMessage("Firebase тохиргоо ороогүй байна. Үр дүнг харууллаа, гэхдээ database-д хадгалагдсангүй.", "warn");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Хадгалж байна...";

    const docId = await sha256(data.registerNumber);
    await setDoc(doc(db, COLLECTION_NAME, docId), payload);
    setMessage("Таны мэдээлэл амжилттай бүртгэгдлээ. Энэхүү зөвлөмжийг хадгалж, шаардлагатай үед Зүүнбүрэн сумын ЭМТ-д хандана уу.", "ok");
  } catch (error) {
    console.error(error);
    if (String(error?.code || error?.message).includes("permission-denied")) {
      setMessage("Энэ регистрийн дугаараар өмнө бүртгэл хийгдсэн байна, эсвэл хадгалах эрхийн тохиргоо буруу байна.", "error");
    } else {
      setMessage(error.message || "Алдаа гарлаа. Мэдээллээ шалгаад дахин оролдоно уу.", "error");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "BMI тооцоолж зөвлөмж авах";
  }
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    resultCard.classList.add("hidden");
    clearMessage();
  }, 0);
});

$("printBtn").addEventListener("click", () => {
  document.body.classList.add("print-report");
  window.print();
  setTimeout(() => document.body.classList.remove("print-report"), 500);
});

$("newBtn").addEventListener("click", () => {
  form.reset();
  resultCard.classList.add("hidden");
  clearMessage();
  window.scrollTo({ top: $("formCard").offsetTop - 20, behavior: "smooth" });
});

function readForm() {
  const fd = new FormData(form);
  const registerNumber = normalizeRegister(String(fd.get("registerNumber") || ""));
  const fullName = String(fd.get("fullName") || "").trim();
  const age = Number(fd.get("age"));
  const gender = String(fd.get("gender") || "").trim();
  const residencyStatus = String(fd.get("residencyStatus") || "").trim();
  const bag = String(fd.get("bag") || "").trim();
  const height = Number(fd.get("height"));
  const weight = Number(fd.get("weight"));

  if (!/^[А-ЯӨҮЁA-Z]{2}\d{8}$/u.test(registerNumber)) {
    throw new Error("Регистрийн дугаарыг 2 үсэг + 8 тоо хэлбэрээр зөв бичнэ үү. Жишээ: АБ12345678");
  }
  if (!fullName || fullName.length < 3) throw new Error("Овог, нэрээ бүрэн бичнэ үү.");
  if (!Number.isFinite(age) || age < 1 || age > 120) throw new Error("Насаа зөв оруулна уу.");
  if (!gender) throw new Error("Хүйсээ сонгоно уу.");
  if (!residencyStatus) throw new Error("Харьяаллаа сонгоно уу.");
  if (!bag) throw new Error("Багаа сонгоно уу.");
  if (!Number.isFinite(height) || height < 80 || height > 230) throw new Error("Өндрөө см-ээр зөв оруулна уу.");
  if (!Number.isFinite(weight) || weight < 20 || weight > 250) throw new Error("Жингээ кг-аар зөв оруулна уу.");

  const requiredRadios = ["activity", "fruitVeg", "diet", "sugaryDrink", "smoking", "alcohol", "bloodPressure", "glucoseRisk", "stressSleep", "familyHistory", "screening", "infectionSymptoms"];
  const answers = {};
  for (const key of requiredRadios) {
    const value = String(fd.get(key) || "");
    if (!value) throw new Error("Эрсдэлийн асуумжийн бүх асуултад хариулна уу.");
    answers[key] = value;
  }

  return {
    registerNumber,
    fullName,
    age,
    ageGroup: getAgeGroup(age),
    gender,
    residencyStatus,
    bag,
    height,
    weight,
    answers
  };
}

function buildResult(data) {
  const heightMeter = data.height / 100;
  const bmi = round1(data.weight / (heightMeter * heightMeter));
  const bmiCategory = getBmiCategory(bmi);
  const advices = [];
  const nextSteps = [];
  const keyFactors = [];
  let riskScore = 0;
  let lifestyleRiskCount = 0;

  if (data.answers.activity === "no") {
    riskScore += 1;
    lifestyleRiskCount += 1;
    keyFactors.push("хөдөлгөөн дутмаг");
    advices.push("Хөдөлгөөний зөвлөмж: Өдөр бүр дор хаяж 30 минут идэвхтэй алхах, долоо хоногт 5 өдөр тогтмол хөдөлгөөн хийхийг зөвлөж байна.");
    nextSteps.push("7 хоногт 5 удаа, өдөр бүр 30 минут алхах зорилт тавих.");
  }
  if (data.answers.fruitVeg === "no") {
    riskScore += 1;
    lifestyleRiskCount += 1;
    keyFactors.push("жимс, хүнсний ногооны хэрэглээ бага");
    advices.push("Хооллолтын зөвлөмж: Өдөр бүр жимс, хүнсний ногооны хэрэглээг нэмэгдүүлж, шим тэжээлийн тэнцвэртэй хооллолтыг хэвшүүлээрэй.");
    nextSteps.push("Өдөр бүр хоолондоо хүнсний ногоо нэмэх.");
  }
  if (data.answers.diet === "yes") {
    riskScore += 1;
    lifestyleRiskCount += 1;
    keyFactors.push("давс, тос, чихрийн хэрэглээ өндөр");
    advices.push("Давс, тос, чихрийн хэрэглээ: Давс, өөх тос, шарсан болон чихэрлэг хүнсний хэрэглээг багасгаж, буцалгаж болгосон энгийн хоол түлхүү хэрэглэнэ үү.");
    nextSteps.push("Давс, тос, шарсан болон чихэрлэг хүнсний хэрэглээг шат дараатай багасгах.");
  }
  if (data.answers.sugaryDrink === "yes") {
    riskScore += 1;
    lifestyleRiskCount += 1;
    keyFactors.push("чихэртэй ундааны хэрэглээ");
    advices.push("Ундааны зөвлөмж: Чихэртэй, хийжүүлсэн ундааны оронд ус, чихэргүй цай, шөл, цэвэр шингэн хэрэглэж хэвшээрэй.");
    nextSteps.push("Чихэртэй ундааг ус, чихэргүй цайгаар солих.");
  }
  if (data.answers.smoking === "yes") {
    riskScore += 2;
    lifestyleRiskCount += 1;
    keyFactors.push("тамхины хэрэглээ");
    advices.push("Тамхины эрсдэл: Тамхинаас татгалзах нь зүрх судас, уушги, хавдрын эрсдэлийг бууруулах хамгийн чухал алхам юм.");
    nextSteps.push("Тамхинаас гарах талаар ЭМТ-ийн ажилтнаас зөвлөгөө авах.");
  }
  if (data.answers.alcohol === "yes") {
    riskScore += 1;
    lifestyleRiskCount += 1;
    keyFactors.push("архины хэрэглээ");
    advices.push("Архины зөвлөмж: Архи, согтууруулах ундааны хэрэглээг бууруулах, боломжтой бол бүрэн татгалзахыг зөвлөж байна.");
    nextSteps.push("Архи, согтууруулах ундааны хэрэглээг багасгах төлөвлөгөө гаргах.");
  }
  if (data.answers.bloodPressure === "yes") {
    riskScore += 2;
    keyFactors.push("даралт ихсэх зовиур");
    advices.push("Даралтын эрсдэл: Даралтаа тогтмол хэмжиж, толгой өвдөх, зүрх дэлсэх, ядрах зовиур давтагдвал ЭМТ-д үзүүлж зөвлөгөө аваарай.");
    nextSteps.push("14 хоногийн дотор даралтаа хэмжүүлж, шаардлагатай бол эмчид үзүүлэх.");
  }
  if (data.answers.glucoseRisk === "yes") {
    riskScore += 2;
    keyFactors.push("сахарын эрсдэлийн шинж");
    advices.push("Сахарын эрсдэл: Цусны сахарын шинжилгээ өгч, их цангах, ойр ойрхон шээх зэрэг шинж илэрвэл яаралтай ЭМТ-д хандан үнэлгээ хийлгээрэй.");
    nextSteps.push("Цусны сахарын үзүүлэлтээ шалгуулах.");
  }
  if (data.answers.stressSleep === "yes") {
    riskScore += 1;
    lifestyleRiskCount += 1;
    keyFactors.push("нойр, стрессийн асуудал");
    advices.push("Нойр ба стресс: Өдөрт 7-8 цаг унтаж амрах, стрессээ зохицуулах, ажлын ачааллаа тэнцвэржүүлэх нь дархлаа болон бодисын солилцоонд тустай.");
    nextSteps.push("Унтах цагийн тогтмол дэглэм баримтлах.");
  }
  if (data.answers.familyHistory === "yes") {
    riskScore += 1;
    keyFactors.push("гэр бүлийн өвчний түүх");
    advices.push("Удамшлын эрсдэл: Гэр бүлийн өвчний түүх байгаа тул даралт, цусны сахар, холестерин, жингээ тогтмол хянах хэрэгтэй.");
    nextSteps.push("Даралт, сахар, өөх тосны үзүүлэлтээ тогтмол хянах.");
  }
  if (data.answers.screening === "no") {
    riskScore += 1;
    keyFactors.push("урьдчилан сэргийлэх үзлэгт хамрагдаагүй");
    advices.push("Урьдчилан сэргийлэх үзлэг: Сүүлийн 1 жилд үзлэгт хамрагдаагүй бол Зүүнбүрэн сумын Эрүүл мэндийн төвд үзлэгт хамрагдахыг зөвлөж байна.");
    nextSteps.push("ЭМТ-д урьдчилан сэргийлэх үзлэгийн цаг авч хамрагдах.");
  }

  if (bmi < 18.5) {
    keyFactors.push("жингийн дутагдал");
    advices.push("BMI үнэлгээ: Жингийн дутагдалтай ангилалд орж байна. Тэжээллэг хооллолт, биеийн ерөнхий байдлын үнэлгээ хийлгэх талаар ЭМТ-д зөвлөгөө аваарай.");
    nextSteps.push("Хооллолт, шим тэжээлийн талаар ЭМТ-д зөвлөгөө авах.");
  } else if (bmi >= 25 && bmi < 30) {
    riskScore += 1;
    keyFactors.push("илүүдэл жин");
    advices.push("BMI үнэлгээ: Илүүдэл жингийн ангилалд орж байна. Хоолны хэмжээг тохируулах, давс тос багасгах, алхалтыг нэмэгдүүлэх нь үр дүнтэй.");
    nextSteps.push("30 хоногийн хугацаанд жингээ бууруулах жижиг зорилт тавих.");
  } else if (bmi >= 30 && bmi < 35) {
    riskScore += 2;
    keyFactors.push("таргалалт I зэрэг");
    advices.push("BMI үнэлгээ: Таргалалт I зэрэгт орж байна. Жинг бууруулах зорилтот төлөвлөгөө гаргаж, даралт болон сахарын эрсдлээ хянах шаардлагатай.");
    nextSteps.push("ЭМТ-д хандаж жин, даралт, сахарын эрсдэлийн зөвлөгөө авах.");
  } else if (bmi >= 35 && bmi < 40) {
    riskScore += 3;
    keyFactors.push("таргалалт II зэрэг");
    advices.push("BMI үнэлгээ: Таргалалт II зэрэгт орж байна. ЭМТ-д заавал хандаж дэлгэрэнгүй зөвлөгөө, үзлэг шинжилгээ авах шаардлагатай.");
    nextSteps.push("Ойрын хугацаанд ЭМТ-д үзүүлж, хяналтын төлөвлөгөө гаргуулах.");
  } else if (bmi >= 40) {
    riskScore += 4;
    keyFactors.push("таргалалт III зэрэг");
    advices.push("BMI үнэлгээ: Таргалалт III зэрэгт орж байна. ЭМТ-д ойрын хугацаанд хандаж эмчийн хяналттайгаар үзлэг, зөвлөгөө авахыг зөвлөж байна.");
    nextSteps.push("ЭМТ-д яаралтай хандаж эмчийн хяналттай зөвлөгөө авах.");
  } else {
    advices.push("BMI үнэлгээ: Таны биеийн жингийн индекс хэвийн ангилалд байна. Одоогийн зөв дадлаа тогтвортой хадгалахыг зөвлөж байна.");
    nextSteps.push("Одоогийн зөв дадлаа хадгалж, жил бүр урьдчилан сэргийлэх үзлэгт хамрагдах.");
  }

  if (data.age >= 45) {
    riskScore += 1;
    keyFactors.push("45-аас дээш насны хяналт");
    advices.push("Насны зөвлөмж: 45-аас дээш насанд даралт, сахар, зүрх судасны эрсдэлийн үзүүлэлтээ тогтмол хянах нь зүйтэй.");
  }

  let infectionRisk = "Ерөнхий урьдчилан сэргийлэлт";
  if (data.answers.infectionSymptoms === "yes") {
    riskScore += 1;
    infectionRisk = "Шинж тэмдэг илэрсэн";
    keyFactors.push("халдварт өвчний шинж тэмдэг");
    advices.push("Халдварт өвчний зөвлөмж: Халуурах, ханиалгах, хоолой өвдөх шинж илэрсэн бол амны хаалт хэрэглэж, бусадтай ойр хавьтлаас зайлсхийж, ЭМТ-д хандаарай.");
    nextSteps.push("Амны хаалт хэрэглэж, бусдад халдвар тараахаас сэргийлэн ЭМТ-д хандах.");
  } else {
    advices.push("Халдварт өвчнөөс сэргийлэх зөвлөмж: Гараа тогтмол савандаж угаах, агаар сэлгэлт сайтай орчинд байх, шаардлагатай үед амны хаалт хэрэглэхийг зөвлөж байна.");
  }

  const riskLevel = getRiskLevel(riskScore);
  const highRisk = riskLevel === "Өндөр" || bmi >= 35 || data.answers.bloodPressure === "yes" || data.answers.glucoseRisk === "yes";
  const needsFollowUp = highRisk || data.answers.infectionSymptoms === "yes";
  const adviceSummary = buildAdviceSummary(bmiCategory, riskLevel, lifestyleRiskCount, infectionRisk);
  const healthConclusion = buildHealthConclusion(bmiCategory, riskLevel, unique(keyFactors));

  return {
    bmi,
    bmiCategory,
    riskScore,
    riskLevel,
    infectionRisk,
    lifestyleRiskCount,
    keyFactors: unique(keyFactors),
    adviceSummary,
    healthConclusion,
    nextSteps: unique(nextSteps).slice(0, 6),
    highRisk,
    needsFollowUp,
    advices: unique(advices)
  };
}

function buildAdviceSummary(bmiCategory, riskLevel, lifestyleRiskCount, infectionRisk) {
  return `Таны BMI ангилал: ${bmiCategory}. Нийт эрсдэлийн түвшин: ${riskLevel}. Амьдралын хэв маягтай холбоотой ${lifestyleRiskCount} эрсдэлт хүчин зүйл илэрлээ. Халдварт өвчний төлөв: ${infectionRisk}. Дараах зөвлөмжүүдийг хэрэгжүүлснээр эрсдэлийг бууруулах боломжтой.`;
}

function buildHealthConclusion(bmiCategory, riskLevel, keyFactors) {
  const factors = keyFactors.length ? keyFactors.join(", ") : "онцгой эрсдэлт хүчин зүйл илрээгүй";
  return `Ерөнхий үнэлгээгээр таны BMI ангилал "${bmiCategory}", эрсдэлийн түвшин "${riskLevel}" байна. Анхаарах гол хүчин зүйлс: ${factors}. Энэхүү дүгнэлт нь урьдчилан сэргийлэх ерөнхий үнэлгээ бөгөөд зовиур илэрвэл ЭМТ-д хандана уу.`;
}

function showResult(data, result) {
  const adviceHtml = result.advices.map((a) => `<li>${escapeHtml(a)}</li>`).join("");
  const factorHtml = result.keyFactors.length
    ? result.keyFactors.map((f) => `<span class="chip">${escapeHtml(f)}</span>`).join("")
    : `<span class="chip okchip">Онцгой эрсдэл илрээгүй</span>`;
  const nextHtml = result.nextSteps.map((s, i) => `<li><b>${i + 1}.</b> ${escapeHtml(s)}</li>`).join("");

  resultContent.innerHTML = `
    <div class="official-report-title">
      <h3>Зүүнбүрэн сумын Эрүүл мэндийн төв</h3>
      <p>Иргэний эрүүл мэндийн урьдчилан сэргийлэх зөвлөмжийн хуудас</p>
    </div>

    <div class="success-box">
      <b>Таны мэдээлэл амжилттай бүртгэгдлээ.</b>
      <span>Энэхүү зөвлөмжийг хадгалж, шаардлагатай үед Зүүнбүрэн сумын ЭМТ-д хандана уу.</span>
    </div>

    <div class="result-grid">
      <div class="metric"><span>BMI</span><strong>${result.bmi}</strong></div>
      <div class="metric"><span>Ангилал</span><strong>${escapeHtml(result.bmiCategory)}</strong></div>
      <div class="metric"><span>Эрсдэлийн оноо</span><strong>${result.riskScore}</strong></div>
      <div class="metric"><span>Эрсдэлийн түвшин</span><strong>${escapeHtml(result.riskLevel)}</strong></div>
    </div>

    <div class="summary-box">
      <p><b>${escapeHtml(data.fullName)}</b> — ${data.age} нас, ${escapeHtml(data.gender)}, ${escapeHtml(data.bag)}.</p>
      <p><b>Эрүүл мэндийн дүгнэлт:</b> ${escapeHtml(result.healthConclusion)}</p>
      <p><b>Халдварт өвчний эрсдэлийн төлөв:</b> ${escapeHtml(result.infectionRisk)}</p>
      <div class="chips">${factorHtml}</div>
    </div>

    <div class="detail-panels">
      <div class="detail-panel">
        <h3>Дараагийн алхам</h3>
        <ol class="next-list">${nextHtml}</ol>
      </div>
      <div class="detail-panel">
        <h3>Хэрэгжүүлэх дэлгэрэнгүй зөвлөмж</h3>
        <ul class="advice-list">${adviceHtml}</ul>
      </div>
    </div>

    <p class="small-note">Энэхүү зөвлөмж нь онош, эмчилгээний заалт биш. Зовиур илэрвэл Зүүнбүрэн сумын Эрүүл мэндийн төвд хандана уу.</p>
  `;
  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Жингийн дутагдал";
  if (bmi < 25) return "Хэвийн жин";
  if (bmi < 30) return "Илүүдэл жин";
  if (bmi < 35) return "Таргалалт I зэрэг";
  if (bmi < 40) return "Таргалалт II зэрэг";
  return "Таргалалт III зэрэг";
}

function getRiskLevel(score) {
  if (score <= 3) return "Бага";
  if (score <= 7) return "Дунд";
  return "Өндөр";
}

function getAgeGroup(age) {
  if (age < 18) return "0–17";
  if (age < 30) return "18–29";
  if (age < 45) return "30–44";
  if (age < 60) return "45–59";
  return "60+";
}

function normalizeRegister(value) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function setMessage(text, type = "ok") {
  msg.textContent = text;
  msg.className = `message ${type}`;
}

function clearMessage() {
  msg.textContent = "";
  msg.className = "message";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
