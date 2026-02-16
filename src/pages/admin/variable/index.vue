<script setup lang="ts">
import { sunstackMargins } from '@/services/calculation'

const defaultMargin = ref(null)
</script>

<template>
  <VContainer>
    <VRow>
      <VCol
        md="6"
        cols="12"
      >
        <VCard>
          <VCardItem>
            <VRow>
              <VCol cols="12">
                <VRow
                  align="center"
                  no-gutters
                >
                  <VCol
                    cols="12"
                    md="3"
                  >
                    <label for="defaultMargin">Marge par défaut</label>
                  </VCol>
                  <VCol
                    cols="12"
                    md="9"
                  >
                    <VRadioGroup
                      inline
                      id="defaultMargin"
                      v-model="defaultMargin"
                    >
                      <VRadio
                        v-for="radio in sunstackMargins"
                        :value="radio"
                        :label="radio"
                        class="mx-5"
                      />
                    </VRadioGroup>
                  </VCol>
                </VRow>
              </VCol>

              <!-- 👉 submit button -->
              <VCol
                class="d-flex justify-center mt-5"
                cols="12"
              >
                <VBtn
                  type="submit"
                  prepend-icon="akar-icons:save"
                >
                  Enregistrer
                </VBtn>
              </VCol>
            </VRow>
          </VCardItem>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped lang="scss"></style>
