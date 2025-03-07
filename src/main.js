import * as THREE from "./js/three.js";
import { ConvexObjectBreaker } from "./js/objectBreaking/ConvexObjectBreaker.js";
import { Movement } from "./js/movement/FirstPersonMovement.js"
import { GLTFLoader } from './js/GLTFLoader.js';
import Ammo from './js/ammo.js';

// Graphics variables
let camera, movement, scene, renderer, mixer, loader, intersectedObject;
const clock = new THREE.Clock();
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );

// Physics variables
const gravityConstant = 7.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let physicsWorld;
const margin = 0.05;

const convexBreaker = new ConvexObjectBreaker();

const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion(0,0,0,1);
let transformAux1;
let tempBtVec3_1;

const objectsToRemove = [];

var POWERUP = "powerUp";
var BRICK = "brick";
var PLACEHOLDER = "NO-NAME";
var BALL = "BALL";

for ( let i = 0; i < 500; i ++ ) {
    objectsToRemove[ i ] = null;
}

let numObjectsToRemove = 0;

const impactPoint = new THREE.Vector3();
const impactNormal = new THREE.Vector3();

var player = {height: 1.8, speed: 0.3, turnSpeed: Math.PI * 0.02};
var platform = {width: 30, height: 30};

var white = 0xffffff;
var blue = 0x039dfc;
var brown = 0x964B00;
var gray = 0xa9a9a9;

// initialize scene
function main() {
	//Create and position the camera
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 30000 );
	camera.position.set(0, player.height, -5);
	camera.lookAt(new THREE.Vector3(0,player.height,0));
	coinsGroup = new THREE.Group();

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

	renderer.outputEncoding = THREE.sRGBEncoding;

	//controls = new OrbitControls( camera, renderer.domElement );
	movement = new Movement( camera, renderer.domElement ); 
	animate();
}

//Declaring projectile-related variables
let tmpTransformation = undefined;
let raycaster = new THREE.Raycaster();
let tmpPos = new THREE.Vector3();
let mouseCoords = new THREE.Vector2();
let coinsGroup = new THREE.Group();
let gravityConstant = 10; // Define gravity properly

Ammo().then(start);

function start() {
    init();
    animate();
}

function startBulletTime() {
    initPhysicsWorld();
    initGraphicsWorld();
    createGround();
    createGridCubes();
    createDropCube();
    addEventHandlers();
    render();
}

// Initialize Physics World
function initPhysicsWorld() {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));
}

// Initialize Graphics World
function initGraphicsWorld() {
    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 30000);
    camera.position.set(0, 10, -5);
    camera.lookAt(new THREE.Vector3(0, 10, 0));

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xDFE9F3, -40, 100);
    scene.background = new THREE.Color("rgb(135, 206, 235)");

    var white = 0xffffff;
    var pointLight = new THREE.PointLight(white, 0.1, 50);
    var directionalLight = new THREE.DirectionalLight(white, 0.7);

    pointLight.position.set(-10, 10, -3);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 20;

    scene.add(pointLight);
    scene.add(directionalLight);
    scene.add(coinsGroup);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

// Instantiate the floor mesh
function initFloor() {
    const floorGeometry = new THREE.PlaneGeometry(50, 50, 20);
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    const meshFloor = new THREE.Mesh(floorGeometry, floorMaterial);
    meshFloor.receiveShadow = true;
    scene.add(meshFloor);
}

// Instantiates all scene primitives
function addSceneObjects() {
    initBoundaries();
    initObjects();
    initLights();
    texturizeFloor();
    initFloor();
    initCylinderPipes();
    initPlayerGun();
    initGoombaEnemies();
    initSkyBox();
    scene.add(coinsGroup);
}

// Instantiate objects
function initObjects() {
    initTree(-3, -6, 2.5, 6);
    initTree(5, 5, 1, 8);
    initTree(3, 3);
    initTree(-4, 8);
    initTree(8, 8);
    initTree(-6, 9, 1.5, 4, 7);
    initTree(-7.5, -7.5, 2, 6, 7);
    initCapsuleTree(0.5, 0.5, -9, 0.4, 1);
    initCapsuleTree(1, 1, 7, 0.4, 1);

    initBricks(6, 0.5, -4, 0.7, 0.7, 0.7);
    initBricks(4, 5, -10, 0.7, 0.7, 0.7);
    initBricks(-4, 1, 0, 0.7, 0.7, 0.7);

    initPowerUpBox(4, 3, 5, 0.7, 0.7, 0.7);
    initPowerUpBox(10, 3, 5, 0.7, 0.7, 0.7);
    initPowerUpBox(-4, 3, 5, 0.7, 0.7, 0.7);

    initCoin(-18, 2, 0, 0.3, 0.3, 0.1, 32, 1, false);
    initCoin(-5, 2, 4, 0.3, 0.3, 0.1, 32, 1, false);
    initCoin(3, 2, 4, 0.3, 0.3, 0.1, 32, 1, false);
    
    addCoinsRandomly();
    initSceneDecor(-10, 15);
    initTetrahedron(0, 0, 0);
    initSphere();
}

