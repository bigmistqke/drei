// The author of the original code is @mrdoob https://twitter.com/mrdoob
// https://threejs.org/examples/?q=con#webgl_shadow_contact

import { T, ThreeProps, useFrame, useThree } from '@solid-three/fiber'
import { createMemo } from 'solid-js'
import * as THREE from 'three'
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'

export type ContactShadowsProps = {
  opacity?: number
  width?: number
  height?: number
  blur?: number
  near?: number
  far?: number
  smooth?: boolean
  resolution?: number
  frames?: number
  scale?: number | [x: number, y: number]
  color?: THREE.ColorRepresentation
  depthWrite?: boolean
}

export const ContactShadows: RefComponent<any, Omit<ThreeProps<'Group'>, 'scale'> & ContactShadowsProps> = (
  _props: Omit<ThreeProps<'Group'>, 'scale'> & ContactShadowsProps
) => {
  const [props, rest] = processProps(
    _props,
    {
      scale: 10,
      frames: Infinity,
      opacity: 1,
      width: 1,
      height: 1,
      blur: 1,
      near: 0,
      far: 10,
      resolution: 512,
      smooth: true,
      color: '#000000',
      depthWrite: false,
    },
    [
      'ref',
      'scale',
      'frames',
      'opacity',
      'width',
      'height',
      'blur',
      'near',
      'far',
      'resolution',
      'smooth',
      'color',
      'depthWrite',
      'renderOrder',
    ]
  )

  let ref: THREE.Group
  let shadowCamera: THREE.OrthographicCamera
  const store = useThree()

  const width = () => props.width * (Array.isArray(props.scale) ? props.scale[0] : props.scale || 1)
  const height = () => props.height * (Array.isArray(props.scale) ? props.scale[1] : props.scale || 1)

  const memo = createMemo(() => {
    const renderTarget = new THREE.WebGLRenderTarget(props.resolution, props.resolution)
    const renderTargetBlur = new THREE.WebGLRenderTarget(props.resolution, props.resolution)
    renderTargetBlur.texture.generateMipmaps = renderTarget.texture.generateMipmaps = false
    const planeGeometry = new THREE.PlaneGeometry(width(), height()).rotateX(Math.PI / 2)
    const blurPlane = new THREE.Mesh(planeGeometry)
    const depthMaterial = new THREE.MeshDepthMaterial()
    depthMaterial.depthTest = depthMaterial.depthWrite = false
    depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        ucolor: { value: new THREE.Color(props.color) },
      }
      shader.fragmentShader = shader.fragmentShader.replace(
        `void main() {`, //
        `uniform vec3 ucolor;
           void main() {
          `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        // Colorize the shadow, multiply by the falloff so that the center can remain darker
        'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );'
      )
    }

    const horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader)
    const verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader)
    verticalBlurMaterial.depthTest = horizontalBlurMaterial.depthTest = false
    return {
      renderTarget,
      planeGeometry,
      depthMaterial,
      blurPlane,
      horizontalBlurMaterial,
      verticalBlurMaterial,
      renderTargetBlur,
    }
  })

  const blurShadows = (blur) => {
    memo().blurPlane.visible = true

    memo().blurPlane.material = memo().horizontalBlurMaterial
    memo().horizontalBlurMaterial.uniforms.tDiffuse.value = memo().renderTarget.texture
    memo().horizontalBlurMaterial.uniforms.h.value = (blur * 1) / 256

    store.gl.setRenderTarget(memo().renderTargetBlur)
    store.gl.render(memo().blurPlane, shadowCamera)

    memo().blurPlane.material = memo().verticalBlurMaterial
    memo().verticalBlurMaterial.uniforms.tDiffuse.value = memo().renderTargetBlur.texture
    memo().verticalBlurMaterial.uniforms.v.value = (blur * 1) / 256

    store.gl.setRenderTarget(memo().renderTarget)
    store.gl.render(memo().blurPlane, shadowCamera)

    memo().blurPlane.visible = false
  }

  let count = 0
  let initialBackground: THREE.Color | THREE.Texture | null
  let initialOverrideMaterial: THREE.Material | null
  useFrame(() => {
    if (shadowCamera && (props.frames === Infinity || count < props.frames)) {
      // console.log('this happens?')
      count++

      initialBackground = store.scene.background
      initialOverrideMaterial = store.scene.overrideMaterial

      ref.visible = false
      store.scene.background = null
      store.scene.overrideMaterial = memo().depthMaterial

      store.gl.setRenderTarget(memo().renderTarget)
      store.gl.render(store.scene, shadowCamera)

      blurShadows(props.blur)
      if (props.smooth) blurShadows(props.blur * 0.4)
      store.gl.setRenderTarget(null)

      ref.visible = true
      store.scene.overrideMaterial = initialOverrideMaterial
      store.scene.background = initialBackground
    }
  })

  createImperativeHandle(props, () => ref)

  return (
    <T.Group rotation-x={Math.PI / 2} {...rest} ref={ref!}>
      <T.Mesh
        renderOrder={props.renderOrder}
        geometry={memo().planeGeometry}
        scale={[1, -1, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <T.MeshBasicMaterial
          transparent
          map={memo().renderTarget.texture}
          opacity={props.opacity}
          depthWrite={props.depthWrite}
        />
      </T.Mesh>
      <T.OrthographicCamera
        ref={shadowCamera!}
        args={[-width() / 2, width() / 2, height() / 2, -height() / 2, props.near, props.far]}
      />
    </T.Group>
  )
}
