var xBoard = 0;
var oBoard = 0;
var begin = true;
var context;
var width, height;
var players = new Array();
var playerTurn = 0;

function paintBoard() {
   var board = document.getElementById('board');

   width = board.width;
   height = board.height;
   context = board.getContext('2d');

   context.beginPath();
   context.strokeStyle = '#000';
   context.lineWidth   = 4;

   context.moveTo((width / 3), 0);
   context.lineTo((width / 3), height);

   context.moveTo((width / 3) * 2, 0);
   context.lineTo((width / 3) * 2, height);

   context.moveTo(0, (height / 3));
   context.lineTo(width, (height / 3));

   context.moveTo(0, (height / 3) * 2);
   context.lineTo(width, (height / 3) * 2);

   context.stroke();
   context.closePath();
}

function checkWinner(board) {

   var result = false;

   if (((board | 0x1C0) == board) || ((board | 0x38 ) == board) ||
  ((board | 0x7) == board) || ((board | 0x124) == board) ||
  ((board | 0x92) == board) || ((board | 0x49) == board) ||
  ((board | 0x111) == board) || ((board | 0x54) == board)) {

  result = true;
   }
   return result;
}

function paintX(x, y) {

   context.beginPath();

   context.strokeStyle = '#ff0000';
   context.lineWidth   = 4;

   var offsetX = (width / 3) * 0.1;
   var offsetY = (height / 3) * 0.1;

   var beginX = x * (width / 3) + offsetX;
   var beginY = y * (height / 3) + offsetY;

   var endX = (x + 1) * (width / 3) - offsetX * 2;
   var endY = (y + 1) * (height / 3) - offsetY * 2;

   context.moveTo(beginX, beginY);
   context.lineTo(endX, endY);

   context.moveTo(beginX, endY);
   context.lineTo(endX, beginY);

   context.stroke();
   context.closePath();
}

function paintO(x, y) {

   context.beginPath();

   context.strokeStyle = '#0000ff';
   context.lineWidth   = 4;

   var offsetX = (width / 3) * 0.1;
   var offsetY = (height / 3) * 0.1;

   var beginX = x * (width / 3) + offsetX;
   var beginY = y * (height / 3) + offsetY;

   var endX = (x + 1) * (width / 3) - offsetX * 2;
   var endY = (y + 1) * (height / 3) - offsetY * 2;

   context.arc(beginX + ((endX - beginX) / 2), beginY + ((endY - beginY) / 2), (endX - beginX) / 2 , 0, Math.PI * 2, true);

   context.stroke();
   context.closePath();
}


function stateChanged(StateChangedEvent) {
  var bit = gapi.hangout.data.getValue('bit');
  bit = JSON.parse(bit);

  document.write("State changed");
  document.write("Current player turn: " + String(playerTurn));
  document.write("bit is: " + String(bit));

  if (playerTurn == 0) {
     markBit(bit, 'X');
     playerTurn = 1;
  } else if (playerTurn == 1) {
    markBit(bit, 'O');
    playerTurn = 0;
  }
}

function clickHandler(e) {
  document.write("Click registered");
  var y = Math.floor(e.clientY / (height / 3));
  var x =  Math.floor(e.clientX / (width/ 3));

  var bit =  (1 << x + ( y * 3 ));

  if (isEmpty(xBoard, oBoard, bit)) {
      document.write("Board pos is not empty");
    var participant = gapi.hangout.getParticipantById(gapi.hangout.getParticipantId());

    if ( (playerTurn == 0 && participant.person.id != players[0]) ||
         (playerTurn == 1 && participant.person.id != players[1]) ) {
        document.write("Need to return from clickHandler");
        return;
    }

    gapi.hangout.data.setValue('bit', JSON.stringify(bit));

    if (!checkNobody())  {
      if (checkWinner(xBoard)) {
        alert('You win!!');
        restart();
      } else {
        play();
        if (!checkNobody()) {
          if (checkWinner(oBoard)) {
            alert('Loser!!');
            restart();
          }
        }
      }
    }
  }
}

