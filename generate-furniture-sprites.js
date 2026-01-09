// Quick script to generate placeholder furniture sprites
// Run with: node generate-furniture-sprites.js

const fs = require('fs');
const path = require('path');

// Simple SVG-based placeholder generator (no dependencies needed!)
function generatePlaceholderSVG(width, height, color, label) {
  // Isometric dimensions: width * 44px, height * 22px base
  const isoWidth = width * 44;
  const isoHeight = height * 22 + 40; // Extra height for vertical rise

  return `<svg width="${isoWidth}" height="${isoHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${isoWidth}" height="${isoHeight}" fill="${color}"/>

  <!-- Isometric box outline -->
  <path d="M ${isoWidth / 2} 20 L ${isoWidth - 10} ${isoHeight / 3} L ${isoWidth / 2} ${isoHeight - 20} L 10 ${isoHeight / 3} Z"
        fill="${color}" stroke="#000" stroke-width="2"/>

  <!-- Label -->
  <text x="${isoWidth / 2}" y="${isoHeight / 2}"
        font-family="Arial" font-size="12" fill="#fff"
        text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;
}

const furnitureSprites = [
  // Desks
  { file: '1x1desk_basic_south.png', width: 1, height: 1, color: '#8B4513', label: 'Desk' },
  { file: '1x1desk_basic_north.png', width: 1, height: 1, color: '#8B4513', label: 'Desk' },
  { file: '1x1desk_basic_east.png', width: 1, height: 1, color: '#8B4513', label: 'Desk' },
  { file: '1x1desk_basic_west.png', width: 1, height: 1, color: '#8B4513', label: 'Desk' },

  { file: '1x1desk_premium_south.png', width: 1, height: 1, color: '#654321', label: 'Desk+' },
  { file: '1x1desk_premium_north.png', width: 1, height: 1, color: '#654321', label: 'Desk+' },
  { file: '1x1desk_premium_east.png', width: 1, height: 1, color: '#654321', label: 'Desk+' },
  { file: '1x1desk_premium_west.png', width: 1, height: 1, color: '#654321', label: 'Desk+' },

  { file: '2x1desk_executive_south.png', width: 2, height: 1, color: '#4A0404', label: 'Exec' },
  { file: '2x1desk_executive_north.png', width: 2, height: 1, color: '#4A0404', label: 'Exec' },
  { file: '1x2desk_executive_east.png', width: 1, height: 2, color: '#4A0404', label: 'Exec' },
  { file: '1x2desk_executive_west.png', width: 1, height: 2, color: '#4A0404', label: 'Exec' },

  // Standing Desks
  { file: '1x1desk_standing_south.png', width: 1, height: 1, color: '#000000', label: 'Stand' },
  { file: '1x1desk_standing_north.png', width: 1, height: 1, color: '#000000', label: 'Stand' },
  { file: '1x1desk_standing_east.png', width: 1, height: 1, color: '#000000', label: 'Stand' },
  { file: '1x1desk_standing_west.png', width: 1, height: 1, color: '#000000', label: 'Stand' },

  // Meeting Rooms
  { file: '2x2meeting_small_south.png', width: 2, height: 2, color: '#4682B4', label: 'Meeting' },
  { file: '3x3meeting_large_south.png', width: 3, height: 3, color: '#1E90FF', label: 'Meeting L' },
  { file: '4x3conference_south.png', width: 4, height: 3, color: '#000080', label: 'Conference' },
  { file: '4x3conference_north.png', width: 4, height: 3, color: '#000080', label: 'Conference' },
  { file: '3x4conference_east.png', width: 3, height: 4, color: '#000080', label: 'Conference' },
  { file: '3x4conference_west.png', width: 3, height: 4, color: '#000080', label: 'Conference' },

  // Amenities
  { file: '1x1coffee_south.png', width: 1, height: 1, color: '#6B4423', label: 'Coffee' },
  { file: '2x2break_table_south.png', width: 2, height: 2, color: '#90EE90', label: 'Break' },
  { file: '1x1water_cooler_south.png', width: 1, height: 1, color: '#87CEEB', label: 'Water' },

  // Decor
  { file: '1x1plant_south.png', width: 1, height: 1, color: '#228B22', label: 'Plant' },
  { file: '1x2bookshelf_south.png', width: 1, height: 2, color: '#8B7355', label: 'Books' },
  { file: '1x2bookshelf_north.png', width: 1, height: 2, color: '#8B7355', label: 'Books' },
  { file: '2x1bookshelf_east.png', width: 2, height: 1, color: '#8B7355', label: 'Books' },
  { file: '2x1bookshelf_west.png', width: 2, height: 1, color: '#8B7355', label: 'Books' },
  { file: '1x1filing_cabinet_south.png', width: 1, height: 1, color: '#696969', label: 'Files' },
  { file: '2x1reception_south.png', width: 2, height: 1, color: '#800020', label: 'Reception' },
  { file: '2x1reception_north.png', width: 2, height: 1, color: '#800020', label: 'Reception' },
  { file: '1x2reception_east.png', width: 1, height: 2, color: '#800020', label: 'Reception' },
  { file: '1x2reception_west.png', width: 1, height: 2, color: '#800020', label: 'Reception' },
];

const outputDir = path.join(__dirname, 'public', 'Furniture');

console.log('Generating furniture sprite placeholders...');

furnitureSprites.forEach(sprite => {
  const svg = generatePlaceholderSVG(sprite.width, sprite.height, sprite.color, sprite.label);
  const outputPath = path.join(outputDir, sprite.file);

  // Write SVG file (we'll use SVG directly as Phaser supports it)
  const svgPath = outputPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);
  console.log(`Created: ${svgPath}`);
});

console.log(`\n✓ Generated ${furnitureSprites.length} placeholder sprites!`);
console.log('Note: These are SVG files. Update furniture.ts to use .svg extensions or convert to PNG later.');
