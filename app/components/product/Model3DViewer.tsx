import { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text as RNText } from 'react-native';
import { WebView } from 'react-native-webview';

interface Model3DViewerProps {
  modelUrl: string;
  height?: number;
}

export default function Model3DViewer({ modelUrl, height }: Model3DViewerProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        body {
          margin: 0;
          overflow: hidden;
          background: #808080;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #canvas { width: 100%; height: 100vh; display: block; }
        #error { color: red; padding: 20px; text-align: center; font-family: sans-serif; display: none; }
        #loading { color: #ffffff; padding: 20px; text-align: center; font-family: sans-serif; display: none; }

        /* Brightness slider */
        #brightnessSlider {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          outline: none;
          z-index: 100;
        }
        #brightnessSlider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #D4AF37;
          border-radius: 50%;
          cursor: pointer;
        }
        #brightnessSlider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #D4AF37;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      </style>
    </head>
    <body>
      <div id="loading">Loading 3D Model...</div>
      <div id="error"></div>
      <input type="range" id="brightnessSlider" min="1" max="500" value="100" step="5">
      <script type="importmap">
        {
          "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
          }
        }
      </script>
      <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

        function showError(msg) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'block';
          document.getElementById('error').textContent = msg;
          window.ReactNativeWebView?.postMessage('error:' + msg);
        }

        try {
          const scene = new THREE.Scene();

          // Gray background for jewelry display
          scene.background = new THREE.Color(0x808080);

          const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 5;

          const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true
          });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(window.devicePixelRatio);
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.0;
          renderer.shadowMap.enabled = false;
          // Enable proper transparency rendering
          renderer.sortObjects = true;
          document.body.appendChild(renderer.domElement);

          // Create environment map for metallic reflections
          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          const envScene = new RoomEnvironment();
          const envMap = pmremGenerator.fromScene(envScene).texture;
          scene.environment = envMap;
          scene.environmentIntensity = 0.8;
          pmremGenerator.dispose();

          // Add OrbitControls for zoom and manual rotation
          const controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.minDistance = 2;
          controls.maxDistance = 10;
          controls.enablePan = true; // Enable panning with 2 fingers
          controls.panSpeed = 1.0;
          controls.screenSpacePanning = true; // Pan in screen space
          controls.autoRotate = true;
          controls.autoRotateSpeed = 2.0;

          // Lighting setup - extremely bright
          const ambientLight = new THREE.AmbientLight(0xffffff, 10.0);
          scene.add(ambientLight);

          const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 12.0);
          hemiLight.position.set(0, 20, 0);
          scene.add(hemiLight);

          // Store all lights for brightness control
          const allLights = [ambientLight, hemiLight];

          // Main directional lights
          const keyLight = new THREE.DirectionalLight(0xffffff, 10.0);
          keyLight.position.set(5, 5, 5);
          scene.add(keyLight);
          allLights.push(keyLight);

          const fillLight = new THREE.DirectionalLight(0xffffff, 7.0);
          fillLight.position.set(-5, 0, -5);
          scene.add(fillLight);
          allLights.push(fillLight);

          const backLight = new THREE.DirectionalLight(0xffffff, 8.0);
          backLight.position.set(0, 5, -5);
          scene.add(backLight);
          allLights.push(backLight);

          // Additional directional lights for complete even coverage
          const frontLight = new THREE.DirectionalLight(0xffffff, 9.0);
          frontLight.position.set(0, 3, 8);
          scene.add(frontLight);
          allLights.push(frontLight);

          const sideLight1 = new THREE.DirectionalLight(0xffffff, 7.0);
          sideLight1.position.set(8, 0, 0);
          scene.add(sideLight1);
          allLights.push(sideLight1);

          const sideLight2 = new THREE.DirectionalLight(0xffffff, 7.0);
          sideLight2.position.set(-8, 0, 0);
          scene.add(sideLight2);
          allLights.push(sideLight2);

          const bottomLight = new THREE.DirectionalLight(0xffffff, 8.0);
          bottomLight.position.set(0, -8, 0);
          scene.add(bottomLight);
          allLights.push(bottomLight);

          let model;
          const loader = new GLTFLoader();

          const modelUrl = '${modelUrl}';
          window.ReactNativeWebView?.postMessage('loading:' + modelUrl);

          // Add timeout for large files (30 seconds)
          const loadTimeout = setTimeout(() => {
            showError('Model loading timeout. File may be too large (14MB). Consider optimizing the model.');
          }, 30000);

          loader.load(
            modelUrl,
            (gltf) => {
              clearTimeout(loadTimeout);
              console.log('✅ 3D model loaded successfully');
              document.getElementById('loading').style.display = 'none';

              model = gltf.scene;

              // Ensure materials/textures render correctly
              model.traverse((child) => {
                if (child.isMesh) {
                  child.castShadow = false;
                  child.receiveShadow = false;

                  // Ensure geometry has proper UV coordinates for AO maps
                  if (child.geometry && !child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
                    child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
                  }

                  // Ensure materials are updated and textures are properly configured
                  if (child.material) {
                    // Handle both single materials and material arrays
                    const materials = Array.isArray(child.material) ? child.material : [child.material];

                    materials.forEach((mat) => {
                      // Ensure material updates
                      mat.needsUpdate = true;

                      // Handle transparent/translucent materials (gemstones)
                      if (mat.transparent || mat.opacity < 1.0 || mat.transmission > 0) {
                        // Reduce transparency to show color better
                        if (mat.opacity !== undefined && mat.opacity < 0.9) {
                          mat.opacity = 0.9; // Make mostly opaque
                        }
                        if (mat.transmission !== undefined && mat.transmission > 0) {
                          mat.transmission = 0; // Disable transmission
                        }
                      }

                      // Use DoubleSide for all materials
                      mat.side = THREE.DoubleSide;

                      // Ensure textures use correct color space
                      if (mat.map) {
                        mat.map.colorSpace = THREE.SRGBColorSpace;
                        mat.map.needsUpdate = true;
                      }
                      if (mat.emissiveMap) {
                        mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
                        mat.emissiveMap.needsUpdate = true;
                      }
                      if (mat.normalMap) {
                        mat.normalMap.needsUpdate = true;
                      }
                      if (mat.roughnessMap) {
                        mat.roughnessMap.needsUpdate = true;
                      }
                      if (mat.metalnessMap) {
                        mat.metalnessMap.needsUpdate = true;
                      }
                      if (mat.aoMap) {
                        mat.aoMap.needsUpdate = true;
                        if (mat.aoMapIntensity === undefined) {
                          mat.aoMapIntensity = 1.0;
                        }
                      }
                    });
                  }
                }
              });

              // Store base light intensities for brightness slider
              const baseLightIntensities = {
                lights: allLights.map(light => light.intensity)
              };

              // Brightness slider control - directly adjusts all lights
              const brightnessSlider = document.getElementById('brightnessSlider');
              brightnessSlider.addEventListener('input', (e) => {
                const multiplier = parseInt(e.target.value) / 100;
                // Apply multiplier to all lights
                allLights.forEach((light, index) => {
                  light.intensity = baseLightIntensities.lights[index] * multiplier;
                });
                // Reduce exposure at high brightness to prevent color washout
                if (multiplier > 1.0) {
                  renderer.toneMappingExposure = 1.0 / Math.sqrt(multiplier);
                } else {
                  renderer.toneMappingExposure = 1.0;
                }
              });

              // Center and scale model
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 3 / maxDim;

              model.scale.setScalar(scale);
              model.position.sub(center.multiplyScalar(scale));

              scene.add(model);
              window.ReactNativeWebView?.postMessage('loaded');
            },
            (progress) => {
              if (progress.total > 0) {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                const mbLoaded = (progress.loaded / 1024 / 1024).toFixed(1);
                const mbTotal = (progress.total / 1024 / 1024).toFixed(1);
                console.log('Loading progress:', percent + '%', mbLoaded + 'MB /' + mbTotal + 'MB');
                document.getElementById('loading').textContent = 'Loading... ' + percent + '% (' + mbLoaded + '/' + mbTotal + ' MB)';
                window.ReactNativeWebView?.postMessage('progress:' + percent);
              }
            },
            (error) => {
              clearTimeout(loadTimeout);
              console.error('❌ Error loading model:', error);
              showError('Failed to load 3D model: ' + error.message);
            }
          );

          function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          }
          animate();

          window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
          });
        } catch (e) {
          showError('Initialization error: ' + e.message);
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, height ? { height } : { flex: 1 }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        onLoadEnd={() => {
          // Don't set loading to false here - wait for the 3D model to load
        }}
        onMessage={(event) => {
          const message = event.nativeEvent.data;

          if (message === 'loaded') {
            setLoading(false);
            setErrorMsg(null);
            setProgress(100);
          } else if (message.startsWith('error:')) {
            setLoading(false);
            setErrorMsg(message.substring(6));
            console.error('3D Model error:', message.substring(6));
          } else if (message.startsWith('loading:')) {
            // Silently handle loading start
          } else if (message.startsWith('progress:')) {
            const percent = parseInt(message.substring(9));
            setProgress(percent);
            // Don't log progress updates - user can see progress on screen
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setErrorMsg('WebView failed to load');
          setLoading(false);
        }}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D4AF37" />
          {progress > 0 && progress < 100 && (
            <RNText style={styles.progressText}>{progress}%</RNText>
          )}
        </View>
      )}
      {errorMsg && (
        <View style={styles.errorOverlay}>
          <RNText style={styles.errorText}>{errorMsg}</RNText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#808080',
    borderWidth: 2,
    borderColor: '#808080',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#808080',
  },
  progressText: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#808080',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
});
