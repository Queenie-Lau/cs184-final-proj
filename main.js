/*
	Initializes scene and player movement
*/

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

// initialize scene
function main() {

	//Create and position the camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 30 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));

	scene = new THREE.Scene();
	addScenePrimitives();

	// Instantiate the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );

	// Add Shadow Map 
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	document.body.appendChild( renderer.domElement );

	animate();

}

// Instantiates all scene primitives
function addScenePrimitives() {
	initBoundaries();
	initObstacles();
	initLights();
	initFloor();

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
function initObstacles() {
	const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
	const cubeMaterial = new THREE.MeshPhongMaterial({color: red, wireframe: WIREFRAME});
	meshCube = new THREE.Mesh( cubeGeometry, cubeMaterial );
	meshCube.position.y += 1;
	meshCube.receiveShadow = true;
	meshCube.castShadow = true;
	scene.add( meshCube );


	initTree(-3, -6, 2.5, 6);
	initTree(5, 5, 1, 8);
	initTree(3, 3);
}

// Instantiates a tree at given coordinates and scale
function initTree(x = 0, z = 0, width = 1.5, height = 4) {
	var trunkRadius = width / 5; //Trunk should be 1/5 the width 
	var trunkHeight = height / 5; // Trunk should be 1/3 the height
	
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
function initBoundaries() {
	const boundaryMaterial = new THREE.MeshPhongMaterial({color: blue, wireframe: WIREFRAME});
	const boundaryGeometry = new THREE.BoxGeometry(platform.width + 1, 1.5, 1);
	const boundaryGeometryPerp = new THREE.BoxGeometry(1, 1.5, platform.height);
	const northBoundary = new THREE.Mesh( boundaryGeometry, boundaryMaterial );
	const southBoundary = new THREE.Mesh( boundaryGeometry, boundaryMaterial );
	const eastBoundary = new THREE.Mesh( boundaryGeometryPerp, boundaryMaterial );
	const westBoundary = new THREE.Mesh( boundaryGeometryPerp, boundaryMaterial );


	northBoundary.position.z = platform.height / 2; 
	southBoundary.position.z = -platform.height / 2; 
	westBoundary.position.x = platform.width / 2;
	eastBoundary.position.x = -platform.width / 2; 

	northBoundary.receiveShadow = true;
	southBoundary.receiveShadow = true;
	eastBoundary.receiveShadow = true;
	westBoundary.receiveShadow = true;

	northBoundary.castShadow = true;
	southBoundary.castShadow = true;
	eastBoundary.castShadow = true;
	westBoundary.castShadow = true;

	scene.add( northBoundary );
	scene.add( southBoundary );
	scene.add( eastBoundary );
	scene.add( westBoundary );
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
	if (keyboard[37]) { // Left arrow key 
		camera.rotation.y -= player.turnSpeed;
	}
	if (keyboard[39]) { // Right arrow key 
		camera.rotation.y += player.turnSpeed;
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
