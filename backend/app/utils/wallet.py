# app/utils/wallet.py
from app import db
from app.models.user import User
from app.models.wallet_transaction import (
    WalletTransaction,
    TransactionType,
    PaymentMethod,
)
from datetime import datetime
import requests
from config import Config
import base64
import json

# --- Utility Functions ---


def log_wallet_transaction(
    user_id,
    amount,
    transaction_type,
    game_id=None,
    note="",
    balance_after=None,
    payment_method=None,
    external_transaction_id=None,
    status="pending",
):
    tx = WalletTransaction(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        game_id=game_id,
        timestamp=datetime.utcnow(),
        note=note,
        balance_after=balance_after,
        payment_method=payment_method,
        external_transaction_id=external_transaction_id,
        status=status,
    )
    db.session.add(tx)
    db.session.commit()  # Commit to ensure transaction is saved
    return tx


def handle_wallet_bet(user, amount, game_id=None):
    if user.wallet_balance < amount:
        raise ValueError("Insufficient funds for the bet")
    user.wallet_balance -= amount
    tx = log_wallet_transaction(
        user.id,
        -amount,
        TransactionType.BET,
        game_id,
        "Game bet deduction",
        balance_after=user.wallet_balance,
    )
    return tx


def handle_platform_fee(user, fee_amount, game_id=None):
    if user.wallet_balance < fee_amount:
        raise ValueError("Insufficient funds for platform fee")
    user.wallet_balance -= fee_amount
    tx = log_wallet_transaction(
        user.id,
        -fee_amount,
        TransactionType.PLATFORM_FEE,
        game_id,
        "Platform fee deduction",
        balance_after=user.wallet_balance,
    )
    return tx


def distribute_winnings(game):
    if not game.bet_amount or game.bet_amount <= 0:
        return
    white = game.white_player
    black = game.black_player
    total_pot = 2 * game.bet_amount
    platform_cut = (
        round(game.bet_amount * game.platform_fee, 2)
        if hasattr(game, "platform_fee")
        else round(game.bet_amount * 0.2, 2)
    )
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
            winner.id,
            winner_amount,
            TransactionType.WINNINGS,
            game.id,
            f"{winner_note}, received winnings",
            balance_after=winner.wallet_balance,
        )
    elif game.outcome == game.__class__.GameOutcome.DRAW:
        for player in [white, black]:
            if player:
                player.wallet_balance += game.bet_amount
                log_wallet_transaction(
                    player.id,
                    game.bet_amount,
                    TransactionType.REFUND,
                    game.id,
                    "Draw refund",
                    balance_after=player.wallet_balance,
                )


def refund_bets(game):
    for player in [game.white_player, game.black_player]:
        if player:
            player.wallet_balance += game.bet_amount
            log_wallet_transaction(
                player.id,
                game.bet_amount,
                TransactionType.REFUND,
                game.id,
                "Refund for incomplete/canceled match",
                balance_after=player.wallet_balance,
            )


def get_mpesa_access_token():
    url = f"{Config.MPESA_API_URL}/oauth/v1/generate?grant_type=client_credentials"
    auth = base64.b64encode(
        f"{Config.MPESA_CONSUMER_KEY}:{Config.MPESA_CONSUMER_SECRET}".encode()
    ).decode()
    headers = {"Authorization": f"Basic {auth}", "Content-Type": "application/json"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get("access_token")
    except requests.RequestException as e:
        raise Exception(f"Failed to get MPesa access token: {str(e)}")


def validate_phone_number(phone_number):
    phone = "".join(filter(str.isdigit, phone_number))
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    if not (len(phone) == 12 and phone.startswith("254") and phone[3] in "17"):
        raise ValueError(
            "Invalid phone number format. Use +254 or 07 followed by 9 digits."
        )
    return phone


def initiate_mpesa_stk_push(user, amount, phone_number=None, note="Wallet Deposit"):
    target_phone = phone_number if phone_number else user.phone_number
    try:
        target_phone = validate_phone_number(target_phone)
    except ValueError as e:
        raise ValueError(str(e))
    access_token = get_mpesa_access_token()
    url = f"{Config.MPESA_API_URL}/mpesa/stkpush/v1/processrequest"
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{Config.MPESA_BUSINESS_SHORTCODE}{Config.MPESA_PASSKEY}{timestamp}".encode()
    ).decode()
    payload = {
        "BusinessShortCode": Config.MPESA_BUSINESS_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": target_phone,
        "PartyB": Config.MPESA_BUSINESS_SHORTCODE,
        "PhoneNumber": target_phone,
        "CallBackURL": Config.MPESA_CALLBACK_URL,
        "AccountReference": f"Deposit-{user.id}",
        "TransactionDesc": note,
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        if result.get("ResponseCode") == "0":
            tx = log_wallet_transaction(
                user_id=user.id,
                amount=amount,
                transaction_type=TransactionType.DEPOSIT,
                note=f"MPesa STK Push initiated: {note}",
                balance_after=user.wallet_balance,
                payment_method=PaymentMethod.MPESA,
                external_transaction_id=result.get("CheckoutRequestID"),
                status="pending",
            )
            return tx, result
        else:
            raise Exception(f"STK Push failed: {result.get('ResponseDescription')}")
    except requests.RequestException as e:
        raise Exception(f"Failed to initiate STK Push: {str(e)}")
