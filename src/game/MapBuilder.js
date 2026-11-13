import * as THREE from 'three';
import { createSkyDome, createHarborWater, createMultiLayerTerrainMaterial, createProceduralEnvMap } from './Shaders.js';
import { buildTerrainGeometry, getTerrainHeight, resolveTerrainSegments } from './Terrain.js';
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
  addIceSpireCluster,
  addDesertTemple
} from './ArchitectureBuilder.js';
import { populateMapNature } from './VegetationBuilder.js';

export const MAP_CONFIGS = {
  harbor: {
    id: 'harbor',
    name: 'Sunlit Cargo Harbor',
    sky: {
      zenithColor: 0x2574b8,
      horizonColor: 0xdbeeff,
      groundColor: 0x4b6b82,
      sunColor: 0xfff4d6,
      sunGlow: 1.45
    },
    fogColor: 0xcfe4f5,
    fogDensity: 0.0016,
    sunColor: 0xfff4d6,
    sunIntensity: 2.85,
    sunPos: [65, 82, 55],
    hemiSky: 0xeaf6ff,
    hemiGround: 0x73695e,
    hemiIntensity: 1.25,
    groundTex: 'harborDeck',
    wallTex: 'concrete',
    size: 175,
    spawns: [
      { x: -31, z: -35, yaw: -Math.PI * 0.75 },
      { x: 25, z: 31, yaw: Math.PI * 0.25 },
      { x: 32, z: -31, yaw: Math.PI * 0.75 },
      { x: -25, z: 31, yaw: -Math.PI * 0.25 },
      { x: 0, z: -39, yaw: Math.PI },
      { x: 50, z: 10, yaw: Math.PI * 0.5 },
      { x: -54, z: -6, yaw: -Math.PI * 0.5 },
      { x: 0, z: 48, yaw: 0 }
    ],
    tankPads: [
      { x: -26, z: 0, yaw: -Math.PI / 2 },
      { x: 26, z: 0, yaw: Math.PI / 2 }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: 0, z: 21 },
      { x: 0, z: -21 },
      { x: -18, z: -16 },
      { x: 48, z: 2 },
      { x: -46, z: 16 }
    ],
    blocks: [
      // Flanking stepable cover crates keeping (0,0) center lane unobstructed
      { x: -5.5, y: 0.75, z: -5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 5.5, y: 0.75, z: 5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 5.5, y: 0.75, z: -5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -5.5, y: 0.75, z: 5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      // Inner container yard stacks (1-tier and 2-tier)
      { x: -12.5, y: 1.6, z: -13.5, w: 3.2, h: 3.2, d: 8.2, mat: 'containerBlue' },
      { x: 12.5, y: 1.6, z: 13.5, w: 3.2, h: 3.2, d: 8.2, mat: 'containerRust' },
      { x: -12.5, y: 1.6, z: 14, w: 8.2, h: 3.2, d: 3.2, mat: 'containerYellow' },
      { x: 12.5, y: 1.6, z: -14, w: 8.2, h: 3.2, d: 3.2, mat: 'containerOlive' },
      // Towering 2-story & 3-story shipping container stacks in the North & West cargo berths
      { x: -24, y: 1.6, z: -32, w: 8.2, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: -24, y: 4.8, z: -32, w: 8.2, h: 3.2, d: 3.2, mat: 'containerYellow' },
      { x: -24, y: 8.0, z: -32, w: 8.2, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 26, y: 1.6, z: -36, w: 8.2, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 26, y: 4.8, z: -36, w: 8.2, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: 26, y: 8.0, z: -36, w: 8.2, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: -25, y: 1.6, z: 22, w: 8.2, h: 3.2, d: 3.2, mat: 'containerOlive' },
      { x: -25, y: 4.8, z: 22, w: 8.2, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 25, y: 1.6, z: 20, w: 8.2, h: 3.2, d: 3.2, mat: 'containerRust' },
      { x: 25, y: 4.8, z: 20, w: 8.2, h: 3.2, d: 3.2, mat: 'containerYellow' },
      // Outer dockyard container alleys
      { x: -33, y: 1.6, z: -27, w: 3.2, h: 3.2, d: 8.2, mat: 'containerYellow' },
      { x: -33, y: 4.8, z: -27, w: 3.2, h: 3.2, d: 8.2, mat: 'containerRust' },
      { x: 33, y: 1.6, z: 4, w: 3.2, h: 3.2, d: 8.2, mat: 'containerBlue' },
      { x: -11, y: 1.6, z: -38, w: 6.8, h: 3.2, d: 3.0, mat: 'containerOlive' },
      { x: 11, y: 1.6, z: -38, w: 6.8, h: 3.2, d: 3.0, mat: 'containerYellow' },
      // K-rail Jersey barriers & outer beach cover
      { x: -19, y: 0.7, z: 8, w: 4.2, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 19, y: 0.7, z: -8, w: 4.2, h: 1.4, d: 1.2, mat: 'concrete' },
      { x: 37, y: 0.7, z: -6, w: 1.2, h: 1.4, d: 4.2, mat: 'concrete' },
      { x: 37, y: 0.7, z: 14, w: 1.2, h: 1.4, d: 4.2, mat: 'concrete' }
    ],
    buildings: [
      { type: 'harborOffice', x: 0, z: -28, yaw: 0 },
      { type: 'harborOffice', x: 0, z: 27, yaw: Math.PI },
      { type: 'portWarehouse', x: -30, z: -14, yaw: Math.PI / 2 },
      { type: 'portWarehouse', x: 29, z: -22, yaw: -Math.PI / 2 },
      { type: 'guardTower', x: -33, z: 30, yaw: Math.PI * 0.25 },
      { type: 'guardTower', x: 33, z: 30, yaw: -Math.PI * 0.25 }
    ],
    // Strictly NO classical fluted columns or stone temple ruins in the Harbor!
    columns: [],
    archways: [],
    bridges: [
      { x: -10.5, z: 0, yaw: Math.PI / 2, span: 4.8, style: 'steel' },
      { x: 10.5, z: 0, yaw: -Math.PI / 2, span: 4.8, style: 'steel' },
      { x: 0, z: -15, yaw: 0, span: 4.8, style: 'steel' }
    ],
    forklifts: [
      { x: -18, z: -22, yaw: 0.45, withLoad: true, forkHeight: 0.42 },
      { x: 18, z: -22, yaw: -2.35, withLoad: true, forkHeight: 0.95 },
      { x: -22, z: 12, yaw: 1.25, withLoad: true, forkHeight: 0.35 },
      { x: 21, z: 12, yaw: -1.55, withLoad: false, forkHeight: 0.28 },
      { x: -6, z: -38, yaw: 0.15, withLoad: true, forkHeight: 0.65 },
      { x: 32, z: 14, yaw: -0.85, withLoad: true, forkHeight: 0.38 }
    ],
    gantryCranes: [
      { x: -18, z: -36, yaw: 0, spanZ: 18, height: 20 },
      { x: 18, z: -36, yaw: 0, spanZ: 18, height: 20 }
    ],
    jetties: [
      { x: 63, z: -10, yaw: 0, length: 15, width: 3.2 },
      { x: 64, z: 22, yaw: -0.1, length: 14, width: 3.2 }
    ]
  },

  desert: {
    id: 'desert',
    name: 'Desert Dunes & Sun Temple Outpost',
    sky: {
      zenithColor: 0x2672b8,
      horizonColor: 0xf7e3be,
      groundColor: 0xc29e68,
      sunColor: 0xfff4d6,
      sunGlow: 1.4
    },
    fogColor: 0xecdcb9,
    fogDensity: 0.0016,
    sunColor: 0xfff4d6,
    sunIntensity: 2.75,
    sunPos: [64, 78, 44],
    hemiSky: 0xfff5de,
    hemiGround: 0xa68556,
    hemiIntensity: 1.2,
    groundTex: 'sandstone',
    wallTex: 'sandstone',
    size: 185,
    desertTemple: { x: 0, z: 0, yaw: 0 },
    spawns: [
      { x: -38, z: -38, yaw: -Math.PI * 0.75 },
      { x: 38, z: 38, yaw: Math.PI * 0.25 },
      { x: 38, z: -38, yaw: Math.PI * 0.75 },
      { x: -38, z: 38, yaw: -Math.PI * 0.25 },
      { x: 0, z: -48, yaw: Math.PI },
      { x: 0, z: 48, yaw: 0 },
      { x: -54, z: 0, yaw: -Math.PI * 0.5 },
      { x: 54, z: 0, yaw: Math.PI * 0.5 }
    ],
    tankPads: [
      { x: -28, z: 0, yaw: -Math.PI / 2 },
      { x: 28, z: 0, yaw: Math.PI / 2 }
    ],
    supplyPads: [
      { x: 0, y: 1.48, z: 0, noCabinet: true },
      { x: -14, z: -22 },
      { x: 14, z: 22 },
      { x: -24, z: 20 },
      { x: 24, z: -20 },
      { x: 44, z: 0 }
    ],
    blocks: [
      // Sandstone cover blocks & crates framing the central Desert Temple (outside +-12m temple stairs)
      { x: -16.5, y: 1.0, z: -15.5, w: 3.0, h: 2.0, d: 5.4, mat: 'sandstone', stepable: true },
      { x: 16.5, y: 1.0, z: 15.5, w: 3.0, h: 2.0, d: 5.4, mat: 'sandstone', stepable: true },
      { x: 16.5, y: 1.0, z: -16.5, w: 5.4, h: 2.0, d: 3.0, mat: 'sandstone', stepable: true },
      { x: -16.5, y: 1.0, z: 16.5, w: 5.4, h: 2.0, d: 3.0, mat: 'sandstone', stepable: true },
      { x: -15.2, y: 0.75, z: 9.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 15.2, y: 0.75, z: -9.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -7.5, y: 0.75, z: -13.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 7.5, y: 0.75, z: 13.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true }
    ],
    buildings: [
      { type: 'desertHouse', x: 0, z: -32, yaw: 0 },
      { type: 'desertHouse', x: 0, z: 32, yaw: Math.PI },
      { type: 'desertFort', x: -32, z: -20, yaw: Math.PI / 2 },
      { type: 'desertFort', x: 32, z: 20, yaw: -Math.PI / 2 },
      { type: 'desertHouse', x: -38, z: 22, yaw: Math.PI / 2 },
      { type: 'desertFort', x: 38, z: -22, yaw: -Math.PI / 2 }
    ],
    // Grand Outer Hypostyle Hall Colonnade flanking the Desert Temple avenues
    columns: [
      { x: -6.0, z: -19.5, style: 'sandstone' },
      { x: 6.0, z: -19.5, style: 'sandstone' },
      { x: -6.0, z: 19.5, style: 'sandstone' },
      { x: 6.0, z: 19.5, style: 'sandstone' },
      { x: -19.5, z: -6.5, style: 'sandstone' },
      { x: 19.5, z: 6.5, style: 'sandstone' },
      { x: -19.5, z: 6.5, style: 'sandstone' },
      { x: 19.5, z: -6.5, style: 'sandstone' },
      { x: -10.5, z: -25.5, style: 'sandstone' },
      { x: 10.5, z: -25.5, style: 'sandstone' },
      { x: -10.5, z: 25.5, style: 'sandstone' },
      { x: 10.5, z: 25.5, style: 'sandstone' },
      { x: -27.5, z: -10.5, style: 'sandstone' },
      { x: 27.5, z: 10.5, style: 'sandstone' },
      { x: -27.5, z: 10.5, style: 'sandstone' },
      { x: 27.5, z: -10.5, style: 'sandstone' }
    ],
    brokenColumns: [
      { x: -18.0, z: -20.0, yaw: 0.42 },
      { x: 18.0, z: 20.0, yaw: -2.65 },
      { x: -23.0, z: 15.0, yaw: 1.15 },
      { x: 23.0, z: -15.0, yaw: -1.85 },
      { x: -36.0, z: -6.0, yaw: 0.25 },
      { x: 36.0, z: 6.0, yaw: -2.85 },
      { x: -9.0, z: -41.0, yaw: 0.78 },
      { x: 9.0, z: 41.0, yaw: -2.35 }
    ],
    archways: [
      { x: 0, z: -15.5, yaw: 0, span: 5.0, height: 4.8, style: 'sandstone' },
      { x: 0, z: 15.5, yaw: Math.PI, span: 5.0, height: 4.8, style: 'sandstone' },
      { x: -16.5, z: 0, yaw: Math.PI / 2, span: 5.0, height: 4.8, style: 'sandstone' },
      { x: 16.5, z: 0, yaw: -Math.PI / 2, span: 5.0, height: 4.8, style: 'sandstone' }
    ],
    bridges: [
      { x: 0, z: -24.5, yaw: 0, span: 4.8, style: 'sandstone' },
      { x: 0, z: 24.5, yaw: Math.PI, span: 4.8, style: 'sandstone' }
    ],
    sculptures: [
      // Twin Carved Obelisks with gold/bronze pyramidion tips flanking North & South Temple Portals
      { x: -10.6, z: -13.2, yaw: 0, variant: 'obelisk', scale: 1.05 },
      { x: 10.6, z: -13.2, yaw: 0, variant: 'obelisk', scale: 1.05 },
      { x: -10.6, z: 13.2, yaw: Math.PI, variant: 'obelisk', scale: 1.05 },
      { x: 10.6, z: 13.2, yaw: Math.PI, variant: 'obelisk', scale: 1.05 },
      // Guardian Jackal/Anubis & Horus Falcon Statues flanking East & West Temple Approaches
      { x: -13.8, z: -5.2, yaw: Math.PI / 2, variant: 'jackalGuardian', scale: 1.02 },
      { x: 13.8, z: 5.2, yaw: -Math.PI / 2, variant: 'jackalGuardian', scale: 1.02 },
      { x: -13.8, z: 5.2, yaw: Math.PI / 2, variant: 'horusStatue', scale: 1.02 },
      { x: 13.8, z: -5.2, yaw: -Math.PI / 2, variant: 'horusStatue', scale: 1.02 },
      // Outer Desert Monolith Steles
      { x: -44, z: -30, yaw: 0.65, variant: 'monolith', scale: 1.12 },
      { x: 44, z: 30, yaw: -2.45, variant: 'monolith', scale: 1.12 }
    ],
    potteryClusters: [
      { x: -4.0, z: -19.5, yaw: 0.4, scale: 1.05 },
      { x: 4.0, z: -19.5, yaw: 1.8, scale: 1.0 },
      { x: -4.0, z: 19.5, yaw: -0.7, scale: 1.05 },
      { x: 4.0, z: 19.5, yaw: 2.3, scale: 1.0 },
      { x: -12.5, z: -8.2, yaw: 1.1, scale: 1.05 },
      { x: 12.5, z: 8.2, yaw: -1.4, scale: 1.05 },
      { x: -6.4, z: -28.5, yaw: 0.25, scale: 1.08 },
      { x: 6.4, z: 28.5, yaw: -2.8, scale: 1.08 },
      { x: -27.5, z: -16.5, yaw: 0.9, scale: 1.05 },
      { x: 27.5, z: 16.5, yaw: -2.1, scale: 1.05 }
    ],
    sandMounds: [
      { x: -21.5, z: -11.5, yaw: 0.3, radiusX: 2.9, radiusZ: 1.9, height: 0.95 },
      { x: 21.5, z: 11.5, yaw: -2.8, radiusX: 2.9, radiusZ: 1.9, height: 0.95 },
      { x: -25.5, z: 7.5, yaw: 1.2, radiusX: 2.7, radiusZ: 1.8, height: 0.9 },
      { x: 25.5, z: -7.5, yaw: -1.9, radiusX: 2.7, radiusZ: 1.8, height: 0.9 },
      { x: -8.2, z: -35.0, yaw: 0.1, radiusX: 3.1, radiusZ: 2.0, height: 1.05 },
      { x: 8.2, z: 35.0, yaw: 3.1, radiusX: 3.1, radiusZ: 2.0, height: 1.05 },
      { x: -39.5, z: -26.5, yaw: 1.5, radiusX: 3.0, radiusZ: 2.0, height: 1.0 },
      { x: 39.5, z: 26.5, yaw: -1.6, radiusX: 3.0, radiusZ: 2.0, height: 1.0 }
    ]
  },

  snow: {
    id: 'snow',
    name: 'Alpine Glacier Peaks & Viaduct Base',
    sky: {
      zenithColor: 0x2262a8,
      horizonColor: 0xd6ebff,
      groundColor: 0x7b93ab,
      sunColor: 0xf0f8ff,
      sunGlow: 1.35
    },
    fogColor: 0xc9e0f5,
    fogDensity: 0.0017,
    sunColor: 0xf0f8ff,
    sunIntensity: 2.75,
    sunPos: [60, 74, -48],
    hemiSky: 0xe6f4ff,
    hemiGround: 0x627385,
    hemiIntensity: 1.2,
    groundTex: 'snow',
    wallTex: 'steel',
    size: 185,
    spawns: [
      { x: -38, z: -38, yaw: -Math.PI * 0.75 },
      { x: 38, z: 38, yaw: Math.PI * 0.25 },
      { x: 38, z: -38, yaw: Math.PI * 0.75 },
      { x: -38, z: 38, yaw: -Math.PI * 0.25 },
      { x: 0, z: -46, yaw: Math.PI },
      { x: 0, z: 46, yaw: 0 },
      { x: -52, z: 0, yaw: -Math.PI * 0.5 },
      { x: 52, z: 0, yaw: Math.PI * 0.5 }
    ],
    tankPads: [
      { x: 0, z: -33, yaw: 0 },
      { x: 0, z: 33, yaw: Math.PI }
    ],
    supplyPads: [
      { x: 0, z: 0 },
      { x: -24, z: 0 },
      { x: 24, z: 0 },
      { x: 0, z: 13 },
      { x: -45, z: -20 },
      { x: 45, z: 20 }
    ],
    blocks: [
      { x: -5.5, y: 0.75, z: -5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 5.5, y: 0.75, z: 5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -5.5, y: 0.75, z: 5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 5.5, y: 0.75, z: -5.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -23, y: 1.6, z: -21, w: 7.0, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: 23, y: 1.6, z: 21, w: 7.0, h: 3.2, d: 3.2, mat: 'containerBlue' },
      { x: -23, y: 1.6, z: 21, w: 3.2, h: 3.2, d: 7.0, mat: 'containerOlive' },
      { x: 23, y: 1.6, z: -21, w: 3.2, h: 3.2, d: 7.0, mat: 'containerOlive' },
      { x: -13.5, y: 0.75, z: -7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 13.5, y: 0.75, z: 7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: -13.5, y: 0.75, z: 7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true },
      { x: 13.5, y: 0.75, z: -7.5, w: 2.2, h: 1.5, d: 2.2, mat: 'crateWood', stepable: true }
    ],
    buildings: [
      { type: 'alpineCabin', x: -17, z: 0, yaw: Math.PI / 2 },
      { type: 'alpineCabin', x: 17, z: 0, yaw: -Math.PI / 2 },
      { type: 'radarBunker', x: 0, z: -17, yaw: 0 },
      { type: 'radarBunker', x: 0, z: 17, yaw: Math.PI },
      { type: 'radarBunker', x: -36, z: -30, yaw: Math.PI * 0.25 },
      { type: 'alpineCabin', x: 36, z: 30, yaw: -Math.PI * 0.75 }
    ],
    // Strictly NO classical fluted desert/marble columns in the Alpine Snow map!
    columns: [],
    archways: [
      { x: -10.5, z: 0, yaw: Math.PI / 2, span: 4.8, height: 4.6, style: 'concrete', flankingColumns: false },
      { x: 10.5, z: 0, yaw: -Math.PI / 2, span: 4.8, height: 4.6, style: 'concrete', flankingColumns: false },
      { x: 0, z: -25.5, yaw: 0, span: 5.0, height: 4.6, style: 'concrete', flankingColumns: false },
      { x: 0, z: 25.5, yaw: Math.PI, span: 5.0, height: 4.6, style: 'concrete', flankingColumns: false }
    ],
    bridges: [
      { x: 0, z: -8.2, yaw: 0, span: 4.8, style: 'concrete' },
      { x: 0, z: 8.2, yaw: Math.PI, span: 4.8, style: 'concrete' },
      { x: -29, z: 0, yaw: Math.PI / 2, span: 4.6, style: 'concrete' }
    ],
    snowcats: [
      { x: -22, z: -11, yaw: 0.55 },
      { x: 22, z: 11, yaw: -2.55 },
      { x: -31, z: 24, yaw: 1.15 },
      { x: 31, z: -24, yaw: -1.95 }
    ],
    iceSpires: [
      { x: -15.5, z: -24.0, yaw: 0.2, scale: 1.02 },
      { x: 15.5, z: 24.0, yaw: 1.8, scale: 1.02 },
      { x: -31, z: -11.5, yaw: 0.9, scale: 1.12 },
      { x: 31, z: 11.5, yaw: -1.2, scale: 1.12 },
      { x: -20, z: 29, yaw: 2.1, scale: 1.08 },
      { x: 20, z: -29, yaw: -0.8, scale: 1.08 },
      { x: -48, z: -28, yaw: 0.4, scale: 1.2 },
      { x: 48, z: 28, yaw: -2.4, scale: 1.2 },
      { x: -44, z: 40, yaw: 1.4, scale: 1.15 },
      { x: 44, z: -40, yaw: -1.7, scale: 1.15 }
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
 * Adds the North Harbor Quay Seawall with 2 wide steel quay stair ramps (at x = ±18, z = -45.5),
 * mooring bollards, and the East/Southeast Sandy Beach Cove Surf Zone.
 */
function addHarborQuayAndBeachSurf(group, worldMeshes, colliders, archMats, castShadows, quality) {
  // 1. North Quay Seawall Curb along z = -45.8 with two 4.8m wide stair openings at x = -18 and x = +18
  const curbSegments = [
    { x: -28.2, w: 15.6 },
    { x: 0, w: 31.2 },
    { x: 28.2, w: 15.6 }
  ];
  for (const seg of curbSegments) {
    const quayCap = new THREE.Mesh(createBeveledBox(seg.w, 0.48, 1.1, 0.05, 2), archMats.concreteDark);
    quayCap.position.set(seg.x, 0.24, -45.8);
    quayCap.receiveShadow = castShadows;
    group.add(quayCap);
    worldMeshes.push(quayCap);

    colliders.push({
      minX: seg.x - seg.w * 0.5,
      maxX: seg.x + seg.w * 0.5,
      minY: -2,
      maxY: 0.48,
      minZ: -46.35,
      maxZ: -45.25,
      stepable: true
    });
  }

  // Two wide steel quay stair ramps descending from dock y=0 down to channel seabed y=-0.95m
  const stepWidth = 4.4;
  const quayStepSpecs = [
    { z: -45.95, topY: -0.18, h: 0.40, d: 1.05 },
    { z: -46.95, topY: -0.44, h: 0.42, d: 1.05 },
    { z: -47.95, topY: -0.70, h: 0.44, d: 1.05 },
    { z: -48.95, topY: -0.92, h: 0.44, d: 1.05 }
  ];
  const rampRunZ = 4.0;
  const rampDropY = 0.95;
  const rampSlope = Math.atan2(rampDropY, rampRunZ);
  const rampSpan = Math.hypot(rampRunZ, rampDropY);

  for (const rx of [-18, 18]) {
    for (let i = 0; i < quayStepSpecs.length; i++) {
      const st = quayStepSpecs[i];
      const tread = new THREE.Mesh(
        createBeveledBox(stepWidth, st.h, st.d, 0.03, 2),
        i % 2 === 0 ? archMats.stairTread : archMats.steelDark
      );
      tread.position.set(rx, st.topY - st.h * 0.5, st.z);
      tread.castShadow = castShadows;
      tread.receiveShadow = castShadows;
      group.add(tread);
      worldMeshes.push(tread);

      colliders.push({
        minX: rx - stepWidth * 0.5,
        maxX: rx + stepWidth * 0.5,
        minY: st.topY - st.h - 0.3,
        maxY: st.topY,
        minZ: st.z - st.d * 0.5,
        maxZ: st.z + st.d * 0.5,
        stepable: true
      });
    }

    // Slanted steel side stringers & tubular handrails flanking each quay stair ramp
    for (const side of [-1, 1]) {
      const edgeX = rx + side * (stepWidth * 0.5 + 0.08);
      const stringer = new THREE.Mesh(
        createBeveledBox(0.14, 0.22, rampSpan + 0.2, 0.025, 2),
        archMats.steelDark
      );
      stringer.position.set(edgeX, -rampDropY * 0.5 + 0.02, -47.45);
      stringer.rotation.x = -rampSlope;
      group.add(stringer);

      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, rampSpan + 0.14, 10),
        archMats.steelChrome
      );
      rail.position.set(edgeX, -rampDropY * 0.5 + 0.92, -47.45);
      rail.rotation.x = Math.PI * 0.5 - rampSlope;
      group.add(rail);

      for (const t of [0.05, 0.5, 0.95]) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.036, 0.94, 8),
          archMats.steelDark
        );
        post.position.set(edgeX, -t * rampDropY + 0.45, -45.5 - t * rampRunZ);
        group.add(post);
      }
    }
  }

  // Heavy cast-iron twin-horn mooring bollards along the North Quay (clear of ±18 ramp openings)
  const bollardBaseGeo = createBeveledBox(0.9, 0.22, 0.62, 0.03, 2);
  const bollardPostGeo = new THREE.CylinderGeometry(0.16, 0.20, 0.64, 12);
  for (const bx of [-33, -23.5, -12, -4, 4, 12, 23.5, 33]) {
    const base = new THREE.Mesh(bollardBaseGeo, archMats.steelDark);
    base.position.set(bx, 0.58, -45.8);
    const postL = new THREE.Mesh(bollardPostGeo, archMats.steelDark);
    postL.position.set(bx - 0.21, 0.90, -45.8);
    const postR = new THREE.Mesh(bollardPostGeo, archMats.steelDark);
    postR.position.set(bx + 0.21, 0.90, -45.8);
    group.add(base, postL, postR);
  }

  // 2. Subtle East/Southeast Sandy Beach Cove Shallow Shoreline Shimmer (x ~ 58..76)
  const surfMat = createQualityMaterial(
    {
      color: 0x7dd3fc,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.14,
      roughness: 0.12,
      metalness: 0.25,
      clearcoat: 0.6,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide
    },
    quality
  );
  const surfGeo = new THREE.PlaneGeometry(24, 108, 1, 1);
  surfGeo.rotateX(-Math.PI / 2);
  const surfMesh = new THREE.Mesh(surfGeo, surfMat);
  surfMesh.position.set(66, -0.23, 8);
  group.add(surfMesh);

  return {
    surfMesh,
    mats: [surfMat],
    geos: [bollardBaseGeo, bollardPostGeo, surfGeo]
  };
}

