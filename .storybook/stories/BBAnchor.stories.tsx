import * as THREE from 'three'

import { T } from '@solid-three/fiber'
import { onMount, splitProps, type JSX } from 'solid-js'
import { BBAnchor, Html, Icosahedron, OrbitControls, Sphere, useHelper } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Staging/BBAnchor',
  component: BBAnchor,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new THREE.Vector3(2, 2, 2)} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
  argTypes: {
    drawBoundingBox: { control: 'boolean' },
    anchorX: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    anchorY: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    anchorZ: { control: { type: 'range', min: -1, max: 1, step: 0.1 } },
    children: { table: { disable: true } },
  },
}

type Anchor = THREE.Vector3 | [number, number, number]

function BBAnchorScene(props: { anchor: Anchor; drawBoundingBox: boolean; children?: JSX.Element }) {
  let ref

  onMount(() => useHelper(() => props.drawBoundingBox && ref, THREE.BoxHelper, 'cyan'))

  return (
    <>
      <OrbitControls autoRotate />
      <Icosahedron ref={ref}>
        <T.MeshBasicMaterial color="hotpink" wireframe />
        <BBAnchor anchor={props.anchor}>{props.children}</BBAnchor>
      </Icosahedron>
    </>
  )
}

const Template = (_props) => {
  const [props, rest] = splitProps(_props, ['drawBoundingBox', 'anchorX', 'anchorY', 'anchorZ'])
  return (
    <BBAnchorScene
      drawBoundingBox={props.drawBoundingBox}
      anchor={[props.anchorX, props.anchorY, props.anchorZ]}
      {...rest}
    />
  )
}

function HtmlComp() {
  return (
    <Html
      style={{
        color: 'black',
        'white-space': 'nowrap',
      }}
      center
    >
      Html element
    </Html>
  )
}

export const BBAnchorWithHtml = Template.bind({})
BBAnchorWithHtml.args = {
  drawBoundingBox: true,
  anchorX: 1,
  anchorY: 1,
  anchorZ: 1,
  children: () => <HtmlComp />,
}
BBAnchorWithHtml.storyName = 'With Html component'

function MeshComp() {
  return (
    <Sphere args={[0.25]}>
      <T.MeshBasicMaterial color="lime" />
    </Sphere>
  )
}

export const BBAnchorWithMesh = Template.bind({})
BBAnchorWithMesh.args = {
  drawBoundingBox: true,
  anchorX: 1,
  anchorY: 1,
  anchorZ: 1,
  children: () => <MeshComp />,
}
BBAnchorWithMesh.storyName = 'With other mesh'
