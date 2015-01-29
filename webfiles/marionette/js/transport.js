//This will attempt to use websockets to handle transport, but will fallback to XMLHTTPRequest if it cant.
//todo: AJAX fallback.
 
var socket = (function(host){
 
	var module = {}, ws, wsAddress, recList = $.Callbacks(), sendQueue = [],promises = [], whenOpenList = $.Deferred(), lastSeen, connCheckTask;
	
	function wsMessage(msg) {
		lastSeen = Date.now(); //update the lastSeen time
		var data = $.parseJSON(msg.data);
		console.log(data);
		//fire a success promise if we have one? unklunge the reply
		switch(data.Action){
			case "e.updateEncounters":
				var promise = promises.pop(); 
				promise.success(data.Data);
				break;
			case "system.unitSpellInfo":
				var promise = promises.pop(); 
				promise.success(data.Data.Spells);
				break;
			}
		//app.system.processMessage($.parseJSON(msg.data))
		}
		
	function wsOpen() {
		console.log('socket opened');
		$('#connecting').hide();
		
		lastSeen = Date.now();
		connCheckTask = setInterval(checkLastSeen, 5000);
		
		processQueue();
		
		whenOpenList.resolve(); //call anything waiting for an open connection.
	}
	
	function wsClose() {
		console.log('socket closed');
		clearInterval(connCheckTask);
		whenOpenList = $.Deferred();
		setTimeout(module.init,2000);
	
	}
	
	function processQueue() {
		var item;
		while(item = sendQueue.pop()) {
			//dont send modes gets done in wsOpen
			if(item.action != 'system.registerModes')module.send(item);
		}
	}
	
	function checkLastSeen() {
		//check last seen, if  its too long ago close the connection
		if(Date.now() - lastSeen > 20000) {
			console.log('not seen server, closing');
			ws.close();
			wsClose();  //force renew the handle.
			}
	}
	
	module.init = function(host){
		console.log('Opening');
		
		if(!wsAddress)wsAddress = host
		ws = new WebSocket(wsAddress);
		
		ws.onopen = wsOpen;
		ws.onmessage = wsMessage;
		//ws.onclose = wsClose;
		
	}
			
	module.send = function(payload, callback) {
		if (callback)promises.push(callback);
		if(ws.readyState == ws.OPEN) {
			console.log('Sending: ');
			console.log(payload);
			ws.send(JSON.stringify(payload));
		}
		else sendQueue.push(payload);
		;
	}
		
	module.addMsgCallback = function(callback) { //things to do when we get a message
		recList.add(callback);
	}
	
	module.addOpenCallback = function(callback) {
		whenOpenList.done(callback);
	}

	module.init(host);
	
	return module;
	}("ws://"+window.location.hostname+":8081/websockets"));