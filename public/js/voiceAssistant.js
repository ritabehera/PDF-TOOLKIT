/**
 * Web Speech API Voice Command Assistant
 */

let recognition = null;
let isVoiceActive = false;

function initVoiceAssistant() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast('Speech recognition is not supported in this browser.', 'warning');
    return false;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => {
    isVoiceActive = true;
    document.getElementById('voiceFloatingBar').style.display = 'flex';
    document.getElementById('voiceStatusText').textContent = 'Listening for voice command...';
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.toLowerCase();
    document.getElementById('voiceStatusText').textContent = `Recognized: "${transcript}"`;

    parseVoiceCommand(transcript);

    setTimeout(stopVoiceAssistant, 2000);
  };

  recognition.onerror = (e) => {
    document.getElementById('voiceStatusText').textContent = 'Could not recognize voice. Try again.';
    setTimeout(stopVoiceAssistant, 2000);
  };

  recognition.onend = () => {
    if (isVoiceActive) stopVoiceAssistant();
  };

  return true;
}

function parseVoiceCommand(cmd) {
  if (cmd.includes('merge')) {
    switchTool('merge');
    showToast('Switched to Merge PDF', 'info');
  } else if (cmd.includes('split')) {
    switchTool('split');
    showToast('Switched to Split PDF', 'info');
  } else if (cmd.includes('compress')) {
    switchTool('compress');
    showToast('Switched to Compress PDF', 'info');
  } else if (cmd.includes('summary') || cmd.includes('summarize')) {
    switchTool('ai-summary');
    showToast('Switched to AI PDF Summary', 'info');
  } else if (cmd.includes('chat')) {
    switchTool('ai-chat');
    showToast('Switched to AI Chat with PDF', 'info');
  } else if (cmd.includes('dark') || cmd.includes('light') || cmd.includes('theme')) {
    document.getElementById('themeToggleBtn')?.click();
  } else if (cmd.includes('dashboard') || cmd.includes('home')) {
    switchTool('dashboard');
  } else {
    showToast(`Voice command received: "${cmd}"`, 'info');
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
      stopVoiceAssistant();
    }
  }
}

function stopVoiceAssistant() {
  isVoiceActive = false;
  document.getElementById('voiceFloatingBar').style.display = 'none';
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('voiceAssistantBtn');
  if (btn) btn.addEventListener('click', toggleVoiceAssistant);
});
