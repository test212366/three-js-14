 

import { MSDFTextGeometry, MSDFTextMaterial, uniforms } from "three-msdf-text-utils";
 
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'

import VirtualScroll from "virtual-scroll";


import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'

import fnt from './font/FontsFree-Net-SF-Pro-Rounded-Regular-msdf.json'
import atlasURL from './font/FontsFree-Net-SF-Pro-Rounded-Regular.png'
 

const TEXT = [
	'eloquence',
	'supine',
	'solitude',
	'aurora',
	'clinonanial',
	'something',
	'sequoila'
]

// import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
// import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
// import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
// import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		this.sceneCopy = new THREE.Scene()
		this.groupCopy = new THREE.Group()
		this.sceneCopy.add(this.groupCopy)
		this.group = new THREE.Group()
		this.groupPlane = new THREE.Group()
		this.scene.add(this.group)
		this.scene.add(this.groupPlane)

		this.textures = [...document.querySelectorAll('.js-texture')]
		this.textures = this.textures.map(t => {return new THREE.TextureLoader().load(t.src)})


		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
		this.renderer.autoClear = false
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0xeeeeeee, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.scroller = new VirtualScroll()
		this.position = 0
		this.speed = 0
		this.targetSpeed = 0
		this.scroller.on(event => {		
			this.position = event.y /4000
			this.speed = event.deltaY / 2000
		})


		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 10
		)
 
		this.camera.position.set(0, 0, 2) 
		//this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.addObjects()		 
		//this.resize()
		this.render()
		this.setupResize()
		this.addTexts()
 
	}


	addTexts() {
		this.material = new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
			transparent: true,
			defines: {
				 IS_SMALL: false,
			},
			extensions: {
				 derivatives: true,
			},
			uniforms: {
				uSpeed: {value: 0},
				 // Common
				 ...uniforms.common,
				 
				 // Rendering
				 ...uniforms.rendering,
				 
				 // Strokes
				 ...uniforms.strokes,
			},
			vertexShader: `
				 // Attribute
				 attribute vec2 layoutUv;
	  
				 attribute float lineIndex;
	  
				 attribute float lineLettersTotal;
				 attribute float lineLetterIndex;
	  
				 attribute float lineWordsTotal;
				 attribute float lineWordIndex;
	  
				 attribute float wordIndex;
	  
				 attribute float letterIndex;
	  
				 // Varyings
				 varying vec2 vUv;
				 varying vec2 vLayoutUv;
				 varying vec3 vViewPosition;
				 varying vec3 vNormal;
	  
				 varying float vLineIndex;
	  
				 varying float vLineLettersTotal;
				 varying float vLineLetterIndex;
	  
				 varying float vLineWordsTotal;
				 varying float vLineWordIndex;
	  
				 varying float vWordIndex;
	  
				 varying float vLetterIndex;


				 mat4 rotationMatrix(vec3 axis, float angle) {
					axis = normalize(axis);
					float s = sin(angle);
					float c = cos(angle);
					float oc = 1.0 - c;
					
					return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
									oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
									oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
									0.0,                                0.0,                                0.0,                                1.0);
			  }
			  
			  vec3 rotate(vec3 v, vec3 axis, float angle) {
				  mat4 m = rotationMatrix(axis, angle);
				  return (m * vec4(v, 1.0)).xyz;
			  }

			  uniform float uSpeed;


	  
				 void main() {
			 
	  
					  // Varyings
					  vUv = uv;
					  vLayoutUv = layoutUv;
					  
					  vNormal = normal;
	  
					  vLineIndex = lineIndex;
	  
					  vLineLettersTotal = lineLettersTotal;
					  vLineLetterIndex = lineLetterIndex;
	  
					  vLineWordsTotal = lineWordsTotal;
					  vLineWordIndex = lineWordIndex;
	  
					  vWordIndex = wordIndex;
	  
					  vLetterIndex = letterIndex;

					  // Output

					  vec3 newpos = position;
					  float xx = position.x * 0.005;
					  newpos = rotate(newpos, vec3(.0, 0.0, 1.0), uSpeed * xx * xx * xx);
					  vec4 mvPosition = vec4(newpos, 1.0);
					  mvPosition = modelViewMatrix * mvPosition;
					  gl_Position = projectionMatrix * mvPosition;
					  vViewPosition = -mvPosition.xyz;
				 }
			`,
			fragmentShader: `
				 // Varyings
				 varying vec2 vUv;
	  
				 // Uniforms: Common
				 uniform float uOpacity;
				 uniform float uThreshold;
				 uniform float uAlphaTest;
				 uniform vec3 uColor;
				 uniform sampler2D uMap;
	  
				 // Uniforms: Strokes
				 uniform vec3 uStrokeColor;
				 uniform float uStrokeOutsetWidth;
				 uniform float uStrokeInsetWidth;
	  
				 // Utils: Median
				 float median(float r, float g, float b) {
					  return max(min(r, g), min(max(r, g), b));
				 }
	  
				 void main() {
					  // Common
					  // Texture sample
					  vec3 s = texture2D(uMap, vUv).rgb;
	  
					  // Signed distance
					  float sigDist = median(s.r, s.g, s.b) - 0.5;
	  
					  float afwidth = 1.4142135623730951 / 2.0;
	  
					  #ifdef IS_SMALL
							float alpha = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDist);
					  #else
							float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
					  #endif
	  
					  // Strokes
					  // Outset
					  float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
	  
					  // Inset
					  float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;
	  
					  #ifdef IS_SMALL
							float outset = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistOutset);
							float inset = 1.0 - smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistInset);
					  #else
							float outset = clamp(sigDistOutset / fwidth(sigDistOutset) + 0.5, 0.0, 1.0);
							float inset = 1.0 - clamp(sigDistInset / fwidth(sigDistInset) + 0.5, 0.0, 1.0);
					  #endif
	  
					  // Border
					  float border = outset * inset;
	  
					  // Alpha Test
					  if (alpha < uAlphaTest) discard;
	  
					  // Some animation
					//   alpha *= sin(uTime);
	  
					  // Output: Common
	  
					  vec4 filledFragColor = vec4(uColor, uOpacity * alpha);
	  
					  gl_FragColor = filledFragColor;
					  gl_FragColor = vec4(1., 0., 1., 1.);
				 }
			`,
	  });



	  ///fsafasfsdfsdfsdfsdfsdf

		Promise.all([
			loadFontAtlas(atlasURL)
	  ]).then(([atlas]) => {

			this.size = 0.2



			this.material.uniforms.uMap.value = atlas;
			TEXT.forEach((text, i) => {
				const geometry = new MSDFTextGeometry({
					text: text.toUpperCase(),
					font: fnt,
			  });
		 
				
			 
		 
			  const mesh = new THREE.Mesh(geometry, this.material);
			  let s = 0.005
			  mesh.scale.set(s,-s,s)
				mesh.position.x = -0.9
			  mesh.position.y = this.size * i

	
			  this.group.add(mesh)
			  this.groupCopy.add(mesh.clone())

			})

			 
		})




		function loadFontAtlas(path) {
			const promise = new Promise((resolve, reject) => {
				 const loader = new THREE.TextureLoader();
				 loader.load(path, resolve);
			});
	  
			return promise;
	  }
	}





	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) * this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.planeMaterial = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				uTexture: {value: this.textures[0]},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader
		})
		
		this.geometry = new THREE.PlaneGeometry(1.77 /3 ,1 /3 ,30,30).translate(0,0,1)
		let pos = this.geometry.attributes.position.array
		let newpos = []
		let r = 1.2
		for (let i = 0; i < pos.length; i+= 3) {
			let x = pos[i]
			let y = pos[i + 1]
			let z = pos[i + 2]
			
			let xz = new THREE.Vector2(x, z).normalize().multiplyScalar(r)

			newpos.push(xz.x, y, xz.y)
		}
		
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newpos, 3))
		this.plane = new THREE.Mesh(this.geometry, this.planeMaterial)
 
		this.groupPlane.add(this.plane)
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	updateTexture() {
		let index = Math.round(this.position + 10000) % this.textures.length - 2

		this.planeMaterial.uniforms.uTexture.value = this.textures[index]



		this.groupCopy.children.forEach((mesh, i) => {
			
			console.log(i,index, mesh)
			if(i !==index) {
				mesh.visible = false
				// mesh.position.x = -1
			} else {
				mesh.visible = true
			}
		})
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		this.updateTexture()
		this.speed *= 0.9
		this.targetSpeed += (this.speed - this.targetSpeed) * 0.1
 
		if(this.material) this.material.uniforms.uSpeed.value = this.targetSpeed

		// this.material.uniforms.time.value = this.time
		this.group.position.y = -this.position * this.size
		this.groupCopy.position.y = -this.position * this.size
		this.plane.rotation.y = this.position * 2 * Math.PI
		this.groupPlane.rotation.z = 0.2 * Math.sin(this.position * 0.5)  
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		this.renderer.render(this.sceneCopy, this.camera)
		//this.renderer.setRenderTarget(null)
		 this.renderer.clearDepth()
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 