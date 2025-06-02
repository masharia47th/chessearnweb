# ChessEarn Backend Integration Guide (for Frontend Devs)

---

## 1. 🔐 Auth & Login

### **POST /auth/login**
```json
// Request body
{
  "identifier": "user@email.com | username | phone_number",
  "password": "password123"
}
```
**Success Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "2ab3d1e0-1234-4f5c-9999-abc123ef4567",
    "username": "chessplayer1",
    "email": "user@email.com"
    // ...other fields
  },
  "access_token": "JWT_ACCESS_TOKEN",
  "refresh_token": "JWT_REFRESH_TOKEN"
}
```
**Store `access_token` for all HTTP and Socket.IO requests!**

---

## 2. ⚡ Socket.IO Connection

**Do NOT use raw WebSocket (ws://...)! Use Socket.IO client.**

### React Example
```javascript
import { io } from "socket.io-client";
const socket = io("https://chessearn.com", {
  auth: { token: "<JWT_ACCESS_TOKEN>" }
});
socket.on("connect", () => console.log("Socket connected"));
socket.on("game_update", data => console.log(data));
```

### Flutter Example
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
final socket = IO.io('https://chessearn.com', <String, dynamic>{
  'transports': ['websocket'],
  'auth': {'token': '<JWT_ACCESS_TOKEN>'}
});
socket.connect();
socket.on('connect', (_) => print('Connected!'));
socket.on('game_update', (data) => print(data));
```

---

## 3. 🎮 Game Lifecycle & Endpoints

### A. Create Game
```bash
POST /game/create
{
  "is_rated": true,
  "base_time": 300,
  "increment": 5,
  "bet_amount": 10.0
}
```
**Success:**
```json
{
  "message": "Match created",
  "game": { ...see "Game Object Example" below... }
}
```

---

### B. See All Your Games (Active or Pending)
```bash
GET /game/my_games
```
**Success:**
```json
{
  "message": "2 active or pending game(s) found",
  "games": [ { ...game object... }, ... ]
}
```

---

### C. Join Game
```bash
POST /game/join/<game_id>
```
**Success:** Same as create.

---

### D. Make Move
```bash
POST /game/move/<game_id>
{
  "move": "e4"
}
```
**Success:**
```json
{
  "message": "Move made",
  "game": { ...game object... },
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
}
```

---

### E. Resign, Draw, Cancel, etc.
- Resign: `POST /game/resign/<game_id>`
- Cancel: `POST /game/cancel/<game_id>`
- Offer Draw: `POST /game/draw/offer/<game_id>`
- Accept Draw: `POST /game/draw/accept/<game_id>`
- Decline Draw: `POST /game/draw/decline/<game_id>`

**All return updated game objects and messages.**

---

## 4. ⚡ Socket.IO Events (In-Game)

**All emits and responses are JSON.**

### Client → Server Emits

| Event           | Payload Example                        | Purpose                    |
|-----------------|---------------------------------------|----------------------------|
| make_move       | {"game_id": "...", "move_san": "e4"}  | Send a move                |
| resign          | {"game_id": "..."}                    | Resign from game           |
| offer_draw      | {"game_id": "..."}                    | Offer a draw               |
| accept_draw     | {"game_id": "..."}                    | Accept a draw offer        |
| decline_draw    | {"game_id": "..."}                    | Decline a draw offer       |
| cancel_game     | {"game_id": "..."}                    | Cancel game (if allowed)   |
| spectate        | {"game_id": "..."}                    | Watch a game               |

### Server → Client Emits

| Event         | Payload Example (see below)             | When?                      |
|---------------|-----------------------------------------|----------------------------|
| game_update   | {game object + fen}                    | On move, resign, draw, etc.|
| game_end      | {game_id, outcome, ...}                | When a game finishes       |
| game_cancelled| {game object}                          | If a game is cancelled     |
| draw_offered  | {"game_id": "...", "offered_by": "..."}| Draw offer sent            |
| draw_declined | {"game_id": "...", "declined_by": "..."}| Draw offer declined        |
| error         | {"message": "..."}                     | On errors                  |

---

### 💡 SAMPLE GAME OBJECT
```json
{
  "id": "a1b2c3d4-e5f6-7890-ghij-klmnopqrstuv",
  "white_player_id": "user-uuid-1",
  "black_player_id": "user-uuid-2",
  "white_player": "player1",
  "black_player": "player2",
  "status": "active",
  "outcome": "incomplete",
  "is_rated": true,
  "moves": "e4 e5 Nf3 Nc6",
  "base_time": 300,
  "increment": 5,
  "white_time_remaining": 250.1,
  "black_time_remaining": 290.0,
  "draw_offered_by": null,
  "start_time": "2025-06-02T08:20:00.000000",
  "end_time": null,
  "created_at": "2025-06-02T08:19:00.000000",
  "bet_amount": 10.0,
  "bet_locked": true,
  "platform_fee": 0.2,
  "white_bet_txn_id": "txn-uuid-1",
  "black_bet_txn_id": "txn-uuid-2",
  "payout_txn_id": null
}
```
**Note:**  
- `status`: "pending", "active", "completed", "cancelled"
- `outcome`: "white_win", "black_win", "draw", "incomplete", "cancelled"

---

## 5. 🧩 Game Flow Summary

1. **Login:** Get JWT.
2. **Create/Join Game:** Use `/game/create` or `/game/join/<id>`.
3. **List Games:** Use `/game/my_games` to see all your active games.
4. **Connect to Socket.IO** with JWT (`auth` payload).
5. **Select a Game:** Join its room, render board using `moves` or `fen`.
6. **Play Game:** Use socket events or REST for moves, resign, draw, etc.
7. **Update UI:** Listen for real-time events (`game_update`, `game_end`).
8. **Handle Multiple Games:** User can switch between games; keep all open in UI if needed.
9. **On Game End:** Show result and payout info.

---

## 6. 🏷️ Hints & Gotchas

- Always pass the `access_token` as a Bearer header (REST) and as `auth.token` (Socket.IO).
- Don't use raw WebSocket (`ws://`). Use the Socket.IO protocol/clients.
- Listen for `"error"` events for failures.
- Use the `fen` or `moves` from the game object to render the chessboard.
- Multi-game is supported: your UI should let users switch between games.
- If a game is cancelled or drawn, bets are refunded automatically.
- All times are UTC ISO format.

---

**Need more? Ping the backend team!**