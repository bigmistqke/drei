import { Primitive, T, ThreeProps, useFrame } from '@solid-three/fiber'
import { createContext, createMemo, useContext } from 'solid-js'
import * as THREE from 'three'
import { Color, Group } from 'three'
import { MarchingCubes as MarchingCubesImpl } from 'three-stdlib'
import { createRef } from '../helpers/createRef'
import { mergeRefs } from '../helpers/mergeRefs'
import { processProps } from '../helpers/processProps'
import { RefComponent } from '../helpers/typeHelpers'
import { when } from '../helpers/when'

type Api = {
  getParent: () => MarchingCubesImpl
}

const globalContext = createContext<Api>(null!)

export type MarchingCubesProps = {
  resolution?: number
  maxPolyCount?: number
  enableUvs?: boolean
  enableColors?: boolean
} & ThreeProps<'Group'>

export const MarchingCubes: RefComponent<any, MarchingCubesProps, true> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      resolution: 28,
      maxPolyCount: 10000,
      enableUvs: false,
      enableColors: false,
    },
    ['resolution', 'maxPolyCount', 'enableUvs', 'enableColors', 'children']
  )

  let marchingCubesRef: MarchingCubesImpl = null!
  const marchingCubes = createMemo(
    () =>
      new MarchingCubesImpl(
        props.resolution,
        null as unknown as THREE.Material,
        props.enableUvs,
        props.enableColors,
        props.maxPolyCount
      )
  )

  useFrame(() => {
    marchingCubes().update()
    marchingCubes().reset()
  }, -1) // To make sure the reset runs before the balls or planes are added

  return (
    <>
      <Primitive object={marchingCubes()} {...rest} ref={marchingCubesRef}>
        <globalContext.Provider value={{ getParent: () => marchingCubesRef }}>{props.children}</globalContext.Provider>
      </Primitive>
    </>
  )
}

type MarchingCubeProps = {
  strength?: number
  subtract?: number
  color?: Color
} & ThreeProps<'Group'>

export const MarchingCube = (_props: MarchingCubeProps) => {
  const [props, rest] = processProps(
    _props,
    {
      strength: 0.5,
      subtract: 12,
    },
    ['ref', 'strength', 'subtract', 'color']
  )

  const context = useContext(globalContext)
  const cubeRef = createRef<Group>(null!)
  const vec = new THREE.Vector3()
  useFrame(() => {
    when(context?.getParent)((parent) => {
      if (!cubeRef.ref) return
      cubeRef.ref.getWorldPosition(vec)
      parent.addBall(
        0.5 + vec.x * 0.5,
        0.5 + vec.y * 0.5,
        0.5 + vec.z * 0.5,
        props.strength,
        props.subtract,
        props.color
      )
    })
  })
  return <T.Group ref={mergeRefs(props, cubeRef)} {...rest} />
}

type MarchingPlaneProps = {
  planeType?: 'x' | 'y' | 'z'
  strength?: number
  subtract?: number
} & Parameters<typeof T.Group>[0]

export const MarchingPlane: RefComponent<unknown, MarchingPlaneProps> = (_props) => {
  const [props, rest] = processProps(
    _props,
    {
      planeType: 'x',
      strength: 0.5,
      subtract: 12,
    },
    ['ref', 'planeType', 'strength', 'subtract']
  )

  const context = useContext(globalContext)
  const parentRef = createMemo(() => context?.getParent())
  const wallRef = createRef<Group>(null!)
  const _planeType = createMemo(
    () => (props.planeType === 'x' ? 'addPlaneX' : props.planeType === 'y' ? 'addPlaneY' : 'addPlaneZ'),
    [props.planeType]
  )

  useFrame(() => {
    if (!parentRef() || !wallRef) return
    parentRef()![_planeType()](props.strength, props.subtract)
  })
  return <T.Group ref={mergeRefs(props, wallRef!)} {...rest} />
}
