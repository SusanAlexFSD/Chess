import React, { useState, useEffect } from "react";
import "../index.css";

// Initialize the board
const initialBoard = () => {
  const emptyRow = Array(8).fill(null);
  const board = Array(8).fill(null).map(() => [...emptyRow]);

  const blackPieces = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
  const whitePieces = ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"];

  board[0] = blackPieces;
  board[1] = Array(8).fill("♟");
  board[6] = Array(8).fill("♙");
  board[7] = whitePieces;

  return board;
};

const whitePieces = ["♙", "♖", "♘", "♗", "♕", "♔"];
const blackPieces = ["♟", "♜", "♞", "♝", "♛", "♚"];

const isWhitePiece = (p) => whitePieces.includes(p);
const isBlackPiece = (p) => blackPieces.includes(p);

const isOpponentPiece = (target, isWhite) => {
  if (!target) return false;
  return isWhite ? isBlackPiece(target) : isWhitePiece(target);
};

const findKing = (board, king) => {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board[i][j] === king) return [i, j];
    }
  }
  return [-1, -1];
};

const isKingInCheck = (board, isWhite) => {
  const king = isWhite ? "♔" : "♚";
  const [kingRow, kingCol] = findKing(board, king);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && isOpponentPiece(piece, isWhite)) {
        if (isValidMove(piece, i, j, kingRow, kingCol, !isWhite, board)) return true;
      }
    }
  }
  return false;
};

const isCheckmate = (board, isWhite) => {
  if (!isKingInCheck(board, isWhite)) return false;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && ((isWhite && isWhitePiece(piece)) || (!isWhite && isBlackPiece(piece)))) {
        for (let x = 0; x < 8; x++) {
          for (let y = 0; y < 8; y++) {
            if (isValidMove(piece, i, j, x, y, isWhite, board)) {
              const simulatedBoard = board.map(row => [...row]);
              simulatedBoard[x][y] = piece;
              simulatedBoard[i][j] = null;
              if (!isKingInCheck(simulatedBoard, isWhite)) return false;
            }
          }
        }
      }
    }
  }
  return true;
};

const isValidMove = (piece, startRow, startCol, endRow, endCol, isWhite, board) => {
  const targetPiece = board[endRow][endCol];
  if ((isWhite && isWhitePiece(targetPiece)) || (!isWhite && isBlackPiece(targetPiece))) return false;

  const dr = endRow - startRow;
  const dc = endCol - startCol;

  switch (piece) {
    case "♙": case "♟": {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Normal move
      if (dc === 0 && dr === dir && !targetPiece) return true;

      // Initial double move
      if (dc === 0 && dr === 2 * dir && startRow === (isWhite ? 6 : 1) && !targetPiece) {
        const intermediateRow = startRow + dir;
        if (!board[intermediateRow][startCol] && !board[endRow][endCol]) return true;
      }

      // Diagonal capture
      if (Math.abs(dc) === 1 && dr === dir && isOpponentPiece(targetPiece, isWhite)) return true;

      return false;
    }

    case "♖": case "♜": {
      if (dr === 0) return boardPathClear(board, startRow, startCol, endRow, endCol, "horizontal");
      if (dc === 0) return boardPathClear(board, startRow, startCol, endRow, endCol, "vertical");
      return false;
    }
    case "♘": case "♞": return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    case "♗": case "♝": return Math.abs(dr) === Math.abs(dc) && boardPathClear(board, startRow, startCol, endRow, endCol, "diagonal");
    case "♕": case "♛": return (
      isValidMove("♖", startRow, startCol, endRow, endCol, isWhite, board) ||
      isValidMove("♗", startRow, startCol, endRow, endCol, isWhite, board)
    );
    case "♔": case "♚": {
      if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
        // Simulate the move
        const simulatedBoard = JSON.parse(JSON.stringify(board));
        simulatedBoard[endRow][endCol] = piece;
        simulatedBoard[startRow][startCol] = null;

        // Prevent the king from moving into check
        if (!isKingInCheck(simulatedBoard, isWhite)) {
          return true;
        }
      }
      return false;
    }

    default: return false;
  }
};

const boardPathClear = (board, startRow, startCol, endRow, endCol, type) => {
  const rowStep = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
  const colStep = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;

  let r = startRow + rowStep;
  let c = startCol + colStep;
  while (r !== endRow || c !== endCol) {
    if (board[r][c]) return false;
    r += rowStep;
    c += colStep;
  }
  return true;
};

let globalBoard = initialBoard();

