import * as THREE from "three";

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

export function pickAt(event, camera, root) {
  const canvas = event.target instanceof HTMLCanvasElement ? event.target : document.querySelector("#view");
  const bounds = canvas.getBoundingClientRect();
  ndc.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  ndc.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(root, true);
  for (const hit of hits) {
    let node = hit.object;
    while (node) {
      if (node.userData && node.userData.id) return node.userData.id;
      node = node.parent;
    }
  }
  return null;
}
