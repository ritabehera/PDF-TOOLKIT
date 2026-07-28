/**
 * Web Speech API & Multilingual AI Voice Assistant Engine
 * Supports: Text-to-Speech (TTS), Voice Commands (English, Hindi, Odia), and Browser Fallback
 */

let recognition = null;
let isVoiceActive = false;

function speakResponse(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const activeLang = localStorage.getItem('pdf_lang') || 'en';
    if (activeLang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

function initVoiceAssistant() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    openVoiceModalFallback('Speech recognition is not supported in this browser. Type voice command:');
    return false;
  }

  try {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    const activeLang = localStorage.getItem('pdf_lang') || 'en';
    if (activeLang === 'hi') recognition.lang = 'hi-IN';
    else if (activeLang === 'or') recognition.lang = 'or-IN';
    else recognition.lang = 'en-US';

    recognition.onstart = () => {
      isVoiceActive = true;
      const bar = document.getElementById('voiceFloatingBar');
      const txt = document.getElementById('voiceStatusText');
      if (bar) bar.style.display = 'flex';
      if (txt) txt.textContent = '🎙️ Listening... Say a command (e.g., "Merge PDF", "Compress", "Dark Mode").';
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      const txt = document.getElementById('voiceStatusText');
      if (txt) txt.textContent = `Recognized: "${transcript}"`;

      parseVoiceCommand(transcript);
      setTimeout(stopVoiceAssistant, 2000);
    };

    recognition.onerror = (e) => {
      console.warn('Voice recognition error:', e.error);
      const txt = document.getElementById('voiceStatusText');
      if (txt) txt.textContent = `Could not recognize voice (${e.error}). Try again.`;
      setTimeout(stopVoiceAssistant, 2500);
    };

    recognition.onend = () => {
      if (isVoiceActive) stopVoiceAssistant();
    };

    return true;
  } catch (err) {
    console.warn('Failed to initialize speech recognition:', err);
    openVoiceModalFallback('Microphone access restricted. Enter command:');
    return false;
  }
}

function parseVoiceCommand(cmd) {
  cmd = cmd.toLowerCase().trim();

  if (cmd.includes('merge') || cmd.includes('मर्ज') || cmd.includes('ଜୋଡ଼')) {
    if (typeof switchTool === 'function') switchTool('merge');
    speakResponse('Opening Merge PDF tool');
    if (typeof showToast === 'function') showToast('Switched to Merge PDF', 'info');
  } else if (cmd.includes('split') || cmd.includes('अलग') || cmd.includes('ଅଲଗା')) {
    if (typeof switchTool === 'function') switchTool('split');
    speakResponse('Opening Split PDF tool');
    if (typeof showToast === 'function') showToast('Switched to Split PDF', 'info');
  } else if (cmd.includes('compress') || cmd.includes('कंप्रेस') || cmd.includes('छोटा') || cmd.includes('କମ୍ପ୍ରେସ')) {
    if (typeof switchTool === 'function') switchTool('compress');
    speakResponse('Opening Compress PDF tool');
    if (typeof showToast === 'function') showToast('Switched to Compress PDF', 'info');
  } else if (cmd.includes('summary') || cmd.includes('summarize') || cmd.includes('समरी') || cmd.includes('ସାରାଂଶ')) {
    if (typeof switchTool === 'function') switchTool('ai-summary');
    speakResponse('Opening AI Summary tool');
    if (typeof showToast === 'function') showToast('Switched to AI Summary', 'info');
  } else if (cmd.includes('chat') || cmd.includes('चैट') || cmd.includes('ଚାଟ୍')) {
    if (typeof switchTool === 'function') switchTool('ai-chat');
    speakResponse('Opening AI PDF Chat');
    if (typeof showToast === 'function') showToast('Switched to AI Chat with PDF', 'info');
  } else if (cmd.includes('ocr') || cmd.includes('image to text') || cmd.includes('छवि से पाठ')) {
    if (typeof switchTool === 'function') switchTool('ocr');
    speakResponse('Opening OCR Image to Text');
    if (typeof showToast === 'function') showToast('Switched to OCR tool', 'info');
  } else if (cmd.includes('dark') || cmd.includes('light') || cmd.includes('theme') || cmd.includes('थीम')) {
    document.getElementById('themeToggleBtn')?.click();
    speakResponse('Theme switched');
  } else if (cmd.includes('dashboard') || cmd.includes('home') || cmd.includes('होम')) {
    if (typeof switchTool === 'function') switchTool('dashboard');
    speakResponse('Navigating to Dashboard');
  } else {
    speakResponse(`Executing command ${cmd}`);
    if (typeof showToast === 'function') showToast(`Voice Command: "${cmd}"`, 'info');
  }
}

function toggleVoiceAssistant() {
  if (isVoiceActive) {
    stopVoiceAssistant();
  } else {
    if (!recognition && !initVoiceAssistant()) return;
    try {
      recognition.start();
    } catch (err) {
      console.warn('Recognition start failed:', err);
      // Restart instance
      recognition = null;
      if (initVoiceAssistant()) {
        try { recognition.start(); } catch (e) { openVoiceModalFallback('Click to execute voice command:'); }
      }
    }
  }
}

function stopVoiceAssistant() {
  isVoiceActive = false;
  const bar = document.getElementById('voiceFloatingBar');
  if (bar) bar.style.display = 'none';
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }
}

function openVoiceModalFallback(title) {
  const cmd = prompt(title || 'Type voice command (e.g. merge, compress, dark mode, ai chat):', 'compress');
  if (cmd) {
    parseVoiceCommand(cmd);
  }
}

// Make globally accessible
window.toggleVoiceAssistant = toggleVoiceAssistant;
window.stopVoiceAssistant = stopVoiceAssistant;

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('voiceAssistantBtn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleVoiceAssistant();
    });
  }
});
