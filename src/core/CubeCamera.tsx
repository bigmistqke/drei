import { Primitive, T, ThreeProps, useFrame } from '@solid-three/fiber'
import { JSX } from 'solid-js'
import { Group, Texture } from 'three'

import { processProps } from '../helpers/processProps'
import { CubeCameraOptions, useCubeCamera } from './useCubeCamera'

type Props = Omit<ThreeProps<'Group'>, 'children'> & {
  /** The contents of CubeCamera will be hidden when filming the cube */
  children: (tex: Texture) => JSX.Element
  /** Number of frames to render, Infinity */
  frames?: number
} & CubeCameraOptions

export function CubeCamera(_props: Props) {
  const [props, rest] = processProps(
    _props,
    {
      frames: Infinity,
    },
    ['children', 'frames', 'resolution', 'near', 'far', 'envMap', 'fog']
  )

  let ref: Group
  const { fbo, camera, update } = useCubeCamera({
    resolution: props.resolution,
    near: props.near,
    far: props.far,
    envMap: props.envMap,
    fog: props.fog,
  })

  let count = 0
  useFrame(() => {
    if (ref && (props.frames === Infinity || count < props.frames)) {
      ref.visible = false
      update()
      ref.visible = true
      count++
    }
  })
  return (
    <T.Group {...rest}>
      <Primitive object={camera()} />
      <T.Group ref={ref!}>{props.children(fbo().texture)}</T.Group>
    </T.Group>
  )
}
