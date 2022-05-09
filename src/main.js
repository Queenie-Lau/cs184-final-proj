/*
	Initializes scene and player movement
*/
import * as THREE from './js/three.js';
import { GLTFLoader } from './js/GLTFLoader.js';
import { Movement } from './js/movement/FirstPersonMovement.js';
import { SceneManager } from './js/SceneManager.js';

var renderer, scene, camera, movement, skybox, skyboxGeo, floorTexture, pipeTexture, clock, mixer, coinsGroup; 
var sceneManager;
var shotBallInsideScene;
var coinsGroup = new THREE.Group();
var coinCount = 0;
var goombaCount = 0;
var cbContactResult, cbContactPairResult;
var intersectedObject;
//const raycaster = new THREE.Raycaster();
//const pointer = new THREE.Vector2();

//var velocity = new THREE.Vector3();

clock = new THREE.Clock();

// Object breaking variables 
const impactPoint = new THREE.Vector3();
//const convexBreaker = new ConvexObjectBreaker();
const impactNormal = new THREE.Vector3();

var WIREFRAME = false;

var white = 0xffffff;
var blue = 0x039dfc;
var brown = 0x964B00;
var gray = 0xa9a9a9;

// initialize scene
function main() {
	

	//movement = new Movement( camera, renderer.domElement ); 
}

init();
function init() {
	let sceneManager = new SceneManager( );
}

// Init Scene, Camera, Lighting, Renderer


/*function animate() {
		movement.update();

        coinsGroup.children.forEach(child => {
            child.rotateZ(-0.1);
        });

        requestAnimationFrame(render);
        var delta = clock.getDelta();
        if ( mixer ) mixer.update( delta );

}
function animate() {
	requestAnimationFrame(animate);
	movement.update();

	coinsGroup.children.forEach(child => {
		child.rotateZ(-0.1);
	});

	renderer.render( scene, camera );
	var delta = clock.getDelta();
	if ( mixer ) mixer.update( delta );

}*/


// Instantiates all scene primitives
function addSceneObjects() {
	initBoundaries();
	initObjects();
	texturizeFloor();
	initFloor();
	initIsland();
	//initPlayerGun();
	initGoombaEnemies(-5, 0.1, 4);
	initSkyBox();
	scene.fog = new THREE.Fog(0xDFE9F3, -40, 100);
	scene.background = new THREE.Color("rgb(135, 206, 235)");
	scene.add( coinsGroup );
	// updateCounter(2, 2, "goomba"); // testing
	// updateCounter(3, 4, "coin");
}

function initMusic() {
	// create an AudioListener and add it to the camera
	const listener = new THREE.AudioListener();
	camera.add( listener );

	// create a global audio source
	const sound = new THREE.Audio( listener );

	// load a sound and set it as the Audio object's buffer
	const audioLoader = new THREE.AudioLoader();
	
	// Src: https://www.youtube.com/watch?v=tAaGKo4XVvM
	audioLoader.load( 'music/overworld_theme.ogg', function( buffer ) {
		sound.setBuffer( buffer );
		sound.setLoop( true );
		sound.setVolume( 0.5 );
		sound.play();
	});
}

// Instantiate the floor mesh
function initFloor() {
	var scale = new THREE.Vector3(platform.width, platform.height, 1);
	var position = new THREE.Vector3(0,0,0);
	var mass = 0;
	var quat = {x: -Math.PI / 2, y: 0, z: 0, w: 1};
	const floorMaterial = new THREE.MeshPhongMaterial({map : floorTexture})
	var scale = new THREE.Vector3(platform.width, 1,  platform.height);
	var position = new THREE.Vector3(0,-0.5,0);
	var quat = {x: 0, y: 0, z: 0, w: 1};	
	rigidBody_List.push(sceneManager.initCube(position, scale, mass, floorMaterial, quat));
}

function initIsland() {
	const geometry = new THREE.BoxGeometry( platform.width, 10, platform.height );
	const islandTexture = new THREE.TextureLoader().load( "assets/mario_assets/island_side.png" );
	islandTexture.wrapS = THREE.RepeatWrapping;
	islandTexture.wrapT = THREE.RepeatWrapping;

	const wallMaterial = new THREE.MeshPhongMaterial({map : islandTexture})
	const cube = new THREE.Mesh( geometry, wallMaterial );
	cube.position.set(0, -5.2, 0);

	scene.add( cube );	
}

