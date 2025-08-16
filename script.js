const pieceImages = {
  "bK": "chesspieces/bK.png",
  "bQ": "chesspieces/bQ.png",
  "bR": "chesspieces/bR.png",
  "bB": "chesspieces/bB.png",
  "bN": "chesspieces/bN.png",
  "bP": "chesspieces/bP.png",
  "wK": "chesspieces/wK.png",
  "wQ": "chesspieces/wQ.png",
  "wR": "chesspieces/wR.png",
  "wB": "chesspieces/wB.png",
  "wN": "chesspieces/wN.png",
  "wP": "chesspieces/wP.png",
};

let selectedSquare = null;
let highlightedMoves = [];
let currentTurn = "w"; // "w" for White, "b" for Black
let whiteTime = 300; // 5 minutes in seconds
let blackTime = 300;
let timerInterval;
let moveHistory = []; // Array to store move history
let kingMoved = { w: false, b: false }; // Track if kings have moved
let rookMoved = { w: { a: false, h: false }, b: { a: false, h: false } }; // Track if rooks have moved
let isBotEnabled = false; // Track if bot is enabled
let botColor = "b"; // Bot plays as black by default

const initialSetup = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
];

function getSquareNotation(row, col) {
  const files = "abcdefgh";
  return files[col] + (8 - row);
}

function createChessBoard() {
  const board = document.getElementById("chessBoard");
  board.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      const isWhite = (row + col) % 2 === 0;
      square.className = `square ${isWhite ? "white" : "black"}`;
      square.dataset.row = row;
      square.dataset.col = col;

      // Add square notation
      const pos = getSquareNotation(row, col);
      const posText = document.createElement("div");
      posText.textContent = pos;
      posText.style.position = "absolute";
      posText.style.bottom = "2px";
      posText.style.right = "2px";
      posText.style.fontSize = "10px";
      posText.style.color = isWhite ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
      square.appendChild(posText);

      // Add piece if present
      const piece = initialSetup[row][col];
      if (piece) {
        const img = document.createElement("img");
        img.src = pieceImages[piece];
        img.alt = piece;
        img.className = "piece";
        square.appendChild(img);
      }

      // Highlight selected square and valid moves
      if (selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col) {
        square.classList.add("selected");
      } else if (highlightedMoves.some(([r, c]) => r === row && c === col)) {
        square.classList.add("valid-move");
      }

      square.onclick = () => handleSquareClick(row, col);
      board.appendChild(square);
    }
  }

  // Update player profiles
  const player1Profile = document.getElementById("player1");
  const player2Profile = document.getElementById("player2");
  
  if (currentTurn === "w") {
    player1Profile.classList.add("active");
    player2Profile.classList.remove("active");
  } else {
    player1Profile.classList.remove("active");
    player2Profile.classList.add("active");
  }

  // Update turn info
  document.getElementById("turnInfo").textContent = `Turn: ${currentTurn === "w" ? "White" : "Black"}`;
}

