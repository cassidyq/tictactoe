const express = require('express')
const app = express()

app.use(express.static('public'))
const port = process.env.PORT || 5000
const http = require('http').createServer(app);
const io = require('socket.io')(http);

http.listen(port, () => console.log(`Listening on port ${port}`))

app.use(express.static(__dirname + '/public')); 

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

let players = {},
 unmatched;

io.sockets.on("connection", function (socket) {
    console.log("socket connected")
  socket.emit('connect',{msg:"hello"})
  joinGame(socket);

  if (getOpponent(socket)) {
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
    });
    getOpponent(socket).emit("game.begin", {
      symbol: players[getOpponent(socket).id].symbol,
    });
  }

  socket.on("make.move", function (data) {
    if (!getOpponent(socket)) {
      return;
    }
    socket.emit("move.made", data);
    getOpponent(socket).emit("move.made", data);
  });

  socket.on("replay", function (data) {
    if (!getOpponent(socket)) {
      return;
    }
    socket.emit("game.replay", data);
    getOpponent(socket).emit("game.replay", data);
  });

  socket.on("disconnect", function () {
    if (getOpponent(socket)) {
      getOpponent(socket).emit("opponent.left");
    }
  });
});

function joinGame(socket) {
  players[socket.id] = {
    opponent: unmatched,

    symbol: "X",
    // The socket that is associated with this player
    socket: socket,
  };
  if (unmatched) {
    players[socket.id].symbol = "O";
    players[unmatched].opponent = socket.id;
    unmatched = null;
  } else {
    unmatched = socket.id;
  }
}

function getOpponent(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  return players[players[socket.id].opponent].socket;
}
