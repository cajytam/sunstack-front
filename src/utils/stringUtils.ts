const getTitle = (str: string | null): string | null => {
  if (str) {
    const splitStr = str.toLowerCase().split(' ')
    for (let i = 0; i < splitStr.length; i++)
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1)

    return splitStr.join(' ')
  }
}

const getValueWithoutSpace = (value?: string | undefined): string => {
  return value?.replaceAll(/\s/g, '') || ''
}

const getAcronym = (word: string): string => {
  if (word.trim().length === 0) return ''

  return word.split(/\s/).reduce((accumulator, word) => accumulator + word.charAt(0), '')
}

const capitalizeFirstLetter: string = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const getFirstName = (fullName: string | null): string | null => {
  if (fullName === null) {
    return null
  }

  const names = fullName.split(' ')
  return names[0] || null
}

export { getTitle, getValueWithoutSpace, getAcronym, capitalizeFirstLetter, getFirstName }
