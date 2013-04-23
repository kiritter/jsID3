var Base64 = function(){

	var _ENCODE_TABLE =  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'
						, 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'
						, 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd'
						, 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'
						, 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x'
						, 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7'
						, '8', '9', '+', '/'];

	var _GETA = "=";

	var _NUM_OF_BYTES = 3;


	var encodeMain = function(bytes, i, outStrArray){
		var iNum = (bytes[i] << 16) + (bytes[i+1] << 8) + (bytes[i+2]);

		outStrArray.push( _ENCODE_TABLE[(iNum >> 18)] );
		outStrArray.push( _ENCODE_TABLE[(iNum >> 12) & 0x3f] );
		outStrArray.push( _ENCODE_TABLE[(iNum >> 6) & 0x3f] );
		outStrArray.push( _ENCODE_TABLE[iNum & 0x3f] );
	};
	var encodePlus1Geta = function(bytes, i, outStrArray){
		var iNum = (bytes[i] << 8) + bytes[i+1];

		outStrArray.push( _ENCODE_TABLE[(iNum >> 10)] );
		outStrArray.push( _ENCODE_TABLE[(iNum >> 4) & 0x3f] );
		outStrArray.push( _ENCODE_TABLE[(iNum << 2) & 0x3f] );
		outStrArray.push( _GETA );
	};
	var encodePlus2Geta = function(bytes, i, outStrArray){
		var iNum = bytes[i];

		outStrArray.push( _ENCODE_TABLE[(iNum >> 2)] );
		outStrArray.push( _ENCODE_TABLE[(iNum << 4) & 0x3f] );
		outStrArray.push( _GETA );
		outStrArray.push( _GETA );
	};


	return {
		encode: function(bytes){

			if (!bytes){
				return "";
			}

			var outStrArray = [];

			var len = bytes.length;
			var count = Math.floor(len / _NUM_OF_BYTES);
			var mod = len % _NUM_OF_BYTES;

			for (var i=0; i<count; i++) {
				encodeMain(bytes, _NUM_OF_BYTES * i, outStrArray);
			}

			switch (mod) {
				case 2:
					encodePlus1Geta(bytes, _NUM_OF_BYTES * count, outStrArray);
					break;
				case 1:
					encodePlus2Geta(bytes, _NUM_OF_BYTES * count, outStrArray);
					break;
			}

			return outStrArray.join("");
		}
	};

}();
