
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2_RRnOFy_xbZLtiQRav9oxJ7H4ut13D4",
  authDomain: "ecofeira-a05e8.firebaseapp.com",
  projectId: "ecofeira-a05e8",
  storageBucket: "ecofeira-a05e8.firebasestorage.app",
  messagingSenderId: "349676062186",
  appId: "1:349676062186:web:31e39e8a4aa35245e95e93",
  measurementId: "G-XHP8SLYYGV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged };
export type { User };
