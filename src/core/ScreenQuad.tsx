// reference: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
// and @gsimone ;)
import { T, ThreeProps } from '@solid-three/fiber'
import { splitProps } from 'solid-js'
import * as THREE from 'three'
import { RefComponent } from '../helpers/typeHelpers'

function createScreenQuadGeometry() {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([-1, -1, 3, -1, -1, 3])
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 2))
  return geometry
}

type Props = Omit<ThreeProps<'Mesh'>, 'args'>

export const ScreenQuad: RefComponent<THREE.Mesh, Props> = function ScreenQuad(_props) {
  const [props, rest] = splitProps(_props, ['children'])
  const geometry = createScreenQuadGeometry()

  return (
    <T.Mesh geometry={geometry} frustumCulled={false} {...rest}>
      {props.children}
    </T.Mesh>
  )
}
