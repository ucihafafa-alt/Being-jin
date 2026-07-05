import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAILS, COLLECTION_NAME } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const dashboard = $("dashboard");
const loginNotice = $("loginNotice");
const statsGrid = $("statsGrid");
const recordsBody = $("recordsBody");
const tableCount = $("tableCount");
const searchInput = $("searchInput");
const monthFilter = $("monthFilter");
const csvBtn = $("csvBtn");
const refreshBtn = $("refreshBtn");

let auth, db;
let allRecords = [];
let filteredRecords = [];

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  loginNotice.textContent = "Firebase тохиргоо ороогүй байна. firebase-config.js файлыг бөглөнө үү.";
  console.error(error);
}

loginBtn.addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (String(error?.code).includes("popup")) {
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } else {
      alert("Нэвтрэх үед алдаа гарлаа: " + (error.message || error));
    }
  }
});

logoutBtn.addEventListener("click", () => signOut(auth));
refreshBtn.addEventListener("click", loadData);
searchInput.addEventListener("input", applyFilters);
monthFilter.addEventListener("change", applyFilters);
csvBtn.addEventListener("click", downloadCsv);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setLoggedOut();
    return;
  }
  if (!ADMIN_EMAILS.includes(user.email)) {
    await signOut(auth);
    alert("Энэ Gmail хаягт админ эрх тохируулаагүй байна: " + user.email);
    return;
  }
  setLoggedIn(user);
  await loadData();
});

function setLoggedOut() {
  dashboard.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  loginBtn.classList.remove("hidden");
  loginNotice.classList.remove("hidden");
}

function setLoggedIn(user) {
  dashboard.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  loginBtn.classList.add("hidden");
  loginNotice.classList.add("hidden");
  logoutBtn.textContent = `${user.email} — Гарах`;
}

async function loadData() {
  recordsBody.innerHTML = `<tr><td colspan="13">Уншиж байна...</td></tr>`;
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  allRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  applyFilters();
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const month = monthFilter.value;
  filteredRecords = allRecords.filter((r) => {
    const date = getDate(r);
    const monthOk = !month || toMonth(date) === month;
    const hay = [
      r.registerNumber,
      r.fullName,
      r.residencyStatus,
      r.bag,
      r.gender,
      r.bmiCategory,
      r.riskLevel,
      ...(r.advices || [])
    ].join(" ").toLowerCase();
    return monthOk && (!term || hay.includes(term));
  });
  renderStats(filteredRecords);
  renderTable(filteredRecords);
}

function renderStats(records) {
  const today = new Date();
  const thisMonth = toMonth(today);
  const todayStr = toDay(today);

  const stats = [
    ["Нийт хамрагдсан", records.length],
    ["Өнөөдөр", records.filter((r) => toDay(getDate(r)) === todayStr).length],
    ["Энэ сар", records.filter((r) => toMonth(getDate(r)) === thisMonth).length],
    ["Хэвийн жинтэй", count(records, "bmiCategory", "Хэвийн жин")],
    ["Илүүдэл жинтэй", count(records, "bmiCategory", "Илүүдэл жин")],
    ["Таргалалт I зэрэг", count(records, "bmiCategory", "Таргалалт I зэрэг")],
    ["Таргалалт II зэрэг", count(records, "bmiCategory", "Таргалалт II зэрэг")],
    ["Таргалалт III зэрэг", count(records, "bmiCategory", "Таргалалт III зэрэг")],
    ["Зүүнбүрэн сумын иргэн", count(records, "residencyStatus", "Зүүнбүрэн сумын иргэн")],
    ["Түр оршин суугч", count(records, "residencyStatus", "Түр оршин суугч")],
    ["Бусад харьяалал", count(records, "residencyStatus", "Бусад сум/аймгийн иргэн")],
    ["Хөдөлгөөн нэмэх зөвлөмж", countAdvice(records, "хөдөлгөөн")],
    ["Давс, өөх тос багасгах", countAdvice(records, "Давс")],
    ["Даралт, сахар хянах", countAdvice(records, "даралт") + countAdvice(records, "сахар")],
    ["ЭМТ-д хандах", countAdvice(records, "ЭМТ")]
  ];

  const bagStats = ["1-р баг", "2-р баг", "3-р баг", "4-р баг", "5-р баг", "Бусад"].map((bag) => [bag, count(records, "bag", bag)]);
  const genderStats = ["Эрэгтэй", "Эмэгтэй"].map((g) => [g, count(records, "gender", g)]);
  const ageStats = ["0–17", "18–29", "30–44", "45–59", "60+"].map((a) => [a, count(records, "ageGroup", a)]);

  statsGrid.innerHTML = [
    ...stats.map(statCard),
    groupCard("Багаар", bagStats),
    groupCard("Хүйсээр", genderStats),
    groupCard("Насны бүлгээр", ageStats)
  ].join("");
}

