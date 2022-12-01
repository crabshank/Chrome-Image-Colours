var chg = {u:window.location.href, c:0};
var canvasses=[];
var g_ix=0;
var blacklist='';
var fr_id=null;
var tb_id=null;
var to_draw=[];
var resizeObserver=null;
var firstMut={iter:0, hgt:null};
//var wzoom=window.devicePixelRatio;

var setTop=(tp)=>{
	let ifrmR=absBoundingClientRect(ifrm);
	ifrm.style.top=(tp-ifrmR.height)+'px';
}

function scr_hdl(event){
		if(!!event.target.scrollingElement && typeof event.target.scrollingElement!=='undefined'){
			setTop(event.target.scrollingElement.scrollHeight);
		}else if(event.target.nodeName==="#document"){
				setTop(event.target.documentElement.scrollHeight);
		}else{
			try{
					setTop(event.target.ownerDocument.scrollingElement.scrollHeight);
			}catch(e){
				setTop(event.target.ownerDocument.documentElement.scrollHeight);
			}
		}
		
}


/*window.onscroll=(event)=>{
	 scr_hdl(event);
}*/

function getScreenHeight(mx){
	let h=[
					document?.documentElement?.scrollHeight,
					document?.body?.scrollHeight,
					document?.head?.scrollHeight,
					window.screen.availHeight,
					window.screen.height,
					window.innerHeight,
					window.outerHeight,
					document?.documentElement?. clientHeight,
					document?.body?. clientHeight,
					document?.head?. clientHeight,
					document?.documentElement?. offsetHeight,
					document?.body?. offsetHeight,
					document?.head?. offsetHeight
				];
				
				h=h.filter( (g)=>{return g>0} );
				
			if(h.length>0){
				if(mx){
					return Math.max(...h);
				}else{
					return Math.min(...h);
				}
			}else{
				return 0;
			}
}

function getScreenWidth(mx){
	let w=[
					//document?.documentElement?.scrollWidth,
					//document?.body?.parentNode?.scrollWidth,
					//document?.body?.scrollWidth,
					//document?.head?.scrollWidth,
					//window.screen.availWidth,
					//window.screen.width,
					document?.documentElement?. clientWidth,
					document?.body?.parentNode?. clientWidth,
					document?.body?. clientWidth,
					document?.head?. clientWidth,
					document?.documentElement?. offsetWidth,
					document?.body?.parentNode?. offsetWidth,
					document?.body?. offsetWidth,
					document?.head?. offsetWidth
				].filter( (d)=>{return d>0} );
				
		if(w.length>0){
				if(mx){	
					return Math.max(...w);
				}else{
					return Math.min(...w);
				}
			}else{
				return 0;
			}
}

function rsz(){
	try{
		let imgs=getMatchingNodesShadow(cvsSct,'IMG',true,false);
		for(let i=0, len=imgs.length; i<len; i++){
			imgs[i].style.setProperty('zoom',1,'important' );
		}
		let cvsSct_styl=window.getComputedStyle(cvsSct);
		let t=(cvsSct_styl['display']==='none')?true:false;
		let icvsTopR=absBoundingClientRect(cvsSctTop);
		//let icvsR=absBoundingClientRect(cvsSct); //image container
		let ifrmdR=absBoundingClientRect(ifrm.contentWindow.document.documentElement);
		ifrm.contentWindow.document.body.style.overflow='hidden';
		ifrm.contentWindow.document.body.style.display='inline-flex';
		ifrm.contentWindow.document.body.style.flexFlow='column';
		ifrm.contentWindow.document.body.style.background='transparent';
		ifrm.contentWindow.document.body.style.marginTop='0px';

		let sw=getScreenWidth(false);
		let swm8=sw-8;
		ifrm.style.width=(sw)+'px'; //set to sw
		cvsSct.style.width=(sw)+'px'; //set to sw
		
		let iw8s=swm8*0.995;
		
		for(let i=0, len=imgs.length; i<len; i++){
			let igi=imgs[i];
			
			if(igi.scrollWidth>0 && iw8s<igi.scrollWidth){
				let s=iw8s/igi.scrollWidth;
				igi.style.setProperty('zoom',s,'important' );
			}
		}
	}catch(e){;}
}

