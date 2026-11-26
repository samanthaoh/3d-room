import { moveFurniture, rotateFurniture } from '../room/manipulation.js';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createFurnitureModel } from '../assets/furniture.js';
import { furnitureTransform } from '../room/schema.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default function Room3D({ room, selectedId, onSelect, tool = 'move', onTransform }) {
  const host = useRef(null);
  const actions = useRef({});
  const cameraState = useRef(null);
  const callbacks = useRef({ onSelect, onTransform });
  callbacks.current = { onSelect, onTransform };
  const editable = Boolean(onTransform);
  const selectable = Boolean(onSelect);
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
    const size = Math.max(room.width, room.depth, room.height, 3);
    function render() { renderer.render(scene, camera); }
    function reset() {
      controls.target.set(0, room.height / 3, 0);
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
    const models = new Map();
    for (const item of room.furniture) {
      const model = createFurnitureModel(item.type);
      if (!model) continue;
      const transform = furnitureTransform(room, item);
      model.position.set(transform.x, transform.y, transform.z);
      model.rotation.y = transform.rotationY;
      model.traverse(object => { object.userData.itemId = item.id; });
      scene.add(model);
      models.set(item.id, model);
      if (item.id === selectedId) {
        scene.add(new THREE.BoxHelper(model, '#517b38'));
      }
    }

    const raycaster = new THREE.Raycaster();
    let pointerStart = null;
    let drag = null;
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    function cast(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    }
    const pointerDown = event => {
      if (renderer.getContext().isContextLost() || event.button !== 0 || drag) return;
      if (pointerStart && pointerStart.pointerId !== event.pointerId) return;
      pointerStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
      cast(event);
      const hit = raycaster.intersectObjects(scene.children, true).find(hit => hit.object.isMesh);
      const item = room.furniture.find(item => item.id === hit?.object.userData.itemId);
      const point = raycaster.ray.intersectPlane(floor, new THREE.Vector3());
      if (!item || !point || !editable || tool === 'camera') return;
      drag = { item, point: point.clone(), pointerId: event.pointerId, patch: {} };
      controls.enabled = false;
      event.stopImmediatePropagation();
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    };
    const pointerMove = event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      event.stopImmediatePropagation();
      cast(event);
      const point = raycaster.ray.intersectPlane(floor, new THREE.Vector3());
      if (tool === 'rotate') drag.patch = rotateFurniture(drag.item, event.clientX - pointerStart.x, event.shiftKey);
      else if (point) drag.patch = moveFurniture(drag.item, (point.x - drag.point.x) / room.width * 100, (point.z - drag.point.z) / room.depth * 100);
      const transform = furnitureTransform(room, { ...drag.item, ...drag.patch });
      const model = models.get(drag.item.id);
      model.position.set(transform.x, transform.y, transform.z);
      model.rotation.y = transform.rotationY;
      scene.children.filter(object => object.isBoxHelper || object.type === 'BoxHelper').forEach(helper => helper.update());
      render();
    };
    function finish(event, cancel = false) {
      if (pointerStart && event.pointerId !== pointerStart.pointerId) return;
      if (drag) {
        if (event.pointerId !== drag.pointerId) return;
        event.stopImmediatePropagation();
        const completed = drag;
        drag = null;
        controls.enabled = true;
        renderer.domElement.style.cursor = '';
        if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
        const patch = cancel ? { x: completed.item.x, y: completed.item.y, rotation: completed.item.rotation } : completed.patch;
        callbacks.current.onTransform?.(completed.item.id, patch);
        callbacks.current.onSelect?.(completed.item.id);
      } else if (!cancel && tool !== 'camera' && selectable && pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) <= 5) {
        cast(event);
        const hit = raycaster.intersectObjects(scene.children, true).find(hit => hit.object.isMesh);
        callbacks.current.onSelect?.(hit?.object.userData.itemId || null);
      }
      pointerStart = null;
    }
    const pointerUp = event => finish(event);
    const pointerCancel = event => finish(event, true);
    renderer.domElement.addEventListener('pointerdown', pointerDown, true);
    renderer.domElement.addEventListener('pointermove', pointerMove, true);
    renderer.domElement.addEventListener('pointerup', pointerUp, true);
    renderer.domElement.addEventListener('pointercancel', pointerCancel, true);
    renderer.domElement.addEventListener('lostpointercapture', pointerCancel, true);
    const contextLost = event => {
      event.preventDefault();
      // A 3D drag is only committed on release. Restore its preview on interruption.
      if (drag) {
        const interrupted = drag;
        drag = null;
        const model = models.get(interrupted.item.id);
        const transform = furnitureTransform(room, interrupted.item);
        model.position.set(transform.x, transform.y, transform.z);
        model.rotation.y = transform.rotationY;
        scene.children.filter(object => object.type === 'BoxHelper').forEach(helper => helper.update());
        if (renderer.domElement.hasPointerCapture(interrupted.pointerId)) renderer.domElement.releasePointerCapture(interrupted.pointerId);
      }
      pointerStart = null;
      controls.enabled = false;
      renderer.domElement.style.cursor = '';
      setError('The 3D view was interrupted. Waiting for graphics to recover; you can switch to 2D to keep editing.');
    };
    const contextRestored = () => {
      controls.enabled = true;
      setError('');
      render();
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    });
    camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    camera.updateProjectionMatrix();
    const dimensionsKey = `${room.width}/${room.depth}/${room.height}`;
    if (cameraState.current?.dimensionsKey === dimensionsKey) {
      camera.position.copy(cameraState.current.position);
      controls.target.copy(cameraState.current.target);
      controls.update();
    } else reset();
    resize.observe(container);
    controls.addEventListener('change', render);
    return () => {
      cameraState.current = { dimensionsKey, position: camera.position.clone(), target: controls.target.clone() };
      renderer.domElement.removeEventListener('pointerdown', pointerDown, true);
      renderer.domElement.removeEventListener('pointermove', pointerMove, true);
      renderer.domElement.removeEventListener('pointercancel', pointerCancel, true);
      renderer.domElement.removeEventListener('lostpointercapture', pointerCancel, true);
      renderer.domElement.removeEventListener('pointerup', pointerUp, true);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      resize.disconnect();
      controls.dispose();
      const materials = new Set();
      scene.traverse(object => { object.geometry?.dispose(); if (object.material) materials.add(object.material); });
      materials.forEach(material => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      actions.current = {};
    };
  }, [room.width, room.depth, room.height, room.wallColor, room.floorColor, room.furniture, selectedId, selectable, tool, editable]);

  return <div className="room-3d"><div ref={host} className="room-3d-canvas"/>{error ? <p role="alert" className="room-3d-help">{error}</p> : <><div className="camera-actions"><button className="secondary" onClick={() => actions.current.zoom?.(0.8)} aria-label="Zoom in">+</button><button className="secondary" onClick={() => actions.current.zoom?.(1.25)} aria-label="Zoom out">−</button><button className="secondary" onClick={() => actions.current.reset?.()}>Reset view</button></div><p className="room-3d-help">{onTransform && tool !== 'camera' ? (tool === 'rotate' ? 'Drag furniture left/right to rotate · Shift snaps to 15°' : 'Drag furniture to move it across the floor') : 'Drag to orbit · Scroll to zoom · Right-drag to pan'}<br/>Drag empty space to orbit · Camera mode always controls the view</p></>}</div>;
}
