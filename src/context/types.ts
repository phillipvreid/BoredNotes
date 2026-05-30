export interface PromptContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  locationLabel: string | null;
  weatherCondition: string | null;
  temperatureCelsius: number | null;
}
