from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from flask import request
from app.services.game import (
    make_move,
    resign_game,
    offer_draw,
    accept_draw,
    decline_draw,
    cancel_game,
)
from app.models.game import Game, GameStatus
from app import db
import chess
from functools import wraps

# Active user socket connections
connected_users = {}

socketio = SocketIO(
    cors_allowed_origins=[
        "https://chessearn.com",
        "http://41.90.179.124",
        "http://192.168.100.4:5173",
        "ws://192.168.100.4:5173",
    ]
)


def init_socketio(app):
    socketio.init_app(app, async_mode="eventlet")


# Auth middleware for socket events
def authenticated_socket(f):
    @wraps(f)
    def wrapper(data):
        user_id = connected_users.get(request.sid)
        if not user_id:
            emit("error", {"message": "Not authenticated"})
            return
        return f(user_id, data)

    return wrapper


@socketio.on("connect")
def handle_connect(auth):
    print("Socket connected!")
    if not auth or "token" not in auth:
        print("No auth token received!")
        return False
    try:
        decoded_token = decode_token(auth["token"])
        user_id = decoded_token["sub"]
        connected_users[request.sid] = user_id
        print(f"Authenticated user: {user_id}")

        games = Game.query.filter(
            (Game.white_player_id == user_id) | (Game.black_player_id == user_id),
            Game.status == GameStatus.ACTIVE,
        ).all()
        for game in games:
            join_room(game.id)
            print(f"Joined room for game {game.id}")
    except Exception as e:
        print(f"Socket auth failed: {e}")
        return False


@socketio.on("disconnect")
def handle_disconnect():
    user_id = connected_users.pop(request.sid, None)
    if user_id:
        games = Game.query.filter(
            (Game.white_player_id == user_id) | (Game.black_player_id == user_id),
            Game.status == GameStatus.ACTIVE,
        ).all()
        for game in games:
            leave_room(game.id)


@socketio.on("make_move")
@authenticated_socket
def handle_make_move(user_id, data):
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
@authenticated_socket
def handle_resign(user_id, data):
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


@socketio.on("cancel_game")
@authenticated_socket
def handle_cancel_game(user_id, data):
    game_id = data.get("game_id")
    if not game_id:
        emit("error", {"message": "Missing game_id"})
        return

    game, message, status = cancel_game(user_id, game_id)
    if not game:
        emit("error", {"message": message})
        return

    game_data = game.to_dict()
    emit("game_cancelled", game_data, room=game_id)


@socketio.on("offer_draw")
@authenticated_socket
def handle_offer_draw(user_id, data):
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
@authenticated_socket
def handle_accept_draw(user_id, data):
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
@authenticated_socket
def handle_decline_draw(user_id, data):
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
@authenticated_socket
def handle_spectate(user_id, data):
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
    if game.moves:
        for move in game.moves.split():
            board.push_san(move)
    game_data = game.to_dict()
    game_data["fen"] = board.fen()
    emit("game_update", game_data)
