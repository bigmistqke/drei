import { T, ThreeProps, useFrame, useThree } from '@solid-three/fiber'
import {
  Accessor,
  Show,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  onCleanup,
  type JSX,
} from 'solid-js'
import { render } from 'solid-js/web'

import {
  Camera,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Raycaster,
  Vector3,
} from 'three'
import { Assign } from 'utility-types'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { when } from '../helpers/when'

const v1 = new Vector3()
const v2 = new Vector3()
const v3 = new Vector3()

function defaultCalculatePosition(el: Object3D, camera: Camera, size: { width: number; height: number }) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  objectPos.project(camera)
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf]
}

export type CalculatePosition = typeof defaultCalculatePosition

function isObjectBehindCamera(el: Object3D, camera: Camera) {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
  const deltaCamObj = objectPos.sub(cameraPos)
  const camDir = camera.getWorldDirection(v3)
  return deltaCamObj.angleTo(camDir) > Math.PI / 2
}

function isObjectVisible(el: Object3D, camera: Camera, raycaster: Raycaster, occlude: Object3D[]) {
  const elPos = v1.setFromMatrixPosition(el.matrixWorld)
  const screenPos = elPos.clone()
  screenPos.project(camera)
  raycaster.setFromCamera(screenPos, camera)
  const intersects = raycaster.intersectObjects(occlude, true)
  if (intersects.length) {
    const intersectionDistance = intersects[0].distance
    const pointDistance = elPos.distanceTo(raycaster.ray.origin)
    return pointDistance < intersectionDistance
  }
  return true
}

function objectScale(el: Object3D, camera: Camera) {
  if (camera instanceof OrthographicCamera) {
    return camera.zoom
  } else if (camera instanceof PerspectiveCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
    const vFOV = (camera.fov * Math.PI) / 180
    const dist = objectPos.distanceTo(cameraPos)
    const scaleFOV = 2 * Math.tan(vFOV / 2) * dist
    return 1 / scaleFOV
  } else {
    return 1
  }
}

function objectZIndex(el: Object3D, camera: Camera, zIndexRange: Array<number>) {
  if (camera instanceof PerspectiveCamera || camera instanceof OrthographicCamera) {
    const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
    const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld)
    const dist = objectPos.distanceTo(cameraPos)
    const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near)
    const B = zIndexRange[1] - A * camera.far
    return Math.round(A * dist + B)
  }
  return undefined
}

const epsilon = (value: number) => (Math.abs(value) < 1e-10 ? 0 : value)

function getCSSMatrix(matrix: Matrix4, multipliers: number[], prepend = '') {
  let matrix3d = 'matrix3d('
  for (let i = 0; i !== 16; i++) {
    matrix3d += epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? ',' : ')')
  }
  return prepend + matrix3d
}

const getCameraCSSMatrix = ((multipliers: number[]) => {
  return (matrix: Matrix4) => getCSSMatrix(matrix, multipliers)
})([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1])

const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
  return (matrix: Matrix4, factor: number) => getCSSMatrix(matrix, scaleMultipliers(factor), 'translate(-50%,-50%)')
})((f: number) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1])

type PointerEventsProperties =
  | 'auto'
  | 'none'
  | 'visiblePainted'
  | 'visibleFill'
  | 'visibleStroke'
  | 'visible'
  | 'painted'
  | 'fill'
  | 'stroke'
  | 'all'
  | 'inherit'

function isRefObject(ref: any): ref is React.RefObject<any> {
  return ref && typeof ref === 'object' && 'current' in ref
}

export interface HtmlProps extends Omit<Assign<JSX.HTMLAttributes<HTMLDivElement>, ThreeProps<'Group'>>, 'ref'> {
  prepend?: boolean
  center?: boolean
  fullscreen?: boolean
  eps?: number
  portal?: HTMLElement
  distanceFactor?: number
  sprite?: boolean
  transform?: boolean
  zIndexRange?: Array<number>
  calculatePosition?: CalculatePosition
  as?: string
  wrapperClass?: string
  pointerEvents?: PointerEventsProperties

