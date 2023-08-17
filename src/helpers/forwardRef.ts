import { splitProps, type JSX } from 'solid-js'

export function forwardRef<TReference, TProps>(
  callback: (props: Omit<TProps, 'ref'>, ref?: TReference | ((ref: TReference) => any)) => JSX.Element
) {
  return (_props: TProps & { ref?: TReference }) => {
    const [rest, props] = splitProps(_props, ['ref'])
    return callback(props, rest.ref) as unknown as JSX.Element
  }
}
