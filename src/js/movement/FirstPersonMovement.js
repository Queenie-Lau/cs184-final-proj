import {
	EventDispatcher,
	MaxEquation,
	Vector3
} from '../three.js';

import { PointerLockControls } from './PointerLockControls.js';

var controls; 

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new Vector3();
const direction = new Vector3();

let jumpHeight = 10;
let cameraHeight = 1.8;
let speed = 50.0;
let mass = 2.5;

class Movement extends EventDispatcher {

	constructor( object, domElement ) {

		super();

		if ( domElement === undefined ) {

			console.warn( 'THREE.FlyControls: The second parameter "domElement" is now mandatory.' );
			domElement = document;

		}

		this.object = object;
		this.domElement = domElement;


        controls = new PointerLockControls( object, document.body );
        const blocker = document.getElementById( 'blocker' );
        const instructions = document.getElementById( 'instructions' );

        instructions.addEventListener( 'click', function () {
            controls.lock();
        } );

        controls.addEventListener( 'lock', function () {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        } );

        controls.addEventListener( 'unlock', function () {
            blocker.style.display = 'block';
            instructions.style.display = '';
        } );    

        this.isLocked = function() {
            return controls.isLocked;
        }

        // Input Functions
        function onKeyDown( event ) {

            switch ( event.code ) {

                case 'ArrowUp':
                case 'KeyW':
                    moveForward = true;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = true;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = true;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = true;
                    break;

                case 'Space':
                    if ( canJump === true ) velocity.y += jumpHeight;
                    canJump = false;
                    break;
            }

        };

        function onKeyUp (event ) {

            switch ( event.code ) {

                case 'ArrowUp':
                case 'KeyW':
                    moveForward = false;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = false;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = false;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = false;
                    break;
            }

        };

        document.addEventListener( 'keydown', onKeyDown );
        document.addEventListener( 'keyup', onKeyUp );

        // To be called in the animate loop
		this.update = function () {

            const time = performance.now();

            if ( controls.isLocked === true ) {

                //raycaster.ray.origin.copy( controls.getObject().position );
                //raycaster.ray.origin.y -= 10;

                //const intersections = raycaster.intersectObjects( objects, false );

                //const onObject = intersections.length > 0;
                const delta = ( time - prevTime ) / 1000;

                velocity.x -= velocity.x * speed * delta;
                velocity.z -= velocity.z * speed * delta;

                velocity.y -= 9.8 * mass * delta; 

                direction.z = Number( moveForward ) - Number( moveBackward );
                direction.x = Number( moveRight ) - Number( moveLeft );
                direction.normalize(); // this ensures consistent movements in all directions

                if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
                if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

                controls.moveRight( - velocity.x * delta );
                controls.moveForward( - velocity.z * delta );

                // Jump 
                controls.getObject().position.y += ( velocity.y * delta ); 
                if ( controls.getObject().position.y < cameraHeight) {
                    velocity.y = 0;
                    controls.getObject().position.y = cameraHeight;
                    canJump = true;
                }

            }

            prevTime = time;

        }


    }

}
export { Movement };