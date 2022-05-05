/*
	Initializes scene and player movement
*/
import * as THREE from './js/three.js';
import { GLTFLoader } from './js/GLTFLoader.js';
import { Movement } from './js/movement/FirstPersonMovement.js';
//import { Ammo } from './js/ammo.js';
//import * as AMMO from './js/ammo.js';


var renderer, scene, camera, movement, skybox, skyboxGeo, floorTexture, pipeTexture, clock, mixer, coinsGroup; 

var coinsGroup = new THREE.Group();
//const raycaster = new THREE.Raycaster();
//const pointer = new THREE.Vector2();

var player = {height: 1.8, speed: 0.3, turnSpeed: Math.PI * 0.02};
var platform = {width: 30, height: 30};
//var velocity = new THREE.Vector3();

clock = new THREE.Clock();

var WIREFRAME = false;
var spheresShot = [];

var white = 0xffffff;
var blue = 0x039dfc;
var brown = 0x964B00;

// initialize scene
function main() {
	

	//controls = new OrbitControls( camera, renderer.domElement );
	//movement = new Movement( camera, renderer.domElement ); 
	initMusic()
	animate();
}

//Declaring projectile-related variables
let physicsWorld;
let tmpTransformation = undefined;
let raycaster = new THREE.Raycaster();
let tmpPos = new THREE.Vector3();
let mouseCoords = new THREE.Vector2();
let rigidBody_List = new Array();

Ammo().then(start)
function start(){
	initPhysicsWorld();
	initGraphicsWorld();

	createGround();
	createGridCubes();
	createDropCube();

	addEventHandlers();

	render();
}


function initPhysicsWorld() {
	let collisionConfiguration = new Ammo.btDefaultCollisonConfiguration(),

		dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),

		overlappingPairCache = new Ammo.btDbvtBroadphase(),

		solver = new Ammo.btSequentialImpulseConstraintSolver();

	physicsWorld = new Ammo.btDiscreteDynamicWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}



// Init Scene, Camera, Lighting, Renderer
function initGraphicsWorld() {
	//Create and position the camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 30000 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));

	scene = new THREE.Scene();
	const raycaster = new THREE.Raycaster();

	initLights();

	// Instantiate the renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );

	// Add Shadow Map 
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	document.body.appendChild( renderer.domElement );

	renderer.outputEncoding = THREE.sRGBEncoding;

}

function onMouseDown(event) {
	mouseCoords.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
	raycaster.setFromCamera(mouseCoords, camera);

	tmpPos.copy(raycaster.ray.direction);
	tmpPos.add(raycaster.ray.origin);

	let pos = {x:tmpPos.x, y:tmpPos.y, z:tmpPos.z};
	let radius = 1;
	let quat = {x:0, y:0, z:0, w:1};
	let mass = 1;

	let ball = new THREE.Mesh(
		new THREE.SphereBufferGeometry(radius),
		new THREE.MeshToonMaterial({emissive: white, emissiveIntensity:0.8})
	);
	ball.position.set(pos.x, pos.y, pos.z);
	scene.add(ball);
	
	let transform = new Ammo.btTransform();
	transform.setIdentity();

	transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
	transform.setRotation(new Ammo.btQuaternion( 0, 0, 0, 1));
	let defaultMotionState = new Ammo.btDefaultMotionState(transform);

	let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
	structColShape.setMargin(0.05);

	let localIntertia = new Ammo.btVector3(0,0,0);
	structColShape.calculateLocalInertia(mass, localIntertia);

	let rbInfo = new Ammo.btRigidBodyConstructionInfo(
		mass,
		defaultMotionState,
		structColShape,
		localIntertia
	);
	let rBody = new Ammo.btRigidBody(rbInfo);
	physicsWorld.addRigidBody( rBody);

	tmpPos.copy(raycaster.ray.direction);
	tmpPos.multiplyScalar(100);

	body.setLinearVelocity(new Ammo.btVector3(tmpPos.x, tmpPos.y, tmpPos.z));

	ball.userData.physicsBody = body;
	rigidBody_List.push(ball);
	

}

function render() {
	let deltaTime = clock.getDelta();
	updatephysicsWorld(deltaTime);
	renderer.render(scene, camera);
	requestAnimationFrame(render);
}

function updatephysicsWorld(deltaTime) {
	physicsWorld.stepSimulation(deltaTime, 10);

	for( let i = 0; i < rigidBody_List.length; i++) {
		let Graphics_Obj = rigidBody_List[i];
		let Physics_Obj = Graphics_Obj.userData.physicsBody;

		let motionState = Physics_Obj.getMotionState();
		if(motionState) {
			motionState.getWorldTransform(tmpTransformation);
			let new_pos = tmpTransformation.getOrigin();
			let new_qua = tmpTransformation.getRotation();

			Graphics_Obj.position.set(new_pos.x(), new_pos.y(), new_pos.z());
			Graphics_Obj.quaternion.set(0, 0, 0, 1);
		}
	}
}




