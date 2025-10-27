/**
 * Formats feature data from database JSON to readable string array
 * @param features - JSON features from database
 * @returns Array of formatted feature strings
 */
export const formatFeatures = (features: any): string[] => {
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === 'string');
  }
  
  if (typeof features === 'object' && features !== null) {
    const featureList: string[] = [];
    const featuresObj = features as { [key: string]: any };
    
    if (featuresObj.channels) {
      featureList.push(
        `ערוצים: ${
          featuresObj.channels === 'all' 
            ? 'כל הערוצים' 
            : featuresObj.channels === 'premium' 
            ? 'ערוצים פרימיום' 
            : 'ערוצים ישראליים'
        }`
      );
    }
    if (featuresObj.quality) {
      featureList.push(`איכות: ${featuresObj.quality}`);
    }
    if (featuresObj.devices) {
      featureList.push(`${featuresObj.devices} מכשירים בו זמנית`);
    }
    if (featuresObj.vod) {
      featureList.push('תוכן לפי דרישה (VOD)');
    }
    
    return featureList;
  }
  
  return [];
};
