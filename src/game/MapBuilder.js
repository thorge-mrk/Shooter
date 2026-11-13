import * as THREE from 'three';
import { createSkyDome, createHarborWater, createMultiLayerTerrainMaterial } from './Shaders.js';
import { buildTerrainGeometry, getTerrainHeight } from './Terrain.js';
import { createBeveledBox } from './GeometryUtils.js';
import { createQualityMaterial } from './Textures.js';
import {
  getArchitecturePalette,
  addDetailedColumn,
  addMonumentalArchway,
  addWalkableBridgeArch,
  addDetailedBuilding,
  addControlTerminal3D,
  addMedAmmoStation3D,
  addMilitaryCrate,
  addRibbedBarrelCluster,
  addArmoredWreck,
  addIndustrialGenerator,
  addFloodlightTower,
  addJerseyBarrier,
  addPipeRun,
  addCargoShip,
  addForklift,
  addGantryCrane,
  addTimberJetty,
  addBrokenColumnRuin,
  addDesertSculpture,
  addPotteryCluster,
  addSandDuneMound,
  addSnowcatVehicle,
  addIceSpireCluster
} from './ArchitectureBuilder.js';
import { populateMapNature } from './VegetationBuilder.js';

export const MAP_CONFIGS = {
  harbor: {
    id: 'harbor',
    name: 'Sunlit Cargo Harbor',
    sky: {
      zenithColor: 0x26547c,
      horizonColor: 0xf4a261,
      groundColor: 0x1b263b,
      sunColor: 0xffcf87,
      sunGlow: 1.25
    },
    fogColor: 0xd99b72,
    fogDensity: 0.0024,
    sunColor: 0xffd296,
    sunIntensity: 2.48,
    sunPos: [84, 58, 62],
    hemiSky: 0xfde2c4,
    hemiGround: 0x3f4c5c,
    hemiIntensity: 0.98,
    groundTex: 'harborDeck',
    wallTex: 'concrete',
    size: 230,
    spawns: [
      { x: -42, z: -46, yaw: -Math.PI * 0.75 },
      { x: 42, z: 38, yaw: Math.PI * 0.25 },
      { x: 42, z: -46, yaw: Math.PI * 0.75 },
      { x: -42, z: 38, yaw: -Math.PI * 0.25 },
      { x: 0, z: -52, yaw: Math.PI },
      { x: 68, z: 12, yaw: Math.PI * 0.5 },
      { x: -68, z: -8, yaw: -Math.PI * 0.5 },
      { x: 0, z: 62, yaw: 0 }
    ],
    tankPads: [
      { x: -34, z: 0, yaw: -Math.PI / 2 },
      { x: 34, z: 0, yaw: Math.PI / 2 }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: 0, z: 28 },
      { x: 0, z: -28 },
      { x: -24, z: -22 },
      { x: 64, z: 2 },
      { x: -56, z: 18 }
    ],
    blocks: [
      // Central tactical command dais & stepable cover crates
      { x: 0, y: 1.3, z: 0, w: 6.4, h: 2.6, d: 6.4, mat: 'concrete', stepable: true },
      { x: -4.8, y: 0.65, z: 0, w: 3.0, h: 1.3, d: 3.2, mat: 'crateWood', stepable: true },
      { x: 4.8, y: 0.65, z: 0, w: 3.0, h: 1.3, d: 3.2, mat: 'crateWood', stepable: true },
      // Inner container yard stacks (1-tier and 2-tier)
      { x: -15, y: 1.6, z: -16, w: 3.2, h: 3.2, d: 8.8, mat: 'containerBlue' },
      { x: 15, y: 1.6, z: 16, w: 3.2, h: 3.2, d: 8.8, mat: 'containerRust' },
      { x: -15, y: 1.6, z: 17, w: 8.8, h: 3.2, d: 3.2, mat: 'containerYellow' },
      { x: 15, y: 1.6, z: -17, w: 8.8, h: 3.2, d: 3.2, mat: 'containerOlive' },
      // Towering 2-story & 3-story shipping container stacks in the North & West cargo berths
      { x: -28, y: 1.6, z: -34, w: 8.6, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: -28, y: 4.8, z: -34, w: 8.6, h: 3.2, d: 3.2, mat: 'containerYellow' },
      { x: -28, y: 8.0, z: -34, w: 8.6, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 28, y: 1.6, z: -34, w: 8.6, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 28, y: 4.8, z: -34, w: 8.6, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: 28, y: 8.0, z: -34, w: 8.6, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: -36, y: 1.6, z: 26, w: 8.6, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: -36, y: 4.8, z: 26, w: 8.6, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 34, y: 1.6, z: 26, w: 8.6, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: 34, y: 4.8, z: 26, w: 8.6, h: 3.2, d: 3.2, mat: 'containerYellow' },
      // Outer dockyard container alleys
      { x: -42, y: 1.6, z: -14, w: 3.2, h: 3.2, d: 8.8, mat: 'containerYellow' },
      { x: -42, y: 4.8, z: -14, w: 3.2, h: 3.2, d: 8.8, mat: 'containerRust' },
      { x: 42, y: 1.6, z: -14, w: 3.2, h: 3.2, d: 8.8, mat: 'containerBlue' },
      { x: -14, y: 1.6, z: -48, w: 8.8, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: 14, y: 1.6, z: -48, w: 8.8, h: 3.2, d: 3.2, mat: 'containerYellow' },
      // Stepable wooden military crates & K-rail Jersey barriers
      { x: -8.5, y: 0.75, z: -8.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 8.5, y: 0.75, z: 8.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 8.5, y: 0.75, z: -8.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -8.5, y: 0.75, z: 8.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -24, y: 0.7, z: 10, w: 4.2, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 24, y: 0.7, z: -10, w: 4.2, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 48, y: 0.7, z: -8, w: 1.2, h: 1.4, d: 4.2, mat: 'concrete' },
      { x: 48, y: 0.7, z: 16, w: 1.2, h: 1.4, d: 4.2, mat: 'concrete' }
    ],
    buildings: [
      { type: 'harborOffice', x: 0, z: -36, yaw: 0 },
      { type: 'harborOffice', x: 0, z: 36, yaw: Math.PI },
      { type: 'portWarehouse', x: -38, z: -4, yaw: Math.PI / 2 },
      { type: 'portWarehouse', x: 38, z: -28, yaw: -Math.PI / 2 },
      { type: 'guardTower', x: -46, z: 42, yaw: Math.PI * 0.25 },
      { type: 'guardTower', x: 46, z: 42, yaw: -Math.PI * 0.25 }
    ],
    // Strictly NO classical fluted columns or stone temple ruins in the Harbor!
    columns: [],
    archways: [],
    bridges: [
      { x: -11.5, z: 0, yaw: Math.PI / 2, span: 5.0, style: 'steel' },
      { x: 11.5, z: 0, yaw: -Math.PI / 2, span: 5.0, style: 'steel' },
      { x: 0, z: -20, yaw: 0, span: 5.2, style: 'steel' }
    ],
    forklifts: [
      { x: -21, z: -26, yaw: 0.45, withLoad: true, forkHeight: 0.42 },
      { x: 22, z: -25, yaw: -2.35, withLoad: true, forkHeight: 0.95 },
      { x: -29, z: 14, yaw: 1.25, withLoad: true, forkHeight: 0.35 },
      { x: 26, z: 18, yaw: -1.55, withLoad: false, forkHeight: 0.28 },
      { x: -6, z: -44, yaw: 0.15, withLoad: true, forkHeight: 0.65 },
      { x: 42, z: 6, yaw: -0.85, withLoad: true, forkHeight: 0.38 }
    ],
    gantryCranes: [
      { x: -26, z: -50, yaw: 0, spanZ: 24, height: 22 },
      { x: 26, z: -50, yaw: 0, spanZ: 24, height: 22 }
    ],
    jetties: [
      { x: 84, z: -12, yaw: 0, length: 18, width: 3.4 },
      { x: 86, z: 28, yaw: -0.12, length: 16, width: 3.4 }
    ]
  },

  desert: {
    id: 'desert',
    name: 'Desert Dunes & Sunken Temple Outpost',
    sky: {
      zenithColor: 0x2c6aa0,
      horizonColor: 0xf7d69e,
      groundColor: 0xc2a16b,
      sunColor: 0xfff0c2,
      sunGlow: 1.18
    },
    fogColor: 0xe6cfa4,
    fogDensity: 0.0025,
    sunColor: 0xffe6b3,
    sunIntensity: 2.4,
    sunPos: [78, 76, 48],
    hemiSky: 0xfff3d6,
    hemiGround: 0x9c7b4d,
    hemiIntensity: 0.96,
    groundTex: 'sandstone',
    wallTex: 'sandstone',
    size: 250,
    spawns: [
      { x: -48, z: -48, yaw: -Math.PI * 0.75 },
      { x: 48, z: 48, yaw: Math.PI * 0.25 },
      { x: 48, z: -48, yaw: Math.PI * 0.75 },
      { x: -48, z: 48, yaw: -Math.PI * 0.25 },
      { x: 0, z: -58, yaw: Math.PI },
      { x: 0, z: 58, yaw: 0 },
      { x: -68, z: 0, yaw: -Math.PI * 0.5 },
      { x: 68, z: 0, yaw: Math.PI * 0.5 }
    ],
    tankPads: [
      { x: -32, z: 0, yaw: -Math.PI / 2 },
      { x: 32, z: 0, yaw: Math.PI / 2 }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: 0, z: 28 },
      { x: 0, z: -28 },
      { x: -28, z: 24 },
      { x: 28, z: -24 },
      { x: 56, z: 0 }
    ],
    blocks: [
      // Sunken Temple Central Altar Platform & Sandstone Cover Blocks (NO shipping containers in the ancient temple!)
      { x: 0, y: 1.2, z: 0, w: 6.6, h: 2.4, d: 6.6, mat: 'sandstone', stepable: true },
      { x: -14, y: 1.1, z: -14, w: 3.2, h: 2.2, d: 6.8, mat: 'sandstone', stepable: true },
      { x: 14, y: 1.1, z: 14, w: 3.2, h: 2.2, d: 6.8, mat: 'sandstone', stepable: true },
      { x: 16, y: 1.1, z: -16, w: 6.8, h: 2.2, d: 3.2, mat: 'sandstone', stepable: true },
      { x: -16, y: 1.1, z: 16, w: 6.8, h: 2.2, d: 3.2, mat: 'sandstone', stepable: true },
      { x: -8, y: 0.75, z: 8, w: 2.3, h: 1.5, d: 2.3, mat: 'crateWood', stepable: true },
      { x: 8, y: 0.75, z: -8, w: 2.3, h: 1.5, d: 2.3, mat: 'crateWood', stepable: true },
      { x: -8, y: 0.75, z: -8, w: 2.3, h: 1.5, d: 2.3, mat: 'crateWood', stepable: true },
      { x: 8, y: 0.75, z: 8, w: 2.3, h: 1.5, d: 2.3, mat: 'crateWood', stepable: true }
    ],
    buildings: [
      { type: 'desertHouse', x: 0, z: -38, yaw: 0 },
      { type: 'desertHouse', x: 0, z: 38, yaw: Math.PI },
      { type: 'desertFort', x: -38, z: -24, yaw: Math.PI / 2 },
      { type: 'desertFort', x: 38, z: 24, yaw: -Math.PI / 2 },
      { type: 'desertHouse', x: -46, z: 28, yaw: Math.PI / 2 },
      { type: 'desertFort', x: 46, z: -28, yaw: -Math.PI / 2 }
    ],
    // Grand Sunken Temple Colonnade & Outer Hypostyle Hall (Sandstone Fluted Columns)
    columns: [
      { x: -6.2, z: -22.5, style: 'sandstone' },
      { x: 6.2, z: -22.5, style: 'sandstone' },
      { x: -6.2, z: 22.5, style: 'sandstone' },
      { x: 6.2, z: 22.5, style: 'sandstone' },
      { x: -20.5, z: -8.5, style: 'sandstone' },
      { x: 20.5, z: 8.5, style: 'sandstone' },
      { x: -20.5, z: 8.5, style: 'sandstone' },
      { x: 20.5, z: -8.5, style: 'sandstone' },
      { x: -12.5, z: -30.5, style: 'sandstone' },
      { x: 12.5, z: -30.5, style: 'sandstone' },
      { x: -12.5, z: 30.5, style: 'sandstone' },
      { x: 12.5, z: 30.5, style: 'sandstone' },
      { x: -32.0, z: -12.0, style: 'sandstone' },
      { x: 32.0, z: 12.0, style: 'sandstone' },
      { x: -32.0, z: 12.0, style: 'sandstone' },
      { x: 32.0, z: -12.0, style: 'sandstone' }
    ],
    brokenColumns: [
      { x: -18.5, z: -22.0, yaw: 0.42 },
      { x: 18.5, z: 22.0, yaw: -2.65 },
      { x: -26.0, z: 18.0, yaw: 1.15 },
      { x: 26.0, z: -18.0, yaw: -1.85 },
      { x: -42.0, z: -8.0, yaw: 0.25 },
      { x: 42.0, z: 8.0, yaw: -2.85 },
      { x: -10.0, z: -48.0, yaw: 0.78 },
      { x: 10.0, z: 48.0, yaw: -2.35 }
    ],
    archways: [
      { x: 0, z: -16.5, yaw: 0, span: 5.2, height: 4.8, style: 'sandstone' },
      { x: 0, z: 16.5, yaw: Math.PI, span: 5.2, height: 4.8, style: 'sandstone' },
      { x: -24.5, z: 0, yaw: Math.PI / 2, span: 5.2, height: 4.8, style: 'sandstone' },
      { x: 24.5, z: 0, yaw: -Math.PI / 2, span: 5.2, height: 4.8, style: 'sandstone' }
    ],
    bridges: [
      { x: 0, z: -9.5, yaw: 0, span: 5.0, style: 'sandstone' },
      { x: 0, z: 9.5, yaw: Math.PI, span: 5.0, style: 'sandstone' }
    ],
    sculptures: [
      // Twin Carved Obelisks with gold/bronze pyramidion tips flanking North & South Temple Pylons
      { x: -9.5, z: -18.5, yaw: 0, variant: 'obelisk', scale: 1.08 },
      { x: 9.5, z: -18.5, yaw: 0, variant: 'obelisk', scale: 1.08 },
      { x: -9.5, z: 18.5, yaw: Math.PI, variant: 'obelisk', scale: 1.08 },
      { x: 9.5, z: 18.5, yaw: Math.PI, variant: 'obelisk', scale: 1.08 },
      // Guardian Jackal/Anubis & Horus Falcon Statues on stepped sandstone pedestals
      { x: -11.5, z: -5.5, yaw: Math.PI / 2, variant: 'jackalGuardian', scale: 1.05 },
      { x: 11.5, z: 5.5, yaw: -Math.PI / 2, variant: 'jackalGuardian', scale: 1.05 },
      { x: -11.5, z: 5.5, yaw: Math.PI / 2, variant: 'horusStatue', scale: 1.05 },
      { x: 11.5, z: -5.5, yaw: -Math.PI / 2, variant: 'horusStatue', scale: 1.05 },
      // Outer Desert Monolith Steles
      { x: -54, z: -36, yaw: 0.65, variant: 'monolith', scale: 1.15 },
      { x: 54, z: 36, yaw: -2.45, variant: 'monolith', scale: 1.15 }
    ],
    potteryClusters: [
      { x: -5.2, z: -21.2, yaw: 0.4, scale: 1.05 },
      { x: 5.4, z: -21.0, yaw: 1.8, scale: 1.0 },
      { x: -5.4, z: 21.2, yaw: -0.7, scale: 1.05 },
      { x: 5.2, z: 21.0, yaw: 2.3, scale: 1.0 },
      { x: -10.2, z: -7.2, yaw: 1.1, scale: 1.08 },
      { x: 10.2, z: 7.2, yaw: -1.4, scale: 1.08 },
      { x: -3.8, z: -34.2, yaw: 0.25, scale: 1.1 },
      { x: 3.8, z: 34.2, yaw: -2.8, scale: 1.1 },
      { x: -34.2, z: -21.5, yaw: 0.9, scale: 1.05 },
      { x: 34.2, z: 21.5, yaw: -2.1, scale: 1.05 }
    ],
    sandMounds: [
      { x: -16.5, z: -14.5, yaw: 0.3, radiusX: 3.1, radiusZ: 2.0, height: 1.05 },
      { x: 16.5, z: 14.5, yaw: -2.8, radiusX: 3.1, radiusZ: 2.0, height: 1.05 },
      { x: -19.5, z: 16.0, yaw: 1.2, radiusX: 2.8, radiusZ: 1.9, height: 0.95 },
      { x: 19.5, z: -16.0, yaw: -1.9, radiusX: 2.8, radiusZ: 1.9, height: 0.95 },
      { x: -4.5, z: -41.5, yaw: 0.1, radiusX: 3.4, radiusZ: 2.2, height: 1.15 },
      { x: 4.5, z: 41.5, yaw: 3.1, radiusX: 3.4, radiusZ: 2.2, height: 1.15 },
      { x: -41.5, z: -26.0, yaw: 1.5, radiusX: 3.2, radiusZ: 2.1, height: 1.1 },
      { x: 41.5, z: 26.0, yaw: -1.6, radiusX: 3.2, radiusZ: 2.1, height: 1.1 }
    ]
  },

  snow: {
    id: 'snow',
    name: 'Alpine Glacier Peaks & Viaduct Base',
    sky: {
      zenithColor: 0x1e3a5f,
      horizonColor: 0x9ec5e8,
      groundColor: 0x6b8299,
      sunColor: 0xe0f2fe,
      sunGlow: 1.08
    },
    fogColor: 0xaac7e0,
    fogDensity: 0.0026,
    sunColor: 0xdbeafe,
    sunIntensity: 2.25,
    sunPos: [68, 72, -56],
    hemiSky: 0xbae6fd,
    hemiGround: 0x475569,
    hemiIntensity: 0.96,
    groundTex: 'snow',
    wallTex: 'steel',
    size: 250,
    spawns: [
      { x: -46, z: -46, yaw: -Math.PI * 0.75 },
      { x: 46, z: 46, yaw: Math.PI * 0.25 },
      { x: 46, z: -46, yaw: Math.PI * 0.75 },
      { x: -46, z: 46, yaw: -Math.PI * 0.25 },
      { x: 0, z: -56, yaw: Math.PI },
      { x: 0, z: 56, yaw: 0 },
      { x: -66, z: 0, yaw: -Math.PI * 0.5 },
      { x: 66, z: 0, yaw: Math.PI * 0.5 }
    ],
    tankPads: [
      { x: 0, z: -34, yaw: 0 },
      { x: 0, z: 34, yaw: Math.PI }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: -26, z: 0 },
      { x: 26, z: 0 },
      { x: 0, z: 20 },
      { x: -48, z: -28 },
      { x: 48, z: 28 }
    ],
    blocks: [
      { x: 0, y: 1.2, z: 0, w: 6.2, h: 2.4, d: 6.2, mat: 'concrete', stepable: true },
      { x: -28, y: 1.6, z: -24, w: 7.6, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 28, y: 1.6, z: 24, w: 7.6, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: -28, y: 1.6, z: 24, w: 3.2, h: 3.2, d: 7.6, mat: 'containerOlive' },
      { x: 28, y: 1.6, z: -24, w: 3.2, h: 3.2, d: 7.6, mat: 'containerOlive' },
      { x: -16, y: 0.75, z: -8, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 16, y: 0.75, z: 8, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -16, y: 0.75, z: 8, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 16, y: 0.75, z: -8, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true }
    ],
    buildings: [
      { type: 'alpineCabin', x: -18, z: 0, yaw: Math.PI / 2 },
      { type: 'alpineCabin', x: 18, z: 0, yaw: -Math.PI / 2 },
      { type: 'radarBunker', x: 0, z: -18, yaw: 0 },
      { type: 'radarBunker', x: 0, z: 18, yaw: Math.PI },
      { type: 'radarBunker', x: -44, z: -38, yaw: Math.PI * 0.25 },
      { type: 'alpineCabin', x: 44, z: 38, yaw: -Math.PI * 0.75 }
    ],
    // Strictly NO classical fluted desert/marble columns in the Alpine Snow map!
    columns: [],
    archways: [
      { x: -11.5, z: 0, yaw: Math.PI / 2, span: 5.0, height: 4.6, style: 'concrete', flankingColumns: false },
      { x: 11.5, z: 0, yaw: -Math.PI / 2, span: 5.0, height: 4.6, style: 'concrete', flankingColumns: false },
      { x: 0, z: -28, yaw: 0, span: 5.2, height: 4.6, style: 'concrete', flankingColumns: false },
      { x: 0, z: 28, yaw: Math.PI, span: 5.2, height: 4.6, style: 'concrete', flankingColumns: false }
    ],
    bridges: [
      { x: 0, z: -8.2, yaw: 0, span: 5.0, style: 'concrete' },
      { x: 0, z: 8.2, yaw: Math.PI, span: 5.0, style: 'concrete' },
      { x: -32, z: 0, yaw: Math.PI / 2, span: 4.8, style: 'concrete' }
    ],
    snowcats: [
      { x: -24, z: -12, yaw: 0.55 },
      { x: 24, z: 12, yaw: -2.55 },
      { x: -36, z: 28, yaw: 1.15 },
      { x: 36, z: -28, yaw: -1.95 }
    ],
    iceSpires: [
      { x: -14, z: -26, yaw: 0.2, scale: 1.05 },
      { x: 14, z: 26, yaw: 1.8, scale: 1.05 },
      { x: -34, z: -8, yaw: 0.9, scale: 1.15 },
      { x: 34, z: 8, yaw: -1.2, scale: 1.15 },
      { x: -22, z: 34, yaw: 2.1, scale: 1.1 },
      { x: 22, z: -34, yaw: -0.8, scale: 1.1 },
      { x: -58, z: -32, yaw: 0.4, scale: 1.25 },
      { x: 58, z: 32, yaw: -2.4, scale: 1.25 },
      { x: -52, z: 48, yaw: 1.4, scale: 1.2 },
      { x: 52, z: -48, yaw: -1.7, scale: 1.2 }
    ]
  }
};

