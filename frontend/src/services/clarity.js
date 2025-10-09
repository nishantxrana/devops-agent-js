import Clarity from '@microsoft/clarity'

class ClarityService {
  constructor() {
    this.initialized = false
  }

  init() {
    const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID
    if (projectId && projectId !== 'your_clarity_project_id_here') {
      try {
        Clarity.init(projectId)
        this.initialized = true
        console.log('Clarity initialized successfully')
      } catch (error) {
        console.warn('Clarity initialization failed:', error)
      }
    }
  }

  identifyUser(userId, email = null) {
    if (!this.initialized) return
    try {
      Clarity.identify(userId, null, null, email)
    } catch (error) {
      console.warn('Clarity identify failed:', error)
    }
  }

  trackEvent(eventName) {
    if (!this.initialized) return
    try {
      Clarity.event(eventName)
    } catch (error) {
      console.warn('Clarity event tracking failed:', error)
    }
  }

  setTag(key, value) {
    if (!this.initialized) return
    try {
      Clarity.setTag(key, value)
    } catch (error) {
      console.warn('Clarity tag setting failed:', error)
    }
  }

  consent(hasConsent = true) {
    if (!this.initialized) return
    try {
      Clarity.consent(hasConsent)
    } catch (error) {
      console.warn('Clarity consent failed:', error)
    }
  }
}

export default new ClarityService()
