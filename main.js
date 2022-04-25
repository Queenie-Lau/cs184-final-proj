/*
	Initializes scene and player movement
*/

var renderer, scene, camera, meshCube, meshFloor;
var ambientLight, pointLight;

var player = {height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02};
var keyboard = {};	

var WIREFRAME = false;
// initialize scene
function main() {

	//Create and position the camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 10 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));

	scene = new THREE.Scene();

	// Instantiate the cube mesh
	const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
	const cubeMaterial = new THREE.MeshPhongMaterial({color: 0xff4444, wireframe: WIREFRAME});
	meshCube = new THREE.Mesh( cubeGeometry, cubeMaterial );
	meshCube.position.y += 1;
	meshCube.receiveShadow = true;
	meshCube.castShadow = true;
	scene.add( meshCube );

	// Instantiate the floor mesh
	const floorGeometry = new THREE.PlaneGeometry(10,10);
	const floorMaterial = new THREE.MeshPhongMaterial({color:0xffffff, wireframe: WIREFRAME})
	meshFloor = new THREE.Mesh( floorGeometry, floorMaterial );
	meshFloor.rotation.x -= Math.PI / 2;
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);

	// Instantiate scene lights
	ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
	pointLight = new THREE.PointLight(0xffffff, 0.8, 18);
	pointLight.position.set(-3, 6, -3);
	pointLight.castShadow = true;
	pointLight.shadow.camera.near = 0.1;
	pointLight.shadow.camera.far = 25;
	scene.add(pointLight);
	scene.add(ambientLight);

	// Instantiate the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );


	// Add Shadow Map to the renderer
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	document.body.appendChild( renderer.domElement );

	animate();

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
