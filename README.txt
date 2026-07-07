ЗҮҮНБҮРЭН СУМЫН ЭРҮҮЛ МЭНДИЙН ТӨВИЙН ЦАХИМ СИСТЕМ - ADMIN FINAL

Нүүр хуудас дээр админ товч харагдахгүй.
Админ тайлан тусдаа холбоосоор орно: /admin.html

Админ нэвтрэх PIN:
firebase-config.js доторх
export const ADMIN_PIN = "2026";
гэснийг өөрийн нууц кодоор солино.

Шалгах:
Нүүр: https://.../Being-jin/?v=admin
Админ: https://.../Being-jin/admin.html?v=admin


BG-SMALLFONT хувилбар:
- Ерөнхий арын фондод health-bg.jpg зураг нэмсэн.
- Үсгийн хэмжээг жижигрүүлсэн.
- Нүүр болон админ хэсэгт cache busting ?v=bg1 хийсэн.

Шалгах:
Нүүр: https://.../Being-jin/?v=bg1
Админ: https://.../Being-jin/admin.html?v=bg1


PRO1 нэмэлт:
- Иргэнд “Эрүүл мэндийн дүгнэлт” гарна.
- “Дараагийн алхам” хэсэг нэмэгдсэн.
- Зөвлөмж хэвлэхэд албан тайлан шиг харагдана.
- Админ дээр өндөр эрсдэлтэй, таргалалт II/III, даралт, сахар, халдварт шинжийн тусгай шүүлтүүр нэмсэн.
- Баг тус бүрийн нэгтгэл тайлан нэмсэн.
- Админ дээр “Нэгтгэл хэвлэх” товч нэмсэн.
- CSV-д гол хүчин зүйл, дараагийн алхам нэмэгдсэн.

Шалгах:
Нүүр: https://.../Being-jin/?v=pro1
Админ: https://.../Being-jin/admin.html?v=pro1

PRO2 READFIX:
- Admin 0 харагдах асуудалд зориулж Firestore read rule нэмсэн.
- Admin.js orderBy ашиглахгүй, бүх бичлэгийг уншаад дотроо эрэмбэлнэ.
- Заавал Firebase Console → Firestore Database → Rules дээр firebase-rules.txt доторх rule-ийг хуулж Publish дарна.
Шалгах:
Нүүр: https://.../Being-jin/?v=pro2
Админ: https://.../Being-jin/admin.html?v=pro2
