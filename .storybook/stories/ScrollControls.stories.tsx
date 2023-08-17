import { T, useFrame, useThree } from '@solid-three/fiber'
import { createSignal } from 'solid-js'
import * as THREE from 'three'

import { Scroll, ScrollControls, useCursor, useGLTF, useIntersect } from '../../src'
import { when } from '../../src/helpers/when'
import { Setup } from '../Setup'

export default {
  title: 'Controls/ScrollControls',
  component: ScrollControls,
  decorators: [],
}

const ScrollControlsSetup = (props) => (
  <Setup
    controls={false}
    orthographic
    camera={{ zoom: 80 }}
    gl={{ alpha: false, antialias: false, stencil: false, depth: false }}
    dpr={[1, 1.5]}
  >
    {props.children}
  </Setup>
)

function Suzanne(props) {
  const resource = useGLTF('suzanne.glb', true)

  const [hovered, setHovered] = createSignal(false)
  useCursor(hovered)

  let visible = false
  const [meshRef, setMeshRef] = useIntersect((isVisible) => (visible = isVisible))

  const store = useThree()
  useFrame((_state, delta) => {
    when(meshRef)((meshRef) => {
      meshRef.rotation.x = THREE.MathUtils.damp(meshRef.rotation.x, visible ? 0 : -store.size.height / 2 + 1, 4, delta)
    })
  })

  return (
    <T.Group {...props}>
      <T.Mesh
        ref={setMeshRef}
        geometry={(resource()?.nodes.Suzanne as THREE.Mesh)?.geometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <T.MeshStandardMaterial color={hovered() ? 'green' : 'blue'} />
      </T.Mesh>
    </T.Group>
  )
}

const ScrollControlsExample = () => {
  const store = useThree()
  return (
    <ScrollControls
      pages={3} // Each page takes 100% of the height of the canvas
      distance={1} // A factor that increases scroll bar travel (default: 1)
      damping={4} // Friction, higher is faster (default: 4)
      horizontal={false} // Can also scroll horizontally (default: false)
      infinite={false} // Can also scroll infinitely (default: false)
    >
      {/* You can have components in here, they are not scrolled, but they can still
          react to scroll by using useScroll! */}
      <Scroll>
        <Suzanne position={[0, 0, 0]} scale={[2, 2, 2]} />
        <Suzanne position={[-store.viewport.width / 8, -store.viewport.height * 1, 0]} scale={[3, 3, 3]} />
        <Suzanne position={[store.viewport.width / 4, -store.viewport.height * 2, 0]} scale={[1.5, 1.5, 1.5]} />
      </Scroll>
      <Scroll html style={{ width: '100%', color: '#EC2D2D' }}>
        {/*
        If the canvas is 100% of viewport then:
          top: `${store.size.height * 1.0}px`
        is equal to:
          top: `100vh`
        */}
        <h1
          style={{
            position: 'absolute',
            top: `${store.size.height * 0.1}px`,
            right: `${store.size.width * 0.2}px`,
          }}
        >
          Scroll down!
        </h1>
        <h1
          style={{
            position: 'absolute',
            top: `${store.size.height * 1.0}px`,
            right: `${store.size.width * 0.2}px`,
            'font-size': '25em',
            transform: `translate3d(0,-100%,0)`,
          }}
        >
          all
        </h1>
        <h1
          style={{
            position: 'absolute',
            top: `${store.size.height * 1.8}px`,
            left: `${store.size.width * 0.1}px`,
          }}
        >
          hail
        </h1>
        <h1
          style={{
            position: 'absolute',
            top: `${store.size.height * 2.6}px`,
            right: `${store.size.width * 0.1}px`,
          }}
        >
          thee,
        </h1>
        <h1
          style={{
            position: 'absolute',
            top: `${store.size.height * 3.5}px`,
            left: `${store.size.width * 0.1}px`,
          }}
        >
          thoth
        </h1>
        <h1
          style={{
            position: 'absolute',
            top: `${store.size.height * 4.5}px`,
            right: `${store.size.width * 0.1}px`,
          }}
        >
          her
          <br />
          mes.
        </h1>
      </Scroll>
    </ScrollControls>
  )
}

const Container = (props) => (
  <div
    style={{
      margin: '50px',
      padding: '50px',
      height: 'calc(100vh - 200px)',
      position: 'relative',
    }}
  >
    {props.children}
  </div>
)

export const DefaultStory = () => (
  <T.Suspense fallback={null}>
    <ScrollControlsExample />
  </T.Suspense>
)
DefaultStory.decorators = [(storyFn) => <ScrollControlsSetup>{storyFn()}</ScrollControlsSetup>]
DefaultStory.storyName = 'Default'

export const InsideContainerStory = () => (
  <Container>
    <ScrollControlsSetup>
      <DefaultStory />
    </ScrollControlsSetup>
  </Container>
)
InsideContainerStory.storyName = 'Inside a container'