const ChessBoard = () => {
  const [board, setBoard] = useState(initialBoard());
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("white");
  const [lastMoved, setLastMoved] = useState("white");
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [gameMode, setGameMode] = useState("2P");
  const [gameStatus, setGameStatus] = useState(null);

  useEffect(() => { globalBoard = board; }, [board]);


    // HANDLESQUARECLICK

 // Define the pawn promotion function
 const handlePawnPromotion = (row, col, piece, isWhite) => {
  // Only trigger promotion if it's a pawn reaching the last row
  if (piece === (isWhite ? "♙" : "♟") && (row === 0 || row === 7)) {
    const promotedPiece = prompt("Promote pawn to (Q, R, B, N):");

    if (promotedPiece) {
      // Ensure only valid pieces are selected
      const validPieces = ["Q", "R", "B", "N"];
      if (validPieces.includes(promotedPiece.toUpperCase())) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = isWhite
          ? `♕`  // White Queen
          : `♛`; // Black Queen

        setBoard(newBoard);
      } else {
        alert("Invalid piece selected!");
      }
    }
  }
};

// Your handleSquareClick function
const handleSquareClick = (row, col) => {
  if (gameStatus === "checkmate") return;

  const clickedPiece = board[row][col];
  const isWhite = turn === "white";

  if (!selected) {
    if (clickedPiece && ((turn === "white" && isWhitePiece(clickedPiece)) || (turn === "black" && isBlackPiece(clickedPiece)))) {
      setSelected({ row, col });
    }
    return;
  }

  if (selected.row === row && selected.col === col) return setSelected(null);

  const piece = board[selected.row][selected.col];
  const target = board[row][col];

  if (isValidMove(piece, selected.row, selected.col, row, col, isWhite, board)) {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = piece;
    newBoard[selected.row][selected.col] = null;

    // Check for pawn promotion
    handlePawnPromotion(row, col, piece, isWhite);

    if (!isKingInCheck(newBoard, isWhite)) {
      if (target) {
        isWhite ? setCapturedBlack(prev => [...prev, target]) : setCapturedWhite(prev => [...prev, target]);
      }

      const opponentIsWhite = !isWhite;
      const inCheck = isKingInCheck(newBoard, opponentIsWhite);
      const checkmate = isCheckmate(newBoard, opponentIsWhite);

      setGameStatus(checkmate ? "checkmate" : inCheck ? "check" : null);
      setBoard(newBoard);
      setSelected(null);
      setLastMoved(turn);
      setTurn(turn === "white" ? "black" : "white");
    } else {
      setSelected(null);
    }
  }
};
    


  const resetGame = () => {
    const fresh = initialBoard();
    setBoard(fresh);
    globalBoard = fresh;
    setCapturedWhite([]);
    setCapturedBlack([]);
    setTurn("white");
    setSelected(null);
    setGameStatus(null);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="captured-pieces flex flex-row justify-center space-x-2">
        {capturedBlack.map((p, idx) => (
          <span key={idx} className="text-xl">{p}</span>
        ))}
      </div>

      <div className="flex flex-row items-start space-x-8">
        <div className="mb-4">
          <label className="mr-2 font-semibold">Game Mode:</label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value)}
            className="p-1 border rounded"
          >
            <option value="2P">2 Players</option>
            <option value="vsComputer">Play vs Computer</option>
          </select>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="turn-indicator">Turn: {turn}</div>
          <div className="chessboard">
            {board.map((row, i) =>
              row.map((piece, j) => {
                const isLight = (i + j) % 2 === 0;
                const isSelected = selected && selected.row === i && selected.col === j;
                return (
                  <div
                    key={`${i}-${j}`}
                    className={`square ${isLight ? "light" : "dark"} ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSquareClick(i, j)}
                  >
                    {piece && (
                      <span className={isWhitePiece(piece) ? "white-piece" : "black-piece"}>
                        {piece}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={resetGame}
            className="mt-4 p-2 bg-blue-500 text-white rounded"
          >
            Reset Game
          </button>

          {gameStatus === "checkmate" && (
            <div className="mt-4 text-red-600 font-bold">
              Checkmate! {lastMoved === "white" ? "White" : "Black"} wins!
            </div>
          )}
          {gameStatus === "check" && (
            <div className="mt-4 text-yellow-600 font-bold">
              {turn === "white" ? "White" : "Black"} is in check!
            </div>
          )}
        </div>
      </div>

      <div className="captured-pieces flex flex-row justify-center space-x-2">
        {capturedWhite.map((p, idx) => (
          <span key={idx} className="text-xl">{p}</span>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;
