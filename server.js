var fs=require("fs");
var express=require("express");
var http = require('http');

var config=JSON.parse(fs.readFileSync("config.json"));
var host=config.host;
var port=config.port;

//Server code start
var app=express();
var server=http.createServer(app); 
console.log("Starting...");
server.listen(port, host,function(){
  console.log('Server listening on '+host+":" + port);
});
fs.writeFileSync(config.deviceCntFile,0);

app.get("/",function(request,response){
	response.sendfile("client.html");
});
//server code end

//File watch start

fs.watch(config.watchDir,function(event,filename){
	console.log(event)
	if(event=="change"){
		var deviceSessionFile=config.deviceSessionMapDir+"/"+filename;
		var deviceProfileFile=config.watchDir+"/"+filename;
		console.log(deviceSessionFile+"==>"+fs.existsSync(deviceSessionFile))
		if(fs.existsSync(deviceSessionFile)){
			var profileFileCon=fs.readFileSync(deviceProfileFile)+"";
			var sessionId=fs.readFileSync(deviceSessionFile);
			io.sockets.socket(sessionId).emit("profile",profileFileCon);
		}	
	}
});
//file watch end

var client=new Object();
//socket io code start
var io = require('socket.io').listen(server);
io.set('log level', 1);
io.sockets.on('connection', function (socket) {
	
  socket.on('send-message', function (data) {
	var msgVal=JSON.parse(data);
	var clSessionId=msgVal.sessionId;
	var deviceId=msgVal.deviceId;
	var message=msgVal.message;
	var respMessage="";
	if(!client.hasOwnProperty(clSessionId)){
		//respMessage="Welcome "+msgVal.deviceId+"\n";
		client[clSessionId]=msgVal.deviceId		
	}
	console.log("===>"+client[clSessionId]);
	io.sockets.emit('resp-message', "DeviceId :"+deviceId+" ->"+message);
	
  });
  socket.on('send-disconnect-message',function(data){
	console.log("Closeing communication with  : "+client[socket.id]);
	var msgVal=JSON.parse(data);
	
	var clSessionId=msgVal.sessionId;
	var deviceId=msgVal.deviceId;
	var message=msgVal.message;
	if(client.hasOwnProperty(clSessionId)){
		//delete client.items[clSessionId];
	}
  });
  
  /*Code to get Device-Id*/
  socket.on('getDeviceId', function (clSessionId) {
	var nextId=0;
	if(fs.existsSync(config.deviceCntFile)){
		nextId=parseInt(fs.readFileSync(config.deviceCntFile));
	}
	nextId=nextId+1;
	fs.writeFileSync(config.deviceCntFile,nextId);
	if(!fs.exists(config.deviceSessionMapDir+"/"+nextId)){
		fs.writeFileSync(config.deviceSessionMapDir+"/"+nextId,clSessionId);
	}
	socket.emit("sendDeviceId",nextId);	
	
 });
});



io.sockets.on('disconnect',function(socket){
	console.log("Closeing communication with  : "+client[socket.id]);
	
//	delete client.items[socket.id];
});
//socket io code end