// Instantiate player obstacles
function initObjects() {
	initTree(-13, -6, 2.5, 6);
   	initTree(5, 5, 1, 8);
   	initTree(3, 3);
   	initTree(-6, 9, 1.5, 4, 7);
   	initTree(-7.5, -7.5, 2, 6, 7);
   	initTree(10, 1);
   	initTree(14, 14);
   	initTree(10, -10);

	initCapsuleTree(.5, .5, -9, 0.4, 1);
	initCapsuleTree(1, 1, 7, 0.4, 1);
	initCapsuleTree(.1, .1, 30, 30, 30);

	initBricks(3.7, 4, 10, .7, .7, .7, brown);
   	initBricks(4.4, 4, 10, .7, .7, .7, brown);
   	initBricks(5.1, 4, 10, .7, .7, .7, brown);
   	initBricks(6, .5, -4, .7, .7, .7, brown);
   	initBricks(4, 5, -10, .7, .7, .7, brown);
   	initBricks(-4, 1, 0, .7, .7, .7, brown);

	initPowerUpBox(14, 3, 5, .7, .7, .7);
   	initPowerUpBox(10, 3, 5, .7, .7, .7);
   	initPowerUpBox(-14, 3, 5, .7, .7, .7);
   	initPowerUpBox(3, 4, 10, .7, .7, .7);
	
	initCoin(-18, 5, 0, .3, .3, .1, 32, 1, false);
	initCoin(-5, 5, 4, .3, .3, .1, 32, 1, false);
	initCoin(3, 5, 4, .3, .3, .1, 32, 1, false);
	initCoin(1, 2, 15, .3, .3, .1, 32, 1, false);
	initCoin(1.6, 4, 10, .3, .3, .1, 32, 1, false);
	initCoin(1, 4, 10, .3, .3, .1, 32, 1, false);
	initCoin(.4, 4, 10, .3, .3, .1, 32, 1, false);
	initCoin(.7, -4, 10, .3, .3, .1, 32, 1, false);

	initCoin(1.6, 4, -3, .3, .3, .1, 32, 1, false);
	initCoin(1, 4, -3, .3, .3, .1, 32, 1, false);
	initCoin(.4, 4, -3, .3, .3, .1, 32, 1, false);

	initCylinderPipes(-8, 0, 5);
	initCylinderPipes(1, 1, 10, 1, 1, 3, 32, 1, false);

	//addCoinsRandomly(); // DO COLLISION CHECKS
	initFlower(6, 6);
 	initFlower(-13, 1);
	// addDecorRandomly(); // DO COLLISION CHECKS, takes up a lot of mem.
	initTetrahedron(0, 0, 0);
	// initSphere(); // Player will be shooting white balls
}

function initTetrahedron(x = 0, y = 0, z = 0) {
	const radius = 6;
	const tetra = new THREE.TetrahedronGeometry(radius, 0);
	tetra.receiveShadow = true;
	tetra.castShadow = true;
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

	// Bounding box 
	let coinBB = new THREE.Sphere(cylinder.position, radiusTop);
	//cylinder.name = id.coin; 
	cylinder.name = "coin";
	coinsGroup.add(cylinder);
	// scene.add( cylinder );
}

function initCylinderPipes(x = 0, y = 0, z = 0, radiusTop = 1, radiusBottom = 1, height = 3, radialSegments = 32, heightSegments = 1, openEnded = false) {
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

	//cylinder.name = id.pipe;
	scene.add( cylinder );
	initTorusForPipe(x, y, z)
}

function initTorusForPipe(x = 0, y = 0, z = 0, radius = 1, tube = .2, radialSegments = 32, tubularSegments = 100) {
	const geometry = new THREE.TorusGeometry( radius, tube, radialSegments, tubularSegments );
	const material = new THREE.MeshPhongMaterial( { color: 0x2CB01A } );
	const torus = new THREE.Mesh( geometry, material );
	torus.position.set(x, y + 1.5, z);
	torus.castShadow = true;
	torus.receiveShadow = true;
	torus.rotateX(89.5);
	//torus.name = id.pipe;
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

function initBricks(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1, color) {
	const cube = new THREE.BoxGeometry(width, height, depth);

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/brick.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;

	var wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})
	if (color == white) {
		wallMaterial = new THREE.MeshPhongMaterial( { color: white } );
	}

	var position = new THREE.Vector3(x, y, z);
	var scale = new THREE.Vector3(width, height, depth);
	var mass = 3;

	var cube_to_add = sceneManager.initCube(position, scale, mass, wallMaterial);
	cube.userData.tag = "cube"; // not setting correctly..?
	rigidBody_List.push( cube_to_add );

	/*
	const cube = new THREE.Mesh( geometry, wallMaterial );
	cube.position.set(x, y, z);
	cube.receiveShadow = true;
	cube.castShadow = true;

	let cubeBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
	cubeBoundingBox.setFromObject(cube);
	
	//cube.name = id.regularBox;
	scene.add( cube );


	return cube;*/
}

