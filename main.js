/*
	Initializes scene and player movement
*/
var renderer, scene, camera, meshCube, meshFloor;

var player = {height: 1.8};
var keyboard = {};	
// initialize scene
function main() {

	//Create and position the camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 10 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));

	scene = new THREE.Scene();

	// Instantiate the cube mesh
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshNormalMaterial();
	meshCube = new THREE.Mesh( geometry, material );
	scene.add( meshCube );

	// Instantiate the floor mesh
	const floorGeometry = new THREE.PlaneGeometry(10,10);
	const floorMaterial = new THREE.MeshBasicMaterial({color:0xffffff, wireframe: false})
	meshFloor = new THREE.Mesh( floorGeometry, floorMaterial );
	meshFloor.rotation.x -= Math.PI / 2;
	scene.add(meshFloor);

	// Instantiate the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	animate();

}

function animate() {
	requestAnimationFrame(animate);
	meshCube.rotation.x += 0.01;
	meshCube.rotation.y += 0.02;

	if (keyboard[37]) { // Left arrow key 
		camera.rotation.y -= Math.PI * 0.01;
	}

	if (keyboard[39]) { // Right arrow key 
		camera.rotation.y += Math.PI * 0.01;
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
