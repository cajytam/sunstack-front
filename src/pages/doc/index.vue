<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import {
  docActionMapping,
  getAllDocCagories,
  patchDocCategory,
  patchDocFile,
  patchDocFileData,
  postDocCategory,
  postDocFile,
  postDocHistory,
} from '@/services/documentationService'
import { list_roles } from '@/services/roleService'
import { useUserStore } from '@/stores/user'
import { getCurrentDateForDatabase, getDateFormat } from '@/utils/dateUtils'
import { sendByPatch } from '@/services/api'
import { ability } from '@/plugins/casl/casl'

const baseURL = import.meta.env.VITE_API_URI

const userStore = useUserStore()
const { authUser } = userStore

const categorySortContainer = ref<HTMLElement | null>(null)
const categorySortList = ref([])

useSortable(categorySortContainer, categorySortList, { animation: 150 })

const filesSortContainer = ref<HTMLElement | null>(null)
const filesSortList = ref([])

useSortable(filesSortContainer, filesSortList, { animation: 150 })

const isPersistingSort = ref(false)
const isCategoriesOrderPersisted = ref(false)

const docCategories = ref([])
const dialogCategory = ref(false)
const listGroupsUser = ref([])
const isLoadingPage = ref(true)

onMounted(() => {
  initAllCategories()

  listGroupsUser.value = list_roles.sort((el1, el2) => {
    if (el1.name < el2.name) return -1

    if (el1.name > el2.name) return 1

    return 0
  })
})

const initAllCategories = async () => {
  getAllDocCagories()
    .then(res => {
      categorySortList.value = []
      docCategories.value = res.data

      res.data.forEach(category => {
        categorySortList.value.push({
          id: category.id,
          name: category.name,
          sort: category.sort,
        })
      })

      docCategories.value.forEach(category => {
        let displayCategory = 0
        category.docFiles.forEach(item => {
          item.new = Math.floor((new Date() - new Date(item.createdAt)) / (24 * 3600 * 1000)) <= 14
          item.updated =
            !item.new &&
            'updatedAt' in item &&
            Math.floor((new Date() - new Date(item.updatedAt)) / (24 * 3600 * 1000)) <= 14
          item.can_see =
            (item.groupsCanSee.length === 0 && !Object.prototype.hasOwnProperty.call(item, 'deletedAt')) ||
            ability.can('manage', 'all')
              ? true
              : !Object.prototype.hasOwnProperty.call(item, 'deletedAt') &&
                item.groupsCanSee.filter(value => authUser.roles.includes(value)).length > 0
          if (item.can_see) {
            displayCategory++
          }
        })
        category.is_displayed = displayCategory > 0
      })

      sortListCategories()
      sortFiles()

      if (process.env.NODE_ENV === 'development') console.log(res)

      isLoadingPage.value = false
    })
    .catch(err => console.error(err))
}

const sortListCategories = () => {
  docCategories.value.sort((el1, el2) => {
    return el1.sort - el2.sort
  })

  categorySortList.value.sort((el1, el2) => {
    return el1.sort - el2.sort
  })
}

const sortFiles = () => {
  docCategories.value.forEach(category => {
    category.docFiles.sort((el1, el2) => {
      return el1.sort - el2.sort
    })
  })
}

const onPersistCategoriesOrder = async () => {
  isPersistingSort.value = true

  try {
    const updatePromises = categorySortList.value.map(async (item, index) => {
      await patchDocCategory(item.id, { sort: index })
    })

    await Promise.all(updatePromises)

    isPersistingSort.value = false
    isCategoriesOrderPersisted.value = true

    await initAllCategories()

    setTimeout(() => {
      isCategoriesOrderPersisted.value = false
    }, 3500)
  } catch (error) {
    console.error(error)
  }
}

/**
 * Gestion nouvelle catégorie
 */
const newCategoryName = ref(null)
const isPersistingNewCategory = ref(false)
const isnewCategoryPersisted = ref(false)

