import { T } from '@solid-three/fiber'
import { Show, createEffect, createSignal } from 'solid-js'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { GizmoHelper, GizmoViewcube, GizmoViewport, OrbitControls, TrackballControls, useGLTF } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Gizmos/GizmoHelper',
  component: GizmoHelper,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <T.Suspense>{storyFn()}</T.Suspense>
      </Setup>
    ),
  ],
}

const alignment = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
  'bottom-center',
  'center-right',
  'center-left',
  'center-center',
  'top-center',
]
const controls = ['OrbitControls', 'TrackballControls']
const faces = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back']
const gizmos = ['GizmoViewcube', 'GizmoViewport']

const args = {
  alignment: alignment[2],
  color: 'white',
  colorX: 'red',
  colorY: 'green',
  colorZ: 'blue',
  controls: controls[0],
  faces,
  gizmo: gizmos[0],
  hideNegativeAxes: false,
  hoverColor: '#999',
  labelColor: 'black',
  marginX: 80,
  marginY: 80,
  opacity: 1,
  strokeColor: 'gray',
  textColor: 'black',
}

const colorArgType = { control: { type: 'color' } }
const generalTable = { table: { categry: 'General' } }
const helperTable = { table: { category: 'GizmoHelper' } }
const viewcubeTable = { table: { category: 'GizmoViewcube' } }
const viewportTable = { table: { category: 'GizmoViewport' } }

const argTypes = {
  alignment: { control: { type: 'select' }, options: alignment, ...helperTable },
  color: { ...colorArgType, ...viewcubeTable },
  colorX: { ...colorArgType, ...viewportTable },
  colorY: { ...colorArgType, ...viewportTable },
  colorZ: { ...colorArgType, ...viewportTable },
  controls: {
    control: { type: 'select' },
    name: 'Controls',
    options: controls,
    ...generalTable,
  },
  faces: {
    control: { type: 'array' },
    options: faces,
    ...viewcubeTable,
  },
  gizmo: {
    control: { type: 'select' },
    name: 'Gizmo',
    options: gizmos,
    ...generalTable,
  },
  hideNegativeAxes: { ...viewportTable },
  hoverColor: { ...viewportTable },
  labelColor: { ...viewportTable },
  marginX: { ...helperTable },
  marginY: { ...helperTable },
  opacity: {
    control: { min: 0, max: 1, step: 0.01, type: 'range' },
    ...viewcubeTable,
  },
  strokeColor: { ...colorArgType, ...viewcubeTable },
  textColor: { ...colorArgType, ...viewcubeTable },
}

const GizmoHelperStoryImpl = (props: {
  alignment
  color
  colorX
  colorY
  colorZ
  controls
  faces
  gizmo
  hideNegativeAxes
  hoverColor
  labelColor
  marginX
  marginY
  opacity
  strokeColor
  textColor
}) => {
  const resource = useGLTF('LittlestTokyo.glb')
  const [visible, setVisible] = createSignal(false)
  createEffect(() => resource() && setTimeout(() => setVisible(true), 100))
  return (
    <>
      <T.Primitive object={resource()?.scene!} scale={0.01} />
      <GizmoHelper alignment={props.alignment}>
        <Show
          when={props.gizmo === 'GizmoViewcube'}
          fallback={
            <GizmoViewport
              axisColors={[props.colorX, props.colorY, props.colorZ]}
              hideNegativeAxes={props.hideNegativeAxes}
              labelColor={props.labelColor}
            />
          }
        >
          <GizmoViewcube
            color={props.color}
            faces={props.faces}
            hoverColor={props.hoverColor}
            opacity={props.opacity}
            strokeColor={props.strokeColor}
            textColor={props.textColor}
          />
        </Show>
      </GizmoHelper>

      <Show when={props.controls === 'TrackballControls'} fallback={<OrbitControls makeDefault />}>
        <TrackballControls makeDefault />
      </Show>
    </>
  )
}

export const GizmoHelperStory = (props) => <GizmoHelperStoryImpl {...props} />

GizmoHelperStory.args = args
GizmoHelperStory.argTypes = argTypes
GizmoHelperStory.storyName = 'Default'
const group = new THREE.Group()
