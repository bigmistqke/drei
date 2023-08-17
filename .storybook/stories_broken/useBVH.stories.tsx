import { For, createEffect, createSignal } from 'solid-js'

import { MeshBVHVisualizer } from 'three-mesh-bvh'
import { Setup } from '../Setup'

import { T, useFrame, useThree } from '@solid-three/fiber'
import { boolean, select, withKnobs } from '@storybook/addon-knobs'
import { Mesh, Raycaster, Vector3 } from 'three'
import { OrbitControls, TorusKnot, useBVH, useHelper } from '../../src'

export default {
  title: 'Performance/useBVH',
  component: useBVH,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>, withKnobs],
}

function TorusBVH({ bvh, ...props }) {
  let mesh
  let dummy

  const strat = select('split strategy', ['CENTER', 'AVERAGE', 'SAH'], 'CENTER')
  useBVH(bvh ? mesh : dummy, {
    splitStrategy: strat,
  })
  const debug = boolean('vizualize bounds', true)

  useHelper(debug ? mesh : dummy, MeshBVHVisualizer)

  const [hovered, setHover] = createSignal(false)
  return (
    <TorusKnot
      {...props}
      ref={mesh}
      args={[1, 0.4, 250, 50]}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <T.MeshBasicMaterial color={hovered() ? 0xffff00 : 0xff0000} />
    </TorusKnot>
  )
}

const pointDist = 5
const raycaster = new Raycaster()
const origVec = new Vector3()
const dirVec = new Vector3()

const AddRaycaster = ({ grp }) => {
  // Objects
  let objRef: Mesh
  let origMesh: Mesh
  let hitMesh: Mesh
  let cylinderMesh: Mesh

  // set transforms
  createEffect(() => {
    if (!objRef || !origMesh || !hitMesh || !cylinderMesh) {
      return
    }
    hitMesh.scale.multiplyScalar(0.5)
    origMesh.position.set(pointDist, 0, 0)
    objRef.rotation.x = Math.random() * 10
    objRef.rotation.y = Math.random() * 10
  }, [])

  const xDir = Math.random() - 0.5
  const yDir = Math.random() - 0.5

  useFrame((_, delta) => {
    const obj: Mesh | null = objRef
    if (!obj || !origMesh || !hitMesh || !cylinderMesh) {
      return
    }
    obj.rotation.x += xDir * delta
    obj.rotation.y += yDir * delta

    origMesh.updateMatrixWorld()
    origVec.setFromMatrixPosition(origMesh.matrixWorld)
    dirVec.copy(origVec).multiplyScalar(-1).normalize()

    raycaster.set(origVec, dirVec)
    const ray: any = raycaster
    ray.firstHitOnly = true
    const res = raycaster.intersectObject(grp, true)
    const length = res.length ? res[0].distance : pointDist

    hitMesh.position.set(pointDist - length, 0, 0)
    cylinderMesh.position.set(pointDist - length / 2, 0, 0)
    cylinderMesh.scale.set(1, length, 1)
    cylinderMesh.rotation.z = Math.PI / 2
  })

  return (
    <T.Group ref={objRef!}>
      <T.Mesh ref={origMesh!}>
        <T.SphereGeometry args={[0.1, 20, 20]} />
        <T.MeshBasicMaterial color={0xffffff} />
      </T.Mesh>
      <T.Mesh ref={hitMesh!}>
        <T.SphereGeometry args={[0.1, 20, 20]} />
        <T.MeshBasicMaterial color={0xffffff} />
      </T.Mesh>
      <T.Mesh ref={cylinderMesh!}>
        <T.CylinderGeometry args={[0.01, 0.01]} />
        <T.MeshBasicMaterial color={0xffffff} transparent opacity={0.25} />
      </T.Mesh>
    </T.Group>
  )
}

const DebugRayCast = ({ grp }) => {
  return <For each={new Array(40).fill({})}>{() => <AddRaycaster grp={grp} />}</For>
}

/* s3f:   story works but performance isn't great, should do A/B with r3f's version */
function Scene() {
  let grp
  const bvh = boolean('raycast bvh enabled', true)

  const store = useThree()
  store.raycaster.firstHitOnly = true

  return (
    <>
      <T.Group ref={grp}>
        <TorusBVH bvh={bvh} position-z={-2} />
        <TorusBVH bvh={bvh} position-z={0} />
        <TorusBVH bvh={bvh} position-z={2} />
      </T.Group>
      <DebugRayCast grp={grp} />
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'
