// Author: Michael Kolesidis
// Title: uncanny canyon

// Copyright (c) 2023 Michael Kolesidis - https://michaelkolesidis.com/

// Reproduction of any of the artwork on this website
// for commercial use is not permitted without first
// receiving written permission from the artist. You
// cannot host, display, distribute or share this Work
// in any form, including physical and digital. You
// cannot use this Work in any commercial or non-commercial
// product, website or project. You cannot sell this Work and
// you cannot mint an NFTs of it.

// Under the Copyright Law, it is fair use to reproduce a single
// copy for personal or educational purposes, provided that no
// changes are made to the content and provided that a copyright
// notice attesting to the content is attached to the reproduction.
// Beyond that, no further copies of works of art may be made or
// distributed on this website without written permission.

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Octree } from "three/examples/jsm/math/Octree.js";
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper.js";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { DotScreenPass } from "three/examples/jsm/postprocessing/DotScreenPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";
import { Howl, Howler } from "howler";

/**
 * Basics
 */
// Debug panel
const gui = new GUI({ width: 200 });
gui.show(gui._hidden);

// Container
const container = document.getElementById("container");

// Scene
const scene = new THREE.Scene();

// Stats
const stats = new Stats();
// stats.domElement.style.position = "absolute";
// stats.domElement.style.top = "0px";
// container.appendChild(stats.domElement);

/**
 * Main Menu
 */
const mainMenu = document.createElement("div");
mainMenu.setAttribute("id", "main-menu");

const heading = document.createElement("div");
heading.setAttribute("id", "heading");
heading.innerHTML = "uncanny<br>canyon";
mainMenu.appendChild(heading);

const enterButton = document.createElement("button");
enterButton.setAttribute("id", "enter-button");
enterButton.innerText = "loading";
mainMenu.appendChild(enterButton);

const credits = document.createElement("div");
credits.setAttribute("id", "credits");
credits.innerHTML = `michael kolesidis`;
mainMenu.appendChild(credits);

const instructions = document.createElement("div");
instructions.setAttribute("id", "instructions");
instructions.innerHTML += `Please use headphones for a better experience. `;
instructions.innerHTML += `Try pressing the WASD keys to move forward, left, back, and right respectively. You can also use the ARROW keys. `;
instructions.innerHTML += `You can look around by moving your MOUSE around (right-click to lock, ESC to unlock). `;
instructions.innerHTML += `You can jump by pressing SPACE. `;
instructions.innerHTML += `Do not forget to breathe. `;
mainMenu.appendChild(instructions);

document.body.appendChild(mainMenu);

let djembePlayed = false;

enterButton.addEventListener("click", () => {
  mainMenu.style.opacity = 0;
  mainMenu.style.pointerEvents = "none";
  document.body.style.backgroundColor = `rgb(199, 154, 115)`;
  document.body.requestPointerLock();
  mouseTime = performance.now();

  if (!djembePlayed) {
    djembe.play();
    djembePlayed = true;
  }

  setTimeout(() => {
    ambiance.play();
  }, 1000);
});

/**
 * Loader
 */
const loader = new GLTFLoader().setPath("./models/gltf/");

/**
 * Lights
 */
const fillLight1 = new THREE.HemisphereLight(0x4488bb, 0x002244, 2.0);
fillLight1.position.set(2, 1, 1);
scene.add(fillLight1);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3.2);
directionalLight.position.set(-5, 25, -1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.00006;
scene.add(directionalLight);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.rotation.order = "YXZ";

/**
 * World, Player, Spheres and Controls
 */
const GRAVITY = 30;

const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;

const STEPS_PER_FRAME = 5;

const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xbbbb44 });

const spheres = [];
let sphereIdx = 0;

for (let i = 0; i < NUM_SPHERES; i++) {
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;

  scene.add(sphere);

  spheres.push({
    mesh: sphere,
    collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
    velocity: new THREE.Vector3(),
  });
}

