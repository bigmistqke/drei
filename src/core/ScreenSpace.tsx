import { T, useFrame } from '@solid-three/fiber'
import { Group } from 'three'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

export type ScreenSpaceProps = {
  depth?: number
} & Parameters<typeof T.Group>[0]

export const ScreenSpace: RefComponent<Group, ScreenSpaceProps> = (_props) => {
  const [props, rest] = processProps(_props, { depth: -1 }, ['ref', 'children', 'depth'])

  const localRef = createRef<Group>(null!)

  useFrame(({ camera }) => {
    if (!localRef.ref) return
    localRef.ref.quaternion.copy(camera.quaternion)
    localRef.ref.position.copy(camera.position)
  })
  return (
    <T.Group ref={mergeRefs(props, localRef)} {...rest}>
      <T.Group position-z={-props.depth}>{props.children}</T.Group>
    </T.Group>
  )
}
