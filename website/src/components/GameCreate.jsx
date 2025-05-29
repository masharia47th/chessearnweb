import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Changed from @react-router-dom
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext'; // Fixed path
import { createGame } from '../services/gameService'; // Fixed path
import './GameCreate.css';

function GameCreate() {
  const { authFetch } = useAuth();
  const { setActiveGame } = useGame();
  const [isRated, setIsRated] = useState(true);
  const [opponentId, setOpponentId] = useState('');
  const [baseTime, setBaseTime] = useState(300); // Default 5 minutes
  const [increment, setIncrement] = useState(0); // Default no increment
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const gameData = {
      is_rated: isRated,
      base_time: Number(baseTime),
      increment: Number(increment),
    };
    if (opponentId) gameData.opponent_id = opponentId;

    try {
      const response = await createGame(authFetch, gameData);
      setActiveGame(response.game); // Set the game in GameContext
      setMessage(response.message);
      navigate(`/game/${response.game.id}`); // Redirect to game page
    } catch (err) {
      setMessage(err.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="game-create-form" onSubmit={handleSubmit}>
      <h2>Create New Game</h2>
      <div>
        <label>
          Rated:
          <input
            type="checkbox"
            checked={isRated}
            onChange={(e) => setIsRated(e.target.checked)}
          />
        </label>
      </div>
      <div>
        <label>
          Opponent ID (optional):
          <input
            type="text"
            value={opponentId}
            onChange={(e) => setOpponentId(e.target.value)}
            placeholder="Enter opponent UUID"
          />
        </label>
      </div>
      <div>
        <label>
          Base Time (seconds):
          <input
            type="number"
            value={baseTime}
            onChange={(e) => setBaseTime(e.target.value)}
            min="60"
            step="60"
            required
          />
        </label>
      </div>
      <div>
        <label>
          Increment (seconds):
          <input
            type="number"
            value={increment}
            onChange={(e) => setIncrement(e.target.value)}
            min="0"
            step="1"
            required
          />
        </label>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Game'}
      </button>
      {message && <div className="game-message">{message}</div>}
    </form>
  );
}

export default GameCreate;