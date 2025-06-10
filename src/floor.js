import * as THREE from 'three'
export function createFloor(
  roomWidth,
  roomDepth,
  wallHeight,
  cubeRenderTarget,
  textureScale
) {
  const floorTexture = new THREE.TextureLoader().load(
    'https://tg-3d-room.netlify.app/BaseColour.jpg'
  )
  floorTexture.wrapS = THREE.RepeatWrapping
  floorTexture.wrapT = THREE.RepeatWrapping
  floorTexture.repeat.set(roomWidth * textureScale, roomDepth * textureScale)
  const normalMap = new THREE.TextureLoader().load(
    'https://tg-3d-room.netlify.app/NormalMap.jpg'
  )
  normalMap.wrapS = THREE.RepeatWrapping
  normalMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(roomWidth * textureScale, roomDepth * textureScale)
  const roughnessMap = new THREE.TextureLoader().load(
    'https://tg-3d-room.netlify.app/RoughnessMap2.jpg'
  )
  roughnessMap.wrapS = THREE.RepeatWrapping
  roughnessMap.wrapT = THREE.RepeatWrapping
  roughnessMap.repeat.set(roomWidth * textureScale, roomDepth * textureScale)
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    color: 0x222222,
    roughness: 1,
    metalness: 0.2,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 1,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(0.1, 0.1),
    roughnessMap: roughnessMap,
  })
  const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth)
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -(wallHeight / 2)
  floor.position.z = -roomDepth / 2
  floor.receiveShadow = true
  return floor
}
