<script setup lang="ts">
import { getFormatPDL } from '@/utils/numberUtils'

interface Props {
  pdl: object | undefined
  title: string
}

const props = defineProps<Props>()
</script>

<template>
  <template v-if="props.pdl">
    <div class="d-flex align-center gap-2">
      <VIcon
        icon="carbon:meter-alt"
        color="primary"
        size="large"
      />
      <div class="text-h6">
        <span>{{ props.title }}</span>
        <span class="text-primary text-h5 font-weight-bold">
          {{ getFormatPDL(props.pdl.pdlNumber) }}
        </span>
      </div>
    </div>
    <div class="d-flex align-center mb-3">
      <VIcon
        size="x-small"
        color="primary"
        icon="mdi-location"
        class="ml-1 mr-4"
      />
      <span class="text-body-1">
        {{
          (props.pdl.streetNumber ? `${props.pdl.streetNumber}, ` : '') +
          (props.pdl.streetName ? `${props.pdl.streetName} ` : '') +
          (props.pdl.streetPostCode ? ` - ${props.pdl.streetPostCode} ` : '') +
          (props.pdl.streetCity ? props.pdl.streetCity : '')
        }}
      </span>
      <div
        v-if="props.pdl.buildingId"
        class="d-flex align-center text-caption"
      >
        <span>&nbsp;-&nbsp;</span>
        <VIcon
          icon="clarity:building-solid"
          size="x-small"
          color="primary"
          class="me-1"
        />
        <span>{{ props.pdl.buildingId }}</span>
      </div>
    </div>
    <VAlert
      v-if="props.pdl.isCustomerCertifiesOwnership || props.pdl.isAgreementBareOwner"
      :icon="props.pdl.isCustomerCertifiesOwnership ? 'ic:baseline-key' : 'ph:signature-bold'"
      prominent
      border="start"
      :color="props.pdl.isCustomerCertifiesOwnership ? 'info' : 'warning'"
      variant="tonal"
      density="compact"
      class="text-wrap mb-5"
    >
      <span class="d-flex justify-start font-weight-bold">
        {{
          props.pdl.isCustomerCertifiesOwnership
            ? 'Le prospect atteste être légalement propriétaire de l’Immeuble.'
            : 'Le prospect atteste être locataire de l’Immeuble et bénéficier d’une autorisation écrite du propriétaire.'
        }}
      </span>
    </VAlert>
  </template>
</template>
