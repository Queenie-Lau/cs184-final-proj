/*
	Initializes scene and player movement
*/
import * as THREE from './js/three.js';
import { GLTFLoader } from './js/GLTFLoader.js';
import { Movement} from './js/movement/FirstPersonMovement.js';

var renderer, scene, camera, movement, skybox, skyboxGeo, floorTexture, pipeTexture, clock, mixer, coinsGroup; 

var player = {height: 1.8, speed: 0.3, turnSpeed: Math.PI * 0.02};
var platform = {width: 50, height: 50};
//var velocity = new THREE.Vector3();

clock = new THREE.Clock();
//var prevTime = performance.now();

var WIREFRAME = false;

var white = 0xffffff;
var blue = 0x039dfc;
var brown = 0x964B00;

// initialize scene
function main() {
	//Create and position the camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 30000 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));
	coinsGroup = new THREE.Group();

	scene = new THREE.Scene();

	// Instantiate the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );

	// Add scene objects
	addSceneObjects();

	// Add Shadow Map 
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	document.body.appendChild( renderer.domElement );

	//controls = new OrbitControls( camera, renderer.domElement );
	movement = new Movement( camera, renderer.domElement ); 
	animate();
}

// Instantiates all scene primitives
function addSceneObjects() {
	initBoundaries();
	initObjects();
	initLights();
	texturizeFloor();
	initFloor();
	initCylinderPipes();
	initPlayerGun();
	initGoombaEnemies();
	initSkyBox();
	scene.fog = new THREE.Fog(0xDFE9F3, -40, 100);
	scene.background = new THREE.Color("rgb(135, 206, 235)");
	scene.add( coinsGroup );
}

// Instantiate the floor mesh
function initFloor() {
	const floorGeometry = new THREE.PlaneGeometry( platform.width, platform.height, 20);
	//const floorMaterial = new THREE.MeshPhongMaterial( {color: white, wireframe: WIREFRAME} )
	const floorMaterial = new THREE.MeshPhongMaterial({map : floorTexture})
	const meshFloor = new THREE.Mesh( floorGeometry, floorMaterial );

	// const displacementMap = new THREE.TextureLoader().load(
	// 	'assets/mario_assets/grass_displacement.jpg'
	// )
	// floorMaterial.displacementMap = displacementMap

	meshFloor.rotation.x -= Math.PI / 2;
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);
}

// Instantiate player obstacles
function initObjects() {
	initTree(-3, -6, 2.5, 6);
	initTree(5, 5, 1, 8);
	initTree(3, 3);
	initTree(-4, 8);
	initTree(8, 8);
	initTree(-6, 9, 1.5, 4, 7);
	initTree(-7.5, -7.5, 2, 6, 7);
	initCapsuleTree(.5, .5, -9, 0.4, 1);
	initCapsuleTree(1, 1, 7, 0.4, 1);

	initBricks(6, .5, -4, .7, .7, .7, brown);
	initBricks(4, 5, -10, .7, .7, .7, brown);
	initBricks(-4, 1, 0, .7, .7, .7, brown);

	initPowerUpBox(4, 3, 5, .7, .7, .7);
	initPowerUpBox(10, 3, 5, .7, .7, .7);
	initPowerUpBox(-4, 3, 5, .7, .7, .7);
	
	initCoin(-18, 2, 0, .3, .3, .1, 32, 1, false);
	initCoin(-5, 2, 4, .3, .3, .1, 32, 1, false);
	initCoin(3, 2, 4, .3, .3, .1, 32, 1, false);
	addCoinsRandomly(); // DO COLLISION CHECKS
	initSceneDecor(-10, 15);
	// addDecorRandomly(); // DO COLLISION CHECKS, takes up a lot of mem.

	initSphere(); // Player will be shooting tennis? balls
}

function initSphere() {
	const sphere = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshPhongMaterial( { color: 0xff5191 }));
	sphere.position.set(-10, 10, 0);
	sphere.castShadow = true;
	sphere.receiveShadow = true;

	let sphereBoundingBox = new THREE.Sphere(sphere.position, 1);
}

