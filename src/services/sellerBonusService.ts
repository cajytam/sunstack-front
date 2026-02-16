import { fetchGet } from '@/services/api'

const getBonusPotential = (totalPower, timestampOffer, userId) => {
  return fetchGet('sale', 'bonus', true, '', {
    total_power: totalPower,
    timestamp_offer: timestampOffer,
    user_id: userId,
  })
}

export { getBonusPotential }
