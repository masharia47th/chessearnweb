from app import db
from app.models.user import User
from app.models.wallet_transaction import WalletTransaction, TransactionType
from datetime import datetime

# --- Utility Functions ---

def log_wallet_transaction(user_id, amount, transaction_type, game_id=None, note="", balance_after=None):
    tx = WalletTransaction(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        game_id=game_id,
        timestamp=datetime.utcnow(),
        note=note,
        balance_after=balance_after
    )
    db.session.add(tx)
    return tx  # Return for tracing

def handle_wallet_bet(user, amount, game_id=None):
    if user.wallet_balance < amount:
        raise ValueError("Insufficient funds for the bet")
    user.wallet_balance -= amount
    tx = log_wallet_transaction(
        user.id, -amount, TransactionType.BET, game_id, "Game bet deduction", balance_after=user.wallet_balance
    )
    return tx

def handle_platform_fee(user, fee_amount, game_id=None):
    """Deduct and log a platform fee from a user's balance."""
    if user.wallet_balance < fee_amount:
        raise ValueError("Insufficient funds for platform fee")
    user.wallet_balance -= fee_amount
    tx = log_wallet_transaction(
        user.id, -fee_amount, TransactionType.PLATFORM_FEE, game_id, "Platform fee deduction", balance_after=user.wallet_balance
    )
    return tx

def distribute_winnings(game):
    if not game.bet_amount or game.bet_amount <= 0:
        return  # Nothing to distribute

    white = game.white_player
    black = game.black_player
    total_pot = 2 * game.bet_amount
    platform_cut = round(game.bet_amount * game.platform_fee, 2) if hasattr(game, "platform_fee") else round(game.bet_amount * 0.2, 2)
    winner_amount = round(total_pot - platform_cut, 2)

    winner = None
    winner_note = ""
    loser = None

    if game.outcome == game.__class__.GameOutcome.WHITE_WIN:
        winner, loser = white, black
        winner_note = "White wins"
    elif game.outcome == game.__class__.GameOutcome.BLACK_WIN:
        winner, loser = black, white
        winner_note = "Black wins"

    if winner:
        winner.wallet_balance += winner_amount
        winner_tx = log_wallet_transaction(
            winner.id, winner_amount, TransactionType.WINNINGS, game.id,
            f"{winner_note}, received winnings", balance_after=winner.wallet_balance
        )
        # Platform fee: deducted from pot, not from winner
        # Optionally, could log platform income as a tx for an admin/platform user
        # Example: platform_user_id = "PLATFORM_UUID"
        # log_wallet_transaction(platform_user_id, platform_cut, TransactionType.PLATFORM_FEE, game.id, "Platform fee")
    elif game.outcome == game.__class__.GameOutcome.DRAW:
        # Both players get their bet back
        for player in [white, black]:
            if player:
                player.wallet_balance += game.bet_amount
                log_wallet_transaction(
                    player.id, game.bet_amount, TransactionType.REFUND, game.id,
                    "Draw refund", balance_after=player.wallet_balance
                )
    # No payout for incomplete/cancelled games here. Use refund_bets for that.

def refund_bets(game):
    """Refund both players if the match was not completed or cancelled."""
    for player in [game.white_player, game.black_player]:
        if player:
            player.wallet_balance += game.bet_amount
            log_wallet_transaction(
                player.id, game.bet_amount, TransactionType.REFUND, game.id,
                "Refund for incomplete/canceled match", balance_after=player.wallet_balance
            )