import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Your exact working Firebase credentials
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

document.addEventListener("DOMContentLoaded", () => {
    // Smart Element Finder (Finds inputs by type so your CSS styles don't break)
    const nameInput = document.querySelector("input[type='text']") || document.querySelector("input");
    const fileInput = document.querySelector("input[type='file']") || document.getElementById("fileInput");
    
    // Auto-detect your "SEND SYSTEM DATA" button dynamically
    let sendBtn = document.getElementById("sendBtn");
    if (!sendBtn) {
        const components = document.querySelectorAll("button, div, a");
        for (let element of components) {
            if (element.textContent.trim().toUpperCase() === "SEND SYSTEM DATA") {
                sendBtn = element;
                break;
            }
        }
    }

    // Create a matching progress text indicator right underneath your button
    let progressContainer = document.getElementById("progressContainer");
    if (!progressContainer && sendBtn) {
        progressContainer = document.createElement("div");
        progressContainer.id = "progressContainer";
        progressContainer.style.color = "#ec4899"; // Styled pink/neon to match your theme!
        progressContainer.style.marginTop = "20px";
        progressContainer.style.fontSize = "16px";
        progressContainer.style.fontWeight = "bold";
        progressContainer.style.fontFamily = "sans-serif";
        sendBtn.parentNode.insertBefore(progressContainer, sendBtn.nextSibling);
    }

    if (sendBtn) {
        sendBtn.style.cursor = "pointer";
        
        sendBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            
            const stageName = nameInput ? nameInput.value.trim() : "";
            const file = fileInput && fileInput.files ? fileInput.files[0] : null;
            
            if (!stageName || !file) {
                progressContainer.innerHTML = "❌ Please enter a stage name and select a media file first.";
                return;
            }

            // Lock button visually during transfer
            sendBtn.style.opacity = "0.5";
            sendBtn.style.pointerEvents = "none";
            
            // Create the matching tracking variables that tv.html is waiting for
            const uniqueFileName = ${Date.now()}_${file.name};
            const cloudStoragePath = performances/${uniqueFileName};
            const storageRef = ref(storage, cloudStoragePath);
            
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    progressContainer.innerHTML = 📡 Uploading Performance: ${progress}%;
                }, 
                (error) => {
                    console.error("Upload Error: ", error);
                    progressContainer.innerHTML = ❌ System Blocked: ${error.message};
                    sendBtn.style.opacity = "1";
                    sendBtn.style.pointerEvents = "auto";
                }, 
                async () => {
                    const downloadUrl = await