const addNewCategory = () => {
  if (!newCategoryName.value || newCategoryName.value.length <= 0) return

  isPersistingNewCategory.value = true
  postDocCategory({
    name: newCategoryName.value,
    sort: !categorySortList.value ? 0 : categorySortList.value.length,
  })
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      newCategoryName.value = null
      isnewCategoryPersisted.value = true
      initAllCategories()

      setTimeout(() => {
        isnewCategoryPersisted.value = false
      }, 3500)
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingNewCategory.value = false))
}

/**
 * Gestion édition d'une catégorie
 */
const isPersistingEditCategory = ref(false)
const isCategoryEditPersisted = ref(false)

const onEditCategory = idCategory => {
  if (!currentCategory.name && currentCategory.name.trim().length <= 0) return

  isPersistingEditCategory.value = true
  patchDocCategory(idCategory, {
    name: currentCategory.name.trim(),
  })
    .then(async res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      isCategoryEditPersisted.value = true
      await initAllCategories()
      await sortFiles()

      setTimeout(() => {
        isCategoryEditPersisted.value = false
      }, 3500)
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingEditCategory.value = false))
}

/**
 * Gestion du tri des fichier dans une catégorie
 */
const dialogSortFiles = ref(false)
const isPersistingSortFiles = ref(false)
const isFilesOrderPersisted = ref(false)

const currentCategory = reactive({
  id: null,
  name: null,
  files: [],
})

const onOpenDialogSortFiles = idCategory => {
  if (!idCategory) return

  filesSortList.value = []

  const tempData = docCategories.value.find(category => {
    return category.id === idCategory
  })

  if (tempData) {
    currentCategory.id = idCategory
    currentCategory.name = tempData.name
    currentCategory.files = tempData.docFiles

    tempData.docFiles.forEach(file => {
      if (!Object.prototype.hasOwnProperty.call(file, 'deletedAt')) {
        filesSortList.value.push({
          id: file.id,
          name: file.name,
          sort: file.sort,
        })
      }
    })
  }

  dialogSortFiles.value = true
}

const onPersistFileOrder = async () => {
  isPersistingSortFiles.value = true

  try {
    const updatePromises = filesSortList.value.map(async (item, index) => {
      await patchDocFileData(item.id, { sort: index + 1 })
    })

    await Promise.all(updatePromises)

    isPersistingSortFiles.value = false
    isFilesOrderPersisted.value = true

    await initAllCategories()
    await sortFiles()

    setTimeout(() => {
      isFilesOrderPersisted.value = false
    }, 3500)
  } catch (error) {
    console.error(error)
  }
}

/**
 * Gestion des nouveaux fichiers
 */
const isUploadingNewFile = ref(false)
const isNewFileUploaded = ref(false)
const dialogAddFile = ref(false)
const fileToAdd = ref(null)

const newFileData = reactive({
  name: null,
  description: null,
  category: null,
  groupsCanSee: [],
})

const onAddNewFile = () => {
  if (!fileToAdd.value) return

  isUploadingNewFile.value = true

  postDocFile(
    newFileData.name,
    newFileData.description,
    fileToAdd.value,
    JSON.stringify(newFileData.groupsCanSee),
    newFileData.category,
    authUser.uri,
  )
    .then(async res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      isNewFileUploaded.value = true

      await initAllCategories()
      await sortFiles()

      postDocHistory(3, authUser.uri, res.data.id)
        .then(async res => {
          if (process.env.NODE_ENV === 'development') console.log(res)

          await initAllCategories()
          await sortFiles()
        })
        .catch(err => console.error(err))

      setTimeout(() => {
        isNewFileUploaded.value = false
      }, 3500)
    })
    .catch(err => console.error(err))
    .finally(() => (isUploadingNewFile.value = false))
}

const initNewFileValues = () => {
  newFileData.category = null
  newFileData.groupsCanSee = []
  newFileData.description = null
  newFileData.name = null
  fileToAdd.value = null
}

/**
 * Gestion des fichiers - panneau admin
 */
const dialogAdminFile = ref(false)
const adminFileId = ref(null)

const currentFileAdmin = reactive({
  name: null,
  description: null,
  category: null,
  groupsCanSee: [],
})

