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
    
    const status = document.createElement('div');
    status.style.marginTop = '20px';
    status.style.color = '#ec4899';
    status.style.fontWeight = 'bold';
    
    if (btn !== null) {
        btn.parentNode.appendChild(status);
        
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Paranoid mode: checking values without exclamation marks
            const hasFile = fileIn !== null && fileIn.files.length > 0;
            const hasName = nameIn !== null && nameIn.value !== "";
            
            if (hasFile === false || hasName === false) {
                status.innerText = "Please type a name and select a video.";
                return;
            }

            const file = fileIn.files[0];
            const path = "performances/" + Date.now() + "_" + file.name;
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                function(snapshot) {
                    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    status.innerText = "Uploading: " + progress + "%";
                },
                function(error) {
                    status.innerText = "Error: " + error.message;
                },
                async function() {
                    status.innerText = "Connecting to matrix...";
                    try {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        await addDoc(collection(db, "performances"), {
                            stageName: nameIn.value,
                            videoUrl: url,
                            storagePath: path,
                            timestamp: new Date()
                        });
                        status.innerText = "SUCCESS! Look at the projector!";
                        nameIn.value = "";
                    } catch (dbError) {
                        status.innerText = "Database Error: " + dbError.message;
                    }
                }
            );
        });
    }
});
