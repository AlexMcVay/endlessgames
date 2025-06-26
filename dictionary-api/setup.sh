#!/bin/bash

# Dictionary API Setup Script
echo "Setting up Dictionary API..."

# Create virtual environment
python -m venv .venv

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi

# Install dependencies
pip install -r requirements.txt

echo "Setup complete!"
echo ""
echo "To run the API:"
echo "1. Activate virtual environment:"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "   .venv\\Scripts\\activate"
else
    echo "   source .venv/bin/activate"
fi
echo "2. Run the API:"
echo "   python app.py"
echo ""
echo "The API will be available at http://localhost:5000"
