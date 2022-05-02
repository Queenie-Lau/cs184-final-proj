/*
	Initializes scene and player movement
*/
import * as THREE from './js/three.js';
import { OrbitControls } from './js/OrbitControls.js';

var renderer, scene, camera, meshCube; 

var player = {height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02};
var platform = {width: 20, height: 30};
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
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 30 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));


	scene = new THREE.Scene();
	addSceneObjects();

	// Instantiate the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );


	// Add Shadow Map 
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	document.body.appendChild( renderer.domElement );

	var controls = new OrbitControls( camera, renderer.domElement );
	animate();
}

// Instantiates all scene primitives
function addSceneObjects() {
	initBoundaries();
	initObjects();
	initLights();
	initFloor();
	scene.fog = new THREE.Fog(0xDFE9F3, -10, 50);
	scene.background = new THREE.Color("rgb(135, 206, 235)");
}

// Instantiate the floor mesh
function initFloor() {
	const floorGeometry = new THREE.PlaneGeometry( platform.width, platform.height );
	const floorMaterial = new THREE.MeshPhongMaterial( {color: white, wireframe: WIREFRAME} )
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
	const material = new THREE.MeshPhongMaterial({color: color, wireframe: WIREFRAME});
	const cube = new THREE.Mesh( geometry, material );
	cube.position.set(x, y, z);
	cube.receiveShadow = true;
	cube.castShadow = true;
	scene.add( cube );

}

// Instantiates a tree at given coordinates and scale
function initTree(x = 0, z = 0, width = 1.5, height = 4, scale = 5) {
	var trunkRadius = width / scale; //Trunk should be 1/scale the width 
	var trunkHeight = height / scale; // Trunk should be 1/scale the height
	
	const trunkGeometry = new THREE.CylinderGeometry( trunkRadius , trunkRadius, trunkHeight);
	const trunkMaterial = new THREE.MeshPhongMaterial({ color: brown, wireframe: WIREFRAME });
	const treeTrunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
	treeTrunk.position.set(x, trunkHeight / 2, z);
	treeTrunk.receiveShadow = true;
	treeTrunk.castShadow = true;
	const leafGeometry = new THREE.ConeGeometry(width, height);
	const leafMaterial = new THREE.MeshPhongMaterial({ color: green, wireframe: WIREFRAME });
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

// Initialize smoke colors
function initSmokeColors() {


}


function animate() {
	requestAnimationFrame(animate);
	meshCube.rotation.x += 0.01;
	meshCube.rotation.y += 0.02;

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
		camera.rotation.y -= player.turnSpeed;
	}
	if (keyboard[39]) { // Right arrow key 
		camera.rotation.y += player.turnSpeed;
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


window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
window.onload = main;
