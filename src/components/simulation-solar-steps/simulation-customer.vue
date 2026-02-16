<script setup lang="ts">
import { vMaska } from 'maska'
import { useSimulationStore } from '@/stores/simulation'
import { getAll, getById } from '@/services/api'
import { getTitle } from '@/utils/stringUtils'
import { noSpacesCounter } from '@/utils/formUtils'
import { getArrayOfValueFromArrayOfObject } from '@/utils/arrayUtils'

const maskPhone = { mask: '## ## ## ## ##' }
const maskSIRET = { mask: '### ### ### #####' }

const simulationStore = useSimulationStore()
const { tempCustomerData, simulationData } = storeToRefs(simulationStore)
const { nextStep } = simulationStore

const isLoading = ref(false)
const companyData = ref()

const company = reactive({
  type: null,
  name: null,
  denomination: null,
  siretNumber: null,
})

const sirenValidation = ref('lazy submit')
const logoSearchValidation = ref('map:search')
const companyTypes = ref([])

const addressSelected = ref(null)
const search = ref(null)
const addressSuggestionDisplay = ref([])
const isSearching = ref(false)

const isEntrepriseFermee = ref(false)
const texteEntrepriseFermee = ref()
const alertSIRETNotFoundDisplay = ref(false)
const alertSIRETNotFoundText = ref('')
const isValidSiret = ref(false)

const UIElements = reactive({
  labelNom: null,
  labelPrenom: null,
  titreSectionAdresse: null,
})

const onClickNext = async () => {
  await form.value.validate()
  if (tempCustomerData.value.customerType === 2) {
    await formSiret.value.validate()
    if (!validSiret.value) return
  }

  if (valid.value) nextStep()
}

const variantPro = computed(() => {
  if (tempCustomerData.value.customerType === 2) return 'elevated'

  return 'outlined'
})

const variantParticulier = computed(() => {
  if (tempCustomerData.value.customerType === 1) return 'elevated'

  return 'outlined'
})

watch(tempCustomerData.value, () => {
  if (tempCustomerData.value.customerType === 1) {
    UIElements.labelNom = 'Nom'
    UIElements.labelPrenom = 'Prénom'
    UIElements.titreSectionAdresse = 'Adresse'
    if (tempCustomerData.value.canDeductVAT === null) tempCustomerData.value.canDeductVAT = false
  } else if (tempCustomerData.value.customerType === 2) {
    UIElements.labelNom = 'Nom'
    UIElements.labelPrenom = 'Prénom'
    UIElements.titreSectionAdresse = 'Adresse siège social'
    if (tempCustomerData.value.canDeductVAT === null) tempCustomerData.value.canDeductVAT = true
  }
})

const onClickParticular = () => {
  tempCustomerData.value.customerType = 1
}

const onClickProfessional = () => {
  tempCustomerData.value.customerType = 2
}

