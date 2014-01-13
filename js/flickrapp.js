
//declare global variables
var callData1 = {};
var numResults1 = 0;
var callData2 = {};
var numResults2 = 0;
//load array of categories
var categories = loadCategories();
var roundCategory = "";

//get categories from Go server API
function loadCategories() {
	var cat = {};
	$.ajax({
	  dataType: "json",
	  url: "http://coryhakecs4830-27398.usw1.actionbox.io:8004/categories",
	  async: false,
	  success : function(data) {
		cat = data;
	  }
	})
	console.dir(cat);
  var i = 0;
  var catarray = {};
  for (var prop in cat) {
    catarray[i] = {"Name": cat[prop].Name, "Count": cat[prop].Count};
    i++;
    //console.log("Category is: " + cat[prop].Name + "\nCount is: " + cat[prop].Count);
  }
  console.dir(catarray);
	return catarray;
}

//change the current category
function changeCategory() {
	//change the category
  var length = 0;
  for (var prop in categories) {
    length++;
  }
	var randomNumber = Math.floor(Math.random()*length);
	//get current category
	roundCategory = document.getElementById("category").innerHTML;
	//make sure new category is not the old category
  if(roundCategory == ("The category is: " + categories[randomNumber].Name)){
		if(randomNumber < (length - 1)) {
			randomNumber++;
		}	
		else {
			randomNumber--;
		}
	}
	console.log("current category is: " + roundCategory);
	console.log("new random category is: " + categories[randomNumber].Name);
	document.getElementById("category").innerHTML= "The category is: " + categories[randomNumber].Name;
}

//display notice to user
function workingNotice() {
	// Load working notice
	document.getElementById("title").innerHTML="Calculating round results. Just a moment please!";
	return 1;
}

//clear notice to user
function clearNotice() {
	// clear working notice
	document.getElementById("title").innerHTML="";
}

//create URL for api call
function getURL(textId) {
	//get value tag from team 1 search box
	var searchTag = escape(document.getElementById(textId).value);
  var now = new Date();
  var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var timestamp = startOfDay / 1000;
  var monthPrior = timestamp - 2419200;
	return "http://api.flickr.com/services/rest/?method=flickr.photos.search" 
        + "&api_key=e6a67cd15715fb9ac6617b497f888fb3&tags=" 
				+ searchTag 
        //within last month
        //+ "&min_upload_date=" + monthPrior
        //+ "&max_upload_date=" + timestamp
        //within radius of Columbia
        //+ "&lat=38.9033&lon=-92.1022&radius=32" 
        + "&has_geo=1&format=json&nojsoncallback=1";
        //http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=e6a67cd15715fb9ac6617b497f888fb3&tags=cat&has_geo=1&content_type=1&lat=38.9033&lon=-92.1022&radius=32&format=json&nojsoncallback=1"
}

//call Flickr api and look for tags matching user search term
function apiCall(){
	//call changeCategory function to change category
	changeCategory();
	
	//make calls to flick api, then draw google chart
	$.when(
		$.ajax({
		  dataType: "json",
		  url: getURL("searchTag1"),
		  async: false,
		  success : function(callReturn1) {
			callData1 = callReturn1;
			console.log(callData1);
			numResults1 = parseInt(callData1.photos.total);
		  }
		}),
		$.ajax({
		  dataType: "json",
		  url: getURL("searchTag2"),
		  async: false,
		  success : function(callReturn2) {
			callData2 = callReturn2;
			console.log(callData2);
			numResults2 = parseInt(callData2.photos.total);
		  }
		})
	).then(
		console.log("ajax calls are done")
		//drawChart()
	);
}				

//draw google chart with round data	
function drawChart() {
	//change NaN to 0 for chart handling
	if(isNaN(numResults1)){
		numResults1 = 0;
	}
	if(isNaN(numResults2)){
		numResults2 = 0;
	}
	//set team points for round
	var roundPoints1 = numResults1 * 1000;
	var roundPoints2 = numResults2 * 1000;
	//get round search terms and add to chart
	var team1 = document.getElementById("searchTag1").value;
		team1 = ucFirstAllWords(team1);
	var team2 = document.getElementById("searchTag2").value;
		team2 = ucFirstAllWords(team2);
	document.getElementById("searchTag1").value = "";
	document.getElementById("searchTag2").value = "";
	var data1 = google.visualization.arrayToDataTable([
	  [roundCategory, 'Points'],
	  [team1,  roundPoints1],
	  [team2, roundPoints2]
	]);
	//define chart options
	var options = {
	  title: 'Matchup',
	  hAxis: {title: roundCategory, titleTextStyle: {color: 'black', bold: true, italic: false}, slantedText: true},
	  colors: ['#59078C']
	};
	//draw the chart
	var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
	chart.draw(data1, options);
	//update running point totals
	var totalPoints1 = getPoints("team1Points", roundPoints1);
	var totalPoints2 = getPoints("team2Points", roundPoints2);
	//display team standings to DOM
	var score = getScore(roundPoints1, roundPoints2, totalPoints1, totalPoints2);
	document.getElementById("title").innerHTML=score;
	//display point totals to DOM
	totalPoints1 = commafy(totalPoints1);
	totalPoints2 = commafy(totalPoints2);
	document.getElementById("team1Points").innerHTML = totalPoints1;
	document.getElementById("team2Points").innerHTML = totalPoints2;
}

//determine winner of current round and winner of running game total
function getScore(roundPoints1, roundPoints2, totalPoints1, totalPoints2){
	var score = "";
	if(roundPoints1 > roundPoints2){
		score = "Team 1 wins the round! ";
	}
	else if(roundPoints1 < roundPoints2) {
		score = "Team 2 wins the round! ";
	}
	else {
		score = "This round is a tie! ";
	}
	if(totalPoints1 > totalPoints2) {
		score += "Team 1 leads the game!";
	}
	else if(totalPoints1 < totalPoints2) {
		score += "Team 2 leads the game!";
	}
	else {
		score += "The game is tied!";
	}
	return score;
}

//get new team point total
function getPoints(teamId, numPoints) {
	var points = document.getElementById(teamId).innerHTML;
		points = parseInt(points.replace(/,/g, ''), 10)
		return (points + numPoints);
}

//capitalize all words in string
function ucFirstAllWords( str ){
    var pieces = str.split(" ");
    for ( var i = 0; i < pieces.length; i++ )
    {
        var j = pieces[i].charAt(0).toUpperCase();
        pieces[i] = j + pieces[i].substr(1);
    }
    return pieces.join(" ");
}

//add commas to numbers
function commafy( num ) {
    var str = num.toString().split('.');
    if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
}
