Game API and WebSocket Curl Statements
This file provides example interactions with the Chess Earn game system, including REST API endpoints (/game/*) and WebSocket events for real-time gameplay. All requests require a JWT access token from POST /auth/login. REST scenarios use curl commands, while WebSocket scenarios include JavaScript (socket.io-client) and Flutter (socket_io_client) examples, as curl cannot test WebSocket connections.
Base URL

API: https://api.chessearn.com
WebSocket: wss://api.chessearn.com (SocketIO)

Authentication
All endpoints and WebSocket connections require a JWT access token:

REST: Authorization: Bearer <JWT_TOKEN> header.
WebSocket: 
JavaScript: auth: { token: "<JWT_TOKEN>" } in SocketIO connection.
Flutter: auth: {'token': '<JWT_TOKEN>'} in SocketIO connection.Obtain a token via:



curl -X POST https://api.chessearn.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "user1", "password": "password"}'

Response:
{
  "message": "Login successful",
  "access_token": "<JWT_TOKEN>",
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}

Example IDs

user1_id: 123e4567-e89b-12d3-a456-426614174000 (username: user1)
user2_id: 789abcde-f012-3456-789a-bcde12345678 (username: user2)
game1_id: abcdef12-3456-7890-abcd-ef1234567890

1. REST API Endpoints
1.1 POST /game/create
Create a new chess match (rated or unrated, with or without a specified opponent, with time controls).
Scenario 1: Create an open rated match with default time controls (5+0)
Request:
curl -X POST https://api.chessearn.com/game/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_rated": true}'

Expected Response (201):
{
  "message": "Match created",
  "game": {
    "id": "abcdef12-3456-7890-abcd-ef1234567890",
    "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
    "black_player_id": null,
    "white_player": "user1",
    "black_player": null,
    "status": "pending",
    "outcome": "incomplete",
    "is_rated": true,
    "moves": "",
    "base_time": 300,
    "increment": 0,
    "white_time_remaining": 300.0,
    "black_time_remaining": null,
    "draw_offered_by": null,
    "start_time": "2025-05-27T08:58:00.000000",
    "end_time": null,
    "created_at": "2025-05-27T08:58:00.000000"
  }
}

Scenario 2: Create a match with a specific opponent and 10+5 time control
Request:
curl -X POST https://api.chessearn.com/game/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_rated": false, "opponent_id": "789abcde-f012-3456-789a-bcde12345678", "base_time": 600, "increment": 5}'

Expected Response (201):
{
  "message": "Match created",
  "game": {
    "id": "abcdef12-3456-7890-abcd-ef1234567890",
    "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
    "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
    "white_player": "user1",
    "black_player": "user2",
    "status": "active",
    "outcome": "incomplete",
    "is_rated": false,
    "moves": "",
    "base_time": 600,
    "increment": 5,
    "white_time_remaining": 600.0,
    "black_time_remaining": 600.0,
    "draw_offered_by": null,
    "start_time": "2025-05-27T08:58:00.000000",
    "end_time": null,
    "created_at": "2025-05-27T08:58:00.000000"
  }
}

Scenario 3: Invalid time controls (negative base_time)
Request:
curl -X POST https://api.chessearn.com/game/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_rated": true, "base_time": -100, "increment": 0}'

Expected Response (400):
{ "message": "Invalid time controls" }

Scenario 4: Invalid opponent ID
Request:
curl -X POST https://api.chessearn.com/game/create \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"opponent_id": "invalid-uuid", "base_time": 300, "increment": 0}'

Expected Response (404):
{ "message": "Opponent not found" }

Scenario 5: Missing JWT access token
Request:
curl -X POST https://api.chessearn.com/game/create \
  -H "Content-Type: application/json" \
  -d '{"is_rated": true, "base_time": 300, "increment": 0}'

Expected Response (401):
{ "message": "Missing Authorization Header" }

1.2 POST /game/join/
Join an existing pending match as the black player.
Scenario 1: Successfully join a pending match
Request:
curl -X POST https://api.chessearn.com/game/join/abcdef12-3456-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"

Expected Response (200):
{
  "message": "Joined match",
  "game": {
    "id": "abcdef12-3456-7890-abcd-ef1234567890",
    "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
    "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
    "white_player": "user1",
    "black_player": "user2",
    "status": "active",
    "outcome": "incomplete",
    "is_rated": true,
    "moves": "",
    "base_time": 300,
    "increment": 0,
    "white_time_remaining": 300.0,
    "black_time_remaining": 300.0,
    "draw_offered_by": null,
    "start_time": "2025-05-27T08:58:00.000000",
    "end_time": null,
    "created_at": "2025-05-27T08:58:00.000000"
  }
}

Scenario 2: Game not found
Request:
curl -X POST https://api.chessearn.com/game/join/invalid-game-id \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"

Expected Response (404):
{ "message": "Game not found" }

Scenario 3: Try to join own game
Request (user1 tries to join their own game):
curl -X POST https://api.chessearn.com/game/join/abcdef12-3456-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"

Expected Response (400):
{ "message": "Cannot join your own game" }

Scenario 4: Game already active
Request:
curl -X POST https://api.chessearn.com/game/join/abcdef12-3456-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"

Expected Response (400):
{ "message": "Game is not open for joining" }

1.3 GET /game/history
Retrieve game history (all completed games or for a specific user), with pagination.
Scenario 1: Get all completed games (page 1)
Request:
curl -X GET https://api.chessearn.com/game/history?page=1&per_page=2 \
  -H "Authorization: Bearer <JWT_TOKEN>"

Expected Response (200):
{
  "message": "Game history retrieved",
  "games": [
    {
      "id": "abcdef12-3456-7890-abcd-ef1234567890",
      "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
      "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
      "white_player": "user1",
      "black_player": "user2",
      "status": "completed",
      "outcome": "white_win",
      "is_rated": true,
      "moves": "e4 e5 Nf3 Nc6",
      "base_time": 300,
      "increment": 0,
      "white_time_remaining": 180.0,
      "black_time_remaining": 150.0,
      "draw_offered_by": null,
      "start_time": "2025-05-27T08:58:00.000000",
      "end_time": "2025-05-27T09:10:00.000000",
      "created_at": "2025-05-27T08:58:00.000000"
    },
    {
      "id": "fedcba98-7654-3210-dcba-1234567890ab",
      "white_player_id": "other-user-id",
      "black_player_id": "another-user-id",
      "white_player": "user3",
      "black_player": "user4",
      "status": "completed",
      "outcome": "draw",
      "is_rated": false,
      "moves": "e4 e5",
      "base_time": 600,
      "increment": 5,
      "white_time_remaining": 300.0,
      "black_time_remaining": 310.0,
      "draw_offered_by": null,
      "start_time": "2025-05-27T08:00:00.000000",
      "end_time": "2025-05-27T08:10:00.000000",
      "created_at": "2025-05-27T08:00:00.000000"
    }
  ]
}

Scenario 2: Get games for a specific user
Request:
curl -X GET https://api.chessearn.com/game/history?user_id=123e4567-e89b-12d3-a456-426614174000&page=1 \
  -H "Authorization: Bearer <JWT_TOKEN>"

Expected Response (200):
{
  "message": "Game history retrieved",
  "games": [
    {
      "id": "abcdef12-3456-7890-abcd-ef1234567890",
      "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
      "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
      "white_player": "user1",
      "black_player": "user2",
      "status": "completed",
      "outcome": "white_win",
      "is_rated": true,
      "moves": "e4 e5 Nf3 Nc6",
      "base_time": 300,
      "increment": 0,
      "white_time_remaining": 180.0,
      "black_time_remaining": 150.0,
      "draw_offered_by": null,
      "start_time": "2025-05-27T08:58:00.000000",
      "end_time": "2025-05-27T09:10:00.000000",
      "created_at": "2025-05-27T08:58:00.000000"
    }
  ]
}

Scenario 3: Invalid user_id
Request:
curl -X GET https://api.chessearn.com/game/history?user_id=invalid-uuid \
  -H "Authorization: Bearer <JWT_TOKEN>"

Expected Response (404):
{ "message": "User not found" }

Scenario 4: Missing JWT access token
Request:
curl -X GET https://api.chessearn.com/game/history

Expected Response (401):
{ "message": "Missing Authorization Header" }

1.4 GET /game/
Retrieve details of a specific game (only for players involved).
Scenario 1: Successfully retrieve game as a player
Request:
curl -X GET https://api.chessearn.com/game/abcdef12-3456-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>"

Expected Response (200):
{
  "message": "Game retrieved",
  "game": {
    "id": "abcdef12-3456-7890-abcd-ef1234567890",
    "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
    "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
    "white_player": "user1",
    "black_player": "user2",
    "status": "active",
    "outcome": "incomplete",
    "is_rated": true,
    "moves": "e4 e5",
    "base_time": 300,
    "increment": 0,
    "white_time_remaining": 295.0,
    "black_time_remaining": 298.0,
    "draw_offered_by": null,
    "start_time": "2025-05-27T08:58:00.000000",
    "end_time": null,
    "created_at": "2025-05-27T08:58:00.000000"
  }
}

Scenario 2: Game not found
Request:
curl -X GET https://api.chessearn.com/game/invalid-game-id \
  -H "Authorization: Bearer <JWT_TOKEN>"

Expected Response (404):
{ "message": "Game not found" }

Scenario 3: Unauthorized user (not a player in the game)
Request:
curl -X GET https://api.chessearn.com/game/abcdef12-3456-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer <JWT_TOKEN>"  # Token for a user not in the game

Expected Response (403):
{ "message": "Unauthorized to view this game" }

2. WebSocket Events
WebSocket interactions use SocketIO for real-time gameplay (moves, resigning, draw offers, spectating). Below are examples in JavaScript (socket.io-client) for web and Flutter (socket_io_client) for mobile. Replace <JWT_TOKEN> with a valid token from /auth/login.
2.1 JavaScript (Web) Examples
Setup Client
import io from 'socket.io-client';

const socket = io('https://api.chessearn.com', {
    auth: { token: '<JWT_TOKEN>' }
});

socket.on('connect', () => {
    console.log('Connected to WebSocket');
});

socket.on('game_update', (data) => {
    console.log('Game state:', data); // { id, moves, fen, white_time_remaining, ... }
});

socket.on('game_end', (data) => {
    console.log('Game ended:', data); // { game_id, outcome, white_time_remaining, ... }
});

socket.on('draw_offered', (data) => {
    console.log('Draw offered by:', data.offered_by);
});

socket.on('draw_declined', (data) => {
    console.log('Draw declined by:', data.declined_by);
});

socket.on('error', (data) => {
    console.log('Error:', data.message);
});

2.1.1 Make a Move
Action: Player makes a move (e.g., e4), updating board and timers.Emit:
socket.emit('make_move', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890',
    move_san: 'e4',
    move_time: Date.now() / 1000
});

Expected Response:

game_update (broadcast):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
  "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
  "white_player": "user1",
  "black_player": "user2",
  "status": "active",
  "outcome": "incomplete",
  "is_rated": true,
  "moves": "e4",
  "base_time": 300,
  "increment": 0,
  "white_time_remaining": 295.0,
  "black_time_remaining": 300.0,
  "draw_offered_by": null,
  "fen": "rnbqkbnr/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
  "start_time": "2025-05-27T08:58:00.000000",
  "end_time": "2025-05-27T08:58:05.000000",
  "created_at": "2025-05-27T08:58:00.000000"
}


game_end (if game over, e.g., time-out):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "outcome": "black_win",
  "white_time_remaining": 0.0,
  "black_time_remaining": 150.0
}



Error:
socket.on('error', (data) => {
    console.log(data); // { message: "Not your turn" }
});

2.1.2 Resign
Action: Player resigns, ending the game with the opponent as winner.Emit:
socket.emit('resign', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});

Expected Response:

game_update (broadcast):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "status": "completed",
  "outcome": "black_win",
  "white_time_remaining": 295.0,
  "black_time_remaining": 298.0,
  /* other fields */
}


