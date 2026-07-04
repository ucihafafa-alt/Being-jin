const ADMIN_CONFIG = {
  reportBaseUrl: 'https://ucihafafa-alt.github.io/Being-jin/report.html'
};
const $ = (id) => document.getElementById(id);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function reportLink(id){return `${ADMIN_CONFIG.reportBaseUrl}?id=${encodeURIComponent(id)}&v=16`;}
function setStatus(t){$('adminStatus').textContent=t;}
function localRequests(){return JSON.parse(localStorage.getItem('ebej_admin_requests') || '[]');}
function isFirebaseReady(){return window.EBEJ_FIREBASE_READY && window.EBEJ_DB && window.EBEJ_AUTH;}

async function signInAdmin(){
  if(!isFirebaseReady()){ alert('Firebase тохиргоо хийгдээгүй байна. firebase-config.js-ээ бөглөнө үү.'); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try{
    await window.EBEJ_AUTH.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    // Гар утасны browser дээр popup хаагдах/буцах асуудал гардаг тул redirect ашиглав.
    await window.EBEJ_AUTH.signInWithRedirect(provider);
  }catch(e){
    console.error(e);
    alert('Google нэвтрэлт эхлүүлэхэд алдаа гарлаа. Firebase Authentication дээр Google provider асаасан эсэх, Authorized domains дээр ucihafafa-alt.github.io байгаа эсэхийг шалга.');
  }
}
async function signOutAdmin(){ if(window.EBEJ_AUTH) await window.EBEJ_AUTH.signOut(); }

async function loadRequests(){
  if(!isFirebaseReady()){
    setStatus('Firebase тохиргоо хийгдээгүй байна. firebase-config.js-ээ шалга.');
    render([]);
    return;
  }
  const user = window.EBEJ_AUTH.currentUser;
  setStatus(user ? `Firebase-ээс хүсэлтүүд татаж байна... Нэвтэрсэн: ${user.email}` : 'Firebase-ээс хүсэлтүүд татаж байна... /түр нээлттэй rules байвал loginгүй уншина/');
  try{
    const snap = await window.EBEJ_DB.collection('requests').orderBy('createdAt','desc').limit(200).get();
    const list = snap.docs.map(d => ({...d.data(), id: d.id}));
    setStatus(user ? `Нийт ${list.length} хүсэлт байна. Нэвтэрсэн: ${user.email}` : `Нийт ${list.length} хүсэлт байна. /Rules нээлттэй горим/`);
    render(list);
  }catch(e){
    console.error(e);
    setStatus('Хүсэлт татахад алдаа гарлаа. Firestore → Rules дээр түр allow read/update true тавьсан эсэхээ шалга.');
  }
}

function render(list){
  const box=$('requestList');
  if(!list.length){box.innerHTML='<div class="panel"><b>Одоогоор хүсэлт алга.</b></div>'; return;}
  box.innerHTML=list.map(req=>{
    const d=req.data||{};
    const id=req.id || '';
    const link=req.reportLink || reportLink(id);
    return `<article class="adminCard">
      <div class="adminHead"><b>${esc(d.name||req.name||'Нэргүй')}</b><span>${esc(req.status||'pending')}</span></div>
      <p><b>Утас:</b> ${esc(req.phone||'')}</p>
      <p><b>Багц:</b> ${esc(req.packageTitle||'')} — ${esc(req.packagePrice||'')}</p>
      <p><b>Банк:</b> ${esc((req.bank&&req.bank.bank)||'')}</p>
      <p><b>БЖИ:</b> ${esc(req.bmi||'')} — ${esc(req.category||'')}</p>
      <p><b>Жин:</b> ${esc(d.weight||'')} кг → ${esc(d.targetWeight||'')} кг, хасах ${esc(req.targetLoss||'')} кг</p>
      <div class="askActions">
        <button class="btn primary" onclick="approve('${esc(id)}')">Мөнгө орсон — Батлах</button>
        <button class="btn secondary" onclick="copyLink('${esc(link)}','${esc(d.name||'')}','${esc(req.phone||'')}')">Link хуулах</button>
        <button class="btn light" onclick="copySms('${esc(link)}','${esc(d.name||'')}','${esc(req.phone||'')}')">Дугаарт явуулах текст</button>
      </div>
      <textarea readonly class="copyArea">${esc(JSON.stringify(req,null,2))}</textarea>
    </article>`;
  }).join('');
}

window.approve = async function(id){
  if(!id){alert('ID алга'); return;}
  const link = reportLink(id);
  if(isFirebaseReady()){
    try{
      const user = window.EBEJ_AUTH.currentUser;
      await window.EBEJ_DB.collection('requests').doc(id).update({
        status:'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: user ? (user.email || '') : 'admin',
        reportLink: link
      });
      await navigator.clipboard.writeText(link).catch(()=>{});
      alert('Батлагдлаа. Тайлангийн link хууллаа. Одоо хэрэглэгчийн утасны дугаарт явуул.\n\n'+link);
      loadRequests();
    }catch(e){
      console.error(e);
      alert('Батлахад алдаа гарлаа. Firestore Rules дээр update зөвшөөрсөн эсэхээ шалга.');
    }
    return;
  }
  const list=localRequests().map(r=>r.id===id?{...r,status:'approved',reportLink:link}:r);
  localStorage.setItem('ebej_admin_requests', JSON.stringify(list));
  await navigator.clipboard.writeText(link).catch(()=>{});
  alert('Local батлагдлаа. Link хууллаа.');
  render(list);
};

window.copyLink = async function(link){await navigator.clipboard.writeText(link).catch(()=>{}); alert('Link хууллаа: '+link);};
window.copySms = async function(link,name,phone){
  const msg=`${name||'Сайн байна уу'}, таны Эрүүл Бие — Эрүүл Жин тайлан бэлэн боллоо. Тайлангаа эндээс нээнэ үү: ${link}`;
  await navigator.clipboard.writeText(msg).catch(()=>{});
  alert('Дугаарт явуулах текст хууллаа. Утас: '+(phone||''));
};
window.signInAdmin = signInAdmin;
window.signOutAdmin = signOutAdmin;

window.addEventListener('load',async ()=>{
  if(isFirebaseReady()){
    try{
      await window.EBEJ_AUTH.getRedirectResult();
    }catch(e){
      console.error('Redirect login error', e);
      setStatus('Google нэвтрэхэд алдаа гарлаа. Firebase Authentication → Google асаасан эсэх, Settings → Authorized domains дээр ucihafafa-alt.github.io нэмсэн эсэхээ шалга.');
    }
    window.EBEJ_AUTH.onAuthStateChanged(user=>{
      $('loginState').innerHTML = user ? `Нэвтэрсэн: <b>${esc(user.email)}</b> <button class="btn light smallBtn" onclick="signOutAdmin()">Гарах</button>` : '<button class="btn primary" onclick="signInAdmin()">Google админаар нэвтрэх</button>';
      loadRequests();
    });
  }else{
    $('loginState').innerHTML = '<b>Firebase config бөглөгдөөгүй байна.</b>';
    loadRequests();
  }
});
