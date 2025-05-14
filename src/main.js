import * as THREE from 'three'

// Create scene
const scene = new THREE.Scene()

// Create camera
const camera = new THREE.PerspectiveCamera(
  75, // fov
  window.innerWidth / window.innerHeight, // aspect
  0.1, // near
  1000 // far
)
camera.position.set(0, 0, 1) // Place camera inside the room, looking at the front wall

// Create renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Helper to create a colored plane
function createColorPlane(color, width, height, position, rotation) {
  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
  })
  const geometry = new THREE.PlaneGeometry(width, height)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  if (rotation) mesh.rotation.set(...rotation)
  return mesh
}

// Helper to create a video plane
function createVideoPlane(videoId, width, height, position, rotation) {
  const video = document.createElement('video')
  video.crossOrigin = 'anonymous'
  video.src = 'https://tg-3d-room.netlify.app/FF_PS_02_C_1.mp4'
  video.autoplay = true
  video.muted = true
  video.loop = true
  video.playsInline = true
  video.style.display = 'none'
  document.body.appendChild(video)

  // Explicitly try to play the video
  video.play().catch((e) => {
    console.warn('Autoplay prevented:', e)
  })

  const texture = new THREE.VideoTexture(video)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  })
  const geometry = new THREE.PlaneGeometry(width, height)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  if (rotation) mesh.rotation.set(...rotation)
  return mesh
}

// Room dimensions
const roomWidth = 4 // distance between left and right walls
const wallHeight = 1.5
const roomDepth = 4 // distance from camera to front wall

// Create two colored planes as side walls
const leftWall = createColorPlane(
  0xff0000, // red
  roomDepth,
  wallHeight, // wall stretches from front to back
  [-(roomWidth / 2), 0, -roomDepth / 2], // left wall, centered in depth
  [0, Math.PI / 2, 0]
)
const rightWall = createColorPlane(
  0x00ff00, // green
  roomDepth,
  wallHeight,
  [roomWidth / 2, 0, -roomDepth / 2], // right wall, centered in depth
  [0, -Math.PI / 2, 0]
)

// Create the front wall with video texture
const frontWall = createVideoPlane(
  'middle',
  roomWidth,
  wallHeight,
  [0, 0, -roomDepth],
  [0, 0, 0]
)

scene.add(leftWall)
scene.add(rightWall)
scene.add(frontWall)

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

animate()
