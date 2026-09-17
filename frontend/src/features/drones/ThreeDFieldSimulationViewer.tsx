import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
} from 'lucide-react';

export interface ThreeDFieldSimulationViewerProps {
  farmName?: string;
  altitude?: number;
}

export const ThreeDFieldSimulationViewer: React.FC<ThreeDFieldSimulationViewerProps> = ({
  farmName = 'West Valley Field Sector #1',
  altitude = 45,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<'health' | 'thermal' | 'water' | 'disease'>('health');
  const [droneAltitude, setDroneAltitude] = useState<number>(altitude);
  const [scanSpeed, setScanSpeed] = useState<number>(1.2);
  const [cameraView, setCameraView] = useState<'perspective' | 'top' | 'drone_chase'>('perspective');

  const animationFrameRef = useRef<number | null>(null);
  const droneGroupRef = useRef<THREE.Group | null>(null);
  const propellersRef = useRef<THREE.Mesh[]>([]);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const flightPathRef = useRef<THREE.Line | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 520;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Dark space slate
    scene.fog = new THREE.FogExp2(0x020617, 0.015);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 35, 45);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x10b981, 1.2);
    sunLight.position.set(30, 50, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 1, 50);
    blueLight.position.set(-20, 15, -20);
    scene.add(blueLight);

    // 5. 3D Terrain Plane with Elevation Displacement
    const terrainGeo = new THREE.PlaneGeometry(60, 60, 48, 48);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const zNoise = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 2.2 + Math.sin(x * 0.05) * 1.5;
      posAttr.setZ(i, zNoise);
    }
    terrainGeo.computeVertexNormals();

    // Canvas procedural texture for multispectral overlays
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 240);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(0.4, '#84cc16');
      grad.addColorStop(0.7, '#eab308');
      grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 512; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
    }

    const terrainTexture = new THREE.CanvasTexture(canvas);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: false,
      flatShading: true,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Grid Helper Guide
    const gridHelper = new THREE.GridHelper(70, 28, 0x10b981, 0x334155);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 6. 3D Flight Path Trajectory Curve
    const pathPoints = [
      new THREE.Vector3(-22, 12, -22),
      new THREE.Vector3(22, 14, -18),
      new THREE.Vector3(20, 12, 20),
      new THREE.Vector3(-20, 15, 18),
      new THREE.Vector3(-22, 12, -22),
    ];
    const curve = new THREE.CatmullRomCurve3(pathPoints, true);
    const curvePoints = curve.getPoints(100);
    const flightGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const flightMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1,
      gapSize: 0.5,
    });
    const flightPathLine = new THREE.Line(flightGeo, flightMat);
    flightPathLine.computeLineDistances();
    scene.add(flightPathLine);
    flightPathRef.current = flightPathLine;

    // 7. 3D Drone Model Assembly
    const droneGroup = new THREE.Group();

    // Central Drone Body Shell
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.6, 2.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    droneGroup.add(bodyMesh);

    // Camera Sensor Dome
    const camDomeGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const camDomeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x047857 });
    const camDomeMesh = new THREE.Mesh(camDomeGeo, camDomeMat);
    camDomeMesh.position.set(0, -0.4, 0.8);
    droneGroup.add(camDomeMesh);

    // 4 Quadcopter Motor Arms & Propellers
    const props: THREE.Mesh[] = [];
    const armOffsets = [
      { x: 2, z: 2 },
      { x: -2, z: 2 },
      { x: 2, z: -2 },
      { x: -2, z: -2 },
    ];

    armOffsets.forEach((offset) => {
      // Arm Cylinder
      const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8);
      const armMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const armMesh = new THREE.Mesh(armGeo, armMat);
      armMesh.rotation.z = Math.PI / 2;
      armMesh.position.set(offset.x / 2, 0, offset.z / 2);
      droneGroup.add(armMesh);

      // Motor Cap
      const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4);
      const motorMat = new THREE.MeshStandardMaterial({ color: 0x020617 });
      const motorMesh = new THREE.Mesh(motorGeo, motorMat);
      motorMesh.position.set(offset.x, 0.2, offset.z);
      droneGroup.add(motorMesh);

      // Propeller Blade
      const propGeo = new THREE.BoxGeometry(2.2, 0.04, 0.25);
      const propMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
      const propMesh = new THREE.Mesh(propGeo, propMat);
      propMesh.position.set(offset.x, 0.4, offset.z);
      droneGroup.add(propMesh);
      props.push(propMesh);
    });

    propellersRef.current = props;

    // Laser Scan Cone Beam
    const coneGeo = new THREE.ConeGeometry(8, 14, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.y = -7;
    coneMesh.rotation.x = Math.PI;
    droneGroup.add(coneMesh);

    scene.add(droneGroup);
    droneGroupRef.current = droneGroup;

    // 8. Animation Render Loop
    let progress = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (isPlaying) {
        progress += 0.002 * scanSpeed;
        if (progress > 1) progress = 0;

        // Move Drone along Catmull-Rom Curve
        const point = curve.getPoint(progress);
        const tangent = curve.getTangent(progress);

        droneGroup.position.set(point.x, droneAltitude / 3, point.z);
        droneGroup.lookAt(point.x + tangent.x, point.y + tangent.y, point.z + tangent.z);

        // Spin Propellers
        props.forEach((p, idx) => {
          p.rotation.y += (idx % 2 === 0 ? 0.4 : -0.4);
        });

        // Rotate Terrain slightly for dynamic feel
        if (terrainMeshRef.current) {
          terrainMeshRef.current.rotation.z += 0.0003;
        }

        // Handle Camera Viewpoints
        if (cameraRef.current) {
          if (cameraView === 'top') {
            cameraRef.current.position.set(0, 70, 0.1);
            cameraRef.current.lookAt(0, 0, 0);
          } else if (cameraView === 'drone_chase') {
            cameraRef.current.position.set(point.x - tangent.x * 12, point.y + 6, point.z - tangent.z * 12);
            cameraRef.current.lookAt(point.x, point.y, point.z);
          } else {
            cameraRef.current.position.set(35 * Math.sin(progress * Math.PI * 2), 35, 45 * Math.cos(progress * Math.PI * 2));
            cameraRef.current.lookAt(0, 0, 0);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Window Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isPlaying, droneAltitude, scanSpeed, cameraView]);

  return (
    <div className="p-6 rounded-3xl bg-agri-900 border border-slate-800 shadow-2xl space-y-4 backdrop-blur-xl relative overflow-hidden">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-agri-500/15 border border-agri-500/25 text-agri-400 text-[10px] font-mono font-bold">
              THREE.JS WEBGL SIMULATOR
            </span>
            <h3 className="font-extrabold text-white text-base">3D Drone Telemetry & Crop Field Simulator</h3>
          </div>
          <p className="text-xs text-agri-400/70">
            Real-time WebGL 3D flight trajectory, multispectral canopy mesh, and quadcopter sensor payload.
          </p>
        </div>

        {/* View Camera Mode Pills */}
        <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1 text-xs">
          {[
            { key: 'perspective', label: '3D Orbit View' },
            { key: 'top', label: '🛰️ Top Satellite View' },
            { key: 'drone_chase', label: '🚁 Drone Chase Cam' },
          ].map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setCameraView(mode.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                cameraView === mode.key
                  ? 'bg-agri-500 text-slate-950 shadow-sm'
                  : 'text-agri-400/70 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-800/90 bg-slate-950 shadow-inner select-none"
      >
        {/* Floating Top-Left Telemetry HUD Badge */}
        <div className="absolute top-4 left-4 z-10 p-3.5 rounded-2xl bg-slate-950/85 border border-slate-800 text-white backdrop-blur space-y-1 shadow-2xl">
          <div className="flex items-center justify-between gap-3 text-xs font-bold">
            <span className="text-agri-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE 3D SIMULATION</span>
            </span>
            <span className="text-agri-400/70 font-mono text-[10px]">MSN-2026-3D</span>
          </div>
          <p className="text-xs font-extrabold text-agri-200">{farmName}</p>
          <div className="flex items-center gap-3 text-[11px] font-mono text-agri-400/70 pt-1">
            <span>ALT: <strong className="text-agri-400">{droneAltitude}m</strong></span>
            <span>•</span>
            <span>SPEED: <strong className="text-blue-400">{(scanSpeed * 15).toFixed(1)} km/h</strong></span>
          </div>
        </div>

        {/* Floating Bottom-Left Layer Switcher */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-agri-950/90 border border-slate-800 text-xs backdrop-blur shadow-2xl">
          {[
            { key: 'health', label: '🌿 Health' },
            { key: 'thermal', label: '🌡️ Thermal' },
            { key: 'water', label: '💧 Water' },
            { key: 'disease', label: '🔴 Disease' },
          ].map((layer) => (
            <button
              key={layer.key}
              type="button"
              onClick={() => setActiveLayer(layer.key as any)}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                activeLayer === layer.key
                  ? 'bg-agri-800 text-agri-400 border border-agri-500/30 shadow-sm'
                  : 'text-agri-400/70 hover:text-white'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {/* Floating Bottom-Right Simulation Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-xl bg-agri-500 hover:bg-agri-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-agri-500/15 active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause 3D Flight' : 'Resume Flight'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Control Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-agri-950/80 border border-slate-800/80 text-xs backdrop-blur">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-agri-300">
            <span className="font-bold">Drone Flight Altitude:</span>
            <span className="font-mono text-agri-400 font-bold">{droneAltitude} meters</span>
          </div>
          <input
            type="range"
            min="20"
            max="90"
            value={droneAltitude}
            onChange={(e) => setDroneAltitude(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-agri-300">
            <span className="font-bold">Scan Flight Velocity:</span>
            <span className="font-mono text-blue-400 font-bold">{(scanSpeed * 15).toFixed(1)} km/h</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="3.0"
            step="0.1"
            value={scanSpeed}
            onChange={(e) => setScanSpeed(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
