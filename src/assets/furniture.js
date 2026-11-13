import * as THREE from 'three';
import { getFurniture } from '../room/furniture.js';

// Procedural assets need no downloads, textures, or external model licenses.
// Every call returns an independently owned group; dispose its meshes on removal.
export function createFurnitureModel(type) {
  const asset = getFurniture(type);
  if (!asset) return null;
  const group = new THREE.Group();
  group.name = asset.name;
  const wood = '#ad8660';
  const dark = '#69533e';
  function box(w, h, d, x, y, z, color = asset.color) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    mesh.position.set(x, y, z);
    group.add(mesh);
  }
  function legs(w, d, height) {
    for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) {
      for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) box(0.07, height, 0.07, x, height / 2, z, dark);
    }
  }
  if (type === 'bed') {
    legs(1.6, 2, 0.22);
    box(1.6, 0.2, 2.1, 0, 0.27, 0, wood);
    box(1.5, 0.2, 1.95, 0, 0.47, 0.025, '#f3efe3');
    box(1.52, 0.06, 1.3, 0, 0.6, 0.32);
    box(1.6, 1.05, 0.08, 0, 0.525, -1.01, wood);
    for (const x of [-0.38, 0.38]) box(0.6, 0.12, 0.36, x, 0.63, -0.65, '#faf7ee');
  } else if (type === 'sofa') {
    legs(1.9, 0.8, 0.15);
    box(2, 0.22, 0.9, 0, 0.25, 0);
    box(2, 0.5, 0.16, 0, 0.6, -0.37);
    for (const x of [-0.91, 0.91]) box(0.18, 0.42, 0.9, x, 0.42, 0);
    for (const x of [-0.41, 0.41]) box(0.79, 0.14, 0.7, x, 0.43, 0.07, '#d5ddcb');
  } else if (type === 'table') {
    legs(1.2, 0.75, 0.68);
    box(1.2, 0.07, 0.75, 0, 0.715, 0);
  } else if (type === 'chair') {
    legs(0.5, 0.5, 0.43);
    box(0.5, 0.07, 0.5, 0, 0.465, 0);
    box(0.5, 0.4, 0.07, 0, 0.7, -0.215);
  } else if (type === 'dresser') {
    legs(1.15, 0.45, 0.1);
    box(1.2, 0.8, 0.48, 0, 0.5, -0.01);
    for (const y of [0.24, 0.49, 0.74]) {
      box(1.12, 0.22, 0.02, 0, y, 0.24, '#d2b493');
      box(0.22, 0.025, 0.02, 0, y, 0.24, dark);
    }
  } else if (type === 'bookshelf') {
    box(0.9, 1.8, 0.035, 0, 0.9, -0.1575);
    for (const x of [-0.425, 0.425]) box(0.05, 1.8, 0.35, x, 0.9, 0);
    for (const y of [0.025, 0.46, 0.9, 1.34, 1.775]) box(0.9, 0.05, 0.35, 0, y, 0);
    for (const [i, color] of ['#75866b', '#caaa8d', '#d9d4be', '#8d9b99'].entries()) box(0.1, 0.3, 0.22, -0.3 + i * 0.12, 0.635, 0, color);
  } else if (type === 'plant') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.32, 12), new THREE.MeshStandardMaterial({ color: '#d2b397' }));
    pot.position.y = 0.16;
    group.add(pot);
    box(0.04, 0.5, 0.04, 0, 0.52, 0, wood);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshStandardMaterial({ color: asset.color, roughness: 1 }));
    leaves.scale.y = 1.4;
    leaves.position.y = 0.75;
    group.add(leaves);
  }
  return group;
}