const isArchivedFile = ref(false)
const currentFileHistory = ref([])
const newFileUpload = ref(null)
const forceToUpdateDate = ref(true)
const isPersistingNewFile = ref(false)
const isNewFilePersisted = ref(false)

const onOpenDialogAdminFile = idFile => {
  adminFileId.value = idFile
  newFileUpload.value = null
  forceToUpdateDate.value = true
  isNewFilePersisted.value = false
  isArchivedFile.value = false
  currentFileHistory.value = []

  let currentFile = null
  docCategories.value.forEach(category => {
    currentFile = category.docFiles.find(doc => doc.id === idFile)
    if (currentFile) {
      currentFileAdmin.category = category.id
      currentFileAdmin.name = currentFile.name
      currentFileAdmin.description = currentFile.description
      currentFileAdmin.groupsCanSee = currentFile.groupsCanSee
      isArchivedFile.value = Object.prototype.hasOwnProperty.call(currentFile, 'deletedAt')
      currentFileHistory.value = currentFile.docHistories

      return false
    }
  })
  dialogAdminFile.value = true
}

const doUploadNewFile = () => {
  if (!newFileUpload.value || !adminFileId.value) return

  isPersistingNewFile.value = true

  const dataNewFile = {
    file: newFileUpload.value,
    user: authUser.uri,
  }

  if (!forceToUpdateDate.value) {
    dataNewFile.name = `${currentFileAdmin.name}.`
  } else {
    dataNewFile.updatedAt = getCurrentDateForDatabase()

    postDocHistory(4, authUser.uri, adminFileId.value)
      .then(async res => {
        if (process.env.NODE_ENV === 'development') console.log(res)

        await initAllCategories()
        await sortFiles()
      })
      .catch(err => console.error(err))
  }

  patchDocFile(adminFileId.value, dataNewFile)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      isNewFilePersisted.value = true

      setTimeout(() => {
        isNewFilePersisted.value = false
      }, 3500)

      if (!forceToUpdateDate.value) {
        patchDocFile(adminFileId.value, {
          name: currentFileAdmin.name,
        })
          .then(res => {
            if (process.env.NODE_ENV === 'development') console.log(res)
          })
          .catch(err => console.error(err))
      }
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingNewFile.value = false))
}

const isAdminEditFilePersisted = ref(false)
const isPersistingEditFile = ref(false)

const onAdminEditFile = idFile => {
  if (!idFile) return

  const data = JSON.parse(JSON.stringify(currentFileAdmin))

  data.category = `/api/doc_categories/${currentFileAdmin.category}`

  isPersistingEditFile.value = true
  patchDocFileData(idFile, data)
    .then(res => {
      if (process.env.NODE_ENV === 'development') console.log(res)

      initAllCategories()
      sortFiles()

      isAdminEditFilePersisted.value = true
      setTimeout(() => {
        isAdminEditFilePersisted.value = false
      }, 3500)
    })
    .catch(err => console.error(err))
    .finally(() => (isPersistingEditFile.value = false))
}

/**
 * Gestion archivage d'un fichier en Admin
 */
const isArchivingFile = ref(false)

const onArchiveFile = idFile => {
  if (!idFile) return

  isArchivingFile.value = true

  sendByPatch('docFile', idFile, {
    sort: isArchivedFile.value ? 0 : 9999,
    deletedAt: isArchivedFile.value ? null : getCurrentDateForDatabase(),
  })
    .then(async res => {
      isArchivedFile.value = !isArchivedFile.value
      await initAllCategories()
      if (process.env.NODE_ENV === 'development') console.log(res)
    })
    .catch(err => console.error(err))
    .finally(() => (isArchivingFile.value = false))
}

const onCloseNewFile = () => {
  dialogAddFile.value = false
  initNewFileValues()
}
</script>

