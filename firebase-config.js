/* Firebase тохиргоо
   1) Firebase console -> Project settings -> Your apps -> Web app config
   2) Доорх утгуудыг өөрийн Firebase config-оор солино.
*/
const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY_ЭНД",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

window.EBEJ_FIREBASE_READY = false;
try {
  if (window.firebase && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('ЭНД') && !firebaseConfig.projectId.includes('PROJECT_ID')) {
    firebase.initializeApp(firebaseConfig);
    window.EBEJ_DB = firebase.firestore();
    if (firebase.auth) window.EBEJ_AUTH = firebase.auth();
    window.EBEJ_FIREBASE_READY = true;
  }
} catch (e) {
  console.error('Firebase init error', e);
  window.EBEJ_FIREBASE_READY = false;
}
