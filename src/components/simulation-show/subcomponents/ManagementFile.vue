<script setup lang="ts">
import { getFileSimulationBySimulation, postFileSimulation } from '@/services/fileService'
import { useUserStore } from '@/stores/user'

interface Props {
  idSimulation: string
}

const props = defineProps<Props>()

const baseURLFileSimulation = import.meta.env.VITE_API_SIMULATION_FILE

const simulationFiles = ref([])

const userStore = useUserStore()
const { authUser } = userStore

const dialogNew = ref(false)
const chosenFiles = ref([])
const isUploadingFile = ref(false)
const labelFile = ref(null)
let countTreatedData

const onUploadFiles = async () => {
  if (chosenFiles.value && chosenFiles.value.length > 0) {
    await new Promise(resolve => {
      countTreatedData = 0

      chosenFiles.value.forEach(file => {
        isUploadingFile.value = true

        const fileName = labelFile.value ? labelFile.value : file.name

        postFileSimulation(props.idSimulation, fileName, file, authUser.uri)
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)

            countTreatedData++
            if (countTreatedData === chosenFiles.value.length) resolve()
          })
          .catch(err => console.error(err))
      })
    })
    getFilesSimulation()
    isUploadingFile.value = false
    labelFile.value = null
    chosenFiles.value = []
    dialogNew.value = false
  }
}

const getFilesSimulation = () => {
  getFileSimulationBySimulation(props.idSimulation)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      simulationFiles.value = res
    })
    .catch(err => console.error(err))
}

const getExtension = filename => {
  return filename.split('.').pop()
}

onMounted(() => {
  getFilesSimulation()
})
</script>

<template>
  <VDialog
    v-model="dialogNew"
    width="1024"
    persistent
  >
    <VCard>
      <VCardText>
        <span class="text-h5"> Ajout de document au devis </span>
      </VCardText>
      <DialogCloseBtn @click="dialogNew = false" />
      <VCardText>
        <VTextField
          v-model="labelFile"
          label="Description (si vide, le libellé des fichiers originaux sera repris)"
          variant="underlined"
          autofocus
        />
      </VCardText>
      <VCardText>
        <VFileInput
          v-model="chosenFiles"
          chips
          multiple
          variant="underlined"
          label="Uploader le(s) fichier(s)"
        />
      </VCardText>
      <VCardText class="d-flex justify-end mt-3">
        <VBtn
          text="Ajouter"
          color="primary"
          variant="elevated"
          prepend-icon="tdesign:file-add"
          :disabled="isUploadingFile"
          :loading="isUploadingFile"
          @click="onUploadFiles"
        />
      </VCardText>
    </VCard>
  </VDialog>
  <VCard
    class="pb-5"
    border
  >
    <VCardTitle class="d-flex align-center justify-center font-weight-bold bg-green-sunstack-darker">
      <VIcon
        icon="material-symbols:bookmark-manager"
        color="white"
      />
      <span class="ml-3 text-white">Gestion du dossier</span>
    </VCardTitle>
    <VCardText class="pt-5 pl-5">
      <VBtn
        variant="flat"
        size="small"
        text="Ajouter document(s)"
        prepend-icon="material-symbols:note-add-sharp"
        color="green-sunstack-darker"
        @click="dialogNew = true"
      />
    </VCardText>
    <VCardText
      v-if="simulationFiles.length > 0"
      class="text-left"
    >
      Liste des documents :
      <VList>
        <VListItem
          v-for="(file, index) in simulationFiles"
          :key="index"
        >
          <div class="d-flex justify-space-between align-center">
            <span v-if="`${file.label}.${getExtension(file.filename)}`.length <= 35">
              {{ `${file.label}.${getExtension(file.filename)}` }}
            </span>
            <VTooltip
              v-else
              :text="`${file.label}.${getExtension(file.filename)}`"
            >
              <template #activator="{ props }">
                <span v-bind="props">
                  {{ `${`${file.label}.${getExtension(file.filename)}`.substring(0, 35)}...` }}
                </span>
              </template>
            </VTooltip>
            <div class="d-inline-block">
              <VBtn
                text="Ouvrir le fichier"
                variant="text"
                color="primary"
                size="small"
                :href="`${baseURLFileSimulation + file.id}/display`"
                target="_blank"
                rel="noopener noreferrer"
              />
            </div>
          </div>
          <VDivider
            v-if="index < simulationFiles.length - 1"
            class="mt-2"
          />
          <div
            v-else
            class="mt-2"
          />
        </VListItem>
      </VList>
    </VCardText>
    <VCardText
      v-else
      class="text-left"
    >
      <span class="font-italic text-body-2"> Aucun document associé </span>
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss"></style>