function initPowerUpBox(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1) {
	const geometry = new THREE.BoxGeometry(width, height, depth);

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/question_box.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;

	const wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})

	var position = new THREE.Vector3(x, y, z);
	var scale = new THREE.Vector3(width, height, depth);
	var mass = 0;
	rigidBody_List.push( sceneManager.initCube(position, scale, mass, wallMaterial) );
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
	//treeLeaves.name = id.tree;
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
	const trunkMaterial = new THREE.MeshPhongMaterial({ map: treeBarkTexture });
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
	//treeLeaves.name = id.tree;
	//treeTrunk.name = id.tree;
	scene.add(treeLeaves);
	scene.add(treeTrunk);
}

// Instantiate scene lights
function initLights() {
	//const ambientLight = new THREE.AmbientLight(white, 0.01);
	
	//scene.add(ambientLight);
}

// Instantiate boundaries
function initBoundaries(color = white) {
	initBricks(0, 0, platform.height / 2, platform.width + 1, 1.5, 1, color);
	initBricks(0, 0, -platform.height / 2, platform.width + 1, 1.5, 1, color);
	initBricks(platform.width / 2, 0, 0, 1, 1.5, platform.height, color);
	initBricks(-platform.width / 2, 0, 0, 1, 1.5, platform.height, color);
}

function initContactResultCallback(){

	cbContactResult = new Ammo.ConcreteContactResultCallback();

	cbContactResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){

		let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );
		const distance = contactPoint.getDistance();

		if( distance > 0 ) return;

		let colWrapper0 = Ammo.wrapPointer( colObj0Wrap, Ammo.btCollisionObjectWrapper );
		let rb0 = Ammo.castObject( colWrapper0.getCollisionObject(), Ammo.btRigidBody );

		let colWrapper1 = Ammo.wrapPointer( colObj1Wrap, Ammo.btCollisionObjectWrapper );
		let rb1 = Ammo.castObject( colWrapper1.getCollisionObject(), Ammo.btRigidBody );

		let threeObject0 = rb0.threeObject;
		let threeObject1 = rb1.threeObject;
		let tag, localPos, worldPos;

		if ( threeObject0.userData.tag != "ball" ) {
			tag = threeObject0.userData.tag;
			localPos = contactPoint.get_m_localPointA();
			worldPos = contactPoint.get_m_positionWorldOnA();

		}
		else 
		{
			tag = threeObject1.userData.tag;
			localPos = contactPoint.get_m_localPointB();
			worldPos = contactPoint.get_m_positionWorldOnB();
		}

		let localPosition = {x: localPos.x(), y: localPos.y(), z: localPos.z()};
		let worldPosition = {x: worldPos.x(), y: worldPos.y(), z: worldPos.z()};

		console.log( { tag, localPosition, worldPosition } );

	}
}

function initContactPairResultCallback(){
	cbContactPairResult = new Ammo.ConcreteContactResultCallback();
	cbContactPairResult.hasContact = false;

	cbContactPairResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){
		let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );
		const distance = contactPoint.getDistance();
		if( distance > 0 ) return;
		this.hasContact = true;
	}
}