function createSnowWeather(count = 480, span = 165) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * span;
    positions[i * 3 + 1] = Math.random() * 26;
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
          arr[idx + 1] = 26;
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
  const envMap = normQ !== 'fast'
    ? createProceduralEnvMap(
        cfg.sky.zenithColor,
        cfg.sky.horizonColor,
        cfg.sky.groundColor,
        sunVec,
        cfg.sky.sunColor
      )
    : null;
  scene.environment = envMap;

  const skyDome = createSkyDome({ ...cfg.sky, sunDir: sunVec });
  skyDome.mesh.scale.setScalar(1.35);
  group.add(skyDome.mesh);

  const archMats = getArchitecturePalette(textureLib, normQ);

  let water = null;
  let cargoShipController = null;
  let beachSurfMesh = null;
  if (cfg.id === 'harbor') {
    water = createHarborWater(sunVec);
    // Water at -0.25m fills the -0.95m North wading channel (z < -46) and -0.85m East beach cove (x > 57.5)
    water.mesh.position.y = -0.25;
    water.mesh.scale.setScalar(1.35);
    group.add(water.mesh);

    const quayAndBeach = addHarborQuayAndBeachSurf(group, worldMeshes, colliders, archMats, castShadows, normQ);
    extraMaterials.push(...quayAndBeach.mats);
    beachSurfMesh = quayAndBeach.surfMesh;

    // 58m Moving Cargo Container Ship sailing smoothly along the North Shipping Channel (z = -62)
    cargoShipController = addCargoShip(group, worldMeshes, colliders, {
      x: 0,
      y: -0.45,
      z: -62,
      yaw: 0,
      travelRange: 32,
      speed: 0.14,
      quality: normQ,
      castShadows,
      textureLib
    });
  }

  let snowWeather = null;
  if (cfg.id === 'snow' || cfg.id === 'desert') {
    snowWeather = createSnowWeather(normQ === 'fast' ? 160 : cfg.id === 'snow' ? 480 : 210, 165);
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
    sun.shadow.camera.far = 235;
    const d = 88;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0005;
  }
  group.add(sun);

  // Opposite-side horizon fill light so shaded sides of ships, buildings & props remain crisp & readable
  const fillLight = new THREE.DirectionalLight(cfg.hemiSky, normQ === 'fast' ? 0.62 : 0.55);
  fillLight.position.set(-sunVec.x * 0.8, 36, -sunVec.z * 0.8);
  group.add(fillLight);

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
        roughness: isMetal ? 0.38 : 0.84,
        metalness: isMetal ? 0.55 : 0.04,
        clearcoat: isMetal ? 0.14 : 0
      },
      normQ
    );
    matCache.set(key, mat);
    return mat;
  };

  // 1. Multi-Layer Splat Terrain (175m Harbor, 185m Desert/Snow; clean flat-shaded vertexColors in fast mode)
  const terrainSegments = resolveTerrainSegments(normQ);
  const terrainGeo = buildTerrainGeometry(cfg.id, cfg.size, terrainSegments, normQ);
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
      [-10, -13, 3.2],
      [11, 12, 3.0],
      [-19, 6, 2.8],
      [19, -6, 2.8]
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
  const wallMat = getMat(cfg.wallTex, 20, 1);
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

  // 2B. Monumental Walkable Desert Temple Centerpiece (Desert Map)
  if (cfg.desertTemple) {
    addDesertTemple(group, worldMeshes, colliders, {
      ...cfg.desertTemple,
      y: terrainHeightFn(cfg.desertTemple.x, cfg.desertTemple.z),
      quality: normQ,
      castShadows,
      textureLib
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
      y: Math.max(-0.22, terrainHeightFn(jt.x, jt.z)),
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
    [-11.5, -21.5],
    [11.5, 21.5],
    [-22.5, 16.5],
    [22.5, -16.5],
    [-34.0, 6.0],
    [34.0, -6.0]
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
    [-20, -28, 0.3],
    [20, 28, -2.8]
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
          [-26, 14, 0.45, 'desert'],
          [26, -14, -2.6, 'desert']
        ]
      : [
          [-30, 14, 0.55, 'olive'],
          [30, -14, -2.5, 'olive']
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
            [-39, -39, 0.78],
            [39, 39, -2.35]
          ]
        : [
            [-31, -31, 0.78],
            [31, 31, -2.35],
            [-31, 31, -0.78],
            [31, -31, 2.35]
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
        x: -36.5,
        y: terrainHeightFn(-36.5, -2),
        z: -2,
        yaw: Math.PI / 2,
        length: 6.5,
        quality: normQ,
        castShadows,
        textureLib
      });
      addPipeRun(group, worldMeshes, colliders, {
        x: 35.5,
        y: terrainHeightFn(35.5, -14),
        z: -14,
        yaw: -Math.PI / 2,
        length: 6.5,
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
  const padMat = createQualityMaterial({ color: 0xf59e0b, roughness: 0.55, metalness: 0.35, clearcoat: 0 }, normQ);
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
      clearcoat: 0.35
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
    const ty = sp.y !== undefined ? sp.y : terrainHeightFn(sp.x, sp.z);
    if (!sp.noCabinet) {
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
    }

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
        beachSurfMesh.position.x = 65.5 + Math.sin(elapsedSec * 1.35) * 1.15;
        beachSurfMesh.position.y = -0.23 + Math.sin(elapsedSec * 1.35) * 0.025;
      }
      for (const r of animatedRadars) {
        r.rotation.y = elapsedSec * 1.1;
      }
    },
    dispose: () => {
      scene.remove(group);
      if (envMap) {
        if (scene.environment === envMap) scene.environment = null;
        envMap.dispose();
      }
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

