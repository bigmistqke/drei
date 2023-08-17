import { T, useFrame } from '@solid-three/fiber'
import { Group } from 'three'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

export type BillboardProps = {
  follow?: boolean
  lockX?: boolean
  lockY?: boolean
  lockZ?: boolean
} & Parameters<typeof T.Group>[0]

/**
 * Wraps children in a billboarded group. Sample usage:
 *
 * ```js
 * <Billboard>
 *   <Text>hi</Text>
 * </Billboard>
 * ```
 */
export const Billboard: RefComponent<Group, BillboardProps> = function Billboard(_props) {
  const [props, rest] = processProps(_props, { follow: true, lockX: false, lockY: false, lockZ: false }, [
    'follow',
    'lockX',
    'lockY',
    'lockZ',
    'ref',
  ])
  const localRef = createRef<Group>()
  useFrame(({ camera }) => {
    if (!props.follow || !localRef.ref) return

    // save previous rotation in case we're locking an axis
    const prevRotation = localRef.ref.rotation.clone()

    // always face the camera
    camera.getWorldQuaternion(localRef.ref.quaternion)

    // readjust any axis that is locked
    if (props.lockX) localRef.ref.rotation.x = prevRotation.x
    if (props.lockY) localRef.ref.rotation.y = prevRotation.y
    if (props.lockZ) localRef.ref.rotation.z = prevRotation.z
  })
  return <T.Group ref={mergeRefs(localRef, props)} {...rest} />
}
