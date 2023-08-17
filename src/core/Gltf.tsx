import { ThreeProps } from '@solid-three/fiber'
import { splitProps } from 'solid-js'
import * as THREE from 'three'
import { RefComponent } from '../helpers/typeHelpers'
import { Clone, CloneProps } from './Clone'
import { useGLTF } from './useGLTF'

type GltfProps = Omit<ThreeProps<'Group'>, 'children'> &
  Omit<CloneProps, 'object'> & {
    src: string
  }

export const Gltf: RefComponent<THREE.Object3D, GltfProps> = (_props) => {
  const [props, rest] = splitProps(_props, ['ref', 'src'])
  const resource = useGLTF(_props.src)
  return resource.state === 'ready' ? <Clone ref={props.ref as any} {...rest} object={resource().scene} /> : undefined
}