function handleSquareClick(row, col) {
  // Don't allow player moves when it's bot's turn
  if (isBotEnabled && currentTurn === botColor) return;

  const clickedPiece = initialSetup[row][col];

  if (selectedSquare) {
    const [fromRow, fromCol] = selectedSquare;
    const piece = initialSetup[fromRow][fromCol];

    const legalMoves = getLegalMoves(fromRow, fromCol, piece);
    const isLegal = legalMoves.some(([r, c]) => r === row && c === col);

    if (isLegal) {
      // Handle castling
      if (piece[1] === "K" && Math.abs(col - fromCol) === 2) {
        if (col > fromCol) {
          initialSetup[row][col - 1] = initialSetup[row][7];
          initialSetup[row][7] = "";
        } else {
          initialSetup[row][col + 1] = initialSetup[row][0];
          initialSetup[row][0] = "";
        }
      }

      // Update piece movement tracking
      if (piece[1] === "K") {
        kingMoved[piece[0]] = true;
      } else if (piece[1] === "R") {
        if (fromCol === 0) rookMoved[piece[0]].a = true;
        if (fromCol === 7) rookMoved[piece[0]].h = true;
      }

      initialSetup[row][col] = piece;
      initialSetup[fromRow][fromCol] = "";
      showMoveInfo(piece, fromRow, fromCol, row, col);

      // Switch turns
      currentTurn = currentTurn === "w" ? "b" : "w";

      // Reset selection and highlight
      selectedSquare = null;
      highlightedMoves = [];

      // Restart timer for the new player
      stopTimer();
      startTimer();

      createChessBoard();

      // Check for checkmate
      // Check for checkmate on the opponent
const opponentColor = currentTurn === "w" ? "b" : "w";
if (checkForCheckmate(opponentColor))
   {
  return;
}

      // If bot is enabled and it's bot's turn, make a move
      if (isBotEnabled && currentTurn === botColor) {
        setTimeout(makeBotMove, 500);
      }
    } else if (clickedPiece && clickedPiece[0] === piece[0]) {
      selectedSquare = [row, col];
      highlightedMoves = getLegalMoves(row, col, clickedPiece);
      createChessBoard();
    } else {
      selectedSquare = null;
      highlightedMoves = [];
      createChessBoard();
    }
  } else if (clickedPiece && clickedPiece[0] === currentTurn) {
    selectedSquare = [row, col];
    highlightedMoves = getLegalMoves(row, col, clickedPiece);
    createChessBoard();
  }
}

function getLegalMoves(row, col, piece) {
  // Get basic moves first
  const moves = getBasicMoves(row, col, piece);
  const color = piece[0];

  // Add castling moves for king
  if (piece[1] === "K" && !kingMoved[color]) {
    const castlingMoves = getCastlingMoves(row, col, color);
    moves.push(...castlingMoves);
  }

  // Filter out moves that would put the player's own king in check
  return moves.filter(([r, c]) => {
    // Simulate the move
    const originalPiece = initialSetup[r][c];
    initialSetup[r][c] = piece;
    initialSetup[row][col] = "";

    // Find the king's position
    const kingPosition = findKing(color);
    const [kingRow, kingCol] = kingPosition;
    
    // Check if the king is in check after the move
    const isInCheck = isKingInCheck(kingRow, kingCol, color === "w" ? "b" : "w");

    // Undo the move
    initialSetup[row][col] = piece;
    initialSetup[r][c] = originalPiece;

    // Keep the move if it doesn't put the king in check
    return !isInCheck;
  });
}

// Function to check if a king is in check
function isKingInCheck(kingRow, kingCol, attackingColor) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = initialSetup[row][col];
      if (piece && piece[0] === attackingColor) {
        const moves = getBasicMoves(row, col, piece);
        if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Function to get basic moves without checking if they put the king in check
function getBasicMoves(row, col, piece) {
  const moves = [];
  const color = piece[0];
  const type = piece[1];
  const directions = {
    R: [[1, 0], [-1, 0], [0, 1], [0, -1]],
    B: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    Q: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    N: [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]],
    K: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
  };

  // Pawn logic
  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;

    // Forward move
    if (row + dir >= 0 && row + dir < 8 && initialSetup[row + dir][col] === "") {
      moves.push([row + dir, col]);
      // Initial two-square move
      if (row === startRow && initialSetup[row + 2 * dir][col] === "") {
        moves.push([row + 2 * dir, col]);
      }
    }

    // Captures
    for (let dc of [-1, 1]) {
      const targetCol = col + dc;
      const targetRow = row + dir;
      if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
        const targetPiece = initialSetup[targetRow][targetCol];
      if (targetPiece && targetPiece[0] !== color) {
        moves.push([targetRow, targetCol]);
      }
    }
  }
    return moves;
  }

  // Other pieces
  const pieceDirections = directions[type];
  if (!pieceDirections) return moves;

  for (const [dr, dc] of pieceDirections) {
    let newRow = row + dr;
    let newCol = col + dc;

    // For sliding pieces (Rook, Bishop, Queen)
  if (["R", "B", "Q"].includes(type)) {
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = initialSetup[newRow][newCol];
        if (targetPiece === "") {
          moves.push([newRow, newCol]);
        } else {
          if (targetPiece[0] !== color) {
            moves.push([newRow, newCol]);
          }
          break;
        }
        newRow += dr;
        newCol += dc;
      }
    }
    // For jumping pieces (Knight) and King
    else {
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = initialSetup[newRow][newCol];
        if (targetPiece === "" || targetPiece[0] !== color) {
          moves.push([newRow, newCol]);
        }
      }
    }
  }

  return moves;
}

