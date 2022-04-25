/*
	Initializes scene and player movement
*/

// initialize scene
function main() {

	const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.z = 1;

	const scene = new THREE.Scene();

	const geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	const material = new THREE.MeshNormalMaterial();

	const mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	const renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.render( scene, camera );
	document.body.appendChild( renderer.domElement );

}

function playerMovement() {
	
}


window.onload = main;
