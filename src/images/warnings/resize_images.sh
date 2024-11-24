#!/bin/bash

# Loop through all PNG files in the current directory
for img in Twitter_Post_*.png; do
    size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
    size_kb=$(echo "scale=2; $size/1024" | bc)

    
    if [ $size -gt 765000 ]; then
        echo "Resizing $img (${size_kb}kb)"
        temp_name="temp_$img"
        
        convert "$img" -resize 99% "$temp_name"
        
        mv "$temp_name" "$img"
        
        new_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img")
        new_size_mb=$(echo "scale=2; $new_size/1024" | bc)
        echo "New size: ${new_size_mb}MB"
    fi
done
