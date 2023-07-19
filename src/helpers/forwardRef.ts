import { createMemo, type JSX } from 'solid-js'

export function forwardRef<TReferefence, TProps>(callback: (props: TProps, ref?: TReferefence) => JSX.Element) {
  return (props: TProps & { ref?: TReferefence }) => createMemo(() => callback(props, props.ref))
}
