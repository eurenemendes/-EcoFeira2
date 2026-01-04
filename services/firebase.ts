
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// NOTA: Estas chaves devem ser substituídas pelas suas chaves do Console do Firebase.
// O erro "Component auth has not been registered" geralmente ocorre por incompatibilidade 
// de versões no importmap ou se o Firebase tentar carregar sub-módulos de fontes diferentes.
const firebaseConfig = {
  apiKey: "AIzaSy...", // Substitua pela sua chave
  authDomain: "ecofeira-v2.firebaseapp.com",
  projectId: "ecofeira-v2",
  storageBucket: "ecofeira-v2.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicializa o App apenas uma vez
const app = initializeApp(firebaseConfig);

// Inicializa os serviços usando a instância do app garantida
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export const syncUserData = async (userId: string, data: any) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, data, { merge: true });
};

export const getUserData = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};