function addBeveledShippingContainer(group, worldMeshes, colliders, { x, y, z, w, h, d, mat, trimMat, castShadows, stepable = false }) {
  const containerGroup = new THREE.Group();
  containerGroup.position.set(x, y, z);

  // Main beveled body
  const bodyGeo = createBeveledBox(w, h, d, 0.08, 3);
  const bodyMesh = new THREE.Mesh(bodyGeo, mat);
  bodyMesh.castShadow = castShadows;
  bodyMesh.receiveShadow = castShadows;
  containerGroup.add(bodyMesh);
  worldMeshes.push(bodyMesh);

  // Corner structural frame posts & locking bars
  const isLongZ = d > w;
  const ribCount = 5;
  for (let i = 0; i < ribCount; i++) {
    const t = (i / (ribCount - 1) - 0.5) * 0.78;
    const ribGeo = isLongZ
      ? createBeveledBox(w + 0.08, h * 0.88, 0.16, 0.02, 2)
      : createBeveledBox(0.16, h * 0.88, d + 0.08, 0.02, 2);
    const rib = new THREE.Mesh(ribGeo, trimMat);
    rib.position.set(isLongZ ? 0 : t * w, 0, isLongZ ? t * d : 0);
    rib.castShadow = castShadows;
    containerGroup.add(rib);
  }

  group.add(containerGroup);
  colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y - h / 2 - 1.2,
    maxY: y + h / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    stepable
  });
  return containerGroup;
}

