var map = null;
var geo = null;
var marker = null;
var elevator = null;
var latlng = null;
var isKoudo = false;
var poly = null;
var distance = 0;
var koudo = 0;
var directionsService = null;
var directionsDisplay = null;
var latitude = null;
var longitude = null;
var altitude = null;
var km = null;
var m = null;
var origin = null;
var destination = null;
var waypoints = [];
var markers = [];
var lang ="";
var szoom = null;
//-------------
//  初期化
//-------------
function initialize(_latitude, _longitude, _altitude, _km, _m, _lang){

	latitude = _latitude;
	longitude = _longitude;
	altitude = _altitude;
	lang = _lang;
	km = _km;
	m = _m;
	x = 139.76578;
	y = 35.68494;

	if( altitude != null && altitude != "" ){
		isKoudo = true;
	}
	zoom = 18;
	var sx    = getProfileCookie2("map_x");
	var sy    = getProfileCookie2("map_y");
	szoom = getProfileCookie2("map_zoom");
	if(sx != null){
		x = sx;
	}
	if(sy != null){
		y = sy;
	}
	if(szoom != null){
		zoom_ = szoom * 1;
	}		

	latlng = new google.maps.LatLng(y, x);
	var options = {
		zoom: zoom,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		disableDoubleClickZoom: true,
        scaleControl: true
	};

	map = new google.maps.Map(document.getElementById("map_canvas"), options);

	// クリック
	google.maps.event.addListener(map, 'click', clickLlistener);

	// 住所
	geo = new google.maps.Geocoder();

	// 高度
	if(isKoudo == true){
		elevator = new google.maps.ElevationService();
	}

}

//---------------
// 現在地を表示
//---------------
function presentLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
		  // 位置情報の取得に成功した場合
		  function (pos) {
			hearHng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
			map.setCenter(hearHng);
			_clickLlistener(hearHng); 
		  },
		  function (error) {
		    var message = "";
		    switch (error.code) {
		      case error.POSITION_UNAVAILABLE:
		        message = "位置情報の取得ができませんでした。" ;
				if(lang == 'en'){ message = "Position Unvariable Error";}
		        break;
		      case error.PERMISSION_DENIED:
		        message = "位置情報取得の使用許可がされませんでした。" ;
				if(lang == 'en'){ message = "Permission Denied Error";}
		        break;
		      case error.PERMISSION_DENIED_TIMEOUT:
		        message = "位置情報取得中にタイムアウトしました。";
				if(lang == 'en'){ message = "Permission Denied Timeout Error";}
		        break;
		    }
		    alert( message + ":" + error.message );
		  }
		);
	}
	else{
		if(lang == ""){
			alert("本ブラウザでは、GPS情報が取得できません");
		}
		else{
			alert("GPS information can not be acquired in this browser.");
		}
	}
}


//-----------------------
// クリックの緯度・経度
//----------------------
function clickLlistener(event) {
	_clickLlistener(event.latLng);
}

function _clickLlistener(_latLng) {

	var latLng = _latLng;

	if( km || m ){
		if(origin == null) {
			origin = latLng;
			addMarker(origin);
		}
		else if (destination == null) {
			destination = latLng;
			addMarker(destination);
		}
        else {
		    if (waypoints.length < 9) {
			    waypoints.push({ location: destination, stopover: true });
			    destination = latLng;
			    addMarker(destination);
		    } 
            else {
		        alert("Maximum number of waypoints reached");
		    }
		}

		// 緯度
		document.getElementById("show_y").innerHTML = latLng.lat();
		
		// 経度
		document.getElementById("show_x").innerHTML = latLng.lng();

	}
    //  緯度・経度・高度
	else{
		clearMarkers();
		markers = [];
		addHereMarker(latLng);
		setInfo(latLng.lat(), latLng.lng());
	}

	//クッキー
	setProfileCookie("map_x", latLng.lng());
	setProfileCookie("map_y", latLng.lat());
	setProfileCookie("map_zoom", map.getZoom());

}


function addMarker(latlng) {
	markers.push(new google.maps.Marker({
	  position: latlng, 
	  map: map,
	  icon: "http://maps.google.com/mapfiles/marker" + String.fromCharCode(markers.length + 65) + ".png"
	}));    
}


