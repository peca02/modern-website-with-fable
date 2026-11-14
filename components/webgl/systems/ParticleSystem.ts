import * as THREE from "three";
import { PALETTE } from "@/lib/palette";
import { rig } from "@/components/webgl/rig";
import { particleFragment, particleVertex, simFragment, simVertex } from "@/shaders/particles.glsl";

const REFERENCE_COUNT = 512 * 512;

function createReferenceGeometry(size: number, verticesPerParticle: 1 | 2): THREE.BufferGeometry {
  const count = size * size;
  // xy: texel centre of the particle in the state texture, z: 0 head / 1 tail.
  const refs = new Float32Array(count * verticesPerParticle * 3);
  let offset = 0;
  for (let i = 0; i < count; i++) {
    const u = ((i % size) + 0.5) / size;
    const v = (Math.floor(i / size) + 0.5) / size;
    for (let end = 0; end < verticesPerParticle; end++) {
      refs[offset++] = u;
      refs[offset++] = v;
      refs[offset++] = end;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(refs, 3));
  return geometry;
}

function createRenderMaterial(points: boolean, size: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    uniforms: {
      uState: { value: null },
      uPrevious: { value: null },
      uDt: { value: 1 / 60 },
      uStreak: { value: 0.05 },
      uPointSize: { value: 1.2 },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uHeat: { value: 0 },
      uAlpha: { value: 0.3 },
      uPoints: { value: points ? 1 : 0 },
      uEmber: { value: new THREE.Color(PALETTE.ember) },
      uPlasma: { value: new THREE.Color(PALETTE.plasma) },
      uGlow: { value: new THREE.Color(PALETTE.glow) },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** GPGPU particles: a ping-pong position texture, drawn as filaments plus sparks. */
export class ParticleSystem {
  readonly object = new THREE.Group();
  private readonly size: number;
  private readonly targets: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private readonly simScene = new THREE.Scene();
  private readonly simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly simMaterial: THREE.ShaderMaterial;
  private readonly simGeometry = new THREE.PlaneGeometry(2, 2);
  private readonly lineMaterial: THREE.ShaderMaterial;
  private readonly pointMaterial: THREE.ShaderMaterial;
  private readonly lineGeometry: THREE.BufferGeometry;
  private readonly pointGeometry: THREE.BufferGeometry;
  private readonly density: number;
  private current = 0;
  private initialised = false;
  private fade = 0;

  constructor(size: number, floatTargets: boolean) {
    this.size = size;
    this.lineMaterial = createRenderMaterial(false, size);
    this.pointMaterial = createRenderMaterial(true, size);
    this.density = Math.sqrt(REFERENCE_COUNT / (size * size));
    const options: THREE.RenderTargetOptions = {
      type: floatTargets ? THREE.FloatType : THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.targets = [new THREE.WebGLRenderTarget(size, size, options), new THREE.WebGLRenderTarget(size, size, options)];

    this.simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertex,
      fragmentShader: simFragment,
      uniforms: {
        uState: { value: null },
        uResolution: { value: new THREE.Vector2(size, size) },
        uTime: { value: 0 },
        uDt: { value: 1 / 60 },
        uInit: { value: 1 },
        uShapeA: { value: 0 },
        uShapeB: { value: 1 },
        uMix: { value: 0 },
        uReveal: { value: 0 },
        uSpread: { value: 0 },
        uTurbulence: { value: 0 },
        uFollow: { value: 3 },
        uFlow: { value: 0.1 },
        uPointer: { value: new THREE.Vector3() },
        uPointerForce: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.simScene.add(new THREE.Mesh(this.simGeometry, this.simMaterial));

    this.lineGeometry = createReferenceGeometry(size, 2);
    this.pointGeometry = createReferenceGeometry(size, 1);
    const lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    const points = new THREE.Points(this.pointGeometry, this.pointMaterial);
    lines.frustumCulled = false;
    points.frustumCulled = false;
    this.object.add(lines, points);
  }

  update(renderer: THREE.WebGLRenderer, dt: number): void {
    const sim = this.simMaterial.uniforms;
    sim.uTime.value = rig.time;
    sim.uDt.value = dt;
    sim.uShapeA.value = rig.shapeA;
    sim.uShapeB.value = rig.shapeB;
    sim.uMix.value = rig.mix;
    sim.uReveal.value = rig.reveal;
    sim.uSpread.value = rig.spread;
    sim.uTurbulence.value = rig.turbulence;
    sim.uFollow.value = rig.follow;
    sim.uFlow.value = rig.flow;
    sim.uPointer.value.copy(rig.pointer);
    sim.uPointerForce.value = rig.pointerForce;

    const previousTarget = renderer.getRenderTarget();
    if (!this.initialised) {
      sim.uInit.value = 1;
      for (const target of this.targets) {
        renderer.setRenderTarget(target);
        renderer.render(this.simScene, this.simCamera);
      }
      sim.uInit.value = 0;
      this.initialised = true;
    }

    const read = this.targets[this.current];
    const write = this.targets[1 - this.current];
    sim.uState.value = read.texture;
    renderer.setRenderTarget(write);
    renderer.render(this.simScene, this.simCamera);
    renderer.setRenderTarget(previousTarget);
    this.current = 1 - this.current;

    // A freshly created system (tier change) fades in instead of popping.
    this.fade = Math.min(1, this.fade + dt * 1.5);
    const pixelRatio = renderer.getPixelRatio();
    for (const material of [this.lineMaterial, this.pointMaterial]) {
      const uniforms = material.uniforms;
      uniforms.uState.value = write.texture;
      uniforms.uPrevious.value = read.texture;
      uniforms.uDt.value = dt;
      uniforms.uStreak.value = rig.streak;
      uniforms.uHeat.value = rig.heat;
      uniforms.uPixelRatio.value = pixelRatio;
    }
    this.lineMaterial.uniforms.uAlpha.value = 0.085 * this.density * rig.particleAlpha * this.fade;
    this.pointMaterial.uniforms.uAlpha.value = 0.05 * this.density * rig.particleAlpha * this.fade;
  }

  get count(): number {
    return this.size * this.size;
  }

  dispose(): void {
    this.targets.forEach((target) => target.dispose());
    this.simGeometry.dispose();
    this.simMaterial.dispose();
    this.lineGeometry.dispose();
    this.pointGeometry.dispose();
    this.lineMaterial.dispose();
    this.pointMaterial.dispose();
  }
}
