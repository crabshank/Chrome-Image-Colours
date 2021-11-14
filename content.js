let srcs=[];
let canvasses=[];
let cols=[];
let g_ix=0;
var blacklist='';
var isBl='';


var cvsSct=document.createElement('section');
cvsSct.style.setProperty( 'display', 'none', 'important' );
cvsSct.style.setProperty( 'flex-flow', 'wrap', 'important' );
cvsSct.style.setProperty( 'align-items', 'flex-start', 'important' );
var cvsSel=document.createElement('select');
 document.body.insertAdjacentElement('beforeend', cvsSct);
 cvsSct.insertAdjacentElement('beforebegin', cvsSel);
 cvsSel.style.setProperty( 'display', 'flex', 'important' );
 cvsSel.style.setProperty( 'background-color', 'buttonface', 'important' );

   var colNames = ['Show nothing','Show unsorted images','greyscale','red','orange/brown','yellow','chartreuse/lime','green','spring green','cyan','azure/sky blue','blue','violet/purple','magenta/pink','reddish pink','all pink','cyan to blue','chartreuse/lime + green','red + pinks'];

  // Loop through voices and create an option for each one
  colNames.forEach(name => {
    // Create option element
    let opt = document.createElement('option');
	opt.style.cssText='color: black;';
    opt.textContent = name;

    cvsSel.appendChild(opt);
  });

 cvsSel.oninput=function(){
	 if(cvsSel.selectedIndex==0){
		 cvsSct.style.setProperty( 'display', 'none', 'important' );
	 }else if(cvsSel.selectedIndex>=1){
		 cvsSct.style.setProperty( 'display', 'inline-flex', 'important' );
	 }
	 
	 let ix=cvsSel.selectedIndex-2;
	 if (ix>=0){
	 sortByCol(cols, ix);
	 cols.reverse();
	 for (let j = 0;j <canvasses.length; j++){
		 let el= canvasses[cols[j][17]];
			el[0].style.setProperty( 'order', j, 'important' );
		 
	 }

 }
 }
  


function sortByCol(arr, colIndex){
    arr.sort(sortFunction)
    function sortFunction(a, b) {
        a = a[colIndex]
        b = b[colIndex]
        return (a === b) ? 0 : (a < b) ? -1 : 1
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
			if(!isBl[0]){
			checker(null);
			
		if(typeof observer ==="undefined" && typeof timer ==="undefined" ){
			var timer;
		const observer = new MutationObserver((mutations) =>
		{
			if (timer)
			{
				clearTimeout(timer);
			}
			timer = setTimeout(() =>
			{
				checker(null);
			}, 150);
		});


		observer.observe(document,
		{
			attributes: true,
			childList: true,
			subtree: true
		});
	}

			}else{
				console.log('Current site shows images by default ("'+isBl[1]+'")' );
				cvsSel.selectedIndex=1;
				cvsSct.style.setProperty( 'display', 'inline-flex', 'important' );
 
			}
		}
		else
		{

			save_options();
			restore_options();
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

function drawImageFromWebUrl(url, canvas, OG_img){
      var img = new Image();

      img.addEventListener("load", function () {
		   let ctx=canvas.getContext("2d");
			   canvas.width  = OG_img.width;
				canvas.height = OG_img.height;
			   ctx.drawImage(OG_img, 0, 0, OG_img.width, OG_img.height);
		  cvsSct.appendChild(canvas);	
		  getColours(canvas,ctx,url,OG_img);
      });

      img.setAttribute("src", url);
	  

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
var discr=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,g_ix];

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
if(!srcs.includes(url)){
srcs.push(url);
}
canvasses.push([canvas,ctx,OG_img,g_ix]);
g_ix++;
cols.push(discr);
	
canvas.addEventListener('contextmenu', ()=>{	
			  console.log(url);
			  alert(url);
});

canvas.onclick=(event)=>{
			event.target.style.setProperty( 'outline-color', 'red', 'important' );
			event.target.style.setProperty( 'outline-style', 'auto', 'important' );
			event.target.style.setProperty( 'outline-width', '0.3ch', 'important' );
			OG_img.style.setProperty( 'outline-color', 'red', 'important' );
			OG_img.style.setProperty( 'outline-style', 'auto', 'important' );
			OG_img.style.setProperty( 'outline-width', '0.3ch', 'important' );
			OG_img.scrollIntoView();
};
//return discr;
}catch(e){
	elRemover(canvas);
}
}


function startDraw(DOMimgs){
	for (let j=0; j<DOMimgs.length; j++){
		if(!srcs.includes(DOMimgs[j].src)){
		canvas = document.createElement('canvas');
		canvasCtx = canvas.getContext("2d");
		var WIDTH = DOMimgs[j].width;
		var HEIGHT = DOMimgs[j].height;
		if(WIDTH>0 && HEIGHT >0){
		canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
		 canvasCtx.fillStyle = 'rgb(0,0,0)';
			drawImageFromWebUrl( DOMimgs[j].src, canvas, DOMimgs[j]);
		}
		}
	}
}

function checker(url){

var DOMimgs=[...document.getElementsByTagName('IMG')];

if(url!=null && !srcs.includes(url)){
			try{
				var img = new Image();
				img.addEventListener("load", function () {
				document.getElementsByTagName('HEAD')[0].appendChild(img);
				DOMimgs.push(img);
				startDraw(DOMimgs);
				srcs.push(url);
			  });

			  img.setAttribute("src", url);
			//  img.setAttribute("addedImg", true);

			}catch(e){
				startDraw(DOMimgs);
			}
	}else{
		startDraw(DOMimgs);
	}
	

	
	
}
	
chrome.runtime.onMessage.addListener(gotMessage);
function gotMessage(message, sender, sendResponse) {
	checker(message.imgSrc);
}

restore_options();
	