import { createSignal } from 'solid-js'

import { Setup } from '../Setup'

import { T, useFrame } from '@solid-three/fiber'
import { Group, InstancedMesh, Mesh, Object3D, Vector3 } from 'three'
import { Float, Sphere, Trail, useTrail } from '../../src'

export default {
  title: 'Misc/Trail',
  component: Trail,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}> {storyFn()}</Setup>],
}

function TrailScene() {
  let group: Group
  let sphere: Mesh
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!group || !sphere) return
    group.rotation.z = t
    sphere.position.x = Math.sin(t * 2) * 2
    sphere.position.z = Math.cos(t * 2) * 2
  })

  return (
    <>
      <T.Group ref={group!}>
        <Trail
          width={1}
          length={4}
          color={'#F8D628'}
          attenuation={(t: number) => {
            return t * t
          }}
        >
          <Sphere ref={sphere!} args={[0.1, 32, 32]} position-y={3}>
            <T.MeshNormalMaterial />
          </Sphere>
        </Trail>
      </T.Group>

      {/* <PerspectiveCamera makeDefault position={[5, 5, 5]} /> */}
      <T.AxesHelper />
    </>
  )
}

export const TrailsSt = () => <TrailScene />
TrailsSt.storyName = 'Default'

function UseTrailScene() {
  const [sphere, setSphere] = createSignal<Mesh>(null!)
  let instancesRef: InstancedMesh
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    sphere().position.x = Math.sin(t) * 3 + Math.cos(t * 2)
    sphere().position.y = Math.cos(t) * 3
  })

  const trailPositions = useTrail(sphere, { length: 5, decay: 5, interval: 6 })
  const n = 1000

  const o = new Object3D()
  function updateInstances() {
    if (!instancesRef) return

    for (let i = 0; i < n; i += 1) {
      const x = trailPositions()?.slice(i * 3, i * 3 + 3)
      // @ts-ignore
      o.position.set(...x)

      o.scale.setScalar((i * 10) / n)
      o.updateMatrixWorld()

      instancesRef.setMatrixAt(i, o.matrixWorld)
    }

    instancesRef.count = n
    instancesRef.instanceMatrix.needsUpdate = true
  }

  useFrame(updateInstances)

  return (
    <>
      <Sphere ref={setSphere} args={[0.1, 32, 32]} position-x={0} position-y={3}>
        <T.MeshNormalMaterial />
      </Sphere>

      <T.InstancedMesh ref={instancesRef!} args={[null!, null!, n]}>
        <T.BoxGeometry args={[0.1, 0.1, 0.1]} />
        <T.MeshNormalMaterial />
      </T.InstancedMesh>
    </>
  )
}

export const UseTrailSt = () => <UseTrailScene />
UseTrailSt.storyName = 'useTrail with Instances'

function UseTrailFloat() {
  let ref
  return (
    <>
      <Float speed={5} floatIntensity={10} ref={ref}>
        <Sphere args={[0.1, 32, 32]} position-x={0}>
          <T.MeshNormalMaterial />
        </Sphere>
      </Float>
      <Trail
        width={1}
        length={4}
        color={'#F8D628'}
        attenuation={(t: number) => {
          return t * t
        }}
        target={ref}
      />
    </>
  )
}

export const TrailFloat = () => <UseTrailFloat />
TrailFloat.storyName = 'Trail with Ref target'
