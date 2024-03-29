chg_recs={};
var canvasses=[];
var g_ix=0;
var blacklist='';
var fr_id=null;
var tb_id=null;
var to_draw=[];
var resizeObserver=null;
//var wzoom=window.devicePixelRatio;
var activ=null;
var blk=[false,[]];
var firstImgs=false;
var max_hgt=null;
var img_cnt_ro=0;
var loadedURLs=[];
var loadedToRemURLs={};
var xtraBottom=5;

function removeEls(d, array) {
  var newArray = [];
  for (let i = 0; i < array.length; i++) {
	  if (array[i] !== d) {
		  newArray.push(array[i]);
	  }
  }
  return newArray;
}

function addChk(c) {
  if (c.split('://')[0] == "") {
	  return false;
  }

  if (c.split('://')[c.split('://').length + 1] == "") {
	  return false;
  }


  if (c.split('://').join('').split('/').length !== removeEls("", c.split('://').join('').split('/')).length) {
	  return false;
  }
  return true;
}

const schemes = ["https:", "http:", "ftp:"];
const extensions = ['apng', 'avif', 'gif', 'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'svg', 'webp', 'bmp', 'ico', 'cur', 'tif', 'tiff', 'heif', 'heic'];
const unsafe = [32, 34, 39, 60, 62, 91, 93, 94, 96, 123, 124, 125, 338, 339, 352, 353, 376, 710, 8194, 8195, 8201, 8204, 8205, 8206, 8207, 8211, 8212, 8216, 8217, 8218, 8220, 8221, 8222, 8224, 8225, 8240, 8249, 8250, 8364]

function findRegexIndices(string, substring, caseSensitive, indices) {
  var substringLen = substring.length,
	  reg = new RegExp(substring, caseSensitive ? 'gi' : 'g'),
	  result;

  while ((result = reg.exec(string))) {
	  indices.push([result.index, result.index + substringLen]);
  }
  return indices;
}

function getImgLinks() {
	
	function schLoop(schx){
		let out=[];
		for (let j = 0, len_j=schx.length; j <len_j ; j++) {
			let sxj=schx[j];
			let sxj0=sxj[0];
			let sxj1=sxj[1];
			let past = false;
			let strng = "";
			let last_string = str.substring(sxj0,sxj1);
			let cnt = 1;
			while (past === false) {
			  strng = str.substring(sxj0,sxj1 + cnt);
				  for (let k = 0, len_k=unsafe.length; k <len_k ; k++) {
				  if (strng.charCodeAt(strng.length - 1) === unsafe[k]) {
					  k = unsafe.length - 1;
					  past = true;
					  out.push(last_string);
				  }
			  }
			  last_string = strng;
			  cnt++;
			}
		}
		return out;
	}
	
	
	
	let fnl = [];
	let check = [];
	let check_data = [];
	let scheme_ix = [];
	let scheme_data = [];

	let str = document.documentElement.outerHTML.split('\\').join('');


	for (let s = 0, len_s=schemes.length; s <len_s ; s++) {
	  findRegexIndices(str, schemes[s], false, scheme_ix);
	}
	
	findRegexIndices(str ,"data\\:image[^\\;]*\\;", false, scheme_data);
	
	check= schLoop(scheme_ix);
	check_data= schLoop(scheme_data);

	for (let k = 0, len_k=check.length; k <len_k ; k++) {
		check[k]=[check[k],false]
	}
	
	for (let k = 0, len_k=check_data.length; k <len_k ; k++) {
		check.push([check_data[k],true])
	}
	
	for (let k = 0, len_k=check.length; k <len_k ; k++) {
		  let ck=check[k];
		  let ck1=ck[1];
		  let chk=ck[0].split('\\').join('');

		  for (let j = 0, len_j=extensions.length; j <len_j ; j++) {
			  let ej=extensions[j];
			  if ( (chk.toLocaleLowerCase().includes('.' + ej) && ck1===false) || ck1===true ) {
				  let u=chk.split(' ').join('');
				  let q=';';
				  u=(u.endsWith(q))?u.slice(0,-q.length):u;
				  q=')';
				  u=(u.endsWith(q))?u.slice(0,-q.length):u; 
				  q=';';
				  u=(u.endsWith(q))?u.slice(0,-q.length):u;
				  q='&quot';
				  u=(u.endsWith(q))?u.slice(0,-q.length):u;
				if(!fnl.includes(u)){
					fnl.push(u);
				}
				
				break;
			  }
		  }
	}

	return fnl;
}

function isScrollBottom(){
		try{
	let t = [		window?.pageYOffset,
											window?.scrollY,
											document?.documentElement?.scrollTop,
											document?.body?.parentNode?.scrollTop,
											document?.body?.scrollTop,
											document?.head?.scrollTop,
											0
										].filter( (p)=>{return p>=0} );
										
	let y=Math.max(...t)+window.innerHeight;
let h=[	document?.documentElement?.scrollHeight,
				document?.body?.parentNode?.scrollHeight,
				document?.body?.scrollHeight,
				document?.head?.scrollHeight,
				0
			].filter( (p)=>{return p>=0} );
			let g=Math.max(...h);
			
		return ( (Math.abs(y-g)<=1) ? true : false)
		
		}catch(e){return false;}
}

function drawAllPending(){
	try{
			for(let i=0, len=to_draw.length; i<len; i++){
				checker(to_draw[i][0], to_draw[i][1], to_draw[i][2]);
			}
			to_draw=[];
	}catch(e){;}
}

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

function rsz(skp,iab){
	try{
		let imgs=getMatchingNodesShadow(cvsSct,'IMG',true,false);
		for(let i=0, len=imgs.length; i<len; i++){
			imgs[i].style.setProperty('zoom',1,'important' );
		}
		let cvsSct_styl=window.getComputedStyle(cvsSct);
		let t=(cvsSct_styl['display']==='none')?true:false;
		//let icvsTopR=absBoundingClientRect(cvsSctTop);
		//let icvsR=absBoundingClientRect(cvsSct); //image container
		//let ifrmdR=absBoundingClientRect(ifrm.contentWindow.document.documentElement);
		if(skp!==true){
		
		let ifrmR=absBoundingClientRect(ifrm);
		let atBtm=true;
		if(iab!==true){
			atBtm=false;
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
				let ifb=ifrmR.bottom;
				for(let k=0, len_k=h.length; k<len_k;k++){
					if(Math.abs(ifb - h[k])<1){
						atBtm=true;
						break;
					}
				}
			}
			if( atBtm===false ||  iab===true ){
				if(iab!==true){
					ifrm.setAttribute('isAboveBtm','true');
				}
				let sch=parseFloat(document.documentElement.scrollHeight)-(ifrmR.top);
				ifrm.style.setProperty('top','','important');
				let t1=absBoundingClientRect(ifrm).top;
				ifrm.style.setProperty('top',`${sch*0.18}px`,'important');
				let t2=absBoundingClientRect(ifrm).top;
				if(t1>t2){
					ifrm.style.setProperty('top','','important');
				}
				sch*=0.9964;
				ifrm.style.setProperty('max-height',`${sch}px`,'important');
				ifrm.style.setProperty('min-height',`${sch}px`,'important');
				ifrm.style.setProperty('height',`${sch}px`,'important');
				ifrm.contentWindow.document.body.style.overflow='scroll';
			}else{
				
				ifrm.style.setProperty('max-height','','important');
				ifrm.style.setProperty('min-height','','important');
				//ifrm.style.setProperty('height','max-content');
				ifrm.contentWindow.document.body.style.overflow='hidden';
			}
		}else{
			ifrm.contentWindow.document.body.style.overflow='hidden';
		}
		ifrm.contentWindow.document.body.style.display='inline-flex';
		ifrm.contentWindow.document.body.style.flexFlow='column';
		ifrm.contentWindow.document.body.style.background='transparent';
		ifrm.contentWindow.document.body.style.marginTop='0px';

		let sw=getScreenWidth(false);
		let swm8=sw-8;
		ifrm.style.setProperty('width',sw,'important');
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
ifrm.style.setProperty( 'all', 'initial', 'important' );
ifrm.style.setProperty( 'pointer-events', 'none', 'important' );
ifrm.style.setProperty( 'visibility', 'initial', 'important' );
ifrm.style.setProperty( 'position', 'absolute', 'important' );
ifrm.style.setProperty( 'z-index', Number.MAX_SAFE_INTEGER, 'important' );
ifrm.style.setProperty( 'height', '0px', 'important' );
ifrm.style.setProperty( 'width', '-webkit-fill-available', 'important' );
ifrm.style.setProperty( 'margin', 0, 'important' );
ifrm.style.setProperty( 'border', 0, 'important' );
ifrm.style.setProperty( 'display', 'flex', 'important' );
ifrm.style.setProperty( 'background', 'transparent', 'important' );
ifrm.style.setProperty( 'transform', 'translateY(0px)', 'important' );
ifrm.style.setProperty( 'transform-origin', 'left top', 'important' );
ifrm.style.setProperty( 'user-select', 'none', 'important' );
ifrm.style.setProperty( '-webkit-user-select', 'none', 'important' );

document.body.insertAdjacentElement('beforeend',ifrm);

//ifrm.src = "";

let ht=`<html>

<head>
<meta charset="utf-8">
<style>
::-webkit-scrollbar {
    display: none;
}
</style>
</head>
	
<body>
</body>

</html>`;

ifrm.contentWindow.document.open();
ifrm.contentWindow.document.write(ht);
ifrm.contentWindow.document.close();

let style_tag=ifrm.contentWindow.document.head.firstChild;

var cvsSctTop=document.createElement('section');
ifrm.contentWindow.document.body.insertAdjacentElement('afterbegin',cvsSctTop);

let ctR=cvsSctTop.getBoundingClientRect();
ifrm.style.setProperty('padding-top',ctR.height,'important');
ifrm.style.setProperty( 'padding', 0, 'important' );

var cvsSct=document.createElement('section');
var cvsClr=document.createElement('button');
var cvsSel=document.createElement('select');
const colNames = ['Show nothing','Show unsorted images','Greyscale','Red','Orange/Brown','Yellow','Chartreuse/Lime','Green','Spring green','Cyan','Azure/Sky blue','Blue','Violet/Purple','Magenta/Pink','Reddish pink','All Pinks','Cyan to Blue','Chartreuse/Lime + Green','Red + Pinks','Average of unique colours'];

function deGreen(){
	if(fr_id===0){
		let us=getMatchingNodesShadow(cvsSct,'IMG',true,false);
		let ux=us.filter((i)=>{return i.getAttribute('ghl')=='true'});
		if(ux.length>0){
			for(let i=0, len=ux.length;  i<len; i++){
				let uImg=ux[i];
				if(uImg.getAttribute('rhl')!='true'){
					uImg.style.setProperty( 'border', '', 'important' );
					uImg.setAttribute('ghl',false);
				}
			}
		}
	}
}

function clear_out(){
	if(fr_id==0 ){
		to_draw=[];
		if(activ===true){
			cvsSct.innerHTML='';
			canvasses=[];
			loadedURLs=[];
			loadedToRemURLs={};
			img_cnt_ro=0;
			max_hgt=null;
			g_ix=0;
			chrome.runtime.sendMessage({message: "clr"}, function(response) {});
			chrome.runtime.sendMessage({message: "cnt", count:0}, function(response) {});
			rsz();
		}
	}
}

window.addEventListener('resize',(event)=>{
	rsz();
});

function setup(){
	let scr=isScrollBottom();
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
	ifrm.style.setProperty( 'pointer-events', 'auto', 'important' );
	cvsSctTop.appendChild(cvsSel);
	cvsSctTop.appendChild(cvsClr);
	cvsSct.insertAdjacentElement('beforebegin', cvsSctTop);

	cvsSel.style.setProperty( 'display', 'flex', 'important' );
	firstImgs=true;
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
		let z=false;
		let sch;
		if(cvsSel.selectedIndex!=0){
			z=true;
			drawAllPending();
			chrome.runtime.sendMessage({message: "nav_0_noClear"}, function(response) {;});
			doSort();
			sch=ifrm.contentWindow.document.body.getBoundingClientRect().height+xtraBottom;
		}else{
			cvsSct.style.setProperty( 'display', 'none', 'important' );
			sch=cvsSctTop.getBoundingClientRect().height+xtraBottom;
		}
		ifrm.style.setProperty('max-height',`${sch}px`,'important');
		ifrm.style.setProperty('min-height',`${sch}px`,'important');
		ifrm.style.setProperty('height',`${sch}px`,'important');
		
		if(z){
			ifrm.scrollIntoView({behavior: "instant", block: 'start', inline: 'start'});
		}
	}
		
		if(blk[0]){
			console.log('Image colours - Current site shows images by default ("'+blk[1][1]+'")' );
			cvsSel.selectedIndex=1;
			cvsSct.style.setProperty( 'display', 'flex', 'important' );
		}
	ifrm.style.setProperty( 'height', 'max-content', 'important' );
	 rsz(true);
	 
		if(resizeObserver===null){
			resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					let cimgs=getMatchingNodesShadow(cvsSct,'IMG',true,false);
					let cil=cimgs.length;
					let rzh=entry.devicePixelContentBoxSize[0].blockSize;
					let hs=(max_hgt===null || rzh>max_hgt)?true:false;
					let ic=(cil!==img_cnt_ro)?true:false;
					if( hs|| ic ){
						max_hgt=hs ? rzh : max_hgt;
						img_cnt_ro=ic ? cil : img_cnt_ro;
						let iab=(ifrm.getAttribute('isAboveBtm')=='true')?true:false;
						rsz(false,iab);
						if(!iab){
							ifrm.style.setProperty('height',(entry.target.getBoundingClientRect().height+xtraBottom)+'px','important');
						}
					}
				}
			});
			 resizeObserver.observe(ifrm.contentWindow.document.body);
		}

	if(scr){
		ifrm.scrollIntoView({behavior: "instant", block: 'end', inline: 'start'});
	}
}

