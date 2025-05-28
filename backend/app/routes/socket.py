from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from flask import request
from app.services.game import (
    make_move,
    resign_game,
    offer_draw,
    accept_draw,
    decline_draw,
)
from app.models.game import Game, GameStatus
from app import db
import chess

socketio = SocketIO(
    cors_allowed_origins=[
        "https://chessearn.com",
        "http://41.90.179.124",  # Android emulator localhost alias
    ]
)


def init_socketio(app):
    socketio.init_app(app, async_mode="eventlet")


@socketio.on("connect")
def handle_connect(auth):
    """
    Handle WebSocket connection, authenticate with JWT.
    """
    if not auth or "token" not in auth:
        return False
    try:
        decoded_token = decode_token(auth["token"])
        user_id = decoded_token["sub"]
        request.sid_user_id = user_id
        # Join rooms for all active games the user is playing
        games = Game.query.filter(
            (Game.white_player_id == user_id) | (Game.black_player_id == user_id),
            Game.status == GameStatus.ACTIVE,
        ).all()
        for game in games:
            join_room(game.id)
    except Exception:
        return False


@socketio.on("disconnect")
def handle_disconnect():
    """
    Handle WebSocket disconnection, leave game rooms.
    """
    user_id = getattr(request, "sid_user_id", None)
    if user_id:
        games = Game.query.filter(
            (Game.white_player_id == user_id) | (Game.black_player_id == user_id),
            Game.status == GameStatus.ACTIVE,
        ).all()
        for game in games:
            leave_room(game.id)


@socketio.on("make_move")
def handle_make_move(data):
    """
    Handle a move, update game state, and broadcast to players/spectators.
    """
    user_id = getattr(request, "sid_user_id", None)
    if not user_id:
        emit("error", {"message": "Not authenticated"})
        return

    game_id = data.get("game_id")
    move_san = data.get("move_san")
    move_time = data.get("move_time")

    if not game_id or not move_san:
        emit("error", {"message": "Missing game_id or move_san"})
        return

    game, fen, status = make_move(user_id, game_id, move_san, move_time)
    if not game:
        emit("error", {"message": fen})
        return

    game_data = game.to_dict()
    game_data["fen"] = fen
    emit("game_update", game_data, room=game_id)

    if game.status == GameStatus.COMPLETED:
        emit(
            "game_end",
            {
                "game_id": game.id,
                "outcome": game.outcome.value,
                "white_time_remaining": game.white_time_remaining,
                "black_time_remaining": game.black_time_remaining,
            },
            room=game_id,
        )


@socketio.on("resign")
def handle_resign(data):
    """
    Handle a player resigning the game.
    """
    user_id = getattr(request, "sid_user_id", None)
    if not user_id:
        emit("error", {"message": "Not authenticated"})
        return

    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Missing game_id"})
        return

    game, message, status = resign_game(user_id, game_id)
    if not game:
        emit("error", {"message": message})
        return

    game_data = game.to_dict()
    emit("game_update", game_data, room=game_id)
    emit(
        "game_end",
        {
            "game_id": game.id,
            "outcome": game.outcome.value,
            "white_time_remaining": game.white_time_remaining,
            "black_time_remaining": game.black_time_remaining,
        },
        room=game_id,
    )


@socketio.on("offer_draw")
def handle_offer_draw(data):
    """
    Handle a player offering a draw.
    """
    user_id = getattr(request, "sid_user_id", None)
    if not user_id:
        emit("error", {"message": "Not authenticated"})
        return

    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Missing game_id"})
        return

    game, message, status = offer_draw(user_id, game_id)
    if not game:
        emit("error", {"message": message})
        return

    emit("draw_offered", {"game_id": game.id, "offered_by": user_id}, room=game_id)


@socketio.on("accept_draw")
def handle_accept_draw(data):
    """
    Handle a player accepting a draw offer.
    """
    user_id = getattr(request, "sid_user_id", None)
    if not user_id:
        emit("error", {"message": "Not authenticated"})
        return

    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Missing game_id"})
        return

    game, message, status = accept_draw(user_id, game_id)
    if not game:
        emit("error", {"message": message})
        return

    game_data = game.to_dict()
    emit("game_update", game_data, room=game_id)
    emit(
        "game_end",
        {
            "game_id": game.id,
            "outcome": game.outcome.value,
            "white_time_remaining": game.white_time_remaining,
            "black_time_remaining": game.black_time_remaining,
        },
        room=game_id,
    )


@socketio.on("decline_draw")
def handle_decline_draw(data):
    """
    Handle a player declining a draw offer.
    """
    user_id = getattr(request, "sid_user_id", None)
    if not user_id:
        emit("error", {"message": "Not authenticated"})
        return

    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Missing game_id"})
        return

    game, message, status = decline_draw(user_id, game_id)
    if not game:
        emit("error", {"message": message})
        return

    emit("draw_declined", {"game_id": game.id, "declined_by": user_id}, room=game_id)


@socketio.on("spectate")
def handle_spectate(data):
    """
    Allow a user to spectate a game.
    """
    user_id = getattr(request, "sid_user_id", None)
    if not user_id:
        emit("error", {"message": "Not authenticated"})
        return

    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Missing game_id"})
        return

    game = Game.query.get(game_id)
    if not game:
        emit("error", {"message": "Game not found"})
        return
    if game.status != GameStatus.ACTIVE:
        emit("error", {"message": "Game is not active"})
        return

    join_room(game_id)
    # Send current game state to the spectator
    board = chess.Board()
    for move in game.moves.split():
        board.push_san(move)
    game_data = game.to_dict()
    game_data["fen"] = board.fen()
    emit("game_update", game_data)
