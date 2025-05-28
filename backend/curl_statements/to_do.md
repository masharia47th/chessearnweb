Plan for Adding Chat Feature
Database Model: Create a new Message model in app/models/game.py to store chat messages, linked to a Game via foreign key. This keeps the Game model unchanged.
WebSocket Events: Add send_message and receive_message events in app/routes/socket.py to handle real-time chat, broadcasting messages to players and spectators in the game room.
Update Documentation:
curl_statements/game.md: Add JavaScript and Flutter examples for chat WebSocket events.
gaming_flow.md: Update the gaming flow to include chat UI guidance for frontend designers.
Migration: Generate a Flask-Migrate migration for the Message model.
Testing: Include chat in the WebSocket test plan to verify functionality.
Scope: Focus on per-game chat (messages visible to players and spectators of a specific game). Global or private chat can be added later if needed.
Assumptions
Chat Scope: Messages are tied to a game (stored in the database) and visible to players and spectators in real time.
Storage: Persist messages for game history (e.g., viewable in GET /game/<game_id>).
Security: JWT authentication ensures only authenticated users can send messages, and only game participants/spectators can view them.
CORS: The updated cors_allowed_origins in app/routes/socket.py supports Flutter clients.
Dependencies: No new packages needed; Flask-SocketIO and SQLAlchemy suffice.
Migration: You’ve run flask db upgrade for draw_offered_by, and we’ll generate a new migration for Message.