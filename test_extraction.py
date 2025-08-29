#!/usr/bin/env python3
"""
Test script to check if data extraction is working properly
"""

import requests
import json
import time

def test_sample_files_api():
    """Test the sample files API endpoint"""
    print("🧪 Testing sample files API...")
    try:
        response = requests.get("http://localhost:5000/api/sample-files")
        if response.status_code == 200:
            files = response.json()
            print(f"✅ Sample files API working. Found {len(files)} files:")
            for file in files:
                print(f"  📄 {file['name']} ({file['size']}) - {file['description']}")
            return True
        else:
            print(f"❌ Sample files API failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing sample files API: {e}")
        return False

def test_extraction_api():
    """Test the extraction API endpoint"""
    print("\n🧪 Testing extraction API...")
    try:
        payload = {
            "useSamples": True,
            "questionCount": 50,
            "includeContext": True,
            "difficulty": "medium",
            "questionTypes": ["mcq"]
        }
        
        response = requests.post(
            "http://localhost:5000/api/start-extraction",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Extraction started successfully: {result}")
            return True
        else:
            print(f"❌ Extraction API failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing extraction API: {e}")
        return False

def test_extraction_progress():
    """Test the extraction progress API endpoint"""
    print("\n🧪 Testing extraction progress...")
    try:
        for i in range(10):  # Check progress for 10 seconds
            response = requests.get("http://localhost:5000/api/extraction-progress")
            if response.status_code == 200:
                progress = response.json()
                print(f"📊 Progress: {progress['progress']}% - {progress['message']} - Questions: {progress['questions_found']}")
                
                if progress['status'] == 'completed':
                    print("✅ Extraction completed successfully!")
                    return True
                elif progress['status'] == 'error':
                    print(f"❌ Extraction failed: {progress['message']}")
                    return False
            
            time.sleep(1)
            
        print("⚠️ Extraction still in progress after 10 seconds")
        return False
    except Exception as e:
        print(f"❌ Error testing extraction progress: {e}")
        return False

def test_questions_api():
    """Test the questions API endpoint"""
    print("\n🧪 Testing questions API...")
    try:
        response = requests.get("http://localhost:5000/api/questions")
        if response.status_code == 200:
            data = response.json()
            questions = data.get('questions', [])
            print(f"✅ Questions API working. Found {len(questions)} questions")
            if questions:
                print(f"Sample question: {questions[0].get('question', 'N/A')[:100]}...")
            return True
        else:
            print(f"❌ Questions API failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing questions API: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting API tests...\n")
    
    # Test all APIs
    sample_files_ok = test_sample_files_api()
    extraction_ok = test_extraction_api()
    
    if extraction_ok:
        progress_ok = test_extraction_progress()
        if progress_ok:
            questions_ok = test_questions_api()
    
    print("\n📊 Test Summary:")
    print(f"Sample Files API: {'✅' if sample_files_ok else '❌'}")
    print(f"Extraction API: {'✅' if extraction_ok else '❌'}")
    if extraction_ok:
        print(f"Progress API: {'✅' if progress_ok else '❌'}")
        if progress_ok:
            print(f"Questions API: {'✅' if questions_ok else '❌'}")
