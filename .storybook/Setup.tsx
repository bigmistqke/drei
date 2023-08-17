import { Canvas, Props as CanvasProps, T } from '@solid-three/fiber'
import { Vector3 } from 'three'

import { ParentComponent } from 'solid-js'
import { OrbitControls } from '../src'
import { processProps } from '../src/helpers/processProps'

type Props = CanvasProps & {
  cameraFov?: number
  cameraPosition?: Vector3
  controls?: boolean
  lights?: boolean
}

export const Setup: ParentComponent<Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      cameraFov: 75,
      cameraPosition: new Vector3(-5, 5, 5),
      controls: true,
      lights: true,
    },
    ['cameraFov', 'cameraPosition', 'controls', 'lights', 'children']
  )

  return (
    <Canvas
      style={{ height: '100vh' }}
      shadows
      camera={{ position: props.cameraPosition, fov: props.cameraFov }}
      {...rest}
    >
      <T.Color attach="background" args={['black']} />
      {props.children}
      {props.lights && (
        <>
          <T.AmbientLight intensity={0.8} />
          <T.PointLight intensity={1} position={[0, 6, 0]} />
        </>
      )}
      {props.controls && <OrbitControls makeDefault />}
    </Canvas>
  )
}
