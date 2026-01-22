import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOzpqiuI-YoIjwbIQlAtCD2GjsFT5DJRo",
    authDomain: "owlight-mvp.firebaseapp.com",
    projectId: "owlight-mvp",
    storageBucket: "owlight-mvp.firebasestorage.app",
    messagingSenderId: "521279644990",
    appId: "1:521279644990:web:0a55924de78efb454ab86f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
