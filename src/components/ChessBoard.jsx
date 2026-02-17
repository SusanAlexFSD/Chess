import React, { useEffect, useMemo, useState } from "react";
import "../index.css";

/* =========================
   Assets / Board Setup
   ========================= */

const getPieceImage = (piece) => {
  const pieceMap = {
    "♔": "whiteking.png",
    "♕": "whitequeen.png",
    "♖": "whiterook.png",
    "♗": "whitebishop.png",
    "♘": "whiteknight.png",
    "♙": "whitepawn.png",
    "♚": "blackking.png",
    "♛": "blackqueen.png",
    "♜": "blackrook.png",
    "♝": "blackbishop.png",
    "♞": "blackknight.png",
    "♟": "blackpawn.png",
  };

  return pieceMap[piece]
    ? `${import.meta.env.BASE_URL}images/${pieceMap[piece]}`
    : null;
};

const initialBoard = () => {
  const emptyRow = Array(8).fill(null);
  const board = Array(8)
    .fill(null)
    .map(() => [...emptyRow]);

  const blackBackRank = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
  const whiteBackRank = ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"];

  board[0] = blackBackRank;
  board[1] = Array(8).fill("♟");
  board[6] = Array(8).fill("♙");
  board[7] = whiteBackRank;

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

/* =========================
   Move / Rule Helpers
   ========================= */

const findKing = (board, king) => {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (board[i][j] === king) return [i, j];
    }
  }
  return [-1, -1];
};

const boardPathClear = (board, startRow, startCol, endRow, endCol) => {
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

const isValidMove = (
  piece,
  startRow,
  startCol,
  endRow,
  endCol,
  isWhite,
  board
) => {
  const targetPiece = board[endRow][endCol];

  // can't capture your own piece
  if (
    (isWhite && isWhitePiece(targetPiece)) ||
    (!isWhite && isBlackPiece(targetPiece))
  ) {
    return false;
  }

  const dr = endRow - startRow;
  const dc = endCol - startCol;

  switch (piece) {
    case "♙":
    case "♟": {
      const dir = isWhite ? -1 : 1;

      // normal
      if (dc === 0 && dr === dir && !targetPiece) return true;

      // double from start
      if (
        dc === 0 &&
        dr === 2 * dir &&
        startRow === (isWhite ? 6 : 1) &&
        !targetPiece
      ) {
        const intermediateRow = startRow + dir;
        if (!board[intermediateRow][startCol] && !board[endRow][endCol])
          return true;
      }

      // capture
      if (
        Math.abs(dc) === 1 &&
        dr === dir &&
        isOpponentPiece(targetPiece, isWhite)
      )
        return true;

      return false;
    }

    case "♖":
    case "♜": {
      if (dr === 0)
        return boardPathClear(board, startRow, startCol, endRow, endCol);
      if (dc === 0)
        return boardPathClear(board, startRow, startCol, endRow, endCol);
      return false;
    }

    case "♘":
    case "♞":
      return (
        (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
        (Math.abs(dr) === 1 && Math.abs(dc) === 2)
      );

    case "♗":
    case "♝":
      return (
        Math.abs(dr) === Math.abs(dc) &&
        boardPathClear(board, startRow, startCol, endRow, endCol)
      );

    case "♔":
    case "♚":
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;

    default:
      return false;
  }
};

const isKingInCheck = (board, isWhite) => {
  const king = isWhite ? "♔" : "♚";
  const [kingRow, kingCol] = findKing(board, king);

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && isOpponentPiece(piece, isWhite)) {
        if (isValidMove(piece, i, j, kingRow, kingCol, !isWhite, board))
          return true;
      }
    }
  }
  return false;
};

const anyLegalMoveExists = (board, isWhite) => {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (!piece) continue;

      const isOwn =
        (isWhite && isWhitePiece(piece)) || (!isWhite && isBlackPiece(piece));
      if (!isOwn) continue;

      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          if (!isValidMove(piece, i, j, x, y, isWhite, board)) continue;

          const simulated = board.map((r) => [...r]);
          simulated[x][y] = piece;
          simulated[i][j] = null;

          if (!isKingInCheck(simulated, isWhite)) return true;
        }
      }
    }
  }
  return false;
};

