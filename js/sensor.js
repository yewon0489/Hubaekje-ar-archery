/**
 * Device Orientation Sensor Controller
 * Implements Quaternion tracking with yaw-anchor stabilization and adaptive low-pass filter.
 */
const degToRad = Math.PI / 180;
let initialBaseQ = null;
let latestRawQ = null;
let sensorReady = false;

const zee = new THREE.Vector3(0, 0, 1);
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -PI/2 around X

function getOrientationQuaternion(alpha, beta, gamma, orient = 0) {
  const _alpha = alpha ? alpha * degToRad : 0;
  const _beta = beta ? beta * degToRad : 0;
  const _gamma = gamma ? gamma * degToRad : 0;
  const _orient = orient ? orient * degToRad : 0;

  const euler = new THREE.Euler(_beta, _alpha, -_gamma, 'YXZ');
  const q = new THREE.Quaternion().setFromEuler(euler);
  q.multiply(q1);

  const q0 = new THREE.Quaternion().setFromAxisAngle(zee, -_orient);
  q.multiply(q0);

  return q;
}

// Extracts horizontal yaw angle and creates inverse anchor quaternion
function makeYawAnchor(q) {
  const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -euler.y);
}

function onDeviceOrientation(e) {
  if (e.beta === null) return;

  // Prioritize gyroscope alpha over noisy geomagnetic compass for stable aiming
  let heading = 0;
  if (e.alpha !== null && e.alpha !== undefined) {
    heading = e.alpha;
  } else if (e.webkitCompassHeading !== undefined) {
    heading = 360 - e.webkitCompassHeading;
  }

  const screenOrient = (window.screen && window.screen.orientation && window.screen.orientation.angle !== undefined)
    ? window.screen.orientation.angle
    : (window.orientation || 0);

  latestRawQ = getOrientationQuaternion(heading, e.beta, e.gamma, screenOrient);
  sensorReady = true;

  if (!initialBaseQ && latestRawQ) {
    initialBaseQ = makeYawAnchor(latestRawQ);
  }
}

// Re-anchors current horizontal heading as origin (0 deg)
function resetSensorAnchor() {
  if (latestRawQ) {
    initialBaseQ = makeYawAnchor(latestRawQ);
  } else {
    initialBaseQ = null;
  }
}

// Adaptive low-pass filter: smooths jitter during fine aiming while preserving responsiveness during pans
function updateCameraOrientation(camera, dt = 0.016, baseSpeed = 11) {
  if (latestRawQ && initialBaseQ) {
    const targetQ = new THREE.Quaternion().multiplyQuaternions(initialBaseQ, latestRawQ);

    const angleDiff = camera.quaternion.angleTo(targetQ);

    let speed = baseSpeed;
    if (angleDiff < 0.012) {
      // Fine aiming jitter zone: increase damping
      speed = baseSpeed * 0.42;
    } else if (angleDiff > 0.06) {
      // Fast panning zone: follow target immediately
      speed = baseSpeed * 1.7;
    }

    const lerpFactor = 1 - Math.exp(-speed * dt);
    camera.quaternion.slerp(targetQ, Math.min(1.0, Math.max(0.02, lerpFactor)));
  }
}
