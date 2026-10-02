console.log("Solohub background service started");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Solohub installed successfully");
});