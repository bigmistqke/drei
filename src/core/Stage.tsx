import { T, ThreeProps } from '@solid-three/fiber'
import { Show, createEffect, createSignal, on } from 'solid-js'
import { PresetsType } from '../helpers/environment-assets'
import { processProps } from '../helpers/processProps'
import { AccumulativeShadowsProps, RandomizedLightProps } from './AccumulativeShadows'
import { Bounds, useBounds } from './Bounds'
import { Center, CenterProps } from './Center'
import { ContactShadowsProps } from './ContactShadows'
import { Environment, EnvironmentProps } from './Environment'

const presets = {
  rembrandt: {
    main: [1, 2, 1],
    fill: [-2, -0.5, -2],
  },
  portrait: {
    main: [-1, 2, 0.5],
    fill: [-1, 0.5, -1.5],
  },
  upfront: {
    main: [0, 2, 1],
    fill: [-1, 0.5, -1.5],
  },
  soft: {
    main: [-2, 4, 4],
    fill: [-1, 0.5, -1.5],
  },
}

type StageShadows = Partial<AccumulativeShadowsProps> &
  Partial<RandomizedLightProps> &
  Partial<ContactShadowsProps> & {
    type: 'contact' | 'accumulative'
    /** Shadow plane offset, default: 0 */
    offset?: number
    /** Shadow bias, default: -0.0001 */
    bias?: number
    /** Shadow normal bias, default: 0 */
    normalBias?: number
    /** Shadow map size, default: 1024 */
    size?: number
  }

type StageProps = {
  /** Lighting setup, default: "rembrandt" */
  preset?:
    | 'rembrandt'
    | 'portrait'
    | 'upfront'
    | 'soft'
    | { main: [x: number, y: number, z: number]; fill: [x: number, y: number, z: number] }
  /** Controls the ground shadows, default: "contact" */
  shadows?: boolean | 'contact' | 'accumulative' | StageShadows
  /** Optionally wraps and thereby centers the models using <Bounds>, can also be a margin, default: true */
  adjustCamera?: boolean | number
  /** The default environment, default: "city" */
  environment?: PresetsType | Partial<EnvironmentProps>
  /** The lighting intensity, default: 0.5 */
  intensity?: number
  /** To adjust centering, default: undefined */
  center?: Partial<CenterProps>
}

function Refit(props: { radius: number; adjustCamera: number | boolean }) {
  const api = useBounds()
  createEffect(
    on(
      () => [props.radius, props.adjustCamera],
      () => {
        if (props.adjustCamera) api?.refresh().clip().fit()
      }
    )
  )
  return null
}

export function Stage(_props: ThreeProps<'Group'> & StageProps) {
  const [props, rest] = processProps(
    _props,
    {
      adjustCamera: true,
      intensity: 0.5,
      shadows: 'contact',
      environment: 'city',
      preset: 'rembrandt',
    },
    ['children', 'center', 'adjustCamera', 'intensity', 'shadows', 'environment', 'preset']
  )

  const config = typeof props.preset === 'string' ? presets[props.preset] : props.preset
  const [dimensions, setDimensions] = createSignal({ radius: 0, width: 0, height: 0, depth: 0 })

  const shadowBias = (props.shadows as StageShadows)?.bias ?? -0.0001
  const normalBias = (props.shadows as StageShadows)?.normalBias ?? 0
  const shadowSize = (props.shadows as StageShadows)?.size ?? 1024
  const shadowOffset = (props.shadows as StageShadows)?.offset ?? 0
  const contactShadow = props.shadows === 'contact' || (props.shadows as StageShadows)?.type === 'contact'
  const accumulativeShadow =
    props.shadows === 'accumulative' || (props.shadows as StageShadows)?.type === 'accumulative'
  const shadowSpread = { ...(typeof props.shadows === 'object' ? props.shadows : {}) }
  const environmentProps = () =>
    !props.environment
      ? null
      : typeof props.environment === 'string'
      ? { preset: props.environment }
      : props.environment
  const onCentered = (props) => {
    const { width, height, depth, boundingSphere } = props
    setDimensions({ radius: boundingSphere.radius, width, height, depth })
    if (props.center?.onCentered) props.center.onCentered(props)
  }
  return (
    <>
      <T.AmbientLight intensity={props.intensity / 3} />
      <T.SpotLight
        penumbra={1}
        position={[
          config.main[0] * dimensions().radius,
          config.main[1] * dimensions().radius,
          config.main[2] * dimensions().radius,
        ]}
        intensity={props.intensity * 2}
        castShadow={!!props.shadows}
        shadow-bias={shadowBias}
        shadow-normalBias={normalBias}
        shadow-mapSize={shadowSize}
      />
      <T.PointLight
        position={[
          config.fill[0] * dimensions().radius,
          config.fill[1] * dimensions().radius,
          config.fill[2] * dimensions().radius,
        ]}
        intensity={props.intensity}
      />
      <Bounds
        fit={!!props.adjustCamera}
        clip={!!props.adjustCamera}
        margin={Number(props.adjustCamera)}
        observe
        {...rest}
      >
        <Refit radius={dimensions().radius} adjustCamera={props.adjustCamera} />
        <Center {...props.center} position={[0, shadowOffset / 2, 0]} onCentered={onCentered}>
          {props.children}
        </Center>
      </Bounds>
      <T.Group position={[0, -dimensions().height / 2 - shadowOffset / 2, 0]}>
        {/* {contactShadow && (
          <ContactShadows
            scale={dimensions().radius * 4}
            far={dimensions().radius}
            blur={2}
            {...(shadowSpread as ContactShadowsProps)}
          />
        )} */}
        {/* {accumulativeShadow && (
          <AccumulativeShadows
            temporal
            frames={100}
            alphaTest={0.9}
            toneMapped={true}
            scale={dimensions().radius * 4}
            {...(shadowSpread as AccumulativeShadowsProps)}
          >
            <RandomizedLight
              amount={(shadowSpread as RandomizedLightProps).amount ?? 8}
              radius={(shadowSpread as RandomizedLightProps).radius ?? dimensions().radius}
              ambient={(shadowSpread as RandomizedLightProps).ambient ?? 0.5}
              intensity={(shadowSpread as RandomizedLightProps).intensity ?? 1}
              position={[
                config.main[0] * dimensions().radius,
                config.main[1] * dimensions().radius,
                config.main[2] * dimensions().radius,
              ]}
              size={dimensions().radius * 4}
              bias={-shadowBias}
              mapSize={shadowSize}
            />
          </AccumulativeShadows>
        )} */}
      </T.Group>
      <Show when={props.environment}>
        <Environment {...environmentProps()} />
      </Show>
    </>
  )
}
