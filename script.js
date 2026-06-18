instance
                const response = await fetch('http://localhost:5000/get_score');
                const data = await response.json();
                
                finalScoreDisplay.style.fontSize = "10rem"; 
                finalScoreDisplay.innerText = data.score;
                
                // Triggers structural data wipe sequence across memory spaces
                await fetch('http://localhost:5000/reset_score', { method: 'POST' });
                
            } catch (err) {
                console.warn("Telemetry Server offline.", err);
                finalScoreDisplay.style.fontSize = "3rem";
                finalScoreDisplay.innerText = "DATA ACCESS ERROR"; 
            }

            // Standard display persistence timeout: 7 seconds
            setTimeout(() => {
                scoreboardOverlay.style.display = 'none';
                clearCurrentVideoAndProceed();
            }, 7000);
        }

        // QUEUE LOGISTICS ENGINE
        function checkQueue() {
            if (isPlaying || !db) return;

            try {
                const tx = db.transaction("videoQueue", "readonly");
                const store = tx.objectStore("videoQueue");
                const request = store.openCursor(); 

                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        playVideo(cursor.value, cursor.key);
                    } else {
                        showIdleScreen();
                    }
                };
            } catch (err) {
                errDisplay.innerText = "Transaction error: " + err.message;
            }
        }

        function playVideo(videoData, id) {
            isPlaying = true;
            currentObjectId = id;
            idleScreen.style.display = 'none';
            skipBtn.style.display = 'block'; 
            errDisplay.innerText = "";

            if (currentVideoURL) URL.revokeObjectURL(currentVideoURL);
            currentVideoURL = URL.createObjectURL(videoData.file);

            videos.forEach(vid => {
                vid.src = currentVideoURL;
                vid.style.display = 'block';
                vid.play().catch(e => {
                    errDisplay.innerText = "Hardware lock active. Touch screen canvas to link audio nodes.";
                });
            });
        }

        function clearCurrentVideoAndProceed() {
            videos.forEach(vid => {
                vid.style.display = 'none';
                vid.src = '';
            });

            if (currentVideoURL) {
                URL.revokeObjectURL(currentVideoURL);
                currentVideoURL = null;
            }

            try {
                const tx = db.transaction("videoQueue", "readwrite");
                const store = tx.objectStore("videoQueue");
                const deleteReq = store.delete(currentObjectId);
                
                deleteReq.onsuccess = () => {
                    isPlaying = false;
                    checkQueue(); 
                };
                deleteReq.onerror = (e) => {
                    errDisplay.innerText = "Cache cleanup failed: " + e.target.error.message;
                    isPlaying = false; 
                };
            } catch(err) {
                errDisplay.innerText = "System memory fault: " + err.message;
                isPlaying = false;
            }
        }

        // EVENT INTERFACES
        mainVideoTracker.addEventListener('ended', handleVideoEnd);

        skipBtn.addEventListener('click', () => {
            if(isPlaying) {
                mainVideoTracker.pause();
                handleVideoEnd();
            }
        });

        function showIdleScreen() {
            idleScreen.style.display = 'block';
        }
    </script>
</body>
</html>
