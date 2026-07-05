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

const avatarShell = document.getElementById("avatarShell");
const wavePath = document.getElementById("wavePath");

let stream = null;
let elapsed = 0;
let timer = null;
let transcriptTimer = null;
let thinkingTimer = null;

let currentQuestion = "";

let interviewRunning = true;
let answerTimeout = null;

let recognition = null;
let isListening = false;

let avatarWaveFrame = null;
let avatarWavePhase = 0;
let aiSpeaking = false;
let waveIntensity = 0.18;

const transcriptLines = [
  "Hi, I'm Vansh. I enjoy building AI-powered products that solve practical problems.",
  "Recently, I've been focused on backend systems, full stack interfaces, and interview-focused experiences.",
  "I like building products where the intelligence stays powerful but the interface stays simple.",
  "For me, good software is not just functional — it should also feel intentional and calm to use."
];

async function getAIQuestion(role, experience) {
  try {
    const response = await fetch(
      "http://localhost:8080/api/interview/start",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role,
          experience
        })
      }
    );

    const data = await response.json();
    return data.question;

  } catch (error) {
    console.error(error);
    return "Sorry, I couldn't generate a question.";
  }
}

async function getNextAIQuestion(previousQuestion, answer) {

    try {

        const response = await fetch(
            "http://localhost:8080/api/interview/next",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: previousQuestion,
                    answer: answer
                })
            }
        );

        const data = await response.json();

        return data.question;

    } catch (error) {

        console.error(error);

        return "Sorry, I couldn't generate the next question.";
    }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showScreen(screen) {
  [connectScreen, introScreen, roomScreen, reportScreen].forEach(s => {
    if (s) s.classList.remove("active");
  });
  if (screen) screen.classList.add("active");
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function buildWaveCirclePath(cx, cy, baseR, amp, points = 64) {
  let d = "";

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const angle = t * 360;
    const pulseA = Math.sin((t * Math.PI * 2 * 6) + avatarWavePhase) * amp;
    const pulseB = Math.sin((t * Math.PI * 2 * 11) - avatarWavePhase * 1.2) * (amp * 0.45);
    const radius = baseR + pulseA + pulseB;
    const { x, y } = polarToCartesian(cx, cy, radius, angle);
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  return d + " Z";
}

function animateAvatarWave() {
  if (!wavePath) return;

  avatarWavePhase += aiSpeaking ? 0.18 : 0.05;
  waveIntensity += ((aiSpeaking ? 5.5 : 1.5) - waveIntensity) * 0.08;

  const path = buildWaveCirclePath(110, 110, 84, waveIntensity, 72);
  wavePath.setAttribute("d", path);

  avatarWaveFrame = requestAnimationFrame(animateAvatarWave);
}

function setAvatarState(state) {
  if (!avatarShell) return;

  avatarShell.classList.remove("speaking", "listening");
  avatarShell.classList.add(state);
  aiSpeaking = state === "speaking";
}

function startSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    console.log("Listening...");
    isListening = true;
  };

  recognition.onresult = (event) => {

    let transcript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    if (liveTranscript) {
      liveTranscript.textContent = transcript;
    }
  };

  recognition.onerror = (event) => {

    console.log("Speech Error:", event.error);

    if (event.error !== "aborted") {
        recognition.stop();
    }
};

  recognition.onend = () => {
    console.log("Speech Recognition ended");

    isListening = false;

    if (interviewRunning) {
        console.log("Restarting Speech Recognition...");
        recognition.start();
    }
};

  recognition.start();
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (selfVideo) selfVideo.style.display = "none";
    if (selfPlaceholder) selfPlaceholder.style.display = "grid";
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    if (selfVideo) {
      selfVideo.srcObject = stream;
      selfVideo.style.display = "block";
      selfVideo.style.opacity = "1";
    }

    if (selfPlaceholder) {
      selfPlaceholder.style.display = "none";
    }
  } catch (error) {
    console.error("Camera access failed:", error);
    if (selfVideo) selfVideo.style.display = "none";
    if (selfPlaceholder) selfPlaceholder.style.display = "grid";
  }
}

function startElapsedTime() {
  elapsed = 0;
  if (elapsedTime) elapsedTime.textContent = "00:00";

  clearInterval(timer);
  timer = setInterval(() => {
    elapsed += 1;
    const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");
    if (elapsedTime) elapsedTime.textContent = `${mins}:${secs}`;
  }, 1000);
}

