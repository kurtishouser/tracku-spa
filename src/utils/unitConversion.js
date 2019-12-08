const mpsToMph = (mps, digits = 0) => {
  return (mps * 2.23694).toFixed(digits);
};

const metersToFeet = (meters, digits = 0) => {
  return (meters * 3.28084).toFixed(digits);
};

const metersToMiles = (meters, digits = 0) => {
  return (meters / 1609.344).toFixed(digits);
};

export {
  mpsToMph,
  metersToFeet,
  metersToMiles,
};
