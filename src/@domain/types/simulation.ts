export interface PDLType {
  pdlNumber: string
  streetNumber?: string
  streetName: string
  streetPostCode: string
  streetCity: string
  buildingId?: string
  installations: InstallationType[]
  uri?: string
  tempCustomer?: string
  lon?: number
  lat?: number
}

export interface InstallationType {
  nbPanel: number
  energyPotential: number
  azimuthOrientation: number
  panelTilt: number
  department: number
}

export type BuildingData = {
  id?: number
  simulation?: string
  idBuilding: number
  name: string
  pdlNumber: string
  isCustomerCertifiesOwnership?: boolean
  isAgreementBareOwner?: boolean
  simulationItems?: SimulationItem[]
}

export type SimulationItem = {
  id?: number
  simulation?: number
  pdl?: number
  building?: number
  zone?: number
  nbPanel?: number
  energyPotential?: number
  detailedEnergyPotential?: object
  inclinaison?: number
  azimuth?: number
}

export type SimulationOwnedBy = {
  picture: string
  id: number
  createdAt: Date
  updatedAt?: Date
  fullName: string
}
