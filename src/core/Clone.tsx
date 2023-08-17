import { Primitive, T, ThreeProps } from '@solid-three/fiber'
import pick from 'lodash.pick'
import { For, Show, createMemo, splitProps, type JSX } from 'solid-js'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'

export type CloneProps = {
  /** Any pre-existing THREE.Object3D (groups, meshes, ...), or an array of objects */
  object: THREE.Object3D | THREE.Object3D[]
  /** Children will be placed within the object, or within the group that holds arrayed objects */
  children?: JSX.Element
  /** Can clone materials and/or geometries deeply (default: false) */
  deep?: boolean | 'materialsOnly' | 'geometriesOnly'
  /** The property keys it will shallow-clone (material, geometry, visible, ...) */
  keys?: string[]
  /** Can either spread over props or fill in JSX children, applies to every mesh within */
  inject?: ThreeProps<'Mesh'> | JSX.Element | ((object: THREE.Object3D) => JSX.Element)
  /** Short access castShadow, applied to every mesh within */
  castShadow?: boolean
  /** Short access receiveShadow, applied to every mesh within */
  receiveShadow?: boolean
  isChild?: boolean
}

function createSpread(
  child: THREE.Object3D,
  {
    keys = [
      'near',
      'far',
      'color',
      'distance',
      'decay',
      'penumbra',
      'angle',
      'intensity',
      'skeleton',
      'visible',
      'castShadow',
      'receiveShadow',
      'morphTargetDictionary',
      'morphTargetInfluences',
      'name',
      'geometry',
      'material',
      'position',
      'rotation',
      'scale',
      'up',
      'userData',
      'bindMode',
      'bindMatrix',
      'bindMatrixInverse',
      'skeleton',
    ],
    deep,
    inject,
    castShadow,
    receiveShadow,
  }: Omit<Parameters<typeof T.Group>[0], 'children'> & Partial<CloneProps>
) {
  let spread = pick(child, keys)
  if (deep) {
    if (spread.geometry && deep !== 'materialsOnly') spread.geometry = spread.geometry.clone()
    if (spread.material && deep !== 'geometriesOnly') spread.material = spread.material.clone()
  }
  if (inject) {
    if (typeof inject === 'function') spread = { ...spread, children: inject(child) }
    // s3f    no solid equivalent to React.isValidElement
    else if (React.isValidElement(inject)) spread = { ...spread, children: inject }
    else spread = { ...spread, ...(inject as any) }
  }

  if (child instanceof THREE.Mesh) {
    if (castShadow) spread.castShadow = true
    if (receiveShadow) spread.receiveShadow = true
  }
  return spread
}

export const Clone: RefComponent<THREE.Group, ThreeProps<'Group'> & CloneProps, true> = (_props) => {
  const [props, rest] = processProps(_props, { isChild: false }, [
    'ref',
    'isChild',
    'object',
    'children',
    'deep',
    'castShadow',
    'receiveShadow',
    'inject',
    'keys',
  ])

  const [config] = splitProps(props, ['keys', 'deep', 'inject', 'castShadow', 'receiveShadow'])

  const object = createMemo(() => {
    if (props.isChild === false && !Array.isArray(props.object)) {
      let isSkinned = false
      props.object.traverse((object) => {
        if ((object as any).isSkinnedMesh) isSkinned = true
      })
      if (isSkinned) return SkeletonUtils.clone(props.object)
    }
    return props.object
  })

  return (
    <>
      <Show
        when={!Array.isArray(object())}
        fallback={
          <>
            {/* Deal with arrayed clones */}
            <T.Group {...rest} ref={props.ref}>
              <For each={object() as THREE.Object3D<THREE.Event>[]}>{(o) => <Clone object={o} {...config} />}</For>
              {props.children}
            </T.Group>
          </>
        }
      >
        {(v) => {
          /* Singleton clones */
          const obj = object() as THREE.Object3D<THREE.Event>
          const { children: injectChildren, ...spread } = createSpread(obj, config)
          const Element = obj.type[0].toLowerCase() + obj.type.slice(1)
          return (
            <Element {...spread} {...props} ref={props.ref}>
              <For each={(obj as THREE.Object3D<THREE.Event>).children}>
                {(child) => {
                  if (child.type === 'Bone') return <Primitive object={child} {...config} />
                  return <Clone object={child} {...config} isChild />
                }}
              </For>
              {props.children}
              {injectChildren}
            </Element>
          )
        }}
      </Show>
    </>
  )
}
