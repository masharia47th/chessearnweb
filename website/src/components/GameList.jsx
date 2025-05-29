import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { getOpenGames, joinGame } from '../services/gameService';
import './GameList.css';

function GameList() {
  const { authFetch, user } = useAuth();
  const { setActiveGame } = useGame();
  const [openGames, setOpenGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Fetch open games
  const fetchOpenGames = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await getOpenGames(authFetch);
      setOpenGames(response.games || []);
    } catch (err) {
      setMessage(err.message || 'Failed to fetch open games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenGames();
    // Optionally poll for new games
    const interval = setInterval(fetchOpenGames, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [authFetch]);

  // Handle joining a game
  const handleJoinGame = async (gameId) => {
    setMessage('');
    try {
      const response = await joinGame(authFetch, gameId);
      setActiveGame(response.game);
      navigate(`/game/${gameId}`);
    } catch (err) {
      setMessage(err.message || 'Failed to join game');
    }
  };

  return (
    <div className="game-list-container">
      <h3>Open Games</h3>
      {loading && <div>Loading open games...</div>}
      {message && <div className="game-list-message">{message}</div>}
      {!loading && openGames.length === 0 && <div>No open games available.</div>}
      {!loading && openGames.length > 0 && (
        <div className="game-list-table">
          <table>
            <thead>
              <tr>
                <th>Creator</th>
                <th>Time Control</th>
                <th>Rated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {openGames.map((game) => (
                <tr key={game.id}>
                  <td>{game.white_player}</td>
                  <td>
                    {game.base_time / 60}+{game.increment}
                  </td>
                  <td>{game.is_rated ? 'Yes' : 'No'}</td>
                  <td>
                    <button
                      className="join-game-button"
                      onClick={() => handleJoinGame(game.id)}
                      disabled={game.white_player_id === user?.id}
                    >
                      Join
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GameList;