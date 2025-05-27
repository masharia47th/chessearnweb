import pyotp


def generate_2fa_secret():
    return pyotp.random_base32()


def verify_2fa_code(secret, code):
    totp = pyotp.TOTP(secret)
    return totp.verify(code)
