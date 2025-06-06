from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.services.game import (
    create_match,
    join_match,
    get_games,
    make_move,
    resign_game,
    cancel_game,
    offer_draw,
    accept_draw,
    decline_draw,
)
from app.models.game import Game, GameStatus

game_bp = Blueprint("game", __name__)
limiter = Limiter(key_func=get_remote_address)


@game_bp.route("/create", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
def create_match_route():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    is_rated = data.get("is_rated", True)
    base_time = data.get("base_time", 300)
    increment = data.get("increment", 0)
    bet_amount = data.get("bet_amount", 0.0)

    # Only self-created games supported for now (no direct challenge)
    game, message, status = create_match(
        user_id, is_rated, base_time, increment, bet_amount
    )
    if not game:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "game": game.to_dict()}), status


@game_bp.route("/join/<game_id>", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
def join_match_route(game_id):
    user_id = get_jwt_identity()
    game, message, status = join_match(user_id, game_id)
    if not game:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "game": game.to_dict()}), status


@game_bp.route("/move/<game_id>", methods=["POST"])
@limiter.limit("20 per minute")
@jwt_required()
def make_move_route(game_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    move_san = data.get("move")
    move_time = data.get("move_time")  # Optional: sent by client for sync

    if not move_san:
        return jsonify({"message": "Move is required"}), 400

    game, fen, status = make_move(user_id, game_id, move_san, move_time)
    if not game:
        return jsonify({"message": fen}), status
    return jsonify({"message": "Move made", "game": game.to_dict(), "fen": fen}), 200


@game_bp.route("/resign/<game_id>", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
def resign_game_route(game_id):
    user_id = get_jwt_identity()
    game, message, status = resign_game(user_id, game_id)
    if not game:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "game": game.to_dict()}), status


@game_bp.route("/cancel/<game_id>", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
def cancel_game_route(game_id):
    user_id = get_jwt_identity()
    game, message, status = cancel_game(user_id, game_id)
    if not game:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "game": game.to_dict()}), status


@game_bp.route("/draw/offer/<game_id>", methods=["POST"])
@limiter.limit("10 per minute")
@jwt_required()
def offer_draw_route(game_id):
    user_id = get_jwt_identity()
    game, message, status = offer_draw(user_id, game_id)
    if not game:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "game": game.to_dict()}), status


@game_bp.route("/draw/accept/<game_id>", methods=["POST"])
@limiter.limit("10 per minute")
@jwt_required()
def accept_draw_route(game_id):
    user_id = get_jwt_identity()
    game, message, status = accept_draw(user_id, game_id)
    if not game:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "game": game.to_dict()}), status


@game_bp.route("/draw/decline/<game_id>", methods=["POST"])
@limiter.limit("10 per minute")
@jwt_required()
def decline_draw_route(game_id):
    user_id = get_jwt_identity()
    game, message, status = decline_draw(user_id, game_id)
    if not game:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "game": game.to_dict()}), status


@game_bp.route("/open", methods=["GET"])
@limiter.limit("10 per minute")
@jwt_required()
def get_open_games_route():
    open_games = Game.query.filter(
        Game.status == GameStatus.PENDING, Game.black_player_id == None
    ).all()
    return (
        jsonify(
            {
                "message": (
                    f"{len(open_games)} open game(s) found"
                    if open_games
                    else "No open games found"
                ),
                "games": [game.to_dict() for game in open_games],
            }
        ),
        200,
    )


@game_bp.route("/history", methods=["GET"])
@limiter.limit("10 per minute")
@jwt_required()
def get_games_route():
    user_id = get_jwt_identity()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    games, message, status = get_games(user_id, page, per_page)
    if not games:
        return jsonify({"message": message}), status
    return jsonify({"message": message, "games": games}), status


@game_bp.route("/<game_id>", methods=["GET"])
@limiter.limit("10 per minute")
@jwt_required()
def get_game_route(game_id):
    user_id = get_jwt_identity()
    game = Game.query.get(game_id)
    if not game:
        return jsonify({"message": "Game not found"}), 404
    if user_id not in [game.white_player_id, game.black_player_id]:
        return jsonify({"message": "Unauthorized to view this game"}), 403
    return jsonify({"message": "Game retrieved", "game": game.to_dict()}), 200


@game_bp.route("/my_games", methods=["GET"])
@jwt_required()
def get_my_games_route():
    user_id = get_jwt_identity()
    games = Game.query.filter(
        ((Game.white_player_id == user_id) | (Game.black_player_id == user_id)),
        Game.status.in_([GameStatus.PENDING, GameStatus.ACTIVE]),
    ).all()
    return (
        jsonify(
            {
                "message": f"{len(games)} active or pending game(s) found",
                "games": [game.to_dict() for game in games],
            }
        ),
        200,
    )
