from enum import Enum
from app import db
from app.models.user import User
from datetime import datetime
import uuid


class GameStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"  # 🆕 Add: Allow for games cancelled before starting


class GameOutcome(Enum):
    WHITE_WIN = "white_win"
    BLACK_WIN = "black_win"
    DRAW = "draw"
    INCOMPLETE = "incomplete"
    CANCELLED = "cancelled"  # 🆕 Add: For games that are cancelled


class Game(db.Model):
    __tablename__ = "games"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    white_player_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False
    )
    black_player_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    status = db.Column(
        db.Enum(GameStatus, name="gamestatus"),
        default=GameStatus.PENDING,
        nullable=False,
    )
    outcome = db.Column(
        db.Enum(GameOutcome, name="gameoutcome"),
        default=GameOutcome.INCOMPLETE,
        nullable=False,
    )
    is_rated = db.Column(db.Boolean, default=True, nullable=False)
    moves = db.Column(db.Text, default="", nullable=False)
    base_time = db.Column(db.Integer, nullable=False, default=300)
    increment = db.Column(db.Integer, nullable=False, default=0)
    white_time_remaining = db.Column(db.Float, nullable=False, default=300.0)
    black_time_remaining = db.Column(db.Float, nullable=True)
    draw_offered_by = db.Column(db.String(36), nullable=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Betting fields
    bet_amount = db.Column(db.Float, nullable=False, default=0.0)
    bet_locked = db.Column(
        db.Boolean, default=False
    )  # 🆕 Add: True when both players' stakes are locked

    # 🆕 Platform fee for transparency and possible analytics
    platform_fee = db.Column(
        db.Float, nullable=False, default=0.2
    )  # 20% by default (can be overridden in future)

    # 🆕 Transaction IDs for traceability (optional, but useful)
    white_bet_txn_id = db.Column(db.String(36), nullable=True)
    black_bet_txn_id = db.Column(db.String(36), nullable=True)
    payout_txn_id = db.Column(db.String(36), nullable=True)

    white_player = db.relationship(
        "User", foreign_keys=[white_player_id], backref="white_games"
    )
    black_player = db.relationship(
        "User", foreign_keys=[black_player_id], backref="black_games"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "white_player_id": self.white_player_id,
            "black_player_id": self.black_player_id,
            "white_player": self.white_player.username,
            "black_player": self.black_player.username if self.black_player else None,
            "status": self.status.value,
            "outcome": self.outcome.value,
            "is_rated": self.is_rated,
            "moves": self.moves,
            "base_time": self.base_time,
            "increment": self.increment,
            "white_time_remaining": self.white_time_remaining,
            "black_time_remaining": self.black_time_remaining,
            "draw_offered_by": self.draw_offered_by,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "created_at": self.created_at.isoformat(),
            "bet_amount": self.bet_amount,
            "bet_locked": self.bet_locked,
            "platform_fee": self.platform_fee,
            "white_bet_txn_id": self.white_bet_txn_id,
            "black_bet_txn_id": self.black_bet_txn_id,
            "payout_txn_id": self.payout_txn_id,
        }

    def __repr__(self):
        return f"<Game {self.id} - {self.white_player.username} vs {self.black_player.username if self.black_player else 'TBD'} | Bet: {self.bet_amount}>"
