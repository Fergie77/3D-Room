import * as THREE from 'three'
export class VideoScreen {
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
    this.group = new THREE.Group()
    this.group.userData.videoScreen = this
    this.planes = [null, null]
    this.loadVideo(0).then(() => {
      if (this.planes[0] && this.planes[0].userData.video) {
        this.planes[0].userData.video.play()
      }
    })
  }
  async loadVideo(planeIndex, videoIndex = this.currentVideoIndex) {
    return new Promise((resolve, reject) => {
      if (!this.isLoading) {
        window.activeVideoLoads++
        if (window.activeVideoLoads === 1 && window.showGlobalLoading)
          window.showGlobalLoading()
        this.isLoading = true
      }
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.src = this.videoSources[videoIndex]
      video.autoplay = true
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.style.display = 'none'

      const cleanup = () => {
        if (this.isLoading) {
          window.activeVideoLoads = Math.max(0, window.activeVideoLoads - 1)
          if (window.activeVideoLoads === 0 && window.hideGlobalLoading)
            window.hideGlobalLoading()
          this.isLoading = false
        }
      }

      video.addEventListener('loadeddata', () => {
        setTimeout(() => {
          cleanup()
        }, 2000)
        const texture = new THREE.VideoTexture(video)
        texture.encoding = THREE.sRGBEncoding
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: planeIndex === 0 ? 1 : 0,
        })
        const geometry = new THREE.PlaneGeometry(this.width, this.height)
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(...this.position)
        if (this.rotation) mesh.rotation.set(...this.rotation)
        mesh.userData.video = video
        if (this.planes[planeIndex]) {
          this.group.remove(this.planes[planeIndex])
          if (this.planes[planeIndex].userData.video) {
            this.planes[planeIndex].userData.video.pause()
            this.planes[planeIndex].userData.video.remove()
          }
        }
        this.planes[planeIndex] = mesh
        this.group.add(mesh)
        if (planeIndex === 1) {
          mesh.visible = false
        }
        video.addEventListener('ended', () => {
          video.play()
        })
        resolve()
      })

      video.addEventListener('error', (error) => {
        console.error('Error loading video:', error)
        cleanup()
        reject(error)
      })

      // Add error handling for play failures
      video.addEventListener(
        'play',
        () => {
          // Video started playing successfully
        },
        { once: true }
      )

      video.addEventListener('pause', () => {
        // Video was paused, might indicate a playback issue
        console.warn('Video was paused unexpectedly')
      })

      document.body.appendChild(video)
    })
  }
  async nextVideo() {
    if (this.isTransitioning) return
    try {
      const nextIndex = (this.currentVideoIndex + 1) % this.videoSources.length
      await this.loadVideo(1, nextIndex)
      const nextVideo = this.planes[1].userData.video
      try {
        await nextVideo.play()
        this.isTransitioning = true
        this.transitionProgress = 0
        this.planes[1].visible = true
        this.currentVideoIndex = nextIndex
      } catch (playError) {
        document.addEventListener(
          'click',
          async () => {
            try {
              await nextVideo.play()
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
      await this.loadVideo(1, targetIndex)
      const nextVideo = this.planes[1].userData.video
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
      if (nextVideo.paused) {
        nextVideo
          .play()
          .catch((e) => console.warn('Failed to play during transition:', e))
      }
      this.transitionProgress += deltaTime / this.transitionDuration
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false
        this.transitionProgress = 0
        currentVideo.pause()
        currentVideo.remove()
        if (!nextVideo.paused) {
          this.planes[0].material.opacity = 0
          this.planes[1].material.opacity = 1
          this.group.remove(this.planes[0])
          this.group.remove(this.planes[1])
          ;[this.planes[0], this.planes[1]] = [this.planes[1], this.planes[0]]
          this.group.add(this.planes[0])
          this.group.add(this.planes[1])
          this.planes[1].visible = false
          this.planes[1] = null
        } else {
          console.warn('Next video not playing, resetting transition')
          this.isTransitioning = false
          this.transitionProgress = 0
          this.planes[1].visible = false
          this.planes[1].material.opacity = 0
        }
      } else {
        this.planes[0].material.opacity = 1 - this.transitionProgress
        this.planes[1].material.opacity = this.transitionProgress
      }
    }
  }
  getMesh() {
    return this.group
  }
}
