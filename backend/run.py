# run.py
from app import create_app
from app.routes.socket import socketio  

app = create_app()

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=4747, debug=True, log_output=True)

