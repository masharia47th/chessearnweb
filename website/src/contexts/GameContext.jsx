import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const GameContext = createContext();

const BASE_WS_URL = 'wss://api.chessearn.com';

export function GameProvider({ children }) {
  const { accessToken, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [spectatedGame, setSpectatedGame] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [gameError, setGameError] = useState(null);

  // Initialize WebSocket connection
  const connectSocket = useCallback(() => {
    if (!accessToken) {
      setConnectionStatus('disconnected');
      return;
    }

    const newSocket = io(BASE_WS_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      setGameError(null);
    });

    newSocket.on('connect_error', (err) => {
      setConnectionStatus('disconnected');
      setGameError(err.message || 'Failed to connect to game server');
      if (err.message.includes('401')) logout(); // Token invalid, force logout
    });

    newSocket.on('game_update', (data) => {
      if (data.id === currentGame?.id) {
        setCurrentGame(data);
      } else if (data.id === spectatedGame?.id) {
        setSpectatedGame(data);
      }
    });

    newSocket.on('game_end', (data) => {
      if (data.game_id === currentGame?.id) {
        setCurrentGame((prev) => ({ ...prev, ...data, status: 'completed' }));
      } else if (data.game_id === spectatedGame?.id) {
        setSpectatedGame((prev) => ({ ...prev, ...data, status: 'completed' }));
      }
    });

    newSocket.on('draw_offered', (data) => {
      if (data.game_id === currentGame?.id) {
        setCurrentGame((prev) => ({ ...prev, draw_offered_by: data.offered_by }));
      } else if (data.game_id === spectatedGame?.id) {
        setSpectatedGame((prev) => ({ ...prev, draw_offered_by: data.offered_by }));
      }
    });

    newSocket.on('draw_declined', (data) => {
      if (data.game_id === currentGame?.id) {
        setCurrentGame((prev) => ({ ...prev, draw_offered_by: null }));
      } else if (data.game_id === spectatedGame?.id) {
        setSpectatedGame((prev) => ({ ...prev, draw_offered_by: null }));
      }
    });

    newSocket.on('error', (data) => {
      setGameError(data.message || 'Game error occurred');
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [accessToken, logout]);

  // Connect on mount or token change, cleanup on unmount
  useEffect(() => {
    if (accessToken) {
      const cleanup = connectSocket();
      return cleanup;
    }
  }, [accessToken, connectSocket]);

  // WebSocket event emitters
  const makeMove = useCallback(
    (gameId, moveSan) => {
      if (!socket) return;
      socket.emit('make_move', {
        game_id: gameId,
        move_san: moveSan,
        move_time: Date.now() / 1000,
      });
    },
    [socket]
  );

  const resign = useCallback(
    (gameId) => {
      if (!socket) return;
      socket.emit('resign', { game_id: gameId });
    },
    [socket]
  );

  const offerDraw = useCallback(
    (gameId) => {
      if (!socket) return;
      socket.emit('offer_draw', { game_id: gameId });
    },
    [socket]
  );

  const acceptDraw = useCallback(
    (gameId) => {
      if (!socket) return;
      socket.emit('accept_draw', { game_id: gameId });
    },
    [socket]
  );

  const declineDraw = useCallback(
    (gameId) => {
      if (!socket) return;
      socket.emit('decline_draw', { game_id: gameId });
    },
    [socket]
  );

  const spectateGame = useCallback(
    (gameId) => {
      if (!socket) return;
      socket.emit('spectate', { game_id: gameId });
    },
    [socket]
  );

  // Start or join a game, update currentGame
  const setActiveGame = useCallback((gameData) => {
    setCurrentGame(gameData);
    setSpectatedGame(null); // Clear spectated game when playing
  }, []);

  // Spectate a game, update spectatedGame
  const setSpectatedGameState = useCallback((gameData) => {
    setSpectatedGame(gameData);
    setCurrentGame(null); // Clear active game when spectating
  }, []);

  return (
    <GameContext.Provider
      value={{
        currentGame,
        spectatedGame,
        connectionStatus,
        gameError,
        makeMove,
        resign,
        offerDraw,
        acceptDraw,
        declineDraw,
        spectateGame,
        setActiveGame,
        setSpectatedGame: setSpectatedGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}