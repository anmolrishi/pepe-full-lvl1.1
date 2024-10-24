import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJOR9NP0Stcziwz0RExHqD2Ahv4LNal3M",
  authDomain: "pepe-10b60.firebaseapp.com",
  projectId: "pepe-10b60",
  storageBucket: "pepe-10b60.appspot.com",
  messagingSenderId: "175367683339",
  appId: "1:175367683339:web:432c84c5dce885c854b60e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);