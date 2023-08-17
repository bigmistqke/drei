/* eslint react-hooks/exhaustive-deps: 1 */
import { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { T, useFrame, useThree } from '@solid-three/fiber'
import { easing } from 'maath'
import * as THREE from 'three'

import {
  Accessor,
  ResourceReturn,
  Suspense,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js'
import { defaultProps } from '../helpers/defaultProps'
import { RefComponent } from '../helpers/typeHelpers'
import { createImperativeHandle } from '../helpers/useImperativeHandle'
import { when } from '../helpers/when'
import { useFaceLandmarker } from './FaceLandmarker'
import { Facemesh, FacemeshApi, FacemeshProps } from './Facemesh'
import { useVideoTexture } from './useVideoTexture'

type VideoTextureSrc = Parameters<typeof useVideoTexture>[0] // useVideoTexture 1st arg `src` type

function mean(v1: THREE.Vector3, v2: THREE.Vector3) {
  return v1.clone().add(v2).multiplyScalar(0.5)
}

function localToLocal(objSrc: THREE.Object3D, v: THREE.Vector3, objDst: THREE.Object3D) {
  // see: https://discourse.threejs.org/t/object3d-localtolocal/51564
  const v_world = objSrc.localToWorld(v)
  return objDst.worldToLocal(v_world)
}

//
//
//

export type FaceControlsProps = {
  /** The camera to be controlled, default: global state camera */
  camera?: THREE.Camera
  /** Whether to autostart the webcam, default: true */
  autostart?: boolean
  /** Enable/disable the webcam, default: true */
  webcam?: boolean
  /** A custom video URL or mediaStream, default: undefined */
  webcamVideoTextureSrc?: VideoTextureSrc
  /** Disable the rAF camera position/rotation update, default: false */
  manualUpdate?: boolean
  /** Disable the rVFC face-detection, default: false */
  manualDetect?: boolean
  /** Callback function to call on "videoFrame" event, default: undefined */
  onVideoFrame?: (e: THREE.Event) => void
  /** Reference this FaceControls instance as state's `controls` */
  makeDefault?: boolean
  /** Approximate time to reach the target. A smaller value will reach the target faster. */
  smoothTime?: number
  /** Apply position offset extracted from `facialTransformationMatrix` */
  offset?: boolean
  /** Offset sensitivity factor, less is more sensible, default: 80 */
  offsetScalar?: number
  /** Enable eye-tracking */
  eyes?: boolean
  /** Force Facemesh's `origin` to be the middle of the 2 eyes, default: true */
  eyesAsOrigin?: boolean
  /** Constant depth of the Facemesh, default: .15 */
  depth?: number
  /** Enable debug mode, default: false */
  debug?: boolean
  /** Facemesh options, default: undefined */
  facemesh?: FacemeshProps
}

export type FaceControlsApi = THREE.EventDispatcher & {
  /** Detect faces from the video */
  detect: (video: HTMLVideoElement, time: number) => void
  /** Compute the target for the camera */
  computeTarget: () => THREE.Object3D
  /** Update camera's position/rotation to the `target` */
  update: (delta: number, target?: THREE.Object3D) => void
  /** <Facemesh> ref api */
  facemeshApiRef: FacemeshApi
  /** <Webcam> ref api */
  webcamApiRef: WebcamApi
  /** Play the video */
  play: () => void
  /** Pause the video */
  pause: () => void
}

const FaceControlsContext = createContext({} as FaceControlsApi)

export const FaceControls: RefComponent<FaceControlsApi, FaceControlsProps> = (_props) => {
  const props = defaultProps(_props, {
    autostart: true,
    webcam: true,
    manualUpdate: false,
    manualDetect: false,
    smoothTime: 0.25,
    offset: true,
    offsetScalar: 80,
    eyes: false,
    eyesAsOrigin: true,
    depth: 0.15,
    debug: false,
  })

  const store = useThree()
  const explCamera = () => props.camera || store.camera

  let webcamApiRef: WebcamApi = null!
  let facemeshApiRef: FacemeshApi = null!

  //
  // computeTarget()
  //
  // Compute `target` position and rotation for the camera (according to <Facemesh>)
  //
  //  1. 👀 either following the 2 eyes
  //  2. 👤 or just the head mesh
  //

  const target = new THREE.Object3D()
  const irisRightDirPos = new THREE.Vector3()
  const irisLeftDirPos = new THREE.Vector3()
  const irisRightLookAt = new THREE.Vector3()
  const irisLeftLookAt = new THREE.Vector3()
  const computeTarget: FaceControlsApi['computeTarget'] = () => {
    // same parent as the camera
    target.parent = explCamera().parent

    const facemeshApi = facemeshApiRef
    if (facemeshApi) {
      const { outerRef, eyeRightRef, eyeLeftRef } = facemeshApi

      if (eyeRightRef && eyeLeftRef) {
        // 1. 👀

        const { irisDirRef: irisRightDirRef } = eyeRightRef
        const { irisDirRef: irisLeftDirRef } = eyeLeftRef

        if (irisRightDirRef && irisLeftDirRef && outerRef) {
          //
          // position: mean of irisRightDirPos,irisLeftDirPos
          //
          irisRightDirPos.copy(localToLocal(irisRightDirRef, new THREE.Vector3(0, 0, 0), outerRef))
          irisLeftDirPos.copy(localToLocal(irisLeftDirRef, new THREE.Vector3(0, 0, 0), outerRef))
          target.position.copy(
            localToLocal(outerRef, mean(irisRightDirPos, irisLeftDirPos), explCamera().parent || store.scene)
          )

          //
          // lookAt: mean of irisRightLookAt,irisLeftLookAt
          //
          irisRightLookAt.copy(localToLocal(irisRightDirRef, new THREE.Vector3(0, 0, 1), outerRef))
          irisLeftLookAt.copy(localToLocal(irisLeftDirRef, new THREE.Vector3(0, 0, 1), outerRef))
          target.lookAt(outerRef.localToWorld(mean(irisRightLookAt, irisLeftLookAt)))
        }
      } else {
        // 2. 👤

        if (outerRef) {
          target.position.copy(localToLocal(outerRef, new THREE.Vector3(0, 0, 0), explCamera().parent || store.scene))
          target.lookAt(outerRef.localToWorld(new THREE.Vector3(0, 0, 1)))
        }
      }
    }

    return target
  }

  //
  // update()
  //
  // Updating the camera `current` position and rotation, following `target`
  //

  const current = new THREE.Object3D()
  const update: FaceControlsApi['update'] = function (delta, target) {
    if (explCamera()) {
      target ??= computeTarget()

      if (props.smoothTime > 0) {
        // damping current
        const eps = 1e-9
        easing.damp3(current.position, target.position, props.smoothTime, delta, undefined, undefined, eps)
        easing.dampE(current.rotation, target.rotation, props.smoothTime, delta, undefined, undefined, eps)
      } else {
        // instant
        current.position.copy(target.position)
        current.rotation.copy(target.rotation)
      }

      explCamera().position.copy(current.position)
      explCamera().rotation.copy(current.rotation)
    }
  }

  //
  // detect()
  //

  const [faces, setFaces] = createSignal<FaceLandmarkerResult>()
  const faceLandmarker = useFaceLandmarker()
  const detect: FaceControlsApi['detect'] = (video, time) => {
    const faces = faceLandmarker()?.detectForVideo(video, time)
    setFaces(faces)
  }

  useFrame((_, delta) => {
    if (!props.manualUpdate) {
      update(delta)
    }
  })

  // Ref API
  const api = createMemo<FaceControlsApi>(() =>
    Object.assign(Object.create(THREE.EventDispatcher.prototype), {
      detect,
      computeTarget,
      update,
      facemeshApiRef,
      webcamApiRef,
      // shorthands
      play: () => {
        webcamApiRef?.videoTextureApiRef?.texture.source.data.play()
      },
      pause: () => {
        webcamApiRef?.videoTextureApiRef?.texture.source.data.pause()
      },
    })
  )
  createImperativeHandle(props, api)

  //
  // events callbacks
  //

  createEffect(() => {
    const onVideoFrameCb = (e: THREE.Event) => {
      if (!props.manualDetect) detect(e.texture.source.data, e.time)
      if (props.onVideoFrame) props.onVideoFrame(e)
    }

    api().addEventListener('videoFrame', onVideoFrameCb)

    onCleanup(() => {
      api().removeEventListener('videoFrame', onVideoFrameCb)
    })
  })

  // `controls` global state
  createEffect(() => {
    if (props.makeDefault) {
      const old = store.controls
      store.set({ controls: api() })
      onCleanup(() => store.set({ controls: old }))
    }
  })

  const points = faces()?.faceLandmarks[0]
  const facialTransformationMatrix = faces()?.facialTransformationMatrixes?.[0]
  const faceBlendshapes = faces()?.faceBlendshapes?.[0]
  return (
    <FaceControlsContext.Provider value={api()}>
      {props.webcam && (
        <Suspense fallback={null}>
          <Webcam ref={webcamApiRef} autostart={props.autostart} videoTextureSrc={props.webcamVideoTextureSrc} />
        </Suspense>
      )}

      <Facemesh
        ref={facemeshApiRef}
        {...props.facemesh}
        points={points}
        depth={props.depth}
        facialTransformationMatrix={facialTransformationMatrix}
        faceBlendshapes={faceBlendshapes}
        eyes={props.eyes}
        eyesAsOrigin={props.eyesAsOrigin}
        offset={props.offset}
        offsetScalar={props.offsetScalar}
        debug={props.debug}
        rotation-z={Math.PI}
        visible={props.debug}
      >
        <T.MeshBasicMaterial side={THREE.DoubleSide} />
      </Facemesh>
    </FaceControlsContext.Provider>
  )
}

export const useFaceControls = () => useContext(FaceControlsContext)

//
// Webcam
//

type WebcamApi = {
  videoTextureApiRef: VideoTextureApi | undefined
}

type WebcamProps = {
  videoTextureSrc?: VideoTextureSrc
  autostart?: boolean
}

const Webcam: RefComponent<WebcamApi, WebcamProps> = (_props) => {
  const props = defaultProps(_props, { autostart: true })

  const [videoTextureApiRef, setVideoTextureApiRef] = createSignal<VideoTextureApi>()

  const faceControls = useFaceControls()

  const [stream]: ResourceReturn<MediaStream | null> = createResource([props.videoTextureSrc], async () => {
    return !props.videoTextureSrc
      ? await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user' },
        })
      : Promise.resolve(null)
  })

  createEffect(() => {
    faceControls.dispatchEvent({ type: 'stream', stream })

    onCleanup(() => {
      stream()
        ?.getTracks()
        .forEach((track) => track.stop())
      // s3f: cache and clear cache
      // clear([props.videoTextureSrc])
    })
  })

  // ref-api
  const api = {
    get videoTextureApiRef() {
      return videoTextureApiRef()
    },
  }
  createImperativeHandle(props, () => api)

  return (
    <Suspense fallback={null}>
      <VideoTexture ref={setVideoTextureApiRef} src={props.videoTextureSrc || stream()!} start={props.autostart} />
    </Suspense>
  )
}

