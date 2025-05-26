from flask import Blueprint, request, jsonify
from app.services.auth import signup, login, refresh
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import jwt_required

auth_bp = Blueprint('auth', __name__)
limiter = Limiter(key_func=get_remote_address)

@auth_bp.route('/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup_route():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    username = data.get('username')
    phone_number = data.get('phone_number')
    password = data.get('password')

    if not all([first_name, last_name, email, username, phone_number, password]):
        return jsonify({"message": "Missing required fields"}), 400

    user, message, status = signup(first_name, last_name, email, username, phone_number, password)
    if not user:
        return jsonify({"message": message}), status

    return jsonify({"message": message}), status

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login_route():
    data = request.get_json()
    identifier = data.get('identifier')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"message": "Missing identifier or password"}), 400

    user, result, status = login(identifier, password)
    if not user:
        return jsonify({"message": result}), status

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict(),
        **result
    }), status

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("5 per minute")
@jwt_required(refresh=True)
def refresh_route():
    result, message, status = refresh()
    if not result:
        return jsonify({"message": message}), status

    return jsonify({
        "message": message,
        **result
    }), status