function addGreenMarker(latlng) {
	markers.push(new google.maps.Marker({
	  position: latlng, 
	  map: map,
	  icon: "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + String.fromCharCode(markers.length + 65) +"|67BF4B|000000"
	}));    
}

function addHereMarker(latlng) {
	markers.push(new google.maps.Marker({
	  position: latlng, 
	  map: map,
	  icon: "http://maps.google.com/mapfiles/marker.png"
	}));    
}


function route() {

	var mode = google.maps.DirectionsTravelMode.WALKING;

	var avoid = true;
	switch (document.getElementById("mode").value) {
	  case "bike":
	    mode = google.maps.DirectionsTravelMode.BICYCLING;
	    break;
	  case "car":
	    mode = google.maps.DirectionsTravelMode.DRIVING;
	    avoid = false;
        break;        
      case "car2":
	    mode = google.maps.DirectionsTravelMode.DRIVING;
	    break;
	  case "walk":
	    mode = google.maps.DirectionsTravelMode.WALKING;
	    break;
	  case "straight":
	    mode = "straight";
	    break;

	}

    if(poly != null){  // 必ず毎回消す
		poly.setMap(null);
	}
	if(mode == "straight"){
		straightline();
	}
	else{
	    if(directionsDisplay == null){	
			directionsDisplay = new google.maps.DirectionsRenderer();
			directionsService = new google.maps.DirectionsService();
			directionsDisplay.setMap(map);
			directionsDisplay.setPanel(document.getElementById("directionsPanel"));
	    }
		var request = {
		    origin: origin,
		    destination: destination,
		    waypoints: waypoints,
		    travelMode: mode,
		    optimizeWaypoints: true,
		    avoidHighways: avoid,
		    avoidTolls: avoid
		};
		directionsService.route(request, function(response, status) {
		  if (status == google.maps.DirectionsStatus.OK) {
			    directionsDisplay.setDirections(response);
				distance = 0;
				for(var i = 0; i < response.routes[0].legs.length; i++){
					distance += response.routes[0].legs[i].distance.value;
				}
				// 距離
				if( km ){
					distance = (distance / 1000);
					if(document.getElementById("show_k") != null) document.getElementById("show_k").innerHTML = distance + "km";
				}
				if( m ){
					if(document.getElementById("show_k") != null) document.getElementById("show_k").innerHTML = distance + "m";
				}
		  }
		});
	    clearMarkers();
	}

}


//-----------------------
// ラインを引く
//----------------------
function straightline() {

    clearMarkers();
    if(directionsDisplay != null){
		directionsDisplay.setMap(null);
	    directionsDisplay.setPanel(null);
		directionsDisplay = null;	
	}


	if(origin == null || destination == null) {
		return;
	}

	var points = [];
	points[0] = origin;
	var i = 0;
	koudo = 0;
	for (; i < waypoints.length; i++) {
		points[i+1] = waypoints[i].location;
	}
	points[i+1] = destination;
	distance = 0;
	markers = [];
	addGreenMarker(points[0]);
	for (i = 1; i < points.length; i++) {	
		distance += google.maps.geometry.spherical.computeDistanceBetween(points[i-1], points[i] );
		addGreenMarker(points[i]);
	}

    // ラインを作成 
    var polyLineOptions = {
        path: points,
        strokeWeight: 4, 
        strokeColor: "#7979f7",
        strokeOpacity: "1"
    }; 
	poly = new google.maps.Polyline(polyLineOptions); 
    poly.setMap(map);

	// 距離
	if( km ){
		distance = distance / 1000;
		if(document.getElementById("show_k") != null) document.getElementById("show_k").innerHTML = distance + "km";
	}
	if( m ){
		if(document.getElementById("show_k") != null) document.getElementById("show_k").innerHTML = distance + "m";
	}
}


//-------------------------------	
//  緯度・経度設定＆マーカー表示
//-------------------------------
function setInfo(ido, keido) {

	latlng = new google.maps.LatLng(ido, keido);

	// 緯度
	document.getElementById("show_y").innerHTML = ido;
	
	// 経度
	document.getElementById("show_x").innerHTML = keido;

	// 高度
	if(isKoudo == true){	
		var locations = [];
		locations.push(latlng);
		var positionalRequest = {'locations': locations}
		elevator.getElevationForLocations(positionalRequest, function(results, status) {
			if (status == google.maps.ElevationStatus.OK) {
				// Retrieve the first result
				if (results[0]) {
					koudo= results[0].elevation.toString();
					document.getElementById("show_z").innerHTML = koudo +"m";
				
				} else {
					alert("No results found");
				}
			}
			else {
				alert("Elevation service failed due to: " + status);
			}
		});
	}

}


