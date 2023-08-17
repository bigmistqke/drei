import { T, ThreeProps, extend, useFrame, useThree } from '@solid-three/fiber'
import { createMemo, mergeProps, splitProps } from 'solid-js'
import {
  DepthFormat,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Matrix4,
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
import {
  MeshReflectorMaterial as MeshReflectorMaterialImpl,
  MeshReflectorMaterialProps,
} from '../materials/MeshReflectorMaterial'

type Props = ThreeProps<'MeshStandardMaterial'> & {
  resolution?: number
  mixBlur?: number
  mixStrength?: number
  blur?: [number, number] | number
  mirror: number
  minDepthThreshold?: number
  maxDepthThreshold?: number
  depthScale?: number
  depthToBlurRatioBias?: number
  distortionMap?: Texture
  distortion?: number
  mixContrast?: number
  reflectorOffset?: number
}

declare global {
  namespace SolidThree {
    interface IntrinsicElements {
      MeshReflectorMaterialImpl: MeshReflectorMaterialProps
    }
  }
}

extend({ MeshReflectorMaterialImpl })

export const MeshReflectorMaterial: RefComponent<MeshReflectorMaterialImpl, Props> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      mixBlur: 0,
      mixStrength: 1,
      resolution: 256,
      blur: [0, 0],
      minDepthThreshold: 0.9,
      maxDepthThreshold: 1,
      depthScale: 0,
      depthToBlurRatioBias: 0.25,
      mirror: 0,
      distortion: 1,
      mixContrast: 1,
      reflectorOffset: 0,
    },
    [
      'key',
      'ref',
      'mixBlur',
      'mixStrength',
      'resolution',
      'blur',
      'minDepthThreshold',
      'maxDepthThreshold',
      'depthScale',
      'depthToBlurRatioBias',
      'mirror',
      'distortion',
      'mixContrast',
      'distortionMap',
      'reflectorOffset',
    ]
  )

  const store = useThree()
  const blur = () => (Array.isArray(props.blur) ? props.blur : [props.blur, props.blur])
  const hasBlur = () => blur()[0] + blur()[1] > 0

  const materialRef = createRef<MeshReflectorMaterialImpl>(null!)
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

  const reflectorProps = mergeProps(
    splitProps(props, [
      'mirror',
      'mixBlur',
      'mixStrength',
      'minDepthThreshold',
      'maxDepthThreshold',
      'depthScale',
      'depthToBlurRatioBias',
      'distortion',
      'distortionMap',
      'mixContrast',
    ])[0],
    {
      textureMatrix,
      get tDiffuse() {
        return fbo1().texture
      },
      get tDepth() {
        return fbo1().depthTexture
      },
      get tDiffuseBlur() {
        return fbo2().texture
      },
      get hasBlur() {
        return hasBlur()
      },
      get 'defines-USE_BLUR'() {
        return hasBlur() ? '' : undefined
      },
      get 'defines-USE_DEPTH'() {
        return props.depthScale > 0 ? '' : undefined
      },
      get 'defines-USE_DISTORTION'() {
        return props.distortionMap ? '' : undefined
      },
    }
  )

  const fboParameters = {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    type: HalfFloatType,
  }

  const fbo1 = createMemo(() => {
    const fbo1 = new WebGLRenderTarget(props.resolution, props.resolution, fboParameters)
    fbo1.depthBuffer = true
    fbo1.depthTexture = new DepthTexture(props.resolution, props.resolution)
    fbo1.depthTexture.format = DepthFormat
    fbo1.depthTexture.type = UnsignedShortType
    return fbo1
  })

  const fbo2 = createMemo(() => {
    return new WebGLRenderTarget(props.resolution, props.resolution, fboParameters)
  })

  const blurpass = createMemo(
    () =>
      new BlurPass({
        gl: store.gl,
        resolution: props.resolution,
        width: blur()[0],
        height: blur()[1],
        minDepthThreshold: props.minDepthThreshold,
        maxDepthThreshold: props.maxDepthThreshold,
        depthScale: props.depthScale,
        depthToBlurRatioBias: props.depthToBlurRatioBias,
      })
  )

  const beforeRender = () => {
    // TODO: As of R3f 7-8 this should be __r3f.parent
    const parent = (materialRef.ref as any).parent?.object || (materialRef.ref as any)?.__r3f.parent?.object

    if (!parent.matrixWorld) return

    reflectorWorldPosition.setFromMatrixPosition(parent.matrixWorld)
    cameraWorldPosition.setFromMatrixPosition(store.camera.matrixWorld)
    rotationMatrix.extractRotation(parent.matrixWorld)
    normal.set(0, 0, 1)
    normal.applyMatrix4(rotationMatrix)
    reflectorWorldPosition.addScaledVector(normal, props.reflectorOffset)
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
    textureMatrix.multiply(parent.matrixWorld)
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

  useFrame(() => {
    // TODO: As of R3f 7-8 this should be __r3f.parent
    const parent = materialRef.ref.__r3f.parent
    if (!parent) return

    parent.visible = false
    const currentXrEnabled = store.gl.xr.enabled
    const currentShadowAutoUpdate = store.gl.shadowMap.autoUpdate
    beforeRender()
    store.gl.xr.enabled = false
    store.gl.shadowMap.autoUpdate = false
    store.gl.setRenderTarget(fbo1())
    store.gl.state.buffers.depth.setMask(true)
    if (!store.gl.autoClear) store.gl.clear()
    store.gl.render(store.scene, virtualCamera)
    if (hasBlur()) blurpass().render(store.gl, fbo1(), fbo2())
    store.gl.xr.enabled = currentXrEnabled
    store.gl.shadowMap.autoUpdate = currentShadowAutoUpdate
    parent.visible = true
    store.gl.setRenderTarget(null)
  })

  return (
    <T.MeshReflectorMaterialImpl
      // Defines can't be updated dynamically, so we need to recreate the material
      key={
        'key' +
        reflectorProps['defines-USE_BLUR'] +
        reflectorProps['defines-USE_DEPTH'] +
        reflectorProps['defines-USE_DISTORTION']
      }
      ref={mergeRefs(materialRef, props)}
      {...reflectorProps}
      {...rest}
    />
  )
}
