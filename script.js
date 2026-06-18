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

// Wait for the DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('button'); // Targets your "SEND SYSTEM DATA"
    const fileIn = document.querySelector('input[type="file"]');
    const nameIn = document.querySelector('input[type="text"]');
    
    // Create status display area if it doesn't exist
    let status = document.getElementById('status-msg');
    if (!status) {
        status = document.createElement('div');
        status.id = 'status-msg';
        status.style.marginTop = '20px';
        status.style.color = '#fff';
        btn.parentNode.appendChild(status);
    }

    btn.onclick = async (e) => {
        e.preventDefault();
        if (!fileIn.files[0] || !nameIn.value) {
            status.innerText = "Please fill in all fields.";
            return;
        }

        const file = fileIn.files[0];
        const path = performances/${Date.now()}_${file.name};
        const uploadTask = uploadBytesResumable(ref(storage, path), file);

        uploadTask.on('state_changed', 
            (s) => status.innerText = Uploading: ${Math.round((s.bytesTransferred/s.totalBytes)*100)}%,
            (err) => status.innerText = "Error: " + err.message,
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                await addDoc(collection(db, "performances"), {
                    stageName: nameIn.value,
                    videoUrl: url,
                    storagePath: path,
                    timestamp: new Date()
                });
                status.innerText = "Upload Complete! Check the projector.";
            }
        );
    };
});