function checkNobody(){
   if ((xBoard | oBoard) == 0x1FF) {
       alert('Nobody won!!');
       restart();
       return true;
   }
   return false;
}

function restart() {
   context.clearRect (0, 0, width , height);
   xBoard = 0;
   oBoard = 0;
   paintBoard();
}

function isEmpty(xBoard, oBoard, bit) {
   return (((xBoard & bit) == 0) && ((oBoard & bit) == 0));
}

function simulate(oBoard, xBoard) {

   var ratio = 0;

   var bit = 0;
   for (var i= 0; i < 9; i++) {

        var cBit = 1 << i;

    if (isEmpty(xBoard, oBoard, cBit)) {
      if (checkWinner(oBoard | cBit)) {
        bit = cBit;
        break;
      } else if (checkWinner(xBoard | cBit)) {
        bit = cBit;
      }
    }
   }

   if (bit == 0) {
      for (var i= 0; i < 9; i++) {
    var cBit = 1 << i;

    if (isEmpty(xBoard, oBoard, cBit)) {
        var result = think(oBoard, xBoard, 'X', 0, 1)
        if (ratio == 0 || ratio < result) {
           ratio = result;
           bit = cBit;
        }
     }
       }
   }
   return bit;
}

function think(oBoard, xBoard, player, bit, ratio) {

   if (player == 'O') {
  oBoard = oBoard | bit;
   } else {
  xBoard = xBoard | bit;
   }

   if (checkWinner(oBoard)) {
      ratio *= 1.1;
      return ratio;

   } else if (checkWinner(xBoard)) {

      ratio *= 0.7;
      return ratio;

   } else {
  var best = 0;
  ratio *= 0.6;

  for (var i= 0; i < 9; i++) {

     if (isEmpty(xBoard, oBoard, 1 << i)) {

               var newRatio = think(oBoard, xBoard, player == 'O' ? 'X' : 'O', 1 << i, ratio);

               if (best == 0 || best < newRatio) {
      best = newRatio;
               }
    }
  }

  return best;
   }
}

function markBit(markBit, player) {

   var bit = 1;
   var posX = 0, posY = 0;

   while ((markBit & bit) == 0) {
    bit = bit << 1;
        posX++;
    if (posX > 2) {
            posX = 0;
            posY++;
        }
   }

    if (player == 'O') {
        oBoard = oBoard | bit;
        paintO(posX, posY);
    } else {
        xBoard = xBoard | bit;
        paintX(posX, posY);
    }
}

function play() {
    return;
}

function startGame(apiInitEvent) {
  if (apiInitEvent.isApiReady) {
    document.write("API is ready!");
    paintBoard();
    document.write("Board painted");
    gapi.hangout.onApiReady.remove(startGame);
//            if (players.length >= 2) {
//              var board = document.getElementById("board");
//              board.onclick = clickHandler;
//            }
  }
}

function addParticipant(ParticipantsEnabledEvent) {
  participants = gapi.hangout.getEnabledParticipants();

  for (var i = 0; i < participants.length; i++) {
    var person_id = participants[i].person.id;
    document.write("Person is: " + String(person_id));
    if (players.length < 2 && players.indexOf(person_id) == -1) {
      players[players.length] = person_id;
    }
  }

//          if (players.length >= 2) {
//            var board = document.getElementById("board");
//            board.onclick = clickHandler;
//          }
}

function removeParticipant(ParticipantsDisabledEvent) {
  participants = ParticipantsEnabledEvent.disabledParticipants;

  for (var i = 0; i < participants.length; i++) {
    document.write("Person removed: " + String(person_id));
    var idx = players.indexOf(participants[i].person.id);
    if (idx != -1) {
      players.splice(idx, 1);
    }
  }
  // TODO: If number of players is less than two - then do something!
}

if (gapi && gapi.hangout) {
   gapi.hangout.onApiReady.add(startGame);
   gapi.hangout.onParticipantsEnabled.add(addParticipant);
   gapi.hangout.onParticipantsDisabled.add(removeParticipant);
   gapi.hangout.data.onStateChanged.add(stateChanged);
}