// Instantiate a shooting sphere (e.g., tennis ball)
function initSphere() {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshPhongMaterial({ color: 0xff5191 })
    );
    sphere.position.set(-10, 10, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);
}

// Main Initialization
function init() {
    initGraphicsWorld();
    initPhysicsWorld();
    initObjects();
    initInput();
}

// Handle window resize event
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function render() {
    let deltaTime = clock.getDelta();
    updatephysicsWorld(deltaTime);
    if ( mixer ) mixer.update( deltaTime );
    renderer.render(scene, camera);
}



/* PHYSICS */ 

function createRigidBody( object, physicsShape, mass, pos, quat, vel, angVel ) {

    if ( pos ) {
        object.position.copy( pos );
    } else {
        pos = object.position;
    }

    if ( quat ) {
        object.quaternion.copy( quat );
    } else {
        quat = object.quaternion;
    }

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    const motionState = new Ammo.btDefaultMotionState( transform );

    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    physicsShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    body.setFriction( 0.5 );

    if ( vel ) {
        body.setLinearVelocity( new Ammo.btVector3( vel.x, vel.y, vel.z ) );
    }

    if ( angVel ) {
        body.setAngularVelocity( new Ammo.btVector3( angVel.x, angVel.y, angVel.z ) );
    }

    object.userData.physicsBody = body;
    object.userData.collided = false;

    scene.add( object );

    if ( mass > 0 ) {
        rigidBodies.push( object );
        body.setActivationState( 4 );
    }

    physicsWorld.addRigidBody( body );

    body.threeObject = object;
    return body;
}

function createDebrisFromBreakableObject( object ) {

    object.castShadow = true;
    object.receiveShadow = true;

    const shape = createConvexHullPhysicsShape( object.geometry.attributes.position.array );
    shape.setMargin( margin );

    const body = createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

    // Set pointer back to the three object only in the debris objects
    const btVecUserData = new Ammo.btVector3( 0, 0, 0 );
    btVecUserData.threeObject = object;
    body.setUserPointer( btVecUserData );

}

function removeDebris( object ) {
    scene.remove( object );
    physicsWorld.removeRigidBody( object.userData.physicsBody );
}



/* INIT OBJECTS */



function initObjects() {
    // Set up environment
    initFloor();
    initSkyBox();
    initIsland();

    scene.fog = new THREE.Fog(0xDFE9F3, -40, 100);
    scene.background = new THREE.Color("rgb(135, 206, 235)");

    // Add Objects 
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
    scene.add( coinsGroup );

    initGoombaEnemies(-5, 0.1, 4);

    initBricks(3.6, 0.35, 10, .7, .7, .7, brown);
   	initBricks(4.4, 0.35, 10, .7, .7, .7, brown);
   	initBricks(5.2, 0.35, 10, .7, .7, .7, brown);
   	initBricks(6, 0.35, -4, .7, .7, .7, brown);
   	initBricks(4, 0.35, -10, .7, .7, .7, brown);
   	initBricks(-4, 0.35, 0, .7, .7, .7, brown);

    initPowerUpBox(14, 3, 5, .7, .7, .7);
   	initPowerUpBox(10, 3, 5, .7, .7, .7);
   	initPowerUpBox(-14, 3, 5, .7, .7, .7);
   	initPowerUpBox(3, 4, 10, .7, .7, .7);

    initCylinderPipes(-8, 0, 5);
    initCylinderPipes(1, 1, 10, 1, 1, 3, 32, 1, false);

    initFlower(6, 6);
 	initFlower(-13, 1);

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
}



function initFloor() {
    const floorTexture = new THREE.TextureLoader().load( "assets/mario_assets/grass_a1.png" );
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set( 4, 4 );
	const floorMaterial = new THREE.MeshPhongMaterial({map : floorTexture})

    pos.set( 0, -0.5, 0);
    quat.set( 0, 0, 0, 1 );
    const ground = createParalellepipedWithPhysics( platform.width, 1, platform.height, 0, pos, quat, floorMaterial );
    ground.receiveShadow = true;

    scene.add(ground);
}


function initPowerUpBox(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1) {
	const pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/question_box.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;
	const wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})

    initBlockWithPhysics(x, y, z, width, height, depth, wallMaterial, POWERUP, 0);
}

function initBricks(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1, color, breakable = true) {
	const pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/brick.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;
	var wallMaterial = new THREE.MeshPhongMaterial({map : pipeTexture})
	if (color == white) {
		wallMaterial = new THREE.MeshPhongMaterial( { color: white } );
	}

    if (!breakable) {
        initBlockWithPhysics(x, y, z, width, height, depth, wallMaterial, BRICK, 3);
    } else {
        initBreakableBlock(x, y, z, width, height, depth, wallMaterial, BRICK, 1000);
    }
 
}

function initBlockWithPhysics(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1, material, name=PLACEHOLDER, mass = 0) {
	pos.set( x, y, z);
    quat.set(0, 0, 0, 1);
    const block = createParalellepipedWithPhysics( width, height, depth, mass, pos, quat, material, name);
    block.receiveShadow = true;
    scene.add(block);
}