const onSearchFromSIRET = async () => {
  await formSiret.value.validate()
  if (!validSiret.value) return
  sirenValidation.value = 'input'

  const siret = tempCustomerData.value.siret?.replaceAll(/\s/g, '')

  isLoading.value = true
  logoSearchValidation.value = 'line-md:loading-loop'

  getById('siret', siret)
    .then(res => {
      companyData.value = res.data.data
      logoSearchValidation.value = 'map:search'
      alertSIRETNotFoundDisplay.value = false

      if (companyData.value.uriCategorieJuridique !== null)
        tempCustomerData.value.companyType = companyData.value.uriCategorieJuridique

      /* else {
        tempCustomerData.value.companyType = companyData.value.nomCategorieJuridique
      } */

      tempCustomerData.value.companyName = getTitle(companyData.value.companyName)
      tempCustomerData.value.companyDenomination = getTitle(companyData.value.denomination)
      tempCustomerData.value.streetNumber = companyData.value.addressNumber
      tempCustomerData.value.streetName = getTitle(companyData.value.addressName)
      tempCustomerData.value.streetPostcode = companyData.value.addressPostCode
      tempCustomerData.value.streetCity = getTitle(companyData.value.addressCity)
      tempCustomerData.value.longitude = simulationData.value.isSameAddresses && companyData.value?.pdlLongitude
      tempCustomerData.value.latitude = simulationData.value.isSameAddresses && companyData.value?.pdlLatitude
      if (companyData.value.estFerme) {
        isEntrepriseFermee.value = true
        texteEntrepriseFermee.value = 'Cet établissement semble fermé'
        if (companyData.value.dateFermeture)
          texteEntrepriseFermee.value += ` depuis le ${companyData.value.dateFermeture}`

        isValidSiret.value = false
      } else {
        isEntrepriseFermee.value = false
        texteEntrepriseFermee.value = null
        isValidSiret.value = true
      }
    })
    .catch(err => {
      alertSIRETNotFoundDisplay.value = true
      alertSIRETNotFoundText.value = `${err.response.data.error}<br>` + 'Merci de basculer en "Particulier"'
      isEntrepriseFermee.value = false
      texteEntrepriseFermee.value = null
      isValidSiret.value = false
      console.error(err)
    })
    .finally(() => {
      logoSearchValidation.value = 'map:search'
      isLoading.value = false
    })
}

onMounted(() => {
  if (tempCustomerData.value.customerType && tempCustomerData.value.customerType === 2) {
    if (
      (tempCustomerData.value.companyDenomination || tempCustomerData.value.companyName) &&
      tempCustomerData.value.siret
    )
      isValidSiret.value = true
  }

  getAll('company_type', true, 'get+ld')
    .then(res => {
      companyTypes.value = getArrayOfValueFromArrayOfObject(res.data, 'name')
      company.companyType = tempCustomerData.value.companyType
    })
    .catch(err => {
      console.error(err)
    })
})

const searchingAddress = value => {
  const searchingData = value.trim()
  if (searchingData.length > 3) {
    isSearching.value = true
    getById('addressSuggestion', searchingData)
      .then(res => {
        addressSuggestionDisplay.value = getListDisplayAddresses(res.data.data)
      })
      .catch(err => {
        console.error(err)
      })
      .finally(() => (isSearching.value = false))
  }
}

const getListDisplayAddresses = listItems => {
  const tempArray = []
  let id = 0
  listItems.map(e => {
    tempArray.push({
      label: e.properties.label,
      id,
      full: e,
    })
    id++
  })

  return tempArray
}

/**
 * Gestion timeout pour ne pas lancer la recherche API à chaque saisie
 */
const timeout = ref(null)

watch(search, val => {
  val && val !== addressSelected.value && onInputSearchingAddress(val)
})

const onInputSearchingAddress = (value, time = 500) => {
  clearTimeout(timeout.value)
  timeout.value = setTimeout(() => {
    searchingAddress(value)
  }, time)
}

const onSelectAddress = () => {
  tempCustomerData.value.streetNumber = addressSelected.value.full.properties.housenumber
  tempCustomerData.value.streetName = getTitle(addressSelected.value.full.properties.street)
  tempCustomerData.value.streetPostcode = addressSelected.value.full.properties.postcode
  tempCustomerData.value.streetCity = getTitle(addressSelected.value.full.properties.city)
  tempCustomerData.value.longitude = addressSelected.value.full?.geometry?.coordinates
    ? addressSelected.value.full.geometry.coordinates[0]
    : null
  tempCustomerData.value.latitude = addressSelected.value.full?.geometry?.coordinates
    ? addressSelected.value.full.geometry.coordinates[1]
    : null
}

/**
 * VALIDATION FORM
 */
const valid = ref(false)
const validSiret = ref(false)
const form = ref(null)
const formSiret = ref(null)