<template>
  <div>
    <VDialog
      v-model="dialogCategory"
      width="1024"
      eager
    >
      <VCard>
        <VCardTitle>
          <span class="text-h5">Gestion des catégories</span>
        </VCardTitle>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol>
                <VTextField
                  v-model="newCategoryName"
                  label="Nom nouvelle catégorie"
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <VBtn
                  text="Ajouter catégorie"
                  variant="flat"
                  color="primary"
                  prepend-icon="fluent:tab-add-20-filled"
                  size="small"
                  :disabled="isPersistingNewCategory"
                  :loading="isPersistingNewCategory"
                  @click="addNewCategory"
                />
                <VFadeTransition mode="out-in">
                  <div
                    v-if="isnewCategoryPersisted"
                    class="text-success text-left d-inline-block"
                  >
                    <VIcon
                      icon="dashicons:saved"
                      class="me-2 ms-3"
                    />
                    <span>La catégorie a bien été ajoutée</span>
                  </div>
                </VFadeTransition>
              </VCol>
            </VRow>
          </VContainer>
          <VContainer>
            <VRow>
              <VCol>
                <span class="text-h6"> Ordonner les catégories </span>
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <div ref="categorySortContainer">
                  <div
                    v-for="category in categorySortList"
                    :key="category.id"
                    class="d-flex align-center ga-5 category-sortable__item"
                  >
                    <VIcon icon="iconoir:sort" />
                    <span class="text-body-1 text-white">{{ category.name }}</span>
                  </div>
                </div>
              </VCol>
            </VRow>
            <VRow
              align="center"
              justify="center"
            >
              <VCol>
                <VBtn
                  text="Valider ordre"
                  color="info"
                  variant="flat"
                  size="small"
                  prepend-icon="material-symbols:save"
                  :disabled="isPersistingSort"
                  :loading="isPersistingSort"
                  @click="onPersistCategoriesOrder"
                />
                <VFadeTransition mode="out-in">
                  <div
                    v-if="isCategoriesOrderPersisted"
                    class="text-success text-left d-inline-block"
                  >
                    <VIcon
                      icon="dashicons:saved"
                      class="me-2 ms-3"
                    />
                    <span>L'ordre des catégories a bien été enregistré</span>
                  </div>
                </VFadeTransition>
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
        <VCardText class="d-flex justify-end ga-3">
          <VBtn
            text="Fermer"
            color="secondary"
            variant="text"
            prepend-icon="mdi-close-circle-outline"
            @click="dialogCategory = false"
          />
        </VCardText>
      </VCard>
    </VDialog>
    <VDialog
      v-model="dialogSortFiles"
      width="1024"
      eager
    >
      <VCard>
        <VCardText>
          <VContainer>
            <VRow align="center">
              <VCol
                cols="3"
                class="text-center"
              >
                <span class="text-body-1">Nom de la catégorie :</span>
              </VCol>
              <VCol cols="7">
                <VTextField
                  v-model="currentCategory.name"
                  variant="filled"
                  class="text-body-1"
                />
              </VCol>
              <VCol
                class="d-flex align-center justify-end"
                cols="2"
              >
                <VBtn
                  text="Modifier"
                  size="small"
                  color="info"
                  prepend-icon="mdi-rename"
                  :loading="isPersistingEditCategory"
                  :disabled="isPersistingEditCategory"
                  @click="onEditCategory(currentCategory.id)"
                />
              </VCol>
              <VFadeTransition mode="out-in">
                <div
                  v-if="isCategoryEditPersisted"
                  class="mx-auto text-success text-left d-inline-block"
                >
                  <VIcon
                    icon="dashicons:saved"
                    class="me-2 ms-3"
                  />
                  <span>Le nom de la catégorie a bien été enregistré</span>
                </div>
              </VFadeTransition>
            </VRow>
          </VContainer>
          <VDivider class="mx-8" />
          <VContainer>
            <VRow>
              <VCol class="pb-0">
                <span class="text-h6"> Ordonner les fichiers de la catégorie "{{ currentCategory.name }}" </span>
              </VCol>
            </VRow>
            <VRow>
              <VCol>
                <div ref="filesSortContainer">
                  <div
                    v-for="file in filesSortList"
                    :key="file.id"
                    class="d-flex align-center ga-5 file-sortable__item"
                  >
                    <VIcon icon="ant-design:file-pdf-outlined" />
                    <span class="text-body-1 text-white">{{ file.name }}</span>
                  </div>
                </div>
              </VCol>
            </VRow>
            <VRow
              align="center"
              justify="center"
            >
              <VCol>
                <VBtn
                  text="Valider ordre"
                  color="info"
                  variant="flat"
                  size="small"
                  prepend-icon="material-symbols:save"
                  :disabled="isPersistingSortFiles"
                  :loading="isPersistingSortFiles"
                  @click="onPersistFileOrder"
                />
                <VFadeTransition mode="out-in">
                  <div
                    v-if="isFilesOrderPersisted"
                    class="text-success text-left d-inline-block"
                  >
                    <VIcon
                      icon="dashicons:saved"
                      class="me-2 ms-3"
                    />
                    <span>L'ordre des fichier a bien été enregistré</span>
                  </div>
                </VFadeTransition>
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
      </VCard>
    </VDialog>
    <VDialog
      v-model="dialogAddFile"
      width="1024"
      eager
    >
      <VCard>
        <VCardText>
          <VContainer>
            <VRow>
              <VCol cols="12">
                <VFileInput
                  v-model="fileToAdd"
                  label="Ajouter un PDF"
                  prepend-icon="fa6-solid:file-pdf"
                  accept="application/pdf"
                  variant="filled"
                />
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="newFileData.name"
                label="Titre du fichier"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="newFileData.description"
                label="Description du fichier"
              />
            </VCol>
            <VCol cols="12">
              <VAutocomplete
                v-model="newFileData.category"
                chips
                label="Catégorie"
                auto-select-first
                color="info"
                :items="categorySortList"
                item-title="name"
                item-value="id"
              />
            </VCol>
            <VCol cols="12">
              <VAutocomplete
                v-model="newFileData.groupsCanSee"
                label="Groupes ayant accès (tous les utilisateurs si vide)"
                :items="listGroupsUser"
                item-title="name"
                color="info"
                item-value="id"
                multiple
                chips
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex align-center justify-space-between ga-3">
          <VFadeTransition mode="out-in">
            <div
              v-if="isNewFileUploaded"
              class="text-success text-left d-inline-block"
            >
              <VIcon
                icon="dashicons:saved"
                class="me-2 ms-3"
              />
              <span>Le fichier a bien été ajouté</span>
            </div>
            <VSpacer v-else />
          </VFadeTransition>
          <div class="d-flex justify-end gap-x-2">
            <VBtn
              text="Ajouter"
              color="primary"
              prepend-icon="material-symbols:upload"
              :disabled="isUploadingNewFile"
              :loading="isUploadingNewFile"
              @click="onAddNewFile"
            />
            <VBtn
              text="Fermer"
              color="secondary"
              variant="text"
              prepend-icon="mdi-close-circle-outline"
              @click="onCloseNewFile"
            />
          </div>
        </VCardText>
      </VCard>
    </VDialog>
    <VDialog
      v-model="dialogAdminFile"
      width="1024"
      eager
    >
      <VCard>
        <VCardText>
          <VContainer class="pt-0">
            <VRow
              align="end"
              class="rounded-t px-5 border-t border-e border-s"
              :class="{ 'rounded-b border-b pb-3': newFileUpload === null || newFileUpload.length <= 0 }"
            >
              <VCol
                cols="3"
                class="text-center"
              >
                <VBtn
                  text="Afficher fichier actuel"
                  prepend-icon="mdi-eye"
                  size="small"
                  variant="outlined"
                  color="yellow-sunstack"
                  :href="`${baseURL}api/file/documentation/${adminFileId}/display`"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </VCol>
              <VCol cols="9">
                <VFileInput
                  v-model="newFileUpload"
                  label="Uploader pour mettre à jour le fichier"
                  variant="underlined"
                  accept="application/pdf"
                  :loading="isPersistingNewFile"
                />
              </VCol>
            </VRow>
            <VRow
              v-if="newFileUpload"
              justify="start"
              class="rounded-b pb-3 px-5 border-b border-e border-s"
            >
              <VSpacer />
              <VCol cols="9">
                <div class="d-flex align-center justify-space-between">
                  <VCheckbox
                    v-model="forceToUpdateDate"
                    label="Mettre à jour la date d'upload du fichier"
                    color="info"
                  />
                  <VBtn
                    text="Uploader fichier"
                    size="small"
                    variant="outlined"
                    color="info"
                    prepend-icon="material-symbols-light:change-circle"
                    :disabled="isPersistingNewFile"
                    :loading="isPersistingNewFile"
                    @click="doUploadNewFile"
                  />
                </div>
                <VSlideYReverseTransition mode="out-in">
                  <div
                    v-if="isNewFilePersisted"
                    class="text-success text-left d-inline-block"
                  >
                    <VIcon
                      icon="dashicons:saved"
                      class="me-2 ms-3"
                    />
                    <span>Le fichier a bien été uploadé</span>
                  </div>
                </VSlideYReverseTransition>
              </VCol>
            </VRow>
            <VRow align="center">
              <VCol
                cols="3"
                class="text-center"
              >
                <span class="text-body-1">Nom du fichier</span>
              </VCol>
              <VCol cols="9">
                <VTextField
                  v-model="currentFileAdmin.name"
                  variant="filled"
                  class="text-body-1"
                />
              </VCol>
              <VCol
                cols="3"
                class="text-center"
              >
                <span class="text-body-1">Descriptif</span>
              </VCol>
              <VCol cols="9">
                <VTextarea
                  v-model="currentFileAdmin.description"
                  variant="filled"
                  class="text-body-1"
                />
              </VCol>
              <VCol
                cols="3"
                class="text-center"
              >
                <span class="text-body-1">Catégorie</span>
              </VCol>
              <VCol cols="9">
                <VAutocomplete
                  v-model="currentFileAdmin.category"
                  auto-select-first
                  color="info"
                  :items="categorySortList"
                  item-title="name"
                  item-value="id"
                  variant="filled"
                  class="text-body-1"
                />
              </VCol>
              <VCol
                cols="3"
                class="text-center"
              >
                <span class="text-body-1">Groupes ayant accès (vide = tout le monde)</span>
              </VCol>
              <VCol cols="9">
                <VAutocomplete
                  v-model="currentFileAdmin.groupsCanSee"
                  :items="listGroupsUser"
                  item-title="name"
                  item-value="id"
                  color="info"
                  multiple
                  chips
                  variant="filled"
                  class="text-body-1"
                />
              </VCol>
            </VRow>
          </VContainer>
        </VCardText>
        <VCardText>
          <VContainer class="pt-0 pb-2 d-flex justify-space-between">
            <VBtn
              class="me-2"
              :prepend-icon="isArchivedFile ? 'ic:outline-unarchive' : 'ic:outline-archive'"
              :text="isArchivedFile ? 'Mettre en ligne' : 'Archiver'"
              :color="isArchivedFile ? 'success' : 'error'"
              size="small"
              variant="tonal"
              :loading="isArchivingFile"
              :disabled="isArchivingFile"
              @click="onArchiveFile(adminFileId)"
            />
            <VSlideXReverseTransition mode="out-in">
              <div
                v-if="isAdminEditFilePersisted"
                class="text-success text-left d-inline-block"
              >
                <VIcon
                  icon="dashicons:saved"
                  class="me-2 ms-3"
                />
                <span>Les informations ont bien été enregistrées</span>
              </div>
            </VSlideXReverseTransition>
            <div>
              <VBtn
                class="me-2"
                prepend-icon="basil:edit-outline"
                text="Modifier"
                color="info"
                size="small"
                :disabled="isPersistingEditFile"
                :loading="isPersistingEditFile"
                @click="onAdminEditFile(adminFileId)"
              />
              <VBtn
                text="Fermer"
                color="secondary"
                variant="text"
                size="small"
                prepend-icon="mdi-close-circle-outline"
                @click="dialogAdminFile = false"
              />
            </div>
          </VContainer>
        </VCardText>
        <VDivider class="mx-8" />
        <VContainer class="pt-2">
          <VCardTitle class="py-0">
            <span class="text-h6 font-weight-bold text-decoration-underline">Historique</span>
          </VCardTitle>
          <VList
            v-if="currentFileHistory.length > 0"
            max-height="350"
            class="pt-1"
          >
            <VListItem
              v-for="history in currentFileHistory"
              :key="history.id"
              :prepend-avatar="
                history.user.picture
                  ? `${baseURL}img/users/${history.user.picture}`
                  : `${baseURL}img/logo/no-avatar.jpg`
              "
            >
              <span class="text-subtitle-1 font-weight-bold">{{ history.user.fullName }}&nbsp;</span>
              <span class="text-body-2">{{ docActionMapping[history.action].action }} le fichier le&nbsp;</span>
              <span class="text-caption text-primary">{{ getDateFormat(history.doneAt) }}</span>
            </VListItem>
          </VList>
        </VContainer>
      </VCard>
    </VDialog>
    <VFadeTransition mode="out-in">
      <div
        v-if="isLoadingPage"
        class="d-flex justify-center"
      >
        <VProgressCircular
          indeterminate
          :size="162"
          :width="15"
          color="info"
        />
      </div>
      <VCard
        v-else
        class="pa-5"
      >
        <VRow>
          <VCol cols="12">
            <VRow
              class="pa-5"
              align="center"
              justify="space-between"
            >
              <h1 class="text-h5 text-md-h4 font-weight-bold">Documentations</h1>
              <div
                v-if="ability.can('manage', 'all')"
                class="d-flex ga-3"
              >
                <VBtn
                  text="Ajouter un document"
                  color="primary"
                  prepend-icon="mdi-file-document-plus"
                  @click="dialogAddFile = true"
                />
                <VBtn
                  text="Gestion des catégories"
                  color="info"
                  variant="outlined"
                  prepend-icon="material-symbols:folder-managed"
                  @click="dialogCategory = true"
                />
              </div>
            </VRow>
          </VCol>
          <template
            v-for="(category, index) in docCategories"
            :key="category.id"
          >
            <VCol
              v-if="category.is_displayed || ability.can('manage', 'all')"
              cols="12"
              class="mb-7"
            >
              <div
                class="d-flex align-center justify-space-between bg-info-900 py-3 px-5 rounded mb-5"
                :class="index === 0 ? 'mt-2' : 'mt-5'"
              >
                <div class="d-flex align-center ga-5">
                  <VIcon
                    color="white"
                    icon="fluent:document-folder-16-filled"
                    size="x-large"
                  />
                  <h2 class="text-h5 font-weight-bold text-white">
                    {{ category.name }}
                  </h2>
                </div>
                <VBtn
                  v-if="ability.can('manage', 'all')"
                  text="Modifier catégorie"
                  prepend-icon="akar-icons:edit"
                  size="small"
                  color="surface"
                  variant="elevated"
                  @click="onOpenDialogSortFiles(category.id)"
                />
              </div>
              <VRow
                align="stretch"
                justify="start"
              >
                <template
                  v-for="fileCategory in category.docFiles"
                  :key="fileCategory.id"
                >
                  <VCol
                    v-if="fileCategory.can_see"
                    cols="12"
                    xl="3"
                    lg="4"
                    md="6"
                  >
                    <VCard
                      class="bg-var-theme-background fill-height rounded card-file border-primary overflow-visible pt-3 d-flex flex-column"
                      :class="
                        fileCategory.deletedAt
                          ? 'card-file__deleted'
                          : fileCategory.new
                            ? 'card-file__new'
                            : fileCategory.updated
                              ? 'card-file__updated'
                              : null
                      "
                    >
                      <div
                        class="mt-8 my-3 mx-5 pb-2 ga-3 d-flex justify-start align-center border-b"
                        :class="
                          fileCategory.new
                            ? 'border-success'
                            : fileCategory.updated
                              ? 'border-warning'
                              : 'border-primary'
                        "
                      >
                        <VIcon
                          icon="uiw:file-pdf"
                          :color="fileCategory.new ? 'success' : fileCategory.updated ? 'warning' : 'primary'"
                          size="x-large"
                        />
                        <h3 class="text-h5 font-weight-bold">
                          {{ fileCategory.name }}
                        </h3>
                      </div>
                      <div
                        v-if="(fileCategory.new || fileCategory.updated) && !fileCategory.deletedAt"
                        class="ribbon"
                        :class="fileCategory.new ? 'ribbon-new' : fileCategory.updated ? 'ribbon-updated' : null"
                      >
                        {{ fileCategory.new ? 'Nouveau' : 'Mis à jour' }}
                      </div>
                      <VCardText class="pt-0">
                        <span class="text-lg-body-1 text-body-2">{{ fileCategory.description }}</span>
                      </VCardText>
                      <div class="d-flex align-end mx-3 mb-3">
                        <div class="d-flex justify-space-between align-center w-100">
                          <VBtn
                            v-if="ability.can('manage', 'all')"
                            icon="clarity:administrator-solid"
                            color="warning"
                            size="x-small"
                            @click="onOpenDialogAdminFile(fileCategory.id)"
                          />
                          <VSpacer v-else />
                          <div>
                            <VBtn
                              class="me-2"
                              prepend-icon="mdi-eye"
                              text="Afficher"
                              color="info"
                              size="small"
                              :href="`${baseURL}api/file/documentation/${fileCategory.id}/display`"
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                            <VBtn
                              prepend-icon="material-symbols:download"
                              text="Télécharger"
                              color="green-sunstack-darker"
                              size="small"
                              :href="`${baseURL}api/file/documentation/${fileCategory.id}`"
                            />
                          </div>
                        </div>
                      </div>
                    </VCard>
                  </VCol>
                </template>
              </VRow>
            </VCol>
          </template>
        </VRow>
      </VCard>
    </VFadeTransition>
  </div>
