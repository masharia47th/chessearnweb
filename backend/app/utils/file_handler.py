import os
import uuid
import magic
from werkzeug.utils import secure_filename
from flask import current_app

def save_profile_photo(file):
    if not file:
        return None, "No file provided", 400

    # Validate file type
    mime = magic.Magic(mime=True)
    file_type = mime.from_buffer(file.read(1024))
    file.seek(0)  # Reset file pointer
    if file_type not in ['image/jpeg', 'image/png', 'image/gif']:
        return None, "Invalid file type. Only JPEG, PNG, or GIF allowed", 400

    # Generate unique filename
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    unique_filename = f"{uuid.uuid4()}.{ext}"
    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profiles', unique_filename)

    # Ensure upload directory exists
    os.makedirs(os.path.dirname(upload_path), exist_ok=True)

    # Save file
    file.save(upload_path)
    return unique_filename, None, 200