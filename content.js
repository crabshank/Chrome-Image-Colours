var chg = window.location.href;
var srcs=[];
var canvasses=[];
var g_ix=0;
var blacklist='';
var fr_id=null;
var tb_id=null;
var to_draw=[];
var timer;

var cvsSctTop=document.createElement('section');
var cvsSct=document.createElement('section');
var cvsClr=document.createElement('button');
var cvsSel=document.createElement('select');
const colNames = ['Show nothing','Show unsorted images','Greyscale','Red','Orange/Brown','Yellow','Chartreuse/Lime','Green','Spring green','Cyan','Azure/Sky blue','Blue','Violet/Purple','Magenta/Pink','Reddish pink','All Pinks','Cyan to Blue','Chartreuse/Lime + Green','Red + Pinks'];

function clear_out(){
	cvsSct.innerHTML='';
	chrome.runtime.sendMessage({message: "clr"}, function(response) {});
	canvasses=[];
	to_draw=[];
	srcs=[];
}

function setup(){

cvsSctTop.style.setProperty( 'display', 'inline-flex', 'important' );
cvsSctTop.style.setProperty( 'align-items', 'flex-start', 'important' );

cvsSct.style.setProperty( 'display', 'none', 'important' );
cvsSct.style.setProperty( 'flex-flow', 'wrap', 'important' );
cvsSct.style.setProperty( 'align-items', 'flex-start', 'important' );

cvsClr.innerText='Clear canvas';
cvsClr.style.setProperty( 'user-select', 'none', 'important' );
cvsClr.style.setProperty( '-webkit-user-select', 'none', 'important' );

cvsSel.title='Select colour to sort by';
document.body.insertAdjacentElement('beforeend', cvsSct);
cvsSctTop.appendChild(cvsSel);
cvsSctTop.appendChild(cvsClr);
cvsSct.insertAdjacentElement('beforebegin', cvsSctTop);
cvsSel.style.setProperty( 'display', 'flex', 'important' );
cvsSel.style.setProperty( 'background-color', 'buttonface', 'important' );
cvsSel.style.setProperty( 'user-select', 'none', 'important' );
cvsSel.style.setProperty( '-webkit-user-select', 'none', 'important' );

  // Loop through voices and create an option for each one
colNames.forEach(name => {
    // Create option element
    let opt = document.createElement('option');
	opt.style.cssText='color: black;';
    opt.textContent = name;

    cvsSel.appendChild(opt);
  });

 cvsClr.onclick=function(){
	clear_out();
 }
 
cvsSel.oninput=function(){
	if(cvsSel.selectedIndex!=0){
		for(let i=0, len=to_draw.length; i<len; i++){
			let src_ix=srcs.findIndex((s)=>{return s[0]===to_draw[i][0]});
			if(src_ix<0){
				checker(to_draw[i][0], to_draw[i][1], to_draw[i][2]);
			}
		}
		to_draw=[];
	}
	doSort();
}
}

async function get_ids(start_up){
	await new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({message: "get_info"}, function(response) {
			fr_id=response.info.frameId;
			tb_id=response.info.tab.id;
			
			if(start_up){
				if(fr_id==0){
					setup();
					restore_options();
				let lks=getTagNameShadow(document, 'IMG').map((i)=>{return (i.src==='')?i.currentSrc:i.src;}).filter((i)=>{return i!==''});
				chrome.runtime.sendMessage({message: "rqi",links: lks, f_id: fr_id}, function(response) {});
				}else{
					restore_options();
				}
				
			}
			
			resolve();
		});
	});
}

function getTagNameShadow(docm, tgn){
var shrc=[docm];
var shrc_l=1;

let srCnt=0;

while(srCnt<shrc_l){
	allNodes=[shrc[srCnt],...shrc[srCnt].querySelectorAll('*')];
	for(let i=0, len=allNodes.length; i<len; i++){
		if(!!allNodes[i] && typeof allNodes[i] !=='undefined' && allNodes[i].tagName===tgn && i>0){
			shrc.push(allNodes[i]);
		}

		if(!!allNodes[i].shadowRoot && typeof allNodes[i].shadowRoot !=='undefined'){
			let c=allNodes[i].shadowRoot.children;
			shrc.push(...c);
		}
	}
	srCnt++;
	shrc_l=shrc.length;
}
	shrc=shrc.slice(1);
	let out=shrc.filter((c)=>{return c.tagName===tgn;});
	
	return out;
}

