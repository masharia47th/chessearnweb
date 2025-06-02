from app import db
from datetime import datetime
import uuid

class TransactionType:
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    BET = "bet"
    WINNINGS = "winnings"
    REFUND = "refund"
    PLATFORM_FEE = "platform_fee"  # 🆕 Add: For clear platform income tracking

class WalletTransaction(db.Model):
    __tablename__ = "wallet_transactions"

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False)  # 🆕 Add: For traceability
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # e.g., "bet", "win", "refund"
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    game_id = db.Column(db.String(36), db.ForeignKey("games.id"), nullable=True)
    note = db.Column(db.String(255), nullable=True)
    balance_after = db.Column(db.Float, nullable=True)  # 🆕 Add: For auditing user balance after tx

    user = db.relationship("User", backref="wallet_transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "uuid": self.uuid,
            "user_id": self.user_id,
            "amount": self.amount,
            "transaction_type": self.transaction_type,
            "timestamp": self.timestamp.isoformat(),
            "game_id": self.game_id,
            "note": self.note,
            "balance_after": self.balance_after,
        }