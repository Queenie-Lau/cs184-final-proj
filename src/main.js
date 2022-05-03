/*
	Initializes scene and player movement
*/
import * as THREE from './js/three.js';
import { OrbitControls } from './js/OrbitControls.js';
import { GLTFLoader } from './js/GLTFLoader.js';

var renderer, scene, camera, meshCube, skybox, skyboxGeo, floorTexture, pipeTexture; 

var player = {height: 1.8, speed: 0.3, turnSpeed: Math.PI * 0.02};
var platform = {width: 50, height: 50};
var keyboard = {};	

var WIREFRAME = false;

var white = 0xffffff;
var red = 0xff4444;
var blue = 0x039dfc;
var brown = 0x964B00;
var green = 0x42692f;
var purple = 0x6a0dad;

// initialize scene
function main() {
	//Create and position the camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 30000 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));

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

	var controls = new OrbitControls( camera, renderer.domElement );
	controls.addEventListener('change', renderer);
	animate();
}

// Instantiates all scene primitives
function addSceneObjects() {
	initBoundaries();
	initObjects();
	initLights();
	texturizeFloor();
	initFloor();
	initCylinder();
	intGoombaEnemies();
	initSkyBox();
	scene.fog = new THREE.Fog(0xDFE9F3, -40, 100);
	scene.background = new THREE.Color("rgb(135, 206, 235)");
}

// Instantiate the floor mesh
function initFloor() {
	const floorGeometry = new THREE.PlaneGeometry( platform.width, platform.height, 20);
	//const floorMaterial = new THREE.MeshPhongMaterial( {color: white, wireframe: WIREFRAME} )
	const floorMaterial = new THREE.MeshPhongMaterial({map : floorTexture})
	const meshFloor = new THREE.Mesh( floorGeometry, floorMaterial );
	meshFloor.rotation.x -= Math.PI / 2;
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);
}

// Instantiate player obstacles
function initObjects() {
	initSpinningCube(2, 8);
	initTree(-3, -6, 2.5, 6);
	initTree(5, 5, 1, 8);
	initTree(3, 3);
	initTree(-4, 8);
	initTree(8, 8);
	initTree(-6, 9, 1.5, 4, 7);
	initTree(-7.5, -7.5, 2, 6, 7);

	initCube(6, .5, -4, 3, 5, 1);
	initCube(4, 5, -10, 5, 10, 1, purple);
	initCube(-4, 1, 0, 2, 2, 2, purple);
}

function initCylinder() {
	const geometry =  new THREE.CylinderGeometry( 1, 1, 5, 32, 1, false )

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/pipe.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;
	pipeTexture.repeat.set( 4, 4 );	

	const pipeMaterial = new THREE.MeshPhongMaterial( {map : pipeTexture} );
	const cylinder = new THREE.Mesh( geometry, pipeMaterial );
	cylinder.position.set(0, 0, 0);
	cylinder.castShadow = true;
	cylinder.receiveShadow = true;
	scene.add( cylinder );
}

function initSkyBox() {
	const materialTextures = [];
	const front = new THREE.TextureLoader().load("assets/mario_assets/water.png");
	const back = new THREE.TextureLoader().load("assets/mario_assets/water.png");
	const up = new THREE.TextureLoader().load("assets/mario_assets/water.png");
	const down = new THREE.TextureLoader().load("assets/mario_assets/water.png");
	const right = new THREE.TextureLoader().load("assets/mario_assets/water.png");
	const left = new THREE.TextureLoader().load("assets/mario_assets/water.png");

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

function initSpinningCube(x = 0, z = 0) {
	const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
	const cubeMaterial = new THREE.MeshPhongMaterial({color: red, wireframe: WIREFRAME});
	meshCube = new THREE.Mesh( cubeGeometry, cubeMaterial );
	meshCube.position.set(x, 1, z);
	meshCube.receiveShadow = true;
	meshCube.castShadow = true;
	scene.add( meshCube );
}

function initCube(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1, color = red) {
	const geometry = new THREE.BoxGeometry(width, height, depth);

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/iwaa32.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;
	pipeTexture.repeat.set( 4, 4 );	

	const wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})
	const cube = new THREE.Mesh( geometry, wallMaterial );
	cube.position.set(x, y, z);
	cube.receiveShadow = true;
	cube.castShadow = true;

	scene.add( cube );
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
	const ambientLight = new THREE.AmbientLight(white, 0.3);
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
	initCube(0, 0, platform.height / 2, platform.width + 1, 1.5, 1, color);
	initCube(0, 0, -platform.height / 2, platform.width + 1, 1.5, 1, color);
	initCube(platform.width / 2, 0, 0, 1, 1.5, platform.height, color);
	initCube(-platform.width / 2, 0, 0, 1, 1.5, platform.height, color);
}

function animate() {
	requestAnimationFrame(animate);
	// meshCube.rotation.x += 0.01;
	// meshCube.rotation.y += 0.02;

	// MOVEMENT 
	if (keyboard[87]) { // W key
		camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
		camera.position.z += Math.cos(camera.rotation.y) * player.speed;
	}
	if (keyboard[83]) { // S key
		camera.position.x += Math.sin(camera.rotation.y) * player.speed;
		camera.position.z -= Math.cos(camera.rotation.y) * player.speed;
	}
	if(keyboard[65]){ // A key
		camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
		camera.position.z -= Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
	}
	if(keyboard[68]){ // D key
		camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
		camera.position.z -= Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
	}
	// TURNING
	if (keyboard[37]) { // Left arrow key 
		camera.rotation.y += player.turnSpeed;
	}
	if (keyboard[39]) { // Right arrow key 
		camera.rotation.y -= player.turnSpeed;
	}
	if (keyboard[38]) { // Up arrow key
		camera.rotation.x -= player.turnSpeed;
	}
	if (keyboard[40]) { // Down arrow key 
		camera.rotation.x += player.turnSpeed;
	}

	renderer.render( scene, camera );
}

function keyDown(event) {
	keyboard[event.keyCode] = true;
}

function keyUp(event) {
	keyboard[event.keyCode] = false;
}


/**
 * TODO: Put goomba animation in another file
 * 
 */

// Instantiate a loader
const loader = new GLTFLoader();

// Load a glTF goomba enemey
function intGoombaEnemies() {
	loader.load(
		// resource URL
		'assets/goomba/scene.gltf',
		// called when the resource is loaded
		function ( gltf ) {
			gltf.scene.scale.set(0.005, 0.005, 0.005); 
			gltf.scene.position.set(-5, 1, 4);
			gltf.scene.traverse( function( node ) {
				if ( node.isMesh ) {
					node.castShadow = true;
				}
			} );
			scene.add( gltf.scene );
	
			gltf.animations; // Array<THREE.AnimationClip>
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

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
window.onload = main;
