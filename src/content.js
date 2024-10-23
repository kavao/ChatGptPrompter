console.log('ChatGPT Prompt Manager content script loaded at:', new Date().toISOString());

// 即時実行関数を使用してスクリプトが実行されたことを確認
(function() {
  console.log('Content script IIFE executed');
})();

// MutationObserver を使用して動的に追加される要素を監視
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      console.log('New nodes added to the DOM');
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// ページ読み込み完了時にコンソールにメッセージを出力
window.addEventListener('load', () => {
  chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });
});

  function getPromptField() {
    // 複数のセレクタを試行
    const selectors = [
      '#prompt-textarea',
      '.ProseMirror[contenteditable="true"]',
      'div[data-placeholder="ChatGPT にメッセージを送信する"]',      
      // 'textarea[data-id="root"]',
      // 'textarea[placeholder="Send a message"]',
      // 'textarea[placeholder="ChatGPT にメッセージを送信する"]',
      // 'textarea.w-full',
      // 他の可能性のあるセレクタを追加
    ];
  
    for (let selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
  
    console.error('Prompt field not found');
    return null;
  }

  // function injectPrompt(prompt) {
  //   console.log('Attempting to inject prompt:', prompt);
  //   const textarea = document.querySelector('#prompt-textarea');
  //   if (textarea) {
  //     console.log('Textarea found:', textarea);
  //     textarea.value = prompt;
  //     textarea.dispatchEvent(new Event('input', { bubbles: true }));
  //     console.log('Event dispatched');
  //     return { success: true, message: 'Prompt injected successfully' };
  //   } else {
  //     console.error('Textarea not found');
  //     return { success: false, message: 'Textarea not found' };
  //   }
  // }

  function injectPrompt(prompt) {
    console.log('Attempting to inject prompt:', prompt);
    const promptField = getPromptField();
    if (promptField) {
      // ProseMirrorの内容を更新
      promptField.querySelector('p').textContent = prompt;
      
      // 入力イベントをディスパッチ
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
      });
      promptField.dispatchEvent(inputEvent);
      
      console.log('Prompt injected and event dispatched');
      return { success: true, message: 'Prompt injected successfully' };
    } else {
      console.error('Prompt field not found');
      return { success: false, message: 'Prompt field not found' };
    }
  }

  function fetchPrompt() {
    const promptField = getPromptField();
    if (promptField) {
      // return { prompt: promptField.value };
      return { prompt: promptField.querySelector('p').textContent };
    } else {
      console.error('Prompt field not found');
      return { prompt: '' };
    }
  }

  // function sendPrompt() {
  //   const promptField = getPromptField();
  //   if (!promptField) {
  //     console.error('Prompt field not found');
  //     return { success: false, error: 'プロンプトフィールドが見つかりません' };
  //   }

  //   // ChatGPTの送信ボタンを探して自動クリック
  //   const sendButton = document.querySelector('button[data-testid="send-button"]');
  //   if (sendButton) {
  //     sendButton.click();
  //     return { success: true };
  //   } else {
  //     return { success: false, error: '送信ボタンが見つかりません' };
  //   }
  // }

  function executePrompt(prompt) {
    console.log('Attempting to execute prompt:', prompt);
    const textarea = document.querySelector('#prompt-textarea');
    if (textarea) {
      textarea.value = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 送信ボタンを探して自動クリック
      const sendButton = document.querySelector('button[data-testid="send-button"]');
      if (sendButton) {
        sendButton.click();
        return { success: true, message: 'Prompt executed successfully' };
      } else {
        console.error('Send button not found');
        return { success: false, message: 'Send button not found' };
      }
    } else {
      console.error('Textarea not found');
      return { success: false, message: 'Textarea not found' };
    }
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message received in content script:', request);
    if (request.action === 'ping') {
      sendResponse({ status: 'ok' });
    } else if (request.action === "checkContentScript") {
      sendResponse({status: "Content script is active"});
    } else if (request.action === "injectPrompt") {
      const result = injectPrompt(request.prompt);
      console.log('Injection result:', result);
      sendResponse(result);
    } else if (request.action === "fetchPrompt") {
      const result = fetchPrompt();
      console.log('fetch result:', result);
      sendResponse(result);
    } else if (request.action === "clearPrompts") {
      const promptField = getPromptField();
      
      if (promptField) {
        promptField.querySelector('p').textContent = '';
        // promptField.value = '';
        promptField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      sendResponse({success: true});
    } else if (request.action === "executePrompt") {
      const result = executePrompt(request.prompt);
      console.log('Execution result:', result);
      sendResponse(result);
    }
    // if (request.action === "sendPrompt") {
    //   console.log('Received sendPrompt request');
    //   const result = sendPrompt();
    //   console.log('Send result:', result);
    //   sendResponse(result);
    // }

    return true;  // 非同期レスポンスのために必要
  });

  console.log('ChatGPT Prompt Manager content script loaded');


console.log('Current DOM structure:', document.body.innerHTML);