# backend/run.py - Updated to bind to all interfaces

from app import create_app
import logging
logging.basicConfig(level=logging.DEBUG)

app = create_app()

if __name__ == '__main__':
    # Run on all network interfaces (0.0.0.0) to allow network access
    # Keep debug=True for development
    app.run(debug=True, host='0.0.0.0', port=5000)