import { gsap } from 'gsap'

export const initCameraHelperUI = (controls) => {
  const uiWrapper = document.querySelector('.controls-ui_wrapper')

  if (!uiWrapper) {
    console.warn('Controls UI wrapper element not found')
    return
  }

  let inactivityTimer = null
  let hasUserRotated = false
  let isUIVisible = false
  let hideUITimer = null

  // Set initial state - hidden
  gsap.set(uiWrapper, { opacity: 0, display: 'none' })

  // Function to show the UI
  const showUI = () => {
    if (hasUserRotated || isUIVisible) return

    isUIVisible = true
    gsap.set(uiWrapper, { display: 'flex' })
    gsap.to(uiWrapper, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    })

    // Set timer to hide UI after 3 more seconds of inactivity
    hideUITimer = setTimeout(() => {
      if (isUIVisible && !hasUserRotated) {
        hideUIPermanently()
      }
    }, 3000)
  }

  // Function to hide the UI permanently
  const hideUIPermanently = () => {
    if (hasUserRotated) return

    hasUserRotated = true
    isUIVisible = false

    gsap.to(uiWrapper, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(uiWrapper, { display: 'none' })
      },
    })
  }

  // Function to hide the UI temporarily (for the second timer)
  const hideUITemporarily = () => {
    if (hasUserRotated) return

    isUIVisible = false
    gsap.to(uiWrapper, {
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(uiWrapper, { display: 'none' })
      },
    })
  }

  // Start inactivity timer
  const startInactivityTimer = () => {
    if (hasUserRotated) return

    clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
      showUI()
    }, 6000) // 6 seconds
  }

  // Reset inactivity timer on any user interaction
  const resetInactivityTimer = () => {
    if (hasUserRotated) return

    clearTimeout(inactivityTimer)
    clearTimeout(hideUITimer)

    // If UI is currently visible, hide it immediately
    if (isUIVisible) {
      hideUITemporarily()
    } else {
      // Only restart the timer if UI wasn't visible
      startInactivityTimer()
    }
  }

  // Listen for camera rotation events
  const originalUpdate = controls.update.bind(controls)
  let lastAzimuthAngle = controls.getAzimuthalAngle()
  let lastPolarAngle = controls.getPolarAngle()

  controls.update = function () {
    originalUpdate()

    // Check if camera has been rotated
    const currentAzimuth = controls.getAzimuthalAngle()
    const currentPolar = controls.getPolarAngle()

    // If angles have changed and UI is visible, hide it permanently
    if (
      (Math.abs(currentAzimuth - lastAzimuthAngle) > 0.01 ||
        Math.abs(currentPolar - lastPolarAngle) > 0.01) &&
      isUIVisible
    ) {
      hideUIPermanently()
    }

    lastAzimuthAngle = currentAzimuth
    lastPolarAngle = currentPolar
  }

  // Listen for user interactions
  const events = [
    'mousedown',
    'mousemove',
    'touchstart',
    'touchmove',
    'keydown',
    'wheel',
  ]

  events.forEach((event) => {
    document.addEventListener(event, resetInactivityTimer, { passive: true })
  })

  // Start the initial inactivity timer
  startInactivityTimer()

  // Return cleanup function
  return () => {
    clearTimeout(inactivityTimer)
    clearTimeout(hideUITimer)
    events.forEach((event) => {
      document.removeEventListener(event, resetInactivityTimer)
    })
    controls.update = originalUpdate
  }
}
