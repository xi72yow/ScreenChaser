const BABYLON = require("babylonjs");
require("babylonjs-loaders");

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
    let pl = new BABYLON.PointLight("pl", scene);
    pl.diffuse = new BABYLON.Color3(0, 0, 0);
    pl.intensity = 0.07;
    let led = new BABYLON.MeshBuilder.CreateBox(
      "stripe-led",
      { height: 0.025, width: 0.05, depth: 0.05 },
      scene
    );

    let ledMat = new BABYLON.StandardMaterial("ledMat" + i);
    ledMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
    ledMat.str;
    led.material = ledMat;
    pl.position.x = 0 + 0.06 * i;
    pl.position.y = 1.5;

    led.position.x = 0 + 0.06 * i;
    led.position.y = 1.5;

    ledGlow.addIncludedOnlyMesh(led);
    stripe3D[i] = { led: led, pl: pl };
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
    height: 0.45,
    width: 0.8,
    sideOrientation: BABYLON.Mesh.DOUBLESIDE,
  };

  var ANote0Video = BABYLON.MeshBuilder.CreatePlane(
    "display_plane",
    screen,
    scene
  );

  var vidPos = new BABYLON.Vector3(0, 1.3, -0.7);
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

  BABYLON.SceneLoader.ImportMeshAsync(null, "./", "isometricRoom.gltf").then(
    (meshes) => {
      console.log(
        "🚀 ~ file: 3dpreview.js ~ line 96 ~ createScene ~ meshes",
        meshes
      );

      for (let i = 0; i < meshes.meshes.length; i++) {
        console.log("meshes[i].name");
      }
    }
  );

  /*   var light = new BABYLON.HemisphericLight(
    "HemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  ); */
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
