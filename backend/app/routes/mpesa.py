# app/routes/mpesa.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.wallet_transaction import (
    WalletTransaction,
    TransactionType,
    PaymentMethod,
)
from app.utils.wallet import initiate_mpesa_stk_push, log_wallet_transaction

mpesa_bp = Blueprint("mpesa", __name__)


@mpesa_bp.route("/deposit", methods=["POST"])
@jwt_required()
def deposit_funds():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    data = request.get_json() or {}
    amount = data.get("amount", 0.0)
    phone_number = data.get("phone_number", None)
    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400
    try:
        tx, result = initiate_mpesa_stk_push(
            user, amount, phone_number, "Wallet Deposit for Game"
        )
        return (
            jsonify(
                {
                    "message": "STK Push initiated. Please check your phone to complete the payment.",
                    "transaction": tx.to_dict(),
                    "mpesa_response": result,
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500


@mpesa_bp.route("/callback", methods=["POST"])
def mpesa_callback():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data received"}), 400
    result = data.get("Body", {}).get("stkCallback", {})
    checkout_request_id = result.get("CheckoutRequestID")
    result_code = result.get("ResultCode")
    result_desc = result.get("ResultDesc")
    tx = WalletTransaction.query.filter_by(
        external_transaction_id=checkout_request_id
    ).first()
    if not tx:
        return jsonify({"message": "Transaction not found"}), 404
    user = User.query.get(tx.user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    if result_code == 0:
        callback_metadata = result.get("CallbackMetadata", {}).get("Item", [])
        amount = next(
            (item["Value"] for item in callback_metadata if item["Name"] == "Amount"), 0
        )
        mpesa_receipt = next(
            (
                item["Value"]
                for item in callback_metadata
                if item["Name"] == "MpesaReceiptNumber"
            ),
            None,
        )
        tx.status = "success"
        tx.external_transaction_id = mpesa_receipt
        tx.note = f"MPesa deposit successful: {result_desc}"
        tx.payment_method = PaymentMethod.MPESA
        user.wallet_balance += amount
        tx.balance_after = user.wallet_balance
        try:
            db.session.commit()
            return jsonify({"message": "Deposit processed successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Failed to update balance: {str(e)}"}), 500
    else:
        tx.status = "failed"
        tx.note = f"MPesa deposit failed: {result_desc}"
        tx.payment_method = PaymentMethod.MPESA
        try:
            db.session.commit()
            return jsonify({"message": "Deposit failed"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Failed to update transaction: {str(e)}"}), 500
    return jsonify({"message": "Callback processed"}), 200
