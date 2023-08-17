import { T } from '@solid-three/fiber'
import { JSXElement, createEffect, mergeProps, splitProps } from 'solid-js'
import { BufferAttribute } from 'three'

const easeInExpo = (x) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10))

export type BackdropProps = Parameters<typeof T.Group>[0] & {
  floor?: number
  segments?: number
  receiveShadow?: boolean
  children?: JSXElement
}

export function Backdrop(_props) {
  const [props, rest] = splitProps(mergeProps({ floor: 0.25, segments: 20 }, _props), [
    'children',
    'floor',
    'segments',
    'receiveShadow',
  ])

  let ref: THREE.PlaneGeometry = null!
  createEffect(() => {
    let i = 0
    const offset = props.segments / props.segments / 2
    const position = ref.attributes.position as BufferAttribute
    for (let x = 0; x < props.segments + 1; x++) {
      for (let y = 0; y < props.segments + 1; y++) {
        position.setXYZ(
          i++,
          x / props.segments - offset + (x === 0 ? -props.floor : 0),
          y / props.segments - offset,
          easeInExpo(x / props.segments)
        )
      }
    }
    position.needsUpdate = true
    ref.computeVertexNormals()
  })
  return (
    <T.Group {...rest}>
      <T.Mesh receiveShadow={props.receiveShadow} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <T.PlaneGeometry ref={ref} args={[1, 1, props.segments, props.segments]} />
        {props.children}
      </T.Mesh>
    </T.Group>
  )
}
