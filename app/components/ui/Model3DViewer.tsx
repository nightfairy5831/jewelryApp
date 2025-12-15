import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Model3DViewerProps {
  modelUrl: string;
  style?: any;
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({ modelUrl, style }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const animationFrameRef = useRef<number>();
  const setLoadingRef = useRef(setLoading);

  // Keep ref updated
  useEffect(() => {
    setLoadingRef.current = setLoading;
  }, [setLoading]);

  useEffect(() => {
    // For web platform, expo-gl doesn't work well
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [modelUrl]);

  const onContextCreate = async (gl: any) => {
    // Hide loading spinner immediately since GL context is ready
    setLoading(false);

    try {
      const { Renderer, loadTextureAsync } = await import('expo-three');
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');

      // Setup renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x1a1a2e, 1); // Dark background to see the model

      // Setup scene
      const scene = new THREE.Scene();

      // Setup camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.z = 3;

      // Add lights - brighter to ensure visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight2.position.set(-5, -5, -5);
      scene.add(directionalLight2);

      // Load GLB model with Promise wrapper
      let model: any = null;

      try {
        // Fetch the model file
        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        // Parse the GLB file (wrapped in Promise for cleaner async/await)
        const loader = new GLTFLoader();
        const gltf: any = await new Promise((resolve, reject) => {
          loader.parse(
            arrayBuffer,
            '',
            (gltf: any) => resolve(gltf),
            (err: any) => reject(err)
          );
        });

        model = gltf.scene;

        // Apply bright material to ensure visibility
        model.traverse((child: any) => {
          if (child.isMesh) {
            // Always replace material with a bright visible one
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffd700, // Gold color - very visible
              metalness: 0.8,
              roughness: 0.2,
              emissive: 0x444444, // Slight glow
            });
          }
        });

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);

        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);

      } catch (err: any) {
        setError(true);
      }

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // Rotate model
        if (model) {
          model.rotation.y += 0.01;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
    } catch (err: any) {
      setError(true);
      setLoading(false);
    }
  };

  // Web platform fallback - show placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webFallback, style]}>
        <Ionicons name="cube-outline" size={64} color="#9ca3af" />
        <Text style={styles.webText}>3D Model Viewer</Text>
        <Text style={styles.webSubtext}>(Native app only)</Text>
      </View>
    );
  }

  // Native platforms - render GLView
  const GLViewComponent = require('expo-gl').GLView;

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading 3D Model...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load 3D model</Text>
        </View>
      )}
      <GLViewComponent
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  glView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    zIndex: 10,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
  },
  webFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  webSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});
