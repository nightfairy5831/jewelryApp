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

  console.log('Model3DViewer rendering with URL:', modelUrl);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        body {
          margin: 0;
          overflow: hidden;
          background: #e8e8e8;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #canvas { width: 100%; height: 100vh; display: block; }
        #error { color: red; padding: 20px; text-align: center; font-family: sans-serif; display: none; }
        #loading { color: #666; padding: 20px; text-align: center; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div id="loading">Loading 3D Model...</div>
      <div id="error"></div>
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

        function showError(msg) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'block';
          document.getElementById('error').textContent = msg;
          window.ReactNativeWebView?.postMessage('error:' + msg);
        }

        try {
          const scene = new THREE.Scene();

          // Light gray background to make gold model pop
          scene.background = new THREE.Color(0xe8e8e8);

          const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 5;

          const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
          });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          document.body.appendChild(renderer.domElement);

          // Add OrbitControls for zoom and manual rotation
          const controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;
          controls.minDistance = 2;
          controls.maxDistance = 10;
          controls.enablePan = false;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 2.0;

          // MAXIMUM ambient lighting for brightest base illumination
          const ambientLight = new THREE.AmbientLight(0xffffff, 4.0);
          scene.add(ambientLight);

          // MAXIMUM hemisphere light for better diffusion
          const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 3.5);
          scene.add(hemiLight);

          // MAXIMUM directional lights with wider coverage area and shadows
          const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
          dirLight1.position.set(5, 5, 5);
          dirLight1.castShadow = true;
          dirLight1.shadow.mapSize.width = 2048;
          dirLight1.shadow.mapSize.height = 2048;
          dirLight1.shadow.camera.near = 0.5;
          dirLight1.shadow.camera.far = 50;
          dirLight1.shadow.camera.left = -10;
          dirLight1.shadow.camera.right = 10;
          dirLight1.shadow.camera.top = 10;
          dirLight1.shadow.camera.bottom = -10;
          scene.add(dirLight1);

          const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.8);
          dirLight2.position.set(-5, 5, 5);
          scene.add(dirLight2);

          const dirLight3 = new THREE.DirectionalLight(0xffffff, 1.8);
          dirLight3.position.set(5, -5, 5);
          scene.add(dirLight3);

          const dirLight4 = new THREE.DirectionalLight(0xffffff, 1.8);
          dirLight4.position.set(-5, -5, 5);
          scene.add(dirLight4);

          const dirLight5 = new THREE.DirectionalLight(0xffffff, 1.5);
          dirLight5.position.set(0, 0, -5);
          scene.add(dirLight5);

          // Add ground plane to receive shadows
          const groundGeometry = new THREE.PlaneGeometry(20, 20);
          const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
          const ground = new THREE.Mesh(groundGeometry, groundMaterial);
          ground.rotation.x = -Math.PI / 2;
          ground.position.y = -2;
          ground.receiveShadow = true;
          scene.add(ground);

          let model;
          const loader = new GLTFLoader();

          console.log('Attempting to load model from: ${modelUrl}');
          window.ReactNativeWebView?.postMessage('loading:${modelUrl}');

          // Add timeout for large files (30 seconds)
          const loadTimeout = setTimeout(() => {
            showError('Model loading timeout. File may be too large (14MB). Consider optimizing the model.');
          }, 30000);

          loader.load(
            '${modelUrl}',
            (gltf) => {
              clearTimeout(loadTimeout);
              console.log('✅ 3D model loaded successfully');
              document.getElementById('loading').style.display = 'none';

              model = gltf.scene;

              // Enable shadows on model
              model.traverse((child) => {
                if (child.isMesh) {
                  console.log('Mesh:', child.name, 'Color:', child.material?.color);
                  child.castShadow = true;
                  child.receiveShadow = true;
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
          console.log('WebView loaded');
          // Don't set loading to false here - wait for the 3D model to load
        }}
        onMessage={(event) => {
          const message = event.nativeEvent.data;
          console.log('WebView message:', message);
          if (message === 'loaded') {
            setLoading(false);
            setErrorMsg(null);
            setProgress(100);
          } else if (message.startsWith('error:')) {
            setLoading(false);
            setErrorMsg(message.substring(6));
          } else if (message.startsWith('loading:')) {
            console.log('Starting to load:', message.substring(8));
          } else if (message.startsWith('progress:')) {
            const percent = parseInt(message.substring(9));
            setProgress(percent);
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
          <ActivityIndicator size="large" color="#FFCC00" />
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
    borderWidth: 2,
    borderColor: '#d1d5db',
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
    backgroundColor: '#f5f5f5',
  },
  progressText: {
    marginTop: 12,
    color: '#666',
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
});