game_end (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "outcome": "black_win",
  "white_time_remaining": 295.0,
  "black_time_remaining": 298.0
}



Error:
socket.on('error', (data) => {
    console.log(data); // { message: "You are not a player in this game" }
});

2.1.3 Offer Draw
Action: Player offers a draw to the opponent.Emit:
socket.emit('offer_draw', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});

Expected Response:

draw_offered (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "offered_by": "123e4567-e89b-12d3-a456-426614174000"
}



Error:
socket.on('error', (data) => {
    console.log(data); // { message: "Draw already offered" }
});

2.1.4 Accept Draw
Action: Player accepts the opponent’s draw offer, ending the game.Emit:
socket.emit('accept_draw', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});

Expected Response:

game_update (broadcast):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "status": "completed",
  "outcome": "draw",
  "draw_offered_by": null,
  /* other fields */
}


game_end (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "outcome": "draw",
  "white_time_remaining": 290.0,
  "black_time_remaining": 295.0
}



Error:
socket.on('error', (data) => {
    console.log(data); // { message: "No draw offer exists" }
});

2.1.5 Decline Draw
Action: Player declines the opponent’s draw offer, continuing the game.Emit:
socket.emit('decline_draw', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});

Expected Response:

draw_declined (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "declined_by": "789abcde-f012-3456-789a-bcde12345678"
}



