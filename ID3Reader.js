var ID3Reader = function(){

	var HEADER_FRAME_SIZE = 10;

	var ID3Header = {
		VER: ""
	};
	var ID3Frames = {
		TALB: ""
		, TIT2: ""
		, TPE1: ""
		, APIC: {
			mimeType: ""
			, binary: null
		}
	};

	var clearID3Header = function(){
		ID3Header.VER = "";
	};
	var clearID3Frames = function(){
		ID3Frames.TALB = "";
		ID3Frames.TIT2 = "";
		ID3Frames.TPE1 = "";
		ID3Frames.APIC.mimeType = "";
		ID3Frames.APIC.binary = "";
	};

	var ID3FrameID = {
		ID3: null
		, TALB: null
		, TIT2: null
		, TPE1: null
		, APIC: null
	};
	(function(){
		for (var IDName in ID3FrameID) {
			var val = [];
			var len = IDName.length;
			for (var i = 0; i < len; i++) {
				val[i] = IDName.charCodeAt(i);
			}
			ID3FrameID[IDName] = val;
		}
	})();

	//--------------------------------------------------------------------------------
	var isID3v2 = function(bytes){
		if (bytes[0] === ID3FrameID["ID3"][0]
			&& bytes[1] === ID3FrameID["ID3"][1]
			&& bytes[2] === ID3FrameID["ID3"][2]) {
			return true;
		}
		return false;
	};
	var readID3Header = function(bytes){
		if (bytes[3] === 0x02 && bytes[4] === 0x00) {
			ID3Header.VER = "v2.2";
		}else if (bytes[3] === 0x03 && bytes[4] === 0x00) {
			ID3Header.VER = "v2.3";
		}else if (bytes[3] === 0x04 && bytes[4] === 0x00) {
			ID3Header.VER = "v2.4";
		}
	};
	var isID3v22 = function(){
		if (ID3Header.VER === "v2.2") {
			return true;
		}
		return false;
	};

	var readID3Frames = function(bytes){
		var len = readID3PartBodySize(bytes);
		var skip = 0;
		for (var i = 0; i < len; ) {
			if (isTALB(bytes, i)) {
				skip = readTALB(bytes, i);
				i += skip;
			}else if (isTIT2(bytes, i)) {
				skip = readTIT2(bytes, i);
				i += skip;
			}else if (isTPE1(bytes, i)) {
				skip = readTPE1(bytes, i) - 1;
				i += skip;
			}else if (isAPIC(bytes, i)) {
				skip = readAPIC(bytes, i) - 1;
				i += skip;
			}else{
				i++;
			}
		}
	};

	var readID3PartBodySize = function(bytes){
		var size = (bytes[6] * Math.pow(128,3)) + (bytes[7] * Math.pow(128,2)) + (bytes[8] * Math.pow(128,1)) + (bytes[9] * Math.pow(128,0));
		return size;
	};

	//--------------------------------------------------------------------------------
	var isTALB = function(bytes, i){
		return isID(bytes, i, "TALB");
	};
	var isTIT2 = function(bytes, i){
		return isID(bytes, i, "TIT2");
	};
	var isTPE1 = function(bytes, i){
		return isID(bytes, i, "TPE1");
	};
	var isAPIC = function(bytes, i){
		return isID(bytes, i, "APIC");
	};

	var isID = function(bytes, i, IDName){
		if (bytes[i] === ID3FrameID[IDName][0]
			&& bytes[i+1] === ID3FrameID[IDName][1]
			&& bytes[i+2] === ID3FrameID[IDName][2]
			&& bytes[i+3] === ID3FrameID[IDName][3]) {
			return true;
		}
		return false;
	};

	//--------------------------------------------------------------------------------
	var readTALB = function(bytes, i){
		return readText(bytes, i, "TALB");
	};
	var readTIT2 = function(bytes, i){
		return readText(bytes, i, "TIT2");
	};
	var readTPE1 = function(bytes, i){
		return readText(bytes, i, "TPE1");
	};

	var readText = function(bytes, i, IDName){
		var size = readFrameBodySize(bytes, i);
		var encodeIndex = i + HEADER_FRAME_SIZE;
		var text = "";

		//ISO-8859-1(Latin-1)
		if (bytes[encodeIndex] === 0x00) {
			text = getStringLatin1(bytes, encodeIndex + 1, size - 1);

		//UTF-16 with BOM
		}else if (bytes[encodeIndex] === 0x01) {
			text = getStringUTF16(bytes, encodeIndex + 1, size - 3);

		//UTF-16BE without BOM
		}else if (bytes[encodeIndex] === 0x02) {
			text = getStringUTF16BE(bytes, encodeIndex + 1, size - 1);

		//UTF-8 (v2.4)
		}else if (bytes[encodeIndex] === 0x03) {
			text = getStringUTF8(bytes, encodeIndex + 1, size - 1);
		}

		ID3Frames[IDName] = text;
		return HEADER_FRAME_SIZE + size;
	};

	var readFrameBodySize = function(bytes, i){
		return (bytes[i+4] << 24) | (bytes[i+5] << 16) | (bytes[i+6] << 8) | bytes[i+7];
	};
	var readFrameBodySizeV24ForAPIC = function(bytes, i){
		return (bytes[i+4] * Math.pow(128,3)) + (bytes[i+5] * Math.pow(128,2)) + (bytes[i+6] * Math.pow(128,1)) + (bytes[i+7] * Math.pow(128,0));
	};

	var getStringLatin1 = function(bytes, beginIndex, size){
		var latin1Uint8Array = bytes.subarray(beginIndex, beginIndex + size);
		return String.fromCharCode.apply(null, latin1Uint8Array);
	};

	var getStringUTF16 = function(bytes, beginIndex, size){
		//LE
		if (bytes[beginIndex] === 0xff && bytes[beginIndex + 1] === 0xfe) {
			return getStringUTF16LE(bytes, beginIndex + 2, size);
		//BE
		}else if (bytes[beginIndex] === 0xfe && bytes[beginIndex + 1] === 0xff) {
			return getStringUTF16BE(bytes, beginIndex + 2, size);
		}
	};
	var getStringUTF16LE = function(bytes, beginIndex, size){
		return getStringUTF16Common(bytes, beginIndex, size, "LE");
	};
	var getStringUTF16BE = function(bytes, beginIndex, size){
		return getStringUTF16Common(bytes, beginIndex, size, "BE");
	};
	var getStringUTF16Common = function(bytes, beginIndex, size, mode){
		var array16BE = [];
		var lastIndex = size + beginIndex;
		var offset1 = 0;
		var offset2 = 1;
		if (mode === "LE") {
			offset1 = 1;
			offset2 = 0;
		}
		for (var i = beginIndex; i < lastIndex; i += 2) {
			array16BE.push( (bytes[i + offset1] << 8) | bytes[i + offset2] );
		}
		//SurrogatePair OK
		return String.fromCharCode.apply(null, array16BE);
	};

	var getStringUTF8 = function(bytes, beginIndex, size){
		var array16BE = [];
		var lastIndex = size + beginIndex;
		var codepoint = 0x00;
		var highSurrogate = 0x00;
		var lowSurrogate = 0x00;
		var tmp = 0x00;
		for (var i = beginIndex; i < lastIndex; ) {
			//1byte
			if (bytes[i] < 0x80) {
				codepoint = bytes[i];
				array16BE.push(codepoint);
				i++;

			//2byte
			}else if (bytes[i] >= 0xc2 && bytes[i] < 0xe0) {
				codepoint = ((bytes[i] & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
				array16BE.push(codepoint);
				i += 2;

			//3byte
			}else if (bytes[i] >= 0xe0 && bytes[i] < 0xf0) {
				codepoint = ((bytes[i] & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
				array16BE.push(codepoint);
				i += 3;

			//4byte
			}else if (bytes[i] >= 0xf0 && bytes[i] < 0xf5) {
				codepoint = ((bytes[i] & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
				tmp = codepoint - 0x10000;
				highSurrogate = (tmp >> 10) | 0xd800;
				lowSurrogate = (tmp & 0x3ff) | 0xdc00;
				array16BE.push(highSurrogate);
				array16BE.push(lowSurrogate);
				i += 4;
			}
		}
		return String.fromCharCode.apply(null, array16BE);
	};

	//--------------------------------------------------
	var readAPIC = function(bytes, i){
		var size = readFrameBodySize(bytes, i);
		var orgSizeByte = 0;
		if (ID3Header.VER === "v2.4") {
			if (isFrameHeaderFmtFlgIncludeOrgSize(bytes, i)) {
				orgSizeByte = 4;
				size = readFrameBodySizeV24ForAPIC(bytes, i);
				//やっつけv2.4対応がうまくいかず、ここで書くのを一旦終了
			}
		}
		ID3Frames.APIC.mimeType = readMimeType(bytes, i + HEADER_FRAME_SIZE + 1 + orgSizeByte);
		var len = ID3Frames.APIC.mimeType.length;
		var imageIndex = i + HEADER_FRAME_SIZE + (1 + orgSizeByte + len + 1 + 2);
		ID3Frames.APIC.binary = getImageInUint8Array(bytes, imageIndex, size - (1 + len + 1 + 2));
		return HEADER_FRAME_SIZE + size;
	};

	var isFrameHeaderFmtFlgIncludeOrgSize = function(bytes, beginIndex){
		return ((bytes[beginIndex + 9] & 0x01) === 0x01);
	};
	var readMimeType = function(bytes, beginIndex){
		var endIndex = beginIndex;
		while (true) {
			if (bytes[endIndex] === 0x00) {
				break;
			}
			endIndex++;
		}
		var mimeTypeUint8Array = bytes.subarray(beginIndex, endIndex);
		return String.fromCharCode.apply(null, mimeTypeUint8Array);
	};
	var getImageInUint8Array = function(bytes, beginIndex, size){
		var imageUint8Array = bytes.subarray(beginIndex, beginIndex + size);
		return imageUint8Array;
	};

	//--------------------------------------------------------------------------------
	return {
		read: function(bytes){
			if (!bytes){
				throw new Error("The argument of read(), 'bytes' is invalid.");
			}
			if (!isID3v2(bytes)){
				throw new Error("This MP3 file has no ID3v2 tags.");
			}

			clearID3Header();
			clearID3Frames();

			readID3Header(bytes);
			if (isID3v22()){
				throw new Error("This MP3 file has ID3v2.2 tags.");
			}

			readID3Frames(bytes);
		}

		, getTALB: function(){
			return ID3Frames.TALB;
		}
		, getTIT2: function(){
			return ID3Frames.TIT2;
		}
		, getTPE1: function(){
			return ID3Frames.TPE1;
		}
		, getAPIC_mimeType: function(){
			return ID3Frames.APIC.mimeType;
		}
		, getAPIC_binary: function(){
			return ID3Frames.APIC.binary;
		}
	};

}();
