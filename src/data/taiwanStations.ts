import { TRAStation, StationGrade } from '../types';
import { NORTH_STATIONS } from './stations/northStations';
import { CENTRAL_STATIONS } from './stations/centralStations';
import { SOUTH_STATIONS } from './stations/southStations';
import { EAST_STATIONS } from './stations/eastStations';
import { BRANCH_STATIONS } from './stations/branchStations';

// Aggregate all TRA stations across Taiwan
export const TAIWAN_TRA_STATIONS: TRAStation[] = [
  ...NORTH_STATIONS,
  ...CENTRAL_STATIONS,
  ...SOUTH_STATIONS,
  ...EAST_STATIONS,
  ...BRANCH_STATIONS,
];

// Region tabs
export const REGIONS = [
  { id: 'all', name: '全台所有車站' },
  { id: 'north', name: '北部 (北北基桃竹)' },
  { id: 'central', name: '中部 (苗中彰投雲)' },
  { id: 'south', name: '南部 (嘉南高屏)' },
  { id: 'east', name: '東部 (宜花東)' },
  { id: 'branch', name: '觀光/高鐵支線' },
];

// Station Grade Categories matching TRA official specification
export interface StationGradeOption {
  id: 'all' | StationGrade;
  name: string;
  badgeClass: string;
  desc: string;
}

export const STATION_GRADES: StationGradeOption[] = [
  { id: 'all', name: '全部等級', badgeClass: 'bg-slate-100 text-slate-700', desc: '全台所有等級車站' },
  { id: 'super', name: '特等站', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300', desc: '台北、台中、高雄、花蓮等核心超大樞紐' },
  { id: 'first', name: '一等站', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300', desc: '基隆、板橋、桃園、新竹、彰化、台南等大站' },
  { id: 'second', name: '二等站', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: '汐止、鶯歌、竹南、新烏日、沙鹿、蘇澳等中型轉乘站' },
  { id: 'third', name: '三等站', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300', desc: '三義、后里、田中、民雄、後壁、礁溪、池上等地方大站' },
  { id: 'simple', name: '簡易站', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300', desc: '松竹、大橋、車埕、六家等通勤或風景特定站' },
  { id: 'flag', name: '招呼站', badgeClass: 'bg-stone-100 text-stone-700 border-stone-300', desc: '崎頂、枋山、三坑、合興等無人或秘境景觀小站' },
];

// Counties list for granular filter (split into 2 balanced rows for full Taiwan coverage display)
export const COUNTY_ROW_1 = [
  '基隆市', '台北市', '新北市', '桃園市', '新竹縣', '新竹市', '苗栗縣', '台中市', '彰化縣'
];

export const COUNTY_ROW_2 = [
  '南投縣', '雲林縣', '嘉義縣', '嘉義市', '台南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣'
];

export const COUNTY_LIST = [...COUNTY_ROW_1, ...COUNTY_ROW_2];

// Popular itinerary shortcuts
export const POPULAR_ROUTE_SHORTCUTS = [
  { from: '1008', to: '7200', title: '台北 ➔ 礁溪', tag: '溫泉美食泡湯一日遊' },
  { from: '1008', to: '7334', title: '台北 ➔ 十分', tag: '平溪天燈瀑布散策' },
  { from: '1008', to: '7240', title: '台北 ➔ 羅東', tag: '夜市林場森林遊' },
  { from: '1008', to: '7361', title: '台北 ➔ 八斗子', tag: '深澳無敵海景鐵道' },
  { from: '3390', to: '3434', title: '台中 ➔ 集集', tag: '綠色隧道山蕉漫遊' },
  { from: '3390', to: '3210', title: '台中 ➔ 三義', tag: '勝興木雕RailBike' },
  { from: '4220', to: '4230', title: '台南 ➔ 保安', tag: '奇美博物館十鼓文創' },
  { from: '4400', to: '5130', title: '高雄 ➔ 枋寮', tag: '藍皮解憂號海景之旅' },
  { from: '7070', to: '6010', title: '花蓮 ➔ 池上', tag: '伯朗大道金黃稻浪' },
  { from: '1032', to: '1193', title: '新竹 ➔ 內灣', tag: '客家老街吊橋漫畫' },
];

// Helper to get station by ID
export function getStationById(id: string): TRAStation | undefined {
  return TAIWAN_TRA_STATIONS.find((station) => station.id === id);
}

export const findStationById = getStationById;

// Helper to get station by name
export function getStationByName(name: string): TRAStation | undefined {
  const clean = name.replace('站', '').trim();
  return TAIWAN_TRA_STATIONS.find(
    (station) => station.name === clean || station.name.includes(clean) || clean.includes(station.name)
  );
}

// Default origin & destination
export const DEFAULT_ORIGIN: TRAStation = TAIWAN_TRA_STATIONS.find((s) => s.id === '1008') || TAIWAN_TRA_STATIONS[0];
export const DEFAULT_DESTINATION: TRAStation = TAIWAN_TRA_STATIONS.find((s) => s.id === '7200') || TAIWAN_TRA_STATIONS[1];
