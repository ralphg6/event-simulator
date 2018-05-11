var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

const PUBLIC_DIR = __dirname + '/../public';

app.use(express.static(PUBLIC_DIR));  

app.get('/', function(req, res,next) {  
    res.sendFile(PUBLIC_DIR + '/index.html');
});

// Delete this row if you want to see debug messages
//io.set('log level', 1);

// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {

	// Start listening for mouse move events
	socket.on('mousemove', function (data) {
		
		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.emit('mousemove', data);
    });
    
    // Start listening for mouse move events
	socket.on('mousedown', function (data) {
		
		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.emit('mousedown', data);
	});
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
	console.log(`Listen on http://0.0.0.0:${PORT}`);
});  