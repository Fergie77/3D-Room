import { gsap } from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

// Create scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

// Room dimensions
const roomWidth = 4.6666666666 // distance between left and right walls
const wallHeight = 2
const roomDepth = 8.8888888888 // distance from camera to front wall

// Create camera
const camera = new THREE.PerspectiveCamera(
  75, // fov
  window.innerWidth / window.innerHeight, // aspect
  0.1, // near
  1000 // far
)
// Move camera back on mobile
if (window.innerWidth < 700) {
  camera.position.set(0, -0.3, -4)
} else {
  camera.position.set(0, -0.3, -5)
}

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.outputEncoding = THREE.sRGBEncoding
document.body.appendChild(renderer.domElement)

// Add OrbitControls for mouse interaction
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.enablePan = true
controls.enableZoom = false
controls.target.copy(camera.position).add(new THREE.Vector3(0, 0, -1)) // Look 1 unit in front of camera
controls.update()
controls.rotateSpeed = -0.5 // Invert rotation direction
controls.panSpeed = -1 // Invert panning direction

// Add loading overlay to DOM (CSS spinner)
const loadingOverlay = document.createElement('div')
loadingOverlay.style.position = 'fixed'
loadingOverlay.style.top = '0'
loadingOverlay.style.left = '0'
loadingOverlay.style.width = '100vw'
loadingOverlay.style.height = '100vh'
loadingOverlay.style.background = 'rgba(0,0,0,0.7)'
loadingOverlay.style.display = 'flex'
loadingOverlay.style.justifyContent = 'center'
loadingOverlay.style.alignItems = 'center'
loadingOverlay.style.zIndex = '1000'
loadingOverlay.style.flexDirection = 'column'
loadingOverlay.innerHTML = `<div class="spinner"></div>`
document.body.appendChild(loadingOverlay)
// Add spinner CSS
const spinnerStyle = document.createElement('style')
spinnerStyle.innerHTML = `
.spinner {
  width: 48px;
  height: 48px;
  border: 2px solid #fff;
  border-top: 2px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`
document.head.appendChild(spinnerStyle)

// Global loading counter for all video screens
window.activeVideoLoads = 0
function showGlobalLoading() {
  gsap.to(loadingOverlay, {
    opacity: 1,
    duration: 0.5,
    pointerEvents: 'auto',
    onStart: () => {
      loadingOverlay.style.pointerEvents = 'auto'
    },
  })
}
function hideGlobalLoading() {
  gsap.to(loadingOverlay, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      loadingOverlay.style.pointerEvents = 'none'
    },
  })
}

// VideoScreen class to handle multiple videos and transitions
class VideoScreen {
  constructor(
    width,
    height,
    position,
    rotation,
    videoSources,
    transitionDuration = 1.0
  ) {
    this.width = width
    this.height = height
    this.position = position
    this.rotation = rotation
    this.videoSources = videoSources
    this.currentVideoIndex = 0
    this.transitionDuration = transitionDuration
    this.isTransitioning = false
    this.transitionProgress = 0
    this.isLoading = false

    // Create the group
    this.group = new THREE.Group()
    this.group.userData.videoScreen = this

    // Initialize with empty planes
    this.planes = [null, null]

    // Load the first video
    this.loadVideo(0).then(() => {
      // Start playing the first video
      if (this.planes[0] && this.planes[0].userData.video) {
        this.planes[0].userData.video.play()
      }
    })
  }

