export type StationGrade = 'super' | 'first' | 'second' | 'third' | 'simple' | 'flag';

export interface TRAStation {
  id: string;
  name: string;
  nameEn: string;
  line: string;
  region: 'north' | 'central' | 'south' | 'east' | 'branch';
  county: string;
  grade: StationGrade;
  gradeLabel: string;
  lat: number;
  lng: number;
  isMainStation?: boolean;
  address: string;
  description: string;
  popularFoods: string[];
  popularAttractions: string[];
  traCode?: string;
  hasYouBike?: boolean;
  hasLuggageLocker?: boolean;
}

export type TravelStyle = 'gourmet' | 'instagram' | 'culture' | 'family' | 'nature' | 'slow_life';
export type CompanionType = 'solo' | 'couple' | 'family_elder' | 'family_kids' | 'friends';
export type TravelPace = 'relaxed' | 'moderate' | 'packed';
export type LocalTransport = 'walk_youbike' | 'public_bus' | 'scooter_rental' | 'taxi_car';

export interface TravelPreferences {
  style: TravelStyle;
  companion: CompanionType;
  pace: TravelPace;
  transport: LocalTransport;
  dietaryNote?: string;
  budgetLevel?: 'economy' | 'moderate' | 'rich';
  customNotes?: string;
}

export interface ItineraryStop {
  id: string;
  timeSlot: string;
  placeName: string;
  placeNameEn?: string;
  category: 'food' | 'spot' | 'culture' | 'nature' | 'photo' | 'transport' | 'shopping';
  description: string;
  highlight: string;
  durationMinutes: number;
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string;
  transportFromPrevious?: {
    mode: 'walk' | 'youbike' | 'bus' | 'train' | 'taxi';
    durationText: string;
    details: string;
  };
  recommendedItems?: string[];
  tips?: string;
  estimatedCostNtd?: number;
  photoUrl?: string;
}

export interface TrainTripOption {
  optionLabel?: string; // 如：主力推薦、早鳥首選、彈性出發、晚間賦歸
  trainType: string;
  trainNo: string;
  departureTime: string;
  arrivalTime: string;
  fareEstimate: number;
  durationText: string;
  features?: string;
}

export interface DayItinerary {
  id: string;
  createdAt: string;
  title: string;
  subtitle: string;
  originStation: TRAStation;
  destinationStation: TRAStation;
  travelDate: string;
  preferences: TravelPreferences;
  trainRecommendation: {
    outbound: TrainTripOption;
    inbound: TrainTripOption;
    outboundList?: TrainTripOption[];
    inboundList?: TrainTripOption[];
    bookingTip: string;
    traOfficialUrl: string;
  };
  stops: ItineraryStop[];
  transitGuide: {
    stationExitTips: string;
    youbikeInfo: string;
    localBusSummary: string;
    taxiTips: string;
    precautions: string[];
  };
  localSpecialties: {
    mustEat: string[];
    souvenirs: string[];
    bentoRecommendation: string;
  };
  summary: string;
  estimatedTotalBudget: number;
  weatherAdvice?: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'food' | 'spot' | 'cafe' | 'souvenir' | 'nature';
  rating: number;
  reviewCount?: number;
  address: string;
  distanceFromStation: string;
  walkingMinutes: number;
  lat: number;
  lng: number;
  tags: string[];
  description: string;
  signatureDishOrFeature: string;
  priceLevel: '$' | '$$' | '$$$';
  googleMapsSearchQuery: string;
}

export interface ApiKeysConfig {
  geminiApiKey: string;
  googleMapsApiKey: string;
  isGeminiValid: boolean;
  isMapsValid: boolean;
  geminiVerifiedAt?: string;
  mapsVerifiedAt?: string;
}

export interface KeyVerificationResult {
  valid: boolean;
  message?: string;
  error?: string;
  details?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
}
