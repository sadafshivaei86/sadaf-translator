// SADAF Voice Translator Logic

const micBtn = document.getElementById('mic-btn');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const toggle = document.getElementById('direction-toggle');
const sourceLabel = document.getElementById('lang-source');
const targetLabel = document.getElementById('lang-target');
const video = document.getElementById('webcam');
const subtitleText = document.getElementById('subtitle-text');

let recognition;
let isRecording = false;

// Initialize Speech Recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('active');
        sourceText.innerText = "Listening...";
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const currentText = finalTranscript || interimTranscript;
        sourceText.innerText = currentText;
        subtitleText.innerText = currentText; // Show what we hear as subtitle first

        if (finalTranscript) {
            translateText(finalTranscript);
        }
    };

    recognition.onerror = (event) => {
        console.error("Recognition Error:", event.error);
        stopRecording();
    };

    recognition.onend = () => {
        if (isRecording) {
            recognition.start(); // Auto-restart for continuous listening
        }
    };
} else {
    sourceText.innerText = "Speech recognition not supported in this browser.";
}

// Toggle logic
toggle.addEventListener('change', () => {
    const isFiToEn = toggle.checked;
    sourceLabel.innerText = isFiToEn ? "Finnish" : "English";
    targetLabel.innerText = isFiToEn ? "English" : "Finnish";
    recognition.lang = isFiToEn ? 'fi-FI' : 'en-US';
    
    // Clear fields on toggle
    sourceText.innerText = "Click to start...";
    targetText.innerText = "Translation results...";
});

// Set initial language
recognition.lang = 'en-US';

function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    try {
        recognition.start();
        micBtn.classList.add('active');
        isRecording = true;
    } catch (e) {
        console.error("Recognition already started or error:", e);
    }
}

function stopRecording() {
    isRecording = false;
    recognition.stop();
    micBtn.classList.remove('active');
    sourceText.innerText = "Click to start...";
}

micBtn.addEventListener('click', toggleRecording);

// Camera initialization
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
    } catch (error) {
        console.error("Camera access error:", error);
        subtitleText.innerText = "Camera access denied or not available.";
    }
}

initCamera();

// Translation function using MyMemory API (Free, no key required for basic usage)
async function translateText(text) {
    const isFiToEn = toggle.checked;
    const sourceLang = isFiToEn ? 'fi' : 'en';
    const targetLang = isFiToEn ? 'en' : 'fi';
    
    targetText.innerText = "Translating...";

    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();
        
        if (data.responseData) {
            const translated = data.responseData.translatedText;
            targetText.innerText = translated;
            subtitleText.innerText = translated; // Update subtitle with translated text
        } else {
            targetText.innerText = "Translation error.";
        }
    } catch (error) {
        console.error("Translation Error:", error);
        targetText.innerText = "Failed to connect to translation service.";
    }
}
