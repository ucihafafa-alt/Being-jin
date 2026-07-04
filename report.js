
// v19: old PWA cache killer
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(()=>{});
  if (window.caches) caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(()=>{});
}

const $ = (id)=>document.getElementById(id);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function qs(k){return new URLSearchParams(location.search).get(k)||'';}
function localFind(id){return (JSON.parse(localStorage.getItem('ebej_admin_requests')||'[]')).find(r=>r.id===id);}
function planText(req){
  const months=Number(req.packageMonths||1); const route=req.routeTitle||'';
  const weeks=months*4;
  return `Энэ төлөвлөгөө нь ${months} сарын хугацаанд өдөр тутмын энгийн хооллолт, ус уух дадал, нойрны цаг, хөдөлгөөний ачааллыг аажмаар тэнцвэржүүлэх зорилготой. ${route} хэлбэрээр хэрэгжинэ. Үнэтэй, олддоггүй орц шаардлагагүй. Гол нь гэрт байдаг энгийн хоол, зөв хэмжээ, зөв цаг, тууштай давталт юм. Эхний 7 хоногт хоолны цаг, ус, оройн хоолыг тогтворжуулна. Дараагийн 7 хоногуудад чихэрлэг, гурил будаа, оройн хүнд хоол, удаан суух хэв маягийг үе шаттайгаар багасгана. Нийт ${weeks} долоо хоногийн турш биеэ эрүүлжүүлэх дадал суулгаж, жингээ тогтвортой бууруулах чиглэлээр явна.`;
}
function render(req){
  const d=req.data||{};
  const status=req.status||'pending';
  if(status!=='approved'){
    $('reportView').innerHTML='<div class="panel"><h2>Тайлан хараахан баталгаажаагүй байна.</h2><p>Админ төлбөрийг баталгаажуулсны дараа энэ link ажиллана.</p></div>'; return;
  }
  $('reportView').innerHTML=`
    <div class="resultHeader">
      <div class="scoreCard">
        <span class="tag">PDF тайлан</span>
        <h2>${esc(d.name||'Таны')} — Эрүүл Бие, Эрүүл Жин</h2>
        <div class="bmiNumber">${esc(req.bmi||'')}</div>
        <p>${esc(req.category||'')}</p>
        <p>Сонгосон багц: <b>${esc(req.packageTitle||'')}</b></p>
      </div>
      <div class="metricGrid">
        <div class="metric"><span>Одоогийн жин</span><b>${esc(d.weight||'')} кг</b></div>
        <div class="metric"><span>Зорилтот жин</span><b>${esc(d.targetWeight||'')} кг</b></div>
        <div class="metric"><span>Хасах зорилт</span><b>${esc(req.targetLoss||'')} кг</b></div>
        <div class="metric"><span>Хэлбэр</span><b>${esc(req.routeTitle||'')}</b></div>
      </div>
    </div>
    <div class="panel"><h3>Таны төлөвлөгөөний гол чиглэл</h3><p>${esc(planText(req))}</p></div>
    <div class="riskPanel">
      <div class="panel"><h3>Хооллолтын үндсэн зарчим</h3><ul><li>Өглөө, өдөр, оройн хоолны цагийг тогтмол болгоно.</li><li>Гэрийн энгийн хоолноос хэмжээ, харьцааг зөв сонгоно.</li><li>Чихэрлэг ундаа, оройн хүнд хоол, давхар гуриллаг хэрэглээг багасгана.</li><li>Өлсөх бус, тогтвортой багасгах зарчмаар явна.</li></ul></div>
      <div class="panel"><h3>Дадлын үндсэн зарчим</h3><ul><li>Усны хэрэглээг өдөр бүр бага багаар тогтворжуулна.</li><li>Нойрны цаг, оройн хоолны цагийг анхаарна.</li><li>Суугаа ажилтай бол цаг тутам богино хөдөлгөөн оруулна.</li><li>7 хоног бүр жин, бэлхүүс, мэдрэмжээ тэмдэглэнэ.</li></ul></div>
    </div>
    <div class="panel"><h3>Анхаарах зүйл</h3><p>Тайлан нь таны оруулсан мэдээлэлд тулгуурласан ерөнхий чиглэл юм. Эрүүл мэндийн ноцтой зовиур, даралт, сахар, зүрх судас, бөөр, элэг, жирэмсэн/хөхүүл зэрэг анхаарах зүйл байвал мэргэжлийн эмчийн зөвлөгөөтэй хамт хэрэгжүүлнэ.</p></div>
    <div class="askActions"><button class="btn primary" onclick="window.print()">PDF / Хэвлэх</button></div>
  `;
}
async function init(){
  const id=qs('id');
  if(!id){$('reportView').innerHTML='<div class="panel">Тайлангийн ID алга.</div>'; return;}
  if(window.EBEJ_FIREBASE_READY && window.EBEJ_DB){
    try{
      const doc=await window.EBEJ_DB.collection('requests').doc(id).get();
      if(!doc.exists){ $('reportView').innerHTML='<div class="panel">Тайлан олдсонгүй.</div>'; return; }
      return render({...doc.data(), id: doc.id});
    }catch(e){
      console.error(e);
      $('reportView').innerHTML='<div class="panel">Тайлан уншихад алдаа гарлаа. Тайлан батлагдсан эсэх эсвэл Firebase rules тохиргоогоо шалгана уу.</div>'; return;
    }
  }
  const req=localFind(id);
  if(req) render(req); else $('reportView').innerHTML='<div class="panel">Firebase config бөглөөгүй байна.</div>';
}
init();
