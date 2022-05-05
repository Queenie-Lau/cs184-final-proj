import * as THREE from "./three.js";

class SceneManager {

    rigidbody_List = [];

	constructor(scene, physicsWorld, domElement ) {

		if ( domElement === undefined ) {

			console.warn( 'THREE.FlyControls: The second parameter "domElement" is now mandatory.' );
			domElement = document;

		}

		this.scene = scene;
        this.physicsWorld = physicsWorld;
		this.domElement = domElement;

        const convexBreaker = new ConvexObjectBreaker();

        /* Initialization and physics functions */

        function createCube(scale, position, mass, material, quat) {
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
            structColShape.setMargin(0.05);

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

        function addBoxPhysics( scale , position, mass, quat, mesh) {

            let transform = new Ammo.btTransform();
            transform.setIdentity();

            transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
            let defaultMotionState = new Ammo.btDefaultMotionState( transform );

            let structColShape = new Ammo.btBoxShape( new Ammo.btVector3(scale.x*0.5, scale.y*0.5, scale.z*0.5))
            structColShape.setMargin(0.05);

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
        }

        // API FUNCTIONS
        this.initCube = function(pos, scale, mass, material, quat = {x:0, y:0, z:0, w:1}) {
            return createCube(scale, pos, mass, material, quat);
        }
        this.addPhysics = function(scale, position, mass, quat, mesh) {
            return addBoxPhysics(scale, position, mass, quat, mesh);
        }

    }
}

export { SceneManager };