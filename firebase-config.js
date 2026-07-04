/* Firebase тохиргоо — configured */
const firebaseConfig = {
  apiKey: "AIzaSyBjElsLaPDQbS5BOsddvIXCqmkxJWiyJoY",
  authDomain: "eruul-bie-eruul-jin.firebaseapp.com",
  projectId: "eruul-bie-eruul-jin",
  storageBucket: "eruul-bie-eruul-jin.firebasestorage.app",
  messagingSenderId: "799309402428",
  appId: "1:799309402428:web:5ee27fe7763e71475fce39"
};

window.EBEJ_FIREBASE_READY = false;
try {
  if (window.firebase && firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    window.EBEJ_DB = firebase.firestore();
    if (firebase.auth) window.EBEJ_AUTH = firebase.auth();
    window.EBEJ_FIREBASE_READY = true;
  }
} catch (e) {
  console.error('Firebase init error', e);
  window.EBEJ_FIREBASE_READY = false;
}
