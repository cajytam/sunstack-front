import { dataFormatterBeforePersist, getAll, patchById, post } from '@/services/api'

const typeData = {
  sort: 'int',
}

const docActionMapping: object = {
  1: { nom: 'afficher', action: 'a ouvert' },
  2: { nom: 'télécharger', action: 'a téléchargé' },
  3: { nom: 'ajout', action: 'a ajouté' },
  4: { nom: 'mis à jour', action: 'a mis à jour' },
}

const getAllDocCagories = () => {
  return getAll('docCategory')
}

const postDocCategory = docCategory => {
  const formattedData = dataFormatterBeforePersist(docCategory, typeData)

  return post('docCategory', formattedData, true)
}

const patchDocCategory = (docCategoryId, docCategoryData) => {
  const formattedData = dataFormatterBeforePersist(docCategoryData, typeData)

  return patchById('docCategory', docCategoryId, formattedData)
}

const postDocFile = (name, description, file, groups_can_see, categoryId, userUri) => {
  return post(
    'docFile',
    {
      name,
      description,
      file,
      groupsCanSee: groups_can_see,
      category: `/api/doc_categories/${categoryId}`,
      user: userUri,
    },
    true,
    'multipart',
  )
}

const patchDocFileData = (fileId, dataFile) => {
  const formattedData = dataFormatterBeforePersist(dataFile, typeData)

  return patchById('docFile', fileId, formattedData)
}

const patchDocFile = (fileId, dataFile) => {
  const formattedData = dataFormatterBeforePersist(dataFile, typeData)

  return patchById('docFile', fileId, formattedData, true, 'multipart')
}

const postDocHistory = (idAction, uriUser, idDocFile) => {
  return post('docHistory', {
    action: Number.parseInt(idAction),
    user: uriUser,
    document: `/api/doc_files/${idDocFile}`,
  })
}

export {
  docActionMapping,
  getAllDocCagories,
  postDocCategory,
  patchDocCategory,
  postDocFile,
  patchDocFileData,
  patchDocFile,
  postDocHistory,
}
