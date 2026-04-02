chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "START_STAGE1_SCAN") {

    chrome.tabs.captureVisibleTab(
      null,
      { format: "png" },
      (image) => {

        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }

        sendResponse({ screenshot: image });

      }
    );

    return true;
  }

});