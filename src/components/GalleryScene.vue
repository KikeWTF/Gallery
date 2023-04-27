<template>
  <LoadingScreen ref="loading" />
  <canvas ref="canvas" />

  <div ref="welcome" class="welcome">
    <h1 class="text name">GALLERY</h1>
    <p class="text description">Interactive & immersive exhibition of my certs</p>
  </div>

  <div class="mobile">
    <h1>Unfortunately,<br />the gallery is not available on mobile devices.</h1>
  </div>
</template>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  background-color: #aaa;
}
.welcome {
  z-index: 5;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background-color: #837d7de2;
  padding: 50px 100px;
  border-radius: 3px;
  transition: opacity 1s ease-in-out;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.text {
  position: relative;
  font-family: 'Montserrat';
  font-size: 6rem;
  white-space: nowrap;
  color: #fff;
  width: fit-content;
}
.name {
  text-transform: uppercase;
}
.welcome .name::after {
  content: '';
  position: absolute;
  background: #fff;
  left: 0%;
  transform: translate(calc(-1 * var(--mg-left)), -50%);
  bottom: 0;
  width: 60px;
  height: 2px;
}
.welcome .description {
  font-size: 2rem;
  font-weight: 500;
}
.mobile {
  display: none;
}

@media screen and (max-width: 900px) {
  canvas,
  .welcome {
    display: none;
  }

  .mobile {
    z-index: 5;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    color: #56585e;
    background-color: #f5f9ff;
    padding: 50px 100px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  h1 {
    font-size: 2rem;
    text-align: center;
  }
}
</style>

<script setup lang="ts">
import { onMounted, getCurrentInstance, type ComponentInternalInstance } from 'vue'
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  SceneLoader,
  MeshBuilder,
  UniversalCamera,
  ActionManager,
  ExecuteCodeAction,
  HighlightLayer,
  Mesh,
  Color3,
  StandardMaterial,
  Texture,
  Matrix,
  Sound
} from '@babylonjs/core'
import '@babylonjs/loaders'
import devnull from '@/scripts/devnull'
import interactivePaintings from '@/assets/links.json'
import LoadingScreen, { type LoadingScreenType } from './LoadingScreen.vue'

const ctx: ComponentInternalInstance = getCurrentInstance() as ComponentInternalInstance

// Create the scene
class Metaverse {
  // collision detection
  private gravity: number = -9.81
  private framesPerSecond: number = 60
  private collidableMeshes: string[] = ['door', 'floor', 'house', 'roof', 'wall']

  // starting point
  private startPoint: Vector3 = new Vector3(10.24, 2.15, -0.5)
  private startAngle: Vector3 = new Vector3(-0.05, -1.54, 0)

  // resources
  private engine: Engine
  private scene: Scene
  private camera: FreeCamera
  private highlightLayer: HighlightLayer | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private loadingScreen: LoadingScreenType,
    private welcome: HTMLElement | null
  ) {
    this.engine = this.createEngine()
    this.scene = this.createScene()
    this.initSounds()
    this.initLights()
    this.initEnvironment()
    this.camera = this.createCamera()
    this.initEvents()
  }

  private createEngine(): Engine {
    const canvas: HTMLCanvasElement = this.canvas
    const engine: Engine = devnull(
      () => new Engine(canvas, true, { adaptToDeviceRatio: true, stencil: true })
    )
    // resize the canvas when the window is resized
    engine.resize()
    window.addEventListener('resize', () => {
      this.engine.resize()
    })
    // prevent the default context menu
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault())
    // change the loading screen
    engine.loadingScreen = this.loadingScreen.createLoadingScreen()
    return engine
  }

  private createScene(): Scene {
    const scene: Scene = new Scene(this.engine)
    scene.collisionsEnabled = true
    scene.gravity = new Vector3(0, this.gravity / this.framesPerSecond, 0)
    return scene
  }

  private createCamera(): UniversalCamera {
    // starting point
    const camera: UniversalCamera = new UniversalCamera('pov', this.startPoint, this.scene)
    camera.rotation = this.startAngle
    // collisions
    camera.applyGravity = true
    camera.checkCollisions = true
    camera.ellipsoid = new Vector3(1, 1, 1)
    // movement
    camera.minZ = 0.05
    camera.speed = 0.1
    camera.angularSensibility = 4000
    camera.attachControl(this.canvas, true)
    // input keys (WASD)
    camera.keysUp.push(87)
    camera.keysDown.push(83)
    camera.keysLeft.push(65)
    camera.keysRight.push(68)
    return camera
  }

  private initEvents(): void {
    this.scene.onPointerDown = () => {
      if (this.welcome) {
        this.welcome.style.opacity = '0'
        setTimeout(() => {
          if (this.welcome) this.welcome.style.display = 'none'
        }, 1000)
      }
      if (!this.engine.isPointerLock) this.engine.enterPointerlock()
    }
    this.scene.onPointerUp = () => {
      if (this.welcome) {
        this.welcome.style.opacity = '0'
        setTimeout(() => {
          if (this.welcome) this.welcome.style.display = 'none'
        }, 1000)
      }
      if (this.engine.isPointerLock) this.engine.exitPointerlock()
    }
  }

  private addInteraction(mesh: Mesh, link: string): void {
    // create the highlight layer
    if (!this.highlightLayer) this.highlightLayer = new HighlightLayer('highlight', this.scene)
    // add the actions to the mesh
    mesh.actionManager = new ActionManager(this.scene)
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnRightPickTrigger, () => {
        if (!this.isSomethingBetween(mesh)) window.open(link, '_blank', 'noopener')
      })
    )
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        if (!this.isSomethingBetween(mesh)) this.highlightLayer?.addMesh(mesh, Color3.White())
      })
    )
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        this.highlightLayer?.removeMesh(mesh)
        this.scene.doNotHandleCursors = false
      })
    )
  }

  private isSomethingBetween(mesh: Mesh): boolean {
    const ray = this.scene.createPickingRay(
      this.scene.pointerX,
      this.scene.pointerY,
      Matrix.Identity(),
      this.camera
    )
    const hit = this.scene.pickWithRay(ray)
    const isSomething = hit?.pickedMesh?.name !== mesh.name
    this.scene.doNotHandleCursors = isSomething
    return isSomething
  }

  private async initEnvironment(): Promise<void> {
    // load the scene
    const { meshes } = await SceneLoader.ImportMeshAsync(
      '',
      './models/gallery/',
      'scene.gltf',
      this.scene,
      (evt) => {
        const percentComplete: number = (evt.loaded * 100) / evt.total
        this.loadingScreen.updateProgress(percentComplete.toFixed(0))
      },
      '.gltf'
    )

    // configure the meshes
    meshes.map((mesh) => {
      // check for collisions
      mesh.checkCollisions =
        this.collidableMeshes.filter((sref) => mesh.name.includes(sref)).length > 0
      mesh.receiveShadows = true
      // add interaction to the painting. When clicked, a new tabs is open with an URL
      const key: string = Object.keys(interactivePaintings).filter(
        (sref) => mesh.name.includes(sref) && mesh.name.endsWith('_0')
      )[0]
      if (key) {
        // darker mesh
        mesh.material?.getActiveTextures().map((texture) => {
          if (texture instanceof Texture) texture.level = 0.6
        })
        // add the interaction to the mesh
        this.addInteraction(
          mesh as Mesh,
          interactivePaintings[key as keyof typeof interactivePaintings]
        )
      }
    })

    // create the floor and the skybox
    this.initFloor()
    this.initSkybox()

    // render the scene
    this.render()
  }

  private initSounds(): void {
    new Sound('jazz', './audio/background.mp3', this.scene, null, {
      loop: true,
      autoplay: true,
      volume: 0.2
    })

    new Sound('footsteps', './audio/footsteps.mp3', this.scene, null, {
      loop: true,
      autoplay: false
    })
  }

  private checkSounds(lastPosition: Vector3): void {
    const footsteps = this.scene.getSoundByName('footsteps')
    if (footsteps) {
      const isMoving = this.camera.position.subtract(lastPosition).length() !== 0
      if (isMoving && this.welcome !== null) {
        this.welcome.style.opacity = '0'
        this.welcome = null
      }
      if (isMoving && !footsteps.isPlaying) {
        if (Engine.audioEngine) Engine.audioEngine!.unlock()
        footsteps.setVolume(0.1)
        footsteps.play()
      }
      if (!isMoving && footsteps.isPlaying) {
        while (footsteps.getVolume() > 0.0001) footsteps.setVolume(footsteps.getVolume() - 0.0001)
        footsteps.stop()
      }
    }
  }

  private initLights(): void {
    new HemisphericLight('light', new Vector3(0, -1, 0), this.scene)
  }

  private initFloor(): void {
    const floor = MeshBuilder.CreatePlane('floor_collider', { width: 100, height: 100 }, this.scene)
    floor.rotation.x = Math.PI / 2
    floor.position.y = 0.1
    floor.visibility = 0
    floor.checkCollisions = true
  }

  private initSkybox(): void {
    const skyMaterial = new StandardMaterial('skyMaterial', this.scene)
    skyMaterial.backFaceCulling = false
    skyMaterial.diffuseColor = new Color3(0.9, 0.9, 0.9)

    const sky = MeshBuilder.CreatePlane(
      'sky',
      { width: 150, height: 150, sideOrientation: Mesh.DOUBLESIDE },
      this.scene
    )
    sky.material = skyMaterial
    sky.rotation.x = Math.PI / 2
    sky.position.y = 20
  }

  private async render(): Promise<void> {
    // hide the loading screen
    this.canvas.focus()
    this.engine.hideLoadingUI()

    var lastPosition: Vector3 = this.camera.position.clone()
    // render the scene
    this.engine.runRenderLoop((): void => {
      this.checkSounds(lastPosition)
      lastPosition = this.camera.position.clone()
      this.scene.render()
    })
  }
}

onMounted(() => {
  new Metaverse(
    ctx.refs.canvas as HTMLCanvasElement,
    ctx.refs.loading as LoadingScreenType,
    ctx.refs.welcome as HTMLElement
  )
})
</script>
