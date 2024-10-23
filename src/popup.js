document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM fully loaded');

  function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`Element with id "${id}" not found`);
    }
    return element;
  }
  const styleSelect = getElement('styleSelect');
  const tempPromptArea = getElement('tempPromptArea');
  const styleTitleInput = getElement('styleTitleInput');
  const saveStyleButton = getElement('saveStyle');
  const deleteStyleButton = getElement('deleteStyle');
  const injectPromptButton = getElement('injectPrompt');
  const fetchPromptButton = getElement('fetchPrompt');
  const exportStylesButton = getElement('exportStyles');
  const importStylesButton = getElement('importStyles');
  const openOptionsButton = getElement('openOptions');
  const importFileInput = getElement('importFile');
  const finalPrompt = getElement('finalPrompt');
  const helpButton = getElement('helpButton');
  const helpModal = getElement('helpModal');
  const closeButton = helpModal ? helpModal.querySelector('.close') : null;
  const clearPromptsButton = getElement('clearPrompts');
  const executePromptButton = getElement('executePrompt');
  // const generateSingleButton = getElement('generateSingle');
  // const generateMultipleButton = getElement('generateMultiple');
  // const generateCountSelect = getElement('generateCount');
  // const generateCountOptions = [2, 3, 4, 5, 10];

  let currentLanguage = 'ja';  // デフォルト言語を日本語に設定

  const translations = {
    en: {
      saveStyle: "Save Style",
      deleteStyle: "Delete Style",
      injectPrompt: "Inject to ChatGPT",
      fetchPrompt: "Fetch from ChatGPT",
      openOptions: "Open Settings",
      exportStyles: "Export Styles",
      importStyles: "Import Styles",
      savedStyles: "Saved Styles (Multiple selection possible)",
      tempPrompt: "Temporary Prompt",
      // tempExclude: "Temporary Exclude",
      finalPrompt: "Final Prompt",
      // finalExclude: "Final Exclude",
      clearPrompts: "Clear Prompts",
      // generateSingle: "Generate Single",
      loadToTemp: "Edit Style",
      styleTitleInput: "Style Title",
      openChatGPT: "Open ChatGPT",
      help: "Help",
      openOptions: "Open Settings",
      // generateMultiple: "Generate Multiple",
      // generateCount: (count) => `${count} image${count > 1 ? 's' : ''}`
    },
    ja: {
      saveStyle: "スタイルを保存",
      deleteStyle: "スタイルを削除",
      injectPrompt: "ChatGPTに注入",
      fetchPrompt: "ChatGPTから取得",
      openOptions: "設定を開く",
      exportStyles: "スタイルをエクスポート",
      importStyles: "スタイルをインポート",
      savedStyles: "保存されたスタイル (複数選択可能)",
      tempPrompt: "一時的なプロンプト",
      // tempExclude: "一時的な除外要素",
      finalPrompt: "最終プロンプト",
      // finalExclude: "最終除外要素",
      clearPrompts: "プロンプトをクリア",
      // generateSingle: "1枚生成",
      loadToTemp: "スタイルを編集",
      styleTitleInput: "スタイルタイトル",
      openChatGPT: "ChatGPTを開く",
      help: "ヘルプ",
      openOptions: "設定を開く",
      // generateMultiple: "複数枚生成",
      // generateCount: (count) => `${count}枚`
    }
  };

  // 拡張機能の情報をログに出力
  chrome.management.getSelf(function(info) {
    console.log('Extension info:', info);
  });

  // 現在のタブの情報を取得
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      console.log('Current tab:', tabs[0]);
    } else {
      console.error('No active tab found');
    }
  });

  function updateFinalPrompt() {
    const selectedStyles = Array.from(styleSelect.selectedOptions).map(option => option.value);
    chrome.storage.local.get(['savedStyles'], function(result) {
      const savedStyles = result.savedStyles || {};
      let combinedPrompt = tempPromptArea.value.trim();
  
      selectedStyles.forEach(title => {
        const style = savedStyles[title];
        if (style && style.prompt) {
          if (combinedPrompt) {
            combinedPrompt += ', ';
          }
          combinedPrompt += style.prompt;
        }
      });
  
      finalPrompt.textContent = combinedPrompt;
    });
  }

  function saveFormState() {
    const formState = {
      styleSelect: Array.from(styleSelect.selectedOptions).map(option => option.value),
      tempPromptArea: tempPromptArea.value,
      // tempExcludeArea: tempExcludeArea.value,
      styleTitleInput: styleTitleInput.value,
      // generateCountSelect: generateCountSelect.value,
    };
    chrome.storage.local.set({ formState: formState });
    updateFinalPrompt();
  }

  function restoreFormState() {
    chrome.storage.local.get(['formState'], function(result) {
      if (result.formState) {
        tempPromptArea.value = result.formState.tempPromptArea || '';
        // tempExcludeArea.value = result.formState.tempExcludeArea || '';
        styleTitleInput.value = result.formState.styleTitleInput || '';
        // generateCountSelect.value = result.formState.generateCountSelect || '';
        if (result.formState.styleSelect) {
          result.formState.styleSelect.forEach(value => {
            const option = styleSelect.querySelector(`option[value="${value}"]`);
            if (option) option.selected = true;
          });
        }
        updateFinalPrompt();
      }
    });
  }

  [styleSelect, tempPromptArea, styleTitleInput].forEach(el => {
    el.addEventListener('input', saveFormState);
    el.addEventListener('change', saveFormState);
  });

  restoreFormState();

  function updateLanguage() {
    chrome.storage.sync.get(['language'], function(result) {
      currentLanguage = result.language || 'ja';
      updateLabels();
    });
  }
  
  // function updateGenerateCountOptions(lang) {
  //   const select = document.getElementById('generateCount');
  //   select.innerHTML = ''; // 既存のオプションをクリア
    
  //   generateCountOptions.forEach(count => {
  //     const option = document.createElement('option');
  //     option.value = count;
  //     option.textContent = translations[lang].generateCount
  //       ? translations[lang].generateCount(count)
  //       : `${count} ${lang === 'ja' ? '枚' : 'image(s)'}`;
  //     select.appendChild(option);
  //   });
  // }

  function updateLanguage(lang) {
    currentLanguage = lang;
    
    // 存在する要素のみを更新
    const elementsToUpdate = {
      'savedStylesLabel': 'savedStyles',
      'finalPromptLabel': 'finalPrompt',
      // 'finalExcludeLabel': 'finalExclude',
      'saveStyle': 'saveStyle',
      'deleteStyle': 'deleteStyle',
      'injectPrompt': 'injectPrompt',
      'fetchPrompt': 'fetchPrompt',
      'exportStyles': 'exportStyles',
      'importStyles': 'importStyles',
      'clearPrompts': 'clearPrompts',
      // 'generateSingle': 'generateSingle',
      'loadToTemp': 'loadToTemp',
      // 'generateMultiple':'generateMultiple',
      // 'generateCount':'generateCount'
    };
  
    for (const [elementId, translationKey] of Object.entries(elementsToUpdate)) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = translations[lang][translationKey];
      }
    }
  
    // アイコンボタンのタイトル（ツールチップ）を更新
    const iconButtonsToUpdate = {
      'openChatGPT': 'openChatGPT',
      'helpButton': 'help',
      'openOptions': 'openOptions'
    };
  
    for (const [elementId, translationKey] of Object.entries(iconButtonsToUpdate)) {
      const element = document.getElementById(elementId);
      if (element) {
        element.title = translations[lang][translationKey];
      }
    }

    // updateGenerateCountOptions(lang);
  }

  // 言語設定を読み込み、UIを更新する
  chrome.storage.sync.get(['language'], function(result) {
    const lang = result.language || 'ja';
    updateLanguage(lang);
  });

  function loadSavedStyles() {
    chrome.storage.local.get(['savedStyles'], function(result) {
      const savedStyles = result.savedStyles || {};
      styleSelect.innerHTML = '';
      const sortedTitles = Object.keys(savedStyles).sort((a, b) => a.localeCompare(b));
      for (const title of sortedTitles) {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        styleSelect.appendChild(option);
      }
      restoreFormState();
    });
  }

  loadSavedStyles();

  saveStyleButton.addEventListener('click', function() {
    const title = styleTitleInput.value.trim();
    const prompt = finalPrompt.textContent;
    // const exclude = finalExclude.textContent;
    if (title && (prompt)) {
      chrome.storage.local.get(['savedStyles'], function(result) {
        const savedStyles = result.savedStyles || {};
        savedStyles[title] = { prompt };
        chrome.storage.local.set({savedStyles: savedStyles}, function() {
          loadSavedStyles();
          styleTitleInput.value = '';
          saveFormState();
        });
      });
    }
  });

  deleteStyleButton.addEventListener('click', function() {
    const selectedTitles = Array.from(styleSelect.selectedOptions).map(option => option.value);
    if (selectedTitles.length > 0) {
      chrome.storage.local.get(['savedStyles'], function(result) {
        const savedStyles = result.savedStyles || {};
        selectedTitles.forEach(title => delete savedStyles[title]);
        chrome.storage.local.set({savedStyles: savedStyles}, function() {
          loadSavedStyles();
          saveFormState();
        });
      });
    }
  });

  function injectPrompt() {
    const prompt = finalPrompt.textContent.trim();
    console.log('Attempting to inject prompt:', prompt);
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        console.error('No active tab found');
        alert('アクティブなタブが見つかりません');
        return;
      }
  
      const activeTab = tabs[0];
      console.log('Active tab:', activeTab);
      
      try {
        chrome.tabs.sendMessage(activeTab.id, {action: "injectPrompt", prompt: prompt}, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            alert(`メッセージ送信エラー: ${chrome.runtime.lastError.message}\n\nタブURL: ${activeTab.url}\n\n拡張機能をリロードし、ページを更新してから再試行してください。`);
          } else if (response && response.success) {
            console.log('Prompt injected successfully');
            // alert('プロンプトが正常に注入されました');
          } else {
            console.error('Failed to inject prompt:', response);
            alert(`プロンプトの注入に失敗しました: ${JSON.stringify(response)}`);
          }
        });
      } catch (error) {
        console.error('Exception in sendMessage:', error);
        alert(`例外が発生しました: ${error.message}`);
      }
    });
  }

  // 拡張機能のポップアップが開かれたときにコンテンツスクリプトの存在を確認
  document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "checkContentScript"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Content script not found:', chrome.runtime.lastError);
            alert('コンテンツスクリプトが見つかりません。拡張機能をリロードし、ページを更新してください。');
          } else {
            console.log('Content script found');
          }
        });
      }
    });
  });
  
  document.getElementById('injectPrompt').addEventListener('click', injectPrompt);
  
  function showError(message) {
    console.error(message);
    alert(message); // または他の方法でユーザーにエラーを表示
  }

  fetchPromptButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "fetchPrompt"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            alert('Error: Unable to communicate with the page. Please make sure you are on the ChatGPT website.');
          } else if (response && response.prompt) {
            tempPromptArea.value = response.prompt;
            // tempExcludeArea.value = response.exclude || '';
            saveFormState();
          } else {
            alert('Failed to fetch prompt. Please try again.');
          }
        });
      } else {
        alert('No active tab found. Please make sure you are on the ChatGPT website.');
      }
    });
  });

  exportStylesButton.addEventListener('click', function() {
    chrome.storage.local.get(['savedStyles'], function(result) {
      const savedStyles = result.savedStyles || {};
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedStyles));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "ChatGPT_styles.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  });

  importStylesButton.addEventListener('click', function() {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedStyles = JSON.parse(e.target.result);
          chrome.storage.local.get(['savedStyles'], function(result) {
            const currentStyles = result.savedStyles || {};
            const mergedStyles = { ...currentStyles, ...importedStyles };
            chrome.storage.local.set({ savedStyles: mergedStyles }, function() {
              loadSavedStyles();
              // alert('Styles imported successfully!');
            });
          });
        } catch (error) {
          console.error('Error parsing imported file:', error);
          alert('Error importing styles. Please make sure the file is valid.');
        }
      };
      reader.readAsText(file);
    }
  });

  openOptionsButton.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('openChatGPT').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://chatgpt.com/' });
  });

  function setHelpContent() {
    const helpContent = `
    <h2>How to use ChatGPT Prompt Manager / ChatGPT Prompt Manager の使い方</h2>
    <h2>How to use ChatGPT Prompt Manager / ChatGPT Prompt Manager の使い方</h2>
    <h3>English</h3>
    <p>1. Save your favorite prompts as styles by entering a style title, temporary prompt elements.</p>
    <p>2. Select multiple styles and click "Load to Temporary Prompt" to combine them.</p>
    <p>3. Use temporary prompts for one-time additions...</p>
    <p>4. You can select multiple styles by holding down the Ctrl key while clicking.</p>
    <p>5. Use "Clear Prompts" to reset both prompt fields.</p>
    <p>6. Click "Generate Single" to create a single image with the current settings.</p>
    <h3>日本語</h3>
    <p>1. スタイルタイトル、一時的なプロンプトを入力して、お気に入りのプロンプトをスタイルとして保存します。</p>
    <p>2. 複数のスタイルを選択し、"スタイルを一時的なプロンプトに入れる"をクリックして組み合わせます。</p>
    <p>3. 一時的なプロンプトを使用して一回限りの追加を行います...</p>
    <p>4. Ctrlキーを押しながらクリックすることで、複数のスタイルを選択したり、選択を解除したりできます。</p>
    <p>5. "プロンプトをクリア"を使用して、プロンプトをリセットします。</p>
    <p>6. "1枚生成"をクリックして、現在の設定で1枚の画像を生成します。</p>
  `;
    
  
    document.querySelector('#helpModal .modal-content').innerHTML = helpContent;
  }

  helpButton.onclick = function() {
    setHelpContent();
    helpModal.style.display = "block";
  }
  
  closeButton.onclick = function() {
    helpModal.style.display = "none";
  }
  
  window.onclick = function(event) {
    if (event.target == helpModal) {
      helpModal.style.display = "none";
    }
  }
  
  setHelpContent(); // 初期化時にヘルプ内容を設定

  clearPromptsButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "clearPrompts"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            showError('communicationError');
          } else if (response && response.success) {
            // ローカルのプロンプト表示もクリア
            tempPromptArea.value = '';
            // tempExcludeArea.value = '';
            finalPrompt.textContent = '';
            // finalExclude.textContent = '';
            updateFinalPrompt();
          } else {
            showError('clearFailed');
          }
        });
      } else {
        showError('noActiveTab');
      }
    });
  });

  function executePrompt() {
    const prompt = finalPrompt.textContent.trim();
    console.log('Attempting to execute prompt:', prompt);
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        console.error('No active tab found');
        alert('アクティブなタブが見つかりません');
        return;
      }
  
      const activeTab = tabs[0];
      console.log('Active tab:', activeTab);
      
      chrome.tabs.sendMessage(activeTab.id, {action: "executePrompt", prompt: prompt}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          alert(`メッセージ送信エラー: ${chrome.runtime.lastError.message}\n\nタブURL: ${activeTab.url}\n\n拡張機能をリロードし、ページを更新してから再試行してください。`);
        } else if (response && response.success) {
          console.log('Prompt executed successfully');
          window.close(); // ポップアップを閉じる
        } else {
          console.error('Failed to execute prompt:', response);
          alert(`プロンプトの実行に失敗しました: ${JSON.stringify(response)}`);
        }
      });
    });
  }
  if (executePromptButton) executePromptButton.addEventListener('click', executePrompt);

  // generateSingleButton.addEventListener('click', function() {
  //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //     if (tabs[0]) {
  //       chrome.tabs.sendMessage(tabs[0].id, {action: "generateSingle"}, function(response) {
  //         if (chrome.runtime.lastError) {
  //           console.error('Runtime error:', chrome.runtime.lastError);
  //           showError(`通信エラー: ${chrome.runtime.lastError.message}`);
  //         } else if (!response) {
  //           console.error('No response from content script');
  //           showError('コンテンツスクリプトからの応答がありません');
  //         } else if (!response.success) {
  //           console.error('Generation failed:', response.error);
  //           showError(`生成失敗: ${response.error || '不明なエラー'}`);
  //         } else {
  //           console.log('Generation started successfully');
  //           // 成功時の処理（必要に応じて）
  //           // 例: showSuccess('画像生成が開始されました');
  //         }
  //       });
  //     } else {
  //       showError('アクティブなタブが見つかりません');
  //     }
  //   });
  // });

  // generateMultipleButton.addEventListener('click', function() {
  //   const count = parseInt(generateCountSelect.value);
  //   generateMultipleImages(count);
  // });

  // function generateMultipleImages(count) {
  //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //     if (tabs[0]) {
  //       chrome.tabs.sendMessage(tabs[0].id, {action: "generateMultiple", count: count}, function(response) {
  //         if (chrome.runtime.lastError) {
  //           console.error('Runtime error:', chrome.runtime.lastError);
  //           showError(`通信エラー: ${chrome.runtime.lastError.message}`);
  //         } else if (!response) {
  //           console.error('No response from content script');
  //           showError('コンテンツスクリプトからの応答がありません');
  //         } else if (!response.success) {
  //           console.error('Generation failed:', response.error);
  //           showError(`生成失敗: ${response.error || '不明なエラー'}`);
  //         } else {
  //           console.log(`${count}枚の画像生成が開始されました`);
  //           showSuccess(`${count}枚の画像生成が開始されました`);
  //         }
  //       });
  //     } else {
  //       showError('アクティブなタブが見つかりません');
  //     }
  //   });
  // }

  function showError(message) {
    console.error(message);
    alert(message); // またはより洗練されたUIでエラーを表示
  }

  // 必要に応じて成功メッセージを表示する関数を追加
  function showSuccess(message) {
    console.log(message);
    // 成功メッセージをUIに表示する方法を実装（オプション）
  }
  
  function saveStyle() {
    const title = styleTitleInput.value.trim();
    const prompt = tempPromptArea.value.trim(); // finalPrompt ではなく tempPromptArea を使用
    if (title && prompt) {
      chrome.storage.local.get(['savedStyles'], function(result) {
        const savedStyles = result.savedStyles || {};
        savedStyles[title] = { prompt: prompt };
        chrome.storage.local.set({savedStyles: savedStyles}, function() {
          loadSavedStyles();
          styleTitleInput.value = '';
          tempPromptArea.value = ''; // スタイル保存後にテンポラリプロンプトをクリア
          updateFinalPrompt();
          saveFormState();
        });
      });
    }
  }

  function loadSavedStyles() {
    chrome.storage.local.get(['savedStyles'], function(result) {
      const savedStyles = result.savedStyles || {};
      styleSelect.innerHTML = '';
      const sortedTitles = Object.keys(savedStyles).sort((a, b) => a.localeCompare(b));
      for (const title of sortedTitles) {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        styleSelect.appendChild(option);
      }
      restoreFormState();
    });
  }

  function loadToTemp() {
    const selectedStyles = Array.from(styleSelect.selectedOptions).map(option => option.value);
    chrome.storage.local.get(['savedStyles'], function(result) {
      const savedStyles = result.savedStyles || {};
      let combinedTitle = '';
      let combinedPrompt = '';
      // let combinedExclude = '';
      selectedStyles.forEach(title => {
        const style = savedStyles[title];
        if (style) {
          combinedTitle += (combinedTitle ? ', ' : '') + title;
          combinedPrompt += (combinedPrompt ? ', ' : '') + style.prompt;
          // combinedExclude += (combinedExclude ? ', ' : '') + style.exclude;
        }
      });
      styleTitleInput.value = combinedTitle;
      tempPromptArea.value = combinedPrompt;
      // tempExcludeArea.value = combinedExclude;
      updateFinalPrompt();
    });
  }

  if (saveStyleButton) saveStyleButton.addEventListener('click', saveStyle);
  if (deleteStyleButton) deleteStyleButton.addEventListener('click', deleteStyle);
  if (injectPromptButton) injectPromptButton.addEventListener('click', injectPrompt);

  // document.getElementById('saveStyle').addEventListener('click', saveStyle);
  document.getElementById('loadToTemp').addEventListener('click', loadToTemp);

  document.querySelectorAll('.clear-button').forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.value = '';
        // 入力イベントをトリガーしてフォームの状態を更新
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

});
