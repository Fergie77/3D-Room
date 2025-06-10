import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
export function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = true
  controls.enableZoom = true
  controls.rotateSpeed = -0.5
  controls.panSpeed = -1
  controls.target.copy(camera.position).add(new THREE.Vector3(0, 0, -1))
  controls.update()
  return controls
}