function absBoundingClientRect(el){
	let st = [window?.scrollY,
					window?.pageYOffset,
					el?.ownerDocument?.documentElement?.scrollTop,
					document?.documentElement?.scrollTop,
					document?.body?.parentNode?.scrollTop,
					document?.body?.scrollTop,
					document?.head?.scrollTop];
					
		let sl = [window?.scrollX,
						window?.pageXOffset,
						el?.ownerDocument?.documentElement?.scrollLeft,
						document?.documentElement?.scrollLeft,
						document?.body?.parentNode?.scrollLeft,
						document?.body?.scrollLeft,
						document?.head?.scrollLeft];
						
				let scrollTop=0;
				for(let k=0; k<st.length; k++){
					if(!!st[k] && typeof  st[k] !=='undefined' && st[k]>0){
						scrollTop=(st[k]>scrollTop)?st[k]:scrollTop;
					}
				}			

				let scrollLeft=0;
				for(let k=0; k<sl.length; k++){
					if(!!sl[k] && typeof  sl[k] !=='undefined' && sl[k]>0){
						scrollLeft=(sl[k]>scrollLeft)?sl[k]:scrollLeft;
					}
				}
	
	const rct=el.getBoundingClientRect();
	let r={};

	r.left=rct.left+scrollLeft;
	r.right=rct.right+scrollLeft;
	r.top=rct.top+scrollTop;
	r.bottom=rct.bottom+scrollTop;
	r.height=rct.height;
	r.width=rct.width;
	
	return r;
}

 function doSort(){
	 let cols=canvasses.map((v)=>{return v[4];})
	 	 if(cvsSel.selectedIndex==0){
		 cvsSct.style.setProperty( 'display', 'none', 'important' );
	 }else if(cvsSel.selectedIndex>=1){
		 cvsSct.style.setProperty( 'display', 'inline-flex', 'important' );
	 }
	 
	 if (cvsSel.selectedIndex>=2){
		   	 sortByCol(cols, cvsSel.selectedIndex-2);
 }else if(cvsSel.selectedIndex==1){
	 sortByArrCols(cols,[18,19],[-1,-1]);
 }
	 for (let j = 0; j<canvasses.length; j++){
		 let el= canvasses[cols[j][17]];
			el[0].style.setProperty( 'order', j, 'important' );
		 
	 }
 }

function sortByCol(arr, colIndex){
    arr.sort(sortFunction);
    function sortFunction(a, b) {
        a = a[colIndex]
        b = b[colIndex]
        return (a === b) ? 0 : (a < b) ? 1 : -1
    }
}

function sortByArrCols(arr, colsArr, dir){
    arr.sort(sortFunction);
		function sortFunction(a, b) {
			for(let i = 0; i < arr.length; i++){
					if(a[colsArr[i]]>b[colsArr[i]]){
						return dir[i]*-1;
					}else if(a[colsArr[i]]<b[colsArr[i]]){
						return dir[i]*1;
					}else if(i==arr.length-1){
					return 0;
				}
			} 
	}
}

function removeEls(d, array){
	var newArray = [];
	for (let i = 0; i < array.length; i++)
	{
		if (array[i] != d)
		{
			newArray.push(array[i]);
		}
	}
	return newArray;
}

function findIndexTotalInsens(string, substring, index) {
    string = string.toLocaleLowerCase();
    substring = substring.toLocaleLowerCase();
    for (let i = 0; i < string.length ; i++) {
        if ((string.includes(substring, i)) && (!(string.includes(substring, i + 1)))) {
            index.push(i);
            break;
        }
    }
    return index;
}

function blacklistMatch(array, t) {
    var found = false;
	var blSite='';
    if (!((array.length == 1 && array[0] == "") || (array.length == 0))) {
        ts = t.toLocaleLowerCase();
        for (var i = 0; i < array.length; i++) {
            let spl = array[i].split('*');
            spl = removeEls("", spl);

            var spl_mt = [];
            for (let k = 0; k < spl.length; k++) {
                var spl_m = [];
                findIndexTotalInsens(ts, spl[k], spl_m);

                spl_mt.push(spl_m);


            }

            found = true;

            if ((spl_mt.length == 1) && (typeof spl_mt[0][0] === "undefined")) {
                found = false;
            } else if (!((spl_mt.length == 1) && (typeof spl_mt[0][0] !== "undefined"))) {

                for (let m = 0; m < spl_mt.length - 1; m++) {

                    if ((typeof spl_mt[m][0] === "undefined") || (typeof spl_mt[m + 1][0] === "undefined")) {
                        found = false;
                        m = spl_mt.length - 2; //EARLY TERMINATE
                    } else if (!(spl_mt[m + 1][0] > spl_mt[m][0])) {
                        found = false;
                    }
                }

            }
            blSite = (found) ? array[i] : blSite;
            i = (found) ? array.length - 1 : i;
        }
    }
    //console.log(found);
    return [found,blSite];

}

