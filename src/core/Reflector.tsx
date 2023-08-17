import { T, ThreeProps, extend, useFrame, useThree } from '@solid-three/fiber'
import { createEffect, createMemo, type Component, type JSX } from 'solid-js'
import {
  DepthFormat,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Plane,
  Texture,
  UnsignedShortType,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from 'three'
import { mergeRefs } from '../helpers/mergeRefs'

import { createRef } from '../helpers/createRef'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { BlurPass } from '../materials/BlurPass'
import { MeshReflectorMaterial, MeshReflectorMaterialProps } from '../materials/MeshReflectorMaterial'

export type ReflectorProps = Omit<ThreeProps<'Mesh'>, 'args' | 'children'> &
  Pick<ThreeProps<'PlaneGeometry'>, 'args'> & {
    resolution?: number
    mixBlur?: number
    mixStrength?: number
    blur?: [number, number] | number
    mirror: number
    minDepthThreshold?: number
    maxDepthThreshold?: number
    depthScale?: number
    depthToBlurRatioBias?: number
    debug?: number
    distortionMap?: Texture
    distortion?: number
    mixContrast?: number
    children?: {
      (Component: Component<MeshReflectorMaterialProps>, ComponentProps: MeshReflectorMaterialProps): JSX.Element | null
    }
  }

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      MeshReflectorMaterial: MeshReflectorMaterialProps
    }
  }
}

extend({ MeshReflectorMaterial })

/**
 * @deprecated Use MeshReflectorMaterial instead
 */
