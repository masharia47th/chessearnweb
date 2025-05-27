from email_validator import validate_email as validate_email_lib, EmailNotValidError
import phonenumbers
from phonenumbers import NumberParseException


def validate_email(email):
    try:
        # Validate email syntax and domain
        v = validate_email_lib(email)
        email = v.normalized

        # Check for disposable email domains
        disposable_domains = {"mailinator.com", "tempmail.com", "10minutemail.com"}
        domain = email.lower().split("@")[1]
        if domain in disposable_domains:
            return False, "Disposable email addresses are not allowed"

        return True, None
    except EmailNotValidError as e:
        return False, f"Invalid email format: {str(e)}"


def validate_phone_number(phone_number):
    try:
        parsed_number = phonenumbers.parse(phone_number, None)
        if not phonenumbers.is_valid_number(parsed_number):
            return False, "Invalid phone number"
        if not phone_number.startswith("+") or not (
            7 <= len(phone_number.replace("+", "")) <= 15
        ):
            return False, "Phone number must be in international format (+1234567890)"
        return True, None
    except NumberParseException:
        return False, "Invalid phone number format"