  async loadVideo(index) {
    return new Promise((resolve, reject) => {
      if (!this.isLoading) {
        window.activeVideoLoads++
        if (window.activeVideoLoads === 1) showGlobalLoading()
        this.isLoading = true
      }
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.src = this.videoSources[index]
      video.autoplay = true
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.style.display = 'none'

      // Wait for video to be loaded
      video.addEventListener('loadeddata', () => {
        setTimeout(() => {
          if (this.isLoading) {
            window.activeVideoLoads--
            if (window.activeVideoLoads === 0) hideGlobalLoading()
            this.isLoading = false
          }
        }, 2000)
        const texture = new THREE.VideoTexture(video)
        texture.encoding = THREE.sRGBEncoding

        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: index === 0 ? 1 : 0,
        })

        const geometry = new THREE.PlaneGeometry(this.width, this.height)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(...this.position)
        if (this.rotation) mesh.rotation.set(...this.rotation)

        mesh.userData.video = video

        // Remove old plane if it exists
        if (this.planes[index]) {
          this.group.remove(this.planes[index])
          if (this.planes[index].userData.video) {
            this.planes[index].userData.video.pause()
            this.planes[index].userData.video.remove()
          }
        }

        this.planes[index] = mesh
        this.group.add(mesh)

        if (index === 1) {
          mesh.visible = false
        }

        video.addEventListener('ended', () => {
          video.play()
        })

        resolve()
      })

      video.addEventListener('error', (error) => {
        console.error('Error loading video:', error)
        reject(error)
      })

      document.body.appendChild(video)
    })
  }

  async nextVideo() {
    if (this.isTransitioning) return

    try {
      // Prepare next video
      const nextIndex = (this.currentVideoIndex + 1) % this.videoSources.length

      // Always load a fresh video for the next transition
      // This ensures we can cycle back to the first video properly
      await this.loadVideo(1)

      const nextVideo = this.planes[1].userData.video

      // Set new source and prepare to play
      nextVideo.src = this.videoSources[nextIndex]

      // Wait for the video to be loaded and ready to play
      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          nextVideo.removeEventListener('canplay', handleCanPlay)
          resolve()
        }
        nextVideo.addEventListener('canplay', handleCanPlay)

        const handleError = (error) => {
          nextVideo.removeEventListener('error', handleError)
          reject(error)
        }
        nextVideo.addEventListener('error', handleError)

        nextVideo.load()
      })

      // Start playing and wait for it to actually start
      try {
        await nextVideo.play()
        // Only start transition if we successfully started playing
        this.isTransitioning = true
        this.transitionProgress = 0
        this.planes[1].visible = true
        this.currentVideoIndex = nextIndex
      } catch (playError) {
        console.warn('Autoplay prevented:', playError)
        // Try to play again with user interaction
        document.addEventListener(
          'click',
          async () => {
            try {
              await nextVideo.play()
              // Start transition after successful play
              this.isTransitioning = true
              this.transitionProgress = 0
              this.planes[1].visible = true
              this.currentVideoIndex = nextIndex
            } catch (e) {
              console.error('Failed to play video:', e)
            }
          },
          { once: true }
        )
      }
    } catch (error) {
      console.error('Error transitioning to next video:', error)
      this.isTransitioning = false
    }
  }

  async goToVideo(targetIndex) {
    if (this.isTransitioning || this.currentVideoIndex === targetIndex) return
    try {
      // Always load a fresh video for the next transition
      await this.loadVideo(1)
      const nextVideo = this.planes[1].userData.video
      nextVideo.src = this.videoSources[targetIndex]
      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          nextVideo.removeEventListener('canplay', handleCanPlay)
          resolve()
        }
        nextVideo.addEventListener('canplay', handleCanPlay)
        const handleError = (error) => {
          nextVideo.removeEventListener('error', handleError)
          reject(error)
        }
        nextVideo.addEventListener('error', handleError)
        nextVideo.load()
      })
      try {
        await nextVideo.play()
        this.isTransitioning = true
        this.transitionProgress = 0
        this.planes[1].visible = true
        this.currentVideoIndex = targetIndex
      } catch (playError) {
        document.addEventListener(
          'click',
          async () => {
            try {
              await nextVideo.play()
              this.isTransitioning = true
              this.transitionProgress = 0
              this.planes[1].visible = true
              this.currentVideoIndex = targetIndex
            } catch (e) {
              console.error('Failed to play video:', e)
            }
          },
          { once: true }
        )
      }
    } catch (error) {
      console.error('Error transitioning to video index', targetIndex, error)
      this.isTransitioning = false
    }
  }

  update(deltaTime) {
    if (this.isTransitioning && this.planes[0] && this.planes[1]) {
      const currentVideo = this.planes[0].userData.video
      const nextVideo = this.planes[1].userData.video

      // Ensure next video is playing
      if (nextVideo.paused) {
        nextVideo
          .play()
          .catch((e) => console.warn('Failed to play during transition:', e))
      }

      this.transitionProgress += deltaTime / this.transitionDuration

      if (this.transitionProgress >= 1) {
        // Transition complete
        this.isTransitioning = false
        this.transitionProgress = 0

        // Stop and cleanup the current video
        currentVideo.pause()
        currentVideo.remove() // Remove the video element from DOM

        // Ensure the next video is playing and visible
        if (!nextVideo.paused) {
          // Update material properties
          this.planes[0].material.opacity = 0
          this.planes[1].material.opacity = 1

          // Swap the planes in the group
          this.group.remove(this.planes[0])
          this.group.remove(this.planes[1])

          // Update the plane references
          ;[this.planes[0], this.planes[1]] = [this.planes[1], this.planes[0]]

          // Re-add the planes to the group
          this.group.add(this.planes[0])
          this.group.add(this.planes[1])

          // Hide the old plane (now at index 1)
          this.planes[1].visible = false
          this.planes[1] = null // Clear the reference to allow for fresh loading
        } else {
          // If video isn't playing, reset transition
          console.warn('Next video not playing, resetting transition')
          this.isTransitioning = false
          this.transitionProgress = 0
          this.planes[1].visible = false
          this.planes[1].material.opacity = 0
        }
      } else {
        // Update transition
        this.planes[0].material.opacity = 1 - this.transitionProgress
        this.planes[1].material.opacity = this.transitionProgress
      }
    }
  }

  getMesh() {
    return this.group
  }
}

