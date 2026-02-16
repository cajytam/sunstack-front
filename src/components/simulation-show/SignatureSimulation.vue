<script setup lang="ts">
import { getDateFormat } from '@/utils/dateUtils'

interface Props {
  signatures: object | null
  statusSignature: object | null
}

const props = defineProps<Props>()
</script>

<template>
  <VCard border>
    <VCardTitle class="d-flex align-center justify-center font-weight-bold">
      <VIcon
        icon="fluent:signature-16-regular"
        color="primary"
      />
      <span class="ml-3">Signature(s)</span>
    </VCardTitle>
    <VCardText v-if="props.signatures.length > 0">
      <VTable class="text-body-1">
        <thead>
          <tr>
            <th class="text-center">Nom et prénom signataire</th>
            <th class="text-center">Type signature</th>
            <th class="text-center">Date</th>
            <th class="text-center">élément signé</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="signature in props.signatures"
            :id="signature.id"
          >
            <td class="text-center">
              {{
                signature.signature.lastnameSignataire
                  ? `${signature.signature.lastnameSignataire} ${signature.signature.firstnameSignataire}`
                  : '-'
              }}
            </td>
            <td class="text-center">
              {{ signature.signature.typeSignature ? signature.signature.typeSignature : 'En son nom' }}
            </td>
            <td class="text-center">
              {{ getDateFormat(signature.signature.createdAt) }}
            </td>
            <td class="text-center">
              <VChip
                size="small"
                :text="signature.purpose.toUpperCase()"
              />
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>
    <VCardText v-else-if="props.statusSignature.length > 0">
      <template
        v-for="status in props.statusSignature"
        :id="status.id"
      >
        <div
          v-if="status.status.id === 4"
          class="text-left text-body-1 mt-3"
        >
          <span>Statut pour signature du devis ajouté le </span
          ><span class="text-primary">{{ getDateFormat(status.createdAt) }}</span>
        </div>
      </template>
    </VCardText>
    <VCardText
      v-else
      class="text-left"
    >
      <h6 class="pt-2 text-body-2 font-italic">Aucune signature trouvée</h6>
    </VCardText>
  </VCard>
</template>
