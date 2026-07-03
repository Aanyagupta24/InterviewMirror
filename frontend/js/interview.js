const connectScreen = document.getElementById("connectScreen");
    const introScreen = document.getElementById("introScreen");
    const roomScreen = document.getElementById("roomScreen");
    const reportScreen = document.getElementById("reportScreen");

    const connectStatus = document.getElementById("connectStatus");
    const introAvatar = document.getElementById("introAvatar");
    const introLine1 = document.getElementById("introLine1");
    const introLine2 = document.getElementById("introLine2");
    const introLine3 = document.getElementById("introLine3");

    const selfVideo = document.getElementById("selfVideo");
    const selfPlaceholder = document.getElementById("selfPlaceholder");
    const questionText = document.getElementById("questionText");
    const thinkingText = document.getElementById("thinkingText");
    const liveTranscript = document.getElementById("liveTranscript");
    const elapsedTime = document.getElementById("elapsedTime");

    const micBtn = document.getElementById("micBtn");
    const camBtn = document.getElementById("camBtn");
    const endBtn = document.getElementById("endBtn");
    const restartBtn = document.getElementById("restartBtn");

    let stream = null;
    let elapsed = 0;
    let timer = null;
    let transcriptTimer = null;
    let thinkingTimer = null;

    const transcriptLines = [
      "Hi, I'm Vansh. I enjoy building AI-powered products that solve practical problems.",
      "Recently, I've been focused on backend systems, full stack interfaces, and interview-focused experiences.",
      "I like building products where the intelligence stays powerful but the interface stays simple.",
      "For me, good software is not just functional — it should also feel intentional and calm to use."
    ];

    function wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showScreen(screen) {
      [connectScreen, introScreen].forEach(s => s.classList.remove("active"));
      roomScreen.classList.remove("active");
      reportScreen.classList.remove("active");
      screen.classList.add("active");
    }

    async function runSequence() {
      showScreen(connectScreen);
      connectStatus.textContent = "";

      await wait(1600);
      connectStatus.innerHTML = '<span class="tick">✓ Connected</span>';

      await wait(1200);
      showScreen(introScreen);

      await wait(600);
      introAvatar.classList.add("show");

      await wait(900);
      introLine1.classList.add("show");

      await wait(1100);
      introLine2.classList.add("show");

      await wait(1100);
      introLine3.classList.add("show");

      await wait(1800);
      showScreen(roomScreen);

      await wait(900);
      startCamera();

      startElapsedTime();
      startLiveTranscript();

      await wait(2200);
      questionText.textContent = "Tell me about yourself.";

      await wait(7000);
      simulateThinkingThenFollowup();
    }

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        selfVideo.srcObject = stream;
        selfVideo.style.display = "block";
        selfPlaceholder.style.display = "none";
      } catch (error) {
        selfVideo.style.display = "none";
        selfPlaceholder.style.display = "grid";
      }
    }

    function startElapsedTime() {
      elapsed = 0;
      elapsedTime.textContent = "00:00";
      clearInterval(timer);
      timer = setInterval(() => {
        elapsed += 1;
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        elapsedTime.textContent = `${mins}:${secs}`;
      }, 1000);
    }

    function startLiveTranscript() {
      let index = 0;
      liveTranscript.textContent = "";
      clearInterval(transcriptTimer);

      transcriptTimer = setInterval(() => {
        if (index < transcriptLines.length) {
          liveTranscript.textContent = transcriptLines[index];
          index++;
        }
      }, 3000);
    }

    function simulateThinkingThenFollowup() {
      clearTimeout(thinkingTimer);

      thinkingTimer = setTimeout(async () => {
        thinkingText.classList.add("show");
        thinkingText.textContent = "Thinking...";

        await wait(3000);

        thinkingText.classList.remove("show");
        questionText.textContent = "Interesting. Why did you choose React for that project?";
        liveTranscript.textContent = "Your next answer appears here while you speak.";
      }, 9000);
    }

    function stopMedia() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }

    function endInterview() {
      clearInterval(timer);
      clearInterval(transcriptTimer);
      clearTimeout(thinkingTimer);
      stopMedia();
      showScreen(reportScreen);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function restartInterview() {
      window.location.reload();
    }

    micBtn.addEventListener("click", () => {
      if (!stream) return;
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) return;

      audioTracks.forEach(track => track.enabled = !track.enabled);
      micBtn.style.background = audioTracks[0].enabled ? "rgba(255,255,255,0.04)" : "rgba(255,107,107,0.12)";
    });

    camBtn.addEventListener("click", () => {
      if (!stream) return;
      const videoTracks = stream.getVideoTracks();
      if (!videoTracks.length) return;

      videoTracks.forEach(track => track.enabled = !track.enabled);
      const enabled = videoTracks[0].enabled;
      selfVideo.style.opacity = enabled ? "1" : "0.2";
      camBtn.style.background = enabled ? "rgba(255,255,255,0.04)" : "rgba(255,107,107,0.12)";
    });

    endBtn.addEventListener("click", endInterview);
    restartBtn.addEventListener("click", restartInterview);

    runSequence();