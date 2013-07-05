var roombaStatus;

exports.init = function (SARAH){
  status(SARAH.ConfigManager.getConfig());
}

exports.action = function(data, callback, config, SARAH) {
  
	var url="";
  var rawConfig = config;
	config = config.modules.roomba;
	
	if (!config.ip_roomba) {
	  console.log("Missing Roomba configuration");
	  callback({'tts': "Roomba n'est pas configuré"});
	  return;
	}
	if (data.button == "STATUS") {
     // Roomba status
     status(rawConfig);
     if (!roombaStatus) {
        callback({'tts': 'je me rensaigne, aissaille encore une fois'});
     } else {
        callback({'tts': roombaStatus.ttsStatus});
     } 
     return;
     
  } else {
    // Action bouton
  	url = 'http://' + config.ip_roomba + '/roomba.cgi?button=' + data.button;
    console.log(url);
    
  	// Send Request
  	var request = require('request');
  	request({ 'uri' : url }, function (err, response, body){
  	
  		if (err || response.statusCode != 200) {
  			callback({'tts': "L'action a échoué"});
  			return;
  		}
  		
  		console.log(body);
  		
  		// Callback with TTS
  		callback({'tts': "ok, c'est parti !"});
  	});
  }
}

var status  = function(config){ 
  var url="";
	config = config.modules.roomba;
 
	if (!config.ip_roomba) {
	  status.isAlive={'isAlive' : 'dead'};
    return status;
	}
	
	url = 'http://' + config.ip_roomba + '/roomba.json';
 
  roombaStatusCheck(
     function (roombaRawStatus) {
      	var chargeStateStatus = ['non','en recuperation','en cours','maintien','en attente','en erreur']
      	var status;
      	var dirtLeft;
      	var dirtRight;
      	var chargeState;
      	var chargeValue;
      	var chargeCapacity;
        var chargePourcentage;
        
        if (roombaRawStatus == 'error') {
          roombaStatus = {'isAlive' : 'dead'};
        } else {
          status = JSON.parse(roombaRawStatus);
          roombaStatus = {'isAlive' : 'alive', 
                          'dirtLeft' : '', 
                          'dirtRight' : '',
                          'chargeState' : '',
                          'chargeValue' : '', 
                          'chargeValueImage' : '',
                          'ttsStatus' : 'je me renseigne, aissaille encore une fois'};
          chargePourcentage = (status.response.r18.value*100/status.response.r19.value);
          roombaStatus.dirtLeft = getDirtImage(status.response.r8.value); 
          roombaStatus.dirtRight = getDirtImage(status.response.r9.value); 
          roombaStatus.chargeState =  chargeStateStatus[status.response.r14.value]
          roombaStatus.chargeValue = chargePourcentage + '% (' + status.response.r19.value + 'mAh)';
          roombaStatus.chargeValueImage = getChargeImage(status.response.r18.value);
          roombaStatus.ttsStatus = 'chargé a ' + chargePourcentage + '%, ' + getDirtStatus(status.response.r8.value) + 'a gauche, et ' + getDirtStatus(status.response.r9.value) + 'a droite';
        }

        return;
     }, url);
        return roombaStatus;
}

exports.status  = status;

function roombaStatusCheck(callback, url) {
  var request = require('request');
  request({ 'uri' : url }, function (err, response, body){

  	if (err || response.statusCode != 200) {
  		callback('error');
  		return;
  	}
  	callback(body);
  });
}
               
function getDirtStatus(value) {
  if (value == 0) {return 'propr';}
  if (value > 0 && value <= 85) {return 'peu sale';}
  if (value > 85 && value <= 125) {return 'penser a naitoyer';}
  if (value > 125 && value <= 170) {return 'trai sale';}
  if (value > 170) {return 'fo naitoyer durgence';}
}
function getDirtImage(value) {
  if (value == 0) {return 'dirt_0.png';}
  if (value > 0 && value <= 85) {return 'dirt_85.png';}
  if (value > 85 && value <= 125) {return 'dirt_125.png';}
  if (value > 125 && value <= 170) {return 'dirt_170.png';}
  if (value > 170) {return 'dirt_255.png';}
}
function getChargeImage(value) {
  if (value == 0) {return 'charge_0.png';}
  if (value > 0 && value <= 25) {return 'charge_25.png';}
  if (value > 25 && value <= 50) {return 'charge_50.png';}
  if (value > 50 && value <= 75) {return 'charge_75.png';}
  if (value > 75) {return 'charge_100.png';}
}
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}