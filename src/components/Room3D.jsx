import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createFurnitureModel } from '../assets/furniture.js';
import { furnitureTransform } from '../room/schema.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default function Room3D({ room, selectedId, onSelect }) {
  const host = useRef(null);
  const actions = useRef({});
  const cameraState = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setError('3D is unavailable in this browser. Enable hardware acceleration or use the 2D view.');
      return;
    }
    setError('');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#edf0e6');
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D room. Drag to orbit, scroll to zoom, right-drag to pan.');
    renderer.domElement.tabIndex = 0;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    const size = Math.max(room.width, room.depth, 3);
    function render() { renderer.render(scene, camera); }
    function reset() {
      controls.target.set(0, 0.6, 0);
      const distance = size * Math.max(1.5, 1 / camera.aspect);
      camera.position.set(distance, distance * 0.8, distance);
      controls.update();
      render();
    }
    actions.current = {
      reset,
      zoom: factor => { camera.position.sub(controls.target).multiplyScalar(factor).clampLength(1, 100).add(controls.target); controls.update(); render(); },
    };
    scene.add(new THREE.HemisphereLight(0xffffff, 0x899377, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(4, 8, 6);
    scene.add(light);
    function box(width, height, depth, x, y, z, color) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    }
    box(room.width, 0.12, room.depth, 0, -0.06, 0, room.floorColor);
    // Interior-facing planes hide near walls from outside, keeping the room visible.
    const wallMaterial = new THREE.MeshStandardMaterial({ color: room.wallColor, side: THREE.FrontSide, roughness: 0.9 });
    const height = room.height;
    for (const [width, x, z, rotation] of [
      [room.width, 0, -room.depth / 2, 0],
      [room.width, 0, room.depth / 2, Math.PI],
      [room.depth, -room.width / 2, 0, Math.PI / 2],
      [room.depth, room.width / 2, 0, -Math.PI / 2],
    ]) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMaterial);
      wall.position.set(x, height / 2, z);
      wall.rotation.y = rotation;
      scene.add(wall);
    }
    for (const item of room.furniture) {
      const model = createFurnitureModel(item.type);
      if (!model) continue;
      const transform = furnitureTransform(room, item);
      model.position.set(transform.x, transform.y, transform.z);
      model.rotation.y = transform.rotationY;
      model.traverse(object => { object.userData.itemId = item.id; });
      scene.add(model);
      if (item.id === selectedId) {
        scene.add(new THREE.BoxHelper(model, '#517b38'));
      }
    }

    const raycaster = new THREE.Raycaster();
    let pointerStart = null;
    const pointerDown = event => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const pointerUp = event => {
      if (!onSelect || event.button !== 0 || !pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = raycaster.intersectObjects(scene.children, true).find(hit => hit.object.isMesh);
      onSelect(hit?.object.userData.itemId || null);
      pointerStart = null;
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    });
    camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    camera.updateProjectionMatrix();
    if (cameraState.current) {
      camera.position.copy(cameraState.current.position);
      controls.target.copy(cameraState.current.target);
      controls.update();
    } else reset();
    resize.observe(container);
    controls.addEventListener('change', render);
    return () => {
      cameraState.current = { position: camera.position.clone(), target: controls.target.clone() };
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      resize.disconnect();
      controls.dispose();
      const materials = new Set();
      scene.traverse(object => { object.geometry?.dispose(); if (object.material) materials.add(object.material); });
      materials.forEach(material => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      actions.current = {};
    };
  }, [room.width, room.depth, room.height, room.wallColor, room.floorColor, room.furniture, selectedId, onSelect]);

  return <div className="room-3d"><div ref={host} className="room-3d-canvas"/>{error ? <p role="alert" className="room-3d-help">{error}</p> : <><div className="camera-actions"><button className="secondary" onClick={() => actions.current.zoom?.(0.8)} aria-label="Zoom in">+</button><button className="secondary" onClick={() => actions.current.zoom?.(1.25)} aria-label="Zoom out">−</button><button className="secondary" onClick={() => actions.current.reset?.()}>Reset view</button></div><p className="room-3d-help">Drag to orbit · Scroll to zoom · Right-drag to pan<br/>Touch: one finger to orbit, two to zoom or pan</p></>}</div>;
}
