import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Your exact configuration block matching tv.html
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

// Get UI Elements
const sendBtn = document.getElementById("sendBtn") || document.querySelector("button"); 
const fileInput = document.getElementById("fileInput") || document.querySelector("input[type='file']");
const nameInput = document.getElementById("nameInput") || document.querySelector("input[type='text']");

// Setup or select progress bar element dynamically if not present
let progressContainer = document.getElementById("progressContainer");
if (!progressContainer) {
    progressContainer = document.createElement("div");
    progressContainer.id = "progressContainer";
    progressContainer.style.color = "#00ff00";
    progressContainer.style.marginTop = "15px";
    progressContainer.style.fontSize = "18px";
    sendBtn.parentNode.insertBefore(progressContainer, sendBtn.nextSibling);
}

if (sendBtn) {
    sendBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        const stageName = nameInput.value.trim();
        const file = fileInput.files[0];
        
        if (!stageName || !file) {
            progressContainer.innerHTML = "❌ Please enter a stage name and select a video file.";
            return;
        }

        // Disable button during active upload transmission
        sendBtn.disabled = true;
        
        // Generate a clean, unique cloud storage path identifier
        const uniqueFileName = `${Date.now()}_${file.name}`;
        const cloudStoragePath = `performances/${uniqueFileName}`;
        const storageRef = ref(storage, cloudStoragePath);
        
        // Start live upload task stream
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
            (snapshot) => {
                // Real-time loading math calculations
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                progressContainer.innerHTML = `Uploading Performance: ${progress}%...`;
            }, 
            (error) => {
                console.error("Upload failed: ", error);
                progressContainer.innerHTML = `❌ Cloud Upload Blocked: ${error.message}`;
                sendBtn.disabled = false;
            }, 
            async () => {
                // Upload complete, grab public secure file access streaming token
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                
                progressContainer.innerHTML = "Processing data pipeline...";

                try {
                    // Send index directly to Firestore (matching tv.html variables exactly!)
                    await addDoc(collection(db, "performances"), {
                        stageName: stageName,
                        videoUrl: downloadUrl,
                        storagePath: cloudStoragePath, // Crucial link for the asset cleaner!
                        timestamp: new Date()
                    });
                    
                    progressContainer.innerHTML = "🚀 PERFORMANCE LIVE! Look at the projector screen!";
                    nameInput.value = "";
                    fileInput.value = "";
                } catch (firestoreError) {
                    console.error("Firestore database write failed: ", firestoreError);
                    progressContainer.innerHTML = "❌ Database transmission failed. Check Firestore rules.";
                }
                
                sendBtn.disabled = false;
            }
        );
    });
}