function checkForCollisions() {
	// tutorial src: 
	// https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef
	let dispatcher = physicsWorld.getDispatcher();
	let numManifolds = dispatcher.getNumManifolds();
	for ( let i = 0; i < numManifolds; i ++ ) {
		let contactManifold = dispatcher.getManifoldByIndexInternal( i );
		let numContacts = contactManifold.getNumContacts();

		for ( let j = 0; j < numContacts; j++ ) {
			let contactPoint = contactManifold.getContactPoint( j );

			let rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody );
			let rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody );

			// Get ball + colliding cube
			let cubeObject = rb0.threeObject; // not being recognized
			let ballObject = rb1.threeObject;

			if ( ! cubeObject && ! ballObject ) continue;
			let userData0 = cubeObject ? cubeObject.userData : null;
			let userData1 = ballObject ? ballObject.userData : null;
			let tag0 = userData0 ? userData0.tag : "none";
			let tag1 = userData1 ? userData1.tag : "none";

			let distance = contactPoint.getDistance();
			if( distance > 0.0 ) continue;

			let velocity0 = rb0.getLinearVelocity();
			let velocity1 = rb1.getLinearVelocity();
			let worldPos0 = contactPoint.get_m_positionWorldOnA();
			let worldPos1 = contactPoint.get_m_positionWorldOnB();
			let localPos0 = contactPoint.get_m_localPointA();
			let localPos1 = contactPoint.get_m_localPointB();


			// console.log({
			// 	manifoldIndex: i, 
			// 	contactIndex: j, 
			// 	distance: distance, 
			// 	object0:{
			// 	 tag: tag0,
			// 	 velocity: {x: velocity0.x(), y: velocity0.y(), z: velocity0.z()},
			// 	 worldPos: {x: worldPos0.x(), y: worldPos0.y(), z: worldPos0.z()},
			// 	 localPos: {x: localPos0.x(), y: localPos0.y(), z: localPos0.z()}
			// 	},
			// 	object1:{
			// 	 tag: tag1,
			// 	 velocity: {x: velocity1.x(), y: velocity1.y(), z: velocity1.z()},
			// 	 worldPos: {x: worldPos1.x(), y: worldPos1.y(), z: worldPos1.z()},
			// 	 localPos: {x: localPos1.x(), y: localPos1.y(), z: localPos1.z()}
			// 	}
			//    });
			// console.log(isBallTouchingAnotherObject(ballObject)) breaks.

			// Manually check distances for now and get object closest to target
			// check distances & get the object hit - either coin or block

			// var position = new THREE.Vector3();
			// position.getPositionFromMatrix( scene.matrixWorld );

			var intersectedObjectWorldPosition = intersectedObject.position;
			console.log("Intersected object position: ", intersectedObjectWorldPosition);
			console.log("World positions: ", worldPos1.x(), worldPos1.y(), worldPos1.z());
			// console.log(Math.ceil(worldPos1.x()), Math.ceil(worldPos1.y()), Math.ceil(worldPos1.z()));
			
			// set 0.3 threshold for now
			if ( (intersectedObjectWorldPosition.x - worldPos1.x()) <= 0.3 ) {
				if ( (intersectedObjectWorldPosition.y - worldPos1.y()) <= 0.3 ) {
					if ( (intersectedObjectWorldPosition.z - worldPos1.z()) <= 0.3 ) {
						console.log("Correctly hit an object!")
					}
				}
			}
		}
	}
}

function isBallTouchingAnotherObject(ball) {
	physicsWorld.contactTest( ball.userData.physicsBody , cbContactResult );
}


function addCoinsRandomly() {
	for (let i = 0; i < 50; i++) {
		var ranX = Math.floor(Math.random() * platform.width - 10) + -5;
		var ranZ = Math.floor(Math.random() * platform.width - 10) - 5;
		initCoin(ranX, 2, ranZ, .3, .3, .1, 32, 1, false);
	}
}

function addFlowersRandomly() {
	for (let i = 0; i < 20; i++) {
		var ranX = Math.floor(Math.random() * platform.width - 10) + -5;
		var ranZ = Math.floor(Math.random() * platform.width - 10) - 5;
		initFlower(ranX, ranZ);
	}
}

function initPlayerGun() {
	loader.load(
		// resource URL
		'assets/toy_gun/scene.gltf',
		function ( gltf ) {
			gltf.scene.scale.set(.05, .05, .05);
			gltf.scene.position.set(camera.position.x , camera.position.y , camera.position.z);
			
			// camera.position.normalize();
			// gltf.scene.position.set(normalizedPos.x, normalizedPos.y, normalizedPos.z);
			// gltf.scene.position.set( (camera.position.x - Math.sin(camera.rotation.y + Math.PI/6)) * 0.75, camera.position.y - 0.5 + Math.sin(20) * 0.01, camera.position.z + Math.cos(camera.rotation.y + Math.PI/6) * 0.75);

			gltf.scene.traverse( function( node ) {
				if ( node.isMesh ) {
					node.castShadow = true;
				}
			} );
			gltf.scene.rotateX(23);
			
			const box = new THREE.Box3().setFromObject(gltf.scene);
			const size = box.getSize(new THREE.Vector3()).length();
			const center = box.getCenter(new THREE.Vector3());

			// Testing
			console.log(center);
			console.log("Gun position: ", gltf.scene.position.normalize());
			console.log("Camera coordinates", camera.position.normalize());

			scene.add( gltf.scene );
	});
}

