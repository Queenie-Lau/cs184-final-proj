import * as THREE from "./three.js";
import { ConvexObjectBreaker } from "./objectBreaking/ConvexObjectBreaker.js";
import { ConvexGeometry } from "./objectBreaking/ConvexGeometry.js";
import { ConvexHull } from "./objectBreaking/ConvexHull.js";

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

        let transformAux1 = new Ammo.btTransform();
        let tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );

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
			shape.setMargin( 0.05 );

			const body = createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

			// Set pointer back to the three object only in the debris objects
			const btVecUserData = new Ammo.btVector3( 0, 0, 0 );
			btVecUserData.threeObject = object;
			body.setUserPointer( btVecUserData );

		}

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

				// Disable deactivation
				body.setActivationState( 4 );

			}

			physicsWorld.addRigidBody( body );

			return body;

		}


        function removeDebris( object ) {

			scene.remove( object );

			physicsWorld.removeRigidBody( object.userData.physicsBody );

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