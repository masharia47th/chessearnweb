Chess Earn Gaming Flow for Frontend Designers
This document outlines the gaming flow for the Chess Earn app, detailing how players create, join, and play chess matches, manage time controls, resign, offer/accept draws, and how spectators view games. It covers the API endpoints (HTTP) and WebSocket events (real-time) that the frontend needs to interact with, including example payloads and responses. All interactions require a JWT token obtained from the /auth/login endpoint.
Base URL

API: https://api.chessearn.com
WebSocket: wss://api.chessearn.com (SocketIO endpoint)

Authentication
All requests and WebSocket connections require a JWT token in the Authorization: Bearer <JWT_TOKEN> header for HTTP or as auth: { token: "<JWT_TOKEN>" } for WebSocket. Obtain the token via:
curl -X POST https://api.chessearn.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "user1", "password": "password"}'

Response:
{
  "message": "Login successful",
  "access_token": "<JWT_TOKEN>",
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}

Game Data Structure
The game object is returned in API responses and WebSocket events, representing a chess match:
{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
  "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
  "white_player": "user1",
  "black_player": "user2",
  "status": "active", // "pending", "active", "completed"
  "outcome": "incomplete", // "white_win", "black_win", "draw", "incomplete"
  "is_rated": true,
  "moves": "e4 e5 Nf3 Nc6",
  "base_time": 300, // seconds (e.g., 5 minutes)
  "increment": 0, // seconds per move
  "white_time_remaining": 295.0, // seconds
  "black_time_remaining": 298.0, // seconds
  "draw_offered_by": null, // user_id or null
  "start_time": "2025-05-27T07:56:00.000000",
  "end_time": null, // or ISO timestamp
  "created_at": "2025-05-27T07:56:00.000000"
}

Gaming Flow
1. Create a Match
Action: A logged-in user creates a new match (open or against a specific opponent) with time controls.

API Endpoint: POST /game/create
Payload:{
  "is_rated": true, // optional, default true
  "opponent_id": "789abcde-f012-3456-789a-bcde12345678", // optional, null for open match
  "base_time": 600, // seconds, default 300 (5 min)
  "increment": 5 // seconds, default 0
}


Request:curl -X POST https://api.chessearn.com/game/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_rated": false, "opponent_id": "789abcde-f012-3456-789a-bcde12345678", "base_time": 600, "increment": 5}'


Response (201):{
  "message": "Match created",
  "game": { /* game object */ }
}


Errors:
400: Invalid time controls (base_time <= 0 or increment < 0).
404: Opponent not found.
401: Missing/invalid JWT.


UI:
Show a form with options for rated/unrated, opponent selection (or open match), and time controls (e.g., dropdown for 5+0, 10+5).
Display the created match with game ID and status (pending or active).



2. Join a Match
Action: A user joins an open match as the black player.

API Endpoint: POST /game/join/<game_id>
Request:curl -X POST https://api.chessearn.com/game/join/abcdef12-3456-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"


Response (200):{
  "message": "Joined match",
  "game": { /* game object, status: "active", black_time_remaining set */ }
}


Errors:
404: Game not found.
400: Game not open or user is the white player.
401: Missing/invalid JWT.


UI:
List open matches (GET /game/history?include_active=true to fetch active/pending games).
Show a “Join” button for pending matches.
Transition to the game board once joined.



3. Connect to WebSocket
Action: Players and spectators connect to the WebSocket for real-time updates.

WebSocket: wss://api.chessearn.com (SocketIO)
Client Setup (JavaScript with socket.io-client):import io from 'socket.io-client';
const socket = io('https://api.chessearn.com', {
    auth: { token: '<JWT_TOKEN>' }
});
socket.on('connect', () => console.log('Connected'));
socket.on('error', (data) => console.log('Error:', data.message));


Behavior:
Players are automatically joined to rooms for their active games (based on game.id).
Spectators must emit a spectate event (see below).


UI:
Establish the WebSocket connection on app load or game start.
Show a “Connecting…” indicator until connect is received.



4. Make a Move
Action: A player makes a move, updating the board and time controls.

WebSocket Event: make_move
Payload:socket.emit('make_move', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890',
    move_san: 'e4', // Standard algebraic notation
    move_time: Date.now() / 1000 // Timestamp in seconds
});


Response Events:
game_update: Broadcast to players/spectators in the game room.{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "moves": "e4",
  "fen": "rnbqkbnr/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
  "white_time_remaining": 295.0,
  "black_time_remaining": 300.0,
  /* other game fields */
}


game_end (if game over, e.g., checkmate, time-out):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "outcome": "white_win",
  "white_time_remaining": 180.0,
  "black_time_remaining": 0.0
}


error (if invalid):{ "message": "Not your turn" }




