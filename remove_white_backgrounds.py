#!/usr/bin/env python3
"""
Remove white backgrounds from PNG images and make them transparent.
Processes all images in Building/ and Furniture/ directories.
"""

import os
from PIL import Image
import numpy as np

def remove_white_background(image_path, output_path=None, threshold=240):
    """
    Remove white background from an image and make it transparent.

    Args:
        image_path: Path to input image
        output_path: Path to save output (if None, overwrites input)
        threshold: Pixel value threshold for considering as "white" (0-255)
    """
    if output_path is None:
        output_path = image_path

    # Open image and convert to RGBA
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img)

    # Get RGB channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    # Find pixels that are white or near-white (all RGB values above threshold)
    white_pixels = (r > threshold) & (g > threshold) & (b > threshold)

    # Set alpha channel to 0 for white pixels
    data[:,:,3] = np.where(white_pixels, 0, a)

    # Create new image and save
    result = Image.fromarray(data)
    result.save(output_path, 'PNG')

    return white_pixels.sum()  # Return count of pixels made transparent

def process_directory(directory, threshold=240):
    """Process all PNG files in a directory recursively."""
    total_files = 0
    processed_files = 0

    for root, dirs, files in os.walk(directory):
        for filename in files:
            if filename.lower().endswith('.png'):
                total_files += 1
                filepath = os.path.join(root, filename)

                try:
                    pixels_changed = remove_white_background(filepath, threshold=threshold)
                    if pixels_changed > 0:
                        processed_files += 1
                        print(f"✓ {filepath} - {pixels_changed} pixels made transparent")
                    else:
                        print(f"  {filepath} - no changes needed")
                except Exception as e:
                    print(f"✗ Error processing {filepath}: {e}")

    return total_files, processed_files

if __name__ == '__main__':
    print("Removing white backgrounds from images...\n")

    # Get the project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = os.path.join(script_dir, 'public')

    # Process Building directory
    building_dir = os.path.join(public_dir, 'Building')
    if os.path.exists(building_dir):
        print(f"Processing Building directory: {building_dir}\n")
        total, processed = process_directory(building_dir)
        print(f"\nBuilding: {processed}/{total} files modified\n")

    # Process Furniture directory
    furniture_dir = os.path.join(public_dir, 'Furniture')
    if os.path.exists(furniture_dir):
        print(f"Processing Furniture directory: {furniture_dir}\n")
        total, processed = process_directory(furniture_dir)
        print(f"\nFurniture: {processed}/{total} files modified\n")

    print("Done! All images processed.")
