console.log("Solohub service worker started");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Solohub installed");
});

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (message.type === "GET_OAUTH_REDIRECT") {
      const redirectUrl = chrome.identity.getRedirectURL();

      sendResponse({
        redirectUrl,
      });
    }
  }
);