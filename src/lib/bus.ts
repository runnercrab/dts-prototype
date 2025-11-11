type EventCallback = (data?: any) => void

interface Events {
  [key: string]: EventCallback[]
}

class EventBus {
  private events: Events = {}

  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  emit(event: string, data?: any): void {
    if (!this.events[event]) return
    this.events[event].forEach(callback => callback(data))
  }
}

const bus = new EventBus()
export default bus