Time Controls:
Deducts time used since the last move from the player’s clock (white_time_remaining or black_time_remaining).
Adds increment (e.g., 5 seconds) after the move.
If time reaches 0, the game ends (opponent wins).


UI:
Display a chess board (e.g., using Chess.js/Chessboard.js).
Update board position and timers on game_update.
Show a “Game Over” modal on game_end with the outcome.
Disable move input if it’s not the user’s turn or if unauthorized.



5. Resign
Action: A player resigns, ending the game with the opponent as the winner.

WebSocket Event: resign
Payload:socket.emit('resign', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});


Response Events:
game_update: Updated game state (status: completed).
game_end: Outcome (e.g., black_win if white resigns).
error (if invalid):{ "message": "Game is not active" }




UI:
Add a “Resign” button on the game screen (visible only to players).
Confirm resignation (e.g., “Are you sure?” modal).
Show game-over screen on game_end.



6. Offer and Accept/Decline Draw
Action: A player offers a draw; the opponent accepts or declines.

WebSocket Events:
offer_draw:socket.emit('offer_draw', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});


Response: draw_offered (broadcast):{ "game_id": "abcdef12-3456-7890-abcd-ef1234567890", "offered_by": "123e4567-e89b-12d3-a456-426614174000" }


Error: { "message": "Draw already offered" }


accept_draw:socket.emit('accept_draw', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});


Response: game_update and game_end (outcome: draw).
Error: { "message": "No draw offer exists" }


decline_draw:socket.emit('decline_draw', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});


Response: draw_declined (broadcast):{ "game_id": "abcdef12-3456-7890-abcd-ef1234567890", "declined_by": "789abcde-f012-3456-789a-bcde12345678" }


Error: { "message": "No draw offer exists" }




UI:
Add an “Offer Draw” button for players.
On draw_offered, show a notification to the opponent (e.g., “user1 offered a draw”) with “Accept” and “Decline” buttons.
Update the board state on accept_draw (game ends) or clear the offer on decline_draw.



7. Spectate a Game
Action: A logged-in user watches an active game without interacting.

WebSocket Event: spectate
Payload:socket.emit('spectate', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});


Response Events:
game_update: Current game state (board, moves, times).
Receives future game_update, game_end, draw_offered, draw_declined events for the game room.
error:{ "message": "Game is not active" }




UI:
List active games (GET /game/history?include_active=true).
Show a “Spectate” button for active games.
Display the board in read-only mode, updating on game_update.
Show timers and draw offer notifications.



8. View Game History
Action: Users view completed games (all or for a specific user).

API Endpoint: GET /game/history
Query Params:
user_id (optional): Filter by user.
page (default: 1): Pagination page.
per_page (default: 20): Items per page.
include_active (optional): Include active games (for spectating).


Request:curl -X GET https://api.chessearn.com/game/history?page=1&per_page=2 \
  -H "Authorization: Bearer <JWT_TOKEN>"


Response (200):{
  "message": "Game history retrieved",
  "games": [ /* array of game objects */ ]
}


Errors:
404: User not found.
401: Missing/invalid JWT.


UI:
Show a history page with paginated game lists.
Allow filtering by user (e.g., dropdown or search).
Display game details (players, outcome, moves, time remaining).



9. View Specific Game
Action: Players view details of a game they’re in (active or completed).

API Endpoint: GET /game/<game_id>
Request:curl -X GET https://api.chessearn.com/game/abcdef12-3456-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>"


Response (200):{
  "message": "Game retrieved",
  "game": { /* game object */ }
}


Errors:
404: Game not found.
403: User not a player in the game.
401: Missing/invalid JWT.


UI:
Link to game details from history or active games.
Show board state, moves, and timers (read-only for completed games).



UI Considerations

Chess Board: Use libraries like Chess.js and Chessboard.js for board rendering and move validation.
Timers: Display countdown timers for each player, updating on game_update. Format as MM:SS (e.g., 05:00).
Notifications: Show real-time alerts for draw offers, game end, errors.
Game List: Create a lobby page listing open matches (pending) and active games for joining/spectating.
Responsive Design: Ensure the board and controls work on mobile and desktop.
Error Handling: Display user-friendly error messages (e.g., “Invalid move” or “Game not found”).

Rate Limits

POST /game/create, POST /game/join/<game_id>: 5 requests/minute.
GET /game/history, GET /game/<game_id>: 10 requests/minute.
Exceeding limits returns 429 Too Many Requests.

Notes

Time Controls: base_time is the initial time per player (seconds); increment is added per move. Update timers in real time via game_update.
Spectators: Can view active games but can’t interact (moves, resign, draw offers).
JWT: Refresh tokens if expired (401 Unauthorized) by calling /auth/refresh.
WebSocket: Ensure persistent connection; reconnect automatically if disconnected.

This flow should guide the frontend team in building a seamless chess experience. For questions, contact the backend team!
