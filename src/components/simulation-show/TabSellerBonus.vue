<script setup lang="ts">
import type { SimulationOwnedBy } from '@domain/types/simulation'

type Props = {
  creationTimestamp: number
  user: SimulationOwnedBy | null
  isSigned: boolean
  panelNb?: number
  panelPower?: number
}

import { getBonusPotential } from '@/services/sellerBonusService'
import { getNumberFormat } from '@/utils/numberUtils'
import { useUserStore } from '@/stores/user'
import { getFirstName } from '@/utils/stringUtils'

const userStore = useUserStore()
const { authUser } = userStore

const props = defineProps<Props>()

const potentialSellerBonus = computedAsync(async () => {
  if (props.panelPower && props.panelNb) {
    try {
      const totalPower = props.panelPower * props.panelNb
      const res = await getBonusPotential(totalPower, props.creationTimestamp, props.user.id)
      return res.steps
    } catch (err) {
      console.error(err)
      return null
    }
  }
}, null)
</script>

<template>
  <VContainer>
    <VRow>
      <VCol
        cols="12"
        lg="5"
      >
        <VCard>
          <VCardText>
            <div class="container">
              <h2>
                {{
                  user.id === authUser.id
                    ? `Ta commission${!props.isSigned ? ' potentielle' : ''}`
                    : `La commission ${!props.isSigned ? ' potentielle' : ''} de ${user.fullName}`
                }}
                pour ce projet
              </h2>
              <ul class="responsive-table table-bordered">
                <li class="table-header list-none d-flex justify-space-between">
                  <div class="col col-1">Niveau</div>
                  <div class="col col-2">Montant {{ `${!props.isSigned ? ' potentiel' : ''}` }}</div>
                  <div class="col col-3">Progression</div>
                </li>
                <li
                  v-for="step in potentialSellerBonus"
                  class="table-row list-none"
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
                        {{ getNumberFormat(step.potentialBonus, step.potentialBonus % 1 !== 0 ? 2 : 0, 2) + '€' }}
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
                  <div
                    v-if="step.currentStep === 1"
                    class="full-width-text"
                  >
                    <span
                      v-if="step.untilNextStep > 0"
                      class="text-overline text-white"
                    >
                      Plus que {{ getNumberFormat(step.untilNextStep, 0, 0) }} Wc avant le prochain palier
                    </span>
                    <span
                      v-if="step.untilNextStep < 0"
                      class="text-overline text-white"
                    >
                      Félicitations {{ getFirstName(props.user.fullName) }} tu as atteint le niveau maximum !
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped lang="scss">
.full-width-text {
  width: 100%;
  text-align: center;
  margin-top: 10px;
}

.container {
  max-width: 1000px;
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
