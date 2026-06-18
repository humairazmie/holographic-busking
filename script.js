import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

// Your Web App Firebase Credentials
const firebaseConfig = {
    apiKey: "AIzaSyA0PxFV7MelnH1GegpyrKLxALbfZU21WsE",
    authDomain: "holographic-busking.firebaseapp.com",
    projectId: "holographic-busking",
    storageBucket: "holographic-busking.firebasestorage.app",
    messagingSenderId: "665073004121",
    appId: "1:665073004121:web:ee782335edab05f73dcb48",
    measurementId: "G-9YT7M4TC02"
};

// Initialize Cloud Engine Nodes
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Interfaces
const uploadForm = document.getElementById('uploadForm'); // Double check if your HTML form has this ID
const fileInput = document.getElementById('fileInput');   // Double check if your HTML input has this ID
const statusDisplay = document.createElement('div');      // Creates a visual text element for status updates

// Inject status layout safely into the webpage
if (uploadForm) {
    statusDisplay.id = "uploadStatus";
    statusDisplay.style.marginTop = "15px";
    statusDisplay.style.fontFamily = "'Orbitron', sans-serif";
    statusDisplay.style.color = "#00ffcc";
    uploadForm.appendChild(statusDisplay);
}

// Intercept Local Submit Actions
if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            statusDisplay.style.color = "#ff4a4a";
            statusDisplay.innerText = "ERROR: NO FILE SELECTED";
            return;
        }

        // Generate a unique path tracking pointer inside the cloud storage bucket
        const uniqueFileName = `${Date.now()}_${file.name}`;
        const storagePath = `videos/${uniqueFileName}`;
        const fileRef = ref(storage, storagePath);

        // Initiate standard block transfer chunk stream
        const uploadTask = uploadBytesResumable(fileRef, file);

        statusDisplay.style.color = "#ffb700";
        statusDisplay.innerText = "INITIALIZING LIVE BROADCAST STREAM... 0%";

        // Monitor Upload Progress Context Changes
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                statusDisplay.innerText = `UPLOADING DATA PACKETS... ${progress}%`;
            }, 
            (error) => {
                statusDisplay.style.color = "#ff4a4a";
                statusDisplay.innerText = `BEAM INTERRUPT: ${error.message}`;
            }, 
            async () => {
                // Upload complete, harvest global content delivery token
                try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    statusDisplay.style.color = "#00ffcc";
                    statusDisplay.innerText = "PACKETS ROUTED SUCCESSFULLY. SYNCING MATRIX...";

                    // Append asset references to the master distributed task array
                    await addDoc(collection(db, "videoQueue"), {
                        videoUrl: downloadUrl,
                        storagePath: storagePath,
                        fileName: file.name,
                        timestamp: serverTimestamp()
                    });

                    statusDisplay.innerText = "TRANSMISSION COMPLETE! YOUR VIDEO IS IN THE QUEUE.";
                    uploadForm.reset();

                } catch (err) {
                    statusDisplay.style.color = "#ff4a4a";
                    statusDisplay.innerText = `INDEX FAULT: ${err.message}`;
                }
            }
        );
    });
}