</template>

<style scoped lang="scss">
.card-file {
  position: relative;
  border-left: 0.6rem solid transparent;
  border-bottom: 0.2rem solid transparent;
  border-right: 0.1rem solid transparent;
  border-top: 0.1rem solid transparent;
  box-shadow:
    rgba(50, 50, 93, 0.25) 0 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0 3px 7px -3px;
  z-index: 9999;
}

.card-file__new {
  border-color: rgb(var(--v-theme-success)) !important;
}

.card-file__updated {
  border-color: rgb(var(--v-theme-warning)) !important;
}

.card-file__deleted {
  filter: grayscale(100%);
  opacity: 0.4;
}

.ribbon {
  --f: 0.6rem; /* control the folded part*/
  --r: 1rem; /* control the ribbon shape */
  --t: 0.5rem; /* the top offset */

  position: absolute;
  inset: var(--t) calc(-1 * var(--f)) auto auto;
  padding: 0 1rem var(--f) calc(1rem + var(--r));
  clip-path: polygon(
    0 0,
    100% 0,
    100% calc(100% - var(--f)),
    calc(100% - var(--f)) 100%,
    calc(100% - var(--f)) calc(100% - var(--f)),
    0 calc(100% - var(--f)),
    var(--r) calc(50% - var(--f) / 2)
  );
  box-shadow: 0 calc(-1 * var(--f)) 0 inset #0005;
  text-transform: uppercase;
  font-weight: 700;
  color: white;
  font-size: 1.1rem;
}

.ribbon-new {
  background-color: rgb(var(--v-theme-success));
}

.ribbon-updated {
  background-color: var(--yellow-sunstack);
}

:deep(.v-card-item__content .v-card-title) {
  line-height: 2rem;
  font-size: 1.4rem !important;
  font-weight: 700;
  text-wrap: wrap;
}

.category-sortable__item {
  margin: 0.6rem auto;
  padding: 0.6rem 1.2rem;
  background-color: var(--grey-sunstack-darker);
  border: 0.1rem solid var(--grey-sunstack);
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

.file-sortable__item {
  margin: 0.6rem auto;
  padding: 0.6rem 1.2rem;
  background-color: var(--green-sunstack-darker);
  border: 0.1rem solid var(--grey-sunstack);
  color: white;
  border-radius: 8px;
  cursor: pointer;
}

.sortable-ghost,
.sortable-ghost * {
  background-color: var(--grey-sunstack);
  color: var(--grey-sunstack-darker);
  opacity: 0.7;
}
</style>
