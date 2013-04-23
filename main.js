(function(){

init();

var viewMsg = null;
var viewProp = null;
var viewTALB = null;
var viewTIT2 = null;
var viewTPE1 = null;
var viewAPIC = null;

function init(){
	window.addEventListener("load", function(){

		if (window.File) {
		} else {
			window.alert("本ブラウザではFile APIが使えません。");
		}

		viewMsg = document.getElementById("viewMsg");
		viewProp = document.getElementById("viewProp");
		viewTALB = document.getElementById("viewTALB");
		viewTIT2 = document.getElementById("viewTIT2");
		viewTPE1 = document.getElementById("viewTPE1");
		viewAPIC = document.getElementById("viewAPIC");

		var areaDrop = document.getElementById("areaDrop");

		areaDrop.addEventListener("dragover", function(event){
			event.preventDefault();
		}, false);

		areaDrop.addEventListener("drop", function(event){
			event.preventDefault();
			onDropFile(event);
		}, false);

	}, false);
}

function clearView(){
	viewMsg.innerText = "";
	viewProp.innerText = "";
	viewTALB.innerText = "";
	viewTIT2.innerText = "";
	viewTPE1.innerText = "";
	viewAPIC.innerHTML = "";
}

function onDropFile(event) {
	clearView();

	var f = event.dataTransfer.files[0];
	viewProp.innerText = "○Name : " + f.name + ", ○Type : " + f.type + ", ○Size : " + Math.ceil(f.size / 1024) + " KB ";

	if (!/^audio\/mp3/.test(f.type)) {
		viewMsg.innerText = "mp3ファイルをドロップして下さい。";
		return;
	}

	var reader = new FileReader();

	reader.onerror = function(event){
		viewMsg.innerText = "ファイル読み取り時にエラーが発生しました。";
		return;
	}

	reader.onload = function(event){
		readID3(event, event.target.result);
	}

	reader.readAsArrayBuffer(f);
}

function readID3(event, arrayBuffer){

	var bytes = new Uint8Array(arrayBuffer);

	try{
		ID3Reader.read(bytes);
	}catch(e){
		viewMsg.innerText = "ID3Reader Error : " + e.message;
		return;
	}

	viewTALB.innerText = ID3Reader.getTALB();
	viewTIT2.innerText = ID3Reader.getTIT2();
	viewTPE1.innerText = ID3Reader.getTPE1();

	if (ID3Reader.getAPIC_mimeType() !== "") {
		var imgSrc = "data:" + ID3Reader.getAPIC_mimeType() + ";base64," + Base64.encode(ID3Reader.getAPIC_binary());
		createImgElemInViewAPIC(imgSrc);
	}
}
function createImgElemInViewAPIC(src){
	var img = document.createElement("img");
	img.src = src;
	img.title = "coverImage";
	viewAPIC.appendChild(img);
}

})();
