const dateFormats = {
  dateFormatHTMLElement: 'YYYY-MM-DD',
  dateFormatSeconds: 'YYYY-MM-DD-HHmmss',
  dateFormatFR: 'DD-MM-YYYY',
  dateFormatFRBis: 'DD/MM/YYYY',
  dateFormatFull: 'DD/MM/YYYY à HH:mm',
  dateLiteral: 'dateLiteral',
}

const getDateFormat = (dateOriginale: object, format: string = 'dateFormatFull'): string => {
  if (format === 'dateLiteral') {
    return new Date(dateOriginale).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  return useDateFormat(dateOriginale, dateFormats[format], { locales: 'fr-FR' }).value.replaceAll('"', '')
}

const getCurrentDateForDatabase = (): Date => {
  return new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })
}

const getTimeAgo = date => {
  const seconds = Math.floor((new Date() - new Date(Date.parse(date))) / 1000)

  let interval = Math.floor(seconds / 31536000)
  if (interval > 1) return `Il y a ${interval} ans`

  interval = Math.floor(seconds / 2592000)
  if (interval > 1) return `Il y a ${interval} moins`

  interval = Math.floor(seconds / 86400)
  if (interval > 1) return `Il y a ${interval} jours`

  interval = Math.floor(seconds / 3600)
  if (interval > 1) return `Il y a ${interval} heures`

  interval = Math.floor(seconds / 60)
  if (interval > 1) return `Il y a ${interval} minutes`

  if (seconds < 10) return "À l'instant"

  return `Il y a ${Math.floor(seconds)} secondes`
}

const isDate = (myDate: string | number | Date): boolean => {
  // @ts-ignore
  return !isNaN(new Date(myDate))
}

const addDays = (date, days) => {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() + days)
  return newDate
}

const listMois = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novenbre',
  'décembre',
]

export { getDateFormat, getCurrentDateForDatabase, getTimeAgo, isDate, addDays, listMois }
