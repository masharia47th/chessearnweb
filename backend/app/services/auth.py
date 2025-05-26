from app.models.user import User, UserRole
from app import db
from app.utils.validation import validate_email, validate_phone_number
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity

def signup(first_name, last_name, email, username, phone_number, password, role=UserRole.PLAYER):
    is_valid_email, email_error = validate_email(email)
    if not is_valid_email:
        return None, email_error, 400

    is_valid_phone, phone_error = validate_phone_number(phone_number)
    if not is_valid_phone:
        return None, phone_error, 400

    if User.query.filter_by(email=email).first() or User.query.filter_by(username=username).first() or User.query.filter_by(phone_number=phone_number).first():
        return None, "User already exists", 400

    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        username=username,
        phone_number=phone_number,
        password=password,
        role=role
    )
    db.session.add(user)
    db.session.commit()
    return user, "User created", 201

def login(identifier, password):
    user = User.query.filter(
        (User.email == identifier.lower()) |
        (User.username == identifier) |
        (User.phone_number == identifier)
    ).first()
    if not user or not user.check_password(password):
        return None, "Invalid credentials", 401

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    return user, {"access_token": access_token, "refresh_token": refresh_token}, 200

def refresh():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return None, "User not found", 404

    access_token = create_access_token(identity=user.id)
    return {"access_token": access_token}, "Access token refreshed", 200