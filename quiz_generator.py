#!/usr/bin/env python3
"""
Advanced PyPDF Demo - Quiz Generator from PDF
This script demonstrates how to create a simple quiz generator using pypdf
to extract text from PDF files.
"""

import os
import re
from pypdf import PdfReader
from pathlib import Path
import random

def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF file."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            text += f"\n--- Page {page_num + 1} ---\n"
            text += page_text
            
        return text
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return None

def extract_sentences(text):
    """Extract sentences from text."""
    if not text:
        return []
    
    # Simple sentence splitting
    sentences = re.split(r'[.!?]+', text)
    
    # Clean up sentences
    cleaned_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        # Remove page markers and other formatting
        sentence = re.sub(r'--- Page \d+ ---', '', sentence)
        sentence = re.sub(r'\s+', ' ', sentence)  # Replace multiple spaces with single space
        
        # Keep sentences that are reasonable length and contain words
        if len(sentence) > 20 and len(sentence) < 200 and sentence.count(' ') > 3:
            cleaned_sentences.append(sentence)
    
    return cleaned_sentences

def create_fill_in_blank_questions(sentences, num_questions=5):
    """Create fill-in-the-blank questions from sentences."""
    questions = []
    
    for i in range(min(num_questions, len(sentences))):
        sentence = sentences[i]
        words = sentence.split()
        
        if len(words) < 5:
            continue
            
        # Choose a random word to blank out (avoid very short words)
        potential_words = [w for w in words if len(w) > 3 and w.isalpha()]
        
        if not potential_words:
            continue
            
        word_to_blank = random.choice(potential_words)
        question_text = sentence.replace(word_to_blank, "______", 1)
        
        questions.append({
            'question': question_text,
            'answer': word_to_blank,
            'original': sentence
        })
    
    return questions

def generate_quiz_from_pdf():
    """Main function to generate quiz from PDF files."""
    print("🎓 PDF Quiz Generator")
    print("=" * 50)
    
    sample_files_dir = Path("sample-files")
    if not sample_files_dir.exists():
        print("❌ Sample-files directory not found!")
        return
    
    pdf_files = list(sample_files_dir.glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found in sample-files directory!")
        return
    
    print(f"📚 Found {len(pdf_files)} PDF files in sample-files directory:")
    for pdf_file in pdf_files:
        file_size = pdf_file.stat().st_size
        print(f"  • {pdf_file.name} ({file_size:,} bytes)")
    
    # Try several PDFs to find one with good content
    print("\n🔍 Looking for PDFs with good content...")
    selected_pdf = None
    
    for pdf_file in pdf_files:
        print(f"  📖 Checking {pdf_file.name}...")
        test_text = extract_text_from_pdf(pdf_file)
        if test_text and len(test_text) > 500:  # At least 500 characters
            selected_pdf = pdf_file
            print(f"  ✅ Selected PDF with good content: {selected_pdf.name}")
            break
        else:
            text_length = len(test_text) if test_text else 0
            print(f"  ⏭️  Skipping {pdf_file.name} (only {text_length} characters)")
    
    if not selected_pdf:
        # Fallback to first PDF
        selected_pdf = pdf_files[0]
        print(f"  📖 Using first available PDF: {selected_pdf.name}")
    
    # Extract text
    print("🔍 Extracting text from PDF...")
    text = extract_text_from_pdf(selected_pdf)
    
    if not text:
        print("❌ Failed to extract text from PDF")
        return
    
    print(f"📝 Extracted {len(text)} characters of text")
    
    # Extract sentences
    sentences = extract_sentences(text)
    print(f"📄 Found {len(sentences)} usable sentences")
    
    if len(sentences) < 3:
        print("❌ Not enough content to create a meaningful quiz")
        return
    
    # Create questions
    print("🎯 Generating quiz questions...")
    questions = create_fill_in_blank_questions(sentences, num_questions=10)  # Try to create more questions
    
    if not questions:
        print("❌ Could not generate any questions")
        print("💡 This might happen if the PDF contains mostly technical content, diagrams, or short phrases")
        return
    
    # Display quiz
    print(f"\n🎊 Quiz Generated Successfully! ({len(questions)} questions)")
    print("=" * 70)
    print(f"📖 Source: {selected_pdf.name}")
    print(f"📄 Total text length: {len(text):,} characters")
    print(f"📝 Sentences analyzed: {len(sentences)}")
    print("-" * 70)
    
    for i, q in enumerate(questions, 1):
        print(f"\n📝 Question {i}:")
        print(f"   Fill in the blank: {q['question']}")
        print(f"   💡 Answer: {q['answer']}")
        print(f"   📄 Context: ...{q['original'][:80]}...")
    
    print(f"\n" + "=" * 70)
    print("🎉 Quiz generation complete!")
    print(f"\n📊 Summary:")
    print(f"  • Source file: {selected_pdf.name}")
    print(f"  • Questions generated: {len(questions)}")
    print(f"  • Text processed: {len(text):,} characters")
    print(f"  • Sentences analyzed: {len(sentences)}")
    
    print("\n💡 This demonstrates how pypdf can be used to:")
    print("  • Extract text from PDF documents")
    print("  • Process and analyze PDF content")
    print("  • Create educational tools from existing documents")
    print("  • Build automated content analysis systems")

if __name__ == "__main__":
    generate_quiz_from_pdf()
