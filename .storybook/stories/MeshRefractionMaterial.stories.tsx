import { T, useLoader } from '@solid-three/fiber'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'
import {
  AccumulativeShadows,
  Caustics,
  CubeCamera,
  Environment,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  OrbitControls,
  RandomizedLight,
  useGLTF,
} from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Shaders/MeshRefractionMaterial',
  component: MeshRefractionMaterial,
  decorators: [
    (storyFn) => (
      <Setup cameraFov={45} cameraPosition={new THREE.Vector3(-5, 0.5, 5)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function Diamond(props: any) {
  let ref
  const resource = useGLTF('/dflat.glb') as any
  // Use a custom envmap/scene-backdrop for the diamond material
  // This way we can have a clear BG while cube-cam can still film other objects
  const texture = useLoader(
    RGBELoader,
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr'
  )
  return (
    <CubeCamera resolution={256} frames={1} envMap={texture()}>
      {(texture) => (
        <Caustics
          // @ts-ignore
          backfaces
          color="white"
          position={[0, -0.5, 0]}
          lightSource={[5, 5, -10]}
          worldRadius={0.1}
          ior={1.8}
          backfaceIor={1.1}
          intensity={0.1}
        >
          <T.Mesh castShadow ref={ref} geometry={resource()?.nodes.Diamond_1_0.geometry} {...props}>
            <MeshRefractionMaterial
              envMap={texture}
              bounces={3}
              aberrationStrength={0.01}
              ior={2.75}
              fresnel={1}
              fastChroma
              toneMapped={false}
            />
          </T.Mesh>
        </Caustics>
      )}
    </CubeCamera>
  )
}

export const RefractionSt = () => (
  <T.Suspense fallback={null}>
    <T.Color attach="background" args={['#f0f0f0']} />
    <T.AmbientLight intensity={0.5} />
    <T.SpotLight position={[5, 5, -10]} angle={0.15} penumbra={1} />
    <T.PointLight position={[-10, -10, -10]} />
    <Diamond rotation={[0, 0, 0.715]} position={[0, -0.175 + 0.5, 0]} />
    {/* @ts-ignore */}
    <Caustics
      color="#FF8F20"
      position={[0, -0.5, 0]}
      lightSource={[5, 5, -10]}
      worldRadius={0.003}
      ior={1.16}
      intensity={0.004}
    >
      <T.Mesh castShadow receiveShadow position={[-2, 0.5, -1]} scale={0.5}>
        <T.SphereGeometry args={[1, 64, 64]} />
        {/* @ts-ignore */}
        <MeshTransmissionMaterial resolution={1024} distortion={0.25} color="#FF8F20" thickness={1} anisotropy={1} />
      </T.Mesh>
    </Caustics>
    <T.Mesh castShadow receiveShadow position={[1.75, 0.25, 1]} scale={0.75}>
      <T.SphereGeometry args={[1, 64, 64]} />
      <T.MeshStandardMaterial color="hotpink" />
    </T.Mesh>
    <AccumulativeShadows
      temporal
      frames={100}
      color="orange"
      colorBlend={2}
      toneMapped={true}
      alphaTest={0.8}
      opacity={1}
      scale={12}
      position={[0, -0.5, 0]}
    >
      <RandomizedLight amount={8} radius={10} ambient={0.5} intensity={1} position={[5, 5, -10]} bias={0.001} />
    </AccumulativeShadows>
    <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr" />
    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.1} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
  </T.Suspense>
)
RefractionSt.storyName = 'Default'
