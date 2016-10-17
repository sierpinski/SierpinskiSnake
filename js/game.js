// Project & Team 
var webContext = VSS.getWebContext();

var teamId = webContext.team.id;
var team = webContext.team.name;
var user = webContext.user.name;

// Settings
var showHighScores = false;
var musicPlaying = false;
var pauseSet = true;
var noSound = true;
var deathPlayed = false;
var chaos = true;

var highScoreList;

var themes = [
		{name:"Block",
		color:{words:"black",outside:"black",inside:"white",snake:"blue",food:"green",effects:"purple",good:"green",bad:"red"},
		style:{snake:"block",food:"block",effects:"block"},
		delta:{effects:false}},
		{name:"Chess",
		color:{words:"black",outside:"black",inside:"white",snake:"black",food:"black",effects:"black",good:"black",bad:"black"},
		style:{snake:"block",food:"block",effects:"block"},
		delta:{effects:true}},
		{name:"Modern",
		color:{words:"white",outside:"grey",inside:"black",snake:"green",food:"red",effects:"red",good:"blue",bad:"yellow"},
		style:{snake:"modern",food:"modern",effects:"modern"},
		delta:{effects:true}}
	];
			
var theme = themes[0];
var themeId = 0;

$(document).ready(function(){
	//Canvas stuff
	var canvas = $("#canvas")[0];
	canvas.focus();
	var ctx = canvas.getContext("2d");
	var w = $("#canvas").width();
	var h = $("#canvas").height();
	
	var cw = 10;
	var d;
	var food;
	var score;
	var paused;
	var gameEnd = false;
	var gameStart = true;
	
	var snake_array;
	var effect_array = [];
	
	function init()
	{
		paused = false;
		d = "right";
		create_snake();
		create_food();
		score = 0;
		
		if(typeof game_loop != "undefined") clearInterval(game_loop);
		game_loop = setInterval(paint, 30);
	}
	init();
	
	function create_snake()
	{
		var length = 5;
		snake_array = [];
		for(var i = length-1; i>=0; i--)
		{
			snake_array.push({x: i, y:0});
		}
	}
	
	function create_food()
	{
		food = {
			x: Math.round(Math.random()*(w-cw)/cw), 
			y: Math.round(Math.random()*(h-cw)/cw), 
		};
		while (check_collision(food.x,food.y,snake_array)){
			food = {
				x: Math.round(Math.random()*(w-cw)/cw), 
				y: Math.round(Math.random()*(h-cw)/cw), 
			};
		}
	}
	
	function playMusic(){
		if (musicPlaying == true || pauseSet == true) return;
		var myAudio = document.getElementById("gamemusic");
		if (typeof myAudio.loop == 'boolean')
		{
			myAudio.loop = true;
		}
		else
		{
			myAudio.addEventListener('ended', function() {
				this.currentTime = 0;
				this.play();
			}, false);
		}
		myAudio.volume = 0.2;
		myAudio.play();
		musicPlaying = true;
	}
	
	function playEat(){
		if (noSound == true) return;
		var myAudio = document.getElementById("eatfoodsound");
		myAudio.volume = 0.7;
		myAudio.pause();
		myAudio.currentTime = 0;
		myAudio.play();
	}
	
	function playDie(){
		if (deathPlayed == true || noSound == true) return;
		var myAudio = document.getElementById("deathsound");
		myAudio.volume = 0.7;
		myAudio.pause();
		myAudio.currentTime = 0;
		myAudio.play();
		deathPlayed = true;
	}
	
	function paint()
	{
		ctx.fillStyle = theme.color.inside;
		ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = theme.color.outside;
		ctx.strokeRect(0, 0, w, h);
		
		// Handle game states.
		if (gameStart){
			drawSplash();
			return;
		}
		if (gameEnd){
			var myAudio = document.getElementById("gamemusic");
			myAudio.pause();
			musicPlaying=false;
			playDie();
			drawHighScore();
			return;
		}
		if (paused) {
			var myAudio = document.getElementById("gamemusic");
			myAudio.pause();
			musicPlaying=false;
			drawPause();
			return;
		}
		
		if (theme.name=="Chess") drawChessBoard();
		if (theme.name=="Chaos") drawChaosBoard();
				
		playMusic();
		
		deathPlayed = false;
		// Handle eat effects.
		for(var i = 0; i < effect_array.length; i++)
		{
			if(effect_array[i].time == 0) effect_array.pop();
			else{
				var c = effect_array[i];
				ctx.fillStyle = theme.color.effects;
				if (theme.delta.effects) {
					paint_style({x:c.x+Math.random(), y:c.y+Math.random(), delta:2*effect_array[i].time},theme.style.effects);
					paint_style({x:c.x-Math.random(), y:c.y+Math.random(), delta:2*effect_array[i].time},theme.style.effects);
					paint_style({x:c.x+Math.random(), y:c.y-Math.random(), delta:2*effect_array[i].time},theme.style.effects);
					paint_style({x:c.x-Math.random(), y:c.y-Math.random(), delta:2*effect_array[i].time},theme.style.effects);
				} else{
					paint_style({x:c.x+1, y:c.y+1, delta:2*effect_array[i].time},theme.style.effects);
					paint_style({x:c.x-1, y:c.y+1, delta:2*effect_array[i].time},theme.style.effects);
					paint_style({x:c.x+1, y:c.y-1, delta:2*effect_array[i].time},theme.style.effects);
					paint_style({x:c.x-1, y:c.y-1, delta:2*effect_array[i].time},theme.style.effects);
				}
				effect_array[i].time--;
			}
			
		}
		
		var nx = snake_array[0].x;
		var ny = snake_array[0].y;
		if(d == "right") nx++;
		else if(d == "left") nx--;
		else if(d == "up") ny--;
		else if(d == "down") ny++;
		
		if(nx == -1 || nx == w/cw || ny == -1 || ny == h/cw || check_collision(nx, ny, snake_array))
		{
		    gameEnd = true;
			paused = true;
			updateHighScore();
			effect_array = [];
			return;
		}
		
		if(nx == food.x && ny == food.y)
		{
			var tail = {x: nx, y: ny};
			score++;
			effect_array.push({x:nx,y:ny,time:10});
			playEat();
			create_food();
		}
		else
		{
			var tail = snake_array.pop(); //pops out the last cell
			tail.x = nx; tail.y = ny;
		}
		//The snake can now eat the food.
		
		snake_array.unshift(tail); //puts back the tail as the first cell
		
		for(var i = 0; i < snake_array.length; i++)
		{
			var c = snake_array[i];
			//Lets paint 10px wide cells
			ctx.fillStyle = theme.color.snake;
			paint_style({x:c.x, y:c.y, delta:10*(snake_array.length - i)/snake_array.length},theme.style.snake);
			snakeUpdate = true;
		}
		
		if (theme.name=="Chaos" && Math.random()*100 > 98) {
			create_food();
		}
		
		//Lets paint the food
		ctx.fillStyle = theme.color.food;
		var nd = 49;
		if (theme.delta.effects){
			var dd = new Date();
			var timer = dd.getTime();
			nd = Math.floor(timer/100)%50;
		}
		paint_style({x:food.x, y:food.y, delta:10 + (((nd+1)-50)/30)},theme.style.food);
		//Lets paint the score
		ctx.fillStyle = theme.color.words;
		ctx.font = "14px Georgia";
		ctx.textAlign = "center";
		var score_text = "Score: " + score;
		ctx.fillText(score_text, w-75, h-5);
	}
	
	function paint_style(item,style){
		switch(style){
			case "block":
				paint_cell(item);
				break;
			case "modern":
				paint_effect(item);
				break;
			default:
				paint_cell(item);
				break;
		}
	}
	
	function paint_cell(item)
	{
		ctx.fillRect(item.x*cw, item.y*cw, cw, cw);
	}
	
	function paint_effect(item)
	{
		ctx.beginPath();
		ctx.arc(item.x*cw, item.y*cw, item.delta, 0, 2 * Math.PI, false);
		ctx.fill();
		//ctx.fillRect(item.x*cw, item.y*cw, item.delta, item.delta);
	}
	
	function check_collision(x, y, array)
	{
		for(var i = 0; i < array.length; i++)
		{
			if(array[i].x == x && array[i].y == y)
			 return true;
		}
		return false;
	}
	
	//Keyboard controls.
	$(document).keydown(function(e){
		var key = e.which;
		if((key == "65" || key == "37") && d != "right" && d != "left" && !paused && !gameEnd && snakeUpdate) {
			d = "left";
			snakeUpdate = false;
		}
		else if((key == "87" || key == "38") && d != "down" && d != "up" && !paused && !gameEnd && snakeUpdate) {
			d = "up";
			snakeUpdate = false;
		}
		else if((key == "68" || key == "39") && d != "left" && d != "right" && !paused && !gameEnd && snakeUpdate) {
			d = "right";
			snakeUpdate = false;
		}
		else if((key == "83" || key == "40") && d != "up" && d != "down" && !paused && !gameStart && !gameEnd && snakeUpdate) {
			d = "down";
			snakeUpdate = false;
		}
		else if(key == "83" && (paused || gameStart || gameEnd)) {
			noSound=!noSound;
		}
		else if(key == "84") {
			themeId = (themeId+1)%themes.length;
			if (themeId == 0 && !chaos) {
				themeId = themes.length - 1;
				theme =	{name:"Chaos",
					color:{words:getRandomColor(),outside:getRandomColor(),inside:getRandomColor(),snake:getRandomColor(),
					food:getRandomColor(),effects:getRandomColor(),good:getRandomColor(),bad:getRandomColor()},
					style:{snake:getRandomStyle(),food:getRandomStyle(),effects:getRandomStyle()},
					delta:{effects:Math.random() >= 0.5}};
				chaos = true;
			}
			else {
				theme = themes[themeId];
				chaos = false;
			}
		}
		else if(key == "77") {
			pauseSet = !pauseSet;
		}
		else if(key == "32") {
			if (gameStart){
				gameStart = false;
				return;
			}
			if (gameEnd){
				gameEnd = false;
				paused = false;
				init();
				return;
			}
			paused = !paused;
		}
	});
	
	function drawPause(){
		ctx.fillStyle = theme.color.words; // Set color to white
		ctx.font = "bold 30px Georgia";
		ctx.textAlign = "center";
		ctx.fillText("Paused", w/2, h/2);
		drawOptions();
	}
	
	function drawOptions(){
		ctx.fillStyle = theme.color.words;
		ctx.font = "15px Georgia";
		ctx.textAlign = "right";
		ctx.fillText("[M]usic:",7*w/8,1*h/8);
		if (pauseSet == true) {
			ctx.fillStyle = theme.color.bad;
			ctx.textAlign = "left";
			ctx.fillText("Off",7*w/8 + 10,1*h/8);
		} else {
			ctx.fillStyle = theme.color.good;
			ctx.textAlign = "left";
			ctx.fillText("On",7*w/8 + 10,1*h/8);
		}
		ctx.fillStyle = theme.color.words;
		ctx.textAlign = "right";
		ctx.fillText("[S]ounds:",7*w/8,1*h/8 + 20);
		if (noSound == true) {
			ctx.fillStyle = theme.color.bad;
			ctx.textAlign = "left";
			ctx.fillText("Off",7*w/8 + 10,1*h/8 + 20);
		} else {
			ctx.fillStyle = theme.color.good;
			ctx.textAlign = "left";
			ctx.fillText("On",7*w/8 + 10,1*h/8 + 20);
		}
		ctx.fillStyle = theme.color.words;
		ctx.textAlign = "right";
		ctx.fillText("[T]heme:",7*w/8,1*h/8 + 40);
		ctx.fillStyle = theme.color.good;
		ctx.textAlign = "left";
		ctx.fillText(theme.name,7*w/8 + 10,1*h/8 + 40);
		ctx.fillStyle = theme.color.words;
		ctx.textAlign = "center";
	}
	
	function drawSplash(){
		ctx.fillStyle = theme.color.words;
		ctx.font = "bold 30px Georgia";
		ctx.textAlign = "center";
		ctx.fillText("Snake", w/2, h/2-200);
		ctx.font = "20px Georgia";
		ctx.fillText("By Sierpinski", w/2, h/2-150);
		ctx.fillText("Controls: W,A,S,D or Arrow Keys to control the snake.", w/2, h/2-50);
		ctx.fillText("You may press [Space] during play to pause the game.", w/2, h/2);
		ctx.font = "15px Georgia";
		ctx.fillText("Thanks to: MSDev Labs for Galactic Dodge and the Arcade Hub.", w/2, h/2+75);
		ctx.fillText("Also, to: @thecodeplayer's HTML5/JS Snake Walk-through.", w/2, h/2+125);
		ctx.fillText("Music and Sound Effects by Eric Matyas.", w/2, h/2+175);
		ctx.font = "20px Georgia";
		ctx.fillText("Press [Space] To Begin...",w/2,h/2+250);
		drawOptions();
	}
	
	function drawHighScore(){
		ctx.fillStyle = theme.color.words;
		ctx.font = "bold 30px Georgia";
		ctx.textAlign = "center";
		if (gameEnd){
			ctx.fillText("Game Over", w/2, h/2-200);
			ctx.fillStyle = theme.color.good;
			ctx.font = "bold 25px Georgia";
			ctx.fillText("Your Score: " + score, w/2, h/2-100);
			ctx.fillStyle = theme.color.words;
		}
		ctx.font = "20px Georgia";
		
		if(showHighScores)
		{
			ctx.fillText(team + " high scores:", w/2, h/2);
			if (score === highScoreList[0].score) {
				// High Score Notification!
				ctx.save();
				ctx.translate(100, 100);
				ctx.rotate(-Math.PI / 4);
				ctx.fillText('High Score!', 0, 15/2);
				ctx.restore();
				ctx.font = "bold 20px Georgia";
			}
			ctx.fillText("1. " + highScoreList[0].name + " - " + highScoreList[0].score, w/2, h/2+50);
			ctx.font = "20px Georgia";
			if(highScoreList[1])
			{
				if (score === highScoreList[1].score) ctx.font = "bold 20px Georgia";
				ctx.fillText("2. " + highScoreList[1].name + " - " + highScoreList[1].score, w/2, h/2+100);
				ctx.font = "20px Georgia";
			}
			if(highScoreList[2])
			{
				if (score === highScoreList[2].score) ctx.font = "bold 20px Georgia";
				ctx.fillText("3. " + highScoreList[2].name + " - " + highScoreList[2].score, w/2, h/2+150);
				ctx.font = "20px Georgia";
			}
		}
		else
		{
			ctx.fillText("Loading high scores...", w/2, h/2);
		}
		drawOptions();
		ctx.font = "20px Georgia";
		ctx.fillText("Press [Space] To Begin...",w/2,h/2+250);
	}
	
	function drawChessBoard() {
		ctx.strokeStyle = theme.color.words;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (i = 10; i < w; i += 10) {
			ctx.moveTo(i,0);
			ctx.lineTo(i,h);
		}
		for (i = 10; i < h; i += 10) {
			ctx.moveTo(0,i);
			ctx.lineTo(w,i);
		}
		ctx.stroke();
	}
	
	function drawChaosBoard() {
		ctx.strokeStyle = theme.color.words;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (i = 10; i < w; i += 10) {
			ctx.moveTo(i,0);
			ctx.bezierCurveTo(i+(Math.random()*5-2.5),h/3,i+(Math.random()*5-2.5),2*h/3,i,h);
		}
		for (i = 10; i < h; i += 10) {
			ctx.moveTo(0,i);
			ctx.bezierCurveTo(w/3,i+(Math.random()*5-2.5),2*w/3,i+(Math.random()*5-2.5),w,i);
		}
		ctx.stroke();
	}

	function updateHighScore() {
		VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) {
			dataService.getValue(teamId).then(function(value) {
				highScoreList = value;
				
				var changed = false;
				
				if(!highScoreList)
				{
					//There are no highs cores for this team
					buildHighScore();
					changed = true;
				}
				else
				{
					switch(highScoreList.length) {
						case 1:
							changed = checkHighScore();
							
							if(!changed) {
								highScoreList[1] = {name: user, score: score};
								changed = true;
							}
							break;	
						case 2:
							changed = checkHighScore();
							
							if(!changed) {
								highScoreList[2] = {name: user, score: score};
								changed = true;
							}
							break;	
						case 3:
							changed = checkHighScore();
							break;
					}
				}
				
				
				//set the high score if it has changed
				if(changed) {
					setHighScore();
				}
				
				showHighScores = true;
			});
		});
	}

	function checkHighScore(){
		var changed = false;
		
		for (i = 0; i < highScoreList.length; i++)
		{
			if (score > highScoreList[i].score)
			{
				//insert the new high score
				highScoreList.splice(i,0,{name: user, score: score});
				
				//remove the high score that was bumped to 4th place
				highScoreList.splice(3,1);
				
				changed = true;
				break;
			}
		}
		
		return changed;
	}

	function setHighScore() {
		VSS.getService(VSS.ServiceIds.ExtensionData).then(function(dataService) {
			dataService.setValue(teamId, highScoreList)
		});
	}

	//Called if no high score for this team has ever been defined
	function buildHighScore() {
		highScoreList = [
				{
					name: user,
					score: score
				}
			]
	}
});

	
function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++ ) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function getRandomStyle(){
	var check = Math.random() >= 0.5;
	if (check) return "block";
	return "modern";
}


