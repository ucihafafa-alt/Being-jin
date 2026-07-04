Эрүүл Бие — Эрүүл Жин v18 FIREBASE ADMIN систем

Энэ хувилбар Google Apps Script ашиглахгүй.
Firebase Firestore + Firebase Authentication ашиглана.

Файлууд:
- index.html — хэрэглэгчийн асуумж, БЖИ, эрсдэлийн тайлан, багц сонголт, төлбөрийн хүсэлт
- admin.html — админ хүсэлтүүдээ харах, батлах хэсэг
- report.html — баталгаажсан хэрэглэгчийн тайлангийн link
- app.js — үндсэн системийн логик
- admin.js — Firebase admin хэсгийн логик
- report.js — тайлан унших логик
- firebase-config.js — Firebase тохиргоо оруулах файл
- firestore-rules.txt — Firestore security rules
- FIREBASE_SETUP.txt — Firebase тохируулах дэлгэрэнгүй заавар
- hero.jpg / balance.jpg / energy.jpg — зургууд
- style.css — дизайн

GitHub дээр байршуулах:
1. ZIP-ээ задла.
2. Доторх бүх файлыг repo-ийн гадна талд upload хийнэ.
3. GitHub Pages асаана.
4. Сайт:
   https://ucihafafa-alt.github.io/Being-jin/?v=11
5. Админ:
   https://ucihafafa-alt.github.io/Being-jin/admin.html?v=11

Firebase тохируулах:
FIREBASE_SETUP.txt файлыг унш.


V14: ХААН Банкны дансны мэдээлэл оруулсан. Түр тест хийх Firestore rules-ийг firestore-rules.txt дотор нээлттэй болгосон. Ажилласны дараа firestore-rules-secure.txt ашиглаж админ UID оруулна.


V15: Төлбөрийн хэсэгт ХААН, Төрийн банк, ХасБанк, Худалдаа хөгжлийн банк, Голомт банкны апп нээх сонголт нэмсэн. IBAN гэж бичихгүй, банкны код гэж харуулна.


V16: Төлбөрийн хэсгийг банкны товчны grid болгосон. Хүсэлт Firebase рүү очоогүй үед алдааг шууд харуулна. Admin хэсэг түр нээлттэй Firestore rules-тэй үед loginгүй ч хүсэлт унших боломжтой.


v18: банкны товч, IBAN, админ link илгээх хэсэг, жижиг font засвар.
