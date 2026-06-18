import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0PxFV7MelnH1GegpyrKLxALbfZU21WsE",
  authDomain: "holographic-busking.firebaseapp.com",
  projectId: "holographic-busking",
  storageBucket: "holographic-busking.firebasestorage.app",
  messagingSenderId: "665073004121",
  appId: "1:665073004121:web:ee782335edab05f73dcb48",
  measurementId: "G-9YT7M4TC02"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

window.addEventListener('DOMContentLoaded', function() {
    const btn = document.querySelector('button');
    const fileIn = document.querySelector('input[type="file"]');
    const nameIn = document.querySelector('input[type="text"]');
    
    // Create the text feedback area
    let status = document.getElementById('status-msg');
    if (!status && btn) {
        status = document.createElement('div');
        status.id = 'status-msg';
        status.style.marginTop = '20px';
        status.style.color = '#ec4899'; // Pink to match your UI
        status.style.fontWeight = 'bold';
        btn.parentNode.appendChild(status);
    }

    if (btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if user filled everything out
            if (!fileIn  !fileIn.files[0]  !nameIn || !nameIn.value) {
                status.innerText = "❌ Please type a name and select a video.";
                return;
            }

            const file = fileIn.files[0];
            const path = "performances/" + Date.now() + "_" + file.name;
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // The highly explicit upload loop (No shortcuts!)
            uploadTask.on('state_changed', 
                function(snapshot) {
                    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    status.innerText = "📡 Uploading: " + progress + "%";
                },
                function(error) {
                    status.innerText = "
