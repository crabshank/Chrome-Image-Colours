try {
var addrs=[];

function doneAddr(responseDetails) {
	let filt=addrs.filter((adr)=>{return (adr.url==responseDetails.url  && adr.tabId==responseDetails.tabId);});
	if(filt.length==0){
		addrs.push(responseDetails);
	}
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	for (let i = 0, len = addrs.length; i<len; i++){
		if(addrs[i].tabId==removedTabId){
			addrs[i].tabId=addedTabId;
		}
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if (!!changeInfo.url) {
			let filt=addrs.filter((adr)=>{return adr.tabId!=tabId;});
			addrs=filt;
		}
});

function sendImg(requestDetails) {
		let filt=addrs.filter((adr)=>{return (adr.url==requestDetails.url && adr.tabId==requestDetails.tabId);});
	if(filt.length>0){
		chrome.tabs.sendMessage(requestDetails.tabId, {imgSrc: requestDetails.url});
	}
}

chrome.webRequest.onBeforeRequest.addListener(
  sendImg,
  {urls:["<all_urls>"], types:["image"]},
  ["blocking","requestBody", "extraHeaders"]
);

chrome.webRequest.onCompleted.addListener(
  doneAddr,
  {urls:["<all_urls>"], types:["image"]},
  ["responseHeaders"]
);

} catch (e) {
  console.error(e);
}