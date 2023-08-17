import { Primitive, T, ThreeProps, extend, useFrame, useLoader } from '@solid-three/fiber'
import { BufferGeometry, CatmullRomCurve3, LineBasicMaterial, LineLoop, Vector3 } from 'three'
import { FontLoader, TextGeometry, TextGeometryParameters } from 'three-stdlib'

import { createMemo, onMount } from 'solid-js'
import { CurveModifier, CurveModifierRef } from '../../src'
import { Setup } from '../Setup'

extend({ StdText: TextGeometry })

type TextGeometryImpl = ThreeProps<'ExtrudeGeometry'> & {
  args: [string, TextGeometryParameters]
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      StdText: TextGeometryImpl
    }
  }
}

const cameraPosition = new Vector3(0, 10, 20)

export default {
  title: 'Modifiers/CurveModifier',
  component: CurveModifier,
  decorators: [(storyFn) => <Setup cameraPosition={cameraPosition}>{storyFn()}</Setup>],
}

function CurveModifierScene() {
  let curveRef: CurveModifierRef
  let geomRef: TextGeometry = null!
  const font = useLoader(FontLoader, '/fonts/helvetiker_regular.typeface.json')

  const handlePos = createMemo(() =>
    [
      { x: 10, y: 0, z: -10 },
      { x: 10, y: 0, z: 10 },
      { x: -10, y: 0, z: 10 },
      { x: -10, y: 0, z: -10 },
    ].map((hand) => new Vector3(...Object.values(hand)))
  )

  const curve = createMemo(() => new CatmullRomCurve3(handlePos(), true, 'centripetal'))

  const line = createMemo(
    () =>
      new LineLoop(
        new BufferGeometry().setFromPoints(curve().getPoints(50)),
        new LineBasicMaterial({ color: 0x00ff00 })
      )
  )

  useFrame(() => {
    if (curveRef) {
      curveRef?.moveAlongCurve(0.001)
    }
  })

  onMount(() => geomRef.rotateX(Math.PI))

  return (
    <>
      <CurveModifier ref={curveRef!} curve={curve()}>
        <T.Mesh>
          <T.StdText
            attach="geometry"
            args={[
              // @ts-ignore
              'hello @solid-three/drei',
              {
                font: font()!,
                size: 2,
                height: 0.05,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.01,
                bevelOffset: 0,
                bevelSegments: 5,
              },
            ]}
            ref={geomRef}
          />
          <T.MeshNormalMaterial attach="material" />
        </T.Mesh>
      </CurveModifier>
      <Primitive object={line()} />
    </>
  )
}

export const CurveModifierSt = () => (
  <T.Suspense fallback={null}>
    <CurveModifierScene />
  </T.Suspense>
)
CurveModifierSt.storyName = 'Default'
