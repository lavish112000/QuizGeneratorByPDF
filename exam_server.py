#!/usr/bin/env python3
"""
Web Server for PDF Quiz Exam Interface
Serves the quiz questions generated from PDF files via a web API.
Enhanced with multi-format file support (PDF, TXT, DOCX, DOC)
"""

from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
import re
from pypdf import PdfReader
from pathlib import Path
import random
import threading
import time
from datetime import datetime
from advanced_quiz_extractor import AdvancedQuizExtractor
import secrets
import hashlib

# Additional imports for multi-format support
try:
    import docx
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("⚠️ python-docx not available. DOCX support disabled.")

# Gemini AI imports
try:
    import google.generativeai as genai
    from dotenv import load_dotenv
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ Gemini AI not available. Install with: pip install google-generativeai python-dotenv")

try:
    import win32com.client
    DOC_AVAILABLE = True
except ImportError:
    DOC_AVAILABLE = False
    print("⚠️ pywin32 not available. DOC support disabled.")

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Security settings
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
CSRF_TOKENS = set()

# Gemini AI Configuration
gemini_model = None
if GEMINI_AVAILABLE:
    try:
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel('gemini-pro')
            print("✅ Gemini AI configured successfully")
        else:
            print("⚠️ GEMINI_API_KEY not found in environment variables")
    except Exception as e:
        print(f"❌ Failed to configure Gemini AI: {e}")
        gemini_model = None
else:
    print("⚠️ Gemini AI not available")

# Input sanitization function
def sanitize_input(text):
    """Sanitize user input to prevent XSS and other attacks"""
    if not text:
        return ""
    
    # Remove potentially dangerous HTML/script tags
    text = re.sub(r'<[^>]*>', '', str(text))
    
    # Remove script tags and their content
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove javascript: URLs
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    
    # Remove data: URLs that might contain scripts
    text = re.sub(r'data:text/html', '', text, flags=re.IGNORECASE)
    
    # Limit length to prevent buffer overflow attacks
    if len(text) > 10000:
        text = text[:10000] + "..."
    
    return text.strip()

# CSRF protection functions
def generate_csrf_token():
    """Generate a secure CSRF token"""
    token = secrets.token_urlsafe(32)
    CSRF_TOKENS.add(token)
    return token

def validate_csrf_token(token):
    """Validate CSRF token and remove it from valid tokens"""
    if token in CSRF_TOKENS:
        CSRF_TOKENS.discard(token)
        return True
    return False

def require_csrf(f):
    """Decorator to require CSRF token for POST requests"""
    def wrapper(*args, **kwargs):
        if request.method == 'POST':
            token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
            if not token or not validate_csrf_token(token):
                return jsonify({'error': 'Invalid CSRF token'}), 403
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

# Global variables for progress tracking
extraction_progress = {
    'status': 'idle',
    'progress': 0,
    'message': 'Ready to start',
    'questions_found': 0,
    'current_file': ''
}

