import { initSphere } from "../main.js";

export function initSphere() {
	var geometry = new THREE.SphereGeometry( .2, 64, 16 );
	var material = new THREE.MeshPhongMaterial( { color: white } );
	var sphere = new THREE.Mesh( geometry, material );

	sphere.position.set(0, 3, 0);
	sphere.castShadow = true;
	sphere.receiveShadow = true;
	scene.add( sphere );
	let sphereBoundingBox = new THREE.Sphere(sphere.position, 1);
}