let ifrm=document.createElement('iframe');
ifrm.style.setProperty( 'pointer-events', 'none', 'important' );
ifrm.style.setProperty( 'visibility', 'initial', 'important' );
ifrm.style.setProperty( 'position', 'absolute', 'important' );
ifrm.style.setProperty( 'z-index', Number.MAX_SAFE_INTEGER, 'important' );
ifrm.style.setProperty( 'height', 'max-content', 'important' );
ifrm.style.setProperty( 'width', '-webkit-fill-available', 'important' );
ifrm.style.setProperty( 'margin', 0, 'important' );
ifrm.style.setProperty( 'border', 0, 'important' );
ifrm.style.setProperty( 'padding', 0, 'important' );
ifrm.style.setProperty( 'display', 'flex', 'important' );
ifrm.style.setProperty( 'background', 'transparent', 'important' );
ifrm.style.setProperty( 'transform', 'translateY(0px)', 'important' );
ifrm.style.setProperty( 'transform-origin', 'left top', 'important' );
ifrm.style.setProperty( 'user-select', 'none', 'important' );
ifrm.style.setProperty( '-webkit-user-select', 'none', 'important' );


document.body.insertAdjacentElement('beforeend',ifrm);
ifrm.src = "about:blank";

					ifrm.ownerDocument.addEventListener("scroll", (event) => {
						scr_hdl(event);			
					}, {capture: true, passive:false});
					
					ifrm.ownerDocument.addEventListener("scroll", (event) => {
						scr_hdl(event);
					}, {capture: false, passive:false});


var cvsSctTop=document.createElement('section');
ifrm.contentWindow.document.body.insertAdjacentElement('afterbegin',cvsSctTop);

var cvsSct=document.createElement('section');
var cvsClr=document.createElement('button');
var cvsSel=document.createElement('select');
const colNames = ['Show nothing','Show unsorted images','Greyscale','Red','Orange/Brown','Yellow','Chartreuse/Lime','Green','Spring green','Cyan','Azure/Sky blue','Blue','Violet/Purple','Magenta/Pink','Reddish pink','All Pinks','Cyan to Blue','Chartreuse/Lime + Green','Red + Pinks'];

function clear_out(){
	if(fr_id==0){
		cvsSct.innerHTML='';
		canvasses=[];
		 g_ix=0;
		to_draw=[];
		chrome.runtime.sendMessage({message: "clr"}, function(response) {});
		chrome.runtime.sendMessage({message: "cnt", count:0}, function(response) {});
		rsz();
	}
}

window.addEventListener('resize',(event)=>{
	/*if(wzoom!==window.devicePixelRatio){ //page zoom
		wzoom=window.devicePixelRatio;
		setTop(getScreenHeight(false)*wzoom);
	}else{
		setTop(getScreenHeight(true));
	}*/
	rsz();
});

function setup(){
	//cvsSctTop.style.setProperty( 'z-index', Number.MAX_SAFE_INTEGER, 'important' );
	cvsSctTop.style.setProperty( 'display', 'inline-flex', 'important' );
	cvsSctTop.style.setProperty( 'align-items', 'flex-start', 'important' );
	//cvsSctTop.style.setProperty( 'z-index', Number.MAX_SAFE_INTEGER, 'important' );

	cvsSct.style.setProperty('transform-origin','top left','important' );
	cvsSct.style.setProperty( 'display', 'none', 'important' );
	cvsSct.style.setProperty( 'flex-flow', 'wrap', 'important' );
	cvsSct.style.setProperty( 'align-items', 'flex-start', 'important' );
	cvsSct.style.setProperty( 'background', '#121212', 'important' );

	cvsClr.innerText='Clear canvas';
	cvsClr.style.setProperty( 'user-select', 'none', 'important' );
	cvsClr.style.setProperty( '-webkit-user-select', 'none', 'important' );

	cvsSel.title='Select colour to sort by';
	//document.body.insertAdjacentHTML('beforeend', '<br style="user-select: none !important; -webkit-user-select: none !important;"><br style="user-select: none !important; -webkit-user-select: none !important;">');
	 ifrm.contentWindow.document.body.insertAdjacentElement('beforeend', cvsSct);
	 ifrm.style.setProperty( 'pointer-events', 'all', 'important' );
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
					checker(to_draw[i][0], to_draw[i][1], to_draw[i][2]);
			}
			to_draw=[];
		}
		doSort();
	}

	 rsz();
	 
		if(resizeObserver===null){
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					ifrm.style.height=(entry.devicePixelContentBoxSize[0].blockSize)+'px';
					rsz();
				}
			});
			 resizeObserver.observe(ifrm.contentWindow.document.body);
		}

	if(typeof observer ==="undefined" && typeof timer ==="undefined"){
		var timer;
		var timer_tm=null;
		
		function doAdj(){
			setTop(document.documentElement.scrollHeight);
			timer_tm=performance.now();
		}
	const observer = new MutationObserver((mutations) =>
	{
		let fmf=false;
		let dhgt=document.documentElement.scrollHeight;
		if(firstMut.iter===0){
			firstMut.iter=1;
			firstMut.hgt=dhgt;
			fmf=true;
		}else if(firstMut.iter==1 && dhgt!==firstMut.hgt){
					firstMut.iter=2;
					fmf=true;
		}
			
		if(timer){
			clearTimeout(timer);
			if(performance.now()-timer_tm>=1350 || fmf){
				doAdj();
			}
		}
		
		if(fmf){
			doAdj();
		}else{
			timer = setTimeout(() =>
			{
				doAdj();
			}, 150);
		}
		
		if(timer_tm ===null){
			timer_tm=performance.now();
		}
	});


	observer.observe(document, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeOldValue: true,
		characterData: true,
		characterDataOldValue: true
	});
			
	}
}

