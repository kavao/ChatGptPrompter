chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGPT Prompt Manager Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openOptions") {
    chrome.runtime.openOptionsPage();
  }
});