function initCoin(x = 0, y = 0, z = 0, radiusTop = 1, radiusBottom = 1, height = 5, radialSegments = 32, heightSegments = 1, openEnded = false) {
	const geometry =  new THREE.CylinderGeometry( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded )

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/coin_test.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;

	const pipeMaterial = new THREE.MeshPhongMaterial( {map : pipeTexture} );
	const cylinder = new THREE.Mesh( geometry, pipeMaterial );
	cylinder.position.set(x, y, z);
	cylinder.rotateX(-80.1);
	cylinder.castShadow = true;
	cylinder.receiveShadow = true;
	coinsGroup.add(cylinder);
	// scene.add( cylinder );
}

function initCylinderPipes(x = 0, y = 0, z = 0, radiusTop = 1, radiusBottom = 1, height = 5, radialSegments = 32, heightSegments = 1, openEnded = false) {
	const geometry =  new THREE.CylinderGeometry( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded )

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/pipe.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;
	pipeTexture.repeat.set( 4, 4 );	

	const pipeMaterial = new THREE.MeshPhongMaterial( {map : pipeTexture} );
	const pipeColor =  new THREE.MeshPhongMaterial({color: 0x2CB01A, wireframe: WIREFRAME});
	const cylinder = new THREE.Mesh( geometry, pipeColor );
	cylinder.position.set(x, y, z);
	cylinder.castShadow = true;
	cylinder.receiveShadow = true;

	let cylinderBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
	cylinderBoundingBox.setFromObject(cylinder);

	scene.add( cylinder );
	initTorusForPipe(x, y, z)
}

function initTorusForPipe(x = 0, y = 0, z = 0, radius = 1, tube = .2, radialSegments = 32, tubularSegments = 100) {
	const geometry = new THREE.TorusGeometry( radius, tube, radialSegments, tubularSegments );
	const material = new THREE.MeshPhongMaterial( { color: 0x2CB01A } );
	const torus = new THREE.Mesh( geometry, material );
	torus.position.set(x, y+2.5, z);
	torus.castShadow = true;
	torus.receiveShadow = true;
	torus.rotateX(89.5);
	scene.add( torus );
}

function initSkyBox() {
	const materialTextures = [];
	const front = new THREE.TextureLoader().load("assets/mario_assets/water.png");
	const back = new THREE.TextureLoader().load("assets/mario_assets/sky_no_sun.png");
	const up = new THREE.TextureLoader().load("assets/mario_assets/sky_top.png");
	const down = new THREE.TextureLoader().load("assets/mario_assets/water_bottom.png");
	const right = new THREE.TextureLoader().load("assets/mario_assets/sky_no_sun.png");
	const left = new THREE.TextureLoader().load("assets/mario_assets/sky_no_sun.png");

	materialTextures.push(new THREE.MeshBasicMaterial({ map: front }));
	materialTextures.push(new THREE.MeshBasicMaterial({ map: back }));
	materialTextures.push(new THREE.MeshBasicMaterial({ map: up }));
	materialTextures.push(new THREE.MeshBasicMaterial({ map: down }));
	materialTextures.push(new THREE.MeshBasicMaterial({ map: right }));
	materialTextures.push(new THREE.MeshBasicMaterial({ map: left }));

	for (let i = 0; i < 6; i++) {
		materialTextures[i].side = THREE.BackSide;
	}

	skyboxGeo = new THREE.BoxGeometry(100, 100, 100);
	skybox = new THREE.Mesh(skyboxGeo, materialTextures);
	scene.add(skybox);
}

function initBricks(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1) {
	const geometry = new THREE.BoxGeometry(width, height, depth);

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/brick.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;
	pipeTexture.repeat.set( 4, 4 );	

	const wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})
	const cube = new THREE.Mesh( geometry, wallMaterial );
	cube.position.set(x, y, z);
	cube.receiveShadow = true;
	cube.castShadow = true;

	let cubeBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
	cubeBoundingBox.setFromObject(cube);
	
	scene.add( cube );

	return cube;
}

