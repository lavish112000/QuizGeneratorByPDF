#!/usr/bin/env python3
"""
Enhanced PDF Quiz Generator - Multiple PDF Analysis
This version analyzes all PDFs and creates a comprehensive quiz.
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
            text += page_text + " "
            
        return text
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return None

def extract_sentences(text):
    """Extract sentences from text."""
    if not text:
        return []
    
    # Clean up text first
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with single space
    text = re.sub(r'[^\w\s.,!?;:]', '', text)  # Keep basic punctuation
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', text)
    
    # Clean up sentences
    cleaned_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        
        # Keep sentences that are reasonable length and contain words
        if 15 < len(sentence) < 150 and sentence.count(' ') > 2:
            # Avoid sentences that are mostly numbers or single words
            words = sentence.split()
            if len([w for w in words if w.isalpha() and len(w) > 2]) >= 3:
                cleaned_sentences.append(sentence)
    
    return cleaned_sentences

def create_fill_in_blank_questions(sentences, num_questions=8):
    """Create fill-in-the-blank questions from sentences."""
    questions = []
    used_sentences = set()
    
    # Shuffle sentences for variety
    shuffled_sentences = sentences.copy()
    random.shuffle(shuffled_sentences)
    
    for sentence in shuffled_sentences:
        if len(questions) >= num_questions:
            break
            
        if sentence in used_sentences:
            continue
            
        words = sentence.split()
        
        if len(words) < 4:
            continue
            
        # Choose a meaningful word to blank out
        potential_words = []
        for i, word in enumerate(words):
            # Skip common words and very short words
            if (len(word) > 3 and 
                word.lower() not in ['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'will'] and
                word.isalpha() and
                not word.isupper()):  # Skip all caps words
                potential_words.append((i, word))
        
        if not potential_words:
            continue
            
        # Choose a random word from potential words
        word_index, word_to_blank = random.choice(potential_words)
        
        # Create the question
        question_words = words.copy()
        question_words[word_index] = "______"
        question_text = " ".join(question_words)
        
        questions.append({
            'question': question_text,
            'answer': word_to_blank,
            'original': sentence
        })
        
        used_sentences.add(sentence)
    
    return questions

def analyze_all_pdfs():
    """Analyze all PDFs and create a comprehensive quiz."""
    print("🎓 Enhanced PDF Quiz Generator")
    print("🔍 Analyzing Multiple PDF Files")
    print("=" * 60)
    
    sample_files_dir = Path("sample-files")
    if not sample_files_dir.exists():
        print("❌ Sample-files directory not found!")
        return
    
    pdf_files = list(sample_files_dir.glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found in sample-files directory!")
        return
    
    print(f"📚 Found {len(pdf_files)} PDF files:")
    
    all_sentences = []
    pdf_analysis = []
    
    for pdf_file in pdf_files:
        print(f"\n📖 Analyzing {pdf_file.name}...")
        
        text = extract_text_from_pdf(pdf_file)
        if text:
            sentences = extract_sentences(text)
            pdf_info = {
                'filename': pdf_file.name,
                'text_length': len(text),
                'sentences': len(sentences),
                'file_size': pdf_file.stat().st_size
            }
            pdf_analysis.append(pdf_info)
            all_sentences.extend(sentences)
            print(f"  ✅ Extracted {len(text):,} characters, {len(sentences)} sentences")
        else:
            print(f"  ❌ Failed to extract text")
    
    if not all_sentences:
        print("❌ No content could be extracted from any PDF")
        return
    
    print(f"\n📊 Analysis Summary:")
    print(f"  📄 Total PDFs processed: {len(pdf_analysis)}")
    print(f"  📝 Total sentences extracted: {len(all_sentences)}")
    print(f"  💾 Total content: {sum(p['text_length'] for p in pdf_analysis):,} characters")
    
    # Generate quiz from all content
    print(f"\n🎯 Generating comprehensive quiz...")
    questions = create_fill_in_blank_questions(all_sentences, num_questions=15)
    
    if not questions:
        print("❌ Could not generate any questions")
        return
    
    # Display quiz
    print(f"\n🎊 Comprehensive Quiz Generated!")
    print("=" * 70)
    print(f"📚 Sources: {', '.join([p['filename'] for p in pdf_analysis])}")
    print(f"📝 Questions created: {len(questions)}")
    print("-" * 70)
    
    for i, q in enumerate(questions, 1):
        print(f"\n🎯 Question {i}:")
        print(f"   {q['question']}")
        print(f"   💡 Answer: {q['answer']}")
    
    print(f"\n" + "=" * 70)
    print("🏆 Quiz Generation Complete!")
    print(f"\n📈 Performance Metrics:")
    for pdf_info in pdf_analysis:
        print(f"  📄 {pdf_info['filename']}: {pdf_info['sentences']} sentences from {pdf_info['text_length']:,} chars")
    
    return questions

if __name__ == "__main__":
    quiz_questions = analyze_all_pdfs()
    if quiz_questions:
        print(f"\n🎉 Ready to use {len(quiz_questions)} quiz questions!")