// Instantiates all scene primitives
function addSceneObjects() {
	initBoundaries();
	initObjects();
	texturizeFloor();
	initFloor();
	initIsland();
	initPlayerGun();
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
	const floorGeometry = new THREE.PlaneGeometry( platform.width, platform.height, 40);
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
var bullets = [];

// Instantiate player obstacles
function initObjects() {
	initTree(-13, -6, 2.5, 6);
   	initTree(5, 5, 1, 8);
   	initTree(3, 3);
   	//initTree(-6, 8);
   	//initTree(8, 8);
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

	initCylinderPipes(-8, 0, 5);
	initCylinderPipes(1, 1, 10, 1, 1, 3, 32, 1, false);

	//addCoinsRandomly(); // DO COLLISION CHECKS
	initFlower(6, 6);
 	initFlower(-13, 1);
	// addDecorRandomly(); // DO COLLISION CHECKS, takes up a lot of mem.
	initTetrahedron(0, 0, 0);
	// initSphere(); // Player will be shooting white balls
}

export function initSphere() {
	var geometry = new THREE.SphereGeometry( .2, 64, 16 );
	var material = new THREE.MeshPhongMaterial( { color: white } );
	var sphere = new THREE.Mesh( geometry, material );

	sphere.position.set(camera.position.x, camera.position.y, camera.position.z);
	sphere.castShadow = true;
	sphere.receiveShadow = true;
	scene.add( sphere );
	let sphereBoundingBox = new THREE.Sphere(sphere.position, 1);

	//AMMO related code
	let transform = new Ammo.btTransform();
	transform.setIdentity();

	transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
	transform.setRotation(new Ammo.btQuaternion( 0, 0, 0, 1));
	let defaultMotionState = new Ammo.btDefaultMotionState(transform);

	let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
	structColShape.setMargin(0.05);

	let localIntertia = new Ammo.btVector3(0,0,0);
	structColShape.calculateLocalInertia(mass, localIntertia);

	let rbInfo = new Ammo.btRigidBodyConstructionInfo(
		mass,
		defaultMotionState,
		structColShape,
		localIntertia
	);
	let rBody = new Ammo.btRigidBody(rbInfo);
	physicsWorld.addRigidBody( rBody);

	newCube.userData.physicsBody = rBody;
	rigidBody_List.push(newCube);
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
	const geometry = new THREE.BoxGeometry(width, height, depth);

	pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/brick.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;

	var wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})
	if (color == white) {
		wallMaterial = new THREE.MeshPhongMaterial( { color: white } );
	}

	const cube = new THREE.Mesh( geometry, wallMaterial );
	cube.position.set(x, y, z);
	cube.receiveShadow = true;
	cube.castShadow = true;

	let cubeBoundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
	cubeBoundingBox.setFromObject(cube);
	
	//cube.name = id.regularBox;
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
	
	//cube.name = id.powerUpBox;
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
	//treeLeaves.name = id.tree;
	//treeTrunk.name = id.tree;
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
function initBoundaries(color = white) {
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
			gltf.scene.scale.set(.5, .5, .5);
			gltf.scene.position.set(camera.position.x - 20, camera.position.y - 10, camera.position.z - 13);
			
			// camera.position.normalize();
			// gltf.scene.position.set(normalizedPos.x, normalizedPos.y, normalizedPos.z);
			// gltf.scene.position.set( (camera.position.x - Math.sin(camera.rotation.y + Math.PI/6)) * 0.75, camera.position.y - 0.5 + Math.sin(20) * 0.01, camera.position.z + Math.cos(camera.rotation.y + Math.PI/6) * 0.75);

			gltf.scene.traverse( function( node ) {
				if ( node.isMesh ) {
					node.castShadow = true;
				}
			} );
			gltf.scene.rotateX(-93);
			
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

function updateCounter(coinCount, goombaCount, type) {
	if (type == 'coin') {
		var numCoins = coinCount + 1;
		document.getElementById("coin-text").innerText = numCoins;
	}
	else {
		var numGoombas = goombaCount + 1;
		document.getElementById("goomba-text").innerText = numGoombas;
	}
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

	var numSpheresToShoot = spheresShot.length;

	for(var idx = 0; idx < 1; idx+=1){
		if( spheresShot[idx] === undefined ) continue;
		if( spheresShot[idx].alive == false ){
			spheresShot.splice(idx, 1);
			continue;
		}
		spheresShot[idx].position.add(spheresShot[idx].velocity);
	}
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

export const addObjectClickListener = (
	camera,
	scene,
	raycaster,
	objectShotAt,
	onMouseClick,
  ) => {

	// camera - Three.Camera
	// scene - Three.Scene
	// raycaster - Three.Raycaster
	// objectShotAt - Three.Object
	// onMouseClick - callback
	
	const objectShotAtId = objectShotAt.uuid;
	let mouse = new THREE.Vector2();

	document.addEventListener(
	  "click",
	  (event) => {
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObjects(scene.children);

		const isIntersected = intersects.find(
		  (intersectedEl) => intersectedEl.object.uuid === objectShotAtId
		);
		if (isIntersected) {
		  onMouseClick(event);
		}
	  },
	  false
	);
  };

function onMouseClick(event){
	alert('Object has been shot at!');
}

window.onload = main;
