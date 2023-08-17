import { T, ThreeProps, useFrame } from '@solid-three/fiber'
import { onMount } from 'solid-js'
import * as THREE from 'three'

const boundingBox = new THREE.Box3()
const boundingBoxSize = new THREE.Vector3()

export interface BBAnchorProps extends ThreeProps<'Group'> {
  anchor: THREE.Vector3 | [number, number, number]
}

export const BBAnchor = ({ anchor, ...props }: BBAnchorProps) => {
  let ref: THREE.Group = null!
  let parentRef: THREE.Object3D | null = null

  // Reattach group created by this component to the parent's parent,
  // so it becomes a sibling of its initial parent.
  // We do that so the children have no impact on a bounding box of a parent.
  onMount(() => {
    if (ref?.parent?.parent) {
      parentRef = ref.parent
      ref.parent.parent.add(ref)
    }
  })

  useFrame(() => {
    if (parentRef) {
      boundingBox.setFromObject(parentRef)
      boundingBox.getSize(boundingBoxSize)

      ref.position.set(
        parentRef.position.x + (boundingBoxSize.x * anchor[0]) / 2,
        parentRef.position.y + (boundingBoxSize.y * anchor[1]) / 2,
        parentRef.position.z + (boundingBoxSize.z * anchor[2]) / 2
      )
    }
  })

  return <T.Group ref={ref} {...props} />
}
