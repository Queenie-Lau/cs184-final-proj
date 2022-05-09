import * as THREE from "./three.js";
import { ConvexObjectBreaker } from "./objectBreaking/ConvexObjectBreaker.js";
import { ConvexGeometry } from "./objectBreaking/ConvexGeometry.js";
import { Movement } from "./movement/FirstPersonMovement.js"

// Graphics variables
//let container, stats;
let textureLoader = new THREE.TextureLoader();
let camera, movement, scene, renderer;
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

let canShoot = false;

/* SETUP */ 

Ammo().then(start);
function start() {
    init();
    animate();
}

function init() {
    initGraphicsWorld();
    initPhysicsWorld();
    movement = new Movement( camera, renderer.domElement ); 
    initObjects();
    initInput();
}

function initPhysicsWorld() {
    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    //overlappingPairCache = new Ammo.btDbvtBroadphase();
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));
    //initContactResultCallback();
    //initContactPairResultCallback();

    transformAux1 = new Ammo.btTransform();
    tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );
}

function initGraphicsWorld() {
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 30000 );
    camera.position.set(0, player.height, -5);
    camera.lookAt(new THREE.Vector3(0,player.height,0));

    scene = new THREE.Scene();

    var pointLight = new THREE.PointLight(white, 0.1, 50);
    var directionalLight = new THREE.DirectionalLight(white, 0.7);
    pointLight.position.set(-10, 10, -3);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );

}



/* PHYSICS UPDATES */

function updatephysicsWorld(deltaTime) {
    physicsWorld.stepSimulation(deltaTime, 10);

    for( let i = 0; i < rigidBodies.length; i++) {
        let Graphics_Obj = rigidBodies[i];
        let Physics_Obj = Graphics_Obj.userData.physicsBody;
        let motionState = Physics_Obj.getMotionState();

        if(motionState) {
            motionState.getWorldTransform(transformAux1);
            let new_pos = transformAux1.getOrigin();
            let new_qua = transformAux1.getRotation();
            Graphics_Obj.position.set(new_pos.x(), new_pos.y(), new_pos.z());

            Graphics_Obj.quaternion.set(new_qua.x(), new_qua.y(), new_qua.z(), new_qua.w());
        }
    }
    //checkForCollisions();
    for ( let i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {

        const contactManifold = dispatcher.getManifoldByIndexInternal( i );
        const rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody );
        const rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody );
        const threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
        const threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;

        if ( ! threeObject0 && ! threeObject1 ) {
            continue;
        }

        const userData0 = threeObject0 ? threeObject0.userData : null;
        const userData1 = threeObject1 ? threeObject1.userData : null;
        const breakable0 = userData0 ? userData0.breakable : false;
        const breakable1 = userData1 ? userData1.breakable : false;
        const collided0 = userData0 ? userData0.collided : false;
        const collided1 = userData1 ? userData1.collided : false;

        if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {
            continue;
        }

        let contact = false;
        let maxImpulse = 0;
        for ( let j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {

            const contactPoint = contactManifold.getContactPoint( j );

            if ( contactPoint.getDistance() < 0 ) {
                contact = true;
                const impulse = contactPoint.getAppliedImpulse();
                
                if ( impulse > maxImpulse ) {
                    maxImpulse = impulse;
                    const pos = contactPoint.get_m_positionWorldOnB();
                    const normal = contactPoint.get_m_normalWorldOnB();
                    impactPoint.set( pos.x(), pos.y(), pos.z() );
                    impactNormal.set( normal.x(), normal.y(), normal.z() );
                }
                break;
            }
        }

        // If no point has contact, abort
        if ( ! contact ) continue;

        // Subdivision

        const fractureImpulse = 250;

        if ( breakable0 && ! collided0 && maxImpulse > fractureImpulse ) {

            const debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal, 1, 2, 1.5 );
            const numObjects = debris.length;

            for ( let j = 0; j < numObjects; j ++ ) {
                const vel = rb0.getLinearVelocity();
                const angVel = rb0.getAngularVelocity();
                const fragment = debris[ j ];
                fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
                fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );
                createDebrisFromBreakableObject( fragment );
            }
            objectsToRemove[ numObjectsToRemove ++ ] = threeObject0;
            userData0.collided = true;
        }

        if ( breakable1 && ! collided1 && maxImpulse > fractureImpulse ) {
            const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal, 1, 2, 1.5 );
            const numObjects = debris.length;

            for ( let j = 0; j < numObjects; j ++ ) {
                const vel = rb1.getLinearVelocity();
                const angVel = rb1.getAngularVelocity();
                const fragment = debris[ j ];
                fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
                fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );
                createDebrisFromBreakableObject( fragment );
            }
            objectsToRemove[ numObjectsToRemove ++ ] = threeObject1;
            userData1.collided = true;
        }
    }

    for ( let i = 0; i < numObjectsToRemove; i ++ ) {
        removeDebris( objectsToRemove[ i ] );
    }
    numObjectsToRemove = 0;

}

