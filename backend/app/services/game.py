from app.models.game import Game, GameStatus, GameOutcome
from app.models.user import User
from app import db
import chess
from datetime import datetime
from app.utils.wallet import handle_wallet_bet, distribute_winnings, refund_bets


def create_match(user_id, is_rated=True, base_time=300, increment=0, bet_amount=0.0):
    user = User.query.get(user_id)
    if not user:
        return None, "User not found", 404
    if base_time <= 0 or increment < 0:
        return None, "Invalid time controls", 400
    if bet_amount < 0:
        return None, "Bet amount cannot be negative", 400
    if bet_amount > 0 and user.wallet_balance < bet_amount:
        return None, "Insufficient balance to fund bet", 400

    # Deduct bet and lock as escrow
    if bet_amount > 0:
        handle_wallet_bet(user, bet_amount)

    game = Game(
        white_player_id=user_id,
        status=GameStatus.PENDING,
        is_rated=is_rated,
        base_time=base_time,
        increment=increment,
        white_time_remaining=float(base_time),
        black_time_remaining=None,
        bet_amount=bet_amount,
        bet_locked=bool(bet_amount > 0),
    )
    db.session.add(game)
    db.session.commit()
    return game, "Match created", 201


def join_match(user_id, game_id):
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
    if game.bet_amount > 0 and user.wallet_balance < game.bet_amount:
        return None, "Insufficient balance to join bet", 400

    # Deduct bet and lock as escrow
    if game.bet_amount > 0:
        handle_wallet_bet(user, game.bet_amount)
        game.bet_locked = True

    game.black_player_id = user_id
    game.black_time_remaining = float(game.base_time)
    game.status = GameStatus.ACTIVE
    db.session.commit()
    return game, "Joined match", 200


def make_move(user_id, game_id, move_san, move_time=None):
    game = Game.query.get(game_id)
    if not game:
        return None, "Game not found", 404
    if game.status != GameStatus.ACTIVE:
        return None, "Game is not active", 400
    if user_id not in [game.white_player_id, game.black_player_id]:
        return None, "You are not a player in this game", 403

    # Initialize chess board
    board = chess.Board()
    if game.moves:
        for move in game.moves.split():
            board.push_san(move)

    is_white_turn = board.turn == chess.WHITE
    user_is_white = game.white_player_id == user_id
    if (is_white_turn and not user_is_white) or (not is_white_turn and user_is_white):
        return None, "Not your turn", 400

    try:
        move = board.parse_san(move_san)
        if move not in board.legal_moves:
            return None, "Invalid move", 400
        board.push(move)
        game.moves = (game.moves + " " + move_san).strip() if game.moves else move_san
    except ValueError:
        return None, "Invalid move format", 400

    # Time controls
    current_time = move_time if move_time is not None else datetime.utcnow().timestamp()
    last_time = game.start_time.timestamp() if game.start_time else current_time
    time_used = current_time - last_time

    if user_is_white:
        game.white_time_remaining = max(
            0,
            (game.white_time_remaining or game.base_time) - time_used + game.increment,
        )
    else:
        game.black_time_remaining = max(
            0,
            (game.black_time_remaining or game.base_time) - time_used + game.increment,
        )

    # Start time on first move
    if not game.start_time:
        game.start_time = datetime.fromtimestamp(current_time)

    # End game if timeout or checkmate
    end = False
    winner = None
    if user_is_white and game.white_time_remaining <= 0:
        end = True
        game.status = GameStatus.COMPLETED
        game.outcome = GameOutcome.BLACK_WIN
        winner = "black"
    elif not user_is_white and game.black_time_remaining <= 0:
        end = True
        game.status = GameStatus.COMPLETED
        game.outcome = GameOutcome.WHITE_WIN
        winner = "white"
    elif board.is_game_over():
        end = True
        game.status = GameStatus.COMPLETED
        if board.is_checkmate():
            game.outcome = (
                GameOutcome.WHITE_WIN
                if board.turn == chess.BLACK
                else GameOutcome.BLACK_WIN
            )
            winner = "white" if board.turn == chess.BLACK else "black"
        else:
            game.outcome = GameOutcome.DRAW

    if end:
        game.end_time = datetime.fromtimestamp(current_time)
        db.session.commit()
        distribute_winnings(game)
    else:
        db.session.commit()
    return game, board.fen(), 200


def resign_game(user_id, game_id):
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
    distribute_winnings(game)
    return game, "Game resigned", 200


def cancel_game(user_id, game_id):
    game = Game.query.get(game_id)
    if not game:
        return None, "Game not found", 404
    if game.status not in [GameStatus.PENDING, GameStatus.ACTIVE]:
        return None, "Game cannot be cancelled", 400
    if user_id not in [game.white_player_id, game.black_player_id]:
        return None, "Only a player can cancel", 403

    game.status = GameStatus.CANCELLED
    game.outcome = GameOutcome.CANCELLED
    game.end_time = datetime.utcnow()
    db.session.commit()
    refund_bets(game)
    return game, "Game cancelled and bets refunded", 200


def offer_draw(user_id, game_id):
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
    distribute_winnings(game)
    return game, "Draw accepted", 200


def decline_draw(user_id, game_id):
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
    if user_id:
        user = User.query.get(user_id)
        if not user:
            return None, "User not found", 404
        query = Game.query.filter(
            (Game.white_player_id == user_id) | (Game.black_player_id == user_id)
        )
    else:
        query = (
            Game.query
            if include_active
            else Game.query.filter(Game.status == GameStatus.COMPLETED)
        )

    games = (
        query.order_by(Game.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
        .items
    )
    return [game.to_dict() for game in games], "Game history retrieved", 200
