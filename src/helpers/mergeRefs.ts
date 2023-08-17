/**
 * @param refs ({ref: T | (value: T) => void | undefined} | (value: T) => void)[]
 * @returns (value: T) => void
 */

export function mergeRefs<T>(...refs: (((value: T) => void) | { ref?: undefined | T | ((value: T) => void) })[]) {
  return (value: T) => {
    refs.forEach((props) => {
      if (typeof props === 'function') {
        props(value)
      } else if (typeof props.ref === 'function') {
        ;(props.ref as (value: T) => void)(value)
      } else {
        props.ref = value
      }
    })
  }
}