function initSetup(){
	if(fr_id==0){
		chrome.runtime.sendMessage({message: "resetBdg"}, function(response) {;});
		if(activ===true){
			setup();
			
			let abt=false;
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
				let ifrmR=absBoundingClientRect(ifrm);
				let ifb=ifrmR.bottom;
				for(let k=0, len_k=h.length; k<len_k;k++){
					if(Math.abs(ifb - h[k])<1){
						abt=true;
						break;
					}
				}
				
			if(abt===false){
				ifrm.setAttribute('isAboveBtm','true');
				ifrm.scrollIntoView({behavior: "instant", block: 'start', inline: 'start'});
			}
			
			let lks=getMatchingNodesShadow(document,'IMG',true,false).map((i)=>{return (i.src==='')?i.currentSrc:i.src;}).filter((i)=>{return i!==''});
			let gl=getImgLinks();
			for(let i=0, len=gl.length; i<len; ++i){
				let gi=gl[i];
				if(!lks.includes(gi)){
					lks.push(gi);
				}
			}
			chrome.runtime.sendMessage({message: "rqi",links: lks, f_id: fr_id}, function(response) {});
		}
	}	
}

async function get_ids(){
	return new Promise(function(resolve, reject) {
		restore_options();
		chrome.runtime.sendMessage({message: "get_info", chg:window.location.href}, function(response) {
			fr_id=response.info.frameId;
			tb_id=response.info.tab.id;
			if(fr_id===0){
				chg_recs[(fr_id).toString()]=window.location.href;
			}
			initSetup();
			resolve();
		});
	});
}

