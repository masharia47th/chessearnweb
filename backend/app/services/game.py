from app.models.game import Game, GameStatus, GameOutcome
from app.models.user import User
from app import db
import chess
from flask_jwt_extended import get_jwt_identity
from datetime import datetime


def create_match(user_id, is_rated=True, opponent_id=None, base_time=300, increment=0):
    """
    Create a new chess match with time controls.
    """
    user = User.query.get(user_id)
    if not user:
        return None, "User not found", 404

    if base_time <= 0 or increment < 0:
        return None, "Invalid time controls", 400

    if opponent_id:
        opponent = User.query.get(opponent_id)
        if not opponent:
            return None, "Opponent not found", 404
        if opponent_id == user_id:
            return None, "Cannot play against yourself", 400

        import random

        if random.choice([True, False]):
            white_player_id, black_player_id = user_id, opponent_id
        else:
            white_player_id, black_player_id = opponent_id, user_id

        game = Game(
            white_player_id=white_player_id,
            black_player_id=black_player_id,
            status=GameStatus.ACTIVE,
            is_rated=is_rated,
            base_time=base_time,
            increment=increment,
            white_time_remaining=float(base_time),
            black_time_remaining=float(base_time),
        )
    else:
        game = Game(
            white_player_id=user_id,
            black_player_id=None,
            status=GameStatus.PENDING,
            is_rated=is_rated,
            base_time=base_time,
            increment=increment,
            white_time_remaining=float(base_time),
            black_time_remaining=None,
        )

    db.session.add(game)
    db.session.commit()
    return game, "Match created", 201


def join_match(user_id, game_id):
    """
    Join an existing match as the black player, setting time controls.
    """
    user = User.query.get(user_id)
    game = Game.query.get(game_id)
    if not user:
        return None, "User not found", 404
    if not game:
        return None, "Game not found", 404
    if game.status != GameStatus.PENDING:
        return None, "Game is not open for joining", 400
    if game.white_player_id == user_id:
        return None, "Cannot join your own game", 400

    game.black_player_id = user_id
    game.black_time_remaining = float(game.base_time)
    game.status = GameStatus.ACTIVE
    db.session.commit()
    return game, "Joined match", 200


def make_move(user_id, game_id, move_san, move_time=None):
    """
    Make a move, update time controls, and check for time-outs.
    """
    game = Game.query.get(game_id)
    if not game:
        return None, "Game not found", 404
    if game.status != GameStatus.ACTIVE:
        return None, "Game is not active", 400
    if user_id not in [game.white_player_id, game.black_player_id]:
        return None, "You are not a player in this game", 403

    # Initialize chess board
    board = chess.Board()
    for move in game.moves.split():
        board.push_san(move)

    # Check if it's the user's turn
    is_white_turn = board.turn == chess.WHITE
    user_is_white = game.white_player_id == user_id
    if (is_white_turn and not user_is_white) or (not is_white_turn and user_is_white):
        return None, "Not your turn", 400

    # Validate move
    try:
        move = board.parse_san(move_san)
        if move not in board.legal_moves:
            return None, "Invalid move", 400
        board.push(move)
        game.moves = (game.moves + " " + move_san).strip()
    except ValueError:
        return None, "Invalid move format", 400

    # Update time controls
    current_time = move_time if move_time is not None else datetime.utcnow().timestamp()
    if not game.moves:
        game.start_time = datetime.fromtimestamp(current_time)

    last_time = (
        game.start_time.timestamp()
        if not game.moves
        else game.end_time.timestamp() if game.end_time else current_time
    )
    time_used = current_time - last_time

    if user_is_white:
        game.white_time_remaining = max(
            0, game.white_time_remaining - time_used + game.increment
        )
    else:
        game.black_time_remaining = max(
            0, game.black_time_remaining - time_used + game.increment
        )

    # Check for time-out
    if game.white_time_remaining <= 0 and user_is_white:
        game.status = GameStatus.COMPLETED
        game.outcome = GameOutcome.BLACK_WIN
        game.end_time = datetime.fromtimestamp(current_time)
    elif game.black_time_remaining <= 0 and not user_is_white:
        game.status = GameStatus.COMPLETED
        game.outcome = GameOutcome.WHITE_WIN
        game.end_time = datetime.fromtimestamp(current_time)
    else:
        if board.is_game_over():
            game.status = GameStatus.COMPLETED
            game.end_time = game.end_time or datetime.fromtimestamp(current_time)
            if board.is_checkmate():
                game.outcome = (
                    GameOutcome.WHITE_WIN
                    if board.turn == chess.BLACK
                    else GameOutcome.BLACK_WIN
                )
            elif (
                board.is_stalemate()
                or board.is_insufficient_material()
                or board.is_seventyfive_moves()
                or board.is_fivefold_repetition()
            ):
                game.outcome = GameOutcome.DRAW

    game.end_time = (
        datetime.fromtimestamp(current_time)
        if game.status == GameStatus.COMPLETED
        else datetime.fromtimestamp(current_time)
    )
    db.session.commit()
    return game, board.fen(), 200