function animate() {
    requestAnimationFrame( animate );
    movement.update();
    render();
}

function render() {
    let deltaTime = clock.getDelta();
    updatephysicsWorld(deltaTime);
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

    // Ground
    pos.set( 0, - 0.5, 0 );
    quat.set( 0, 0, 0, 1 );
    const ground = createParalellepipedWithPhysics( 40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
    ground.receiveShadow = true;

    // Tower 1
    const towerMass = 1000;
    const towerHalfExtents = new THREE.Vector3( 2, 5, 2 );
    pos.set( - 8, 5, 0 );
    quat.set( 0, 0, 0, 1 );
    createObject( towerMass, towerHalfExtents, pos, quat, createMaterial( 0xB03014 ) );

    // Tower 2
    pos.set( 8, 5, 0 );
    quat.set( 0, 0, 0, 1 );
    createObject( towerMass, towerHalfExtents, pos, quat, createMaterial( 0xB03214 ) );

    //Bridge
    const bridgeMass = 100;
    const bridgeHalfExtents = new THREE.Vector3( 7, 0.2, 1.5 );
    pos.set( 0, 10.2, 0 );
    quat.set( 0, 0, 0, 1 );
    createObject( bridgeMass, bridgeHalfExtents, pos, quat, createMaterial( 0xB3B865 ) );

    // Stones
    const stoneMass = 120;
    const stoneHalfExtents = new THREE.Vector3( 1, 2, 0.15 );
    const numStones = 8;
    quat.set( 0, 0, 0, 1 );
    for ( let i = 0; i < numStones; i ++ ) {

        pos.set( 0, 2, 15 * ( 0.5 - i / ( numStones + 1 ) ) );

        createObject( stoneMass, stoneHalfExtents, pos, quat, createMaterial( 0xB0B0B0 ) );

    }
}

function createParalellepipedWithPhysics( sx, sy, sz, mass, pos, quat, material ) {

    const object = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
    const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
    shape.setMargin( margin );

    createRigidBody( object, shape, mass, pos, quat );

    return object;

}

function createObject( mass, scale, pos, quat, material ) {
    const object = new THREE.Mesh( new THREE.BoxGeometry( scale.x * 2, scale.y * 2, scale.z * 2), material );
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
/*static createCube(scale, position, mass, material, quat) {
    var geometry = new THREE.BoxBufferGeometry(scale.x, scale.y, scale.z);
    //var material = new THREE.MeshPhongMaterial({color: color});
    var newCube = new THREE.Mesh( geometry, material );
    newCube.position.set(position.x, position.y, position.z);

    newCube.userData.tag = "cube"; // not setting correctly..?
    scene.add(newCube);

    let transform = new Ammo.btTransform();
    transform.setIdentity();

    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let defaultMotionState = new Ammo.btDefaultMotionState( transform );

    let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(scale.x*0.5, scale.y*0.5, scale.z*0.5))
    structColShape.setMargin( margin );

    let localInertia = new Ammo.btVector3(0,0,0);
    structColShape.calculateLocalInertia(mass, localInertia)

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass, 
        defaultMotionState,
        structColShape,
        localInertia
    );

    let rBody = new Ammo.btRigidBody( rbInfo );
    physicsWorld.addRigidBody( rBody );
    newCube.userData.physicsBody = rBody;
    newCube.name = "cube";
    
    convexBreaker.prepareBreakableObject( newCube, mass, new THREE.Vector3(), new THREE.Vector3(), true );
    createDebrisFromBreakableObject( newCube );

    // set cube ID here? -> add to dict. mapping
    return newCube;
}*/


/*static addBoxPhysics( scale , position, mass, quat, mesh) {

let transform = new Ammo.btTransform();
transform.setIdentity();

transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
let defaultMotionState = new Ammo.btDefaultMotionState( transform );

let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(scale.x*0.5, scale.y*0.5, scale.z*0.5))
structColShape.setMargin( margin );

let localInertia = new Ammo.btVector3(0,0,0);
structColShape.calculateLocalInertia(mass, localInertia)

let rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass, 
    defaultMotionState,
    structColShape,
    localInertia
);

let rBody = new Ammo.btRigidBody( rbInfo );
physicsWorld.addRigidBody( rBody );

mesh.userData.physicsBody = rBody;
mesh.userData.tag = "cube"; // not setting correctly..?
mesh.name = "cube";
return mesh;
}*/

/* MATERIALS */

function createRandomColor() {
    return Math.floor( Math.random() * ( 1 << 24 ) );
}

function createMaterial( color ) {
    color = color || createRandomColor();
    return new THREE.MeshPhongMaterial( { color: color } );
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
            const ballRadius = 0.4;

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
        }
    } );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
