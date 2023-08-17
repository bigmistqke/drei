import { createSignal, type JSX } from 'solid-js'
import * as THREE from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { T, useFrame, useThree } from '@solid-three/fiber'
import { Object3D } from 'three'
import { Html, Icosahedron, OrthographicCamera } from '../../src'
import { processProps } from '../../src/helpers/processProps'
import { CalculatePosition, HtmlProps } from '../../src/web/Html'

export default {
  title: 'Misc/Html',
  component: Html,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(-20, 20, -20)}> {storyFn()}</Setup>],
}

function HTMLScene(_props: Omit<HtmlProps, 'children'> & { color?: string; children?: JSX.Element }) {
  const [props, htmlProps] = processProps(
    _props,
    {
      children: null!,
      color: 'hotpink',
    },
    ['children', 'color']
  )

  const turntable = useTurntable()
  return (
    <T.Group ref={turntable}>
      <Icosahedron args={[2, 2]} position={[3, 6, 4]}>
        <T.MeshBasicMaterial color={props.color} wireframe />
        <Html {...htmlProps}>First</Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[10, 0, 10]}>
        <T.MeshBasicMaterial color={props.color} wireframe />
        <Html {...htmlProps}>Second</Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[-20, 0, -20]}>
        <T.MeshBasicMaterial color={props.color} wireframe />
        <Html {...htmlProps}>Third</Html>
      </Icosahedron>
      {props.children}
    </T.Group>
  )
}

export const HTMLSt = () => <HTMLScene distanceFactor={30} class="html-story-block" />
HTMLSt.storyName = 'Default'

function HTMLTransformScene() {
  return (
    <HTMLScene color="palegreen" transform class="html-story-block margin300" distanceFactor={30}>
      <Html
        sprite
        transform
        distanceFactor={20}
        position={[5, 15, 0]}
        style={{
          background: 'palegreen',
          'font-size': '50px',
          padding: '10px 18px',
          border: '2px solid black',
        }}
      >
        Transform mode
      </Html>
    </HTMLScene>
  )
}

export const HTMLTransformSt = () => <HTMLTransformScene />
HTMLTransformSt.storyName = 'Transform mode'

function HTMLOrthographicScene() {
  const store = useThree()
  const [zoomIn, setZoomIn] = createSignal(true)

  const initialCamera = {
    position: new THREE.Vector3(0, 0, -10),
  }

  useFrame(() => {
    zoomIn() ? (store.camera.zoom += 0.01) : (store.camera.zoom -= 0.01)
    store.camera.updateProjectionMatrix()

    if (store.camera.zoom > 3) {
      setZoomIn(false)
    } else if (store.camera.zoom < 1) {
      setZoomIn(true)
    }
  })

  return (
    <>
      <OrthographicCamera makeDefault={true} applyMatrix4={undefined} {...initialCamera} />
      <Icosahedron args={[200, 5]} position={[0, 0, 0]}>
        <T.MeshBasicMaterial color="hotpink" wireframe />
        {
          // for smoother text use css will-change: transform
          <Html class="html-story-label" distanceFactor={1}>
            Orthographic
          </Html>
        }
      </Icosahedron>
      <T.AmbientLight intensity={0.8} />
      <T.PointLight intensity={1} position={[0, 6, 0]} />
    </>
  )
}

export const HTMLOrthoSt = () => <HTMLOrthographicScene />
HTMLOrthoSt.storyName = 'Orthographic'

const v1 = new THREE.Vector3()
const overrideCalculatePosition: CalculatePosition = (el, camera, size) => {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  objectPos.project(camera)
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  return [
    Math.min(size.width - 100, Math.max(0, objectPos.x * widthHalf + widthHalf)),
    Math.min(size.height - 20, Math.max(0, -(objectPos.y * heightHalf) + heightHalf)),
  ]
}

export const HTMLCalculatePosition = () => (
  <HTMLScene class="html-story-label" calculatePosition={overrideCalculatePosition} />
)
HTMLCalculatePosition.storyName = 'Custom Calculate Position'

function HTMLOccluderScene() {
  const turntable = useTurntable()
  let occluderRef: Object3D

  // s3f:  I don't think occlusion='blending' is working properly
  return (
    <>
      <T.Group ref={turntable}>
        <Icosahedron name="pink" args={[5, 5]} position={[0, 0, 0]}>
          <T.MeshBasicMaterial color="hotpink" />
          <Html position={[0, 0, -6]} class="html-story-label" occlude="blending">
            Blending
          </Html>
        </Icosahedron>
        <Icosahedron name="yellow" args={[5, 5]} position={[16, 0, 0]}>
          <T.MeshBasicMaterial color="yellow" />
          <Html transform position={[0, 0, -6]} class="html-story-label html-story-label-B" occlude="blending">
            Blending w/ transform
          </Html>
        </Icosahedron>
        <Icosahedron ref={occluderRef!} name="orange" args={[5, 5]} position={[0, 0, 16]}>
          <T.MeshBasicMaterial color="orange" />
          <Html position={[0, 0, -6]} class="html-story-label" occlude={[occluderRef]}>
            Raycast occlusion
          </Html>
        </Icosahedron>
      </T.Group>
      <T.AmbientLight intensity={0.8} />
      <T.PointLight intensity={1} position={[0, 6, 0]} />
    </>
  )
}

export const HTMLOccluderSt = () => <HTMLOccluderScene />
HTMLOccluderSt.storyName = 'Occlusion'
