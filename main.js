/*
	Initializes scene and player movement
*/
var renderer, scene, camera, mesh, meshFloor;

var player = {height: 1.8};
var keyboard = {};	
// initialize scene
function main() {

	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 10 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));
	//camera.position.z = 1;

	scene = new THREE.Scene();

	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	meshFloor = new THREE.Mesh(
		new THREE.PlaneGeometry(10,10), 
		new THREE.MeshBasicMaterial({color:0xffffff, wireframe: false})
		);
	meshFloor.rotation.x -= Math.PI / 2;
	scene.add(meshFloor);
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	animate();

}

function animate() {
	requestAnimationFrame(animate);
	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;

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