function keepMatchesShadow(els,slcArr,isNodeName){
   if(slcArr[0]===false){
      return els;
   }else{
		let out=[];
		for(let i=0, len=els.length; i<len; i++){
		  let n=els[i];
				for(let k=0, len_k=slcArr.length; k<len_k; k++){
					let sk=slcArr[k];
					if(isNodeName){
						if((n.nodeName.toLocaleLowerCase())===sk){
							out.push(n);
						}
					}else{ //selector
						   if(!!n.matches && typeof n.matches!=='undefined' && n.matches(sk)){
							  out.push(n);
						   }
					}
				}
		}
		return out;
   	}
}

function getMatchingNodesShadow(docm, slc, isNodeName, onlyShadowRoots){
	let slcArr=[];
	if(typeof(slc)==='string'){
		slc=(isNodeName && slc!==false)?(slc.toLocaleLowerCase()):slc;
		slcArr=[slc];
	}else if(typeof(slc[0])!=='undefined'){
		for(let i=0, len=slc.length; i<len; i++){
			let s=slc[i];
			slcArr.push((isNodeName && slc!==false)?(s.toLocaleLowerCase()):s)
		}
	}else{
		slcArr=[slc];
	}
	var shrc=[docm];
	var shrc_l=1;
	var out=[];
	let srCnt=0;

	while(srCnt<shrc_l){
		let curr=shrc[srCnt];
		let sh=(!!curr.shadowRoot && typeof curr.shadowRoot !=='undefined')?true:false;
		let nk=keepMatchesShadow([curr],slcArr,isNodeName);
		let nk_l=nk.length;
		
		if( !onlyShadowRoots && nk_l>0){
			for(let i=0; i<nk_l; i++){
				out.push(nk[i]);
			}
		}
		
		for(let i=0, len=curr.childNodes.length; i<len; i++){
			shrc.push(curr.childNodes[i]);
		}
		
		if(sh){
			   let cs=curr.shadowRoot;
			   let csc=[...cs.childNodes];
			   if(onlyShadowRoots){
				  if(nk_l>0){
				   out.push({root:nk[0], childNodes:csc});
				  }
			   }
				for(let i=0, len=csc.length; i<len; i++){
					shrc.push(csc[i]);
				}
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
	 
	 let d=[];
	if(cvsSel.selectedIndex==21){
	 sortByArrCols(cols,[21,18,19],[-1,-1,-1]);
	 for (let j = 0, len=cols.length; j<len; j++){
		let el= canvasses[cols[j][17]];
		d.push(el[2]);
	}
 }else if (cvsSel.selectedIndex>=2){
		 sortByCol(cols, cvsSel.selectedIndex-2);
		 for (let j = 0, len=cols.length; j<len; j++){
			let el= canvasses[cols[j][17]];
			d.push(el[2]);
		}
 }else if(cvsSel.selectedIndex==1){
	  
	 let fn=[];
	 let fa=[];
	  for (let j = 0, len=cols.length; j<len; j++){
		  let cj=cols[j];
		  if(cj[20]===false){
			   fa.push(cj);
		  }else{
			   fn.push(cj);
		  }
	  }
	 sortByArrCols(fa,[21,18,19],[1,-1,-1]);
	sortByArrCols(fn,[20,18,19],[-1,-1,-1]);
	cols=[...fn,...fa];
	for (let j = 0, len=cols.length; j<len; j++){
		let el= canvasses[cols[j][17]];
		d.push(el[2]);
	 }
	 //console.log(cols);
	let imgs=getMatchingNodesShadow(cvsSct,'IMG',true,false);
	
	let dnl=[];
	let dns=[];
	 for (let j = 0, len=imgs.length; j<len; j++){
		 let ij=imgs[j];
		if(ij.getAttribute('loaded')=='false'){
			dnl.push(ij);
		}else if(!ij.getAttribute('has_source_img')=='true'){
			dns.unshift(ij);
		}else if(!d.includes(ij)){
			d.push(ij);
		}
	 }
	 d=[...d,...dns,...dnl];
 }

 for (let j = 0, len=d.length; j<len; j++){
		  	d[j].style.setProperty( 'order', j, 'important' );
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
				chrome.runtime.sendMessage({message: "cnt", count: 0}, function(response) {;});
				activ=true;
				blk=[true,isBl];
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
let gry=(r==g && r==b)?true:false;
	  
	    r /= 255, g /= 255, b /= 255;
		let max=Math.max(r,g,b);
		let min=Math.min(r,g,b);
		let d=max-min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

if(gry){
   return [0,Math.round(max*100)];
  }

let hue=Math.floor(h*600);
  
if((hue>=3525)||(((hue>=0) && (hue<75)))){ 
	return [1,Math.floor(h*120)];
}else{
	let hr=Math.floor(h*60);
	if((hue>=75) && (hue<375)){
	 return [2,hr];
	}else if((hue>=375) && (hue<675)){
	 return [3,hr];
	}else if((hue>=675) && (hue<975)){
	 return [4,hr];
	}else if((hue>=975) && (hue<1275)){
	 return [5,hr];
	}else if((hue>=1275) && (hue<1575)){
	 return [6,hr];
	}else if((hue>=1575) && (hue<1875)){
	 return [7,hr];
	}else if((hue>=1875) && (hue<2175)){
	 return [8,hr];
	}else if((hue>=2175) && (hue<2475)){
	 return [9,hr];
	}else if((hue>=2475) && (hue<3075)){
	 return [10,Math.floor(h*30)];
	}else if((hue>=3075) && (hue<3375)){
	 return [11,hr];
	}else if((hue>=3375) && (hue<3525)){
	 return [12,Math.floor(h*120)];
	}
}
  
  
}

function getColours(canvas,ctx,url,OG_img){
try{
g_ix=canvasses.length;
let iRct=absBoundingClientRect(OG_img);
var discr=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,g_ix,iRct.top,iRct.left,0,0]; //last for unique colours
var diffCols= [ [{},0,101], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31], [{},0,31] ];


var colour_data=ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
var pxCnt=0;
for (let p = 0, len=Math.round(4* ctx.canvas.height*ctx.canvas.width) ; p <len ;p+=4){
	pxCnt++;
let r= colour_data[p];
let g= colour_data[p+1];
let b= colour_data[p+2];
let dc1=getDiscCol(r,g,b);
let dc=dc1[0];
discr[dc]++;

let s=`${dc1[1]}`;
if( typeof(diffCols[dc][0][s])==='undefined' ){
	diffCols[dc][0][s]=1;
	diffCols[dc][1]++;
}else{
	diffCols[dc][0][s]++;
}
}

discr[13]=discr[11]+discr[12];
discr[14]=discr[7]+discr[8]+discr[9];
discr[15]=discr[4]+discr[5];
discr[16]=discr[13]+discr[1];

for (let i = 0; i<=16; i++){
discr[i]=discr[i]/pxCnt;
}

let diffAvg=0;
let diffCnt=0;

for (let i = 0; i<=12; i++){ //loop over colours
	if(discr[i]>0){
		discr[20]++;
	}
	if( diffCols[i][1]>0 ){
		diffAvg+=diffCols[i][1]/diffCols[i][2];
		diffCnt++;
	}
}
diffAvg=(diffCnt!==0)?diffAvg/diffCnt:0;
discr[21]=diffAvg;
let c=discr[20];
discr[20]=(OG_img.getAttribute("has_source_img")=='true')?Math.sqrt(  1-(  ( (c==0)?0:c-1 )/13  )  )*( Math.sqrt( (iRct.top*iRct.top)+(iRct.left*iRct.left) + 1) ):false;
canvasses.push([canvas,ctx,OG_img,discr]);
	
doSort();
}catch(e){;}
}

function checker(url, msg, fid){
	if(cvsSel.selectedIndex==0){
		to_draw.push([url, msg, fid]);
	}else if((msg=="detect" || msg=="rqi") && fr_id==0 && cvsSel.selectedIndex>=1){
				url=Array.from(new Set(url));
				let cvsUrls=getMatchingNodesShadow(cvsSct,'IMG',true,false).map((i)=>{return i.getAttribute('og_url');});
				let igs=getMatchingNodesShadow(document,'IMG',true,false);
					for(let k=0, len=url.length; k<len; k++){
						let alreadyLoaded=loadedURLs.findIndex(u=>{return (	u.includes(url[k]) || (url[k]).includes(u)	); });
						let ldf=true;
						if(alreadyLoaded!==-1){
							ldf=false;
							let alu=loadedURLs[alreadyLoaded];
							if(alu.length>url[k].length){
								ldf=true;
								loadedToRemURLs[ url[k] ]=[...getMatchingNodesShadow(cvsSct,'IMG',true,false).map((i)=>{return i.getAttribute('og_url');}).filter((i)=>{return i===alu;}),
								...getMatchingNodesShadow(cvsSct,'CANVAS',true,false).map((i)=>{return i.getAttribute('og_addr');}).filter((i)=>{return i===alu;})
								];
							}
						}
						
						if(!cvsUrls.includes(url[k]) && ldf===true){
						let iel=igs.find((i)=>{return (i.src===url[k] || i.currentSrc===url[k] ); });
						iel=(typeof(iel)==='undefined')?false:true;
						var img = new Image();
						img.setAttribute('crossOrigin', '');
							img.addEventListener("load", function (e) {
								let imge=e.target;
								 imge.setAttribute("loaded", true);
								 let ogu=imge.getAttribute("og_url");
								 loadedURLs.push(ogu);
								let url_img= imge.getAttribute('src');
										var WIDTH =imge.width;
										var HEIGHT = imge.height;
									if(WIDTH>0 && HEIGHT >0){
											let logu=loadedToRemURLs[ogu];
											if ( typeof(logu)!=='undefined'){
												for(let r=0, len=logu.length; r<len; r++){
													elRemover(logu[r]);
												}
												delete loadedToRemURLs[ogu];
											}
											
											imge.onclick=(event)=>{
												event.target.style.setProperty( 'border', 'red 0.3ch outset', 'important' );
												event.target.setAttribute('rhl',true);
												chrome.runtime.sendMessage({message: "hl",url: event.target.getAttribute('src'), f_id:parseInt(event.target.getAttribute("from_frame"))}, function(response) {});
												try{
													OG_img.style.setProperty( 'border', 'red 0.3ch outset', 'important' );
													OG_img.setAttribute('rhl',true);
													OG_img.scrollIntoView({behavior: "instant", block: 'start', inline: 'start'});
												}catch(e){;}
											};
											
														canvas = document.createElement('canvas');
														canvas.setAttribute("from_frame",fid);
														canvas.setAttribute("source_addr",url_img);
														canvas.setAttribute("og_addr",ogu);
														canvasCtx = canvas.getContext("2d");
														canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
														canvasCtx.fillStyle = 'rgb(0,0,0)';

													canvasCtx.drawImage(imge, 0, 0, WIDTH,HEIGHT);
													cvsSct.appendChild(canvas);
													canvas.style.setProperty( 'display', 'none', 'important' );
													
													if(cvsSel.selectedIndex==0){
														cvsSct.style.setProperty( 'display', 'none', 'important' );
													}else if(cvsSel.selectedIndex>=1){
														cvsSct.style.setProperty( 'display', 'inline-flex', 'important' );
														if(activ===true){
															chrome.runtime.sendMessage({message: "cnt", count: getMatchingNodesShadow(cvsSct,'IMG',true,false).length}, function(response) {;});
														}
													}
													rsz();
													 getColours(canvas,canvasCtx,url_img,imge);

									}else{
										elRemover(imge);
									}
							});

							 img.setAttribute("from_frame", fid);
							 img.style.setProperty( 'margin-bottom', '0.18%', 'important' ); 
							 img.style.setProperty( 'margin-right', '0.18%', 'important' );
							 img.style.setProperty( 'transform-origin', 'left top', 'important' );
							 img.style.setProperty( 'border-radius', '0%', 'important' );
							 img.crossOrigin = "Anonymous";
							 cvsSct.appendChild(img);
							 img.setAttribute("loaded", false);
							 img.setAttribute("has_source_img", iel);
							 img.setAttribute("og_url", url[k]);
							 img.setAttribute("src", url[k]);
					}
			}
			}else if(msg=="hl"){
					try{
						var cvi=(fr_id===0)?getMatchingNodesShadow(cvsSct,'IMG',true,false):[];
						var all_i=getMatchingNodesShadow(document,'IMG',true,false);
						var cviF=all_i.filter((i)=>{return !cvi.includes(i);});
						let shd=false;
						for(let k=0, len=url.length; k<len; k++){
								for (let i=0, len_i=cviF.length; i<len_i; i++){
											let s=(cviF[i].src==='')?cviF[i].currentSrc:cviF[i].src;
											if(s===url){
												if(shd===false){
													deGreen();
													shd=true;
												}
												cviF[i].style.setProperty(  'border', 'red 0.3ch outset', 'important' );
												cviF[i].scrollIntoView({behavior: "instant", block: 'start', inline: 'start'});
											}
								}
						}
					}catch(e){;}
			}
}

function procCanvases(skip_clear){
	if(fr_id==0 && skip_clear!==true){
		clear_out();
	}
	let lks=getMatchingNodesShadow(document,'IMG',true,false).map((i)=>{return (i.src==='')?i.currentSrc:i.src;}).filter((i)=>{return i!==''});
	let gl=getImgLinks();
	for(let i=0, len=gl.length; i<len; ++i){
		let gi=gl[i];
		if(!lks.includes(gi)){
			lks.push(gi);
		}
	}
	chrome.runtime.sendMessage({message: "rqi",links: lks, f_id: fr_id}, function(response) {});
}

chrome.runtime.onMessage.addListener(gotMessage);
function gotMessage(message, sender, sendResponse) {
	if(message.message=="activate" && activ===null){
		chrome.runtime.sendMessage({message: "cnt", count: 0}, function(response) {;});
		activ=true;
		initSetup();
	}else if(message.message=="activate" && firstImgs===true){
		let d=window.getComputedStyle(ifrm)['visibility'];
		if(d==='hidden'){
			ifrm.style.setProperty('visibility','visible','important');
		}else{
			ifrm.style.setProperty('visibility','hidden','important');
		}
	}else if(message.message=="chg"){
		let mfs=message.frs;
		let mcg=message.chg;
		if(fr_id===0 && chg_recs[mfs]!==mcg){
				let msg=(typeof(chg_recs[mfs])!=='undefined')?"nav_0":"nav_0_noClear";
				chg_recs[mfs]=mcg; // store frame url
				chrome.runtime.sendMessage({message:msg}, function(response) {;});
		}
	}else if(message.message=="rep_tb"){
		(async ()=>{ await get_ids(); })();
	}else if(message.message=="nav"){
		if(message.f_id===fr_id){
			chrome.runtime.sendMessage({message: "get_info", chg:window.location.href}, function(response) {;}); // send updated frame url
		}
	}else if(message.message=="cnt_this"){
		if(fr_id===0 && activ){
			chrome.runtime.sendMessage({message: "cnt", count: ( (window.getComputedStyle(cvsSct)['display']==='none')? 0 : getMatchingNodesShadow(cvsSct,'IMG',true,false).length ) }, function(response) {});
		}
	}else if(message.message=="nav_0"){
			procCanvases();
	}else if(message.message=="nav_0_noClear"){
			procCanvases(true);
	}else if(message.message=="rqi"){
			checker(message.imgSrc, message.message, message.f_id);
	}else if(message.message==="detect"){
		if(activ===null){
			to_draw.push([message.imgSrc, message.message, message.f_id]);
		}else{
			checker(message.imgSrc, message.message, message.f_id);
		}
	}else if( message.message==='jmp'){
		if(fr_id===0 && window.getComputedStyle(cvsSct)['display']!=='none'){
			let us=getMatchingNodesShadow(cvsSct,'IMG',true,false);
			let ux=us.findIndex((i)=>{return i.getAttribute('og_url')===message.imgSrc});
			if(ux>=0){
				deGreen();
				let uImg=us[ux];
				if(uImg.getAttribute('rhl')!='true'){
					uImg.style.setProperty( 'border', 'hsl(103deg 100% 50%) 0.3ch outset', 'important' );
				}
				uImg.setAttribute('ghl',true);
				uImg.scrollIntoView({behavior: "instant", block: 'start', inline: 'start'});
			}
		}
	}else if( message.message==='hl'|| activ!==null){
		checker(message.imgSrc, message.message, message.f_id);
	}
	return true; 
}

(async ()=>{ await get_ids(); })();
