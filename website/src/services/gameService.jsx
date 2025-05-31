const BASE_URL = 'http://192.168.100.4:4747';

export async function createGame(authFetch, gameData) {
  const response = await authFetch(`${BASE_URL}/game/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create game');
  }
  return response.json();
}

export async function joinGame(authFetch, gameId) {
  const response = await authFetch(`${BASE_URL}/game/join/${gameId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to join game');
  }
  return response.json();
}

export async function getGameHistory(authFetch, { userId, page = 1, perPage = 10 } = {}) {
  const query = new URLSearchParams({ page, per_page: perPage });
  if (userId) query.append('user_id', userId);
  const response = await authFetch(`${BASE_URL}/game/history?${query.toString()}`, {
    method: 'GET',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch game history');
  }
  return response.json();
}

export async function getGame(authFetch, gameId) {
  const response = await authFetch(`${BASE_URL}/game/${gameId}`, {
    method: 'GET',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch game');
  }
  return response.json();
}

export async function getOpenGames(authFetch) {
  const response = await authFetch(`${BASE_URL}/game/open`, {
    method: 'GET',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch open games');
  }
  return response.json();
}