from flask import Blueprint, jsonify, request, send_from_directory, current_app
from flask_jwt_extended import jwt_required
from app.services.profile import get_profile, update_profile_photo
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

profile_bp = Blueprint("profile", __name__)
limiter = Limiter(key_func=get_remote_address)


@profile_bp.route("/", methods=["GET"])
@limiter.limit("5 per minute")
@jwt_required()
def get_profile_route():
    user, error, status = get_profile()
    if error:
        return jsonify({"message": error}), status
    return jsonify({"message": "Profile retrieved", "user": user.to_dict()}), status


@profile_bp.route("/photo", methods=["POST"])
@limiter.limit("5 per minute")
@jwt_required()
def upload_photo_route():
    if "photo" not in request.files:
        return jsonify({"message": "No photo provided"}), 400

    file = request.files["photo"]
    user, message, status = update_profile_photo(file)
    if message != "Profile photo updated":
        return jsonify({"message": message}), status

    return jsonify({"message": message, "photo_filename": user.photo_filename}), status


@profile_bp.route("/photo/<filename>", methods=["GET"])
def serve_photo(filename):
    upload_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "profiles")
    if not os.path.exists(os.path.join(upload_folder, filename)):
        return jsonify({"message": "Photo not found"}), 404
    return send_from_directory(upload_folder, filename)
