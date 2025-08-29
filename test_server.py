#!/usr/bin/env python3
"""
Simple test to check if server can start
"""

try:
    print("Testing imports...")
    from flask import Flask
    print("✅ Flask imported successfully")
    
    from flask_cors import CORS
    print("✅ CORS imported successfully")
    
    from pypdf import PdfReader
    print("✅ pypdf imported successfully")
    
    from advanced_quiz_extractor import AdvancedQuizExtractor
    print("✅ AdvancedQuizExtractor imported successfully")
    
    # Test Flask app creation
    app = Flask(__name__)
    print("✅ Flask app created successfully")
    
    print("🎉 All imports and basic setup working!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
