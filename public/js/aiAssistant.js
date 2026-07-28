/**
 * AI PDF Chat Side Panel & Interactive Assistant Manager
 */

let activeAiPdfFile = null;

document.addEventListener('DOMContentLoaded', () => {
  const chatFileInput = document.getElementById('chatFileInput');
  const chatFileInfo = document.getElementById('chatFileInfo');
  const chatInput = document.getElementById('chatInput');
  const sendChatBtn = document.getElementById('sendChatBtn');

  if (!chatFileInput) return;

  chatFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      activeAiPdfFile = e.target.files[0];
      chatFileInfo.textContent = `Attached: ${activeAiPdfFile.name}`;
      chatFileInfo.style.color = 'var(--success)';
      showToast(`Attached ${activeAiPdfFile.name} to AI context`, 'success');
    }
  });

  const sendUserMessage = async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    if (!activeAiPdfFile) {
      showToast('Please attach a PDF document first.', 'warning');
      return;
    }

    appendChatMessage('user', question);
    chatInput.value = '';

    // Render loading indicator
    const loadingId = appendChatMessage('system', 'Reading document & extracting answer...');

    const formData = new FormData();
    formData.append('file', activeAiPdfFile);
    formData.append('question', question);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      removeChatMessage(loadingId);

      if (data.result && data.result.answer) {
        appendChatMessage('system', data.result.answer);
      } else {
        appendChatMessage('system', 'Sorry, I could not process your query on this document.');
      }
    } catch (err) {
      removeChatMessage(loadingId);
      appendChatMessage('system', 'Network error. Please try again.');
    }
  };

  sendChatBtn?.addEventListener('click', sendUserMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendUserMessage();
  });
});

function sendQuickPrompt(promptText) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = promptText;
    document.getElementById('sendChatBtn')?.click();
  }
}

function appendChatMessage(sender, text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msgId = 'msg_' + Date.now();
  const div = document.createElement('div');
  div.id = msgId;
  div.className = `message ${sender === 'user' ? 'user-message' : 'system-message'}`;

  const icon = sender === 'user' ? 'fa-user' : 'fa-robot';

  div.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid ${icon}"></i></div>
    <div class="msg-bubble">${text.replace(/\n/g, '<br/>')}</div>
  `;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return msgId;
}

function removeChatMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
