import { gsap } from 'gsap'

/**
 * Controls the content of an element with class 'threejs_card_paragraph',
 * fading between paragraphs based on the selected data-room.
 */
export class CardParagraphController {
  /**
   * @param {string} selector - CSS selector for the paragraph element (default: '.threejs_card_paragraph')
   * @param {Object} paragraphsByRoom - Object mapping data-room values to paragraph strings
   */
  constructor(paragraphsByRoom, selector = '.threejs_card_paragraph') {
    this.paragraphsByRoom = paragraphsByRoom
    this.selector = selector
    this.element = document.querySelector(this.selector)
    if (!this.element) {
      throw new Error(`Element with selector '${this.selector}' not found.`)
    }
    this.currentRoom = null
  }

  /**
   * Change the paragraph based on the selected data-room value.
   * @param {string|number} roomKey - The data-room value
   */
  setRoom(roomKey) {
    if (this.currentRoom === roomKey) return
    const newText = this.paragraphsByRoom[roomKey] || ''
    if (!newText) return
    this.currentRoom = roomKey
    gsap.to(this.element, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.element.textContent = newText
        gsap.to(this.element, {
          opacity: 1,
          duration: 0.5,
        })
      },
    })
  }
}
