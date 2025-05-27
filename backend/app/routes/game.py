from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.services.game import create_match, join_match, get_games

game_bp = Blueprint("game⁠", __name__)
limiter = Limiter(key_func=get_remote_address)


@game_bp.route("/create", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
def create_match_route():
    user_id = get_jwt_identity()
    data = request.get_json()
    is_rated = data.get("is_rated", True)
    opponent_id = data.get("opponent_id")  # Optional, None for open match
    base_time = data.get("base_time", 300)  # Default 5 minutes
    increment = data.get("increment", 0)  # Default no increment

    game, message, status = create_match(
        user_id, is_rated, opponent_id, base_time, increment
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


@game_bp.route("/history", methods=["GET"])
@limiter.limit("10 per minute")
@jwt_required()
def get_games_route():
    user_id = request.args.get("user_id")
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
    from app.models.game import Game

    game = Game.query.get(game_id)
    if not game:
        return jsonify({"message": "Game not found"}), 404
    if user_id not in [game.white_player_id, game.black_player_id]:
        return jsonify({"message": "Unauthorized to view this game"}), 403

    return jsonify({"message": "Game retrieved", "game": game.to_dict()}), 200