Error:
socket.on('error', (data) => {
    console.log(data); // { message: "No draw offer exists" }
});

2.1.6 Spectate a Game
Action: User spectates an active game, receiving real-time updates.Emit:
socket.emit('spectate', {
    game_id: 'abcdef12-3456-7890-abcd-ef1234567890'
});

Expected Response:

game_update (sent to spectator):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "status": "active",
  "moves": "e4 e5",
  "fen": "rnbqkbnr/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
  "white_time_remaining": 295.0,
  "black_time_remaining": 298.0,
  /* other fields */
}


Receives future game_update, game_end, draw_offered, draw_declined.Error:

socket.on('error', (data) => {
    console.log(data); // { message: "Game is not active" }
});

2.2 Flutter (Mobile) Examples
Setup Client
Add to pubspec.yaml:
dependencies:
  socket_io_client: ^2.0.3

Run flutter pub get. Below is a Dart example for connecting to the WebSocket and handling events (e.g., in a StatefulWidget).
import 'package:socket_io_client/socket_io_client.dart' as IO;

class GameSocket {
  late IO.Socket socket;

  void connect(String jwtToken) {
    socket = IO.io('https://api.chessearn.com', <String, dynamic>{
      'transports': ['websocket'],
      'auth': {'token': jwtToken},
    });

    socket.onConnect((_) {
      print('Connected to WebSocket');
    });

    socket.on('game_update', (data) {
      print('Game state: $data');
    });

    socket.on('game_end', (data) {
      print('Game ended: $data');
    });

    socket.on('draw_offered', (data) {
      print('Draw offered by: ${data['offered_by']}');
    });

    socket.on('draw_declined', (data) {
      print('Draw declined by: ${data['declined_by']}');
    });

    socket.on('error', (data) {
      print('Error: ${data['message']}');
    });

    socket.connect();
  }

