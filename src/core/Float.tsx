import { T, ThreeProps, useFrame } from '@solid-three/fiber'
import type { JSX } from 'solid-js'
import * as THREE from 'three'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'

export type FloatProps = Omit<ThreeProps<'Group'>, 'children'> & {
  enabled?: boolean
  speed?: number
  rotationIntensity?: number
  floatIntensity?: number
  children: JSX.Element
  floatingRange?: [number?, number?]
}

export const Float = (_props: FloatProps) => {
  const [props, rest] = processProps(
    _props,
    {
      enabled: true,
      speed: 1,
      rotationIntensity: 1,
      floatIntensity: 1,
      floatingRange: [-0.1, 0.1],
    },
    ['ref', 'children', 'enabled', 'speed', 'rotationIntensity', 'floatIntensity', 'floatingRange']
  )

  const groupRef = createRef<THREE.Group>(null!)
  let offset = Math.random() * 10000
  useFrame((state) => {
    if (!props.enabled || props.speed === 0) return
    const t = offset + state.clock.getElapsedTime()
    groupRef.ref.rotation.x = (Math.cos((t / 4) * props.speed) / 8) * props.rotationIntensity
    groupRef.ref.rotation.y = (Math.sin((t / 4) * props.speed) / 8) * props.rotationIntensity
    groupRef.ref.rotation.z = (Math.sin((t / 4) * props.speed) / 20) * props.rotationIntensity
    let yPosition = Math.sin((t / 4) * props.speed) / 10
    yPosition = THREE.MathUtils.mapLinear(
      yPosition,
      -0.1,
      0.1,
      props.floatingRange?.[0] ?? -0.1,
      props.floatingRange?.[1] ?? 0.1
    )
    groupRef.ref.position.y = yPosition * props.floatIntensity
    groupRef.ref.updateMatrix()
  })
  return (
    <T.Group {...rest}>
      <T.Group ref={mergeRefs(props, groupRef)} matrixAutoUpdate={false}>
        {props.children}
      </T.Group>
    </T.Group>
  )
}
