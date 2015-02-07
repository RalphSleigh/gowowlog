//OOPS actually has filters.


damageApp.filter('prettyNum', function() {               // filter is a factory function
   return function(number) { 
			if (number < 1000) return numeral(number).format("00.00");
			var r = Math.ceil(Math.log(number) / Math.LN10) % 3;
			return numeral(number).format(r == 0 ? "0a" : r == 1 ? "0.00a" : "0.0a");
   }
 });
 
 damageApp.filter('minutes', function() {               // filter is a factory function
   return function(number) { 
			var d = new Date(number/1000000);
			return d.getMinutes()+':'+numeral(d.getSeconds()).format("00");
   }
 });

  damageApp.filter('specIconString', function() {               // filter is a factory function
   return function(spec) { 
			return WOW.specInfo[spec].icon;
   }
 });
 
 
damageApp.filter('schoolBG', function() {               // filter is a factory function
   return function(number) { 
					//MASSIVE BITMASK TO CSS GRADIENT HACK INC  
					//background: linear-gradient(to right,  #ff80ff 0%,#ff8000 100%);
					var colours = ["#FFFF00","#FFE680","#FF8000","#4DFF4D","#80FFFF","#8080FF","#FF80FF"];
					var needed = [];
					var j = 1;
					for(i = 0; i < 8; i++) {
						if(number & j)needed.push(colours[i]);
						j = j*2;
						}
					if(needed.length == 1)return "background:"+needed[0];
					var output = "background: linear-gradient(to left"
					for(k = 0;k < needed.length; k++) {
						output += ', ';
						output += needed[k];
						output += ' ';
						output += ((k * 100)/(needed.length - 1));
						output += '%';
						}
					output += ')';
					return output
	   }
 });
