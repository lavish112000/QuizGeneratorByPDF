#!/usr/bin/env python3
"""
Minimal Flask server for debugging
"""

from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>PDF Quiz Generator - Debug</title>
    </head>
    <body>
        <h1>PDF Quiz Generator</h1>
        <p>Server is running successfully!</p>
        <button onclick="testAPI()">Test API</button>
        
        <script>
        function testAPI() {
            fetch('/api/test')
                .then(response => response.json())
                .then(data => alert('API Response: ' + JSON.stringify(data)))
                .catch(error => alert('Error: ' + error));
        }
        </script>
    </body>
    </html>
    """

@app.route('/api/test')
def test_api():
    return jsonify({
        'status': 'success',
        'message': 'API is working!',
        'timestamp': str(os.path.getctime(__file__))
    })

if __name__ == '__main__':
    print("🚀 Starting minimal Flask server...")
    print("📍 Server will be available at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
