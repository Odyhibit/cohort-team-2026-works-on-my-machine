from pypdf import PdfReader
from pathlib import Path

def extract_pdf_text(file_path):
    reader = PdfReader(file_path)

    text = "\n".join(
        page.extract_text() or ""
        for page in reader.pages
    )

    return text

count = 1
pdf_files = sorted(Path(__file__).parent.glob("*.pdf"))

for pdf_file in pdf_files:
    print(f"\n{count} --- {pdf_file.name} ---")
    print(extract_pdf_text(pdf_file))
    count += 1
