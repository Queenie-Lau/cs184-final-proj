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

        function createCube(scale, position, mass, color, quat) {
            var geometry = new THREE.BoxBufferGeometry(scale.x, scale.y, scale.z);
            var material = new THREE.MeshPhongMaterial({color: color});
            let newCube = new THREE.Mesh( geometry, material );
            newCube.position.set(position.x, position.y, position.z);
            scene.add(newCube);

            // AMMO 
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
            return newCube;

        }

        

        // API FUNCTIONS
        this.createGround = function() {
            createCube(
                new THREE.Vector3(50, 2, 40),
                new THREE.Vector3(15, -5, 30),
                0, 
                0x567d46,
                {x:0, y:0, z:0, w:1});
        }
    }
}

export { SceneManager };