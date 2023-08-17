import { T } from '@solid-three/fiber'
import { For, JSX, createMemo, createSignal } from 'solid-js'
import { Euler, InstancedBufferAttribute, Matrix4, Mesh, Quaternion, Vector3 } from 'three'
import { Decal, PerspectiveCamera, Sampler, useSurfaceSampler, useTexture } from '../../src'
import { Setup } from '../Setup'

function LoopOverInstancedBufferAttribute(props: { buffer?: InstancedBufferAttribute; children: any }) {
  const m = new Matrix4()
  return (
    <For each={new Array(props.buffer?.count || [])}>
      {(_, i) =>
        createMemo(() => {
          const p = new Vector3()
          const q = new Quaternion()
          const r = new Euler()
          const s = new Vector3()
          m.fromArray(props.buffer!.array, i() * 16)
          m.decompose(p, q, s)
          r.setFromQuaternion(q)

          return props.children({ key: i, position: p, rotation: r, scale: s })
        }) as unknown as JSX.Element
      }
    </For>
  )
}

export default {
  title: 'Misc/Decal',
  component: Sampler,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <T.Suspense fallback={null}>{storyFn()}</T.Suspense>
      </Setup>
    ),
  ],
}

function DecalScene() {
  const [ref, setRef] = createSignal<Mesh>()

  const resource = useTexture(['/decals/react.png', '/decals/three.png'])

  const transform = ({ dummy, position, normal }) => {
    const p = new Vector3()
    p.copy(position)

    const r = new Euler()
    r.x = Math.random() * Math.PI

    dummy.position.copy(position)
    dummy.rotation.copy(r)
    dummy.lookAt(p.add(normal))
  }

  const bufferAttribute = useSurfaceSampler(ref, 50, transform)

  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 6, 6]} />

      <T.DirectionalLight position={[1, -1, 1]} />

      <T.Mesh ref={setRef}>
        <T.SphereGeometry args={[3, 32, 32]} />
        <T.MeshPhysicalMaterial color={'tomato'} roughness={0.5} />
      </T.Mesh>

      <LoopOverInstancedBufferAttribute buffer={bufferAttribute()}>
        {(props) => (
          <Decal mesh={ref()} {...props}>
            <T.MeshPhysicalMaterial
              roughness={0.2}
              transparent
              depthTest={false}
              map={Math.random() > 0.5 ? resource()?.[0] : resource()?.[1]}
              alphaTest={0}
              polygonOffset={true}
              polygonOffsetFactor={-10}
            />
          </Decal>
        )}
      </LoopOverInstancedBufferAttribute>
    </>
  )
}

export const DecalSt = () => (
  <T.Suspense>
    <DecalScene />
  </T.Suspense>
)
DecalSt.storyName = 'Default'
