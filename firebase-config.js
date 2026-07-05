// Firebase тохиргоо
// Firebase Console → Project settings → Your apps → Web app config хэсгээс доорх утгуудыг солино.

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Админ тайлан харах эрхтэй Gmail хаягууд.
// Жишээ: ["ucihafafa@gmail.com", "doctor@example.com"]
export const ADMIN_EMAILS = [
  "ucihafafa@gmail.com"
];

export const COLLECTION_NAME = "bmi_submissions";