export const Reflector: RefComponent<Mesh, ReflectorProps> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      mixBlur: 0,
      mixStrength: 0.5,
      resolution: 256,
      blur: [0, 0],
      args: [1, 1],
      minDepthThreshold: 0.9,
      maxDepthThreshold: 1,
      depthScale: 0,
      depthToBlurRatioBias: 0.25,
      mirror: 0,
      debug: 0,
      distortion: 1,
      mixContrast: 1,
    },
    [
      'ref',
      'mixBlur',
      'mixStrength',
      'resolution',
      'blur',
      'args',
      'minDepthThreshold',
      'maxDepthThreshold',
      'depthScale',
      'depthToBlurRatioBias',
      'mirror',
      'children',
      'debug',
      'distortion',
      'mixContrast',
      'distortionMap',
    ]
  )

  createEffect(() => {
    console.warn(
      'Reflector has been deprecated and will be removed next major. Replace it with <MeshReflectorMaterial />!'
    )
  }, [])

  const store = useThree()

  const blur = () => (Array.isArray(props.blur) ? props.blur : [props.blur, props.blur])
  const hasBlur = () => blur()[0] + blur()[1] > 0

  const meshRef = createRef<Mesh>(null!)
  const reflectorPlane = new Plane()
  const normal = new Vector3()
  const reflectorWorldPosition = new Vector3()
  const cameraWorldPosition = new Vector3()
  const rotationMatrix = new Matrix4()
  const lookAtPosition = new Vector3(0, 0, -1)
  const clipPlane = new Vector4()
  const view = new Vector3()
  const target = new Vector3()
  const q = new Vector4()
  const textureMatrix = new Matrix4()
  const virtualCamera = new PerspectiveCamera()

  const beforeRender = () => {
    reflectorWorldPosition.setFromMatrixPosition(meshRef.ref.matrixWorld)
    cameraWorldPosition.setFromMatrixPosition(store.camera.matrixWorld)
    rotationMatrix.extractRotation(meshRef.ref.matrixWorld)
    normal.set(0, 0, 1)
    normal.applyMatrix4(rotationMatrix)
    view.subVectors(reflectorWorldPosition, cameraWorldPosition)
    // Avoid rendering when reflector is facing away
    if (view.dot(normal) > 0) return
    view.reflect(normal).negate()
    view.add(reflectorWorldPosition)
    rotationMatrix.extractRotation(store.camera.matrixWorld)
    lookAtPosition.set(0, 0, -1)
    lookAtPosition.applyMatrix4(rotationMatrix)
    lookAtPosition.add(cameraWorldPosition)
    target.subVectors(reflectorWorldPosition, lookAtPosition)
    target.reflect(normal).negate()
    target.add(reflectorWorldPosition)
    virtualCamera.position.copy(view)
    virtualCamera.up.set(0, 1, 0)
    virtualCamera.up.applyMatrix4(rotationMatrix)
    virtualCamera.up.reflect(normal)
    virtualCamera.lookAt(target)
    virtualCamera.far = store.camera.far // Used in WebGLBackground
    virtualCamera.updateMatrixWorld()
    virtualCamera.projectionMatrix.copy(store.camera.projectionMatrix)
    // Update the texture matrix
    textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0)
    textureMatrix.multiply(virtualCamera.projectionMatrix)
    textureMatrix.multiply(virtualCamera.matrixWorldInverse)
    textureMatrix.multiply(meshRef.ref.matrixWorld)
    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition)
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse)
    clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant)
    const projectionMatrix = virtualCamera.projectionMatrix
    q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
    q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    q.z = -1.0
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]
    // Calculate the scaled plane vector
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))
    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x
    projectionMatrix.elements[6] = clipPlane.y
    projectionMatrix.elements[10] = clipPlane.z + 1.0
    projectionMatrix.elements[14] = clipPlane.w
  }

  const memo = createMemo(() => {
    const parameters = {
      type: HalfFloatType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    }
    const fbo1 = new WebGLRenderTarget(props.resolution, props.resolution, parameters)
    fbo1.depthBuffer = true
    fbo1.depthTexture = new DepthTexture(props.resolution, props.resolution)
    fbo1.depthTexture.format = DepthFormat
    fbo1.depthTexture.type = UnsignedShortType
    const fbo2 = new WebGLRenderTarget(props.resolution, props.resolution, parameters)
    const blurpass = new BlurPass({
      gl: store.gl,
      resolution: props.resolution,
      width: blur()[0],
      height: blur()[1],
      minDepthThreshold: props.minDepthThreshold,
      maxDepthThreshold: props.maxDepthThreshold,
      depthScale: props.depthScale,
      depthToBlurRatioBias: props.depthToBlurRatioBias,
    })
    const reflectorProps = {
      mirror: props.mirror,
      textureMatrix,
      mixBlur: props.mixBlur,
      tDiffuse: fbo1.texture,
      tDepth: fbo1.depthTexture,
      tDiffuseBlur: fbo2.texture,
      hasBlur: hasBlur(),
      mixStrength: props.mixStrength,
      minDepthThreshold: props.minDepthThreshold,
      maxDepthThreshold: props.maxDepthThreshold,
      depthScale: props.depthScale,
      depthToBlurRatioBias: props.depthToBlurRatioBias,
      transparent: true,
      debug: props.debug,
      distortion: props.distortion,
      distortionMap: props.distortionMap,
      mixContrast: props.mixContrast,
      'defines-USE_BLUR': hasBlur() ? '' : undefined,
      'defines-USE_DEPTH': props.depthScale > 0 ? '' : undefined,
      'defines-USE_DISTORTION': props.distortionMap ? '' : undefined,
    }
    return { fbo1, fbo2, blurpass, reflectorProps }
  })

  useFrame(() => {
    if (!meshRef.ref) return
    meshRef.ref.visible = false
    const currentXrEnabled = store.gl.xr.enabled
    const currentShadowAutoUpdate = store.gl.shadowMap.autoUpdate
    beforeRender()
    store.gl.xr.enabled = false
    store.gl.shadowMap.autoUpdate = false
    store.gl.setRenderTarget(memo().fbo1)
    store.gl.state.buffers.depth.setMask(true)
    if (!store.gl.autoClear) store.gl.clear()
    store.gl.render(store.scene, virtualCamera)
    if (hasBlur()) memo().blurpass.render(store.gl, memo().fbo1, memo().fbo2)
    store.gl.xr.enabled = currentXrEnabled
    store.gl.shadowMap.autoUpdate = currentShadowAutoUpdate
    meshRef.ref.visible = true
    store.gl.setRenderTarget(null)
  })

  return (
    <T.Mesh ref={mergeRefs(meshRef, props)} {...rest}>
      <T.PlaneGeometry args={props.args} />
      {/* s3f:  original code
                    `children('meshReflectorMaterial', reflectorProps)`   
                    with 'meshReflectorMaterial' being React.ElementType<JSX.IntrinsicElements['meshReflectorMaterial']>,
        */}
      {props.children ? (
        props.children(T.MeshReflectorMaterial, memo().reflectorProps)
      ) : (
        <T.MeshReflectorMaterial {...memo().reflectorProps} />
      )}
    </T.Mesh>
  )
}
