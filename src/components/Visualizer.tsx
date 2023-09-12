import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import * as Tone from "tone";

const Visualizer: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 1, 32));
  const rendererRef = useRef(new THREE.WebGLRenderer());
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const player = useRef(new Tone.Player());
  const analyser = useRef(new Tone.Analyser("waveform", 256));

  useEffect(() => {
    const handleResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("visualizer")?.appendChild(rendererRef.current.domElement);

    const positions = new Float32Array(256 * 3);
    const colors = new Float32Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const color = new THREE.Color(Math.random() * 0xffffff);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({ vertexColors: true });
    linesRef.current = new THREE.LineSegments(geometry, material);
    sceneRef.current.add(linesRef.current);

    cameraRef.current.position.z = 5;

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const startVisualizer = async () => {
    await Tone.start();
    player.current.connect(analyser.current);
    Tone.connect(player.current, Tone.Destination);

    try {
      await player.current.load("/ollulleru.mp3");
      await player.current.start();
    } catch (error) {
      console.error("An error occurred:", error);
    }

    const loop = () => {
      animationFrameId.current = requestAnimationFrame(loop);
      const waveform = analyser.current.getValue() as Float32Array;

      if (waveform && linesRef.current) {
        const geometry = linesRef.current.geometry as THREE.BufferGeometry;
        const positions = geometry.attributes.position.array as Float32Array;
        const randomValue = Math.floor(Math.random() * (10 - 1 + 1)) + 1;

        for (let i = 0; i < positions.length; i += randomValue) {
          positions[i] = waveform[i % waveform.length] * 1;
        }

        geometry.attributes.position.needsUpdate = true;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    loop();
  };

  const stopVisualizer = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    player.current.stop();
  };

  useEffect(() => {
    if (isStarted) {
      startVisualizer();
    } else {
      stopVisualizer();
    }
  }, [isStarted]);

  return (
    <div id="visualizer-container">
      <button onClick={() => setIsStarted(!isStarted)}>
        {isStarted ? "Stop Visualizer" : "Start Visualizer"}
      </button>
      <div id="visualizer"></div>
    </div>
  );
};

export default Visualizer;
