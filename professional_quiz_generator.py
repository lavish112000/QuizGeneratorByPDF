#!/usr/bin/env python3
"""
Professional Quiz Generator from PDF Files
Creates properly formatted quiz questions for educational use.
"""

import os
import re
from pypdf import PdfReader
from pathlib import Path
import random
from datetime import datetime

def extract_text_from_pdf(pdf_path):
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

def extract_meaningful_sentences(text):
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

def create_professional_quiz(sentences, num_questions=10):
    """Create professional quiz questions."""
    questions = []
    used_sentences = set()
    
    random.shuffle(sentences)
    
    for sentence in sentences:
        if len(questions) >= num_questions:
            break
            
        if sentence in used_sentences:
            continue
            
        words = sentence.split()
        
        # Find good words to blank out (nouns, verbs, adjectives)
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
        
        # Create multiple choice options
        question_words = words.copy()
        question_words[word_index] = "______"
        question_text = " ".join(question_words)
        
        # Generate plausible wrong answers (this is simplified)
        options = [word_to_blank]
        # Add some generic wrong options
        wrong_options = ['system', 'process', 'method', 'approach', 'factor', 'element', 'aspect', 'concept', 'principle', 'structure']
        for wrong in wrong_options:
            if wrong != word_to_blank.lower() and len(options) < 4:
                options.append(wrong.capitalize() if word_to_blank[0].isupper() else wrong)
        
        # Shuffle options
        random.shuffle(options)
        correct_answer = chr(65 + options.index(word_to_blank))  # A, B, C, D
        
        questions.append({
            'question': question_text,
            'options': options[:4],  # Ensure exactly 4 options
            'correct_answer': correct_answer,
            'answer_text': word_to_blank,
            'original': sentence
        })
        
        used_sentences.add(sentence)
    
    return questions

def save_quiz_to_file(questions, filename="generated_quiz.txt"):
    """Save the quiz to a text file."""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("QUIZ GENERATED FROM PDF FILES\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Questions: {len(questions)}\n")
        f.write("=" * 80 + "\n\n")
        
        for i, q in enumerate(questions, 1):
            f.write(f"Question {i}:\n")
            f.write(f"{q['question']}\n\n")
            
            for j, option in enumerate(q['options']):
                f.write(f"{chr(65 + j)}. {option}\n")
            
            f.write(f"\nCorrect Answer: {q['correct_answer']} ({q['answer_text']})\n")
            f.write("-" * 50 + "\n\n")
        
        f.write("\nANSWER KEY:\n")
        f.write("-" * 20 + "\n")
        for i, q in enumerate(questions, 1):
            f.write(f"{i}. {q['correct_answer']}\n")

def main():
    """Main function to generate professional quiz."""
    print("🎓 Professional Quiz Generator")
    print("📚 Creating Quiz from PDF Files")
    print("=" * 50)
    
    sample_files_dir = Path("sample-files")
    if not sample_files_dir.exists():
        print("❌ Sample-files directory not found!")
        return
    
    pdf_files = list(sample_files_dir.glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found!")
        return
    
    print(f"📖 Processing {len(pdf_files)} PDF files...")
    
    all_sentences = []
    processed_files = 0
    
    for pdf_file in pdf_files:
        print(f"  📄 Reading {pdf_file.name}...")
        text = extract_text_from_pdf(pdf_file)
        if text:
            sentences = extract_meaningful_sentences(text)
            all_sentences.extend(sentences)
            processed_files += 1
            print(f"     ✅ Added {len(sentences)} sentences")
        else:
            print(f"     ❌ Failed to process")
    
    if not all_sentences:
        print("❌ No suitable content found for quiz generation")
        return
    
    print(f"\n📊 Content Analysis:")
    print(f"  📄 Files processed: {processed_files}")
    print(f"  📝 Total sentences: {len(all_sentences)}")
    
    # Generate quiz
    print(f"\n🎯 Generating quiz questions...")
    questions = create_professional_quiz(all_sentences, num_questions=10)
    
    if not questions:
        print("❌ Could not generate quiz questions")
        return
    
    # Display quiz
    print(f"\n🎊 Professional Quiz Generated!")
    print("=" * 60)
    
    for i, q in enumerate(questions, 1):
        print(f"\nQuestion {i}:")
        print(f"{q['question']}")
        print()
        for j, option in enumerate(q['options']):
            print(f"{chr(65 + j)}. {option}")
        print(f"\nAnswer: {q['correct_answer']}")
        print("-" * 40)
    
    # Save to file
    save_quiz_to_file(questions)
    print(f"\n💾 Quiz saved to 'generated_quiz.txt'")
    
    print(f"\n🎉 Quiz generation complete!")
    print(f"📈 Generated {len(questions)} professional quiz questions")
    print(f"📄 Ready for educational use!")

if __name__ == "__main__":
    main()
