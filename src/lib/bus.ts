// Event bus mínimo para comunicar AssistantChat -> AvatarPane
type Handler = (payload: any) => void

class Bus {
  private map = new Map<string, Set<Handler>>()
  on(evt: string, fn: Handler) {
    if (!this.map.has(evt)) this.map.set(evt, new Set())
    this.map.get(evt)!.add(fn)
    return () => this.off(evt, fn)
  }
  off(evt: string, fn: Handler) {
    this.map.get(evt)?.delete(fn)
  }
  emit(evt: string, payload?: any) {
    this.map.get(evt)?.forEach(fn => fn(payload))
  }
}
export const bus = new Bus()
