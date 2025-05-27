from app.models.user import User
from app.utils.file_handler import save_profile_photo
from app import db
from flask_jwt_extended import get_jwt_identity


def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return None, "User not found", 404
    return user, None, 200


def update_profile_photo(file):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return None, "User not found", 404

    filename, error, status = save_profile_photo(file)
    if error:
        return None, error, status

    user.photo_filename = filename
    db.session.commit()
    return user, "Profile photo updated", 200