  void disconnect() {
    socket.disconnect();
  }
}

// Usage in a Flutter widget
class GameScreen extends StatefulWidget {
  final String jwtToken;
  GameScreen({required this.jwtToken});

  @override
  _GameScreenState createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late GameSocket gameSocket;

  @override
  void initState() {
    super.initState();
    gameSocket = GameSocket();
    gameSocket.connect(widget.jwtToken);
  }

  @override
  void dispose() {
    gameSocket.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: Text('Chess Game')),
    );
  }
}

2.2.1 Make a Move
Action: Player makes a move (e.g., e4), updating board and timers.Emit:
socket.emit('make_move', {
  'game_id': 'abcdef12-3456-7890-abcd-ef1234567890',
  'move_san': 'e4',
  'move_time': DateTime.now().millisecondsSinceEpoch / 1000,
});

Expected Response:

game_update (broadcast):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "white_player_id": "123e4567-e89b-12d3-a456-426614174000",
  "black_player_id": "789abcde-f012-3456-789a-bcde12345678",
  "white_player": "user1",
  "black_player": "user2",
  "status": "active",
  "outcome": "incomplete",
  "is_rated": true,
  "moves": "e4",
  "base_time": 300,
  "increment": 0,
  "white_time_remaining": 295.0,
  "black_time_remaining": 300.0,
  "draw_offered_by": null,
  "fen": "rnbqkbnr/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
  "start_time": "2025-05-27T08:58:00.000000",
  "end_time": "2025-05-27T08:58:05.000000",
  "created_at": "2025-05-27T08:58:00.000000"
}


