// Dimensions are metres; each model is centered on X/Z and rests at Y = 0.
export const furnitureCatalog = [
  { type: 'bed', name: 'Bed', width: 1.6, depth: 2.1, height: 1.05, color: '#c1cbb4', symbol: '▤' },
  { type: 'sofa', name: 'Couch', width: 2, depth: 0.9, height: 0.85, color: '#b8c3ab', symbol: '▰' },
  { type: 'table', name: 'Table', width: 1.2, depth: 0.75, height: 0.75, color: '#b58b62', symbol: '▱' },
  { type: 'chair', name: 'Chair', width: 0.5, depth: 0.5, height: 0.9, color: '#ba9874', symbol: '▣' },
  { type: 'dresser', name: 'Dresser', width: 1.2, depth: 0.5, height: 0.9, color: '#bc9771', symbol: '☷' },
  { type: 'bookshelf', name: 'Bookshelf', width: 0.9, depth: 0.35, height: 1.8, color: '#b49470', symbol: '▥' },
  { type: 'plant', name: 'Potted plant', width: 0.5, depth: 0.5, height: 1.1, color: '#6c8852', symbol: '✳' },
];
export function getFurniture(type) {
  return furnitureCatalog.find(asset => asset.type === type);
}
