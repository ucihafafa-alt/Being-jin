Эрүүл Бие — Эрүүл Жин v20 PREMIUM

Файлууд:
- index.html — хэрэглэгчийн асуумж, BMI, багц, төлбөрийн хүсэлт
- app.js — v20 detailed report + improved bank UI
- admin.html — v20 admin page
- admin.js — v20 admin SMS/admin link fix
- report.html — батлагдсан хэрэглэгчийн дэлгэрэнгүй 30/60/90/180 хоногийн тайлан
- style.css — бүх дэлгэц, банк, report, admin дизайн
- firebase-config.js — Firebase config
- firestore-rules.txt — түр нээлттэй тест rules
- firestore-rules-secure.txt — admin UID-тэй хамгаалалттай rules
- manifest.json, sw.js — PWA суурь
- hero.jpg, balance.jpg, energy.jpg — нүүр зураг/дизайн материал

GitHub дээр repo-ийн root дотор бүгдийг upload хийнэ.
Нээх линк: index.html?v=20
Админ: admin.html?v=20
Тайлан: report.html?id=REQUEST_ID&v=20

Анхаарах:
- Firestore rules-г тест үед firestore-rules.txt ашиглаж болно.
- Бэлэн бол secure rules рүү шилжүүлээд ADMIN_UID_ЭНД_БИЧНЭ хэсгийг өөрийн UID-р солино.
- Admin мөнгө баталсны дараа report.html link хэрэглэгчид илгээгдэнэ.
