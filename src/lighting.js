import * as THREE from 'three'
export function setupLighting(scene) {
  const isMobile =
    !window.matchMedia('(hover: hover)').matches || window.innerWidth < 900
  // 1024² shadow map on mobile (1/4 the memory and render cost of 2048²) —
  // barely visible softening on a phone-sized screen.
  const shadowMapSize = isMobile ? 1024 : 2048
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)
  const directionalLight = new THREE.DirectionalLight(0xa7cb09, 1.2)
  directionalLight.position.set(0, 8, 2)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = shadowMapSize
  directionalLight.shadow.mapSize.height = shadowMapSize
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 30
  directionalLight.shadow.camera.left = -10
  directionalLight.shadow.camera.right = 10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10
  scene.add(directionalLight)
}
