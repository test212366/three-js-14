uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
uniform sampler2D uTexture;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.1415926;
void main() {
 
	gl_FragColor = texture2D(uTexture, vUv);
}