  // Occlusion based off work by Jerome Etienne and James Baicoianu
  // https://www.youtube.com/watch?v=ScZcUEDGjJI
  // as well as Joe Pea in CodePen: https://codepen.io/trusktr/pen/RjzKJx
  occlude?: Object3D[] | boolean | 'raycast' | 'blending'
  onOcclude?: (visible: boolean) => null
  material?: JSX.Element // Material for occlusion plane
  geometry?: JSX.Element // Material for occlusion plane
  castShadow?: boolean // Cast shadow for occlusion plane
  receiveShadow?: boolean // Receive shadow for occlusion plane
}
export const Html: RefComponent<HTMLDivElement, HtmlProps> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      eps: 0.001,
      sprite: false,
      transform: false,
      zIndexRange: [16777271, 0],
      calculatePosition: defaultCalculatePosition,
      as: 'div',
      pointerEvents: 'auto',
    },
    [
      'ref',
      'children',
      'eps',
      'style',
      'class',
      'prepend',
      'center',
      'fullscreen',
      'portal',
      'distanceFactor',
      'sprite',
      'transform',
      'occlude',
      'onOcclude',
      'castShadow',
      'receiveShadow',
      'material',
      'geometry',
      'zIndexRange',
      'calculatePosition',
      'as',
      'wrapperClass',
      'pointerEvents',
    ]
  )

  const store = useThree()

  const element = createMemo(() => document.createElement(props.as))
  const [group, setGroup] = createSignal<Group>()
  let oldZoom = 0
  let oldPosition = [0, 0]
  let transformOuterRef: HTMLDivElement = null!
  let transformInnerRef: HTMLDivElement = null!
  // Append to the connected element, which makes HTML work with views
  const target = () => (props.portal || store.events.connected || store.gl.domElement.parentNode) as HTMLElement

  let occlusionMeshRef: Mesh = null!
  let isMeshSizeSet: boolean = false

  const isRayCastOcclusion = createMemo(() => {
    return (
      (props.occlude && props.occlude !== 'blending') ||
      (Array.isArray(props.occlude) && props.occlude.length && isRefObject(props.occlude[0]))
    )
  })

  createRenderEffect(() => {
    const el = store.gl.domElement as HTMLCanvasElement

    if (props.occlude && props.occlude === 'blending') {
      el.style.zIndex = `${Math.floor(props.zIndexRange[0] / 2)}`
      el.style.position = 'absolute'
      el.style.pointerEvents = 'none'
    } else {
      el.style.zIndex = null!
      el.style.position = null!
      el.style.pointerEvents = null!
    }
  })

  // s3f:   should we have group be a signal and return it back to a renderEffect?
  createEffect(() => {
    when(group)((group) => {
      store.scene.updateMatrixWorld()
      if (props.transform) {
        element().style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`
      } else {
        const vec = props.calculatePosition(group, store.camera, store.size)
        element().style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);transform-origin:0 0;`
      }
      if (target()) {
        if (props.prepend) target().prepend(element())
        else target().appendChild(element())
      }
      onCleanup(() => when(target)((target) => target.removeChild(element())))
    })
  })

  createRenderEffect(() => {
    if (props.wrapperClass) element().className = props.wrapperClass
  })

  const styles = createMemo(() => {
    if (props.transform) {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        width: store.size.width + 'px',
        height: store.size.height + 'px',
        'transform-style': 'preserve-3d',
        'pointer-events': 'none',
      } satisfies JSX.CSSProperties
    } else {
      return {
        position: 'absolute',
        transform: props.center ? 'translate3d(-50%,-50%,0)' : 'none',
        ...(props.fullscreen && {
          top: -store.size.height / 2 + 'px',
          left: -store.size.width / 2 + 'px',
          width: store.size.width + 'px',
          height: store.size.height + 'px',
        }),
        ...(typeof props.style === 'object' ? props.style : {}),
      } satisfies JSX.CSSProperties
    }
  })

  const transformInnerStyles: Accessor<JSX.CSSProperties> = createMemo(
    () => ({ position: 'absolute', pointerEvents: props.pointerEvents } as const)
  )

  createRenderEffect(() => {
    isMeshSizeSet = false

    if (props.transform) {
      render(
        () => (
          <div ref={transformOuterRef} style={styles()}>
            <div ref={transformInnerRef} style={transformInnerStyles()}>
              <div ref={props.ref} class={props.class} style={props.style} children={props.children} />
            </div>
          </div>
        ),
        element()
      )
    } else {
      render(() => <div ref={props.ref} style={styles()} class={props.class} children={props.children} />, element())
    }
  })

  let visible = true

  useFrame((gl) => {
    when(group)((group) => {
      store.camera.updateMatrixWorld()
      group.updateWorldMatrix(true, false)
      const vec = props.transform ? oldPosition : props.calculatePosition(group, store.camera, store.size)

      if (
        props.transform ||
        Math.abs(oldZoom - store.camera.zoom) > props.eps ||
        Math.abs(oldPosition[0] - vec[0]) > props.eps ||
        Math.abs(oldPosition[1] - vec[1]) > props.eps
      ) {
        const isBehindCamera = isObjectBehindCamera(group, store.camera)
        let raytraceTarget: null | undefined | boolean | Object3D[] = false

        if (isRayCastOcclusion()) {
          if (props.occlude !== 'blending') {
            raytraceTarget = [store.scene]
          } else if (Array.isArray(props.occlude)) {
            raytraceTarget = props.occlude.map((item) => item) as Object3D[]
          }
        }

        const previouslyVisible = visible
        if (raytraceTarget) {
          const isvisible = isObjectVisible(group, store.camera, store.raycaster, raytraceTarget)
          visible = isvisible && !isBehindCamera
        } else {
          visible = !isBehindCamera
        }

        if (previouslyVisible !== visible) {
          if (props.onOcclude) props.onOcclude(!visible)
          else element().style.display = visible ? 'block' : 'none'
        }

        const halfRange = Math.floor(props.zIndexRange[0] / 2)
        const zRange = props.occlude
          ? isRayCastOcclusion() //
            ? [props.zIndexRange[0], halfRange]
            : [halfRange - 1, 0]
          : props.zIndexRange

        element().style.zIndex = `${objectZIndex(group, store.camera, zRange)}`

        if (props.transform) {
          const [widthHalf, heightHalf] = [store.size.width / 2, store.size.height / 2]
          const fov = store.camera.projectionMatrix.elements[5] * heightHalf
          const { isOrthographicCamera, top, left, bottom, right } = store.camera as OrthographicCamera
          const cameraMatrix = getCameraCSSMatrix(store.camera.matrixWorldInverse)
          const cameraTransform = isOrthographicCamera
            ? `scale(${fov})translate(${epsilon(-(right + left) / 2)}px,${epsilon((top + bottom) / 2)}px)`
            : `translateZ(${fov}px)`
          let matrix = group.matrixWorld
          if (props.sprite) {
            matrix = store.camera.matrixWorldInverse.clone().transpose().copyPosition(matrix).scale(group.scale)
            matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0
            matrix.elements[15] = 1
          }
          element().style.width = store.size.width + 'px'
          element().style.height = store.size.height + 'px'
          element().style.perspective = isOrthographicCamera ? '' : `${fov}px`
          if (transformOuterRef && transformInnerRef) {
            transformOuterRef.style.transform = `${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`
            transformInnerRef.style.transform = getObjectCSSMatrix(matrix, 1 / ((props.distanceFactor || 10) / 400))
          }
        } else {
          const scale = props.distanceFactor === undefined ? 1 : objectScale(group, store.camera) * props.distanceFactor
          element().style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`
        }
        oldPosition = vec
        oldZoom = store.camera.zoom
      }
    })

    if (!isRayCastOcclusion() && occlusionMeshRef && !isMeshSizeSet) {
      if (props.transform) {
        if (transformOuterRef) {
          const el = transformOuterRef.children[0]

          if (el?.clientWidth && el?.clientHeight) {
            const { isOrthographicCamera } = store.camera as OrthographicCamera

            if (isOrthographicCamera || props.geometry) {
              if (rest.scale) {
                if (!Array.isArray(rest.scale)) {
                  occlusionMeshRef.scale.setScalar(1 / (rest.scale as number))
                } else if (rest.scale instanceof Vector3) {
                  occlusionMeshRef.scale.copy(rest.scale.clone().divideScalar(1))
                } else {
                  occlusionMeshRef.scale.set(1 / rest.scale[0], 1 / rest.scale[1], 1 / rest.scale[2])
                }
              }
            } else {
              const ratio = (props.distanceFactor || 10) / 400
              const w = el.clientWidth * ratio
              const h = el.clientHeight * ratio

              occlusionMeshRef.scale.set(w, h, 1)
            }

            isMeshSizeSet = true
          }
        }
      } else {
        const ele = element().children[0]

        if (ele?.clientWidth && ele?.clientHeight) {
          const ratio = 1 / store.viewport.factor
          const w = ele.clientWidth * ratio
          const h = ele.clientHeight * ratio

          occlusionMeshRef.scale.set(w, h, 1)

          isMeshSizeSet = true
        }

        occlusionMeshRef.lookAt(gl.camera.position)
      }
    }
  })

  const shaders = createMemo(() => ({
    vertexShader: !props.transform
      ? /* glsl */ `
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom" 
            is false. 
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;
            
            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `
      : undefined,
    fragmentShader: /* glsl */ `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
  }))
  return (
    <T.Group {...rest} ref={setGroup}>
      <Show when={props.occlude && !isRayCastOcclusion()}>
        <T.Mesh castShadow={props.castShadow} receiveShadow={props.receiveShadow} ref={occlusionMeshRef}>
          {props.geometry || <T.PlaneGeometry />}
          {props.material || (
            <T.ShaderMaterial
              side={DoubleSide}
              vertexShader={shaders().vertexShader}
              fragmentShader={shaders().fragmentShader}
            />
          )}
        </T.Mesh>
      </Show>
    </T.Group>
  )
}
