import {
	EffectComposer,
	RenderPass,
    SavePass,
    WebGLRenderTarget,
    addPass,
    ShaderPass
} from '../three.js';

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Post-processing inits
const composer = new EffectComposer(renderer);

// render pass
const renderPass = new RenderPass(scene, camera);

const renderTargetParameters = {
	minFilter: LinearFilter,
	magFilter: LinearFilter,
	stencilBuffer: false
};

// save pass
const savePass = new SavePass(
	new WebGLRenderTarget(
		container.clientWidth,
		container.clientHeight,
		renderTargetParameters
	)
);

// blend pass
const blendPass = new ShaderPass(THREE.BlendShader, "tDiffuse1");
blendPass.uniforms["tDiffuse2"].value = savePass.renderTarget.texture;
blendPass.uniforms["mixRatio"].value = 0.8;

// output pass
const outputPass = new ShaderPass(THREE.CopyShader);
outputPass.renderToScreen = true;

// adding passes to composer
composer.addPass(renderPass);
composer.addPass(blendPass);
composer.addPass(savePass);
composer.addPass(outputPass);

// window.addEventListener("resize", onWindowResize, false);

// function onWindowResize() {
// 	camera.aspect = window.innerWidth / window.innerHeight;
// 	camera.updateProjectionMatrix();
// 	renderer.setSize(window.innerWidth, window.innerHeight);
// }

// let counter = 0;
// function render() {
// 	composer.render();
// 	requestAnimationFrame(render);

// 	model.rotation.x += 0.02;
// 	model.rotation.y += -0.02;
// 	model.rotation.z += 0.03;
// 	model.position.x += Math.sin(counter);
// 	counter += 0.05;
// }

export { MotionBlur };