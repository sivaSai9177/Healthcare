#!/bin/bash

# Check for duplicate config declarations in universal components
cd /Users/sirigiri/Documents/coding-projects/my-expo/components/universal

echo "Checking for duplicate 'config' variable declarations..."
echo "=================================================="

for file in *.tsx; do
    if [ -f "$file" ]; then
        # Check if file contains useAnimationVariant with config destructuring
        if grep -q "const { config, isAnimated } = useAnimationVariant" "$file"; then
            # Check if there's another const config declaration
            count=$(grep -c "const config =" "$file")
            if [ "$count" -gt 0 ]; then
                echo ""
                echo "File: $file"
                echo "Has useAnimationVariant destructuring AND $count additional const config declaration(s)"
                
                # Show the lines
                echo "Lines with 'const config':"
                grep -n "const config" "$file" | head -5
            fi
        fi
    fi
done

echo ""
echo "=================================================="
echo "Scan complete."