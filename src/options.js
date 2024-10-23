document.addEventListener('DOMContentLoaded', function() {
  const languageSelect = document.getElementById('languageSelect');
  const saveButton = document.getElementById('saveSettings');

  // Load current settings
  chrome.storage.sync.get(['language'], function(result) {
      languageSelect.value = result.language || 'ja';
  });

  saveButton.addEventListener('click', function() {
      chrome.storage.sync.set({language: languageSelect.value}, function() {
          alert('Settings saved / 設定が保存されました');
      });
  });
});