let socket = io();

let symbol: string;
let score = {"Total": 0, "X": 0, "Tie": 0, "O": 0};
let winner: string;
let myTurn: boolean;

$(function () {
  $(".board .tile").attr("disabled", "true");
  $(".replay").attr("disabled", "true")
  $(".board> button").on("click", makeMove);
  $(".replay").on("click", replay);
  // Event is called when either player makes a move
  socket.on("move.made", function (data: { position: string; symbol: string | number | boolean | ((this: HTMLElement, index: number, text: string) => string | number | boolean); }) {
    // Render the move
    $("#" + data.position).text(data.symbol);
    // If the symbol is the same as the player's symbol,
    // we can assume it is their turn

    myTurn = data.symbol !== symbol;

    // If the game is still going, show who's turn it is
    if (!isGameOver()) {
      if (gameTied()) {
        score.Tie = score.Tie + 1
        score.Total = score.Total + 1
        $("#Tie").text(score.Tie)
        $("#total").text(score.Total)
        $("#messages").text("Game over, it was a tie!");
        $(".board button").attr("disabled", "true");
        $(".replay").removeAttr("disabled");
      } else {
        renderTurnMessage();
      }
      // If the game is over
    } else {
      // Show the message for the loser
      if (myTurn) {
        $("#messages").text("Game over. You lost.");
        // Show the message for the winner
      } else {
        $("#messages").text("Game over. You won!");
      }
      myTurn ? (symbol === "X" ? score.X++ : score.O++) : (symbol === "O" ? score.X++ : score.O++);
      score.Total = score.Total + 1
      $("#total").text(score.Total)
      $("#X").text(score.X)
      $("#O").text(score.O)
      // Disable the board
      $(".board button").attr("disabled", "true");
      $(".replay").removeAttr("disabled");
    }
  });

  // Set up the initial state when the game begins
  socket.on("game.begin", function (data: { symbol: string; }) {
    // assign X or O to the player
    symbol = data.symbol;
    // Give X the first turn
    myTurn = symbol === "X";
    renderTurnMessage();
  });

  socket.on("game.replay", function(data: { winner: string; }) {
    // Give winner the first turn
    myTurn = symbol !== data.winner;
    
    // clear board
    $(".board .tile").each(function () {
      $(this).text("");
    });

    renderTurnMessage();
  });

  // Disable the board if the opponent leaves
  socket.on("opponent.left", function () {
    $("#messages").text("Your opponent left the game.");
    $(".board button").attr("disabled", "true");
  });
});

function getBoardState() {
  var obj : {[key: string] : string} = {};

  $(".board button").each(function () {
    obj[$(this).attr("id")] = $(this).text() || "";
  });
  return obj;
}


function gameTied() {
  var state  = getBoardState();

  if (
    state.a0 !== "" &&
    state.a1 !== "" &&
    state.a2 !== "" &&
    state.b0 !== "" &&
    state.b0 !== "" &&
    state.b1 !== "" &&
    state.b2 !== "" &&
    state.c0 !== "" &&
    state.c1 !== "" &&
    state.c2 !== ""
  ) {
    
    return true;
  }
}

function isGameOver() {
  var state = getBoardState(),
    // Game is over if a row equals one of these values
    matches = ["XXX", "OOO"],
    // winning combos
    rows = [
      state.a0 + state.a1 + state.a2,
      state.b0 + state.b1 + state.b2,
      state.c0 + state.c1 + state.c2,
      state.a0 + state.b1 + state.c2,
      state.a2 + state.b1 + state.c0,
      state.a0 + state.b0 + state.c0,
      state.a1 + state.b1 + state.c1,
      state.a2 + state.b2 + state.c2,
    ];

  for (var i = 0; i < rows.length; i++) {
    if (rows[i] === matches[0] || rows[i] === matches[1]) {
      return true;
    }
  }
}

function renderTurnMessage() {
  // Disable the board if it is the opponents turn
  if (!myTurn) {
    $("#messages").text("Your opponent's turn");
    $(".board button").attr("disabled", "true");
    // Enable the board if it is your turn
  } else {
    $("#messages").text(`Your turn ${symbol}.`);
    $(".board button").removeAttr("disabled");
  }
}

function makeMove(e: { preventDefault: () => void; }) {
  e.preventDefault();
  // It's not your turn
  if (!myTurn) {
    return;
  }
  // Square has already been played
  if ($(this).text().length) {
    return;
  }

  // Emit the move to the server
  socket.emit("make.move", {
    symbol: symbol,
    position: $(this).attr("id"),
  });
}

// get winner of the game and emit to server to reset board
function replay (e: { preventDefault: () => void; }) {
  e.preventDefault();
  myTurn ? (symbol === "X" ? winner = "X" : winner = "O") : (symbol === "O" ? winner = "X" : winner = "O");
  socket.emit("replay", {winner: winner});
}