function addBeveledBlockWithCollider(group, worldMeshes, colliders, { x, y, z, w, h, d, mat, castShadows, stepable = false }) {
  const geo = createBeveledBox(w, h, d, Math.min(0.08, Math.min(w, h, d) * 0.08), 3);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadows;
  mesh.receiveShadow = castShadows;
  group.add(mesh);
  worldMeshes.push(mesh);
  colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y - h / 2 - 1.2,
    maxY: y + h / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    stepable
  });
  return mesh;
}

/**
 * Adds the North Harbor Quay Seawall, Mooring Bollards, and the East/Southeast Sandy Beach Cove Surf Zone.
 */
function addHarborQuayAndBeachSurf(group, worldMeshes, colliders, archMats, castShadows, quality) {
  // 1. North Quay Seawall Edge along z = -65.2 (bordering the deep shipping channel z < -66)
  const quayCap = new THREE.Mesh(createBeveledBox(104, 0.65, 1.4, 0.06, 2), archMats.concreteDark);
  quayCap.position.set(0, 0.32, -65.2);
  quayCap.receiveShadow = castShadows;
  group.add(quayCap);
  worldMeshes.push(quayCap);

  // Protective quay curb collider along the deep-water shipping channel edge so players/tanks don't fall into the channel
  colliders.push({
    minX: -52,
    maxX: 52,
    minY: -2,
    maxY: 2.2,
    minZ: -66.2,
    maxZ: -64.6,
    stepable: false
  });

  // Heavy cast-iron twin-horn mooring bollards along the North Quay
  const bollardBaseGeo = createBeveledBox(0.95, 0.22, 0.65, 0.03, 2);
  const bollardPostGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.68, 12);
  for (let bx = -46; bx <= 46; bx += 11.5) {
    const base = new THREE.Mesh(bollardBaseGeo, archMats.steelDark);
    base.position.set(bx, 0.68, -65.1);
    const postL = new THREE.Mesh(bollardPostGeo, archMats.steelDark);
    postL.position.set(bx - 0.22, 1.02, -65.1);
    const postR = new THREE.Mesh(bollardPostGeo, archMats.steelDark);
    postR.position.set(bx + 0.22, 1.02, -65.1);
    group.add(base, postL, postR);
  }

  // 2. East/Southeast Sandy Beach Cove Shallow Turquoise Surf & Foam Plane (x = 84..115)
  const surfMat = createQualityMaterial(
    {
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.18,
      roughness: 0.08,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.68
    },
    quality
  );
  const surfGeo = new THREE.PlaneGeometry(34, 156, 1, 1);
  surfGeo.rotateX(-Math.PI / 2);
  const surfMesh = new THREE.Mesh(surfGeo, surfMat);
  surfMesh.position.set(97, -0.06, 14);
  group.add(surfMesh);

  return {
    surfMesh,
    mats: [surfMat],
    geos: [bollardBaseGeo, bollardPostGeo, surfGeo]
  };
}

