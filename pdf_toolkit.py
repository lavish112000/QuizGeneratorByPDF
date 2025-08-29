#!/usr/bin/env python3
"""
Comprehensive PyPDF Toolkit
This script demonstrates the full range of pypdf capabilities.
"""

from pypdf import PdfReader, PdfWriter
from pathlib import Path
import io
import sys

def analyze_pdf(pdf_path):
    """Analyze a PDF file and return detailed information."""
    try:
        reader = PdfReader(pdf_path)
        
        info = {
            'filename': pdf_path.name,
            'pages': len(reader.pages),
            'metadata': {},
            'text_preview': "",
            'is_encrypted': reader.is_encrypted
        }
        
        # Extract metadata
        if reader.metadata:
            for key, value in reader.metadata.items():
                clean_key = key.replace('/', '') if key.startswith('/') else key
                info['metadata'][clean_key] = str(value) if value else 'N/A'
        
        # Extract text from first page
        if len(reader.pages) > 0:
            first_page_text = reader.pages[0].extract_text()
            info['text_preview'] = first_page_text[:300] + "..." if len(first_page_text) > 300 else first_page_text
        
        return info
        
    except Exception as e:
        return {'error': str(e), 'filename': pdf_path.name}

def merge_pdfs(pdf_files, output_path):
    """Merge multiple PDF files into one."""
    try:
        writer = PdfWriter()
        
        for pdf_file in pdf_files:
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                writer.add_page(page)
        
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)
        
        return True, f"Successfully merged {len(pdf_files)} PDFs into {output_path}"
    
    except Exception as e:
        return False, f"Error merging PDFs: {e}"

def split_pdf(pdf_path, output_dir):
    """Split a PDF into individual pages."""
    try:
        reader = PdfReader(pdf_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)
        
        for page_num, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)
            
            output_path = output_dir / f"{pdf_path.stem}_page_{page_num + 1}.pdf"
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
        
        return True, f"Split {len(reader.pages)} pages into {output_dir}"
    
    except Exception as e:
        return False, f"Error splitting PDF: {e}"

def extract_text_from_all_pages(pdf_path):
    """Extract text from all pages of a PDF."""
    try:
        reader = PdfReader(pdf_path)
        all_text = []
        
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            all_text.append(f"=== PAGE {page_num + 1} ===\n{text}\n")
        
        return True, "\n".join(all_text)
    
    except Exception as e:
        return False, f"Error extracting text: {e}"

def main():
    """Main function demonstrating comprehensive PDF operations."""
    print("🔧 Comprehensive PyPDF Toolkit")
    print("=" * 60)
    
    resources_dir = Path("resources")
    if not resources_dir.exists():
        print("❌ Resources directory not found!")
        return
    
    pdf_files = list(resources_dir.glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found!")
        return
    
    print(f"📚 Found {len(pdf_files)} PDF files in resources directory")
    
    # Analyze first few PDFs
    print(f"\n📊 PDF Analysis Report")
    print("-" * 40)
    
    for i, pdf_file in enumerate(pdf_files[:5]):  # Analyze first 5 PDFs
        print(f"\n📄 {i+1}. Analyzing: {pdf_file.name}")
        
        info = analyze_pdf(pdf_file)
        
        if 'error' in info:
            print(f"   ❌ Error: {info['error']}")
            continue
        
        print(f"   📖 Pages: {info['pages']}")
        print(f"   🔒 Encrypted: {info['is_encrypted']}")
        
        if info['metadata']:
            print(f"   ℹ️  Metadata:")
            for key, value in info['metadata'].items():
                if value and value != 'N/A':
                    print(f"      {key}: {value[:50]}{'...' if len(str(value)) > 50 else ''}")
        
        if info['text_preview']:
            print(f"   📝 Text preview: {info['text_preview'][:100]}...")
    
    # Demonstrate text extraction
    if pdf_files:
        print(f"\n📝 Full Text Extraction Demo")
        print("-" * 40)
        
        sample_pdf = pdf_files[0]
        print(f"📖 Extracting all text from: {sample_pdf.name}")
        
        success, result = extract_text_from_all_pages(sample_pdf)
        if success:
            print(f"✅ Text extraction successful!")
            print(f"📊 Total characters extracted: {len(result)}")
            print(f"📄 Preview:\n{result[:500]}{'...' if len(result) > 500 else ''}")
        else:
            print(f"❌ {result}")
    
    # Demonstrate splitting
    if pdf_files:
        print(f"\n✂️  PDF Splitting Demo")
        print("-" * 40)
        
        sample_pdf = pdf_files[0]
        if Path(sample_pdf).stat().st_size < 1000000:  # Only split smaller files
            print(f"📄 Splitting: {sample_pdf.name}")
            
            success, result = split_pdf(sample_pdf, "split_output")
            if success:
                print(f"✅ {result}")
            else:
                print(f"❌ {result}")
        else:
            print(f"⏭️  Skipping split demo for large file: {sample_pdf.name}")
    
    # Demonstrate merging
    if len(pdf_files) >= 2:
        print(f"\n🔗 PDF Merging Demo")
        print("-" * 40)
        
        # Take first 2 small PDFs for merging
        small_pdfs = [pdf for pdf in pdf_files[:3] if Path(pdf).stat().st_size < 500000]
        
        if len(small_pdfs) >= 2:
            print(f"📚 Merging {len(small_pdfs)} PDFs:")
            for pdf in small_pdfs:
                print(f"   • {pdf.name}")
            
            success, result = merge_pdfs(small_pdfs, "merged_output.pdf")
            if success:
                print(f"✅ {result}")
            else:
                print(f"❌ {result}")
        else:
            print(f"⏭️  Skipping merge demo - need smaller PDF files")
    
    print(f"\n🎯 What PyPDF Can Do:")
    print("  📖 Read and parse PDF files")
    print("  📝 Extract text and metadata")
    print("  🔗 Merge multiple PDFs")
    print("  ✂️  Split PDFs into pages")
    print("  🔄 Rotate and crop pages")
    print("  🔒 Add/remove passwords")
    print("  🏷️  Add bookmarks and annotations")
    print("  🎨 Add watermarks")
    print("  📋 Extract and manipulate forms")
    print("  🖼️  Extract images")
    
    print(f"\n📚 Learn more at: https://pypdf.readthedocs.io/")

if __name__ == "__main__":
    main()
