<script setup lang="ts">
import { getFormatPhone } from '@/utils/numberUtils'
import { getTempCustomerData, patchTempCustomerData } from '@/services/customerService'
import { getAllCompanyType } from '@/services/companyTypeService'
import { useUserStore } from '@/stores/user'
import { ability } from '@/plugins/casl/casl'

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'forceUpdateData', value: boolean): void
}>()

const userStore = useUserStore()
const { authUser } = userStore

interface Props {
  customerInfos?: object
}

const getAddress = () => {
  let tmp = ''
  if (props.customerInfos) {
    if (props.customerInfos.streetNumber) tmp += `${props.customerInfos.streetNumber}, `

    if (props.customerInfos.streetName) tmp += `${props.customerInfos.streetName} `
  }

  return tmp.length > 1 ? tmp : '-'
}

const styleTypeClient = reactive({
  color: 'warning',
  icon: 'maki:caution',
  text: 'non renseigné',
})

const updateLogoCustomerType = () => {
  styleTypeClient.text = props.customerInfos.customerType ? props.customerInfos.customerType : 'non renseigné'
  if (props.customerInfos.customerType === 'Professionnel') {
    styleTypeClient.color = 'primary'
    styleTypeClient.icon = 'fa6-solid:industry'
  } else if (props.customerInfos.customerType === 'Particulier') {
    styleTypeClient.color = 'info'
    styleTypeClient.icon = 'uil:house-user'
  }
}

onMounted(() => {
  updateLogoCustomerType()
})

onUpdated(() => {
  updateLogoCustomerType()
})

/**
 * EDITION INFORMATION PROSPECT
 */
const isLoadingData = ref(false)
const dialogProspectEdit = ref(false)
const isPersistingProspectEdit = ref(false)
const isProspectEditPersisted = ref(false)

const tempCustomerData = ref({
  firstname: null,
  lastname: null,
  email: null,
  phoneNumber: null,
  companyType: null,
  companyName: null,
  siret: null,
  streetNumber: null,
  streetName: null,
  streetPostcode: null,
  streetCity: null,
  canDeductVAT: false,
  civility: null,
  position: null,
  customerType: null,
})

const itemsCustomerType = [
  { id: 1, name: 'Particulier' },
  { id: 2, name: 'Professionnel' },
]

const itemsCompanyType = ref([])

watch(dialogProspectEdit, () => {
  if (
    dialogProspectEdit.value === true &&
    props.customerInfos.hasOwnProperty('tempCustomer_id') &&
    props.customerInfos.tempCustomer_id !== null
  ) {
    isLoadingData.value = true
    getTempCustomerData(props.customerInfos.tempCustomer_id)
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        tempCustomerData.value.firstname = res.data.firstname
        tempCustomerData.value.lastname = res.data.lastname
        tempCustomerData.value.email = res.data.email
        tempCustomerData.value.phoneNumber = res.data.phoneNumber
        tempCustomerData.value.companyName = res.data.companyName
        tempCustomerData.value.siret = res.data.siret
        tempCustomerData.value.streetNumber = res.data.streetNumber
        tempCustomerData.value.streetName = res.data.streetName
        tempCustomerData.value.streetPostcode = res.data.streetPostcode
        tempCustomerData.value.streetCity = res.data.streetCity
        tempCustomerData.value.canDeductVAT = res.data.canDeductVAT
        tempCustomerData.value.civility = res.data.civility
        tempCustomerData.value.position = res.data.position
        tempCustomerData.value.customerType = res.data.customerType

        if (res.data.hasOwnProperty('companyType') && res.data.companyType.id)
          tempCustomerData.value.companyType = `/api/company_types/${res.data.companyType.id}`
      })
      .catch(err => console.error(err))
      .finally(() => (isLoadingData.value = false))

    getAllCompanyType()
      .then(res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        itemsCompanyType.value = res.data['hydra:member']
      })
      .catch(err => console.error(err))
  }
})

const onSubmitProspectEdit = () => {
  if (!props.customerInfos.tempCustomer_id) return

  isPersistingProspectEdit.value = true
  patchTempCustomerData(props.customerInfos.tempCustomer_id, JSON.parse(JSON.stringify(tempCustomerData.value)))
    .then(res => {
      isProspectEditPersisted.value = true
      if (process.env.NODE_ENV === 'development') console.log(res)

      emit('forceUpdateData', true)

      setTimeout(() => {
        isProspectEditPersisted.value = false
      }, 5000)
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingProspectEdit.value = false))
}
</script>

