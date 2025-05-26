3. Get Profile (Unchanged)
bash
curl -X GET http://localhost:5000/profile/ \
  -H "Authorization: Bearer jwt-access-token"

Expected Response:
json
{
  "message": "Profile retrieved",
  "user": {
    "id": "some-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@gmail.com",
    "username": "johndoe",
    "phone_number": "+1234567890",
    "role": "player",
    "ranking": 800,
    "wallet_balance": 0.0,
    "is_active": true,
    "is_verified": false,
    "photo_filename": "default.jpg"
  }
}
4. Upload Profile Photo (Unchanged)
bash
curl -X POST http://localhost:5000/profile/photo \
  -H "Authorization: Bearer jwt-access-token" \
  -F "photo=@/path/to/photo.jpg"

Expected Response:
json
{
  "message": "Profile photo updated",
  "photo_filename": "123e4567-e89b-12d3-a456-426614174000.jpg"
}
5. Serve Profile Photo (New)

To test serving the photo, use the photo_filename from the upload response or default.jpg:
bash
curl -X GET http://localhost:5000/profile/photo/123e4567-e89b-12d3-a456-426614174000.jpg \
  -o downloaded_photo.jpg

Expected Behavior: Downloads the photo to downloaded_photo.jpg. You can open it to verify.

Or view in a browser:

    Navigate to http://localhost:5000/profile/photo/123e4567-e89b-12d3-a456-426614174000.jpg or http://localhost:5000/profile/photo/default.jpg.

Error Response (File Not Found):
bash
curl -X GET http://localhost:5000/profile/photo/nonexistent.jpg

Expected Response: Flask’s 404 error (handled by send_from_directory).