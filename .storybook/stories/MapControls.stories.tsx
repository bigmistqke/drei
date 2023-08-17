import { Canvas, T, useLoader } from '@solid-three/fiber'
import { For, Suspense, createMemo, createSignal, onMount } from 'solid-js'
import { Box3, Sphere, Vector3 } from 'three'
import { SVGLoader } from 'three-stdlib'

import { MapControls } from '../../src'
import { when } from '../../src/helpers/when'

export default {
  title: 'Controls/MapControls',
  component: MapControlsScene,
}

const Cell = (props: { color; shape; fillOpacity }) => {
  return (
    <T.Mesh>
      <T.MeshBasicMaterial color={'black'} opacity={props.fillOpacity} depthWrite={false} transparent />
      <T.ShapeGeometry args={[props.shape]} />
    </T.Mesh>
  )
}

function Svg() {
  const [center, setCenter] = createSignal(new Vector3(0, 0, 0))
  let ref: THREE.Group = null!

  const resource = useLoader(SVGLoader, 'map.svg')

  const shapes = createMemo(() =>
    when(resource)(({ paths }) =>
      paths.flatMap((p) =>
        p.toShapes(true).map((shape) =>
          //@ts-expect-error this issue has been raised https://github.com/mrdoob/three.js/pull/21059
          ({ shape, color: p.color, fillOpacity: p.userData.style.fillOpacity })
        )
      )
    )
  )

  onMount(() => {
    const box = new Box3().setFromObject(ref)
    const sphere = new Sphere()
    box.getBoundingSphere(sphere)
    setCenter((vec) => vec.set(-sphere.center.x, -sphere.center.y, 0))
  })

  return (
    <T.Group position={center()} ref={ref}>
      <For each={shapes()}>
        {
          // @ts-expect-error this issue has been raised https://github.com/mrdoob/three.js/pull/21058
          (props) => <Cell key={props.shape.uuid} {...props} />
        }
      </For>
    </T.Group>
  )
}

function MapControlsScene() {
  return (
    <Canvas
      style={{ height: '100vh' }}
      orthographic
      camera={{ position: [0, 0, 50], zoom: 10, up: [0, 0, 1], far: 10000 }}
    >
      <T.Color attach="background" args={[243, 243, 243]} />
      <Suspense fallback={null}>
        <Svg />
      </Suspense>
      <MapControls />
    </Canvas>
  )
}

export const MapControlsSceneSt = () => <MapControlsScene />
MapControlsSceneSt.story = {
  name: 'Default',
}