function initPowerUpBox(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1) {
	const geometry = new THREE.BoxGeometry(width, height, depth);

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/question_box.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;

	const wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})
	const cube = new THREE.Mesh( geometry, wallMaterial );
	cube.position.set(x, y, z);
	cube.receiveShadow = true;
	cube.castShadow = true;
	
	scene.add( cube );
}

function initCapsuleTree(radius = .1, length = .1, x = 0, y = 0, z = 0) {
	const treeLeafTexture = new THREE.TextureLoader().load( "assets/mario_assets/tree_leaf.png" );
	treeLeafTexture.wrapS = THREE.RepeatWrapping;
	treeLeafTexture.wrapT = THREE.RepeatWrapping;
	treeLeafTexture.repeat.set( 4, 4 );	

	const leafGeometry = new THREE.CapsuleGeometry(radius, length, 32, 32);
	const leafMaterial = new THREE.MeshPhongMaterial({ map: treeLeafTexture });
	const treeLeaves = new THREE.Mesh(leafGeometry, leafMaterial);
	treeLeaves.position.set(x, y, z);
	treeLeaves.receiveShadow = true;
	treeLeaves.castShadow = true;
	scene.add(treeLeaves);
}

// Instantiates a tree at given coordinates and scale
function initTree(x = 0, z = 0, width = 1.5, height = 4, scale = 5) {
	var trunkRadius = width / scale; //Trunk should be 1/scale the width 
	var trunkHeight = height / scale; // Trunk should be 1/scale the height

	const treeBarkTexture = new THREE.TextureLoader().load( "assets/mario_assets/tree_xx01_Bark01_dif.png" );
	treeBarkTexture.wrapS = THREE.RepeatWrapping;
	treeBarkTexture.wrapT = THREE.RepeatWrapping;
	treeBarkTexture.repeat.set( 4, 4 );	

	const treeLeafTexture = new THREE.TextureLoader().load( "assets/mario_assets/tree_leaf.png" );
	treeLeafTexture.wrapS = THREE.RepeatWrapping;
	treeLeafTexture.wrapT = THREE.RepeatWrapping;
	treeLeafTexture.repeat.set( 4, 4 );	

	
	const trunkGeometry = new THREE.CylinderGeometry( trunkRadius , trunkRadius, trunkHeight);
	const trunkMaterial = new THREE.MeshPhongMaterial({ map: treeBarkTexture, overdraw: 0.1 });
	const treeTrunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
	treeTrunk.position.set(x, trunkHeight / 2, z);
	treeTrunk.receiveShadow = true;
	treeTrunk.castShadow = true;
	const leafGeometry = new THREE.ConeGeometry(width, height);
	const leafMaterial = new THREE.MeshPhongMaterial({ map: treeLeafTexture });
	const treeLeaves = new THREE.Mesh(leafGeometry, leafMaterial);
	treeLeaves.position.set(x, trunkHeight + height / 2, z);
	treeLeaves.receiveShadow = true;
	treeLeaves.castShadow = true;
	scene.add(treeLeaves);
	scene.add(treeTrunk);
}

// Instantiate scene lights
function initLights() {
	const ambientLight = new THREE.AmbientLight(white, 0.5);
	const pointLight = new THREE.PointLight(white, 0.8, 18);
	
	pointLight.position.set(-3, 6, -3);
	pointLight.castShadow = true;
	pointLight.shadow.camera.near = 0.1;
	pointLight.shadow.camera.far = 25;

	scene.add(pointLight);
	scene.add(ambientLight);
}

// Instantiate boundaries
function initBoundaries(color = blue) {
	initBricks(0, 0, platform.height / 2, platform.width + 1, 1.5, 1, color);
	initBricks(0, 0, -platform.height / 2, platform.width + 1, 1.5, 1, color);
	initBricks(platform.width / 2, 0, 0, 1, 1.5, platform.height, color);
	initBricks(-platform.width / 2, 0, 0, 1, 1.5, platform.height, color);
}

function checkCollisions(cube) {
	// TO DO
}