function updateCounter(currCoins, currGoomba, type) {
	if (type == 'coin') {
		var numCoins = currCoins + 1;
		coinCount = numCoins;
		document.getElementById("coin-text").innerText = numCoins;
		removeIntersectedCoinAnimation();
	}
	else {
		var numGoombas = currGoomba + 1;
		goombaCount = numGoombas;
		document.getElementById("goomba-text").innerText = numGoombas;
	}
}

function removeIntersectedCoinAnimation() {
	coinsGroup.remove(intersectedObject);
}



// Instantiate a loader
const loader = new GLTFLoader();

// Load a glTF goomba enemey
function initGoombaEnemies(x = 0, y = 0, z = 0) {
	loader.load(
		// resource URL
		'assets/animated_goomba/animated_goomba.gltf',
		// called when the resource is loaded
		function ( gltf ) {
			gltf.scene.scale.set(0.02, 0.02, 0.02); 
			gltf.scene.position.set(-5, 0.1, 4);
			gltf.scene.rotateY(90);
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

function initFlower(x = 0, z = 0) {
	loader.load(
		// resource URL
		'assets/mario_bros_ice_flower/scene.gltf',
		function ( gltf ) {
			gltf.scene.scale.set(0.5, 0.5, 0.5); 
			gltf.scene.position.set(x, 0.5, z);
			gltf.scene.rotateY(60);
			gltf.scene.traverse( function( node ) {
				if ( node.isMesh ) {
					node.castShadow = true;
				}
			} );		
			scene.add( gltf.scene );
	});
}



/*  SHOOTING CONTROLS */

function onMouseDown(event) {
	if ( shotBallInsideScene ) return;
	mouseCoords.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
	raycaster.setFromCamera(mouseCoords, camera);

	tmpPos.copy(raycaster.ray.direction);
	tmpPos.add(raycaster.ray.origin);

	let pos = {x:tmpPos.x, y:tmpPos.y, z:tmpPos.z};
	let radius = 0.25;
	let quat = {x:0, y:0, z:0, w:1};
	let mass = 1;

	var geometry = new THREE.SphereGeometry( .2, 64, 16 );
	var material = new THREE.MeshPhongMaterial( { color: white } );
	var ball = new THREE.Mesh( geometry, material );

	ball.position.set(pos.x, pos.y, pos.z);
	ball.userData.tag = "ball";
	scene.add(ball);
	
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
	transform.setRotation(new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w));
	let motionState = new Ammo.btDefaultMotionState(transform);

	let collisionShape = new Ammo.btSphereShape( radius );
	collisionShape.setMargin(0.05);

	let localInertia = new Ammo.btVector3(0,0,0);
	collisionShape.calculateLocalInertia(mass, localInertia);

	let rbInfo = new Ammo.btRigidBodyConstructionInfo(
		mass,
		motionState,
		collisionShape,
		localInertia
	);

	let rBody = new Ammo.btRigidBody(rbInfo);
	physicsWorld.addRigidBody( rBody);

	tmpPos.copy(raycaster.ray.direction);
	tmpPos.multiplyScalar(30);

	rBody.setLinearVelocity(new Ammo.btVector3(tmpPos.x, tmpPos.y, tmpPos.z));
	
	rBody.threeObject = ball;
	rBody.setFriction(4);
	rBody.setRollingFriction(10);

	ball.userData.physicsBody = rBody;
	rigidBody_List.push(ball);
	shotBallInsideScene = true;

	setTimeout(function(){
		shotBallInsideScene = false;
		physicsWorld.removeRigidBody(ball.userData.physicsBody);
		scene.remove(ball);
	}, 500);

	var intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
		console.log("HIT AN OBJECT!");
		console.log(intersects[ 0 ].object);
		console.log(intersects[ 0 ].object.name); // get name of object
		console.log("Object world position:", intersects[ 0 ].object.position); // get WORLD position
		intersectedObject = intersects[ 0 ].object;

		console.log("# Coins Hit", coinCount);

		if (intersectedObject.name == "coin") {
			updateCounter(coinCount, goombaCount, "coin");
		}

	}
}

function addEventHandlers() {
	window.addEventListener('mousedown', onMouseDown, false);
}

window.onload = main;