game_end (if game over, e.g., time-out):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "outcome": "black_win",
  "white_time_remaining": 0.0,
  "black_time_remaining": 150.0
}



Error:
socket.on('error', (data) => print('Error: ${data['message']}')); // "Not your turn"

2.2.2 Resign
Action: Player resigns, ending the game with the opponent as winner.Emit:
socket.emit('resign', {
  'game_id': 'abcdef12-3456-7890-abcd-ef1234567890',
});

Expected Response:

game_update (broadcast):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "status": "completed",
  "outcome": "black_win",
  "white_time_remaining": 295.0,
  "black_time_remaining": 298.0,
  /* other fields */
}


game_end (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "outcome": "black_win",
  "white_time_remaining": 295.0,
  "black_time_remaining": 298.0
}



Error:
socket.on('error', (data) => print('Error: ${data['message']}')); // "You are not a player in this game"

2.2.3 Offer Draw
Action: Player offers a draw to the opponent.Emit:
socket.emit('offer_draw', {
  'game_id': 'abcdef12-3456-7890-abcd-ef1234567890',
});

Expected Response:

draw_offered (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "offered_by": "123e4567-e89b-12d3-a456-426614174000"
}



Error:
socket.on('error', (data) => print('Error: ${data['message']}')); // "Draw already offered"

2.2.4 Accept Draw
Action: Player accepts the opponent’s draw offer, ending the game.Emit:
socket.emit('accept_draw', {
  'game_id': 'abcdef12-3456-7890-abcd-ef1234567890',
});

Expected Response:

game_update (broadcast):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "status": "completed",
  "outcome": "draw",
  "draw_offered_by": null,
  /* other fields */
}


game_end (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "outcome": "draw",
  "white_time_remaining": 290.0,
  "black_time_remaining": 295.0
}



Error:
socket.on('error', (data) => print('Error: ${data['message']}')); // "No draw offer exists"

2.2.5 Decline Draw
Action: Player declines the opponent’s draw offer, continuing the game.Emit:
socket.emit('decline_draw', {
  'game_id': 'abcdef12-3456-7890-abcd-ef1234567890',
});

Expected Response:

draw_declined (broadcast):{
  "game_id": "abcdef12-3456-7890-abcd-ef1234567890",
  "declined_by": "789abcde-f012-3456-789a-bcde12345678"
}



Error:
socket.on('error', (data) => print('Error: ${data['message']}')); // "No draw offer exists"

2.2.6 Spectate a Game
Action: User spectates an active game, receiving real-time updates.Emit:
socket.emit('spectate', {
  'game_id': 'abcdef12-3456-7890-abcd-ef1234567890',
});

Expected Response:

game_update (sent to spectator):{
  "id": "abcdef12-3456-7890-abcd-ef1234567890",
  "status": "active",
  "moves": "e4 e5",
  "fen": "rnbqkbnr/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
  "white_time_remaining": 295.0,
  "black_time_remaining": 298.0,
  /* other fields */
}


Receives future game_update, game_end, draw_offered, draw_declined.Error:

socket.on('error', (data) => print('Error: ${data['message']}')); // "Game is not active"

Notes

Time Controls: base_time (e.g., 300 seconds) is initial time per player; increment (e.g., 5 seconds) is added per move. Timers update in game_update.
Rate Limits:
POST /game/create, POST /game/join/<game_id>: 5/minute.
GET /game/history, GET /game/<game_id>: 10/minute.
Returns 429 Too Many Requests if exceeded.


WebSocket:
Ensure persistent connection; reconnect on disconnect.
JavaScript: CORS allows http://localhost:5173.
Flutter: Ensure backend CORS allows mobile origins (e.g., http://localhost:8080 for emulators).


Testing:
JavaScript: Use socket.io-client in Node.js or browser.
Flutter: Test in a Flutter app (emulator or device) after adding socket_io_client.
