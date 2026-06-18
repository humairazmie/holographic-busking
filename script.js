let db;
const dbName = "HoloBuskingSystem";
const dbVersion = 3; // Bumped to v3 to fix the structural error!

// Tracker Variables for Live Sync
let myQueueId = null;
let queueMonitorInterval = null;

// Robust Database Initialization
const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = (e) => {
    const database = e.target.result;
    if (!database.objectStoreNames.contains("videoQueue")) {
        database.createObjectStore("videoQueue", { keyPath: "id", autoIncrement: true });
        console.log("Database structural migration complete.");
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    console.log("Database running on channel variant v" + dbVersion);
};

request.onerror = (e) => {
    showMessage("Database connection failed: " + e.target.error.message, "error");
};

// UI Components
const uploadBtn = document.getElementById('uploadBtn');
const videoInput = document.getElementById('videoUpload');
const stageNameInput = document.getElementById('stageName');
const hiddenVideo = document.getElementById('hiddenVideoPlayer');
const statusMessage = document.getElementById('statusMessage');
const uploadInterface = document.getElementById('uploadInterface');

// Feedback & View Elements
const successDetails = document.getElementById('successDetails');
const displayStageName = document.getElementById('displayStageName');
const queuePositionText = document.getElementById('queuePosition');
const estPlayTimeText = document.getElementById('estPlayTime');
const miniVideos = document.querySelectorAll('.mini-vid');
const uploadAnotherBtn = document.getElementById('uploadAnotherBtn');

// Progress Variables
const progressContainer = document.getElementById('progressContainer');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');

uploadBtn.addEventListener('click', () => {
    if (!db) {
        showMessage("System structural storage loading. Please wait.", "error");
        return;
    }

    const file = videoInput.files[0];
    const stageName = stageNameInput.value.trim();

    if (!stageName || !file) {
        showMessage("Please enter a stage name and select your performance video.", "error");
        return;
    }

    const videoURL = URL.createObjectURL(file);
    hiddenVideo.src = videoURL;

    hiddenVideo.onloadedmetadata = function() {
        // Enforce 5-minute (300 seconds) duration limit
        if (hiddenVideo.duration > 300) {
            showMessage("Upload another video. Performance exceeds the 5-minute limit.", "error");
            return;
        }

        miniVideos.forEach(vid => { vid.src = videoURL; });
        simulateUploadProgress(file, stageName);
    };
    
    hiddenVideo.onerror = function() {
        showMessage("Failed to read video file. Ensure it is a valid format (MP4/WebM).", "error");
    };
});

function simulateUploadProgress(file, stageName) {
    showMessage("Uploading to Central Projector Queue...", "processing");
    progressContainer.classList.remove('hidden');
    progressBarFill.style.width = '0%';
    progressText.innerText = '0%';
    uploadBtn.style.display = 'none';

    let currentProgress = 0;
    const progressTimer = setInterval(() => {
        currentProgress += 5;

        if (currentProgress >= 100) {
            clearInterval(progressTimer);
            progressBarFill.style.width = '100%';
            progressText.innerText = '100%';
            
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                saveToQueue(file, stageName);
            }, 400);
        } else {
            progressBarFill.style.width = currentProgress + '%';
            progressText.innerText = currentProgress + '%';
        }
    }, 50); 
}

function saveToQueue(file, stageName) {
    try {
        const tx = db.transaction("videoQueue", "readwrite");
        const store = tx.objectStore("videoQueue");
        
        const record = {
            file: file,
            stageName: stageName,
            timestamp: new Date().getTime()
        };

        const addRequest = store.add(record);

        addRequest.onsuccess = (e) => {
            myQueueId = e.target.result; 
            
            // Set up UI
            showMessage("Video queued successfully!", "success");
            uploadInterface.classList.add('hidden');
            successDetails.classList.remove('hidden');
            displayStageName.innerText = stageName;

            miniVideos.forEach(vid => { 
                vid.play().catch(err => console.log("System holding autoplay state till viewport modification.")); 
            });

            // Start live-syncing their position
            startQueueMonitor(); 
        };

        addRequest.onerror = (e) => {
            showMessage("Queue insertion failed: " + e.target.error.message, "error");
            uploadBtn.style.display = 'block';
        };

    } catch (err) {
        showMessage("System structural error: " + err.message, "error");
        uploadBtn.style.display = 'block';
    }
}

// 📡 LIVE RADAR & LIST MAKER
function startQueueMonitor() {
    updateMyQueueStats(); 
    queueMonitorInterval = setInterval(updateMyQueueStats, 2000); 
}

function updateMyQueueStats() {
    if (!db || !myQueueId) return;

    try {
        const tx = db.transaction("videoQueue", "readonly");
        const store = tx.objectStore("videoQueue");
        const request = store.getAll();

        request.onsuccess = () => {
            const allItems = request.result;
            const queueListDisplay = document.getElementById('queueListDisplay');
            
            const myIndex = allItems.findIndex(item => item.id === myQueueId);
            
            // If deleted/skipped
            if (myIndex === -1) {
                clearInterval(queueMonitorInterval);
                queuePositionText.innerText = "DONE/SKIPPED";
                estPlayTimeText.innerText = "COMPLETED";
                queuePositionText.style.color = "#c67cb2"; 
                estPlayTimeText.style.color = "#c67cb2";
                queueListDisplay.innerHTML = "<li><span style='color: #c67cb2;'>Your performance has concluded.</span></li>";
                return;
            }

            // Update Stats
            const queuePos = myIndex + 1;
            queuePositionText.innerText = "#" + queuePos;
            queuePositionText.style.color = "var(--neon-cyan)"; 

            if (queuePos === 1) {
                estPlayTimeText.innerText = "UP NEXT / PLAYING";
                estPlayTimeText.style.color = "var(--neon-yellow)";
            } else {
                const estMinutes = (queuePos - 1) * 5;
                estPlayTimeText.innerText = `~${estMinutes} MINS`;
                estPlayTimeText.style.color = "var(--neon-cyan)"; 
            }

            // Build Live List
            queueListDisplay.innerHTML = ""; 
            allItems.forEach((item) => {
                const li = document.createElement('li');
                
                if (item.id === myQueueId) {
                    li.innerHTML = `<span style="color: #ff4a4a; font-weight: 900; text-shadow: 0 0 8px rgba(255, 74, 74, 0.5);">${item.stageName} (YOU)</span>`;
                } else {
                    li.innerHTML = `<span style="color: #fff;">${item.stageName}</span>`;
                }
                
                queueListDisplay.appendChild(li);
            });
        };
    } catch(err) {
        console.error("Queue monitor error:", err);
    }
}

function showMessage(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = type; 
    statusMessage.classList.remove('hidden');
}

// Reset tracking when uploading a new file
uploadAnotherBtn.addEventListener('click', () => {
    if (queueMonitorInterval) clearInterval(queueMonitorInterval);
    myQueueId = null;

    successDetails.classList.add('hidden');
    uploadInterface.classList.remove('hidden');
    statusMessage.classList.add('hidden');
    uploadBtn.style.display = 'block';
    
    videoInput.value = '';
    stageNameInput.value = '';
    
    miniVideos.forEach(vid => { 
        vid.pause(); 
        vid.src = ''; 
    });
});