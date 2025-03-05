import React, { useEffect, useRef } from 'react';

// Fix camera rotation to ensure horizon is level
useEffect(() => {
  if (controlsRef.current) {
    // Reset any camera roll to ensure horizon is flat
    controlsRef.current.camera.rotation.z = 0;
    
    // Lock the z-rotation to prevent tilting
    const originalUpdate = controlsRef.current.update;
    controlsRef.current.update = function() {
      originalUpdate.call(this);
      this.camera.rotation.z = 0; // Keep horizon level
    };
    
    console.log("Camera roll locked to keep horizon level");
  }
}, [controlsRef.current]);

// ... existing code ...

// In the return statement, update the ground component
<group>
  {/* Ground */}
  <mesh 
    rotation={[-Math.PI / 2, 0, 0]} // Ensure ground is perfectly flat
    position={[0, 0, 0]} 
    receiveShadow
  >
    <planeGeometry args={[100, 100, 1, 1]} />
    <meshStandardMaterial color="#556643" />
  </mesh>
  
  {/* Add a grid to help with orientation */}
  <gridHelper args={[100, 100, "#666666", "#444444"]} position={[0, 0.01, 0]} />
</group>

// ... existing code ... 