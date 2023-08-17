import { Accessor, ParentComponent, createRenderEffect, createSignal, untrack } from 'solid-js'

import { MeshSurfaceSampler } from 'three-stdlib'

import { T, ThreeProps } from '@solid-three/fiber'
import { Color, Group, InstancedBufferAttribute, InstancedMesh, Mesh, Object3D, Vector3 } from 'three'
import { processProps } from '../helpers/processProps'
import { when } from '../helpers/when'

type SamplePayload = {
  /**
   * The position of the sample.
   */
  position: Vector3
  /**
   * The normal of the mesh at the sampled position.
   */
  normal: Vector3
  /**
   * The vertex color of the mesh at the sampled position.
   */
  color: Color
}

export type TransformFn = (payload: TransformPayload, i: number) => void

type TransformPayload = SamplePayload & {
  /**
   * The dummy object used to transform each instance.
   * This object's matrix will be updated after transforming & it will be used
   * to set the instance's matrix.
   */
  dummy: Object3D
  /**
   * The mesh that's initially passed to the sampler.
   * Use this if you need to apply transforms from your mesh to your instances
   * or if you need to grab attributes from the geometry.
   */
  sampledMesh: Mesh
}

type Props = {
  /**
   * The mesh that will be used to sample.
   * Does not need to be in the scene graph.
   */
  mesh?: Mesh
  /**
   * The InstancedMesh that will be controlled by the component.
   * This InstancedMesh's count value will determine how many samples are taken.
   *
   * @see Props.transform to see how to apply transformations to your instances based on the samples.
   *
   */
  instances?: InstancedMesh
  /**
   * The NAME of the weight attribute to use when sampling.
   *
   * @see https://threejs.org/docs/#examples/en/math/MeshSurfaceSampler.setWeightAttribute
   */
  weight?: string
  /**
   * Transformation to be applied to each instance.
   * Receives a dummy object3D with all the sampled data ( @see TransformPayload ).
   * It should mutate `transformPayload.dummy`.
   *
   * @see ( @todo add link to example )
   *
   * There is no need to update the dummy's matrix
   */
  transform?: TransformFn

  count?: number
}

export interface useSurfaceSamplerProps {
  transform?: TransformFn
  weight?: string
  count?: number
}

// s3f:   unsure if hooks work the same way as they would in `react`
export function useSurfaceSampler(
  mesh: Accessor<Mesh | undefined>,
  count: number = 16,
  transform?: TransformFn,
  weight?: string,
  instanceMesh?: Accessor<InstancedMesh | undefined>
) {
  const arr = Array.from({ length: count }, () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).flat()

  const [buffer, setBuffer] = createSignal<InstancedBufferAttribute>(
    new InstancedBufferAttribute(Float32Array.from(arr), 16),
    {
      equals: false,
    }
  )

  createRenderEffect(() =>
    when(mesh)((mesh) => {
      const sampler = new MeshSurfaceSampler(mesh)
      if (weight) {
        sampler.setWeightAttribute(weight)
      }

      sampler.build()

      const position = new Vector3()
      const normal = new Vector3()
      const color = new Color()
      const dummy = new Object3D()

      mesh.updateMatrixWorld(true)

      for (let i = 0; i < count; i++) {
        sampler.sample(position, normal, color)

        if (typeof transform === 'function') {
          transform(
            {
              dummy,
              sampledMesh: mesh,
              position,
              normal,
              color,
            },
            i
          )
        } else {
          dummy.position.copy(position)
        }

        dummy.updateMatrix()
        when(instanceMesh)((instanceMesh) => instanceMesh.setMatrixAt(i, dummy.matrix))

        untrack(() => dummy.matrix.toArray(buffer().array, i * 16))
      }

      when(instanceMesh)((instanceMesh) => (instanceMesh.instanceMatrix.needsUpdate = true))

      untrack(() => {
        buffer().needsUpdate = true

        setBuffer(buffer().clone())
      })
    })
  )

  return buffer
}

export const Sampler: ParentComponent<Props & ThreeProps<'Group'>> = function (_props) {
  const [props, rest] = processProps(
    _props,
    {
      count: 16,
    },
    ['children', 'weight', 'transform', 'instances', 'mesh', 'count']
  )

  const [group, setGroup] = createSignal<Group>()
  const [instance, setInstance] = createSignal<InstancedMesh>()
  const [meshToSample, setMeshToSample] = createSignal<Mesh>()

  createRenderEffect(() =>
    when(group)((group) => {
      setInstance(props.instances ?? (group.children.find((c) => c.hasOwnProperty('instanceMatrix')) as InstancedMesh))
      setMeshToSample(props.mesh ?? (group.children.find((c) => c.type === 'Mesh') as Mesh))
    })
  )

  useSurfaceSampler(meshToSample, props.count, props.transform, props.weight, instance)

  return (
    <T.Group ref={setGroup} {...rest}>
      {props.children}
    </T.Group>
  )
}