async function get_ids(start_up){
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({message: "get_info"}, function(response) {
			fr_id=response.info.frameId;
			tb_id=response.info.tab.id;
			
			if(start_up){
				if(fr_id==0){
					setup();
					
					restore_options();
				let lks=getMatchingNodesShadow(document,'IMG',true,false).map((i)=>{return (i.src==='')?i.currentSrc:i.src;}).filter((i)=>{return i!==''});
				chrome.runtime.sendMessage({message: "rqi",links: lks, f_id: fr_id}, function(response) {});
				}else{
					restore_options();
				}
				
			}
			
			resolve();
		});
	});
}

function keepMatchesShadow(els,slc,isNodeName){
   if(slc===false){
      return els;
   }else{
      let out=[];
   for(let i=0, len=els.length; i<len; i++){
      let n=els[i];
           if(isNodeName){
	            if((n.nodeName.toLocaleLowerCase())===slc){
	                out.push(n);
	            }
           }else{ //selector
	               if(!!n.matches && typeof n.matches!=='undefined' && n.matches(slc)){
	                  out.push(n);
	               }
           }
   	}
   	return out;
   	}
}

function getMatchingNodesShadow(docm, slc, isNodeName, onlyShadowRoots){
slc=(isNodeName && slc!==false)?(slc.toLocaleLowerCase()):slc;
var shrc=[docm];
var shrc_l=1;
var out=[];
let srCnt=0;

while(srCnt<shrc_l){
	let curr=shrc[srCnt];
	let sh=(!!curr.shadowRoot && typeof curr.shadowRoot !=='undefined')?true:false;
	let nk=keepMatchesShadow([curr],slc,isNodeName);
	let nk_l=nk.length;
	
	if( !onlyShadowRoots && nk_l>0){  
		out.push(...nk);
	}
	
	shrc.push(...curr.childNodes);
	
	if(sh){
		   let cs=curr.shadowRoot;
		   let csc=[...cs.childNodes];
			   if(onlyShadowRoots){
			      if(nk_l>0){
			       out.push({root:nk[0], childNodes:csc});
			      }
			   }
			   shrc.push(...csc);
	}

	srCnt++;
	shrc_l=shrc.length;
}

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
	 let cols=canvasses.map((v)=>{return v[3];})
	 	 if(cvsSel.selectedIndex==0){
		 cvsSct.style.setProperty( 'display', 'none', 'important' );
	 }else if(cvsSel.selectedIndex>=1){
		 cvsSct.style.setProperty( 'display', 'flex', 'important' );
	 }
	 
	 if (cvsSel.selectedIndex>=2){
		   	 sortByCol(cols, cvsSel.selectedIndex-2);
 }else if(cvsSel.selectedIndex==1){
	 sortByArrCols(cols,[20,18,19],[-1,-1,-1]);
 }
	 for (let j = 0; j<canvasses.length; j++){
		 let el= canvasses[cols[j][17]];
			el[2].style.setProperty( 'order', j, 'important' );
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
				cvsSct.style.setProperty( 'display', 'flex', 'important' );
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
g_ix=canvasses.length;
let iRct=absBoundingClientRect(OG_img);
var discr=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,g_ix,iRct.top,iRct.left,0];

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

for (let i = 0; i<=12; i++){
	if(discr[i]>0){
		discr[20]++;
	}
}

let c=discr[20];
discr[20]=Math.sqrt(  1-(  ( (c==0)?0:c-1 )/13  )  )*( Math.sqrt( (iRct.top*iRct.top)+(iRct.left*iRct.left) + 1) );
canvasses.push([canvas,ctx,OG_img,discr]);
	
doSort();
}catch(e){;}
}

