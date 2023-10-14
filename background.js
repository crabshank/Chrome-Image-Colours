try {
var ext_id=chrome.runtime.id;
var addrs=[];
var tbs=[];
var ac_tab=null;
var sw_tab=false;
var curr_bdg='';
var og_col_bdg='#7CB0F8';
var nw_col_bdg='#D9FE0C';
var set_bdg_col_to;

async function initActiveTab(){
	return new Promise((resolve)=>{
			chrome.tabs.query({active: true, currentWindow:true},(tabs)=>{ if (!chrome.runtime.lastError && typeof tabs[0]!=='undefined') {
				ac_tab=tabs[0].id;
			}
				resolve();
			});
	});
}

function set_bdg_col(){
	chrome.action.setBadgeBackgroundColor({color: og_col_bdg});
}

async function resetBdg(){
	return new Promise((resolve)=>{
			chrome.action.setBadgeText({
					'text': ''
			}, ()=>{
				set_bdg_col();
				resolve();
			});
	});
}
	
async function setBdg(n){
	return new Promise((resolve)=>{
		
		let ns=n.toString();
		
		function onSet_BadgeBackgroundColor(){
			try{
				set_bdg_col_to = setTimeout(set_bdg_col,3500);
			}catch(e){;}finally{
				resolve();
			}
		}
		
		if(sw_tab===true){
			sw_tab=false;
			clearTimeout(set_bdg_col_to);
			set_bdg_col();
			chrome.action.setBadgeText({
					'text': ns
			});
			resolve();
		}else if(curr_bdg!==ns){
			clearTimeout(set_bdg_col_to);
			curr_bdg=ns;
			chrome.action.setBadgeText({
					'text': ns
				}, ()=>{
						chrome.action.setBadgeBackgroundColor({color: nw_col_bdg}).then(onSet_BadgeBackgroundColor, onSet_BadgeBackgroundColor);
			});	
		}else{
			resolve();
		}
	});
}

function sendImg(requestDetails, msg, tid,fid) {
	if(msg==="jmp" || msg==="hl"){
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


async function replaceTabs(r,a){
	return new Promise(function(resolve) {
		ac_tab=(ac_tab===r)?a:ac_tab;
		resolve();
	});
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	replaceTabs(removedTabId,addedTabId);
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
	sw_tab=true;
	ac_tab=activeInfo.tabId;
	chrome.tabs.sendMessage(activeInfo.tabId, {message: "cnt_this"});
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
	

let mId="jmp_"+ext_id;
let contexts = ["image"];
chrome.contextMenus.create({
	"title": "Jump to image in iFrame (Image colours)",
	"contexts": contexts,
	"id": mId
})

chrome.contextMenus.onClicked.addListener((info,tab) => {
	if(info.menuItemId===mId){
		sendImg(info.srcUrl, "jmp",tab.id,info.frameId);
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
	case "cnt":
	 (async ()=>{
		 await initActiveTab();
			if(ac_tab===sender.tab.id){
				await setBdg(request.count);
			}
			sendResponse({info: sender});
	})();
	break;	
	case "resetBdg":
	 (async ()=>{
			if(ac_tab===sender.tab.id){
				await resetBdg();
			}
	})();
	break;		
	case "get_info":
		sendResponse({info: sender});
	break;	
	case "nav_0":
		addrs_rt(sender.tab.id);
		chrome.tabs.sendMessage(sender.tab.id, {message: request.message});
		sendResponse({response: "Message received"});
	break;	
	case "clr":
		addrs_rt(sender.tab.id);
		sendResponse({response: "Message received"});
	break;
	case "hl":
		sendImg(request.url, request.message, sender.tab.id, request.f_id);
		sendResponse({response: "Message received"});
	break;	
	case "rqi":
		chrome.tabs.sendMessage(sender.tab.id, {message: request.message, imgSrc: request.links, f_id: request.f_id});
		sendResponse({response: "Message received"});
	break;
	default:
		sendResponse({response: "Message received"});
	break;
	}
});

}

start();

} catch (e) {
  console.error(e);
}
