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

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseReady = !firebaseConfig.apiKey.includes("PASTE_");
} catch (error) {
  console.error(error);
}

$("year").textContent = new Date().getFullYear();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  try {
    const data = readForm();
    const result = buildResult(data);
    showResult(data, result);

    if (!firebaseReady) {
      setMessage("Firebase тохиргоо ороогүй байна. Үр дүнг харууллаа, гэхдээ database-д хадгалагдсангүй.", "warn");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Хадгалж байна...";

    const docId = await sha256(data.registerNumber);
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
      answers: data.answers,
      advices: result.advices,
      purpose: "Зүүнбүрэн сумын ЭМТ урьдчилан сэргийлэх үзлэг, зөвлөгөө, нэгтгэл тайлан"
    };

    await setDoc(doc(db, COLLECTION_NAME, docId), payload);
    setMessage("Бүртгэл амжилттай хадгалагдлаа.", "ok");
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

$("printBtn").addEventListener("click", () => window.print());
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

  const requiredRadios = ["activity", "smoking", "alcohol", "diet", "bloodPressure", "familyHistory", "infectionSymptoms"];
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
  let riskScore = 0;

  if (data.answers.activity === "no") {
    riskScore += 1;
    advices.push("Долоо хоногт 5 өдөр, өдөр бүр 30 минут орчим алхах болон өөрт тохирсон хөдөлгөөн хийхийг зөвлөж байна.");
  }
  if (data.answers.diet === "yes") {
    riskScore += 1;
    advices.push("Давс, өөх тос, чихэрлэг хүнсний хэрэглээг багасгаж, ногоо, ус, энгийн хооллолтыг нэмэгдүүлэхийг зөвлөж байна.");
  }
  if (data.answers.smoking === "yes") {
    riskScore += 1;
    advices.push("Тамхинаас татгалзах нь зүрх судас, уушги болон ерөнхий эрүүл мэндийн эрсдэлийг бууруулахад чухал.");
  }
  if (data.answers.alcohol === "yes") {
    riskScore += 1;
    advices.push("Архи, согтууруулах ундааны хэрэглээг багасгах, боломжтой бол татгалзахыг зөвлөж байна.");
  }
  if (data.answers.bloodPressure === "yes") {
    riskScore += 2;
    advices.push("Даралтаа тогтмол хэмжиж, Зүүнбүрэн сумын Эрүүл мэндийн төвд хандаж зөвлөгөө авна уу.");
  }
  if (data.answers.familyHistory === "yes") {
    riskScore += 1;
    advices.push("Гэр бүлийн өвчний түүх байгаа тул даралт, цусны сахар, жингээ тогтмол хянахыг зөвлөж байна.");
  }

  if (bmi >= 25 && bmi < 30) {
    riskScore += 1;
    advices.push("Илүүдэл жинг бууруулахын тулд хоолны хэмжээ, давс, тос, амттаны хэрэглээг багасгаж хөдөлгөөнөө нэмэгдүүлээрэй.");
  } else if (bmi >= 30) {
    riskScore += 2;
    advices.push("Таргалалтын ангилалд орж байгаа тул ЭМТ-д хандаж жин бууруулах, даралт болон сахарын эрсдэлийн талаар зөвлөгөө аваарай.");
  } else if (bmi < 18.5) {
    advices.push("Жингийн дутагдалтай ангилалд орж байгаа тул хооллолт, шим тэжээлийн талаар ЭМТ-д зөвлөгөө аваарай.");
  }

  if (data.age >= 45) {
    riskScore += 1;
    advices.push("45-аас дээш насанд даралт, сахар, өөх тосны үзүүлэлтээ тогтмол хянах нь зүйтэй.");
  }

  let infectionRisk = "Ерөнхий урьдчилан сэргийлэлт";
  if (data.answers.infectionSymptoms === "yes") {
    riskScore += 1;
    infectionRisk = "Шинж тэмдэг илэрсэн";
    advices.push("Ханиалгах, халуурах, хоолой өвдөх шинж илэрсэн бол бусдад халдвар тараахаас сэргийлж амны хаалт хэрэглэн ЭМТ-д хандана уу.");
  }

  advices.push("Гараа тогтмол савандаж угаах, олон хүнтэй газарт амны хаалт хэрэглэх, дархлаажуулалт болон урьдчилан сэргийлэх үзлэгт хамрагдахыг зөвлөж байна.");

  return {
    bmi,
    bmiCategory,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    infectionRisk,
    advices: unique(advices)
  };
}

function showResult(data, result) {
  const adviceHtml = result.advices.map((a) => `<li>${escapeHtml(a)}</li>`).join("");
  resultContent.innerHTML = `
    <div class="result-grid">
      <div class="metric"><span>BMI</span><strong>${result.bmi}</strong></div>
      <div class="metric"><span>Ангилал</span><strong>${escapeHtml(result.bmiCategory)}</strong></div>
      <div class="metric"><span>Эрсдэлийн оноо</span><strong>${result.riskScore}</strong></div>
      <div class="metric"><span>Эрсдэлийн түвшин</span><strong>${escapeHtml(result.riskLevel)}</strong></div>
    </div>
    <div class="summary-box">
      <p><b>${escapeHtml(data.fullName)}</b> — ${data.age} нас, ${escapeHtml(data.gender)}, ${escapeHtml(data.bag)}.</p>
      <p>Халдварт өвчний эрсдэлийн төлөв: <b>${escapeHtml(result.infectionRisk)}</b></p>
    </div>
    <h3>Танд өгөх ерөнхий зөвлөмж</h3>
    <ul class="advice-list">${adviceHtml}</ul>
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
  if (score <= 2) return "Бага";
  if (score <= 5) return "Дунд";
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
  return [...new Set(arr)];
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
  return String(value)
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
