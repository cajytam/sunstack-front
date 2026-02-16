const baseURL = `${import.meta.env.VITE_API_URI}api`

const postExportFileSimulation = async (typeFile, filename, query) => {
  try {
    const response = await fetch(`${baseURL}/export/simulation`, {
      method: 'post',
      credentials: 'include',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({
        format: typeFile,
        query,
      }),
    })

    if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

    const blob = await response.blob()

    const aElement = document.createElement('a')

    aElement.setAttribute('download', `${filename}.${typeFile.toLowerCase()}`)

    const href = URL.createObjectURL(blob)

    aElement.href = href
    aElement.setAttribute('target', '_blank')
    aElement.click()
    URL.revokeObjectURL(href)
  } catch (error) {
    console.error("Une erreur s'est produite :", error)
    throw error // Re-lancer l'erreur pour que le bloc catch de onExportToFile la capture
  }
}

export { postExportFileSimulation }