// Function to check if the player has any valid moves
function hasValidMoves(playerColor) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = initialSetup[row][col];
      if (piece && piece[0] === playerColor) {
        const moves = getBasicMoves(row, col, piece);
        for (let [r, c] of moves) {
          // Simulate the move
          const originalPiece = initialSetup[r][c];
          initialSetup[r][c] = piece;
          initialSetup[row][col] = "";

          const kingPosition = findKing(playerColor);
          const [kingRow, kingCol] = kingPosition;
          const isInCheck = isKingInCheck(kingRow, kingCol, playerColor === "w" ? "b" : "w");

          // Undo the move
          initialSetup[row][col] = piece;
          initialSetup[r][c] = originalPiece;

          if (!isInCheck) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Function to find the king's position
function findKing(color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (initialSetup[row][col] === color + "K") {
        return [row, col];
      }
    }
  }
  return null;
}

// Function to check for checkmate
function checkForCheckmate(targetColor) {
  const kingPosition = findKing(targetColor);
  if (!kingPosition) return false;
  const [kingRow, kingCol] = kingPosition;

  // Check if the king is currently in check
  const attackingColor = targetColor === "w" ? "b" : "w";
  const isInCheck = isKingInCheck(kingRow, kingCol, attackingColor);

  // Check if any piece of the target color has legal moves
  let hasLegalMoves = false;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = initialSetup[row][col];
      if (piece && piece[0] === targetColor) {
        const moves = getLegalMoves(row, col, piece);
        if (moves.length > 0) {
          hasLegalMoves = true;
          break;
        }
      }
    }
    if (hasLegalMoves) break;
  }

  if (!hasLegalMoves) {
    const gameStatus = document.getElementById("gameStatus");
    if (isInCheck) {
      gameStatus.textContent = `Checkmate! ${targetColor === "w" ? "Black" : "White"} wins!`;
    } else {
      gameStatus.textContent = "Stalemate! The game is a draw.";
    }
    gameStatus.style.display = "block";
    stopTimer();
    return true;
  }
}

function showMoveInfo(piece, fromRow, fromCol, toRow, toCol) {
  const fromNotation = getSquareNotation(fromRow, fromCol);
  const toNotation = getSquareNotation(toRow, toCol);
  const pieceName = getPieceName(piece);
  const moveText = `${pieceName} ${fromNotation} → ${toNotation}`;
  
  // Add to move history
  moveHistory.push(moveText);
  const moveHistoryDiv = document.getElementById("moveHistory");
  moveHistoryDiv.innerHTML = moveHistory.map(move => `<div>${move}</div>`).join("");
  moveHistoryDiv.scrollTop = moveHistoryDiv.scrollHeight;

  // Show current move
  const moveInfo = document.getElementById("moveInfo");
  moveInfo.textContent = moveText;
}

