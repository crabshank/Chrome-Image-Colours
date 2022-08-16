try {
var tbo=JSON.stringify({id:-2, count:0});
var tbs=[];
var addrs=[];
var ac_tab=-2;
var ix=-1;
var prg=false;
var ev_queue=[];


async function initActiveTab(get){
	return new Promise((resolve)=>{
			chrome.tabs.query({active: true, currentWindow:true},(tabs)=>{ if (!chrome.runtime.lastError && typeof tabs[0]!=='undefined') {
				
				let act=tabs[0].id;
				if(typeof get==='undefined' || get===false){
					setBdgTxt();
				}
				ac_tab=act;
				resolve();
			}else{
				resolve();
			}});
	});
}

 async function setBdgTxt(get){
	 if(typeof get!=='undefined' && get===true){
		await initActiveTab(true);
	 }
			ix=tbs.findIndex((t)=>{return t.id===ac_tab}); if(ix>=0){
				chrome.action.setBadgeText({
					'text': (tbs[ix].count).toString()
				}, ()=>{;});
			}
}

async function initialise(){
		return new Promise(function(resolve, reject) {
			chrome.tabs.query({}, function(tabs) { if (!chrome.runtime.lastError) {
					for (let t = 0; t < tabs.length; t++) {
						let tob=JSON.parse(tbo);
						tob.id=tabs[t].id;
						tbs.push(tob);
					}
					resolve();
				}else{
					resolve();
				}
		});
	});
}

initialise();
initActiveTab();

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
	
async function tabs_onReplaced(addedTabId, removedTabId) {
	for (let i = 0, len = addrs.length; i<len; i++){
		if(addrs[i].tabId==removedTabId){
			addrs[i].tabId=addedTabId;
			chrome.tabs.sendMessage(addedTabId, {message: "rep_tb"});
		}
	}
	ix=tbs.findIndex((t)=>{return t.id===removedTabId}); if(ix>=0){
			tbs[ix].id=addedTabId;
	}
			setBdgTxt();
}
	
chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	ev_loop(()=>{tabs_onReplaced(addedTabId, removedTabId);});
});

async function tabs_onActivated (activeInfo){
		setBdgTxt(true);
}

chrome.tabs.onActivated.addListener((activeInfo) => {
	ev_loop(()=>{tabs_onActivated(activeInfo);});
});

function addrs_rt(id){
	addrs=addrs.filter((a)=>{return a.tabId!=id});
}

async function tabs_onCreated(tab){
	let tob=JSON.parse(tbo);
	tob.id=tab.id;
	tbs.push(tob);
	setBdgTxt();
}

chrome.tabs.onCreated.addListener((tab)=>{
	ev_loop(()=>{tabs_onCreated(tab);});
});

async function tabs_onRemoved(tabId, removeInfo) {
		 addrs_rt(tabId);
		 tbs=tbs.filter((t)=>{return t.id!==tabId});
		 setBdgTxt();
}

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
		 ev_loop(()=>{tabs_onRemoved(tabId, removeInfo);});
});

async function tabs_onUpdated(tabId, changeInfo, tab) {
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
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		 ev_loop(()=>{tabs_onUpdated(tabId, changeInfo, tab) ;});
});

async function declarativeNetRequest_onRuleMatchedDebug(info){
	if(info.request.tabId>=0){
		chrome.webNavigation.getFrame({
		tabId: info.request.tabId,
		frameId: info.request.frameId
		}, function (frameInfo){
			if(frameInfo!==null){
					chrome.tabs.sendMessage(info.request.tabId, {message: "nav", url:frameInfo.url, f_id: info.request.frameId});
					if(info.request.type==='image'){
						sendImg(info.request, "detect",info.request.tabId,info.request.frameId);
					}
			}
		});
	}else{
		if(info.request.type==='image'){
			sendImg(info.request, "detect",info.request.tabId,info.request.frameId);
		}
	}


}

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info)=>{
	 ev_loop(()=>{declarativeNetRequest_onRuleMatchedDebug(info);});
});

async function runtime_onMessage(request, sender, sendResponse){
		switch (request.message){
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
	case "clr2":
		addrs_rt(sender.tab.id);
		ix=tbs.findIndex((t)=>{return t.id===sender.tab.id}); if(ix>=0){
			tbs[ix].count=0;
		}
		setBdgTxt();
		sendResponse({response: "Message received"});
	break;	
	case "cnt":
		ix=tbs.findIndex((t)=>{return t.id===sender.tab.id}); if(ix>=0){
			tbs[ix].count=request.count;
		}
		setBdgTxt();
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
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
 ev_loop(()=>{ runtime_onMessage(request, sender, sendResponse);});
});

}

start();

async function ev_loop(f){
	ev_queue.push(f);
	if(prg===false){
		while(ev_queue.length>0){
			prg=true;
			await ev_queue[0]();
			ev_queue=ev_queue.slice(1);
		}
		prg=false;
	}
}

} catch (e) {
  console.error(e);
}