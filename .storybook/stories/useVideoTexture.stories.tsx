import * as THREE from 'three'

import { Setup } from '../Setup'

import { T } from '@solid-three/fiber'
import { createSignal } from 'solid-js'
import { Plane, useTexture, useVideoTexture } from '../../src'

export default {
  title: 'Misc/useVideoTexture',
  component: useVideoTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

//
// simple
//

function VideoTexturedPlane() {
  const texture = useVideoTexture('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')

  return (
    <>
      <Plane args={[4, 2.25]}>
        <T.MeshBasicMaterial side={THREE.DoubleSide} map={texture()} toneMapped={false} />
      </Plane>
    </>
  )
}

function UseVideoTextureScene() {
  return (
    <T.Suspense fallback={null}>
      <VideoTexturedPlane />
    </T.Suspense>
  )
}

export const UseVideoTextureSceneSt = () => <UseVideoTextureScene />
UseVideoTextureSceneSt.story = {
  name: 'Default',
}

//
// T.Suspense
//

function VideoTexturedPlane2() {
  return (
    <>
      <Plane args={[4, 2.25]}>
        <T.Suspense fallback={<FallbackMaterial url="images/sintel-cover.jpg" />}>
          <VideoMaterial src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" />
        </T.Suspense>
      </Plane>
    </>
  )
}

function VideoMaterial({ src }) {
  const texture = useVideoTexture(src)
  return <T.MeshBasicMaterial side={THREE.DoubleSide} map={texture()} toneMapped={false} />
}

function FallbackMaterial({ url }: { url: string }) {
  const texture = useTexture(url)
  return <T.MeshBasicMaterial map={texture()} toneMapped={false} />
}

function UseVideoTextureScene2() {
  return (
    <T.Suspense fallback={null}>
      <VideoTexturedPlane2 />
    </T.Suspense>
  )
}

export const UseVideoTextureSceneSt2 = () => <UseVideoTextureScene2 />
UseVideoTextureSceneSt2.story = {
  name: 'Suspense',
}

//
// getDisplayMedia (Screen Capture API)
//

// s3f: this one does not work yet
function VideoTexturedPlane3() {
  const [mediaStream, setMediaStream] = createSignal(new MediaStream())

  return (
    <>
      <Plane
        args={[4, 2.25]}
        onClick={async (e) => {
          const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true })

          setMediaStream(mediaStream)
        }}
      >
        <T.Suspense fallback={<FallbackMaterial url="images/share-screen.jpg" />}>
          <VideoMaterial src={mediaStream} />
        </T.Suspense>
      </Plane>
    </>
  )
}

function UseVideoTextureScene3() {
  return (
    <T.Suspense fallback={null}>
      <VideoTexturedPlane3 />
    </T.Suspense>
  )
}

export const UseVideoTextureSceneSt3 = () => <UseVideoTextureScene3 />
UseVideoTextureSceneSt3.story = {
  name: 'MediaStream',
}
