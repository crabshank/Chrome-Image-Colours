try {
function sendImg(requestDetails) {
chrome.tabs.sendMessage(requestDetails.tabId, {imgSrc: requestDetails.url});
}


chrome.webRequest.onBeforeRequest.addListener(
  sendImg,
  {urls:["<all_urls>"], types:["image"]},
  ["blocking","requestBody", "extraHeaders"]
);

} catch (e) {
  console.error(e);
}