function startLiveTranscript() {
  let index = 0;
  if (liveTranscript) liveTranscript.textContent = "";

  clearInterval(transcriptTimer);
  transcriptTimer = setInterval(() => {
    if (index < transcriptLines.length && liveTranscript) {
      liveTranscript.textContent = transcriptLines[index];
      index += 1;
    } else {
      clearInterval(transcriptTimer);
    }
  }, 3000);
}

async function continueInterview() {

    if (!interviewRunning) return;

    setAvatarState("listening");

    // Give the candidate time to answer
    await wait(10000);

    if (!interviewRunning) return;

    if (thinkingText) {
        thinkingText.classList.add("show");
        thinkingText.textContent = "Thinking...";
    }

    await wait(2500);

    if (thinkingText) {
        thinkingText.classList.remove("show");
    }

    setAvatarState("speaking");

    const nextQuestion = await getNextAIQuestion(
        currentQuestion,
        liveTranscript.textContent
    );

    currentQuestion = nextQuestion;

    if (questionText) {
        questionText.textContent = nextQuestion;
    }

    if (liveTranscript) {
        liveTranscript.textContent = "";
    }

    await wait(2500);

    // Repeat forever until End Interview
    continueInterview();
}

function stopMedia() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function endInterview() {
  interviewRunning = false;

clearTimeout(answerTimeout);
  clearInterval(timer);
  clearInterval(transcriptTimer);
  clearTimeout(thinkingTimer);

  if (avatarWaveFrame) {
    cancelAnimationFrame(avatarWaveFrame);
    avatarWaveFrame = null;
  }

  stopMedia();
  showScreen(reportScreen);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function restartInterview() {
  window.location.reload();
}

async function runSequence() {
  try {
    showScreen(connectScreen);
    if (connectStatus) {
      connectStatus.textContent = "Connecting to interviewer...";
    }

    await wait(1400);
    if (connectStatus) {
      connectStatus.innerHTML = '<span class="tick">✓ Connected</span>';
    }

    await wait(900);
    showScreen(introScreen);

    await wait(500);
    if (introAvatar) introAvatar.classList.add("show");
    setAvatarState("speaking");

    await wait(700);
    if (introLine1) introLine1.classList.add("show");

    await wait(900);
    if (introLine2) introLine2.classList.add("show");

    await wait(900);
    if (introLine3) introLine3.classList.add("show");

    await wait(1200);
    setAvatarState("listening");

    showScreen(roomScreen);

    startCamera();
startElapsedTime();
console.log("Calling speech recognition...");
startSpeechRecognition();

    await wait(1800);

setAvatarState("speaking");

const firstQuestion = await getAIQuestion(
    "Java Developer",
    "2 years"
);

currentQuestion = firstQuestion;

if (questionText) {
    questionText.textContent = firstQuestion;
}

await wait(2200);

setAvatarState("listening");

    await wait(7000);
continueInterview();
  } catch (error) {
    console.error("runSequence failed:", error);
    if (connectStatus) {
      connectStatus.innerHTML = '<span style="color:#ff8585;">Startup error. Check console.</span>';
    }
  }
}

if (micBtn) {
  micBtn.addEventListener("click", () => {
    if (!stream) return;

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) return;

    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    micBtn.style.background = audioTracks[0].enabled
      ? "rgba(255,255,255,0.04)"
      : "rgba(255,107,107,0.12)";
  });
}

if (camBtn) {
  camBtn.addEventListener("click", () => {
    if (!stream) return;

    const videoTracks = stream.getVideoTracks();
    if (!videoTracks.length) return;

    videoTracks.forEach(track => {
      track.enabled = !track.enabled;
    });

    const enabled = videoTracks[0].enabled;

    if (selfVideo) selfVideo.style.opacity = enabled ? "1" : "0.2";
    camBtn.style.background = enabled
      ? "rgba(255,255,255,0.04)"
      : "rgba(255,107,107,0.12)";
  });
}

if (endBtn) endBtn.addEventListener("click", endInterview);
if (restartBtn) restartBtn.addEventListener("click", restartInterview);

if (avatarShell && wavePath) {
  setAvatarState("listening");
  animateAvatarWave();
}

runSequence();