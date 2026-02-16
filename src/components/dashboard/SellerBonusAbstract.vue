<script setup lang="ts">
import { getNumberFormat } from '@/utils/numberUtils'

type Props = {
  user: object
}
const props = defineProps<Props>()

import { getBonusPotential } from '@/services/sellerBonusService'

const isLoading = ref(true)
const currentAmountBonus = ref(null)

const potentialSellerBonus = computedAsync(async () => {
  try {
    const res = await getBonusPotential(0, Math.floor(+new Date() / 1000), props.user.id)
    if (res && res.userWcSigned > 0) {
      const item = res.earnPoints.find(point => point.currentStep === 1)
      currentAmountBonus.value = item ? item.potentialBonus : null
    }
    return res
  } catch (err) {
    console.error(err)
    return null
  } finally {
    isLoading.value = false
  }
}, null)
</script>

<template>
  <VCard class="my-5">
    <VCardTitle class="d-flex align-center justify-space-between">
      <h3 class="text-h6 text-lg-h5 font-weight-bold">Tableau de bord</h3>
    </VCardTitle>
    <VFadeTransition mode="out-in">
      <VCardItem v-if="!isLoading">
        <h6
          v-if="potentialSellerBonus.userWcSigned <= 0"
          class="text-body-2 font-italic"
        >
          Depuis le 1er {{ new Date().toLocaleString('default', { month: 'long' }) }}, aucun devis n'a encore été signé.
        </h6>
        <h6
          v-else
          class="text-h6"
        >
          Depuis le 1<span class="text-super text-caption">er</span>
          {{ new Date().toLocaleString('default', { month: 'long' }) }}, tu as cumulé
          <strong>{{ getNumberFormat(potentialSellerBonus.userWcSigned, 0, 0) }} Wc</strong>. Ceci te permet de
          prétendre à un MC de
          <strong>{{ getNumberFormat(currentAmountBonus / 100, currentAmountBonus % 1 !== 0 ? 4 : 2, 4) }} pts</strong>
        </h6>
        <div class="container mt-5">
          <ul class="responsive-table table-bordered">
            <li class="table-header list-none d-flex justify-space-between text-center">
              <div class="col col-1">Niveau</div>
              <div class="col col-2">MC</div>
              <div class="col col-3">Progression</div>
            </li>
            <li
              v-for="step in potentialSellerBonus.earnPoints"
              class="table-row text-center list-none"
              :class="{
                'table-row__passed': step.percent === 100 && step.currentStep !== 1,
                'table-row__current': step.currentStep === 1,
              }"
            >
              <div class="d-flex justify-space-between">
                <div
                  class="col col-1"
                  data-label="Niveau"
                >
                  {{ step.name }}
                </div>
                <div
                  class="col col-2"
                  data-label="Montant potentiel"
                >
                  <span class="font-weight-bold table-amount">
                    {{ getNumberFormat(step.potentialBonus / 100, step.potentialBonus % 1 !== 0 ? 4 : 2, 4) }}
                  </span>
                </div>
                <div
                  class="col col-3"
                  data-label="Progression"
                >
                  <VProgressLinear
                    class="border border-progress"
                    v-model="step.percent"
                    height="25"
                    :color="
                      step.percent === 100 && step.currentStep !== 1
                        ? 'primary'
                        : step.currentStep === 1
                          ? 'success'
                          : null
                    "
                    :class="{
                      'progress-passed': step.percent === 100 && step.currentStep !== 1,
                      'progress-current': step.currentStep === 1,
                    }"
                  >
                    <strong>{{ Math.ceil(step.percent) }}%</strong>
                  </VProgressLinear>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </VCardItem>
      <VCardText v-else>
        <VSkeletonLoader type="card" />
      </VCardText>
    </VFadeTransition>
  </VCard>
</template>

<style scoped lang="scss">
.container {
  max-width: 860px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 10px;
  padding-right: 10px;
}

h2 {
  font-size: 2rem;
  text-wrap: pretty;
  margin-bottom: 1.5rem;
  text-align: center;
}

.responsive-table {
  border-collapse: collapse; /* Pour éviter les espaces entre les bordures */

  li {
    border-radius: 3px;
    padding: 25px 30px;

    &:not(:first-child):not(:last-child) {
      margin-bottom: 1.2rem;
    }
  }

  .table-header {
    background-color: rgb(var(--v-theme-secondary));
    color: rgb(var(--v-theme-on-secondary));
    font-size: 1.1rem;
    font-weight: 700;
    text-decoration: underline;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .table-row__passed {
    opacity: 0.6;
  }

  .table-row__current {
    background-color: rgb(var(--v-theme-primary)) !important;
    color: rgb(var(--v-theme-on-primary));
  }

  .table-row {
    box-shadow: 0 0 9px 0 rgba(0, 0, 0, 0.1);
  }

  .col-1 {
    flex-basis: 20%;
  }

  .col-2 {
    flex-basis: 30%;
  }

  .col-3 {
    flex-basis: 50%;
  }

  @media all and (max-width: 768px) {
    .table-header {
      display: none;
    }
    .table-row {
    }
    li {
      display: block;
    }
    .col {
      flex-basis: 100%;
    }
    .col {
      display: flex;
      padding: 10px 0;

      &:before {
        background-color: rgb(var(--v-theme-primary));
        color: white;
        padding-right: 10px;
        margin-right: 10px;
        content: attr(data-label);
        flex-basis: 50%;
        text-align: right;
      }
    }
  }
}

.progress-passed {
  color: rgb(var(--v-theme-on-primary)) !important;
}

.progress-current {
  border-color: rgb(var(--v-theme-on-success)) !important;
}

.table-amount {
  font-size: 1.4rem;
}

.table-bordered {
  border: 1px solid rgb(var(--v-theme-secondary));
  border-radius: 0.3rem;
}
</style>