function getPieceName(piece) {
  const pieceNames = {
    "K": "King",
    "Q": "Queen",
    "R": "Rook",
    "B": "Bishop",
    "N": "Knight",
    "P": "Pawn"
  };
  return pieceNames[piece[1]];
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (currentTurn === "w" && whiteTime > 0) {
      whiteTime--;
    } else if (currentTurn === "b" && blackTime > 0) {
      blackTime--;
    }

    updateTimers();
    
    // Check for time-out
    if ((currentTurn === "w" && whiteTime <= 0) || (currentTurn === "b" && blackTime <= 0)) {
      handleTimeOut();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimers() {
  const timeLeft1 = document.getElementById("timeLeft1");
  const timeLeft2 = document.getElementById("timeLeft2");

  timeLeft1.textContent = formatTime(whiteTime);
  timeLeft2.textContent = formatTime(blackTime);
}

function formatTime(timeInSeconds) {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

function handleTimeOut() {
  const winner = currentTurn === "w" ? "Black" : "White";
  const gameStatus = document.getElementById("gameStatus");
  gameStatus.textContent = `Time's up! ${winner} wins!`;
  gameStatus.style.display = "block";
  stopTimer();
}

function startGame() {
  const timeOption = document.getElementById("timeOptions").value;
  whiteTime = blackTime = parseInt(timeOption) * 60;
  
  document.getElementById("timeSelection").style.display = "none";
  document.getElementById("gameContainer").style.display = "flex";
  document.getElementById("gameStatus").style.display = "none";
  
  // Reset game state
  selectedSquare = null;
  highlightedMoves = [];
  currentTurn = "w";
  moveHistory = [];
  kingMoved = { w: false, b: false };
  rookMoved = { w: { a: false, h: false }, b: { a: false, h: false } };
  
  // Initialize the board
  createChessBoard();
  startTimer();

  // If bot is enabled and it's bot's turn, make a move
  if (isBotEnabled && currentTurn === botColor) {
    setTimeout(makeBotMove, 500);
  }
}

function resetGame() {
  // Reset the board to initial setup
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      initialSetup[i][j] = "";
    }
  }

  // Set up black pieces
  initialSetup[0] = ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"];
  initialSetup[1] = ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"];

  // Set up white pieces
  initialSetup[6] = ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"];
  initialSetup[7] = ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"];
  
  // Reset game state
  selectedSquare = null;
  highlightedMoves = [];
  currentTurn = "w";
  moveHistory = [];
  
  // Reset castling tracking
  kingMoved = { w: false, b: false };
  rookMoved = { w: { a: false, h: false }, b: { a: false, h: false } };
  
  // Reset timers
  const timeOption = document.getElementById("timeOptions").value;
  whiteTime = blackTime = parseInt(timeOption) * 60;
  
  // Update UI
  document.getElementById("gameStatus").style.display = "none";
  document.getElementById("moveInfo").textContent = "";
  document.getElementById("moveHistory").innerHTML = "";
  createChessBoard();
  startTimer();
}

// Function to get castling moves
function getCastlingMoves(row, col, color) {
  const moves = [];
  const isWhite = color === "w";
  const backRank = isWhite ? 7 : 0;
  
  // Check if king is in check
  if (isKingInCheck(row, col, color === "w" ? "b" : "w")) {
    return moves;
  }

  // Kingside castling
  if (!rookMoved[color].h) {
    let canCastleKingside = true;
    // Check if squares between king and rook are empty
    for (let c = col + 1; c < 7; c++) {
      if (initialSetup[backRank][c] !== "") {
        canCastleKingside = false;
        break;
      }
      // Check if king would pass through check
      if (isKingInCheck(backRank, c, color === "w" ? "b" : "w")) {
        canCastleKingside = false;
        break;
      }
    }
    if (canCastleKingside) {
      moves.push([backRank, col + 2]);
    }
  }

  // Queenside castling
  if (!rookMoved[color].a) {
    let canCastleQueenside = true;
    // Check if squares between king and rook are empty
    for (let c = col - 1; c > 0; c--) {
      if (initialSetup[backRank][c] !== "") {
        canCastleQueenside = false;
        break;
      }
      // Check if king would pass through check
      if (isKingInCheck(backRank, c, color === "w" ? "b" : "w")) {
        canCastleQueenside = false;
        break;
      }
    }
    if (canCastleQueenside) {
      moves.push([backRank, col - 2]);
    }
  }

  return moves;
}

function toggleBot() {
  isBotEnabled = !isBotEnabled;
  const botButton = document.getElementById("botButton");
  botButton.textContent = isBotEnabled ? "Disable Bot" : "Enable Bot";
  
  if (isBotEnabled && currentTurn === botColor) {
    setTimeout(makeBotMove, 500);
  }
}

function makeBotMove() {
  if (!isBotEnabled || currentTurn !== botColor) return;

  const possibleMoves = [];
  
  // Collect all possible moves for the bot
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = initialSetup[row][col];
      if (piece && piece[0] === botColor) {
        const moves = getLegalMoves(row, col, piece);
        for (const move of moves) {
          possibleMoves.push({
            from: [row, col],
            to: move,
            piece: piece
          });
        }
      }
    }
  }

  if (possibleMoves.length === 0) return;

  // Evaluate moves and choose the best one
  const bestMove = evaluateMoves(possibleMoves);
  
  // Execute the move
  const [fromRow, fromCol] = bestMove.from;
  const [toRow, toCol] = bestMove.to;
  const piece = bestMove.piece;

  // Handle castling
  if (piece[1] === "K" && Math.abs(toCol - fromCol) === 2) {
    if (toCol > fromCol) {
      initialSetup[toRow][toCol - 1] = initialSetup[toRow][7];
      initialSetup[toRow][7] = "";
    } else {
      initialSetup[toRow][toCol + 1] = initialSetup[toRow][0];
      initialSetup[toRow][0] = "";
    }
  }

  // Update piece movement tracking
  if (piece[1] === "K") {
    kingMoved[piece[0]] = true;
  } else if (piece[1] === "R") {
    if (fromCol === 0) rookMoved[piece[0]].a = true;
    if (fromCol === 7) rookMoved[piece[0]].h = true;
  }

  initialSetup[toRow][toCol] = piece;
  initialSetup[fromRow][fromCol] = "";
  showMoveInfo(piece, fromRow, fromCol, toRow, toCol);

  // Switch turns
  currentTurn = currentTurn === "w" ? "b" : "w";
  
  // Update the board
  createChessBoard();
  
  // Check for checkmate
  if (checkForCheckmate()) {
    return;
  }

  // If it's still bot's turn (in case of multiple moves), make another move
  if (isBotEnabled && currentTurn === botColor) {
    setTimeout(makeBotMove, 500);
  }
}

