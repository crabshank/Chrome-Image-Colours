try {
var addrs=[];

function sendImg(requestDetails, msg, tid,fid) {
	if(msg=="hl"){
		chrome.tabs.sendMessage(tid, {message: msg, imgSrc: requestDetails, f_id: fid});
	}else if(msg=="detect"){
		let filt=addrs.filter((adr)=>{return (adr.tabId==requestDetails.tabId && adr.url==requestDetails.url);});
		if(filt.length==0){
			chrome.tabs.sendMessage(tid, {message: msg, imgSrc: [requestDetails.url], f_id: fid});
			addrs.push(requestDetails);
		}
	}
}

function start() {
	
	chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	for (let i = 0, len = addrs.length; i<len; i++){
		if(addrs[i].tabId==removedTabId){
			addrs[i].tabId=addedTabId;
			chrome.tabs.sendMessage(addedTabId, {message: "rep_tb"});
		}
	}
});

function addrs_rt(id){
	addrs=addrs.filter((a)=>{return a.tabId!=id});
}

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
		 addrs_rt(tabId);
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
				addrs=addrs.filter((adr)=>{return tbs.includes(adr.tabId);});
				}
			});
		}
});
	

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info)=>{
	if(info.request.tabId>=0){
		chrome.webNavigation.getFrame({
		tabId: info.request.tabId,
		frameId: info.request.frameId
		}, function (frameInfo){
				  chrome.tabs.sendMessage(info.request.tabId, {message: "nav", url:frameInfo.url, f_id: info.request.frameId});
				 if(info.request.type==='image'){
						sendImg(info.request, "detect",info.request.tabId,info.request.frameId);
					}
		});
	}else{
		if(info.request.type==='image'){
			sendImg(info.request, "detect",info.request.tabId,info.request.frameId);
		}
	}


});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.message){
	case "get_info":
		sendResponse({info: sender});
	break;	
	case "nav_0":
		addrs_rt(sender.tab.id);
		chrome.tabs.sendMessage(sender.tab.id, {message: request.message});
	break;
	break;	
	case "clr":
		addrs_rt(sender.tab.id);
	break;
	case "hl":
		sendImg(request.url, request.message, sender.tab.id, request.f_id);
	break;	
	case "rqi":
		chrome.tabs.sendMessage(sender.tab.id, {message: request.message, imgSrc: request.links, f_id: request.f_id});
	break;

	default:
		;
	break;
	}
	sendResponse({response: "Message received"});
});

}

start();

} catch (e) {
  console.error(e);
}