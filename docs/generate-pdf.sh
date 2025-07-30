#!/bin/bash

# QuarkFin Technical Architecture PDF Generator
# This script converts the Markdown documentation to PDF

echo "🔧 Generating QuarkFin Technical Architecture PDF..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "❌ Pandoc is not installed. Please install it first:"
    echo "   macOS: brew install pandoc"
    echo "   Ubuntu: sudo apt-get install pandoc"
    echo "   Windows: Download from https://pandoc.org/installing.html"
    exit 1
fi

# Check if wkhtmltopdf is installed (for better PDF rendering)
if ! command -v wkhtmltopdf &> /dev/null; then
    echo "⚠️  wkhtmltopdf is not installed. Using basic PDF generation."
    echo "   For better PDF quality, install wkhtmltopdf:"
    echo "   macOS: brew install wkhtmltopdf"
    echo "   Ubuntu: sudo apt-get install wkhtmltopdf"
    echo "   Windows: Download from https://wkhtmltopdf.org/downloads.html"
fi

# Create output directory
mkdir -p ../output

# Generate PDF with custom styling
pandoc \
    "QuarkFin-Technical-Architecture.md" \
    -o "../output/QuarkFin-Technical-Architecture.pdf" \
    --pdf-engine=wkhtmltopdf \
    --css=styles.css \
    --metadata title="QuarkFin Platform - Technical Architecture" \
    --metadata author="QuarkFin Development Team" \
    --metadata date="$(date +'%B %d, %Y')" \
    --toc \
    --toc-depth=3 \
    --number-sections \
    --variable geometry:margin=1in \
    --variable fontsize=11pt \
    --variable mainfont="Arial" \
    --variable monofont="Courier New" \
    --variable colorlinks=true \
    --variable linkcolor=blue \
    --variable urlcolor=blue \
    --variable toccolor=gray

# Check if PDF was created successfully
if [ -f "../output/QuarkFin-Technical-Architecture.pdf" ]; then
    echo "✅ PDF generated successfully!"
    echo "📄 Location: ../output/QuarkFin-Technical-Architecture.pdf"
    echo "📊 File size: $(du -h ../output/QuarkFin-Technical-Architecture.pdf | cut -f1)"
else
    echo "❌ PDF generation failed!"
    exit 1
fi

echo ""
echo "🎉 QuarkFin Technical Architecture PDF is ready!"
echo "📋 This document contains:"
echo "   • Complete AWS infrastructure architecture"
echo "   • Application architecture diagrams"
echo "   • Deployment pipeline documentation"
echo "   • Security architecture details"
echo "   • Troubleshooting guide"
echo "   • Future enhancement roadmap"
echo ""
echo "📤 You can now share this PDF with your engineering team!" 