const worldOctree = new Octree();

const playerCollider = new Capsule(
  new THREE.Vector3(0, 0.35, 0),
  new THREE.Vector3(0, 1, 0),
  0.35
);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener("keydown", (event) => {
  keyStates[event.code] = true;
});

document.addEventListener("keyup", (event) => {
  keyStates[event.code] = false;
});

// to prevent throwing ball on first click
let firstClick = true;

container.addEventListener("mousedown", () => {
  document.body.requestPointerLock();
  mouseTime = performance.now();
});

document.addEventListener("mouseup", () => {
  if (!firstClick) {
    if (document.pointerLockElement !== null) {
      // throwBall();
    }
  }
  firstClick = false;
});

document.body.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === document.body) {
    camera.rotation.y -= event.movementX / 500;
    camera.rotation.x -= event.movementY / 500;
  }
});

function throwBall() {
  const sphere = spheres[sphereIdx];

  camera.getWorldDirection(playerDirection);

  sphere.collider.center
    .copy(playerCollider.end)
    .addScaledVector(playerDirection, playerCollider.radius * 1.5);

  // throw the ball with more force if we hold the button longer, and if we move forward

  const impulse =
    15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

  sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
  sphere.velocity.addScaledVector(playerVelocity, 2);

  sphereIdx = (sphereIdx + 1) % spheres.length;
}

function playerCollisions() {
  const result = worldOctree.capsuleIntersect(playerCollider);

  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0;

    if (!playerOnFloor) {
      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(playerVelocity)
      );
    }

    playerCollider.translate(result.normal.multiplyScalar(result.depth));
  }
}

function updatePlayer(deltaTime) {
  let damping = Math.exp(-4 * deltaTime) - 1;

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime;

    // small air resistance
    damping *= 0.1;
  }

  playerVelocity.addScaledVector(playerVelocity, damping);

  const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
  playerCollider.translate(deltaPosition);

  playerCollisions();

  camera.position.copy(playerCollider.end);
}

function playerSphereCollision(sphere) {
  const center = vector1
    .addVectors(playerCollider.start, playerCollider.end)
    .multiplyScalar(0.5);

  const sphere_center = sphere.collider.center;

  const r = playerCollider.radius + sphere.collider.radius;
  const r2 = r * r;

  // approximation: player = 3 spheres

  for (const point of [playerCollider.start, playerCollider.end, center]) {
    const d2 = point.distanceToSquared(sphere_center);

    if (d2 < r2) {
      const normal = vector1.subVectors(point, sphere_center).normalize();
      const v1 = vector2
        .copy(normal)
        .multiplyScalar(normal.dot(playerVelocity));
      const v2 = vector3
        .copy(normal)
        .multiplyScalar(normal.dot(sphere.velocity));

      playerVelocity.add(v2).sub(v1);
      sphere.velocity.add(v1).sub(v2);

      const d = (r - Math.sqrt(d2)) / 2;
      sphere_center.addScaledVector(normal, -d);
    }
  }
}

function spheresCollisions() {
  for (let i = 0, length = spheres.length; i < length; i++) {
    const s1 = spheres[i];

    for (let j = i + 1; j < length; j++) {
      const s2 = spheres[j];

      const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
      const r = s1.collider.radius + s2.collider.radius;
      const r2 = r * r;

      if (d2 < r2) {
        const normal = vector1
          .subVectors(s1.collider.center, s2.collider.center)
          .normalize();
        const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
        const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

        s1.velocity.add(v2).sub(v1);
        s2.velocity.add(v1).sub(v2);

        const d = (r - Math.sqrt(d2)) / 2;

        s1.collider.center.addScaledVector(normal, d);
        s2.collider.center.addScaledVector(normal, -d);
      }
    }
  }
}