//
// VideoTexture
//

type VideoTextureApi = { texture: THREE.VideoTexture }
type VideoTextureProps = { src: VideoTextureSrc; start: boolean }

const VideoTexture: RefComponent<VideoTextureApi, VideoTextureProps> = (props) => {
  const texture = useVideoTexture(props.src, { start: props.start })
  const video = () => texture()?.source.data

  const faceControls = useFaceControls()
  const onVideoFrame = (time: number) => {
    faceControls.dispatchEvent({ type: 'videoFrame', texture, time })
  }
  useVideoFrame(video, onVideoFrame)

  // ref-api
  const api = createMemo<VideoTextureApi | undefined>(() =>
    when(texture)((texture) => ({
      texture,
    }))
  )
  createImperativeHandle(props, api)

  return <></>
}

const useVideoFrame = (video: Accessor<HTMLVideoElement>, f: (...args: any) => any) => {
  // https://web.dev/requestvideoframecallback-rvfc/
  // https://www.remotion.dev/docs/video-manipulation
  createEffect(() => {
    if (!video() || !video().requestVideoFrameCallback) return
    let handle: number
    function callback(...args: any) {
      f(...args)
      handle = video().requestVideoFrameCallback(callback)
    }
    video().requestVideoFrameCallback(callback)

    onCleanup(() => video().cancelVideoFrameCallback(handle))
  })
}