// Replace the createVideoPlaneFromSrc calls with VideoScreen instances
const leftWallVideos = [
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_1/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_2/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_3/SIDE.mp4', // Add your second video URL here
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_4/SIDE.mp4', // Add your second video URL here
]

const rightWallVideos = [
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_1/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_2/SIDE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_3/SIDE.mp4', // Add your second video URL here
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_4/SIDE.mp4', // Add your second video URL here
]

const frontWallVideos = [
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_1/CENTRE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_2/CENTRE.mp4',
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_3/CENTRE.mp4', // Add your second video URL here
  'https://tg-3d-room.netlify.app/Screens/Screen_Set_4/CENTRE.mp4', // Add your second video URL here
]

const leftWall = new VideoScreen(
  roomDepth,
  wallHeight,
  [-(roomWidth / 2), 0, -roomDepth / 2],
  [0, Math.PI / 2, 0],
  leftWallVideos
).getMesh()

const rightWall = new VideoScreen(
  roomDepth,
  wallHeight,
  [roomWidth / 2, 0, -roomDepth / 2],
  [0, Math.PI / 2, 0],
  rightWallVideos
).getMesh()

const frontWall = new VideoScreen(
  roomWidth,
  wallHeight,
  [0, 0, -roomDepth],
  [0, 0, 0],
  frontWallVideos
).getMesh()

scene.add(leftWall)
scene.add(rightWall)
scene.add(frontWall)

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3) // Add subtle ambient light
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xa7cb09, 1.2) // Increased intensity
directionalLight.position.set(0, 8, 2) // Moved higher and more forward
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048 // Increased shadow resolution
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.near = 0.5
directionalLight.shadow.camera.far = 30 // Increased far plane
directionalLight.shadow.camera.left = -10 // Adjusted shadow camera frustum
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.bottom = -10
scene.add(directionalLight)

// --- Cube Camera for dynamic reflection ---
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
  format: THREE.RGBAFormat,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
})
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget)
scene.add(cubeCamera)

// --- Floor Texture ---
const floorTexture = new THREE.TextureLoader().load(
  'https://tg-3d-room.netlify.app/BaseColour.jpg'
)
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
// Adjust repeat based on room dimensions to maintain texture proportions
const textureScale = 0.3 // Adjust this value to control the overall texture density
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

// --- PBR Floor Material ---
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
  //metalnessMap: roughnessMap,
})

// --- Floor Mesh ---
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth)
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotation.x = -Math.PI / 2
floor.position.y = -(wallHeight / 2)
floor.position.z = -roomDepth / 2
floor.receiveShadow = true
scene.add(floor)

