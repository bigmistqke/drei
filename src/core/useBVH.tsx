import { T, ThreeProps, useThree } from '@solid-three/fiber'
import { Accessor, createEffect, onCleanup } from 'solid-js'
import { Group, Mesh } from 'three'
import { SAH, SplitStrategy, acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'
import { when } from '../helpers/when'

export interface BVHOptions {
  /** Split strategy, default: SAH (slowest to construct, fastest runtime, least memory) */
  strategy?: SplitStrategy
  /** Print out warnings encountered during tree construction, default: false */
  verbose?: boolean
  /** If true then the bounding box for the geometry is set once the BVH has been constructed, default: true */
  setBoundingBox?: boolean
  /** The maximum depth to allow the tree to build to, default: 40 */
  maxDepth?: number
  /** The number of triangles to aim for in a leaf node, default: 10 */
  maxLeafTris?: number
}

export type BvhProps = BVHOptions &
  ThreeProps<'Group'> & {
    /**Enabled, default: true */
    enabled?: boolean
    /** Use .raycastFirst to retrieve hits which is generally faster, default: false */
    firstHitOnly?: boolean
  }

const isMesh = (child: any): child is Mesh => child.isMesh

/**
 * @deprecated Use the Bvh component instead
 */
export function useBVH(mesh: Accessor<Mesh | undefined>, options?: BVHOptions) {
  options = {
    strategy: SAH,
    verbose: false,
    setBoundingBox: true,
    maxDepth: 40,
    maxLeafTris: 10,
    ...options,
  }
  createEffect(() =>
    when(mesh)((mesh) => {
      mesh.raycast = acceleratedRaycast
      const geometry: any = mesh.geometry
      geometry.computeBoundsTree = computeBoundsTree
      geometry.disposeBoundsTree = disposeBoundsTree
      geometry.computeBoundsTree(options)

      onCleanup(() => {
        if (geometry.boundsTree) {
          geometry.disposeBoundsTree()
        }
      })
    })
  )
}

export const Bvh: RefComponent<unknown, BvhProps> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      enabled: true,
      firstHitOnly: false,
      strategy: SAH,
      verbose: false,
      setBoundingBox: true,
      maxDepth: 40,
      maxLeafTris: 10,
    },
    ['ref', 'enabled', 'firstHitOnly', 'children', 'strategy', 'verbose', 'setBoundingBox', 'maxDepth', 'maxLeafTris']
  )

  let ref: Group = null!

  const store = useThree()
  createImperativeHandle(props, () => ref)

  createEffect(() => {
    if (props.enabled) {
      const options = {
        strategy: props.strategy,
        verbose: props.verbose,
        setBoundingBox: props.setBoundingBox,
        maxDepth: props.maxDepth,
        maxLeafTris: props.maxLeafTris,
      }
      const group = ref
      // This can only safely work if the component is used once, but there is no alternative.
      // Hijacking the raycast method to do it for individual meshes is not an option as it would
      // cost too much memory ...
      store.raycaster.firstHitOnly = props.firstHitOnly
      group.traverse((child) => {
        // Only include meshes that do not yet have a boundsTree and whose raycast is standard issue
        if (isMesh(child) && !child.geometry.boundsTree && child.raycast === Mesh.prototype.raycast) {
          child.raycast = acceleratedRaycast
          child.geometry.computeBoundsTree = computeBoundsTree
          child.geometry.disposeBoundsTree = disposeBoundsTree
          child.geometry.computeBoundsTree(options)
        }
      })
      onCleanup(() => {
        delete store.raycaster.firstHitOnly
        group.traverse((child) => {
          if (isMesh(child) && child.geometry.boundsTree) {
            child.geometry.disposeBoundsTree()
            child.raycast = Mesh.prototype.raycast
          }
        })
      })
    }
  })

  return (
    <T.Group ref={ref} {...rest}>
      {props.children}
    </T.Group>
  )
}