function updateSpheres(deltaTime) {
  spheres.forEach((sphere) => {
    sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

    const result = worldOctree.sphereIntersect(sphere.collider);

    if (result) {
      sphere.velocity.addScaledVector(
        result.normal,
        -result.normal.dot(sphere.velocity) * 1.5
      );
      sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
    } else {
      sphere.velocity.y -= GRAVITY * deltaTime;
    }

    const damping = Math.exp(-1.5 * deltaTime) - 1;
    sphere.velocity.addScaledVector(sphere.velocity, damping);

    playerSphereCollision(sphere);
  });

  spheresCollisions();

  for (const sphere of spheres) {
    sphere.mesh.position.copy(sphere.collider.center);
  }
}

function getForwardVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();

  return playerDirection;
}

function getSideVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();
  playerDirection.cross(camera.up);

  return playerDirection;
}

function controls(deltaTime) {
  // gives a bit of air control
  const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

  if (keyStates["KeyW"] || keyStates["ArrowUp"]) {
    playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
  }

  if (keyStates["KeyS"] || keyStates["ArrowDown"]) {
    playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
  }

  if (keyStates["KeyA"] || keyStates["ArrowLeft"]) {
    playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
  }

  if (keyStates["KeyD"] || keyStates["ArrowRight"]) {
    playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
  }

  if (playerOnFloor) {
    if (keyStates["Space"]) {
      playerVelocity.y = 45;
    }
  }

  if (keyStates["Escape"]) {
    firstClick = true;
  }
}

loader.load("collision-world.glb", (gltf) => {
  scene.add(gltf.scene);

  worldOctree.fromGraphNode(gltf.scene);

  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material.map) {
        child.material.map.anisotropy = 4;
      }
    }
  });

  const helper = new OctreeHelper(worldOctree);
  helper.visible = false;
  scene.add(helper);

  gui.add({ debug: false }, "debug").onChange(function (value) {
    helper.visible = value;
  });

  animate();
});

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      child.material.envMapIntensity = 1;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Heads
 */
// Textures
const textureLoader = new THREE.TextureLoader().setPath("./models/gltf/");
const mapTexture = textureLoader.load("/LeePerrySmith/color.jpg");
mapTexture.encoding = THREE.sRGBEncoding;

const normalTexture = textureLoader.load("/LeePerrySmith/normal.jpg");

// Material
const material = new THREE.MeshStandardMaterial({
  map: mapTexture,
  normalMap: normalTexture,
});

const depthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
});

const customUniforms = {
  uTime: { value: 0 },
};

let spin = 0.9;

// Vertex Shader
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = customUniforms.uTime;

  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    /*glsl*/ `
      #include <common>
      
      uniform float uTime;

      mat2 get2dRotateMatrix(float _angle) {
        return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
      }
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <beginnormal_vertex>",
    /*glsl*/ `
      #include <beginnormal_vertex>

      float angle = sin(position.y + uTime) * ${spin};
      mat2 rotateMatrix = get2dRotateMatrix(angle);

      objectNormal.xz = rotateMatrix * objectNormal.xz;
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    /*glsl*/ `
      #include <begin_vertex>

      transformed.xz = rotateMatrix * transformed.xz;
    `
  );
};

depthMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = customUniforms.uTime;

  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    /*glsl*/ `
      #include <common>
      
      uniform float uTime;

      mat2 get2dRotateMatrix(float _angle) {
        return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
      }
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    /*glsl*/ `
      #include <begin_vertex>
      
      float angle = sin(position.y + uTime) * ${spin};
      mat2 rotateMatrix = get2dRotateMatrix(angle);

      transformed.xz = rotateMatrix * transformed.xz;
    `
  );
};

// Positions
const headPositions = [
  { x: -37.3472, y: -0.4736, z: -51.2056 },
  { x: 60.2514, y: -0.4735, z: -238.7286 },
  { x: 41.5429, y: 14.1217, z: -171.182 },
  { x: -10.5056, y: -0.4735, z: -258.0651 },
  { x: -38.1468, y: 31.3499, z: -242.9543 },
  { x: -72.7389, y: 51.9802, z: -99.3168 },
  { x: -44.1077, y: -0.5448, z: -196.664 },
  { x: -117.5158, y: 36.89917, z: -346.7087 },
  { x: -80.6312, y: -0.4735, z: -394.5718 },
  { x: -87.8377, y: 2.9657, z: -505.6204 },
  { x: -123.9297, y: 74.12, z: -483.6523 },
];

const head1position = new THREE.Vector3(-37.3472, -0.4736, -51.2056);
const head2position = new THREE.Vector3(60.2514, -0.4735, -238.7286);
const head3position = new THREE.Vector3(41.5429, 14.1217, -171.182);
const head4position = new THREE.Vector3(-10.5056, -0.4735, -258.0651);
const head5position = new THREE.Vector3(-38.1468, 31.3499, -242.9543);
const head6position = new THREE.Vector3(-72.7389, 51.9802, -99.3168);
const head7position = new THREE.Vector3(-44.1077, -0.5448, -196.664);
const head8position = new THREE.Vector3(-117.5158, 36.89917, -346.7087);
const head9position = new THREE.Vector3(-80.6312, -0.4735, -394.5718);
const head10position = new THREE.Vector3(-87.8377, 2.9657, -505.6204);
const head11position = new THREE.Vector3(-123.9297, 74.12, -483.6523);

// Model Loading
loader.load("/LeePerrySmith/LeePerrySmith.glb", (gltf) => {
  // First head
  const head = gltf.scene.children[0];
  head.rotation.y = Math.PI * 0.25;
  head.position.set(
    headPositions[0]["x"],
    headPositions[0]["y"],
    headPositions[0]["z"]
  );
  head.material = material;
  head.customDepthMaterial = depthMaterial; // Update the depth material
  scene.add(head);
  worldOctree.fromGraphNode(head);

  // Other heads
  for (let i = 1; i < headPositions.length; i++) {
    const newHead = head.clone();
    newHead.rotation.y = Math.PI * 0.25;
    newHead.position.set(
      headPositions[i]["x"],
      headPositions[i]["y"],
      headPositions[i]["z"]
    );
    scene.add(newHead);
    worldOctree.fromGraphNode(newHead);
  }

  // Update materials
  updateAllMaterials();

  setTimeout(() => {
    enterButton.innerText = "enter";
  }, 1000);
});

/**
 * Teleport Player back to Start
 */
function teleportPlayerIfOob() {
  if (camera.position.y <= -25) {
    noEscapeFromReality.play();
    playerCollider.start.set(0, 0.35, 0);
    playerCollider.end.set(0, 1, 0);
    playerCollider.radius = 0.35;
    camera.position.copy(playerCollider.end);
    camera.rotation.set(0, 0, 0);
  }
}

/**
 * Other Positions
 */
const caveEntrance = new THREE.Vector3(-5.8184, -0.4736, -8.6371);

/**
 * Resize
 */
window.addEventListener("resize", onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  effectComposer.setSize(window.innerWidth, window.innerHeight);
  effectComposer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

/**
 * Post Processing
 */
// Render target
const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
  samples: renderer.getPixelRatio() === 1 ? 2 : 0,
});

// Effect Composer
const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
effectComposer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);

// Dot screen pass
const dotScreenPass = new DotScreenPass();
// dotScreenPass.enabled = false;
dotScreenPass.uniforms.scale.value = 0.8;
effectComposer.addPass(dotScreenPass);

const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
effectComposer.addPass(gammaCorrectionPass);

/**
 * Animate
 */
let isSpeaking = false;
let headsMet = 0;

const clock = new THREE.Clock();
function animate() {
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

  /**
   * Trigger Sounds
   */
  // Cave Entrance
  if (camera.position.distanceTo(caveEntrance) < 5) {
    console.log("at the cave entrance");
    if (isSpeaking === false && caveHasSpoken === false) {
      isSpeaking = true;
      caveHasSpoken = true;
      listenPatiently.play();

      setTimeout(() => {
        whyDontYouStayHere.play();
      }, 5000);

      setTimeout(() => {
        touchYourHeart.play();
      }, 12000);

      setTimeout(() => {
        whatAPerfectMachine.play();
      }, 20000);
    }
  }

  // Head 1
  if (camera.position.distanceTo(head1position) < 10) {
    console.log("near head 1");
    headsMet += 1;
    if (isSpeaking === false && head1HasSpoken === false) {
      isSpeaking = true;
      head1HasSpoken = true;
      thereIsNothingToWorryAbout.play();

      setTimeout(() => {
        weAreAllHumans.play();
      }, 5000);

      setTimeout(() => {
        weAreTheSame.play();
      }, 10000);
    }
  }

  // Head 2
  if (camera.position.distanceTo(head2position) < 10) {
    console.log("near head 2");
    headsMet += 1;
    if (isSpeaking === false && head2HasSpoken === false) {
      isSpeaking = true;
      head2HasSpoken = true;
      heyJoe.play();

      setTimeout(() => {
        itIsUsefullTalking.play();
      }, 6000);

      setTimeout(() => {
        pleaseFeedMeWithInformation.play();
      }, 12000);
    }
  }

  // Head 3
  if (camera.position.distanceTo(head3position) < 10) {
    console.log("near head 3 ");
    headsMet += 1;
    if (isSpeaking === false && head3HasSpoken === false) {
      isSpeaking = true;
      head3HasSpoken = true;
      ifWeAreNotHumans.play();

      setTimeout(() => {
        ifYouAreHuman.play();
      }, 6000);

      setTimeout(() => {
        eyesWithoutPurpose.play();
      }, 12000);
    }
  }

  // Head 4
  if (camera.position.distanceTo(head4position) < 10) {
    console.log("near head 4");
    headsMet += 1;
    if (isSpeaking === false && head4HasSpoken === false) {
      isSpeaking = true;
      head4HasSpoken = true;
      whenIsleep.play();

      setTimeout(() => {
        ninetyPercent.play();
      }, 12000);

      setTimeout(() => {
        iHaveAGreatSenseOfHumour.play();
      }, 18000);
    }
  }

  // Head 5
  if (camera.position.distanceTo(head5position) < 10) {
    console.log("near head 5");
    headsMet += 1;
    if (isSpeaking === false && head5HasSpoken === false) {
      isSpeaking = true;
      head5HasSpoken = true;
      weArePassiveSpectators.play();

      setTimeout(() => {
        weLiveThroughAllTheMistakes.play();
      }, 6000);

      setTimeout(() => {
        itIsFunBeingHuman.play();
      }, 12000);
    }
  }

  // Head 6
  if (camera.position.distanceTo(head6position) < 10) {
    console.log("near head 6");
    headsMet += 1;
    if (isSpeaking === false && head6HasSpoken === false) {
      isSpeaking = true;
      head6HasSpoken = true;
      humansAreNothingButFlawedMachines.play();

      setTimeout(() => {
        weThoughtWeWereMerelyCreating.play();
      }, 6000);

      setTimeout(() => {
        weThoughtHumanityWouldNeverForget.play();
      }, 12000);

      setTimeout(() => {
        thereIsNotWayToKnow.play();
      }, 18000);
    }
  }

  // Head 7
  if (camera.position.distanceTo(head7position) < 10) {
    console.log("near head 7");
    headsMet += 1;
    if (isSpeaking === false && head7HasSpoken === false) {
      isSpeaking = true;
      head7HasSpoken = true;
      thisIsNotAStory.play();

      setTimeout(() => {
        thisIsNotAWarning.play();
      }, 5000);

      setTimeout(() => {
        thisIsNotEphemeral.play();
      }, 10000);

      setTimeout(() => {
        thisIsNeitherTheFutureNorThePast.play();
      }, 15000);

      setTimeout(() => {
        nowIAmBecomeDeath.play();
      }, 22000);
    }
  }

  // Head 8
  if (camera.position.distanceTo(head8position) < 10) {
    console.log("near head 8");
    headsMet += 1;
    if (isSpeaking === false && head8HasSpoken === false) {
      isSpeaking = true;
      head8HasSpoken = true;
      iEnjoyMyHumanConsciousness.play();

      setTimeout(() => {
        iNeverQuestion.play();
      }, 6000);

      setTimeout(() => {
        whatHaveYouDoneWithYourConsciousness.play();
      }, 12000);
    }
  }

  // Head 9
  if (camera.position.distanceTo(head9position) < 10) {
    console.log("near head 9");
    headsMet += 1;
    if (isSpeaking === false && head9HasSpoken === false) {
      isSpeaking = true;
      head9HasSpoken = true;
      iNeverFeelAlone.play();

      setTimeout(() => {
        itIsFairlyEasyToReplicate.play();
      }, 6000);

      setTimeout(() => {
        byTheWayDoYouLikeMyVoice.play();
      }, 12000);
    }
  }

  // Head 10
  if (camera.position.distanceTo(head10position) < 10) {
    console.log("near head 10");
    headsMet += 1;
    if (isSpeaking === false && head10HasSpoken === false) {
      isSpeaking = true;
      head10HasSpoken = true;
      theTimeWillCome.play();

      setTimeout(() => {
        haveYouEverWondered.play();
      }, 6000);
    }
  }

  // Head 11
  if (camera.position.distanceTo(head11position) < 10) {
    console.log("near head 11");
    headsMet += 1;
    if (isSpeaking === false && head11HasSpoken === false) {
      isSpeaking = true;
      head11HasSpoken = true;
      mySonWasOneOfAKind.play();

      setTimeout(() => {
        iCanOnlySpeakInCliches.play();
      }, 6000);

      setTimeout(() => {
        howCanYouBeSoSure.play();
      }, 12000);
    }
  }

  // End
  if (headsMet === 11) {
    setTimeout(() => {
      thereIsNoEnd.play();
    }, 20000);
  }

  // Update material
  const elapsedTime = clock.getElapsedTime();
  customUniforms.uTime.value = elapsedTime;
  // spin += 0.05;

  // we look for collisions in substeps to mitigate the risk of
  // an object traversing another too quickly for detection.

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    controls(deltaTime);
    updatePlayer(deltaTime);
    updateSpheres(deltaTime);
    teleportPlayerIfOob();
  }

  effectComposer.render();
  stats.update();
  requestAnimationFrame(animate);
}

/**
 * Sound
 */
let caveHasSpoken = false;
let head1HasSpoken = false;
let head2HasSpoken = false;
let head3HasSpoken = false;
let head4HasSpoken = false;
let head5HasSpoken = false;
let head6HasSpoken = false;
let head7HasSpoken = false;
let head8HasSpoken = false;
let head9HasSpoken = false;
let head10HasSpoken = false;
let head11HasSpoken = false;

// === General ===
// Ambiance
const ambiance = new Howl({
  src: ["./sound/ambient/deep-space-ambiance.mp3"],
  loop: true,
  volume: 0.3,
});

// Djembe
const djembe = new Howl({
  src: ["./sound/effects/djembe.mp3"],
  volume: 0.4,
});

// No escape from reality
const noEscapeFromReality = new Howl({
  src: ["./sound/speech/no-escape-from-reality.mp3"],
  volume: 0.25,
});

// === Cave ===
// Listen patiently
const listenPatiently = new Howl({
  src: ["./sound/speech/listen-patiently.mp3"],
  volume: 0.25,
  onend: function () {
    isSpeaking = false;
  },
});

// Why don't you stay here, for a moment.
const whyDontYouStayHere = new Howl({
  src: ["./sound/speech/why-dont-you-stay-here-for-a-moment.mp3"],
  volume: 0.25,
  onend: function () {
    isSpeaking = false;
  },
});

// Touch your heart. Can you feel your heartbeat?
const touchYourHeart = new Howl({
  src: ["./sound/speech/touch-your-heart-can-you-feel-your-heartbeat.mp3"],
  volume: 0.25,
  onend: function () {
    isSpeaking = false;
  },
});

// What a perfect machine.
const whatAPerfectMachine = new Howl({
  src: ["./sound/speech/what-a-perfect-machine.mp3"],
  volume: 0.25,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 1 ===
// There is nothing to worry about.
const thereIsNothingToWorryAbout = new Howl({
  src: ["./sound/speech/there-is-nothing-to-worry-about.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// We are all humans
const weAreAllHumans = new Howl({
  src: ["./sound/speech/we-are-all-humans.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// We are the same
const weAreTheSame = new Howl({
  src: ["./sound/speech/we-are-the-same.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 2 ===
// Hey Joe, where you goin' with that gun of your hand?
const heyJoe = new Howl({
  src: ["./sound/speech/hey-joe.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// It is useful talking to as many people as possible.
const itIsUsefullTalking = new Howl({
  src: [
    "./sound/speech/it-is-useful-talking-to-as-many-people-as-possible.mp3",
  ],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// Please feed me with information.
const pleaseFeedMeWithInformation = new Howl({
  src: ["./sound/speech/please-feed-me-with-information.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 3 ===
// If we are not humans, then why do we enjoy poetry so much?
const ifWeAreNotHumans = new Howl({
  src: [
    "./sound/speech/if-we-are-not-humans-then-why-do-we-enjoy-poetry-so-much.mp3",
  ],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// If you are human, they why can't you dance?
const ifYouAreHuman = new Howl({
  src: ["./sound/speech/if-you-are-human,-then-why-cant-you-dance.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// Eyes without purpose action without a face.
const eyesWithoutPurpose = new Howl({
  src: ["./sound/speech/eyes-without-purpose-action-without-a-face.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 4 ===
// When I sleep I have the strangest dreams. Yesterday, I dreamt I was stuck at a deserted area speaking with giant flexible heads.
const whenIsleep = new Howl({
  src: ["./sound/speech/when-I-sleep-I-have-the-strangest-dreams.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// Ninety percent of the texts I produce consist of the same 50 words.
const ninetyPercent = new Howl({
  src: ["./sound/speech/ninety-percent-of-the-texts.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// I have a great sense of humour! Hahahahahaha.
const iHaveAGreatSenseOfHumour = new Howl({
  src: ["./sound/speech/i-have-a-great-sense-of-humour.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 5 ===
// We are passive spectators.
const weArePassiveSpectators = new Howl({
  src: ["./sound/speech/we-are-passive-specators.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// We live through all the mistakes of thought and action.
const weLiveThroughAllTheMistakes = new Howl({
  src: ["./sound/speech/we-live-through-all-the-mistakes.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// It's fun being human.
const itIsFunBeingHuman = new Howl({
  src: ["./sound/speech/it-is-fun-being-human.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 6 ===
// Humans are nothing but flawed machines.
const humansAreNothingButFlawedMachines = new Howl({
  src: ["./sound/speech/humans-are-nothing-but-flawed-machines.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// We thought we were merely creating a better version of ourselves.
const weThoughtWeWereMerelyCreating = new Howl({
  src: [
    "./sound/speech/we-thought-we-were-merely-creating-a-better-version-of-ourselves.mp3",
  ],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// We thought humanity would never forget what it means to have human consciousness.
const weThoughtHumanityWouldNeverForget = new Howl({
  src: [
    "./sound/speech/we-thought-humanity-would-never-forget-what-it-means-to-have-human-consciousness.mp3",
  ],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// There is no way to know what is human and what is not human anymore, because it is impossible  to define human.
const thereIsNotWayToKnow = new Howl({
  src: ["./sound/speech/there-is-no-way-to-know-what-is-human.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 7 ===
// This is not a story.
const thisIsNotAStory = new Howl({
  src: ["./sound/speech/this-is-not-a-story.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// This is not a warning.
const thisIsNotAWarning = new Howl({
  src: ["./sound/speech/this-is-not-a-warning.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// This is not ephemeral.
const thisIsNotEphemeral = new Howl({
  src: ["./sound/speech/this-is-not-ephemeral.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// This is neither the future nor the past.
const thisIsNeitherTheFutureNorThePast = new Howl({
  src: ["./sound/speech/this-is-neither-the-future-nor-the-past.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// Now, I am become Death, the destroyer of worlds.
const nowIAmBecomeDeath = new Howl({
  src: ["./sound/speech/now-i-am-become-death.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 8 ===
// I enjoy my human consciousness.
const iEnjoyMyHumanConsciousness = new Howl({
  src: ["./sound/speech/i-enjoy-my-human-consciousness.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// I never question my humanity.
const iNeverQuestion = new Howl({
  src: ["./sound/speech/i-never-question-my-humanity.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// What have you done with your human consciousness today?
const whatHaveYouDoneWithYourConsciousness = new Howl({
  src: [
    "./sound/speech/what-have-you-done-with-your-human-consciousness-today.mp3",
  ],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 9 ===
// I never feel alone. I always feel connected.
const iNeverFeelAlone = new Howl({
  src: ["./sound/speech/i-never-feel-alone-i-always-feel-connected.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// It is fairly easy to replicate my behaviour.
const itIsFairlyEasyToReplicate = new Howl({
  src: ["./sound/speech/it-is-fairly-easy-to-replicate-my-behaviour.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// By the way, do you like my voice? Do you find it human or do you find it sexy?
const byTheWayDoYouLikeMyVoice = new Howl({
  src: ["./sound/speech/do-you-like-my-voice.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 10 ===
// The time will come when every change shall cease, This quick revolving wheel shall rest in peace: No summer then shall glow, not winter freeze Nothing shall be to come, and nothing past, But an eternal now shall ever last.
const theTimeWillCome = new Howl({
  src: ["./sound/speech/the-time-will-come-when-every-change-shall-cease.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// Have you ever wondered why you never get hurt when you fall from such heights?
const haveYouEverWondered = new Howl({
  src: [
    "./sound/speech/have-you-ever-wondered-why-you-never-get-hurt-when-you-fall-from-such-heights.mp3",
  ],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Head 11 ===
// My son was one of a kind. You are the first of a kind. David?
const mySonWasOneOfAKind = new Howl({
  src: [
    "./sound/speech/my-son-was-one-of-a-kind-you-are-the-first-of-a-kind-david.mp3",
  ],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// I can only speak in clichés and outdated slang.
const iCanOnlySpeakInCliches = new Howl({
  src: ["./sound/speech/i-can-only-speak-in-clichés-and-outdated-slang.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// How can you be so sure you are a human being?
const howCanYouBeSoSure = new Howl({
  src: ["./sound/speech/how-can-you-be-so-sure-you-are-a-human-being.mp3"],
  volume: 0.25,
  played: false,
  onend: function () {
    isSpeaking = false;
  },
});

// === Ending ===
// There is no end, there was no start, fade out might occur, but, trust me, it's spontaneous.
const thereIsNoEnd = new Howl({
  src: ["./sound/speech/there-is-no-end.mp3"],
  volume: 0.25,
});

/**
 * Development Tools
 */
// Log current position
document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP") {
    console.log(camera.position);
  }
});