class WebQuizGenerator:
    def __init__(self):
        self.questions = []
        self.extractor = AdvancedQuizExtractor()
        
    def load_questions_from_pdfs_with_progress(self):
        """Load questions from PDFs with progress tracking."""
        global extraction_progress
        
        try:
            extraction_progress.update({
                'status': 'starting',
                'progress': 5,
                'message': 'Initializing PDF processor...',
                'questions_found': 0,
                'current_file': ''
            })
            time.sleep(1)
            
            sample_files_dir = Path("sample-files")
            if not sample_files_dir.exists():
                extraction_progress.update({
                    'status': 'error',
                    'message': 'Sample-files directory not found!',
                    'progress': 0
                })
                return
            
            # Support all file types: PDF, TXT, DOCX, DOC
            pdf_files = list(sample_files_dir.glob("*.pdf"))
            txt_files = list(sample_files_dir.glob("*.txt"))
            docx_files = list(sample_files_dir.glob("*.docx")) + list(sample_files_dir.glob("*.doc"))
            all_files = pdf_files + txt_files + docx_files
            
            if not all_files:
                extraction_progress.update({
                    'status': 'error',
                    'message': 'No supported files found! (PDF, TXT, DOCX, DOC)',
                    'progress': 0
                })
                return
            
            extraction_progress.update({
                'status': 'processing',
                'progress': 10,
                'message': f'Found {len(all_files)} files. Starting extraction...',
                'current_file': ''
            })
            time.sleep(1)
            
            all_questions = []
            total_files = len(all_files)
            
            for i, file_path in enumerate(all_files):
                file_progress = 10 + (i * 70 // total_files)
                extraction_progress.update({
                    'status': 'processing',
                    'progress': file_progress,
                    'message': f'Processing {file_path.name}...',
                    'current_file': file_path.name,
                    'questions_found': len(all_questions)
                })
                
                # Extract text from file (PDF, TXT, or DOCX)
                full_text, page_texts = self.extractor.extract_text_from_file(str(file_path))
                if not full_text:
                    continue
                
                # Extract quiz questions
                quiz_questions = self.extractor.extract_quiz_questions(full_text)
                
                # If not enough structured questions, generate fill-in-the-blanks
                if len(quiz_questions) < 10:
                    blank_questions = self.extractor.extract_fill_in_blanks(full_text)
                    quiz_questions.extend(blank_questions[:25])  # Add up to 25 per file
                
                all_questions.extend(quiz_questions)
                
                extraction_progress.update({
                    'questions_found': len(all_questions)
                })
                
                # If we have enough questions, break
                if len(all_questions) >= 100:
                    break
                
                time.sleep(0.5)  # Small delay for visual progress
            
            extraction_progress.update({
                'status': 'finalizing',
                'progress': 85,
                'message': 'Finalizing questions and formatting...',
                'questions_found': len(all_questions)
            })
            time.sleep(1)
            
            # Ensure unique IDs and limit to 100 questions
            final_questions = all_questions[:100]
            for i, question in enumerate(final_questions):
                question['id'] = i + 1
            
            self.questions = final_questions
            
            extraction_progress.update({
                'status': 'completed',
                'progress': 100,
                'message': f'Successfully extracted {len(self.questions)} questions!',
                'questions_found': len(self.questions)
            })
            
            print(f"✅ Extraction completed: {len(self.questions)} questions ready")
            
        except Exception as e:
            extraction_progress.update({
                'status': 'error',
                'progress': 0,
                'message': f'Error during extraction: {str(e)}',
                'questions_found': 0
            })
            print(f"❌ Error in extraction: {e}")
            # Load fallback questions
            self.questions = self.get_fallback_questions()
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract all text from a PDF file."""
        try:
            reader = PdfReader(pdf_path)
            text = ""
            
            for page in reader.pages:
                page_text = page.extract_text()
                text += page_text + " "
                
            return text
        except Exception as e:
            print(f"Error reading PDF {pdf_path}: {e}")
            return None

    def extract_meaningful_sentences(self, text):
        """Extract meaningful sentences suitable for quiz questions."""
        if not text:
            return []
        
        # Clean up text
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s.,!?;:-]', '', text)
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        
        cleaned_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Filter for educational content
            if (20 < len(sentence) < 120 and 
                sentence.count(' ') > 3 and
                not re.search(r'\d{4}', sentence) and  # Avoid years/numbers
                not sentence.startswith('Q ') and      # Avoid question numbers
                not sentence.startswith('Page ') and   # Avoid page numbers
                'CHSL' not in sentence and             # Avoid exam references
                len([w for w in sentence.split() if w.isalpha() and len(w) > 2]) >= 4):
                cleaned_sentences.append(sentence)
        
        return cleaned_sentences

    def create_quiz_questions(self, sentences, num_questions=15):
        """Create quiz questions from sentences."""
        questions = []
        used_sentences = set()
        
        random.shuffle(sentences)
        
        for sentence in sentences:
            if len(questions) >= num_questions:
                break
                
            if sentence in used_sentences:
                continue
                
            words = sentence.split()
            
            # Find good words to blank out
            important_words = []
            for i, word in enumerate(words):
                if (len(word) > 4 and 
                    word.isalpha() and
                    word.lower() not in ['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'will', 'when', 'where', 'which', 'their', 'there', 'these', 'those'] and
                    not word.isupper()):
                    important_words.append((i, word))
            
            if len(important_words) < 1:
                continue
                
            # Select the best word to blank
            word_index, word_to_blank = random.choice(important_words)
            
            # Create the question
            question_words = words.copy()
            question_words[word_index] = "______"
            question_text = " ".join(question_words)
            
            # Generate multiple choice options
            options = [word_to_blank]
            
            # Add some generic wrong options
            wrong_options = ['system', 'process', 'method', 'approach', 'factor', 'element', 'aspect', 'concept', 'principle', 'structure', 'important', 'significant', 'essential', 'necessary', 'required', 'appropriate', 'suitable', 'correct', 'proper', 'effective']
            
            for wrong in wrong_options:
                if (wrong != word_to_blank.lower() and 
                    len(options) < 4 and 
                    wrong not in [opt.lower() for opt in options]):
                    formatted_wrong = wrong.capitalize() if word_to_blank[0].isupper() else wrong
                    options.append(formatted_wrong)
            
            # Ensure we have exactly 4 options
            while len(options) < 4:
                options.append(f"Option{len(options)}")
            
            # Shuffle options and determine correct answer
            correct_answer_text = word_to_blank
            random.shuffle(options)
            correct_index = options.index(correct_answer_text)
            correct_letter = chr(65 + correct_index)  # A, B, C, D
            
            # Format options as A. option, B. option, etc.
            formatted_options = [f"{chr(65 + i)}. {opt}" for i, opt in enumerate(options)]
            
            questions.append({
                'id': len(questions) + 1,
                'text': question_text,
                'options': formatted_options,
                'correct': correct_letter,
                'correct_text': correct_answer_text,
                'original': sentence
            })
            
            used_sentences.add(sentence)
        
        return questions

    def load_questions_from_sample_files(self):
        """Load questions from all supported files in sample-files directory."""
        sample_files_dir = Path("sample-files")
        if not sample_files_dir.exists():
            print("Sample-files directory not found!")
            return
        
        # Support all file types
        pdf_files = list(sample_files_dir.glob("*.pdf"))
        txt_files = list(sample_files_dir.glob("*.txt"))
        docx_files = list(sample_files_dir.glob("*.docx")) + list(sample_files_dir.glob("*.doc"))
        all_files = pdf_files + txt_files + docx_files
        
        if not all_files:
            print("No supported files found!")
            return
        
        print(f"Processing {len(all_files)} files ({len(pdf_files)} PDFs, {len(txt_files)} TXTs, {len(docx_files)} DOCX)...")
        
        all_sentences = []
        for file_path in all_files:
            print(f"Reading {pdf_file.name}...")
            text = self.extract_text_from_pdf(pdf_file)
            if text:
                sentences = self.extract_meaningful_sentences(text)
                all_sentences.extend(sentences)
                print(f"Added {len(sentences)} sentences from {pdf_file.name}")
        
        if all_sentences:
            self.questions = self.create_quiz_questions(all_sentences, num_questions=20)
            print(f"Generated {len(self.questions)} quiz questions")
        else:
            # Fallback questions if PDF processing fails
            self.questions = self.get_fallback_questions()
            print("Using fallback questions")

    def get_fallback_questions(self):
        """Fallback questions if PDF processing fails."""
        return [
            {
                "id": 1,
                "text": "But just then, both of them were ______ by the soldiers",
                "options": ["A. system", "B. process", "C. method", "D. captured"],
                "correct": "D",
                "correct_text": "captured"
            },
            {
                "id": 2,
                "text": "______ is not innocent such as Uday",
                "options": ["A. Method", "B. System", "C. Process", "D. Harmit"],
                "correct": "D",
                "correct_text": "Harmit"
            },
            {
                "id": 3,
                "text": "The following ______ has been divided into four segments",
                "options": ["A. process", "B. sentence", "C. method", "D. system"],
                "correct": "B",
                "correct_text": "sentence"
            },
            {
                "id": 4,
                "text": "If there is no need to substitute it, select No substitution ______",
                "options": ["A. method", "B. required", "C. process", "D. system"],
                "correct": "B",
                "correct_text": "required"
            },
            {
                "id": 5,
                "text": "But, when the ______ was thrown in front of the lion, the lion licked him and quietly sat beside him",
                "options": ["A. system", "B. slave", "C. method", "D. process"],
                "correct": "B",
                "correct_text": "slave"
            },
            {
                "id": 6,
                "text": "______ out a tower of pots",
                "options": ["A. knock", "B. process", "C. method", "D. system"],
                "correct": "A",
                "correct_text": "knock"
            },
            {
                "id": 7,
                "text": "The following sentence has been divided into four ______",
                "options": ["A. method", "B. system", "C. process", "D. segments"],
                "correct": "D",
                "correct_text": "segments"
            },
            {
                "id": 8,
                "text": "How is the structure of health infrastructure and health care system in ______",
                "options": ["A. Process", "B. Method", "C. System", "D. India"],
                "correct": "D",
                "correct_text": "India"
            },
            {
                "id": 9,
                "text": "Parts of the following sentence have been underlined and given as ______",
                "options": ["A. options", "B. process", "C. system", "D. method"],
                "correct": "A",
                "correct_text": "options"
            },
            {
                "id": 10,
                "text": "Read the passage carefully and select the most ______ option to fill in each blank",
                "options": ["A. appropriate", "B. process", "C. system", "D. method"],
                "correct": "A",
                "correct_text": "appropriate"
            }
        ]

# Initialize the quiz generator lazily
quiz_generator = None

def get_quiz_generator():
    """Get or create the quiz generator instance."""
    global quiz_generator
    if quiz_generator is None:
        quiz_generator = WebQuizGenerator()
    return quiz_generator

@app.route('/')
def index():
    """Serve the file selector interface."""
    return send_from_directory('.', 'index.html')

@app.route('/debug')
def debug_test():
    """Serve the debug test page."""
    return send_from_directory('.', 'debug_test.html')

@app.route('/file-selector.js')
def serve_file_selector_js():
    """Serve the file selector JavaScript."""
    return send_from_directory('.', 'file-selector.js', mimetype='application/javascript')

@app.route('/api/csrf-token')
def get_csrf_token():
    """Get a CSRF token for form submissions"""
    return jsonify({'csrf_token': generate_csrf_token()})

@app.route('/api/extract-gemini', methods=['POST'])
@require_csrf
def extract_with_gemini():
    """Extract quiz data using Gemini AI for enhanced accuracy."""
    if not gemini_model:
        return jsonify({'error': 'Gemini AI not configured'}), 503

    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400

    extracted_questions = []
    total_files = len(files)

    for i, file in enumerate(files):
        try:
            # Extract text from file
            filename = file.filename
            file_content = file.read()

            # Convert bytes to text (assuming UTF-8)
            try:
                text_content = file_content.decode('utf-8')
            except UnicodeDecodeError:
                return jsonify({'error': f'File {filename} is not a valid text file'}), 400

            # Create Gemini prompt for quiz extraction
            prompt = f"""
            Analyze the following text and extract quiz questions in JSON format.
            Look for questions, answers, and any educational content that can be converted into multiple-choice questions.

            For each question, provide:
            - id: A unique number
            - text: The question text
            - options: An array of 4 options (A, B, C, D)
            - correct: The correct answer letter (A, B, C, or D)

            If the text contains fill-in-the-blank questions (with ______ or blanks), convert them to multiple choice.
            Generate appropriate answer options if they're not provided in the text.

            Return ONLY a valid JSON array of question objects. No markdown formatting.

            Text content:
            ---
            {text_content}
            ---
            """

            # Call Gemini API
            response = gemini_model.generate_content(prompt)

            if response and response.text:
                try:
                    # Clean up the response
                    json_text = response.text.strip()

                    # Remove markdown code blocks if present
                    if json_text.startswith('```json'):
                        json_text = json_text[7:]
                    if json_text.startswith('```'):
                        json_text = json_text[3:]
                    if json_text.endswith('```'):
                        json_text = json_text[:-3]

                    json_text = json_text.strip()

                    # Parse the JSON
                    questions_data = json.loads(json_text)

                    if isinstance(questions_data, list):
                        # Add file info and adjust IDs
                        for q in questions_data:
                            q['source_file'] = filename
                            q['id'] = len(extracted_questions) + q.get('id', 1)
                            extracted_questions.append(q)
                    else:
                        # Single question object
                        questions_data['source_file'] = filename
                        questions_data['id'] = len(extracted_questions) + 1
                        extracted_questions.append(questions_data)

                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse Gemini response for {filename}: {e}")
                    print(f"Response text: {response.text[:500]}...")
                    continue

        except Exception as e:
            print(f"❌ Error processing file {file.filename}: {e}")
            continue

    if not extracted_questions:
        return jsonify({'error': 'No questions could be extracted from the uploaded files'}), 400

    return jsonify({
        'success': True,
        'questions': extracted_questions,
        'total_questions': len(extracted_questions),
        'extraction_method': 'gemini_ai'
    })

@app.route('/api/sample-files')
def get_sample_files():
    """Get list of available sample files."""
    sample_files_dir = Path("sample-files")
    files = []
    
    if sample_files_dir.exists():
        for file_path in sample_files_dir.glob("*.*"):
            if file_path.suffix.lower() in ['.pdf', '.txt', '.docx', '.doc']:
                file_size = file_path.stat().st_size
                # Format file size
                if file_size >= 1024 * 1024:
                    size_str = f"{file_size / (1024 * 1024):.1f} MB"
                elif file_size >= 1024:
                    size_str = f"{file_size / 1024:.1f} KB"
                else:
                    size_str = f"{file_size} B"
                    
                files.append({
                    'name': file_path.name,
                    'size': size_str,
                    'type': file_path.suffix[1:].lower(),
                    'description': f"Sample {file_path.suffix[1:].upper()} file for quiz generation"
                })
    
    return jsonify(files)

@app.route('/api/upload', methods=['POST'])
@require_csrf
def upload_files():
    """Handle file uploads."""
    print(f"🔍 Upload request received. Content-Type: {request.content_type}")
    print(f"🔍 Request files keys: {list(request.files.keys())}")
    print(f"🔍 Request form keys: {list(request.form.keys())}")
    
    if 'files' not in request.files:
        print("❌ No 'files' key in request.files")
        return jsonify({'error': 'No files uploaded', 'detail': 'files key missing'}), 400
    
    files = request.files.getlist('files')
    print(f"🔍 Found {len(files)} files in request")
    
    if not files or all(f.filename == '' for f in files):
        print("❌ No files with filenames found")
        return jsonify({'error': 'No files with valid filenames', 'detail': 'empty files'}), 400
    
    uploaded_files = []
    
    for i, file in enumerate(files):
        print(f"🔍 Processing file {i}: filename='{file.filename}', content_type='{file.content_type}'")
        if file.filename:
            try:
                file_content = file.read()
                file_size = len(file_content)
                print(f"📄 File {file.filename}: {file_size} bytes")
                
                uploaded_files.append({
                    'name': file.filename,
                    'size': file_size,
                    'type': file.filename.split('.')[-1].lower()
                })
                file.seek(0)  # Reset file pointer
            except Exception as e:
                print(f"❌ Error processing file {file.filename}: {e}")
                return jsonify({'error': f'Error processing file {file.filename}', 'detail': str(e)}), 400
    
    print(f"✅ Successfully processed {len(uploaded_files)} files")
    return jsonify({'files': uploaded_files})

@app.route('/extract')
def extract_page():
    """Redirect to main page - extraction is now integrated."""
    return send_from_directory('.', 'index.html')

@app.route('/api/preview-samples')
def preview_samples():
    """API endpoint to preview sample file contents."""
    try:
        sample_files = []
        content = ""
        metadata = []
        
        # Get list of all supported files in sample-files directory
        sample_files_dir = Path('sample-files')
        if sample_files_dir.exists():
            pdf_files = list(sample_files_dir.glob('*.pdf'))
            txt_files = list(sample_files_dir.glob('*.txt'))
            docx_files = list(sample_files_dir.glob('*.docx')) + list(sample_files_dir.glob('*.doc'))
            all_files = (pdf_files + txt_files + docx_files)[:3]  # Limit to first 3 files for preview
            
            for file_path in all_files:
                try:
                    # Get file metadata
                    stat = pdf_file.stat()
                    # Get file metadata
                    stat = file_path.stat()
                    metadata.append({
                        'name': file_path.name,
                        'size': f"{stat.st_size / 1024:.1f} KB",
                        'lastModified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                        'type': file_path.suffix.upper()[1:] if file_path.suffix else 'FILE'
                    })
                    
                    # Try to extract some content for preview
                    try:
                        if file_path.suffix.lower() == '.pdf':
                            with open(file_path, 'rb') as file:
                                pdf_reader = PdfReader(file)
                                if len(pdf_reader.pages) > 0:
                                    first_page = pdf_reader.pages[0]
                                    page_text = first_page.extract_text()[:300]
                                    content += f"\n--- {file_path.name} ---\n{page_text}...\n"
                        elif file_path.suffix.lower() in ['.txt', '.docx', '.doc']:
                            # Use the extractor to get text from all file types
                            extractor = AdvancedQuizExtractor()
                            file_text, _ = extractor.extract_text_from_file(str(file_path))
                            if file_text:
                                content += f"\n--- {file_path.name} ---\n{file_text[:300]}...\n"
                                # Extract text from first page
                                page_text = pdf_reader.pages[0].extract_text()
                                content += f"\n\n=== {pdf_file.name} ===\n\n"
                                content += page_text[:500] + ("..." if len(page_text) > 500 else "")
                                
                                # Update metadata with page count
                                metadata[-1]['pages'] = len(pdf_reader.pages)
                    except Exception as e:
                        content += f"\n\n=== {pdf_file.name} ===\n\nError reading PDF: {str(e)}"
                        
                except Exception as e:
                    print(f"Error processing {pdf_file}: {e}")
                    continue
        
        if not metadata:
            return jsonify({
                'success': False,
                'message': 'No sample files found',
                'content': 'No sample PDF files available for preview.',
                'metadata': []
            })
        
        return jsonify({
            'success': True,
            'content': content.strip(),
            'metadata': metadata
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Preview failed: {str(e)}',
            'content': 'Failed to load sample files.',
            'metadata': []
        }), 500

@app.route('/api/start-extraction', methods=['POST'])
@require_csrf
def start_extraction():
    """Start the question extraction process in background."""
    global extraction_progress
    
    # Get extraction options from request
    data = request.get_json() or {}
    options = {
        'questionCount': int(data.get('questionCount', 50)),
        'includeContext': data.get('includeContext', True),
        'difficulty': data.get('difficulty', 'medium'),
        'questionTypes': data.get('questionTypes', ['mcq']),
        'useSamples': data.get('useSamples', False)
    }
    
    print(f"🎯 Starting extraction with options: {options}")
    
    # Reset progress
    extraction_progress = {
        'status': 'starting',
        'progress': 0,
        'message': 'Initializing extraction...',
        'questions_found': 0,
        'current_file': ''
    }
    
    def run_extraction():
        try:
            generator = get_quiz_generator()
            if options['useSamples']:
                # Use sample files
                generator.load_questions_from_pdfs_with_progress()
            else:
                # Process uploaded files (if any)
                generator.load_questions_from_pdfs_with_progress()
        except Exception as e:
            global extraction_progress
            extraction_progress.update({
                'status': 'error',
                'message': f'Extraction failed: {str(e)}'
            })
            print(f"❌ Extraction error: {e}")
    
    # Start extraction in background thread
    thread = threading.Thread(target=run_extraction)
    thread.daemon = True
    thread.start()
    
    return jsonify({'status': 'started', 'options': options})

@app.route('/api/extraction-progress')
def get_extraction_progress():
    """Get the current extraction progress."""
    return jsonify(extraction_progress)

@app.route('/exam')
def exam():
    """Serve the advanced exam interface page."""
    try:
        with open('advanced_exam_interface.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        return html_content
    except FileNotFoundError:
        return '''
        <h1>Error: Advanced exam interface files not found</h1>
        <p>Please make sure advanced_exam_interface.html, styles.css, and script_api.js are in the same directory as this server.</p>
        <p>Files needed:</p>
        <ul>
            <li>advanced_exam_interface.html</li>
            <li>styles.css</li>
            <li>script_api.js</li>
        </ul>
        <a href="/">← Back to Home</a>
        '''

@app.route('/api/questions')
def get_questions():
    """API endpoint to get all quiz questions."""
    generator = get_quiz_generator()
    if not generator.questions:
        # If no questions loaded, return fallback
        generator.questions = generator.get_fallback_questions()
    
    return jsonify({
        'questions': generator.questions,
        'total': len(generator.questions),
        'status': 'success',
        'source': 'Advanced PDF Extraction' if len(generator.questions) > 10 else 'Fallback Questions'
    })

@app.route('/api/submit', methods=['POST'])
@require_csrf
def submit_exam():
    """API endpoint to submit exam answers with input validation."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        answers = data.get('answers', {})
        time_taken = data.get('time_taken', 0)
        
        # Validate and sanitize inputs
        if not isinstance(answers, dict):
            return jsonify({'error': 'Invalid answers format'}), 400
        
        if not isinstance(time_taken, (int, float)) or time_taken < 0:
            return jsonify({'error': 'Invalid time_taken value'}), 400
        
        # Sanitize answers
        sanitized_answers = {}
        for key, value in answers.items():
            # Validate key is numeric string
            if not isinstance(key, str) or not key.isdigit():
                continue
            # Validate value is valid option (1-4)
            if not isinstance(value, str) or value not in ['1', '2', '3', '4']:
                continue
            sanitized_answers[key] = value
        
        answers = sanitized_answers
        
        # Calculate results
        generator = get_quiz_generator()
        correct = 0
        total = len(generator.questions)
        
        for question in generator.questions:
            user_answer = answers.get(str(question['id']))
            if user_answer:
                # Convert user answer (1,2,3,4) to letter (A,B,C,D)
                answer_letter = chr(64 + int(user_answer))
                if answer_letter == question['correct']:
                    correct += 1
        
        percentage = round((correct / total) * 100) if total > 0 else 0
        
        result = {
            'total': total,
            'correct': correct,
            'incorrect': len(answers) - correct,
            'unattempted': total - len(answers),
            'percentage': percentage,
            'time_taken': time_taken,
            'status': 'submitted'
        }
        
        return jsonify(result)
    except Exception as e:
        print(f"❌ Error in submit_exam: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/styles.css')
def serve_styles():
    """Serve the CSS file."""
    try:
        with open('styles.css', 'r', encoding='utf-8') as f:
            css_content = f.read()
        response = app.response_class(css_content, mimetype='text/css')
        return response
    except FileNotFoundError:
        return "/* CSS file not found */", 404

@app.route('/script_api.js')
def serve_script():
    """Serve the JavaScript file."""
    try:
        with open('script_api.js', 'r', encoding='utf-8') as f:
            js_content = f.read()
        response = app.response_class(js_content, mimetype='application/javascript')
        return response
    except FileNotFoundError:
        return "// JavaScript file not found", 404

@app.route('/api/regenerate')
def regenerate_questions():
    """Regenerate questions from PDFs with progress tracking."""
    global extraction_progress
    
    # Reset progress
    extraction_progress = {
        'status': 'idle',
        'progress': 0,
        'message': 'Ready to regenerate',
        'questions_found': 0,
        'current_file': ''
    }
    
    # Start regeneration in background
    def run_regeneration():
        generator = get_quiz_generator()
        generator.load_questions_from_pdfs_with_progress()
    
    thread = threading.Thread(target=run_regeneration)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'message': 'Question regeneration started',
        'status': 'started'
    })

if __name__ == '__main__':
    print("🎓 Starting PDF Quiz Exam Server...")
    print("📚 Quiz generator will be initialized on first use")
    print("🌐 Server starting at http://localhost:5000")
    print("🚀 Go to http://localhost:5000/ to start file selection")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
