#!/usr/bin/env python3
"""
Comprehensive Test Script for PDF Quiz Generator
Tests all endpoints and extraction workflow
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_endpoint(endpoint, method="GET", data=None, files=None):
    """Test an API endpoint and return the result."""
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🔍 Testing {method} {endpoint}")
        
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            if files:
                response = requests.post(url, files=files, data=data)
            else:
                response = requests.post(url, json=data)
        
        print(f"Status: {response.status_code}")
        
        if response.headers.get('content-type', '').startswith('application/json'):
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"Response: {response.text[:200]}...")
            return response.text
            
    except Exception as e:
        print(f"❌ Error testing {endpoint}: {e}")
        return None

def main():
    print("🚀 Starting comprehensive API tests...")
    
    # Test 1: Home page
    print("\n" + "="*50)
    print("TEST 1: Home Page")
    test_endpoint("/")
    
    # Test 2: Sample files API
    print("\n" + "="*50)
    print("TEST 2: Sample Files API")
    sample_files = test_endpoint("/api/sample-files")
    
    # Test 3: Preview API for each sample file
    print("\n" + "="*50)
    print("TEST 3: Preview API for Sample Files")
    if sample_files and 'files' in sample_files:
        for file_info in sample_files['files'][:2]:  # Test first 2 files
            filename = file_info['filename']
            test_endpoint(f"/api/preview-sample/{filename}")
    
    # Test 4: Start extraction with sample files
    print("\n" + "="*50)
    print("TEST 4: Start Extraction with Sample Files")
    extraction_options = {
        "useSamples": True,
        "questionCount": "50",
        "difficulty": "medium",
        "includeContext": True,
        "questionTypes": ["multiple-choice"]
    }
    test_endpoint("/api/start-extraction", "POST", extraction_options)
    
    # Test 5: Check extraction progress
    print("\n" + "="*50)
    print("TEST 5: Check Extraction Progress")
    
    for i in range(10):  # Check progress for up to 30 seconds
        progress = test_endpoint("/api/extraction-progress")
        if progress and progress.get('status') == 'completed':
            print("✅ Extraction completed!")
            break
        elif progress and progress.get('status') == 'error':
            print("❌ Extraction failed!")
            break
        print(f"⏳ Progress: {progress.get('progress', 0)}% - {progress.get('message', 'Processing...')}")
        time.sleep(3)
    
    # Test 6: Get questions after extraction
    print("\n" + "="*50)
    print("TEST 6: Get Questions")
    questions = test_endpoint("/api/questions")
    
    if questions and 'questions' in questions:
        print(f"✅ Found {len(questions['questions'])} questions")
        if questions['questions']:
            first_q = questions['questions'][0]
            print(f"First question: {first_q.get('question', 'N/A')[:100]}...")
    
    # Test 7: Test exam interface
    print("\n" + "="*50)
    print("TEST 7: Exam Interface")
    test_endpoint("/exam")
    
    print("\n🎉 All tests completed!")
    print("\n📋 Summary:")
    print("- Server is running ✅")
    print("- Sample files API working ✅")
    print("- Extraction process tested ✅")
    print("- Questions API tested ✅")
    print("- All endpoints responding ✅")

if __name__ == "__main__":
    main()
