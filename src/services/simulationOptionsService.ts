import { dataFormatterBeforePersist, deleteById, get, patchById, post } from '@/services/api'

type SimulationOptionItem = {
  dataType: string
  options?: object[]
  icon: string
  variableName: string
  isVisible: boolean
  helpMsg?: string
  prefix?: string
  onlyRoof?: boolean
}
// E pour toit terrasse, car anciennement EDPM
const typeRoof = [
  { key: 'T', title: 'Tuile' },
  { key: 'A', title: 'Ardoise' },
  { key: 'B', title: 'Bac acier' },
  { key: 'F', title: 'Fibrociment' },
  { key: 'E', title: 'Toit Terrasse' },
  { key: 'O', title: 'Autre' },
]

const optionsPhase = [
  { key: 'SP', title: 'Monophasé' },
  { key: 'TP', title: 'Triphasé' },
  { key: 'HT', title: 'Haute tension' },
]

const optionsAjoutBatterie = [
  { key: 'O', title: 'Oui' },
  { key: 'N', title: 'Non' },
  { key: 'U', title: 'Ultérieurement' },
]
const optionsAjoutBorne = [
  { key: 'O', title: 'Oui' },
  { key: 'N', title: 'Non' },
  { key: 'U', title: 'Ultérieurement' },
]

const optionsImplantation = [
  { key: 'T', title: 'Sur toiture' },
  { key: 'S', title: 'Au sol' },
  { key: 'O', title: 'Sur ombrière' },
]

const optionsAmiante = [
  { key: 'A', title: 'Amianté' },
  { key: 'N', title: 'Non amianté' },
  { key: 'I', title: 'Inconnu' },
]

const optionsERP = [
  { key: true, title: 'Bâtiment ERP' },
  { key: false, title: 'Bâtiment non ERP' },
]

const typeRoofList = typeRoof.map(roof => roof.title)

const baseOptionList: SimulationOptionItem[] = [
  {
    name: 'Type de phase',
    dataType: 'radio',
    options: [...optionsPhase],
    icon: 'bi:plug',
    variableName: 'phaseType',
    isVisible: true,
  },
  {
    name: 'Ajout de batterie',
    dataType: 'radio',
    options: [...optionsAjoutBatterie],
    icon: 'icon-park-twotone:car-battery',
    variableName: 'addBattery',
    isVisible: false,
  },
  {
    name: 'Ajout de borne',
    dataType: 'radio',
    options: [...optionsAjoutBorne],
    icon: 'cbi:charging-station',
    variableName: 'addChargingPoint',
    isVisible: false,
  },
  {
    name: 'Implantation',
    dataType: 'radio',
    options: [...optionsImplantation],
    icon: 'dashicons:location-alt',
    variableName: 'installationLocation',
    isVisible: false,
  },
  {
    name: 'Type de toiture',
    dataType: 'radio',
    options: [...typeRoof],
    icon: 'mdi:home-roof',
    variableName: 'roofType',
    isVisible: false,
  },
  {
    name: 'Nombre de niveau',
    dataType: 'number',
    icon: 'ph:steps-fill',
    variableName: 'nbLevel',
    isVisible: false,
    helpMsg: "Bâtiment résidentiel : nombre d'étages, rez-de-chaussée INCLUS<br>Bâtiment industriel : un niveau = 3m",
    prefix: 'niveau(x)',
    onlyRoof: true,
  },
  {
    name: "Présence d'amiante",
    dataType: 'radio',
    options: [...optionsAmiante],
    icon: 'fluent-emoji-high-contrast:rock',
    variableName: 'asbestosRoof',
    isVisible: false,
    onlyRoof: true,
  },
  {
    name: 'Total pans de toit',
    dataType: 'number',
    icon: 'material-symbols:roofing',
    variableName: 'nbRoofSection',
    isVisible: false,
    prefix: 'pan(s) de pose',
    onlyRoof: true,
  },
  {
    name: 'Batiment accueillant du public',
    dataType: 'radio',
    options: [...optionsERP],
    icon: 'pepicons-pencil:people',
    variableName: 'isErpBuilding',
    isVisible: false,
  },
]

const typeData = {}

const getSimulationOptions = simulationId => {
  return get('simulation_option', '', true, 'get', {
    statusGroup: simulationId,
  })
}

const postSimulationOptions = simulationOptions => {
  const formattedData = dataFormatterBeforePersist(simulationOptions, typeData)
  formattedData.building ? (formattedData.building = `/api/buildings/${formattedData.building}`) : null
  return post('simulation_option', formattedData, true)
}

const updateSimulationOptions = (simulationOptionsId, simulationOptions) => {
  const formattedData = dataFormatterBeforePersist(simulationOptions, typeData)
  formattedData.building ? (formattedData.building = `/api/buildings/${formattedData.building}`) : null
  return patchById('simulation_option', simulationOptionsId, formattedData)
}

const removeSimulationOptions = simulationOptionsId => {
  return deleteById('simulation_option', simulationOptionsId)
}

export {
  typeRoof,
  optionsPhase,
  optionsImplantation,
  optionsERP,
  optionsAjoutBatterie,
  optionsAmiante,
  optionsAjoutBorne,
  SimulationOptionItem,
  baseOptionList,
  typeRoofList,
  getSimulationOptions,
  postSimulationOptions,
  updateSimulationOptions,
  removeSimulationOptions,
}