//----------------------
//  親に反映
//----------------------
function notifyParent() {
	if(km){
		window.opener.document.getElementById('var_' + km).value = distance;
	}
	if(m){
		window.opener.document.getElementById('var_' + m).value = distance;
	}
	
	if(latitude){
		window.opener.document.getElementById('var_' + latitude).value  = document.getElementById("show_y").innerHTML;
	}
	
	if(longitude){
		window.opener.document.getElementById('var_' + longitude).value = document.getElementById("show_x").innerHTML;
	}

	if(altitude){
		window.opener.document.getElementById('var_' + altitude).value  = koudo;
	}
	window.close();
}


function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
  		markers[i].setMap(null);
	}
}


function clearWaypoints() {
	markers = [];
	origin = null;
	destination = null;
	waypoints = [];
}


//-----------------------	
//  リセット
//-----------------------
function reset() {

	document.getElementById("show_y").innerHTML = "";
	document.getElementById("show_x").innerHTML = "";
	if(document.getElementById("show_z") != null) document.getElementById("show_z").innerHTML = "";
	if(document.getElementById("show_k") != null) document.getElementById("show_k").innerHTML = "";
    clearMarkers();
    clearWaypoints();
    if(directionsDisplay != null){
		directionsDisplay.setMap(null);
	    directionsDisplay.setPanel(null);
	    directionsDisplay = new google.maps.DirectionsRenderer();
	    directionsDisplay.setMap(map);
	    directionsDisplay.setPanel(document.getElementById("directionsPanel"));   
	}
	if(poly != null){
    	poly.setMap(null); 
	}

}


//-----------------
// 住所検索
//-----------------
function placeToMap(  ){
	var req = { address: document.getElementById("place").value   };
	geo.geocode(req, geoResultCallback);
}


function geoResultCallback(result, status) {
	if (status != google.maps.GeocoderStatus.OK) {
		alert(status);
		return;
	}
	latlng = result[0].geometry.location;
	map.setCenter(latlng);		
	setInfo(latlng.lat(), latlng.lng())
}


//-----------------------------------------
//  keyで指定されたクッキーを読み込む
//-----------------------------------------
function getCookie(key) {
    tmp = ' ' + document.cookie + ';';
    var xx1 = xx2 = 0;
    var len = tmp.length;
    while (xx1 < len) {
        xx2 = tmp.indexOf(';', xx1);
        var tmp2 = tmp.substring(xx1 + 1, xx2);
        xx3 = tmp2.indexOf('=');
        if (tmp2.substring(0, xx3) == key) {
            return(unescape(tmp2.substring(xx3 + 1, xx2 - xx1 - 1)));
        }
        xx1 = xx2 + 1;
    }
    return('');
}


//--------------------------------------------
//  プロフィールをクッキーから読み込む
//--------------------------------------------
function getProfileCookie2(cname){
	var profile = new Array();
	var cookie = getCookie('profile');
	if(cookie != ''){
		var ck = cookie.split(';');
		for(var j=0; j < ck.length; j++){
			var s = ck[j].split('=');
			if(s[0] == cname){
				return s[1];
			}	
		}
	}
	return null;
}


function getProfileCookie(){
	var profile = new Array();
	var cookie = getCookie('profile');

	if(cookie != ''){
		var ck = cookie.split(';');
		for(var j=0; j < ck.length; j++){
			profile.push(ck[j]);
		}
	}
	return profile;
}


function setProfileCookie(name, value){
	if(name != "" && value != "" ){
		var str = name + "=" + value;
		var profile = getProfileCookie();

		if(profile.length > 0){
			for(var i = 0 ; i < profile.length; i++) {
				var s = profile[i].split('=');
				if(s[0] != name){
					str += ";" + s[0] + "=" + s[1];
				}
			}
		}		
		setCookie('profile', str, 'http://keisan.casio.com/');
	}
}

function setCookie(key, value, path) {
     var tmp = key + '=' + escape(value) + '; ';
     tmp += 'expires=Tue, 31-Dec-2030 23:59:59; ';
     tmp += 'path=' + path +'; ';
     document.cookie = tmp;
}
