import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://user:password@localhost/chessearn"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    FACEBOOK_CLIENT_ID = os.getenv("FACEBOOK_CLIENT_ID", "")
    FACEBOOK_CLIENT_SECRET = os.getenv("FACEBOOK_CLIENT_SECRET", "")
    UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))

    # MPesa Daraja API Configuration
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "")
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "")
    MPESA_API_URL = os.getenv("MPESA_API_URL", "https://sandbox.safaricom.co.ke")  # Sandbox for testing
    MPESA_BUSINESS_SHORTCODE = os.getenv("MPESA_BUSINESS_SHORTCODE", "174379")
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "")
    MPESA_INITIATOR_NAME = os.getenv("MPESA_INITIATOR_NAME", "testapi")
    MPESA_INITIATOR_PASSWORD = os.getenv("MPESA_INITIATOR_PASSWORD", "Safaricom123!!")
    MPESA_PARTY_A = os.getenv("MPESA_PARTY_A", "600999")  # Shortcode for B2C
    MPESA_PARTY_B = os.getenv("MPESA_PARTY_B", "600000")  # Shortcode for STK Push
    MPESA_PHONE_NUMBER = os.getenv("MPESA_PHONE_NUMBER", "254708374149")  # Test phone number
    MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL", "https://yourdomain.com/api/mpesa/callback")