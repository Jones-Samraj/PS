import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDkPkqvrenRjrmSwOUMHRj_WelsAbC2gok",
  authDomain: "bit-ps.firebaseapp.com",
  projectId: "bit-ps",
  storageBucket: "bit-ps.appspot.com",
  messagingSenderId: "165294283564",
  appId: "1:165294283564:web:27008fb6ea00c09ff76a89",
  measurementId: "G-SX03RFG9JB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