function statCard([title, value]) {
  return `<article class="stat"><span>${escapeHtml(title)}</span><strong>${value}</strong></article>`;
}

function groupCard(title, items) {
  const max = Math.max(1, ...items.map(([, v]) => v));
  return `<article class="stat wide"><span>${escapeHtml(title)}</span>${items.map(([name, value]) => `
    <div class="bar-row"><em>${escapeHtml(name)}</em><b>${value}</b><i style="width:${Math.round((value / max) * 100)}%"></i></div>
  `).join("")}</article>`;
}

function renderTable(records) {
  tableCount.textContent = `${records.length} бүртгэл`;
  if (!records.length) {
    recordsBody.innerHTML = `<tr><td colspan="13">Бүртгэл олдсонгүй.</td></tr>`;
    return;
  }
  recordsBody.innerHTML = records.map((r) => `
    <tr>
      <td>${formatDate(getDate(r))}</td>
      <td>${escapeHtml(r.registerNumber || "")}</td>
      <td>${escapeHtml(r.fullName || "")}</td>
      <td>${escapeHtml(r.residencyStatus || "")}</td>
      <td>${escapeHtml(r.bag || "")}</td>
      <td>${escapeHtml(r.age || "")}</td>
      <td>${escapeHtml(r.gender || "")}</td>
      <td>${escapeHtml(r.height || "")}</td>
      <td>${escapeHtml(r.weight || "")}</td>
      <td><b>${escapeHtml(r.bmi || "")}</b></td>
      <td>${escapeHtml(r.bmiCategory || "")}</td>
      <td>${escapeHtml(r.riskScore ?? "")}</td>
      <td>${escapeHtml((r.advices || []).join("; "))}</td>
    </tr>
  `).join("");
}

function downloadCsv() {
  const headers = ["Огноо", "РД", "Овог нэр", "Харьяалал", "Баг", "Нас", "Насны бүлэг", "Хүйс", "Өндөр", "Жин", "BMI", "BMI ангилал", "Эрсдэлийн оноо", "Эрсдэлийн түвшин", "Халдварт өвчний төлөв", "Зөвлөмж"];
  const rows = filteredRecords.map((r) => [
    formatDate(getDate(r)),
    r.registerNumber,
    r.fullName,
    r.residencyStatus,
    r.bag,
    r.age,
    r.ageGroup,
    r.gender,
    r.height,
    r.weight,
    r.bmi,
    r.bmiCategory,
    r.riskScore,
    r.riskLevel,
    r.infectionRisk,
    (r.advices || []).join("; ")
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `zuunburen-emt-tailan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function count(records, key, value) {
  return records.filter((r) => r[key] === value).length;
}

function countAdvice(records, keyword) {
  const k = keyword.toLowerCase();
  return records.filter((r) => (r.advices || []).some((a) => String(a).toLowerCase().includes(k))).length;
}

function getDate(record) {
  if (record.createdAt?.toDate) return record.createdAt.toDate();
  if (record.localDate) return new Date(record.localDate);
  return new Date();
}

function toMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toDay(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