var isCurrentSiteBlacklisted = function()
{
		return blacklistMatch(blacklist, window.location.href);
};

function restore_options()
{
	if(typeof chrome.storage==='undefined'){
		restore_options();
	}else{
	chrome.storage.sync.get(null, function(items)
	{
		if (Object.keys(items).length != 0)
		{
			//console.log(items);
		
		if(!!items.bList && typeof  items.bList!=='undefined'){
			blacklist=items.bList.split('\n').join('').split(',');
		}
		
		var isBl=isCurrentSiteBlacklisted();
			if(isBl[0]){
				console.log('Image colours - Current site shows images by default ("'+isBl[1]+'")' );
				cvsSel.selectedIndex=1;
				cvsSct.style.setProperty( 'display', 'inline-flex', 'important' );
			}
						
		}
		else
		{
			save_options();
		}
	});
	}
}

function save_options()
{
		chrome.storage.sync.clear(function() {
	chrome.storage.sync.set(
	{
		bList: ""
	}, function()
	{
		console.log('Default options saved.');
		restore_options();
	});
		});

}

function elRemover(el){
	if(typeof el!=='undefined' && !!el){
	if(typeof el.parentNode!=='undefined' && !!el.parentNode){
		el.parentNode.removeChild(el);
	}
	}
}

function drawImageFromWebUrl(url, canvas, ctx, OG_img){
				   canvas.width  = OG_img.width;
					canvas.height = OG_img.height;
				   ctx.drawImage(OG_img, 0, 0, OG_img.width, OG_img.height);
			  cvsSct.appendChild(canvas);
			  elRemover(OG_img);
				if(cvsSel.selectedIndex==0){
					cvsSct.style.setProperty( 'display', 'none', 'important' );
				}else if(cvsSel.selectedIndex>=1){
					cvsSct.style.setProperty( 'display', 'inline-flex', 'important' );
				}
			  getColours(canvas,ctx,url,OG_img);
}

function getDiscCol(r, g, b) {
let h=0;
  if (r==g && r==b) {
   return 0;
  } else {
	    r /= 255, g /= 255, b /= 255;
		let max=Math.max(r,g,b);
		let min=Math.min(r,g,b);
		let d=max-min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

  }

  let hue=Math.floor(h*600);
  
if((hue>=3525)||(((hue>=0) && (hue<75)))){
 return 1;
}else if((hue>=75) && (hue<375)){
 return 2;
}else if((hue>=375) && (hue<675)){
 return 3;
}else if((hue>=675) && (hue<975)){
 return 4;
}else if((hue>=975) && (hue<1275)){
 return 5;
}else if((hue>=1275) && (hue<1575)){
 return 6;
}else if((hue>=1575) && (hue<1875)){
 return 7;
}else if((hue>=1875) && (hue<2175)){
 return 8;
}else if((hue>=2175) && (hue<2475)){
 return 9;
}else if((hue>=2475) && (hue<3075)){
 return 10;
}else if((hue>=3075) && (hue<3375)){
 return 11;
}else if((hue>=3375) && (hue<3525)){
 return 12;
}
  
  
}

function getColours(canvas,ctx,url,OG_img){
try{

let iRct=absBoundingClientRect(OG_img);
var discr=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,g_ix,iRct.top,iRct.left];

var colour_data=ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
var pxCnt=0;
for (let p = 0, len=Math.round(4* ctx.canvas.height*ctx.canvas.width) ; p <len ;p+=4){
	pxCnt++;
let r= colour_data[p];
let g= colour_data[p+1];
let b= colour_data[p+2];
discr[getDiscCol(r,g,b)]++;
}
discr[13]=discr[11]+discr[12];
discr[14]=discr[7]+discr[8]+discr[9];
discr[15]=discr[4]+discr[5];
discr[16]=discr[13]+discr[1];

for (let i = 0; i<=16; i++){
discr[i]=discr[i]/pxCnt;
}

canvasses.push([canvas,ctx,OG_img,g_ix,discr]);
g_ix++;
	
canvas.addEventListener('contextmenu', ()=>{
				let u=canvas.getAttribute("source_addr");
			  console.log(u);
			  alert(u);
});

canvas.onclick=(event)=>{
				event.target.style.setProperty( 'border', 'red 0.3ch outset', 'important' );
				chrome.runtime.sendMessage({message: "hl",url: url, f_id:parseInt(event.target.getAttribute("from_frame"))}, function(response) {});
			try{
				OG_img.style.setProperty( 'border', 'red 0.3ch outset', 'important' );
				OG_img.scrollIntoView();
			}catch(e){;}
};

doSort();
}catch(e){;}
}

