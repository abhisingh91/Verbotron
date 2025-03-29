"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const Starfield3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Starfield setup
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);

    const spread = 1000;
    const depth = 2000;

    for (let i = 0; i < starCount; i++) {
      // Spherical distribution with even spread
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spread * Math.cbrt(Math.random()); // Even spherical spread
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta); // x
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
      positions[i * 3 + 2] = depth * (Math.random() - 0.5); // z

      sizes[i] = Math.random() + 0.5; // Base size
      const brightness = Math.random() * 0.4 + 5; // Brighter stars
      colors[i * 3] = brightness; // R
      colors[i * 3 + 1] = brightness; // G
      colors[i * 3 + 2] = brightness * 0.9 + 0.2; // Blue tint
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    camera.position.z = 0;

    // Animation (original walkthrough toward camera)
    const animate = () => {
      requestAnimationFrame(animate);

      // Move stars toward camera (slower speed)
      const positions = stars.geometry.attributes.position.array;
      const sizes = stars.geometry.attributes.size.array;
      for (let i = 0; i < starCount; i++) {
        positions[i * 3 + 2] -= 1; // Slower speed (was 2)

        // Respawn stars that pass the camera
        if (positions[i * 3 + 2] < -depth / 2) {
          const theta = 2 * Math.PI * Math.random();
          const phi = Math.acos(2 * Math.random() - 1);
          const r = spread * Math.cbrt(Math.random());
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = depth / 2; // Reset to far end
        }

        // Illusion: smaller when closer
        const zDist = Math.abs(positions[i * 3 + 2]); // Distance from camera
        sizes[i] = Math.max(0.5, 2 - zDist / 500); // Shrink close stars
      }
      stars.geometry.attributes.position.needsUpdate = true;
      stars.geometry.attributes.size.needsUpdate = true;

      // Subtle twinkle
      const time = Date.now() * 0.001;
      for (let i = 0; i < starCount; i++) {
        sizes[i] *= Math.sin(time + i) * 0.2 + 0.8;
      }
      stars.geometry.attributes.size.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      scene.remove(stars);
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
    />
  );
};

export default Starfield3D;