const siretRules = [
  v => !!v || 'Le SIRET ne peut pas être vide',
  v => (v.replaceAll(/\s/g, '') && v.replaceAll(/\s/g, '').length === 14) || 'Le SIRET doit comporter 14 caractères',
]

const civilityRules = [v => !!v || 'La civilité est requise']
const addressNameRules = [v => !!v || "L'adresse est requise"]
const addressZipcodeRules = [v => !!v || 'Le code postal est requis']
const addressCityRules = [v => !!v || 'La ville est requise']
const customerFirstnameRules = [v => !!v || 'Le prénom est requis']
const customerLastnameRules = [v => !!v || 'Le nom est requis']
const customerPositionRules = [v => !!v || 'La fonction est requise']

const customerEmailRules = [
  v => !!v || "L'adresse mail est requise",
  v =>
    /^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\].,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      v,
    ) || "L'adresse mail doit être valide",
]

const customerPhoneRules = [v => !!v || 'Le numéro de téléphone ne peut pas être vide']

/**
 * FIN VALIDATION FORM
 */
</script>

<template>
  <VForm
    ref="form"
    v-model="valid"
    @submit.prevent="onClickNext"
  >
    <VContainer class="mt-8">
      <VRow
        align="center"
        justify="center"
        class="pb-5"
      >
        <VCol cols="12">
          <VRow
            align="center"
            justify="center"
            class="gap-x-8"
          >
            <VBtn
              size="x-large"
              :variant="variantParticulier"
              prepend-icon="bi:house-fill"
              :ripple="false"
              text="Particulier"
              @click.prevent="onClickParticular"
            />
            <VBtn
              size="x-large"
              :variant="variantPro"
              prepend-icon="cil:industry"
              :ripple="false"
              text="Professionnel"
              @click.prevent="onClickProfessional"
            />
          </VRow>
        </VCol>
      </VRow>
      <VFadeTransition mode="out-in">
        <VRow v-if="tempCustomerData.customerType === 1">
          <VContainer>
            <VRow
              align="center"
              justify="center"
            >
              <VCol
                cols="7"
                lg="4"
              >
                <VAutocomplete
                  v-model="addressSelected"
                  v-model:search="search"
                  variant="underlined"
                  label="Recherche de l'adresse"
                  hide-no-data
                  item-title="label"
                  item-value="id"
                  :items="addressSuggestionDisplay"
                  :loading="isSearching"
                  clearable
                  no-filter
                  return-object
                  autocomplete="off"
                  @update:model-value="onSelectAddress"
                />
              </VCol>
            </VRow>
            <VRow class="mt-8">
              <VCol cols="12">
                <h2 class="text-h5 font-weight-bold text-center mt-8">
                  <VIcon
                    icon="bxs:map"
                    color="primary"
                    size="x-large"
                  />
                  {{ UIElements.titreSectionAdresse }}
                </h2>
              </VCol>
            </VRow>
            <VRow justify="center">
              <VCol
                cols="2"
                lg="1"
              >
                <VTextField
                  v-model="tempCustomerData.streetNumber"
                  label="Numéro"
                  variant="solo-filled"
                />
              </VCol>
              <VCol
                cols="7"
                lg="5"
              >
                <VTextField
                  v-model="tempCustomerData.streetName"
                  label="Adresse"
                  variant="solo-filled"
                  :rules="addressNameRules"
                />
              </VCol>
            </VRow>
            <VRow
              justify="center"
              class="mt-5"
            >
              <VCol
                cols="3"
                lg="2"
              >
                <VTextField
                  v-model="tempCustomerData.streetPostcode"
                  label="Code postal"
                  variant="solo-filled"
                  :rules="addressZipcodeRules"
                />
              </VCol>
              <VCol cols="5">
                <VTextField
                  v-model="tempCustomerData.streetCity"
                  label="Ville"
                  variant="solo-filled"
                  :rules="addressCityRules"
                />
              </VCol>
            </VRow>
            <VRow class="mt-15">
              <VCol cols="12">
                <h2 class="text-h5 font-weight-bold text-center mt-8">
                  <VIcon
                    icon="teenyicons:contact-solid"
                    class="me-3"
                    color="primary"
                    size="x-large"
                  />
                  Vos contacts
                </h2>
              </VCol>
            </VRow>
            <VRow
              align="center"
              justify="center"
            >
              <VCol lg="2">
                <VSelect
                  v-model="tempCustomerData.civility"
                  label="Civilité"
                  :items="['M.', 'Mme']"
                  variant="solo-filled"
                  :rules="civilityRules"
                />
              </VCol>
              <VCol
                cols="5"
                lg="3"
              >
                <VTextField
                  v-model="tempCustomerData.lastname"
                  :label="UIElements.labelNom"
                  variant="solo-filled"
                  :rules="customerLastnameRules"
                  name="name"
                />
              </VCol>
              <VCol
                cols="5"
                lg="3"
              >
                <VTextField
                  v-model="tempCustomerData.firstname"
                  :label="UIElements.labelPrenom"
                  variant="solo-filled"
                  :rules="customerFirstnameRules"
                  name="firstname"
                />
              </VCol>
            </VRow>
          </VContainer>
        </VRow>
        <VRow v-if="tempCustomerData.customerType === 2">
          <VContainer>
            <VRow
              align="center"
              justify="center"
            >
              <VCol
                cols="10"
                md="5"
                lg="3"
                class="mt-4"
              >
                <VForm
                  ref="formSiret"
                  v-model="validSiret"
                  :validate-on="sirenValidation"
                  @submit.prevent="onClickNext"
                >
                  <VTextField
                    v-model="tempCustomerData.siret"
                    v-maska:[maskSIRET]
                    variant="underlined"
                    label="Numéro de SIRET"
                    type="input"
                    name="siret"
                    :counter-value="noSpacesCounter"
                    :counter="14"
                    :rules="siretRules"
                    :validate-on="validSiret === null || validSiret === undefined ? 'submit' : 'input'"
                    :append-inner-icon="logoSearchValidation"
                    :loading="isLoading"
                    class="field-siret__input"
                    @click:append-inner="onSearchFromSIRET"
                  />
                </VForm>
              </VCol>
            </VRow>
            <VSlideYTransition mode="out-in">
              <VRow
                v-if="alertSIRETNotFoundDisplay"
                justify="center"
              >
                <VCol
                  cols="10"
                  lg="5"
                  class="pt-0 pb-6"
                >
                  <VAlert
                    prominent
                    color="warning"
                    variant="elevated"
                    icon="tabler:file-unknown"
                  >
                    <span v-html="alertSIRETNotFoundText" />
                  </VAlert>
                </VCol>
              </VRow>
              <VRow
                v-if="isEntrepriseFermee"
                align="center"
                justify="center"
              >
                <VCol
                  cols="4"
                  class="pt-0 mb-2"
                >
                  <VAlert
                    title="Établissement non actif"
                    :text="texteEntrepriseFermee"
                    color="error"
                    icon="bi:building-slash"
                    prominent
                  />
                </VCol>
              </VRow>
            </VSlideYTransition>
            <div
              v-if="isValidSiret"
              class="mt-2"
            >
              <VRow
                justify="center"
                align="center"
              >
                <VCol
                  cols="4"
                  lg="3"
                >
                  <VAutocomplete
                    v-model="tempCustomerData.companyType"
                    variant="solo-filled"
                    label="Forme juridique"
                    :items="companyTypes"
                    no-data-text="Pas de correspondance trouvée"
                    item-value="id"
                    item-title="name"
                  />
                </VCol>
                <VCol
                  cols="4"
                  lg="3"
                >
                  <VTextField
                    v-model="tempCustomerData.companyName"
                    variant="solo-filled"
                    label="Raison sociale"
                  />
                </VCol>
                <VCol
                  cols="4"
                  lg="3"
                >
                  <VTextField
                    v-model="tempCustomerData.companyDenomination"
                    variant="solo-filled"
                    label="Dénomination"
                  />
                </VCol>
              </VRow>
              <VRow class="mt-15">
                <VCol cols="12">
                  <h2 class="text-h5 font-weight-bold text-center mt-8">
                    <VIcon
                      icon="bxs:map"
                      color="primary"
                      size="x-large"
                    />
                    {{ UIElements.titreSectionAdresse }}
                  </h2>
                </VCol>
              </VRow>
              <VRow justify="center">
                <VCol
                  cols="2"
                  lg="1"
                >
                  <VTextField
                    v-model="tempCustomerData.streetNumber"
                    label="Numéro"
                    variant="solo-filled"
                    name="number"
                  />
                </VCol>
                <VCol
                  cols="7"
                  lg="5"
                >
                  <VTextField
                    v-model="tempCustomerData.streetName"
                    label="Adresse"
                    variant="solo-filled"
                    :rules="addressNameRules"
                    name="adresse"
                  />
                </VCol>
              </VRow>
              <VRow
                justify="center"
                class="mt-5"
              >
                <VCol
                  cols="3"
                  lg="2"
                >
                  <VTextField
                    v-model="tempCustomerData.streetPostcode"
                    label="Code postal"
                    variant="solo-filled"
                    :rules="addressZipcodeRules"
                    name="codePostal"
                  />
                </VCol>
                <VCol cols="5">
                  <VTextField
                    v-model="tempCustomerData.streetCity"
                    label="Ville"
                    variant="solo-filled"
                    :rules="addressCityRules"
                    name="ville"
                  />
                </VCol>
              </VRow>
              <VRow class="mt-15">
                <VCol cols="12">
                  <h2 class="text-h5 font-weight-bold text-center mt-8">
                    <VIcon
                      icon="mingcute:location-3-fill"
                      class="me-3"
                      color="primary"
                      size="x-large"
                    />
                    Adresse d'installation
                  </h2>
                </VCol>
              </VRow>
              <VRow
                align="center"
                justify="center"
              >
                <VCol
                  :cols="simulationData.isSameAddresses ? 6 : 9"
                  class="d-flex justify-center align-center text-center font-bold"
                >
                  <VCard
                    class="w-50"
                    :class="{ 'pb-7 bg-var-theme-background w-100': !simulationData.isSameAddresses }"
                    :elevation="simulationData.isSameAddresses ? 0 : 8"
                  >
                    <div
                      class="d-flex justify-center py-4"
                      :class="{ 'bg-var-theme-background rounded-shaped': simulationData.isSameAddresses }"
                    >
                      <VCheckbox
                        v-model="simulationData.isSameAddresses"
                        label="Identique adresse siège social"
                      />
                    </div>
                    <VSlideYReverseTransition mode="out-in">
                      <div
                        v-if="!simulationData.isSameAddresses"
                        class="mt-5"
                      >
                        <VRow justify="center">
                          <VCol
                            cols="2"
                            lg="2"
                          >
                            <VTextField
                              v-model="simulationData.installationStreetNumber"
                              label="Numéro"
                              variant="solo-filled"
                              name="installationStreetNumber"
                            />
                          </VCol>
                          <VCol
                            cols="6"
                            lg="7"
                          >
                            <VTextField
                              v-model="simulationData.installationStreetName"
                              label="Adresse"
                              variant="solo-filled"
                              :rules="!simulationData.isSameAddresses && addressNameRules"
                              name="installationStreetName"
                            />
                          </VCol>
                        </VRow>
                        <VRow
                          justify="center"
                          class="mt-5"
                        >
                          <VCol
                            cols="3"
                            lg="2"
                          >
                            <VTextField
                              v-model="simulationData.installationStreetPostcode"
                              label="Code postal"
                              variant="solo-filled"
                              :rules="!simulationData.isSameAddresses && addressZipcodeRules"
                              name="installationStreetPostcode"
                            />
                          </VCol>
                          <VCol cols="5">
                            <VTextField
                              v-model="simulationData.installationStreetCity"
                              label="Ville"
                              variant="solo-filled"
                              :rules="!simulationData.isSameAddresses && addressCityRules"
                              name="installationStreetCity"
                            />
                          </VCol>
                        </VRow>
                      </div>
                    </VSlideYReverseTransition>
                  </VCard>
                </VCol>
              </VRow>
              <VRow class="mt-15">
                <VCol cols="12">
                  <h2 class="text-h5 font-weight-bold text-center mt-8">
                    <VIcon
                      icon="teenyicons:contact-solid"
                      class="me-3"
                      color="primary"
                      size="x-large"
                    />
                    Vos contacts
                  </h2>
                </VCol>
              </VRow>
              <VRow
                align="center"
                justify="center"
              >
                <VCol cols="2">
                  <VSelect
                    v-model="tempCustomerData.civility"
                    label="Civilité"
                    :items="['M.', 'Mme']"
                    variant="solo-filled"
                    :rules="civilityRules"
                  />
                </VCol>
                <VCol
                  cols="5"
                  lg="3"
                >
                  <VTextField
                    v-model="tempCustomerData.lastname"
                    :label="UIElements.labelNom"
                    variant="solo-filled"
                    :rules="customerLastnameRules"
                    name="name"
                  />
                </VCol>
                <VCol
                  cols="5"
                  lg="3"
                >
                  <VTextField
                    v-model="tempCustomerData.firstname"
                    :label="UIElements.labelPrenom"
                    variant="solo-filled"
                    :rules="customerFirstnameRules"
                    name="firstname"
                  />
                </VCol>
              </VRow>
              <VRow justify="center">
                <VCol
                  cols="7"
                  lg="5"
                >
                  <VTextField
                    v-model="tempCustomerData.position"
                    label="Fonction"
                    variant="solo-filled"
                    :rules="customerPositionRules"
                    name="position"
                  />
                </VCol>
              </VRow>
            </div>
          </VContainer>
        </VRow>
      </VFadeTransition>
      <VFadeTransition mode="out-in">
        <VRow
          v-if="tempCustomerData.customerType === 1 || (tempCustomerData.customerType === 2 && isValidSiret)"
          justify="center"
          align="center"
        >
          <VCol
            cols="6"
            lg="3"
          >
            <VTextField
              v-model="tempCustomerData.email"
              label="Adresse mail"
              prepend-inner-icon="tabler:at"
              variant="solo-filled"
              :rules="customerEmailRules"
              :validate-on="customerEmailRules === null || customerEmailRules === undefined ? 'submit' : 'input'"
              name="email"
            />
          </VCol>
          <VCol
            cols="4"
            lg="3"
          >
            <VTextField
              v-model="tempCustomerData.phoneNumber"
              v-maska:[maskPhone]
              label="Numéro de téléphone"
              prepend-inner-icon="ph:phone-bold"
              variant="solo-filled"
              :rules="customerPhoneRules"
              name="phone"
            />
          </VCol>
        </VRow>
      </VFadeTransition>
      <VRow
        v-if="tempCustomerData.customerType !== null"
        class="mt-15 gap-x-8"
        align="center"
        justify="center"
      >
        <VBtn
          append-icon="ion:arrow-forward"
          text="Suivant"
          @click.prevent="onClickNext"
          :disabled="!valid"
        />
      </VRow>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
:deep(.field-siret__input .v-field input) {
  padding-bottom: 0 !important;
  text-align: center !important;
  color: rgba(var(--v-theme-on-background)) !important;
  font-size: 1.4rem !important;
  font-weight: 400 !important;
}

:deep(.field-siret__input .v-field__append-inner) {
  padding-top: 1.8rem !important;
}
</style>