function initBreakableBlock(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1, material, name=PLACEHOLDER, mass=1000) {
    pos.set( x, y, z);
    quat.set(0, 0, 0, 1);
    const scale = new THREE.Vector3( width / 2, height / 2, depth / 2);
    createObject(mass, scale, pos, quat, material, BRICK);
} 

function initCylinderPipes(x = 0, y = 0, z = 0, radiusTop = 1, radiusBottom = 1, height = 3, radialSegments = 32, heightSegments = 1, openEnded = false) {
	const geometry =  new THREE.CylinderGeometry( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded )

	const pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/pipe.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;
	pipeTexture.repeat.set( 4, 4 );	

	const pipeMaterial = new THREE.MeshPhongMaterial( {map : pipeTexture} );
	const pipeColor =  new THREE.MeshPhongMaterial({color: 0x2CB01A, wireframe: false});
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

	scene.add(treeLeaves);
	scene.add(treeTrunk);
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

	var skyboxGeo = new THREE.BoxGeometry(100, 100, 100);
	var skybox = new THREE.Mesh(skyboxGeo, materialTextures);
	scene.add(skybox);
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

function initCoin(x = 0, y = 0, z = 0, radiusTop = 1, radiusBottom = 1, height = 5, radialSegments = 32, heightSegments = 1, openEnded = false) {
	const geometry =  new THREE.CylinderGeometry( radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded )

	const pipeTexture = new THREE.TextureLoader().load( "assets/mario_assets/coin_test.png" );
	pipeTexture.wrapS = THREE.RepeatWrapping;
	pipeTexture.wrapT = THREE.RepeatWrapping;

	const pipeMaterial = new THREE.MeshPhongMaterial( {map : pipeTexture} );
	const cylinder = new THREE.Mesh( geometry, pipeMaterial );
	cylinder.position.set(x, y, z);
	cylinder.rotateX(-80.1);
	cylinder.castShadow = true;
	cylinder.receiveShadow = true;

	// Bounding box 
	cylinder.name = "coin";
	coinsGroup.add(cylinder);
}
    
function createParalellepipedWithPhysics( sx, sy, sz, mass, pos, quat, material, name=PLACEHOLDER) {
    const object = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
    const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
    object.name = name;
    shape.setMargin( margin );
    createRigidBody( object, shape, mass, pos, quat );
    return object;
}

function createObject( mass, scale, pos, quat, material, name=PLACEHOLDER) {
    const object = new THREE.Mesh( new THREE.BoxGeometry( scale.x * 2, scale.y * 2, scale.z * 2), material );
    object.name = name;
    object.position.copy( pos );
    object.quaternion.copy( quat );
    convexBreaker.prepareBreakableObject( object, mass, new THREE.Vector3(), new THREE.Vector3(), true );
    createDebrisFromBreakableObject( object );
}

function createConvexHullPhysicsShape( coords ) {
    const shape = new Ammo.btConvexHullShape();
    for ( let i = 0, il = coords.length; i < il; i += 3 ) {
        tempBtVec3_1.setValue( coords[ i ], coords[ i + 1 ], coords[ i + 2 ] );
        const lastOne = ( i >= ( il - 3 ) );
        shape.addPoint( tempBtVec3_1, lastOne );
    }
    return shape;
}

function initGoombaEnemies(x = 0, y = 0, z = 0) {
    loader = new GLTFLoader();
	loader.load(
		// resource URL
		'assets/animated_goomba/animated_goomba.gltf',
		// called when the resource is loaded
		function ( gltf ) {
			gltf.scene.scale.set(0.02, 0.02, 0.02); 
			gltf.scene.position.set(-5, 0.25, 4);
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



/* INPUT */

function initInput() {

    window.addEventListener( 'pointerdown', function ( event ) {

        if (movement.isLocked() == true) {
            mouseCoords.set(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1
            );

            raycaster.setFromCamera( mouseCoords, camera );

            // Creates a ball and throws it
            const ballMass = 35;
            const ballRadius = 0.3;

            const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 14, 10 ), ballMaterial );
            ball.castShadow = true;
            ball.receiveShadow = true;
            const ballShape = new Ammo.btSphereShape( ballRadius );
            ballShape.setMargin( margin );
            pos.copy( raycaster.ray.direction );
            pos.add( raycaster.ray.origin );
            quat.set( 0, 0, 0, 1 );
            const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );

            pos.copy( raycaster.ray.direction );
            pos.multiplyScalar( 24 );
            ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

            var intersects = raycaster.intersectObjects( scene.children );
            if (intersects.length > 0) {
                intersectedObject = intersects[0].object;

                if (intersectedObject.name == "coin") {
                    updateCounter(coinCount, goombaCount, "coin");
                } else if (intersectedObject.name == "goomba") {
                    updateCounter(coinCount, goombaCount, "goomba");
                }
            }
    }
} );

    
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}




/* COIN FUNCTIONS */

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



/* EXPORTS */