function createSnowWeather(count = 480, span = 210) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * span;
    positions[i * 3 + 1] = Math.random() * 28;
    positions[i * 3 + 2] = (Math.random() - 0.5) * span;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xf0f9ff,
    size: 0.24,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  return {
    points,
    update: (dt, elapsedSec) => {
      const arr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        arr[idx + 1] -= (3.6 + (i % 5) * 0.4) * dt;
        arr[idx] += Math.sin(elapsedSec + i) * 0.75 * dt;
        if (arr[idx + 1] < 0) {
          arr[idx + 1] = 28;
          arr[idx] = (Math.random() - 0.5) * span;
          arr[idx + 2] = (Math.random() - 0.5) * span;
        }
      }
      geo.attributes.position.needsUpdate = true;
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    }
  };
}

export function buildArenaMap(scene, textureLib, mapId = 'harbor', quality = 'balanced') {
  const normalizedId = mapId === 'compound' ? 'harbor' : mapId === 'cargoyard' ? 'desert' : mapId === 'nightops' ? 'snow' : mapId;
  const cfg = MAP_CONFIGS[normalizedId] || MAP_CONFIGS.harbor;
  const normQ = quality === 'high' ? 'ultra' : quality;
  const anisotropy = normQ === 'ultra' ? 8 : normQ === 'balanced' ? 4 : 1;
  const castShadows = normQ !== 'fast';

  const group = new THREE.Group();
  const colliders = [];
  const worldMeshes = [];
  const supplyCrates = [];
  const extraMaterials = [];
  const animatedRadars = [];
  const terrainHeightFn = (x, z) => getTerrainHeight(cfg.id, x, z);

  scene.background = new THREE.Color(cfg.sky.horizonColor);
  scene.fog = normQ === 'fast' ? null : new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);

  const sunVec = new THREE.Vector3(...cfg.sunPos);
  const skyDome = createSkyDome({ ...cfg.sky, sunDir: sunVec });
  // Scale skyDome to 1.65x so 250m x 250m maps have huge horizon clearance
  skyDome.mesh.scale.setScalar(1.65);
  group.add(skyDome.mesh);

  const archMats = getArchitecturePalette(textureLib, normQ);

  let water = null;
  let cargoShipController = null;
  let beachSurfMesh = null;
  if (cfg.id === 'harbor') {
    water = createHarborWater(sunVec);
    // Raise water to -0.14m and scale to 1.65x so it fills the North Shipping Channel (z < -66)
    // and laps onto the East/Southeast Sandy Beach Cove (x > 84)!
    water.mesh.position.y = -0.14;
    water.mesh.scale.setScalar(1.65);
    group.add(water.mesh);

    const quayAndBeach = addHarborQuayAndBeachSurf(group, worldMeshes, colliders, archMats, castShadows, normQ);
    extraMaterials.push(...quayAndBeach.mats);
    beachSurfMesh = quayAndBeach.surfMesh;

    // 58m Moving Cargo Container Ship sailing smoothly along the North Shipping Channel (z = -84)
    cargoShipController = addCargoShip(group, worldMeshes, colliders, {
      x: 0,
      y: -0.45,
      z: -84,
      yaw: 0,
      travelRange: 44,
      speed: 0.14,
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  let snowWeather = null;
  if (cfg.id === 'snow' || cfg.id === 'desert') {
    snowWeather = createSnowWeather(normQ === 'fast' ? 180 : cfg.id === 'snow' ? 560 : 240, 210);
    if (cfg.id === 'desert') {
      snowWeather.points.material.color.setHex(0xfde68a);
      snowWeather.points.material.opacity = 0.42;
      snowWeather.points.material.size = 0.18;
    }
    group.add(snowWeather.points);
  }

  const hemi = new THREE.HemisphereLight(cfg.hemiSky, cfg.hemiGround, cfg.hemiIntensity);
  group.add(hemi);

  const sun = new THREE.DirectionalLight(cfg.sunColor, cfg.sunIntensity);
  sun.position.copy(sunVec);
  if (castShadows) {
    sun.castShadow = true;
    const mapSize = normQ === 'ultra' ? 4096 : 1024;
    sun.shadow.mapSize.set(mapSize, mapSize);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 285;
    const d = 112;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
  }
  group.add(sun);

  const matCache = new Map();
  const getMat = (kind, rx = 1, ry = 1) => {
    const key = `${kind}:${rx}:${ry}:${normQ}`;
    if (matCache.has(key)) return matCache.get(key);
    const isMetal = kind.startsWith('container') || kind === 'steel';
    const tex = textureLib.getTextureSet(kind, rx, ry, anisotropy);
    const mat = createQualityMaterial(
      {
        map: tex.map,
        normalMap: tex.normalMap || null,
        roughnessMap: tex.roughnessMap || null,
        roughness: isMetal ? 0.42 : 0.82,
        metalness: isMetal ? 0.45 : 0.06,
        clearcoat: isMetal ? 0.22 : 0.05
      },
      normQ
    );
    matCache.set(key, mat);
    return mat;
  };

  // 1. Multi-Layer Splat Terrain with Enlarged 230m-250m Size & High Resolution
  const terrainSegments = normQ === 'fast' ? 64 : 112;
  const terrainGeo = buildTerrainGeometry(cfg.id, cfg.size, terrainSegments);
  const groundMat = createMultiLayerTerrainMaterial(cfg.id, textureLib, normQ);
  extraMaterials.push(groundMat);
  const ground = new THREE.Mesh(terrainGeo, groundMat);
  ground.receiveShadow = castShadows;
  group.add(ground);
  worldMeshes.push(ground);

  // Clearcoat Wet Puddles / Ice Sheen Patches in ULTRA & BALANCED modes
  if (normQ !== 'fast' && (cfg.id === 'harbor' || cfg.id === 'snow')) {
    const puddleMat = createQualityMaterial(
      {
        color: cfg.id === 'snow' ? 0xbae6fd : 0x1e293b,
        roughness: 0.06,
        metalness: 0.85,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transparent: true,
        opacity: cfg.id === 'snow' ? 0.46 : 0.52
      },
      'ultra'
    );
    extraMaterials.push(puddleMat);
    const puddleSpots = [
      [-10, -14, 3.6],
      [11, 13, 3.3],
      [-20, 6, 3.0],
      [20, -7, 3.1]
    ];
    for (const [px, pz, pr] of puddleSpots) {
      const py = terrainHeightFn(px, pz) + 0.025;
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(pr, 20), puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(px, py, pz);
      puddle.receiveShadow = castShadows;
      group.add(puddle);
    }
  }

  // 2. Beveled Perimeter Boundary Walls
  const half = cfg.size / 2;
  const wallH = cfg.id === 'harbor' ? 2.2 : 6.5;
  const wallT = 2.0;
  const wallMat = getMat(cfg.wallTex, 24, 1);
  const perimeterSpecs = [
    { x: 0, z: -half - wallT / 2, w: cfg.size + wallT * 2, d: wallT },
    { x: 0, z: half + wallT / 2, w: cfg.size + wallT * 2, d: wallT },
    { x: -half - wallT / 2, z: 0, w: wallT, d: cfg.size },
    { x: half + wallT / 2, z: 0, w: wallT, d: cfg.size }
  ];

  for (const p of perimeterSpecs) {
    const mesh = new THREE.Mesh(createBeveledBox(p.w, wallH, p.d, 0.1, 2), wallMat);
    mesh.position.set(p.x, wallH / 2, p.z);
    mesh.receiveShadow = castShadows;
    group.add(mesh);
    worldMeshes.push(mesh);
    colliders.push({
      minX: p.x - p.w / 2,
      maxX: p.x + p.w / 2,
      minY: -2,
      maxY: 18,
      minZ: p.z - p.d / 2,
      maxZ: p.z + p.d / 2
    });
  }

  // 3. Cover Blocks, Beveled Shipping Containers & Military Crates
  for (const b of cfg.blocks) {
    const baseTerrainY = terrainHeightFn(b.x, b.z);
    if (b.mat === 'crateWood') {
      addMilitaryCrate(group, worldMeshes, colliders, {
        x: b.x,
        y: baseTerrainY,
        z: b.z,
        w: b.w,
        h: b.h,
        d: b.d,
        quality: normQ,
        castShadows,
        textureLib,
        stepable: Boolean(b.stepable)
      });
    } else if (b.mat.startsWith('container')) {
      const centerY = baseTerrainY + b.y;
      const rx = Math.max(1, Math.round(Math.max(b.w, b.d) / 3));
      const ry = Math.max(1, Math.round(b.h / 2));
      const mat = getMat(b.mat, rx, ry);
      addBeveledShippingContainer(group, worldMeshes, colliders, {
        x: b.x,
        y: centerY,
        z: b.z,
        w: b.w,
        h: b.h,
        d: b.d,
        mat,
        trimMat: archMats.steelDark,
        castShadows,
        stepable: Boolean(b.stepable)
      });
    } else if (b.mat === 'concrete' && Math.max(b.w, b.d) >= 3.8 && b.h <= 1.6) {
      addJerseyBarrier(group, worldMeshes, colliders, {
        x: b.x,
        y: baseTerrainY,
        z: b.z,
        yaw: b.d > b.w ? Math.PI / 2 : 0,
        length: Math.max(b.w, b.d),
        quality: normQ,
        castShadows,
        textureLib
      });
    } else {
      const centerY = baseTerrainY + b.y;
      const rx = Math.max(1, Math.round(Math.max(b.w, b.d) / 3));
      const ry = Math.max(1, Math.round(b.h / 2));
      const mat = getMat(b.mat, rx, ry);
      addBeveledBlockWithCollider(group, worldMeshes, colliders, {
        x: b.x,
        y: centerY,
        z: b.z,
        w: b.w,
        h: b.h,
        d: b.d,
        mat,
        castShadows,
        stepable: Boolean(b.stepable)
      });
    }
  }

  // 4. Multi-Story Enterable Architectural Buildings (With Walkable Stairs, Railings, Windows & Roofs)
  for (const bSpec of cfg.buildings || []) {
    const res = addDetailedBuilding(
      group,
      worldMeshes,
      colliders,
      terrainHeightFn,
      bSpec,
      archMats,
      castShadows,
      normQ,
      textureLib
    );
    if (res && res.isObject3D) {
      animatedRadars.push(res);
    } else if (res && res.radarDish) {
      animatedRadars.push(res.radarDish);
    }
  }

  // 5. Biome-Authentic Columns (Desert Temple Only!), Monumental Archways & Walkable Bridge Arches
  for (const colSpec of cfg.columns || []) {
    const cy = terrainHeightFn(colSpec.x, colSpec.z);
    addDetailedColumn(group, worldMeshes, colliders, {
      x: colSpec.x,
      y: cy,
      z: colSpec.z,
      height: 4.4,
      radius: 0.44,
      style: colSpec.style || 'sandstone',
      mat: archMats.sandstone,
      trimMat: archMats.sandstoneTrim,
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  for (const archSpec of cfg.archways || []) {
    const ay = terrainHeightFn(archSpec.x, archSpec.z);
    addMonumentalArchway(group, worldMeshes, colliders, {
      x: archSpec.x,
      y: ay,
      z: archSpec.z,
      yaw: archSpec.yaw || 0,
      span: archSpec.span || 5.0,
      pierHeight: 3.3,
      depth: 1.4,
      style: archSpec.style || 'concrete',
      flankingColumns: archSpec.flankingColumns !== undefined ? archSpec.flankingColumns : archSpec.style === 'sandstone',
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  for (const brSpec of cfg.bridges || []) {
    const by = terrainHeightFn(brSpec.x, brSpec.z);
    addWalkableBridgeArch(group, worldMeshes, colliders, {
      x: brSpec.x,
      y: by,
      z: brSpec.z,
      yaw: brSpec.yaw || 0,
      span: brSpec.span || 5.0,
      style: brSpec.style || (cfg.id === 'desert' ? 'sandstone' : cfg.id === 'harbor' ? 'steel' : 'concrete'),
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  // 6. Biome-Specific Signature Architecture & Vehicles
  // 6A. HARBOR: 6 Industrial Forklifts, Heavy Gantry Cranes, and Beach Cove Timber Jetties
  for (const fk of cfg.forklifts || []) {
    addForklift(group, worldMeshes, colliders, {
      ...fk,
      y: terrainHeightFn(fk.x, fk.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }
  for (const gc of cfg.gantryCranes || []) {
    addGantryCrane(group, worldMeshes, colliders, {
      ...gc,
      y: terrainHeightFn(gc.x, gc.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }
  for (const jt of cfg.jetties || []) {
    addTimberJetty(group, worldMeshes, colliders, {
      ...jt,
      y: Math.max(-0.15, terrainHeightFn(jt.x, jt.z)),
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  // 6B. DESERT: Broken Column Ruins, Ancient Obelisks/Guardian Statues, Terracotta Pottery/Vases & Sand Piles
  for (const bc of cfg.brokenColumns || []) {
    addBrokenColumnRuin(group, worldMeshes, colliders, {
      ...bc,
      y: terrainHeightFn(bc.x, bc.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }
  for (const sc of cfg.sculptures || []) {
    addDesertSculpture(group, worldMeshes, colliders, {
      ...sc,
      y: terrainHeightFn(sc.x, sc.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }
  for (const pc of cfg.potteryClusters || []) {
    addPotteryCluster(group, worldMeshes, colliders, {
      ...pc,
      y: terrainHeightFn(pc.x, pc.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }
  for (const sm of cfg.sandMounds || []) {
    addSandDuneMound(group, worldMeshes, colliders, {
      ...sm,
      y: terrainHeightFn(sm.x, sm.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  // 6C. SNOW: Tracked Arctic Snowcat Vehicles & Glacial Ice Spire Clusters
  for (const scv of cfg.snowcats || []) {
    addSnowcatVehicle(group, worldMeshes, colliders, {
      ...scv,
      y: terrainHeightFn(scv.x, scv.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }
  for (const isp of cfg.iceSpires || []) {
    addIceSpireCluster(group, worldMeshes, colliders, {
      ...isp,
      y: terrainHeightFn(isp.x, isp.z),
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  // 7. Detailed Tactical Props (Generators, Ribbed Barrels, Armored Wrecks, Floodlights, Pipelines)
  const propFactor = normQ === 'fast' ? 0.5 : 1.0;
  const barrelSpots = [
    [-11.5, -24.5],
    [11.5, 24.5],
    [-26.5, 18.5],
    [26.5, -18.5],
    [-44.0, 6.0],
    [44.0, -6.0]
  ];
  barrelSpots.slice(0, Math.ceil(barrelSpots.length * propFactor)).forEach(([bx, bz], idx) => {
    addRibbedBarrelCluster(group, worldMeshes, colliders, {
      x: bx,
      y: terrainHeightFn(bx, bz),
      z: bz,
      yaw: idx * 0.8,
      quality: normQ,
      castShadows,
      textureLib
    });
  });

  const generatorSpots = [
    [-22, -34, 0.3],
    [22, 34, -2.8]
  ];
  for (const [gx, gz, gyaw] of generatorSpots) {
    addIndustrialGenerator(group, worldMeshes, colliders, {
      x: gx,
      y: terrainHeightFn(gx, gz),
      z: gz,
      yaw: gyaw,
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  const wreckSpots =
    cfg.id === 'desert'
      ? [
          [-34, -14, 0.45, 'desert'],
          [34, 14, -2.6, 'desert']
        ]
      : [
          [-34, 16, 0.55, 'olive'],
          [34, -16, -2.5, 'olive']
        ];
  for (const [wx, wz, wyaw, wVar] of wreckSpots) {
    addArmoredWreck(group, worldMeshes, colliders, {
      x: wx,
      y: terrainHeightFn(wx, wz),
      z: wz,
      yaw: wyaw,
      variant: wVar,
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  if (normQ !== 'fast') {
    const lightSpots =
      cfg.id === 'desert'
        ? [
            [-46, -46, 0.78],
            [46, 46, -2.35]
          ]
        : [
            [-38, -38, 0.78],
            [38, 38, -2.35],
            [-38, 38, -0.78],
            [38, -38, 2.35]
          ];
    for (const [lx, lz, lyaw] of lightSpots) {
      addFloodlightTower(group, worldMeshes, colliders, {
        x: lx,
        y: terrainHeightFn(lx, lz),
        z: lz,
        yaw: lyaw,
        quality: normQ,
        castShadows,
        textureLib
      });
    }

    if (cfg.id === 'harbor' || cfg.id === 'snow') {
      addPipeRun(group, worldMeshes, colliders, {
        x: -44,
        y: terrainHeightFn(-44, -18),
        z: -18,
        yaw: Math.PI / 2,
        length: 9.5,
        quality: normQ,
        castShadows,
        textureLib
      });
      addPipeRun(group, worldMeshes, colliders, {
        x: 44,
        y: terrainHeightFn(44, 18),
        z: 18,
        yaw: -Math.PI / 2,
        length: 9.5,
        quality: normQ,
        castShadows,
        textureLib
      });
    }
  }

  // 8. Dense Realistic Nature, Rock Arches, Biome Trees & Instanced Wind-Sway Undergrowth
  const nature = populateMapNature(group, worldMeshes, colliders, {
    mapId: cfg.id,
    terrainHeightFn,
    textureLib,
    quality: normQ,
    castShadows
  });

  // 9. Tank Pads + In-World 3D Tank Telemetry Control Terminals
  const padMat = createQualityMaterial({ color: 0xf59e0b, roughness: 0.55, metalness: 0.35, clearcoat: 0.2 }, normQ);
  const hydratedTankPads = cfg.tankPads.map((tp, idx) => {
    const ty = terrainHeightFn(tp.x, tp.z);
    const pad = new THREE.Mesh(createBeveledBox(5.8, 0.16, 7.8, 0.04, 2), padMat);
    pad.position.set(tp.x, ty + 0.04, tp.z);
    pad.rotation.y = tp.yaw;
    pad.receiveShadow = castShadows;
    group.add(pad);

    // 3D Control Terminal beside each Tank Pad
    const termX = tp.x + Math.cos(tp.yaw) * 3.8;
    const termZ = tp.z - Math.sin(tp.yaw) * 3.8;
    addControlTerminal3D(group, worldMeshes, colliders, {
      x: termX,
      y: terrainHeightFn(termX, termZ),
      z: termZ,
      yaw: tp.yaw + Math.PI,
      title: `ARMOR BAY // 0${idx + 1}`,
      subtitle: 'M1A3 COLDBORE READY',
      accentHex: '#f59e0b',
      quality: normQ,
      castShadows,
      textureLib
    });

    return { ...tp, y: ty };
  });

  // 10. 3D Med/Ammo Resupply Stations + Beveled Floating Med-Pack Pickups
  const supplyMat = createQualityMaterial(
    {
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.35,
      clearcoat: 0.5
    },
    normQ
  );
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.78
  });
  extraMaterials.push(crossMat);

  cfg.supplyPads.forEach((sp, idx) => {
    const ty = terrainHeightFn(sp.x, sp.z);
    addMedAmmoStation3D(group, worldMeshes, colliders, {
      x: sp.x,
      y: ty,
      z: sp.z,
      yaw: idx % 2 === 0 ? 0 : Math.PI,
      quality: normQ,
      castShadows,
      textureLib,
      hasCollider: false
    });

    // Beveled 3D Med-Pack & Ammo Case Pickup
    const packGroup = new THREE.Group();
    packGroup.position.set(sp.x, ty + 0.85, sp.z);
    const caseMesh = new THREE.Mesh(createBeveledBox(0.74, 0.44, 0.54, 0.06, 3), supplyMat);
    const crossH = new THREE.Mesh(createBeveledBox(0.28, 0.08, 0.58, 0.015, 2), crossMat);
    const crossV = new THREE.Mesh(createBeveledBox(0.08, 0.28, 0.58, 0.015, 2), crossMat);
    packGroup.add(caseMesh, crossH, crossV);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.96, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(sp.x, ty + 0.09, sp.z);
    group.add(packGroup, ring);

    supplyCrates.push({
      id: idx,
      mesh: packGroup,
      ring,
      baseY: ty + 0.85,
      x: sp.x,
      z: sp.z,
      active: true,
      respawnAt: 0
    });
  });

  const hydratedSpawns = cfg.spawns.map((sp) => ({
    ...sp,
    y: terrainHeightFn(sp.x, sp.z) + 1.7
  }));

  scene.add(group);

  return {
    config: { ...cfg, spawns: hydratedSpawns, tankPads: hydratedTankPads },
    group,
    colliders,
    worldMeshes,
    supplyCrates,
    terrainHeightFn,
    sun,
    update: (dt, elapsedSec) => {
      if (water) water.update(elapsedSec);
      if (snowWeather) snowWeather.update(dt, elapsedSec);
      if (nature) nature.update(dt, elapsedSec);
      if (cargoShipController) {
        cargoShipController.update(dt, elapsedSec);
      }
      if (beachSurfMesh) {
        beachSurfMesh.position.x = 96.5 + Math.sin(elapsedSec * 1.35) * 1.45;
        beachSurfMesh.position.y = -0.06 + Math.sin(elapsedSec * 1.35) * 0.035;
      }
      for (const r of animatedRadars) {
        r.rotation.y = elapsedSec * 1.1;
      }
    },
    dispose: () => {
      scene.remove(group);
      skyDome.dispose();
      if (water) water.dispose();
      if (snowWeather) snowWeather.dispose();
      if (nature) nature.dispose();
      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      for (const m of matCache.values()) m.dispose();
      for (const m of extraMaterials) m.dispose();
      padMat.dispose();
      supplyMat.dispose();
      ringMat.dispose();
    }
  };
}
