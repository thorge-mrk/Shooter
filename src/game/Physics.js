export function resolveCylinderCollisions(pos, radius, height, colliders, groundFnOrY = 0) {
  let floorY = typeof groundFnOrY === 'function' ? groundFnOrY(pos.x, pos.z) : groundFnOrY;
  const footY = pos.y - height;

  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    const minX = c.minX - radius;
    const maxX = c.maxX + radius;
    const minZ = c.minZ - radius;
    const maxZ = c.maxZ + radius;

    if (pos.x <= minX || pos.x >= maxX || pos.z <= minZ || pos.z >= maxZ) {
      continue;
    }

    if (footY >= c.maxY - 0.55) {
      if (c.maxY > floorY) floorY = c.maxY;
      continue;
    }

    if (pos.y <= c.minY || footY >= c.maxY) {
      continue;
    }

    const dxLeft = pos.x - minX;
    const dxRight = maxX - pos.x;
    const dzBack = pos.z - minZ;
    const dzFront = maxZ - pos.z;

    const minOverlap = Math.min(dxLeft, dxRight, dzBack, dzFront);
    if (minOverlap === dxLeft) pos.x = minX;
    else if (minOverlap === dxRight) pos.x = maxX;
    else if (minOverlap === dzBack) pos.z = minZ;
    else pos.z = maxZ;
  }

  return floorY;
}

export function resolveCircleCollisionsXZ(pos, radius, colliders) {
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (c.maxY < 0.25) continue;

    const closestX = Math.max(c.minX, Math.min(pos.x, c.maxX));
    const closestZ = Math.max(c.minZ, Math.min(pos.z, c.maxZ));

    const dx = pos.x - closestX;
    const dz = pos.z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const push = radius - dist;
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      } else {
        const dL = pos.x - c.minX;
        const dR = c.maxX - pos.x;
        const dB = pos.z - c.minZ;
        const dF = c.maxZ - pos.z;
        const m = Math.min(dL, dR, dB, dF);
        if (m === dL) pos.x = c.minX - radius;
        else if (m === dR) pos.x = c.maxX + radius;
        else if (m === dB) pos.z = c.minZ - radius;
        else pos.z = c.maxZ + radius;
      }
    }
  }
}

export function bounceSphereAgainstColliders(pos, vel, radius, colliders, restitution = 0.45, groundFnOrY = 0) {
  let bounced = false;
  const floorY = typeof groundFnOrY === 'function' ? groundFnOrY(pos.x, pos.z) : groundFnOrY;
  if (pos.y < floorY + radius) {
    pos.y = floorY + radius;
    if (Math.abs(vel.y) > 0.6) bounced = true;
    vel.y = -vel.y * restitution;
    vel.x *= 0.82;
    vel.z *= 0.82;
  }

  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
    const cy = Math.max(c.minY, Math.min(pos.y, c.maxY));
    const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));

    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const dz = pos.z - cz;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < radius * radius && distSq > 1e-8) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;

      pos.x = cx + nx * radius;
      pos.y = cy + ny * radius;
      pos.z = cz + nz * radius;

      const dot = vel.x * nx + vel.y * ny + vel.z * nz;
      if (dot < 0) {
        vel.x -= (1 + restitution) * dot * nx;
        vel.y -= (1 + restitution) * dot * ny;
        vel.z -= (1 + restitution) * dot * nz;
        bounced = true;
      }
    }
  }
  return bounced;
}