function checker(url, msg, fid){
	if(cvsSel.selectedIndex==0){
		to_draw.push([url, msg, fid]);
	}else if((msg=="detect" || msg=="rqi") && fr_id==0 && cvsSel.selectedIndex>=1){
					for(let k=0, len=url.length; k<len; k++){	
										let i_arr=[...cvsSct.getElementsByTagName('IMG')];
										let i_arr_m=i_arr.findIndex((i)=>{return i.getAttribute('src')===url[k];});

										if(i_arr_m>=0){
											elRemover(i_arr[i_arr_m]);
										}
										
						var img = new Image();
						img.setAttribute('crossOrigin', '');
							img.addEventListener("load", function (e) {
										var WIDTH =e.target.width;
										var HEIGHT = e.target.height;
									if(WIDTH>0 && HEIGHT >0){
										let c_arr=[...cvsSct.getElementsByTagName('CANVAS')];
										let c_arr_m=c_arr.findIndex((c)=>{return c.getAttribute('source_addr')===url[k];});

										if(c_arr_m>=0){
											elRemover(c_arr[c_arr_m]);
										}
											cvsSct.appendChild(e.target);
											
											e.target.onclick=(event)=>{
												event.target.style.setProperty( 'border', 'red 0.3ch outset', 'important' );
												chrome.runtime.sendMessage({message: "hl",url: event.target.getAttribute('src'), f_id:parseInt(event.target.getAttribute("from_frame"))}, function(response) {});
												try{
													OG_img.style.setProperty( 'border', 'red 0.3ch outset', 'important' );
													OG_img.scrollIntoView();
												}catch(e){;}
											};
											
														canvas = document.createElement('canvas');
														canvas.setAttribute("from_frame",fid);
														canvas.setAttribute("source_addr",url);
														canvasCtx = canvas.getContext("2d");
														canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
														canvasCtx.fillStyle = 'rgb(0,0,0)';

													canvasCtx.drawImage(e.target, 0, 0, WIDTH,HEIGHT);
													cvsSct.appendChild(canvas);
													canvas.style.setProperty( 'display', 'none', 'important' );
													
													if(cvsSel.selectedIndex==0){
														cvsSct.style.setProperty( 'display', 'none', 'important' );
													}else if(cvsSel.selectedIndex>=1){
														cvsSct.style.setProperty( 'display', 'inline-flex', 'important' );	
														chrome.runtime.sendMessage({message: "cnt", count: [...cvsSct.getElementsByTagName('CANVAS')].length}, function(response) {;});
													}
													rsz();
													 getColours(canvas,canvasCtx,url,e.target);

									}
							});

							  img.setAttribute("from_frame", fid);
							 img.style.setProperty( 'margin-bottom', '0.18%', 'important' ); 
							 img.style.setProperty( 'margin-right', '0.18%', 'important' );
							 img.style.setProperty( 'transform-origin', 'left top', 'important' );
							 img.crossOrigin = "Anonymous";
							 img.setAttribute("src", url[k]);
			}
			}else if(msg=="hl"){
					try{
						var cvi=(fr_id==0)?[...cvsSct.getElementsByTagName('IMG')]:[];
						var all_i=getMatchingNodesShadow(document,'IMG',true,false);
						var cviF=all_i.filter((i)=>{return !cvi.includes(i);});
						for(let k=0, len=url.length; k<len; k++){
								for (let i=0, len_i=cviF.length; i<len_i; i++){
									let s=(cviF[i].src==='')?cviF[i].currentSrc:cviF[i].src;
									if(s===url){
										cviF[i].scrollIntoView();
										cviF[i].style.setProperty(  'border', 'red 0.3ch outset', 'important' );
									}
								}
						}
					}catch(e){;}
			}
}

function procCanvases(){
	if(fr_id==0){
		clear_out();
	}
	let lks=getMatchingNodesShadow(document,'IMG',true,false).map((i)=>{return (i.src==='')?i.currentSrc:i.src;}).filter((i)=>{return i!==''});
	chrome.runtime.sendMessage({message: "rqi",links: lks, f_id: fr_id}, function(response) {});
}

chrome.runtime.onMessage.addListener(gotMessage);
function gotMessage(message, sender, sendResponse) {
	if(message.message=="rep_tb"){
		(async ()=>{ await get_ids(false); })();
	}else if(message.message=="nav"){
		if(message.f_id===fr_id && ((chg.c==0) || (window.location.href!==chg.u && chg.c>0))){
			chrome.runtime.sendMessage({message: "nav_0",old_url: chg.u, new_url: window.location.href}, function(response) {});
			chg.u=window.location.href;
			chg.c++;
		}
	}else if(message.message=="cnt_this"){
		if(fr_id===0){
			chrome.runtime.sendMessage({message: "cnt", count: ( (window.getComputedStyle(cvsSct)['display']==='none')? 0 : [...cvsSct.getElementsByTagName('CANVAS')].length ) }, function(response) {});
		}
	}else if(message.message=="nav_0"){
			procCanvases();
	}else if(message.message=="rqi"){
			checker(message.imgSrc, message.message, message.f_id);
	}else{
		checker(message.imgSrc, message.message, message.f_id);
	}
	return true; 
}

(async ()=>{ await get_ids(true); })();
