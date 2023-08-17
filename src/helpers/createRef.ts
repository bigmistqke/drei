export function createRef<T>(): { ref: undefined | T }
export function createRef<T>(ref: T): { ref: T }
export function createRef<T>(ref?: T) {
  return { ref }
}
