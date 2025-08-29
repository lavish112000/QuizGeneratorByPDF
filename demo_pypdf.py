#!/usr/bin/env python3
"""
Demo script showing how to use the pypdf library.
This script demonstrates basic PDF operations using pypdf.
"""

import os
from pypdf import PdfReader, PdfWriter
from pathlib import Path

def main():
    """Main function demonstrating pypdf usage."""
    
    print("🔍 PyPDF Library Demo")
    print("=" * 50)
    
    # Check if there are any PDF files in the resources directory
    resources_dir = Path("resources")
    if resources_dir.exists():
        pdf_files = list(resources_dir.glob("*.pdf"))
        if pdf_files:
            print(f"📁 Found {len(pdf_files)} PDF files in resources directory:")
            for pdf_file in pdf_files[:5]:  # Show first 5 files
                print(f"  • {pdf_file.name}")
                
            # Demonstrate reading a PDF
            demo_pdf = pdf_files[0]
            print(f"\n📖 Reading PDF: {demo_pdf.name}")
            try:
                reader = PdfReader(demo_pdf)
                print(f"  📄 Number of pages: {len(reader.pages)}")
                
                # Extract text from first page
                if len(reader.pages) > 0:
                    first_page = reader.pages[0]
                    text = first_page.extract_text()
                    print(f"  📝 First page text preview (first 200 chars):")
                    print(f"     {text[:200]}..." if len(text) > 200 else f"     {text}")
                
                # Show metadata if available
                metadata = reader.metadata
                if metadata:
                    print(f"  ℹ️  Metadata:")
                    if metadata.title:
                        print(f"     Title: {metadata.title}")
                    if metadata.author:
                        print(f"     Author: {metadata.author}")
                    if metadata.creator:
                        print(f"     Creator: {metadata.creator}")
                        
            except Exception as e:
                print(f"  ❌ Error reading PDF: {e}")
                
        else:
            print("📁 No PDF files found in resources directory")
    else:
        print("📁 Resources directory not found")
    
    # Create a simple demo PDF
    print(f"\n🏗️  Creating a simple demo PDF...")
    try:
        writer = PdfWriter()
        
        # Note: Creating pages from scratch requires more complex setup
        # For this demo, we'll just show how the writer works
        print("  ✅ PdfWriter created successfully")
        print("  💡 To create PDFs from scratch, you typically need to:")
        print("     1. Use a library like reportlab to create PDF content")
        print("     2. Or manipulate existing PDFs using pypdf")
        
    except Exception as e:
        print(f"  ❌ Error creating PdfWriter: {e}")
    
    print(f"\n🎯 Common pypdf operations you can perform:")
    print("  • Read and extract text from PDFs")
    print("  • Merge multiple PDFs into one")
    print("  • Split PDFs into separate pages")
    print("  • Crop and rotate pages")
    print("  • Add passwords and encryption")
    print("  • Extract metadata and bookmarks")
    print("  • Add watermarks and annotations")
    
    print(f"\n📚 For more examples, visit:")
    print("  https://pypdf.readthedocs.io/en/stable/")

if __name__ == "__main__":
    main()
