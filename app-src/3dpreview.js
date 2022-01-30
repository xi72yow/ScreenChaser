const BABYLON = require("babylonjs");

let stripe3D = new Array(120);

// Get the canvas DOM element
var canvas3D = document.getElementById("renderCanvas");
// Load the 3D engine
var engine = new BABYLON.Engine(canvas3D, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});
// CreateScene function that creates and return the scene
var createScene = function () {
  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  var ledGlow = new BABYLON.GlowLayer("ledGlow", scene, {
    mainTextureFixedSize: 256,
    blurKernelSize: 64,
  });

  for (let i = 0; i < 120; i++) {
    let led = new BABYLON.MeshBuilder.CreateBox(
      "stripe-led",
      { height: 0.25, width: 0.5, depth: 0.5 },
      scene
    );

    let ledMat = new BABYLON.StandardMaterial("ledMat" + i);
    ledMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    led.material = ledMat;
    led.position.x = -30 + 0.6 * i;
    led.position.y = -5;

    ledGlow.addIncludedOnlyMesh(led);

    stripe3D[i] = led;
  }

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.ArcRotateCamera(
    "arcR",
    -Math.PI / 2,
    Math.PI / 2,
    15,
    BABYLON.Vector3.Zero(),
    scene
  );

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  /*   var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene, false);
   */
  var screen = {
    height: 9,
    width: 16,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
  };

  var ANote0Video = BABYLON.MeshBuilder.CreatePlane(
    "display_plane",
    screen,
    scene
  );
  var vidPos = new BABYLON.Vector3(0, 0, 0.1);
  ANote0Video.position = vidPos;
  var ANote0VideoMat = new BABYLON.StandardMaterial("m", scene);
  var ANote0VideoVidTex = new BABYLON.VideoTexture(
    "vidtex",
    videoElement,
    scene
  );
  ANote0VideoMat.diffuseTexture = ANote0VideoVidTex;
  ANote0VideoMat.roughness = 1;
  ANote0VideoMat.emissiveColor = new BABYLON.Color3.White();
  ANote0Video.material = ANote0VideoMat;
  scene.onPointerObservable.add(function (evt) {
    if (evt.pickInfo.pickedMesh === ANote0Video) {
      //console.log("picked");
      if (ANote0VideoVidTex.video.paused) ANote0VideoVidTex.video.play();
      else ANote0VideoVidTex.video.pause();
      console.log(ANote0VideoVidTex.video.paused ? "paused" : "playing");
    }
  }, BABYLON.PointerEventTypes.POINTERPICK);

  //scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
  //console.log(ANote0Video);
  return scene;
};
// call the createScene function
var scene = createScene();
// run the render loop
engine.runRenderLoop(function () {
  scene.render();
});
// the canvas/window resize event handler
window.addEventListener("resize", function () {
  engine.resize();
});