const isCheckmate = (board, isWhite) => {
  if (!isKingInCheck(board, isWhite)) return false;
  return !anyLegalMoveExists(board, isWhite);
};

const isStalemate = (board, isWhite) => {
  if (isKingInCheck(board, isWhite)) return false;
  return !anyLegalMoveExists(board, isWhite);
};

/* =========================
   Component
   ========================= */

let globalBoard = initialBoard();

const FILES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const ChessBoard = () => {
  const [board, setBoard] = useState(initialBoard());
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState("white");
  const [lastMoved, setLastMoved] = useState("white");
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [gameMode, setGameMode] = useState("2P");
  const [gameStatus, setGameStatus] = useState(null); // null | "check" | "checkmate" | "stalemate"
  const [validMoves, setValidMoves] = useState([]);

  // Promotion modal state: { row, col, isWhite }
  const [promotion, setPromotion] = useState(null);

  // Mobile-only: themed game mode modal
  const [isMobileModeOpen, setIsMobileModeOpen] = useState(false);

  // Detect mobile via media query (keeps desktop/tablet native select)
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  }, []);

  useEffect(() => {
    globalBoard = board;
  }, [board]);

  const isGameOver = gameStatus === "checkmate" || gameStatus === "stalemate";

  const computeValidMoves = (row, col, piece, isWhiteTurn, boardState) => {
    const moves = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        if (!isValidMove(piece, row, col, x, y, isWhiteTurn, boardState))
          continue;

        const simulated = boardState.map((r) => [...r]);
        simulated[x][y] = piece;
        simulated[row][col] = null;

        if (!isKingInCheck(simulated, isWhiteTurn)) moves.push([x, y]);
      }
    }
    return moves;
  };

  const updateStatusForSideToMove = (boardState, sideToMoveIsWhite) => {
    const inCheck = isKingInCheck(boardState, sideToMoveIsWhite);
    const mate = isCheckmate(boardState, sideToMoveIsWhite);
    const stale = isStalemate(boardState, sideToMoveIsWhite);

    setGameStatus(
      mate ? "checkmate" : stale ? "stalemate" : inCheck ? "check" : null
    );
  };

  const applyPromotion = (choice) => {
    if (!promotion) return;

    const { row, col, isWhite } = promotion;
    const mapWhite = { Q: "♕", R: "♖", B: "♗", N: "♘" };
    const mapBlack = { Q: "♛", R: "♜", B: "♝", N: "♞" };

    const next = board.map((r) => [...r]);
    next[row][col] = isWhite ? mapWhite[choice] : mapBlack[choice];

    setBoard(next);
    setPromotion(null);

    const sideToMoveIsWhite = turn === "white";
    updateStatusForSideToMove(next, sideToMoveIsWhite);
  };

  /* =====================================================
     ✅ UPDATED: switch selection to another own piece
     ===================================================== */
  const handleSquareClick = (row, col) => {
    if (promotion || isGameOver) return;

    const piece = board[row][col];
    const isWhiteTurn = turn === "white";

    const isOwnPiece =
      piece &&
      ((isWhiteTurn && isWhitePiece(piece)) ||
        (!isWhiteTurn && isBlackPiece(piece)));

    // No selection yet
    if (!selected) {
      if (isOwnPiece) {
        setSelected({ row, col });
        setValidMoves(computeValidMoves(row, col, piece, isWhiteTurn, board));
      }
      return;
    }

    // ✅ Clicking another own piece switches selection immediately
    if (isOwnPiece) {
      // clicking same selected piece toggles off
      if (selected.row === row && selected.col === col) {
        setSelected(null);
        setValidMoves([]);
        return;
      }

      setSelected({ row, col });
      setValidMoves(computeValidMoves(row, col, piece, isWhiteTurn, board));
      return;
    }

    // Attempt to move selected piece
    const clickedPiece = board[selected.row][selected.col];
    const targetPiece = board[row][col];

    if (
      isValidMove(
        clickedPiece,
        selected.row,
        selected.col,
        row,
        col,
        isWhiteTurn,
        board
      )
    ) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = clickedPiece;
      newBoard[selected.row][selected.col] = null;

      // illegal if it leaves own king in check
      if (isKingInCheck(newBoard, isWhiteTurn)) {
        setSelected(null);
        setValidMoves([]);
        return;
      }

      // capture
      if (targetPiece) {
        isWhiteTurn
          ? setCapturedBlack((prev) => [...prev, targetPiece])
          : setCapturedWhite((prev) => [...prev, targetPiece]);
      }

      setBoard(newBoard);

      const isPromotionMove =
        (isWhiteTurn && clickedPiece === "♙" && row === 0) ||
        (!isWhiteTurn && clickedPiece === "♟" && row === 7);

      setSelected(null);
      setValidMoves([]);
      setLastMoved(turn);
      setTurn(isWhiteTurn ? "black" : "white");

      if (isPromotionMove) {
        setPromotion({ row, col, isWhite: isWhiteTurn });
        return;
      }

      updateStatusForSideToMove(newBoard, !isWhiteTurn);
    }
  };

  useEffect(() => {
    if (promotion || isGameOver) return;

    if (gameMode === "vsComputer" && turn === "black") {
      const timer = setTimeout(() => makeComputerMove(), 500);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, promotion, isGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const autoPromoteIfNeeded = (boardState, row, col, piece) => {
    if (piece === "♟" && row === 7) {
      const next = boardState.map((r) => [...r]);
      next[row][col] = "♛";
      return next;
    }
    return boardState;
  };

  const makeComputerMove = () => {
    const isWhite = false;
    const moves = [];

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && isBlackPiece(piece)) {
          for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
              if (!isValidMove(piece, i, j, x, y, isWhite, board)) continue;

              const simulated = board.map((r) => [...r]);
              simulated[x][y] = piece;
              simulated[i][j] = null;

              if (!isKingInCheck(simulated, false)) {
                moves.push({
                  from: { row: i, col: j },
                  to: { row: x, col: y },
                });
              }
            }
          }
        }
      }
    }

    if (moves.length === 0) {
      const blackInCheck = isKingInCheck(board, false);
      setGameStatus(blackInCheck ? "checkmate" : "stalemate");
      return;
    }

    const move = moves[Math.floor(Math.random() * moves.length)];
    const newBoard = board.map((r) => [...r]);
    const movingPiece = board[move.from.row][move.from.col];
    const target = board[move.to.row][move.to.col];

    if (target) setCapturedWhite((prev) => [...prev, target]);

    newBoard[move.to.row][move.to.col] = movingPiece;
    newBoard[move.from.row][move.from.col] = null;

    const promotedBoard = autoPromoteIfNeeded(
      newBoard,
      move.to.row,
      move.to.col,
      movingPiece
    );

    setBoard(promotedBoard);
    setTurn("white");
    setLastMoved("black");
    updateStatusForSideToMove(promotedBoard, true);
  };

  const resetGame = () => {
    const fresh = initialBoard();
    setBoard(fresh);
    globalBoard = fresh;
    setCapturedWhite([]);
    setCapturedBlack([]);
    setTurn("white");
    setSelected(null);
    setValidMoves([]);
    setGameStatus(null);
    setPromotion(null);
    setLastMoved("white");
    setIsMobileModeOpen(false);
  };

  const canOpenMode = !(promotion || isGameOver);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900 text-white p-6">
      {/* Captured Black Pieces - Top */}
      <div className="captured-pieces captured-top flex flex-row justify-start space-x-2 mb-4 w-full max-w-5xl px-4">
        {capturedBlack.map((p, idx) => (
          <div key={idx} className="captured-piece">
            <img src={getPieceImage(p)} alt={p} className="captured-piece-image" />
          </div>
        ))}
      </div>

      {/* Game Layout */}
      <div className="game-layout flex gap-10 items-start">
        {/* Chessboard + Coordinates */}
        <div className="board-wrapper">
          {/* left numbers 8 -> 1 */}
          <div className="board-ranks">
            {RANKS.map((n) => (
              <div key={n} className="rank-label">{n}</div>
            ))}
          </div>

          {/* board */}
          <div className="chessboard">
            {board.map((rowArr, i) =>
              rowArr.map((piece, j) => {
                const isLight = (i + j) % 2 === 0;
                const isSelected =
                  selected && selected.row === i && selected.col === j;
                const isValidMoveSquare = validMoves.some(
                  ([r, c]) => r === i && c === j
                );

                return (
                  <div
                    key={`${i}-${j}`}
                    className={`square ${isLight ? "light" : "dark"} ${
                      isSelected ? "selected" : ""
                    } ${isValidMoveSquare ? "highlight" : ""}`}
                    onClick={() => handleSquareClick(i, j)}
                  >
                    {piece && (
                      <img
                        src={getPieceImage(piece)}
                        alt={piece}
                        className="piece-image"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* bottom letters A -> H */}
          <div className="board-files">
            {FILES.map((l) => (
              <div key={l} className="file-label">{l}</div>
            ))}
          </div>
        </div>

        {/* Captured White (MOBILE ONLY) */}
        <div className="captured-pieces captured-bottom-mobile flex flex-row justify-center space-x-2 mt-4 w-full max-w-5xl px-4">
          {capturedWhite.map((p, idx) => (
            <div key={idx} className="captured-piece">
              <img src={getPieceImage(p)} alt={p} className="captured-piece-image" />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="game-mode-container">
            <div className="game-mode-label">Game Mode: Select</div>

            {!isMobile && (
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="game-mode-dropdown"
                disabled={!canOpenMode}
              >
                <option value="2P">2 Players</option>
                <option value="vsComputer">Play vs Computer</option>
              </select>
            )}

            {isMobile && (
              <button
                type="button"
                className="game-mode-dropdown game-mode-mobile-btn"
                onClick={() => canOpenMode && setIsMobileModeOpen(true)}
                disabled={!canOpenMode}
              >
                <span className="game-mode-mobile-text">
                  {gameMode === "2P" ? "2 Players" : "Play vs Computer"}
                </span>
                <span className="game-mode-mobile-arrow" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="turn-indicator">Turn: {turn}</div>

          <button onClick={resetGame} className="reset-button">
            Reset Game
          </button>

          {gameStatus === "checkmate" && (
            <div className="banner banner-checkmate">
              ♟️ Checkmate! {lastMoved === "white" ? "White" : "Black"} wins!
            </div>
          )}

          {gameStatus === "stalemate" && (
            <div className="banner banner-stalemate">🤝 Stalemate! It’s a draw.</div>
          )}

          {gameStatus === "check" && (
            <div className="banner banner-check">
              ⚠️ {turn === "white" ? "White" : "Black"} is in check!
            </div>
          )}
        </div>
      </div>

      {/* Captured White (DESKTOP ONLY) */}
      <div className="captured-pieces captured-bottom-desktop flex flex-row justify-end space-x-2 mt-4 w-full max-w-5xl px-4">
        {capturedWhite.map((p, idx) => (
          <div key={idx} className="captured-piece">
            <img src={getPieceImage(p)} alt={p} className="captured-piece-image" />
          </div>
        ))}
      </div>

      {/* Promotion Modal */}
      {promotion && (
        <div className="promo-overlay" onClick={() => setPromotion(null)}>
          <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="promo-title">Promote pawn to</div>

            <div className="promo-grid">
              {["Q", "R", "B", "N"].map((c) => (
                <button key={c} className="promo-btn" onClick={() => applyPromotion(c)}>
                  {c}
                </button>
              ))}
            </div>

            <button className="promo-cancel" onClick={() => setPromotion(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mobile Game Mode Modal (themed) */}
      {isMobile && isMobileModeOpen && (
        <div className="mode-overlay" onClick={() => setIsMobileModeOpen(false)}>
          <div className="mode-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mode-title">Select Game Mode</div>

            <div className="mode-list">
              <button
                className={`mode-item ${gameMode === "2P" ? "active" : ""}`}
                onClick={() => {
                  setGameMode("2P");
                  setIsMobileModeOpen(false);
                }}
              >
                <span>2 Players</span>
                {gameMode === "2P" && <span className="mode-check">✓</span>}
              </button>

              <button
                className={`mode-item ${gameMode === "vsComputer" ? "active" : ""}`}
                onClick={() => {
                  setGameMode("vsComputer");
                  setIsMobileModeOpen(false);
                }}
              >
                <span>Play vs Computer</span>
                {gameMode === "vsComputer" && <span className="mode-check">✓</span>}
              </button>
            </div>

            <button className="mode-cancel" onClick={() => setIsMobileModeOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