// Add a ceiling
const ceilingRadius = roomWidth / 2 + 0.1 // Radius of the curved ceiling
//const ceilingHeight = wallHeight / 2 // Height of the curve
const ceilingSegments = 64 // Number of segments for smooth curve
const ceilingGeometry = new THREE.CylinderGeometry(
  ceilingRadius,
  ceilingRadius,
  roomDepth + 1,
  ceilingSegments,
  1,
  true, // openEnded
  Math.PI, // thetaStart
  Math.PI // thetaLength
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
scene.add(ceiling)

// Add a circle to fill the black gap above the front wall
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
archCircle.position.set(0, wallHeight / 2, -roomDepth - 0.05)
archCircle.rotation.x = -Math.PI / 1 // Face into the room
scene.add(archCircle)

// --- Duplicate front wall and arch circle to the back of the room ---
const backWallVideos = frontWallVideos // Use same videos as front wall, or change if desired
const backWall = new VideoScreen(
  roomWidth,
  wallHeight,
  [0, 0, 0], // Back of the room
  [0, Math.PI, 0], // Face into the room
  backWallVideos
).getMesh()
scene.add(backWall)

const backArchCircle = new THREE.Mesh(
  archCircleGeometry,
  archCircleMaterial.clone()
)
backArchCircle.position.set(0, wallHeight / 2, 0 + 0.05)
backArchCircle.rotation.x = -Math.PI / 1 // Face into the room
scene.add(backArchCircle)

// --- OBJ + MTL Model Loader Example ---
const mtlLoader = new MTLLoader()
mtlLoader.setPath('https://tg-3d-room.netlify.app/FlyingFlea2/')

// Set the glossiness (roughness) value for the bike material
const bikeGlossiness = 0.1 // Lower = glossier, 0 = perfect mirror, 1 = matte

mtlLoader.load('Flying_Flea.mtl', (materials) => {
  materials.preload()

  const objLoader = new OBJLoader()
  objLoader.setMaterials(materials)
  objLoader.setPath('https://tg-3d-room.netlify.app/FlyingFlea2/')

  objLoader.load('Flying_Flea.obj', (object) => {
    object.position.set(0, -(wallHeight / 2 - 0.41), -roomDepth / 2 - 2)
    object.rotation.set(0, 1.55, 0)
    object.scale.set(1.4, 1.4, 1.4)
    // Enable shadows for all meshes in the model
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // Replace material with glossy black
        child.material = new THREE.MeshStandardMaterial({
          color: 0x000000,
          metalness: 1,
          roughness: bikeGlossiness, // Use the variable here
          envMap: cubeRenderTarget.texture,
          envMapIntensity: 1.0,
        })
      }
    })
    scene.add(object)

    // Add a mirrored bike on the other side of the room
    const bike2 = object.clone()
    bike2.position.set(0, -(wallHeight / 2 - 0.41), -roomDepth / 2 + 2)
    bike2.rotation.set(0, -1.55, 0)
    scene.add(bike2)
  })
})

// Enable shadows in renderer
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Modify the animation loop to include video updates
let lastTime = 0
function animate(time) {
  const deltaTime = (time - lastTime) / 1000 // Convert to seconds
  lastTime = time

  requestAnimationFrame(animate)
  controls.update()

  // Update video screens using stored instances
  const leftScreen = leftWall.userData.videoScreen
  const rightScreen = rightWall.userData.videoScreen
  const frontScreen = frontWall.userData.videoScreen
  const backScreen = backWall.userData.videoScreen

  if (leftScreen) leftScreen.update(deltaTime)
  if (rightScreen) rightScreen.update(deltaTime)
  if (frontScreen) frontScreen.update(deltaTime)
  if (backScreen) backScreen.update(deltaTime)

  // Update cube camera for dynamic reflection
  floor.visible = false
  cubeCamera.position.copy(floor.position)
  cubeCamera.update(renderer, scene)
  floor.visible = true

  renderer.render(scene, camera)
}

// Remove the keyboard event listener and add click handler for data-room elements
document.addEventListener('click', async (event) => {
  const roomElement = event.target.closest('[data-room]')
  if (!roomElement) return

  const roomType = roomElement.getAttribute('data-room')
  const leftScreen = leftWall.userData.videoScreen
  const rightScreen = rightWall.userData.videoScreen
  const frontScreen = frontWall.userData.videoScreen
  const backScreen = backWall.userData.videoScreen

  // Helper to safely transition a screen to a specific index
  async function safeGoTo(screen, targetIndex) {
    if (screen && screen.currentVideoIndex !== targetIndex) {
      await screen.goToVideo(targetIndex)
      const video = screen.planes[0]?.userData?.video
      if (video && video.paused) {
        try {
          await video.play()
        } catch (e) {
          alert('Please tap again to enable video playback.')
        }
      }
    }
  }

  const targetIndex = parseInt(roomType) - 1
  // Go to the selected video index for all screens in parallel
  await Promise.all([
    safeGoTo(leftScreen, targetIndex),
    safeGoTo(rightScreen, targetIndex),
    safeGoTo(frontScreen, targetIndex),
    safeGoTo(backScreen, targetIndex),
  ])
})

// Handle window resize efficiently
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
})

animate()
