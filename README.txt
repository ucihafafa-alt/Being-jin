Зүүнбүрэн сумын Эрүүл мэндийн төв — BMI ба урьдчилан сэргийлэх зөвлөмжийн web

Файлууд:
- index.html      Иргэн бөглөх нүүр хуудас
- app.js          BMI тооцоолол, зөвлөмж, Firebase хадгалалт
- admin.html      Админ тайлангийн хуудас
- admin.js        Firebase Auth, Firestore тайлан, CSV татах
- firebase-config.js  Firebase тохиргоо, admin email тохиргоо
- style.css       Дизайн
- firebase-rules.txt Firestore security rules
- manifest.json, sw.js, favicon.svg  PWA үндсэн файлууд

GitHub дээр оруулах:
1. ZIP-ээ задлаад доторх бүх файлыг GitHub repository-ийн root хавтас руу upload хийнэ.
2. ZIP файлыг өөрийг нь upload хийхгүй.
3. GitHub Pages асаасан repository дээр index.html шууд нээгдэнэ.

Firebase тохируулах:
1. Firebase Console дээр project үүсгэнэ.
2. Build → Firestore Database → Create database.
3. Build → Authentication → Sign-in method → Google provider Enable.
4. Project settings → Your apps → Web app үүсгээд firebaseConfig-г хуулна.
5. firebase-config.js доторх PASTE_... утгуудыг солино.
6. ADMIN_EMAILS хэсэгт админ тайлан харах Gmail хаягаа бичнэ.
7. Firestore → Rules хэсэгт firebase-rules.txt файлын агуулгыг хуулж Publish хийнэ.
8. Firebase Authentication → Settings → Authorized domains дээр GitHub Pages домэйнээ нэмнэ.

Анхаарах:
- РД-г шууд document id болгохгүй, browser дээр SHA-256 hash болгож хадгалалтын id үүсгэнэ.
- Иргэн мэдээлэл submit хийх эрхтэй, бусдын мэдээлэл унших эрхгүй.
- Админ тайлан зөвхөн ADMIN_EMAILS-д бичсэн Gmail-ээр харагдана.
- CSV татах товч нь админ дэлгэц дээрх шүүгдсэн бүртгэлийг Excel-д нээгдэх CSV болгон татна.