function evaluateMoves(possibleMoves) {
  // Simple evaluation function
  const pieceValues = {
    "P": 1,
    "N": 3,
    "B": 3,
    "R": 5,
    "Q": 9,
    "K": 100
  };

  // Add some randomness to make the bot less predictable
  const randomFactor = Math.random() * 0.2;

  return possibleMoves.reduce((best, move) => {
    const [toRow, toCol] = move.to;
    const targetPiece = initialSetup[toRow][toCol];
    let score = 0;

    // Capture value
    if (targetPiece) {
      score += pieceValues[targetPiece[1]] * 10;
    }

    // Position value (center control)
    const centerDistance = Math.abs(3.5 - toRow) + Math.abs(3.5 - toCol);
    score += (7 - centerDistance) * 0.1;

    // Add randomness
    score += randomFactor;

    // Prefer moves that don't put the piece in danger
    if (isSquareUnderAttack(toRow, toCol, botColor)) {
      score -= pieceValues[move.piece[1]] * 5;
    }

    return score > best.score ? { ...move, score } : best;
  }, { score: -Infinity });
}

function isSquareUnderAttack(row, col, defendingColor) {
  const attackingColor = defendingColor === "w" ? "b" : "w";
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = initialSetup[r][c];
      if (piece && piece[0] === attackingColor) {
        const moves = getBasicMoves(r, c, piece);
        if (moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col)) {
          return true;
        }
      }
    }
  }
  return false;
}