function startDraw(img,url,fid){

		canvas = document.createElement('canvas');
		canvas.setAttribute("from_frame",fid);
		canvas.setAttribute("source_addr",url);
		canvasCtx = canvas.getContext("2d");
		var WIDTH =img.width;
		var HEIGHT = img.height;
		if(WIDTH>0 && HEIGHT >0){
			canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
			canvasCtx.fillStyle = 'rgb(0,0,0)';
			drawImageFromWebUrl( url, canvas, canvasCtx, img);
		}

}

function checker(url, msg, fid){
			if((msg=="detect" || msg=="rqi" || msg=="rqi2") && fr_id==0){
					for(let k=0, len=url.length; k<len; k++){
				let src_ix=srcs.findIndex((s)=>{return s[0]==url[k]});
					try{
							if(cvsSel.selectedIndex==0){
								let ix=to_draw.findIndex((t)=>{return t[0]===url[k]});
								if(ix==-1){
									to_draw.push([[url[k]], msg, fid]);
								}else if(ix>=0 && fid!=0){
									let old_fid=to_draw[src_ix][2];			
										let c=[...cvsSct.getElementsByTagName('CANVAS')];
										for (let i=0, len=c.length; i<len; i++){
											if(parseInt(c[i].getAttribute('from_frame'))==old_fid){
												c[i].setAttribute('from_frame', fid);
											}
										}
										srcs[src_ix][2]=fid;
							}
							}else if(src_ix<0){
								var img = new Image();
								img.setAttribute('crossOrigin', '');
							img.addEventListener("load", function () {
								document.getElementsByTagName('HEAD')[0].appendChild(img);
								srcs.push([url[k],fid]);
								startDraw(img,url[k],fid);
							});

							  img.setAttribute("from_frame", fid);
							  img.setAttribute("src", url[k]);
							}else if(src_ix>=0 && fid!=0){
								let old_fid=srcs[src_ix][1];
								let c=[...cvsSct.getElementsByTagName('CANVAS')];
								for (let i=0, len=c.length; i<len; i++){
									if(parseInt(c[i].getAttribute('from_frame'))==old_fid){
										c[i].setAttribute('from_frame', fid);
									}
								}
								srcs[src_ix][1]=fid;
							}
					}catch(e){;}
			}
			}else if(msg=="hl" && fr_id==fid){
					try{
						for(let k=0, len=url.length; k<len; k++){
							let OG_img=getTagNameShadow(document,'IMG');
								for (let i=0, len=OG_img.length; i<len; i++){
									let s=(OG_img[i].src==='')?OG_img[i].currentSrc:OG_img[i].src;
									if(s===url[k]){
										OG_img[i].scrollIntoView();
										OG_img[i].style.setProperty(  'border', 'red 0.3ch outset', 'important' );
									}
								}
						}
					}catch(e){;}
			}
}

function removeCanvases(fid){
	if(fr_id==0){
		clear_out();
	}
	let lks=getTagNameShadow(document, 'IMG').map((i)=>{return (i.src==='')?i.currentSrc:i.src;}).filter((i)=>{return i!==''});
	chrome.runtime.sendMessage({message: "rqi",links: lks, f_id: fr_id}, function(response) {});
}

chrome.runtime.onMessage.addListener(gotMessage);
function gotMessage(message, sender, sendResponse) {
	if(message.message=="rep_tb"){
		get_ids(false);	
	}else if(message.message=="nav"){
		removeCanvases(message.f_id);
	}else if(message.message=="rqi"){
			checker(message.imgSrc, message.message, message.f_id);
	}else{
		checker(message.imgSrc, message.message, message.f_id);
	}
}

			if (typeof observer === "undefined" && typeof timer === "undefined") {
    const observer = new MutationObserver((mutations) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            if (window.location.href != chg) {
					chrome.runtime.sendMessage({message: "nav",old_url: chg, new_url: window.location.href}, function(response) {});
	            	chg = window.location.href;
			}
        }, 150);
    });

 observer.observe(document, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
        attributeOldValue: true,
        characterDataOldValue: true
    });
}

get_ids(true);