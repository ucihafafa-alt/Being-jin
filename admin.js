import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, COLLECTION_NAME, ADMIN_PIN } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();

let db = null, rows = [], filteredRows = [];
try { db = getFirestore(initializeApp(firebaseConfig)); } catch(e) { console.error(e); }

if (sessionStorage.getItem("zuunburen_admin_ok") === "1") openDashboard();

$("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if ($("adminPin").value.trim() !== ADMIN_PIN) {
    $("loginMessage").textContent = "Админ нууц код буруу байна.";
    $("loginMessage").className = "message error";
    return;
  }
  sessionStorage.setItem("zuunburen_admin_ok", "1");
  await openDashboard();
});

$("refreshBtn").addEventListener("click", loadData);
$("csvBtn").addEventListener("click", downloadCsv);
$("searchInput").addEventListener("input", applyFilters);
$("bagFilter").addEventListener("change", applyFilters);
$("bmiFilter").addEventListener("change", applyFilters);

async function openDashboard() {
  $("loginCard").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  await loadData();
}

async function loadData() {
  if (!db) return renderEmpty("Firebase тохиргоо буруу байна.");
  $("tableBody").innerHTML = `<tr><td colspan="13">Уншиж байна...</td></tr>`;
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    applyFilters();
  } catch (e) {
    console.error(e);
    renderEmpty("Мэдээлэл уншихад алдаа гарлаа. Firestore Rules дээр read эрхээ шалгана уу.");
  }
}

function applyFilters() {
  const search = $("searchInput").value.trim().toLowerCase();
  const bag = $("bagFilter").value;
  const bmi = $("bmiFilter").value;
  filteredRows = rows.filter(r => {
    const text = [r.registerNumber, r.fullName, r.residencyStatus, r.bag, r.age, r.gender, r.bmiCategory, r.riskLevel, (r.advices || []).join(" ")].join(" ").toLowerCase();
    return (!search || text.includes(search)) && (!bag || r.bag === bag) && (!bmi || r.bmiCategory === bmi);
  });
  renderStats(filteredRows);
  renderTable(filteredRows);
}

function renderStats(data) {
  const today = new Date().toISOString().slice(0,10);
  const month = new Date().toISOString().slice(0,7);
  const count = fn => data.filter(fn).length;
  const advice = word => data.filter(r => (r.advices || []).join(" ").includes(word)).length;
  const stats = [
    ["Нийт хамрагдсан", data.length],
    ["Өнөөдөр", count(r => getDate(r).startsWith(today))],
    ["Энэ сар", count(r => getDate(r).startsWith(month))],
    ["Зүүнбүрэн сумын иргэн", count(r => r.residencyStatus === "Зүүнбүрэн сумын иргэн")],
    ["Жингийн дутагдал", count(r => r.bmiCategory === "Жингийн дутагдал")],
    ["Хэвийн жин", count(r => r.bmiCategory === "Хэвийн жин")],
    ["Илүүдэл жин", count(r => r.bmiCategory === "Илүүдэл жин")],
    ["Таргалалт I зэрэг", count(r => r.bmiCategory === "Таргалалт I зэрэг")],
    ["Таргалалт II зэрэг", count(r => r.bmiCategory === "Таргалалт II зэрэг")],
    ["Таргалалт III зэрэг", count(r => r.bmiCategory === "Таргалалт III зэрэг")],
    ["Хөдөлгөөн нэмэх зөвлөмж", advice("Хөдөлгөөний зөвлөмж")],
    ["Даралт/сахар хянах", advice("Даралт") + advice("Сахар")]
  ];
  $("statsGrid").innerHTML = stats.map(([a,b]) => `<article class="stat"><span>${esc(a)}</span><strong>${b}</strong></article>`).join("");
}

function renderTable(data) {
  $("rowCount").textContent = `${data.length} мөр`;
  if (!data.length) return $("tableBody").innerHTML = `<tr><td colspan="13">Мэдээлэл олдсонгүй.</td></tr>`;
  $("tableBody").innerHTML = data.map(r => `
    <tr>
      <td>${esc(formatDate(getDate(r)))}</td><td>${esc(r.registerNumber)}</td><td>${esc(r.fullName)}</td>
      <td>${esc(r.residencyStatus)}</td><td>${esc(r.bag)}</td><td>${esc(r.age)}</td><td>${esc(r.gender)}</td>
      <td>${esc(r.height)}</td><td>${esc(r.weight)}</td><td>${esc(r.bmi)}</td><td>${esc(r.bmiCategory)}</td>
      <td>${esc(r.riskLevel)} (${esc(r.riskScore ?? "")})</td>
      <td>${esc((r.advices || []).join(" | "))}</td>
    </tr>`).join("");
}

function renderEmpty(text) {
  $("statsGrid").innerHTML = "";
  $("tableBody").innerHTML = `<tr><td colspan="13">${esc(text)}</td></tr>`;
  $("rowCount").textContent = "0 мөр";
}

function downloadCsv() {
  const headers = ["Огноо","РД","Овог нэр","Харьяалал","Баг","Нас","Хүйс","Өндөр","Жин","BMI","Ангилал","Эрсдэлийн түвшин","Эрсдэлийн оноо","Зөвлөмж"];
  const lines = [headers.join(",")];
  for (const r of filteredRows) {
    lines.push([formatDate(getDate(r)), r.registerNumber, r.fullName, r.residencyStatus, r.bag, r.age, r.gender, r.height, r.weight, r.bmi, r.bmiCategory, r.riskLevel, r.riskScore, (r.advices || []).join(" | ")].map(csv).join(","));
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `zuunburen-emt-tailan-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function getDate(r) {
  if (r.localDate) return String(r.localDate);
  if (r.createdAt?.toDate) return r.createdAt.toDate().toISOString();
  return "";
}
function formatDate(v) { try { const d = new Date(v); return Number.isNaN(d.getTime()) ? v : d.toLocaleString("mn-MN"); } catch { return v || ""; } }
function csv(v) { return `"${String(v ?? "").replaceAll('"','""')}"`; }
function esc(v) { return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
