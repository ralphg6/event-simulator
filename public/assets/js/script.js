$(function(){

	// This demo depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))){
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}

	// The URL of your web server (the port is set in app.js)
	var url = 'http://localhost:8080';

	var doc = $(document),
		win = $(window),
		canvas = $('#paper'),
		ctx = canvas[0].getContext('2d'),
		instructions = $('#instructions');

	let world = new SSCD.World();
	
	// Generate an unique ID
	var id = Math.round($.now()*Math.random());
	
	// A flag for drawing activity
	var drawing = false;	

	var rects = {};	
	var clients = {};
	var cursors = {};

	var socket = io.connect(url);
	
	socket.on('mousemove', function (data) {
		
		if(! (data.id in clients)){
			// a new user has come online. create a cursor for them
			cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
		}
		
		// Move the mouse pointer
		cursors[data.id].css({
			'left' : data.x,
			'top' : data.y
		});
		
		// Is the user drawing?
		if(data.drawing && clients[data.id]){
			
			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer
			
			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
		}
		
		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();

	});

	socket.on('mousedown', function (data) {
	
		createPeople(data.id, data.x, data.y);
		
		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();

		instructions.fadeOut();

		draw();
	});

	var prev = {};
	
	canvas.on('mousedown',function(e){
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;

		createPeople(id, e.pageX, e.pageY);
		
		// Hide the instructions
		instructions.fadeOut();

		if($.now() - lastEmit > 30){
			socket.emit('mousedown',{
				'x': e.pageX,
				'y': e.pageY,
				'id': id
			});
			lastEmit = $.now();
		}

		draw();
	});
	
	doc.bind('mouseup mouseleave',function(){
		drawing = false;
	});

	var lastEmit = $.now();

	doc.on('mousemove',function(e){
		if($.now() - lastEmit > 30){
			socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'id': id
			});
			lastEmit = $.now();
		}
		
		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above
		
		if(drawing){
			
			drawLine(prev.x, prev.y, e.pageX, e.pageY);
			
			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});

	// Remove inactive clients after 10 seconds of inactivity
	setInterval(function(){
		
		for(ident in clients){
			if($.now() - clients[ident].updated > 10000){
				
				// Last update was more than 10 seconds ago. 
				// This user has probably closed the page
				
				cursors[ident].remove();
				delete clients[ident];
				delete cursors[ident];
			}
		}
		
	},10000);

	function drawLine(fromx, fromy, tox, toy){
		// ctx.moveTo(fromx, fromy);
		// ctx.lineTo(tox, toy);
		// ctx.stroke();
	}

	function createPeople(clientId, x, y){
		if(!rects[clientId]){
			rects[clientId] = [];
		}
		// let people = new SSCD.CompositeShape(new SSCD.Vector(x, y));
		// let body = people.add(new SSCD.Rectangle(new SSCD.Vector(0, 0), new SSCD.Vector(10, 10)));
		// body.set_debug_render_colors("yellow", "black");

		let people = new SSCD.Rectangle(new SSCD.Vector(x, y), new SSCD.Vector(10, 10));
		people.set_debug_render_colors("yellow", "black");
		world.add(people);

		rects[clientId].push(people)
	}

	const FPS = 200;
	const SPEED_BASE = 20 * FPS;

	function randomSpeed(){

		return new SSCD.Vector(SPEED_BASE * (Math.random() - 0.5), SPEED_BASE * (Math.random() - 0.5));
	} 

	var camera_pos = new SSCD.Vector(0, 0);

	function draw(){

		world.render(canvas[0], camera_pos)
		
		//console.log(0, 0, canvas[0].width, canvas[0].height);
		ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
		for(var clientId in rects){
			let clientPeoples = rects[clientId];
			for(var people of clientPeoples){
				people.move(randomSpeed())

				// pick object player collide with
				var collide_with = world.pick_object(people);

				// if object found, use repel to prevent penetration
				if (collide_with)
				{
					console.log("Collision Detected!");
					collide_with.repel(people, 10, 5, 1, 1);
					
					// here we will update the position of the player sprite to match its collision body..
				}

				people.render(ctx, camera_pos);
				//console.log(people)
			}
		}


		
	}

	setInterval(function(){
		
		draw();
		
	}, 1000/FPS);


});