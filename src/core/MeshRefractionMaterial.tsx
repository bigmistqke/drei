import { SolidThreeFiber, T, ThreeProps, extend, useFrame, useThree } from '@solid-three/fiber'

import { createMemo, onMount } from 'solid-js'
import * as THREE from 'three'
import { MeshBVH, MeshBVHUniformStruct, SAH } from 'three-mesh-bvh'
import { processProps } from '../helpers/processProps'
import { MeshRefractionMaterial as MeshRefractionMaterial_ } from '../materials/MeshRefractionMaterial'

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      MeshRefractionMaterial: typeof MeshRefractionMaterial_
    }
  }
}

type MeshRefractionMaterialProps = ThreeProps<'ShaderMaterial'> & {
  /** Environment map */
  envMap: THREE.CubeTexture | THREE.Texture
  /** Number of ray-cast bounces, it can be expensive to have too many, 2 */
  bounces?: number
  /** Refraction index, 2.4 */
  ior?: number
  /** Fresnel (strip light), 0 */
  fresnel?: number
  /** RGB shift intensity, can be expensive, 0 */
  aberrationStrength?: number
  /** Color, white */
  color?: SolidThreeFiber.Color
  /** If this is on it uses fewer ray casts for the RGB shift sacrificing physical accuracy, true */
  fastChroma?: boolean
}

const isCubeTexture = (def: THREE.CubeTexture | THREE.Texture): def is THREE.CubeTexture =>
  def && (def as THREE.CubeTexture).isCubeTexture

export function MeshRefractionMaterial(_props: MeshRefractionMaterialProps) {
  const [props, rest] = processProps(
    _props,
    {
      aberrationStrength: 0,
      fastChroma: true,
    },
    ['aberrationStrength', 'fastChroma', 'envMap']
  )

  extend({ MeshRefractionMaterial: MeshRefractionMaterial_ })

  let material
  const store = useThree()

  const defines = createMemo(() => {
    const temp = {} as { [key: string]: string }
    // Sampler2D and SamplerCube need different defines
    const isCubeMap = isCubeTexture(props.envMap)
    const w = (isCubeMap ? props.envMap.image[0]?.width : props.envMap.image.width) ?? 1024
    const cubeSize = w / 4
    const _lodMax = Math.floor(Math.log2(cubeSize))
    const _cubeSize = Math.pow(2, _lodMax)
    const width = 3 * Math.max(_cubeSize, 16 * 7)
    const height = 4 * _cubeSize
    if (isCubeMap) temp.ENVMAP_TYPE_CUBEM = ''
    temp.CUBEUV_TEXEL_WIDTH = `${1.0 / width}`
    temp.CUBEUV_TEXEL_HEIGHT = `${1.0 / height}`
    temp.CUBEUV_MAX_MIP = `${_lodMax}.0`
    // Add defines from chromatic aberration
    if (props.aberrationStrength > 0) temp.CHROMATIC_ABERRATIONS = ''
    if (props.fastChroma) temp.FAST_CHROMA = ''
    return temp
  }, [props.aberrationStrength, props.fastChroma])

  onMount(() => {
    // Get the geometry of this materials parent
    const geometry = material?.__r3f?.parent?.geometry
    // Update the BVH
    if (geometry) {
      material.bvh = new MeshBVHUniformStruct()
      material.bvh.updateFrom(new MeshBVH(geometry.clone().toNonIndexed(), { lazyGeneration: false, strategy: SAH }))
    }
  })

  useFrame(({ camera }) => {
    material!.viewMatrixInverse = camera.matrixWorld
    material!.projectionMatrixInverse = camera.projectionMatrixInverse
  })

  return (
    <T.MeshRefractionMaterial
      // @ts-ignore
      key={JSON.stringify(defines)}
      // @ts-ignore
      defines={defines}
      ref={material}
      resolution={[store.size.width, store.size.height]}
      aberrationStrength={props.aberrationStrength}
      envMap={props.envMap}
      {...rest}
    />
  )
}