function addCoinsRandomly() {
	for (let i = 0; i < 50; i++) {
		var ranX = Math.floor(Math.random() * platform.width - 10) + -5;
		var ranZ = Math.floor(Math.random() * platform.width - 10) - 5;
		initCoin(ranX, 2, ranZ, .3, .3, .1, 32, 1, false);
	}
}

function addDecorRandomly() {
	for (let i = 0; i < 20; i++) {
		var ranX = Math.floor(Math.random() * platform.width - 10) + -5;
		var ranZ = Math.floor(Math.random() * platform.width - 10) - 5;
		initSceneDecor(ranX, ranZ);
	}
}

function initPlayerGun() {
	loader.load(
		// resource URL
		'assets/toy_gun/scene.gltf',
		function ( gltf ) {
			gltf.scene.scale.set(.2, .2, .2); 
			gltf.scene.position.set(camera.position.x, camera.position.y, camera.position.z);
			gltf.scene.traverse( function( node ) {
				if ( node.isMesh ) {
					node.castShadow = true;
				}
			} );
			gltf.scene.rotateX(-90);		
			scene.add( gltf.scene );
	});
}

function animate() {
	requestAnimationFrame(animate);
	movement.update();

	/*const time = performance.now();
	const time_step_diff = ( time - prevTime ) / 1000;
	velocity.x -= velocity.x * 10.0 * time_step_diff;
	velocity.z -= velocity.z * 10.0 * time_step_diff;
	velocity.y -= 9.8 * 100.0 * time_step_diff; // 100.0 = mass

	*/
	coinsGroup.children.forEach(child => {
		child.rotateZ(-0.1);
	});

	renderer.render( scene, camera );
	var delta = clock.getDelta();
	if ( mixer ) mixer.update( delta );
}

// Instantiate a loader
const loader = new GLTFLoader();

// Load a glTF goomba enemey
function initGoombaEnemies() {
	loader.load(
		// resource URL
		'assets/animated_goomba/animated_goomba.gltf',
		// called when the resource is loaded
		function ( gltf ) {
			gltf.scene.scale.set(0.02, 0.02, 0.02); 
			gltf.scene.position.set(-5, 0.1, 4);
			gltf.scene.traverse( function( node ) {
				if ( node.isMesh ) {
					node.castShadow = true;
				}
			} );
			
			mixer = new THREE.AnimationMixer(gltf.scene);
    		var action = mixer.clipAction( gltf.animations[ 0 ] );
			action.play();
			
			scene.add( gltf.scene );

			gltf.scene; // THREE.Group
			gltf.scenes; // Array<THREE.Group>
			gltf.cameras; // Array<THREE.Camera>
			gltf.asset; // Object
		},
		// called while loading is progressing
		function ( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		// called when loading has errors
		function ( error ) {
			console.log( 'An error happened' );
		}
	);
}

function texturizeFloor() {
	floorTexture = new THREE.TextureLoader().load( "assets/mario_assets/grass_a1.png" );
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set( 4, 4 );	
}

function initSceneDecor(x = 0, z = 0) {
	loader.load(
		// resource URL
		'assets/mario_bros_ice_flower/scene.gltf',
		function ( gltf ) {
			gltf.scene.scale.set(0.5, 0.5, 0.5); 
			gltf.scene.position.set(x + 3, 0.5, z);
			gltf.scene.traverse( function( node ) {
				if ( node.isMesh ) {
					node.castShadow = true;
				}
			} );		
			scene.add( gltf.scene );
	});

	// loader.load(
	// 	// resource URL
	// 	'assets/fire_flower_super_mario_bros/scene.gltf',
	// 	function ( gltf ) {
	// 		gltf.scene.scale.set(0.003, 0.003, 0.003); 
	// 		gltf.scene.position.set(x, 0.01, z);
	// 		gltf.scene.traverse( function( node ) {
	// 			if ( node.isMesh ) {
	// 				node.castShadow = true;
	// 			}
	// 		} );		
	// 		scene.add( gltf.scene );
	// });
}

window.onload = main;