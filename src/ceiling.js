import * as THREE from 'three'
export function createCeiling(
  roomWidth,
  roomDepth,
  wallHeight,
  cubeRenderTarget,
  ceilingSegments
) {
  const ceilingRadius = roomWidth / 2 + 0.1
  const ceilingGeometry = new THREE.CylinderGeometry(
    ceilingRadius,
    ceilingRadius,
    roomDepth + 1,
    ceilingSegments,
    1,
    true,
    Math.PI,
    Math.PI
  )
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.8,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 1.2,
  })
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
  ceiling.rotation.x = Math.PI / 2
  ceiling.rotation.z = Math.PI
  ceiling.rotation.y = Math.PI / 2
  ceiling.position.y = wallHeight / 2
  ceiling.position.z = -roomDepth / 2 - 0.05
  ceiling.receiveShadow = true
  return ceiling
}
export function createArchCircle(
  roomWidth,
  roomDepth,
  wallHeight,
  cubeRenderTarget,
  ceilingSegments,
  isFront = true
) {
  const ceilingRadius = roomWidth / 2 + 0.1
  const archCircleGeometry = new THREE.CircleGeometry(
    ceilingRadius,
    ceilingSegments
  )
  const archCircleMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.8,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 1.2,
  })
  const archCircle = new THREE.Mesh(archCircleGeometry, archCircleMaterial)
  archCircle.position.set(
    0,
    wallHeight / 2,
    isFront ? -roomDepth - 0.05 : 0 + 0.05
  )
  archCircle.rotation.x = -Math.PI / 1
  return archCircle
}
