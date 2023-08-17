import { T, ThreeProps, useFrame } from '@solid-three/fiber'
import { For, createMemo } from 'solid-js'
import { ColorRepresentation, Group } from 'three'
import { processProps } from '../helpers/processProps'
import { Billboard } from './Billboard'
import { Plane } from './shapes'
import { useTexture } from './useTexture'

const CLOUD_URL = 'https://rawcdn.githack.com/pmndrs/drei-assets/9225a9f1fbd449d9411125c2f419b843d0308c9f/cloud.png'

export function Cloud(
  _props: ThreeProps<'Group'> &
    Partial<{
      opacity: number
      speed: number
      width: number
      depth: number
      segments: number
      texture: string
      color: ColorRepresentation
      depthTest: boolean
    }>
) {
  const [props, rest] = processProps(
    _props,
    {
      opacity: 0.5,
      speed: 0.4,
      width: 10,
      depth: 1.5,
      segments: 20,
      texture: CLOUD_URL,
      color: '#ffffff',
      depthTest: true,
    },
    ['opacity', 'speed', 'width', 'depth', 'segments', 'texture', 'color', 'depthTest']
  )

  let group: Group
  const cloudTexture = useTexture(props.texture)
  const clouds = createMemo(() =>
    [...new Array(props.segments)].map((_, index) => ({
      x: props.width / 2 - Math.random() * props.width,
      y: props.width / 2 - Math.random() * props.width,
      scale: 0.4 + Math.sin(((index + 1) / props.segments) * Math.PI) * ((0.2 + Math.random()) * 10),
      density: Math.max(0.2, Math.random()),
      rotation: Math.max(0.002, 0.005 * Math.random()) * props.speed,
    }))
  )
  useFrame((state) =>
    group?.children.forEach((cloud, index) => {
      cloud.children[0].rotation.z += clouds()[index].rotation
      cloud.children[0].scale.setScalar(
        clouds()[index].scale + (((1 + Math.sin(state.clock.getElapsedTime() / 10)) / 2) * index) / 10
      )
    })
  )
  return (
    <T.Group {...rest}>
      <T.Group position={[0, 0, (props.segments / 2) * props.depth]} ref={group!}>
        <For each={clouds()}>
          {(cloud, index) => (
            <Billboard position={[cloud.x, cloud.y, -index() * props.depth]}>
              <Plane scale={cloud.scale} rotation={[0, 0, 0]}>
                <T.MeshStandardMaterial
                  map={cloudTexture()}
                  transparent
                  opacity={(cloud.scale / 6) * cloud.density * props.opacity}
                  depthTest={props.depthTest}
                  color={props.color}
                />
              </Plane>
            </Billboard>
          )}
        </For>
      </T.Group>
    </T.Group>
  )
}
