const app = document.getElementById("app");
    const orbLabel = document.getElementById("orbLabel");
    const questionText = document.getElementById("questionText");
    const heroKicker = document.getElementById("heroKicker");
    const subcopy = document.getElementById("subcopy");
    const timer = document.getElementById("timer");
    const speechTimerPill = document.getElementById("speechTimerPill");
    const cameraState = document.getElementById("cameraState");
    const video = document.getElementById("video");
    const camFallback = document.getElementById("camFallback");
    const waveCanvas = document.getElementById("waveCanvas");
    const statusMain = document.getElementById("statusMain");
    const statusSub = document.getElementById("statusSub");
    const transcriptText = document.getElementById("transcriptText");
    const eyeContactPill = document.getElementById("eyeContactPill");
    const confidenceValue = document.getElementById("confidenceValue");
    const wpmValue = document.getElementById("wpmValue");
    const eyeValue = document.getElementById("eyeValue");
    const fillerValue = document.getElementById("fillerValue");
    const thinkingOverlay = document.getElementById("thinkingOverlay");
    const reportScreen = document.getElementById("reportScreen");
    const muteBtn = document.getElementById("muteBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const leaveBtn = document.getElementById("leaveBtn");
    const metricCards = [
      document.getElementById("metric1"),
      document.getElementById("metric2"),
      document.getElementById("metric3"),
      document.getElementById("metric4")
    ];

    const ctx = waveCanvas.getContext("2d");

    const STATES = {
      PREPARING: "preparing",
      AI_INTRO: "ai-intro",
      AI_SPEAKING: "ai-speaking",
      USER: "user",
      THINKING: "thinking",
      REPORT: "report",
      ENDED: "ended"
    };

    let currentState = STATES.PREPARING;
    let mediaStream = null;
    let audioContext = null;
    let analyser = null;
    let source = null;
    let animationId = null;
    let totalSeconds = 0;
    let totalTimer = null;
    let speechSeconds = 0;
    let speechTimer = null;
    let recognition = null;
    let usingSpeechRecognition = false;
    let isMuted = false;
    let isPaused = false;
    let transcriptSeedIndex = 0;

    const transcriptSeeds = [
      "Hi, I'm Vansh, and I enjoy building AI-powered products that solve practical user problems.",
      "Recently I've been working on backend systems, full stack interfaces, and interview-focused AI experiences.",
      "I like turning rough ideas into polished products with real-time feedback and clear user flows.",
      "I also enjoy hackathons because they force fast thinking, iteration, and strong product decisions."
    ];

    const aiQuestions = [
      "Tell me about yourself.",
      "Can you walk me through a project you're proud of?",
      "Interesting. Can you elaborate on the decisions you made there?"
    ];

    function formatTime(total) {
      const m = String(Math.floor(total / 60)).padStart(2, "0");
      const s = String(total % 60).padStart(2, "0");
      return `${m}:${s}`;
    }

    function startGlobalTimer() {
      timer.textContent = formatTime(totalSeconds);
      totalTimer = setInterval(() => {
        if (!isPaused && currentState !== STATES.ENDED) {
          totalSeconds += 1;
          timer.textContent = formatTime(totalSeconds);
        }
      }, 1000);
    }

    function startSpeechTimer() {
      clearInterval(speechTimer);
      speechSeconds = 0;
      speechTimerPill.textContent = `⏱ ${formatTime(speechSeconds)}`;
      speechTimer = setInterval(() => {
        if (!isPaused && currentState === STATES.USER) {
          speechSeconds += 1;
          speechTimerPill.textContent = `⏱ ${formatTime(speechSeconds)}`;
        }
      }, 1000);
    }

    function stopSpeechTimer() {
      clearInterval(speechTimer);
    }

    function resizeCanvas() {
      const ratio = window.devicePixelRatio || 1;
      const rect = waveCanvas.getBoundingClientRect();
      waveCanvas.width = rect.width * ratio;
      waveCanvas.height = rect.height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function drawIdleWave(flat = false) {
      const w = waveCanvas.clientWidth;
      const h = waveCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(132,203,255,0.42)";
      ctx.beginPath();

      for (let x = 0; x <= w; x += 8) {
        const amp = flat ? 1.5 : 4;
        const y = h / 2 + Math.sin(x * 0.022) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    function drawLiveWave() {
      if (!analyser) {
        drawIdleWave();
        return;
      }

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      function render() {
        animationId = requestAnimationFrame(render);
        const w = waveCanvas.clientWidth;
        const h = waveCanvas.clientHeight;

        analyser.getByteTimeDomainData(dataArray);
        ctx.clearRect(0, 0, w, h);

        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, "rgba(255,255,255,0.02)");
        bg.addColorStop(1, "rgba(255,255,255,0.00)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "#bde7ff");
        grad.addColorStop(0.4, "#7ecbff");
        grad.addColorStop(1, "#5bbcff");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        let x = 0;
        const sliceWidth = w / bufferLength;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }

      render();
    }

    function stopWaveAnimation() {
      if (animationId) cancelAnimationFrame(animationId);
      animationId = null;
    }

    async function setupMedia() {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true
        });

        video.srcObject = mediaStream;
        video.style.display = "block";
        camFallback.style.display = "none";
        cameraState.textContent = "Candidate camera";

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(mediaStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
      } catch (error) {
        cameraState.textContent = "Camera unavailable";
        camFallback.style.display = "grid";
      }
    }

    function setupSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        usingSpeechRecognition = false;
        return;
      }

      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        usingSpeechRecognition = true;

        recognition.onresult = (event) => {
          let interim = "";
          let finalText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += transcript + " ";
            else interim += transcript;
          }

          transcriptText.textContent = (finalText + interim).trim() || "Listening to your response...";
        };

        recognition.onerror = () => {
          usingSpeechRecognition = false;
        };
      } catch (e) {
        usingSpeechRecognition = false;
      }
    }

    function startSpeechRecognition() {
      if (usingSpeechRecognition && recognition) {
        try { recognition.start(); } catch (e) {}
      }
    }

    function stopSpeechRecognition() {
      if (usingSpeechRecognition && recognition) {
        try { recognition.stop(); } catch (e) {}
      }
    }

    function fallbackTranscriptTick() {
      if (currentState !== STATES.USER || isPaused) return;
      transcriptText.textContent = transcriptSeeds[transcriptSeedIndex % transcriptSeeds.length];
      transcriptSeedIndex += 1;
    }

    function showMetrics() {
      metricCards.forEach((card, index) => {
        setTimeout(() => card.classList.add("show"), 120 * index);
      });
    }

    function resetMetrics() {
      metricCards.forEach(card => card.classList.remove("show"));
    }

    function typeText(element, text, speed = 36) {
      return new Promise(resolve => {
        element.textContent = "";
        let i = 0;

        function tick() {
          if (i <= text.length) {
            element.textContent = text.slice(0, i);
            i++;
            setTimeout(tick, speed);
          } else {
            resolve();
          }
        }

        tick();
      });
    }

    function animateElement(el, keyframes, options) {
      if (el.animate) return el.animate(keyframes, options);
      return null;
    }

    function setState(state, options = {}) {
      currentState = state;
      app.className = "app";
      app.classList.add(state);

      if (state === STATES.PREPARING) {
        app.classList.add("prepare-only", "camera-hidden", "ai-intro");
      }

      if (state === STATES.AI_INTRO) {
        app.classList.add("ai-intro", "camera-hidden", "active-question");
      }

      if (state === STATES.AI_SPEAKING) {
        app.classList.add("active-question");
        if (!options.showRoom) app.classList.add("camera-hidden");
      }

      if (state === STATES.USER) {
        app.classList.remove("camera-hidden");
      }

      if (state === STATES.THINKING) {
        app.classList.remove("camera-hidden");
      }

      if (state === STATES.REPORT) {
        app.classList.add("report");
      }
    }

    async function runSequence() {
      setState(STATES.PREPARING);
      heroKicker.style.opacity = "0";
      questionText.textContent = "Preparing your interviewer...";
      subcopy.textContent = "Calibrating voice, personality, and interview flow.";
      orbLabel.textContent = "Preparing your interviewer...";
      timer.style.opacity = "0";

      await wait(2000);

      setState(STATES.AI_INTRO);
      timer.style.opacity = "1";
      heroKicker.style.opacity = "1";
      heroKicker.style.transform = "translateY(0)";
      heroKicker.textContent = "AI interviewer";
      subcopy.textContent = "";
      questionText.textContent = "";
      orbLabel.textContent = "AI Interviewer";

      await speakLines([
        "Hello Vansh.",
        "I'm going to conduct your interview today.",
        "Take a deep breath.",
        "Let's begin."
      ], 1200, false);

      await wait(400);

      setState(STATES.AI_SPEAKING, { showRoom: true });
      heroKicker.textContent = "Question 01";
      orbLabel.textContent = "AI Interviewer";
      subcopy.textContent = "Listen carefully, then respond naturally.";

      animateSpeakerReveal();
      await typeText(questionText, aiQuestions[0], 42);
      await wait(700);

      startUserRound();
    }

    function animateSpeakerReveal() {
      app.classList.remove("camera-hidden");

      animateElement(document.querySelector(".camera-wrap"), [
        { opacity: 0, transform: "translateY(24px) scale(0.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" }
      ], { duration: 700, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" });

      animateElement(document.querySelector(".wave-zone"), [
        { opacity: 0, transform: "translateY(22px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 760, delay: 120, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" });

      animateElement(document.querySelector(".transcript"), [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 760, delay: 220, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" });

      animateElement(document.querySelector(".metrics"), [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 760, delay: 300, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" });
    }

    async function speakLines(lines, gap = 1000, showQuestion = false) {
      setState(showQuestion ? STATES.AI_SPEAKING : STATES.AI_INTRO, { showRoom: false });
      statusMain.textContent = "AI is speaking...";
      statusSub.textContent = "Listen carefully to the prompt.";
      stopWaveAnimation();
      drawIdleWave(true);

      for (const line of lines) {
        orbLabel.textContent = "Speaking...";
        await typeText(questionText, line, 36);
        await wait(gap);
      }

      orbLabel.textContent = "AI Interviewer";
    }

    function startUserRound() {
      setState(STATES.USER);
      statusMain.textContent = "Listening...";
      statusSub.textContent = "The waveform reacts to your voice and live metrics update in real time.";
      orbLabel.textContent = "Listening";
      transcriptText.textContent = "Start speaking. Your response will appear here.";
      showMetrics();
      startSpeechTimer();
      startSpeechRecognition();
      stopWaveAnimation();
      drawLiveWave();
      beginMetricSimulation();
    }

    function beginMetricSimulation() {
      let confidence = 78;
      let wpm = 126;
      let fillers = 1;
      const eyeStates = ["Good", "Strong", "Steady", "Good"];
      let eyeIndex = 0;

      confidenceValue.textContent = `${confidence}%`;
      wpmValue.textContent = `${wpm} WPM`;
      eyeValue.textContent = eyeStates[eyeIndex];
      fillerValue.textContent = `${fillers}`;
      eyeContactPill.textContent = `👀 Eye contact: ${eyeStates[eyeIndex]}`;

      window.metricInterval = setInterval(() => {
        if (currentState !== STATES.USER || isPaused) return;

        confidence = Math.max(68, Math.min(92, confidence + Math.floor(Math.random() * 7) - 3));
        wpm = Math.max(118, Math.min(142, wpm + Math.floor(Math.random() * 9) - 4));

        if (Math.random() > 0.76) fillers += 1;
        eyeIndex = (eyeIndex + 1) % eyeStates.length;

        confidenceValue.textContent = `${confidence}%`;
        wpmValue.textContent = `${wpm} WPM`;
        eyeValue.textContent = eyeStates[eyeIndex];
        fillerValue.textContent = `${fillers}`;
        eyeContactPill.textContent = `👀 Eye contact: ${eyeStates[eyeIndex]}`;
      }, 1800);

      window.transcriptInterval = setInterval(fallbackTranscriptTick, 3200);
    }

    async function goThinking() {
      clearInterval(window.metricInterval);
      clearInterval(window.transcriptInterval);
      stopSpeechTimer();
      stopSpeechRecognition();

      setState(STATES.THINKING);
      statusMain.textContent = "Analyzing your answer...";
      statusSub.textContent = "Speech input paused while the interviewer thinks.";
      orbLabel.textContent = "Thinking...";
      stopWaveAnimation();
      drawIdleWave(true);
      thinkingOverlay.classList.add("show");

      await wait(2800);

      thinkingOverlay.classList.remove("show");
      await wait(300);

      setState(STATES.AI_SPEAKING, { showRoom: true });
      heroKicker.textContent = "Follow-up";
      subcopy.textContent = "A deeper follow-up is ready.";
      await speakLines([
        "Interesting.",
        "Can you elaborate on the decisions you made there?"
      ], 1100, true);

      await wait(500);
      questionText.textContent = aiQuestions[2];
      startUserRound();

      setTimeout(async () => {
        if (currentState === STATES.USER) {
          await goToReport();
        }
      }, 9000);
    }

    async function goToReport() {
      clearInterval(window.metricInterval);
      clearInterval(window.transcriptInterval);
      stopSpeechRecognition();
      stopSpeechTimer();
      stopWaveAnimation();
      setState(STATES.REPORT);
      statusMain.textContent = "Generating report...";
      statusSub.textContent = "Transforming this session into a performance summary.";
      reportScreen.classList.add("show");
    }

    function wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function toggleMute() {
      if (!mediaStream) return;
      isMuted = !isMuted;
      mediaStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      muteBtn.style.opacity = isMuted ? "0.65" : "1";
      statusSub.textContent = isMuted ? "Microphone muted." : currentState === STATES.USER
        ? "The waveform reacts to your voice and live metrics update in real time."
        : statusSub.textContent;
    }

    function togglePause() {
      isPaused = !isPaused;
      pauseBtn.style.opacity = isPaused ? "0.65" : "1";
      statusMain.textContent = isPaused ? "Interview paused." :
        currentState === STATES.USER ? "Listening..." :
        currentState === STATES.THINKING ? "Analyzing your answer..." :
        "AI is speaking...";
    }

    function leaveInterview() {
      clearInterval(totalTimer);
      clearInterval(speechTimer);
      clearInterval(window.metricInterval);
      clearInterval(window.transcriptInterval);
      stopSpeechRecognition();
      stopWaveAnimation();

      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      if (audioContext && audioContext.state !== "closed") audioContext.close();

      setState(STATES.ENDED);
      questionText.textContent = "Interview ended.";
      subcopy.textContent = "The session has been closed.";
      orbLabel.textContent = "Session complete";
      statusMain.textContent = "Interview ended.";
      statusSub.textContent = "You can now review your report.";
      camFallback.style.display = "grid";
      video.style.display = "none";
      reportScreen.classList.add("show");

      [muteBtn, pauseBtn, leaveBtn].forEach(btn => btn.disabled = true);
    }

    muteBtn.addEventListener("click", toggleMute);
    pauseBtn.addEventListener("click", togglePause);
    leaveBtn.addEventListener("click", leaveInterview);

    window.addEventListener("resize", () => {
      resizeCanvas();
      if (!analyser || currentState !== STATES.USER) drawIdleWave(currentState === STATES.THINKING);
    });

    async function init() {
      resizeCanvas();
      drawIdleWave(true);
      startGlobalTimer();
      await setupMedia();
      setupSpeechRecognition();
      runSequence();

      setTimeout(async () => {
        if (currentState === STATES.USER) {
          await goThinking();
        }
      }, 15000);
    }

    init();