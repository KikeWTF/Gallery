<template>
  <canvas ref="canvas" />
</template>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  background-color: #f0f;
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
  Matrix
} from '@babylonjs/core'
import '@babylonjs/loaders'
import devnull from '../scripts/devnull'
import interactivePaintings from '../assets/links.json'

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

  constructor(private canvas: HTMLCanvasElement, private loader: HTMLDivElement) {
    this.engine = this.createEngine()
    this.scene = this.createScene()
    this.initLights()
    this.initEnvironment()
    this.camera = this.createCamera()
    this.initVR()
  }

  private createEngine(): Engine {
    const canvas: HTMLCanvasElement = this.canvas
    const engine: Engine = devnull(
      () => new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    )
    // resize the canvas when the window is resized
    engine.resize()
    window.addEventListener('resize', () => {
      this.engine.resize()
    })
    // prevent the default context menu
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault())
    // show the loading screen
    engine.displayLoadingUI()
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

  private addInteraction(mesh: Mesh, link: string): void {
    // create the highlight layer
    if (!this.highlightLayer) this.highlightLayer = new HighlightLayer('highlight', this.scene)
    // add the actions to the mesh
    mesh.actionManager = new ActionManager(this.scene)
    mesh.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickDownTrigger, () => {
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
      '/models/gallery/',
      'scene.gltf',
      this.scene,
      null,
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

  private async initVR(): Promise<void> {
    // TODO: Test this on a mobile device
    try {
      await this.scene.createDefaultXRExperienceAsync({
        floorMeshes: [this.scene.getMeshByName('floor_collider')!]
      })
    } catch (error) {
      console.info("WebXR isn't available on this device")
    }
  }

  private async render(): Promise<void> {
    // hide the loading screen
    this.canvas.focus()
    this.engine.hideLoadingUI()
    // render the scene
    this.engine.runRenderLoop((): void => {
      this.scene.render()
    })
  }
}

onMounted(() => {
  new Metaverse(ctx.refs.canvas as HTMLCanvasElement, ctx.refs.loading as HTMLDivElement)
})
</script>