def resign_game(user_id, game_id):
    """
    Allow a player to resign, ending the game.
    """
    game = Game.query.get(game_id)
    if not game:
        return None, "Game not found", 404
    if game.status != GameStatus.ACTIVE:
        return None, "Game is not active", 400
    if user_id not in [game.white_player_id, game.black_player_id]:
        return None, "You are not a player in this game", 403

    game.status = GameStatus.COMPLETED
    game.end_time = datetime.utcnow()
    if user_id == game.white_player_id:
        game.outcome = GameOutcome.BLACK_WIN
    else:
        game.outcome = GameOutcome.WHITE_WIN

    db.session.commit()
    return game, "Game resigned", 200


def offer_draw(user_id, game_id):
    """
    Allow a player to offer a draw.
    """
    game = Game.query.get(game_id)
    if not game:
        return None, "Game not found", 404
    if game.status != GameStatus.ACTIVE:
        return None, "Game is not active", 400
    if user_id not in [game.white_player_id, game.black_player_id]:
        return None, "You are not a player in this game", 403
    if game.draw_offered_by:
        return None, "Draw already offered", 400

    game.draw_offered_by = user_id
    db.session.commit()
    return game, "Draw offered", 200


def accept_draw(user_id, game_id):
    """
    Allow a player to accept a draw offer.
    """
    game = Game.query.get(game_id)
    if not game:
        return None, "Game not found", 404
    if game.status != GameStatus.ACTIVE:
        return None, "Game is not active", 400
    if user_id not in [game.white_player_id, game.black_player_id]:
        return None, "You are not a player in this game", 403
    if not game.draw_offered_by:
        return None, "No draw offer exists", 400
    if game.draw_offered_by == user_id:
        return None, "Cannot accept your own draw offer", 400

    game.status = GameStatus.COMPLETED
    game.outcome = GameOutcome.DRAW
    game.draw_offered_by = None
    game.end_time = datetime.utcnow()
    db.session.commit()
    return game, "Draw accepted", 200


def decline_draw(user_id, game_id):
    """
    Allow a player to decline a draw offer.
    """
    game = Game.query.get(game_id)
    if not game:
        return None, "Game not found", 404
    if game.status != GameStatus.ACTIVE:
        return None, "Game is not active", 400
    if user_id not in [game.white_player_id, game.black_player_id]:
        return None, "You are not a player in this game", 403
    if not game.draw_offered_by:
        return None, "No draw offer exists", 400
    if game.draw_offered_by == user_id:
        return None, "Cannot decline your own draw offer", 400

    game.draw_offered_by = None
    db.session.commit()
    return game, "Draw declined", 200


def get_games(user_id=None, page=1, per_page=20, include_active=False):
    """
    Retrieve game history, optionally filtered by user_id, with pagination.
    include_active: If True, include active games (for spectators).
    """
    if user_id:
        user = User.query.get(user_id)
        if not user:
            return None, "User not found", 404
        query = Game.query.filter(
            (Game.white_player_id == user_id) | (Game.black_player_id == user_id)
        )
    else:
        if include_active:
            query = Game.query
        else:
            query = Game.query.filter(Game.status == GameStatus.COMPLETED)

    games = (
        query.order_by(Game.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
        .items
    )
    return [game.to_dict() for game in games], "Game history retrieved", 200