<template>
  <VCard :border="true">
    <VDialog
      v-model="dialogProspectEdit"
      max-width="1440"
      persistent
    >
      <VCard>
        <VCardTitle class="bg-info-900 d-flex align-center justify-space-between">
          <div>
            <VIcon
              icon="eos-icons:admin"
              color="yellow-sunstack"
              class="me-2"
            />
            <span class="text-white">Modifier les informations du prospects</span>
          </div>
          <DialogCloseBtn
            class="ma-4"
            @click="dialogProspectEdit = false"
          />
        </VCardTitle>
        <VFadeTransition mode="out-in">
          <div
            v-if="isLoadingData"
            class="d-flex justify-center my-8"
          >
            <VProgressCircular
              color="primary"
              indeterminate
              :size="125"
              :width="10"
            />
          </div>
          <div v-else>
            <VCardText>
              <VRow justify="space-between">
                <VCol cols="2">
                  <VSelect
                    v-model="tempCustomerData.customerType"
                    label="Type client"
                    :items="itemsCustomerType"
                    item-value="id"
                    item-title="name"
                  />
                </VCol>
                <VCol cols="3">
                  <VSwitch
                    v-model="tempCustomerData.canDeductVAT"
                    label="Peut déduire la TVA ?"
                  />
                </VCol>
                <VDialogTransition>
                  <VCol
                    v-if="tempCustomerData.customerType === 2"
                    cols="5"
                  >
                    <VTextField
                      v-model="tempCustomerData.siret"
                      label="SIRET"
                    />
                  </VCol>
                  <VCol
                    v-else
                    cols="5"
                  >
                    <VSpacer />
                  </VCol>
                </VDialogTransition>
              </VRow>
              <VExpandTransition>
                <VRow v-if="tempCustomerData.customerType === 2">
                  <VCol cols="4">
                    <VSelect
                      v-model="tempCustomerData.companyType"
                      :items="itemsCompanyType"
                      item-title="name"
                      item-value="@id"
                      label="Type de société"
                    />
                  </VCol>
                  <VCol cols="4">
                    <VTextField
                      v-model="tempCustomerData.companyName"
                      label="Raison sociale"
                    />
                  </VCol>
                  <VCol cols="4">
                    <VTextField
                      v-model="tempCustomerData.companyDenomination"
                      label="Dénomination"
                    />
                  </VCol>
                </VRow>
              </VExpandTransition>
              <VRow>
                <VCol cols="2">
                  <VTextField
                    v-model="tempCustomerData.civility"
                    label="Civilité"
                  />
                </VCol>
                <VCol cols="5">
                  <VTextField
                    v-model="tempCustomerData.lastname"
                    label="Nom"
                  />
                </VCol>
                <VCol cols="5">
                  <VTextField
                    v-model="tempCustomerData.firstname"
                    label="Prénom"
                  />
                </VCol>
              </VRow>
              <VExpandTransition>
                <VRow v-if="tempCustomerData.customerType === 2">
                  <VCol cols="5">
                    <VTextField
                      v-model="tempCustomerData.position"
                      label="Fonction"
                    />
                  </VCol>
                </VRow>
              </VExpandTransition>
              <VRow>
                <VCol cols="1">
                  <VTextField
                    v-model="tempCustomerData.streetNumber"
                    label="N°"
                  />
                </VCol>
                <VCol cols="11">
                  <VTextField
                    v-model="tempCustomerData.streetName"
                    label="Rue"
                  />
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="4">
                  <VTextField
                    v-model="tempCustomerData.streetPostcode"
                    label="Code postal"
                  />
                </VCol>
                <VCol cols="8">
                  <VTextField
                    v-model="tempCustomerData.streetCity"
                    label="Ville"
                  />
                </VCol>
              </VRow>
              <VRow>
                <VCol cols="6">
                  <VTextField
                    v-model="tempCustomerData.email"
                    label="Email"
                  />
                </VCol>
                <VCol cols="6">
                  <VTextField
                    v-model="tempCustomerData.phoneNumber"
                    label="Numéro de téléphone"
                  />
                </VCol>
              </VRow>
            </VCardText>
            <div class="d-flex align-center justify-end ma-6">
              <div>
                <VFadeTransition mode="out-in">
                  <div
                    v-if="isProspectEditPersisted"
                    class="text-success text-left d-inline-block mr-8"
                  >
                    <VIcon
                      icon="dashicons:saved"
                      class="me-2 ms-3"
                    />
                    <span>Les modifications ont bien été prises en compte</span>
                  </div>
                </VFadeTransition>
                <VBtn
                  prepend-icon="material-symbols:save"
                  text="Enregistrer"
                  variant="elevated"
                  elevation="12"
                  color="yellow-sunstack"
                  :loading="isPersistingProspectEdit"
                  :disabled="isPersistingProspectEdit"
                  @click="onSubmitProspectEdit"
                />
              </div>
            </div>
          </div>
        </VFadeTransition>
      </VCard>
    </VDialog>
    <VCardTitle class="d-flex align-center justify-center font-weight-bold position-relative">
      <VIcon
        icon="ph:user-list"
        color="primary"
      />
      <span class="ml-3">Informations prospect</span>
      <div
        v-if="
          (ability.can('manage', 'all') || authUser.roles.includes('ROLE_ADAM')) &&
          props.customerInfos.tempCustomer_id !== null
        "
        class="btn-edit"
      >
        <VBtn
          class="mx-0"
          text="Editer"
          size="small"
          variant="outlined"
          color="yellow-sunstack"
          append-icon="iconamoon:edit-light"
          @click="dialogProspectEdit = true"
        />
      </div>
    </VCardTitle>
    <VDivider class="mx-3" />
    <VCardText
      v-if="props.customerInfos"
      class="pt-3"
    >
      <VChip
        class="ma-2"
        :color="styleTypeClient.color"
        label
      >
        <VIcon
          start
          :icon="styleTypeClient.icon"
        />
        {{ styleTypeClient.text }}
      </VChip>
      <VList class="text-left">
        <DisplayList
          v-if="props.customerInfos.customerType === 'Professionnel'"
          title="Nom société"
          :content="props.customerInfos.fullname ? props.customerInfos.fullname : '-'"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          v-if="props.customerInfos.customerType === 'Professionnel'"
          title="Forme juridique"
          :content="
            props.customerInfos.companyType
              ? `${props.customerInfos.companyType} (${props.customerInfos.companyTypeFullname})`
              : '-'
          "
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          v-if="props.customerInfos.customerType === 'Professionnel'"
          title="SIRET"
          :content="props.customerInfos.siret ? props.customerInfos.siret : '-'"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Civilité"
          :content="
            props.customerInfos.civilite
              ? props.customerInfos.civilite.toLowerCase() === 'mme'
                ? 'Madame'
                : 'Monsieur'
              : '-'
          "
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Nom"
          :content="props.customerInfos.lastname ? props.customerInfos.lastname : '-'"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Prénom"
          :content="props.customerInfos.firstname ? props.customerInfos.firstname : '-'"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          v-if="props.customerInfos.customerType === 'Professionnel'"
          title="Fonction"
          :content="props.customerInfos.position ? props.customerInfos.position : '-'"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Adresse"
          :content="getAddress()"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Ville"
          :content="`
            ${props.customerInfos.streetPostcode ? props.customerInfos.streetPostcode : '-'} ${props.customerInfos.streetCity ? props.customerInfos.streetCity : ''}`"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Adresse mail"
          :content="props.customerInfos.email ? props.customerInfos.email : '-'"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Téléphone"
          :content="props.customerInfos.phone ? getFormatPhone(props.customerInfos.phone) : '-'"
          :divider-bottom="true"
          :make-clickable="true"
        />
        <DisplayList
          title="Peut récupérer la TVA ?"
          :content="
            null !== props.customerInfos.canDeductVAT ? (props.customerInfos.canDeductVAT ? 'Oui' : 'Non') : '-'
          "
          :divider-bottom="false"
        />
      </VList>
      <VCardItem
        v-if="props.customerInfos.customerType === 'Professionnel' && props.customerInfos.siret"
        class="d-flex align-center justify-start"
      >
        <VBtn
          v-if="props.customerInfos.siret"
          text="Fiche INSEE"
          prepend-icon="dashicons:media-spreadsheet"
          color="info"
          variant="outlined"
          :href="`https://api-avis-situation-sirene.insee.fr/identification/pdf/${props.customerInfos.siret}`"
          target="_blank"
          rel="noopener noreferrer"
        />
      </VCardItem>
    </VCardText>
    <VCardText v-else>
      <span class="font-italic">Aucune information sur le prospet trouvée</span>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">
.btn-edit {
  position: absolute;
  right: 0;
  margin: 0 0.8rem;
}
</style>
