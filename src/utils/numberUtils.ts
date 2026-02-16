import { getValueWithoutSpace } from '@/utils/stringUtils'

function getNumberFormat(
  num: number | string | object,
  nbMinDecimal: number = 2,
  nbMaxDecimal: number = 2,
): string | number {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: nbMinDecimal,
    maximumFractionDigits: nbMaxDecimal,
  }).format(num)
}

function reverseString(str) {
  const arrayStrings = str.split('')
  const reverseArray = arrayStrings.reverse()

  return reverseArray.join('')
}

const getFormatPDL = (pdl: string): string => {
  return reverseString(reverseString(getValueWithoutSpace(pdl)).replaceAll(/(.{3})/g, '$1 '))
}

const getFormatPhone = (pdl: string): string => {
  return reverseString(reverseString(getValueWithoutSpace(pdl)).replaceAll(/(.{2})/g, '$1 '))
}

export { getNumberFormat, getFormatPDL, getFormatPhone }
