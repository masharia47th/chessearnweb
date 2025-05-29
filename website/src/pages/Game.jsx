import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { getGame } from '../services/gameService';
import './Game.css';

// Format seconds to MM:SS
const formatTime = (seconds) => {
  if (typeof seconds !== 'number') return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const {
    currentGame,
    spectatedGame,
    connectionStatus,
    gameError,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    setActiveGame,
    setSpectatedGame,
  } = useGame();
  const [chess, setChess] = useState(new Chess());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch game data on mount
  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      try {
        const response = await getGame(authFetch, gameId);
        const gameData = response.game;
        if (
          gameData.white_player_id === user?.id ||
          gameData.black_player_id === user?.id
        ) {
          setActiveGame(gameData);
        } else {
          setSpectatedGame(gameData);
        }
        setChess(new Chess(gameData.fen || 'start'));
      } catch (err) {
        setMessage(err.message || 'Failed to load game');
        if (err.message.includes('Unauthorized')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId, authFetch, user, setActiveGame, setSpectatedGame, navigate]);

  // Update chessboard and timers on game state change
  useEffect(() => {
    if (currentGame?.fen) {
      setChess(new Chess(currentGame.fen));
    } else if (spectatedGame?.fen) {
      setChess(new Chess(spectatedGame.fen));
    }
  }, [currentGame, spectatedGame]);

  // Handle move
  const onDrop = (sourceSquare, targetSquare) => {
    if (!currentGame || currentGame.status !== 'active') return false;
    if (
      (chess.turn() === 'w' && currentGame.white_player_id !== user?.id) ||
      (chess.turn() === 'b' && currentGame.black_player_id !== user?.id)
    ) {
      setMessage('Not your turn!');
      return false;
    }

    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (move) {
        makeMove(gameId, move.san);
        return true;
      }
    } catch {
      setMessage('Invalid move');
      return false;
    }
    return false;
  };

  // Handle game actions
  const handleResign = () => {
    resign(gameId);
    setMessage('You resigned');
  };

  const handleOfferDraw = () => {
    offerDraw(gameId);
    setMessage('Draw offered');
  };

  const handleAcceptDraw = () => {
    acceptDraw(gameId);
    setMessage('Draw accepted');
  };

  const handleDeclineDraw = () => {
    declineDraw(gameId);
    setMessage('Draw declined');
  };

  // Determine if user is player or spectator
  const isPlayer =
    currentGame &&
    (currentGame.white_player_id === user?.id ||
      currentGame.black_player_id === user?.id);
  const gameState = isPlayer ? currentGame : spectatedGame;

  if (loading) return <div>Loading game...</div>;
  if (!gameState) return <div>No game data available</div>;

  return (
    <div className="game-container">
      <h2>Game: {gameState.id}</h2>
      <div className="game-timers">
        <div className="timer timer-white">
          White: {gameState.white_player} ({formatTime(gameState.white_time_remaining)})
        </div>
        <div className="timer timer-black">
          Black: {gameState.black_player || 'Waiting'} ({formatTime(gameState.black_time_remaining)})
        </div>
      </div>
      <div className="game-board">
        <Chessboard
          position={chess.fen()}
          onPieceDrop={isPlayer ? onDrop : () => false}
          boardOrientation={
            user?.id === gameState.white_player_id ? 'white' : 'black'
          }
        />
      </div>
      <div className="game-info">
        <p>Status: {gameState.status}</p>
        {gameState.draw_offered_by && (
          <p>Draw offered by: {gameState.draw_offered_by}</p>
        )}
        {connectionStatus !== 'connected' && (
          <p>WebSocket: {connectionStatus}</p>
        )}
        {gameError && <p className="game-error">{gameError}</p>}
        {message && <p className="game-message">{message}</p>}
      </div>
      {isPlayer && gameState.status === 'active' && (
        <div className="game-actions">
          <button onClick={handleResign}>Resign</button>
          <button onClick={handleOfferDraw}>Offer Draw</button>
          {gameState.draw_offered_by &&
            gameState.draw_offered_by !== user?.id && (
              <>
                <button onClick={handleAcceptDraw}>Accept Draw</button>
                <button onClick={handleDeclineDraw}>Decline Draw</button>
              </>
            )}
        </div>
      )}
    </div>
  );
}

export default Game;