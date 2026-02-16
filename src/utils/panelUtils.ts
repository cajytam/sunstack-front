const RoofOrientation = {
  '-180': 'Nord',
  '-135': 'Nord-Est',
  '-90': 'Est',
  '-45': 'Sud-Est',
  '0': 'Sud',
  '45': 'Sud-Ouest',
  '90': 'Ouest',
  '135': 'Nord-Ouest',
}

function getRoofOrientationName(direction: number | string): string {
  return RoofOrientation[direction.toString()]
}

export { RoofOrientation, getRoofOrientationName }
