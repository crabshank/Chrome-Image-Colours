try {
var addrs=[];

function sendImg(requestDetails, msg) {
	if(msg=="hl"){
				chrome.tabs.query({currentWindow: true}, function(tabs) {
					if (!chrome.runtime.lastError) {
						for (let i=tabs.length-1; i>=0; i--){
						chrome.tabs.sendMessage(tabs[i].id, {message: msg, imgSrc: requestDetails});
						}
					}
				});
	}else if(msg=="detect"){
	let filt=addrs.filter((adr)=>{return (adr.tabId==requestDetails.tabId && adr.url==requestDetails.url);});
	if(filt.length==0){
		chrome.tabs.sendMessage(requestDetails.tabId, {message: msg, imgSrc: requestDetails.url});
		addrs.push(requestDetails);
	}
	}
}

function start() {
	
	chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	for (let i = 0, len = addrs.length; i<len; i++){
		if(addrs[i].tabId==removedTabId){
			addrs[i].tabId=addedTabId;
		}
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if (!!changeInfo.url) {
			var filt=addrs.filter((adr)=>{return adr.tabId!=tabId;});
			addrs=filt;
			
			chrome.tabs.query({}, function(tabs) {
				if (!chrome.runtime.lastError) {
				let tbs=[];
					for (let t = 0; t < tabs.length; t++) {
					tbs.push(tabs[t].id);
					}
				filt=addrs.filter((adr)=>{return tbs.includes(adr.tabId);});
				addrs=filt;
				}
			});
		}
});
	
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info)=>{
		sendImg(info.request, "detect");
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.message){
	case "hl":
		sendImg(request.url, request.message);
	break;

	default:
		;
	break;
	}
});

}

start();

} catch (e) {
  console.error(e);
}