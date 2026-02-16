<script setup lang="ts">
const props = defineProps({
  isSaving: { type: Boolean, default: false },
  firstname: { type: String, default: '' },
  lastname: { type: String, default: '' },
  typeSignature: { type: String, default: '' },
  isClauseSuspensive: { type: Boolean, default: false },
  isCustomerParticular: { type: Boolean, default: false },
  birthdayCustomer: { type: String, default: null },
  birthLocationCustomer: { type: String, default: null },
  isCustomerCertifiesOwnership: { type: Boolean, default: null },
  isAgreementBareOwner: { type: Boolean, default: null },
})

const emit = defineEmits<{
  (e: 'signatureBase64', value: string): void
  (e: 'firstname', value: string): void
  (e: 'lastname', value: string): void
  (e: 'typeSignature', value: string): void
  (e: 'isClauseSuspensive', value: boolean): void
  (e: 'birthdayCustomer'): void
  (e: 'birthLocationCustomer'): void
}>()

const canvas = ref(null)
const ctx = ref(null)
const coord = ref({ x: 0, y: 0 })
const ongoingTouches = ref([])
const offsetX = ref(null)
const offsetY = ref(null)

onMounted(() => {
  canvas.value = document.getElementById('canvas')
  ctx.value = canvas.value.getContext('2d')
  canvas.value.addEventListener('touchstart', handleStart)
  canvas.value.addEventListener('touchend', handleEnd)
  canvas.value.addEventListener('touchcancel', handleCancel)
  canvas.value.addEventListener('touchmove', handleMove)
  resize()
})

const resize = () => {
  ctx.value.canvas.width = 600
  ctx.value.canvas.height = 300
}

const reposition = event => {
  const elemRect = canvas.value.getBoundingClientRect()
  if (event.touches) {
    for (let i = 0; i < event.touches; i++) ongoingTouches.value.push(copyTouch(touches[i]))

    coord.value.x = event.touches[0].clientX - elemRect.left
    coord.value.y = event.touches[0].clientY - elemRect.top
  } else {
    coord.value.x = event.clientX - elemRect.left
    coord.value.y = event.clientY - elemRect.top
  }
}

const start = event => {
  canvas.value.addEventListener('mousemove', draw)
  canvas.value.addEventListener('touchstart', handleStart)
  reposition(event)
}

const stop = () => {
  canvas.value.removeEventListener('mousemove', draw)
}

function handleStart(evt) {
  evt.preventDefault()

  const touches = evt.changedTouches

  offsetX.value = canvas.value.getBoundingClientRect().left
  offsetY.value = canvas.value.getBoundingClientRect().top
  for (let i = 0; i < touches.length; i++) ongoingTouches.value.push(copyTouch(touches[i]))
}

function handleMove(event) {
  event.preventDefault()

  const touches = event.changedTouches
  for (let i = 0; i < touches.length; i++) {
    const idx = ongoingTouchIndexById(touches[i].identifier)
    if (idx >= 0) {
      ctx.value.beginPath()
      ctx.value.moveTo(
        ongoingTouches.value[idx].clientX - offsetX.value,
        ongoingTouches.value[idx].clientY - offsetY.value,
      )
      ctx.value.lineTo(touches[i].clientX - offsetX.value, touches[i].clientY - offsetY.value)
      ctx.value.lineWidth = 4
      ctx.value.strokeStyle = '#262626'
      ctx.value.lineJoin = 'round'
      ctx.value.closePath()
      ctx.value.stroke()
      ongoingTouches.value.splice(idx, 1, copyTouch(touches[i])) // swap in the new touch record
    }
  }
}

function handleEnd(evt) {
  evt.preventDefault()

  const touches = evt.changedTouches
  for (let i = 0; i < touches.length; i++) {
    const idx = ongoingTouchIndexById(touches[i].identifier)
    if (idx >= 0) {
      ctx.value.lineWidth = 4
      ctx.value.fillStyle = '#262626'
      ongoingTouches.value.splice(idx, 1) // remove it; we're done
    }
  }
}

function handleCancel(evt) {
  evt.preventDefault()

  const touches = evt.changedTouches
  for (let i = 0; i < touches.length; i++) {
    const idx = ongoingTouchIndexById(touches[i].identifier)

    ongoingTouches.value.splice(idx, 1) // remove it; we're done
  }
}

function ongoingTouchIndexById(idToFind) {
  for (let i = 0; i < ongoingTouches.value.length; i++) {
    const id = ongoingTouches.value[i].identifier
    if (id === idToFind) return i
  }

  return -1 // not found
}

const draw = event => {
  ctx.value.beginPath()
  ctx.value.lineWidth = 4
  ctx.value.lineCap = 'round'
  ctx.value.strokeStyle = '#262626'
  ctx.value.moveTo(coord.value.x, coord.value.y)
  reposition(event)
  ctx.value.lineTo(coord.value.x, coord.value.y)
  ctx.value.stroke()
}

const clear = () => {
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

const exportSignature = () => {
  if (isParticularInfoNotCompleted.value) return
  if (!isApproved.value) return

  const dataURL = canvas.value.toDataURL().split(';base64,')[1]

  emit('signatureBase64', dataURL)
}

const signatureParOptions = [
  { shortName: '', name: 'Signature en votre nom' },
  { shortName: 'PO', name: 'Signature pour ordre (PO)' },
  { shortName: 'PP', name: 'Signature par procuration (PP)' },
]

const copyTouch = ({ identifier, clientX, clientY }) => {
  return { identifier, clientX, clientY }
}

const isParticularInfoNotCompleted = computed(() => {
  if (props.isCustomerParticular) {
    return (
      props.birthLocationCustomer === null ||
      props.birthdayCustomer === null ||
      props.birthLocationCustomer?.length <= 0
    )
  }

  return false
})

const isApproved = ref(false)
</script>

<template>
  <VContainer>
    <VRow justify="center">
      <VCol cols="12">
        <VCardTitle class="text-body-1 text-lg-h5 font-weight-bold">
          Signature du devis et mandat de représentation
        </VCardTitle>
      </VCol>
      <VCol
        cols="9"
        class="text-center"
      >
        <VRow justify="center">
          <VCol cols="5">
            <VTextField
              label="Nom signataire"
              variant="filled"
              :model-value="props.lastname"
              @input="$emit('lastname', $event.target.value)"
            />
          </VCol>
          <VCol cols="5">
            <VTextField
              label="Prénom signataire"
              variant="filled"
              :model-value="props.firstname"
              @input="$emit('firstname', $event.target.value)"
            />
          </VCol>
        </VRow>
        <VRow
          v-if="isCustomerParticular"
          justify="center"
        >
          <VCol
            cols="12"
            lg="4"
          >
            <VTextField
              label="Date de naissance"
              type="date"
              variant="filled"
              :model-value="props.birthdayCustomer"
              @input="$emit('birthdayCustomer', $event.target.value)"
            />
          </VCol>
          <VCol
            cols="12"
            lg="6"
          >
            <VTextField
              label="Ville de naissance"
              variant="filled"
              :model-value="props.birthLocationCustomer"
              @input="$emit('birthLocationCustomer', $event.target.value)"
            />
          </VCol>
        </VRow>
        <VRow justify="center">
          <VCol cols="9">
            <VSelect
              :items="signatureParOptions"
              label="Type de signature (facultatif)"
              variant="filled"
              item-title="name"
              item-value="shortName"
              :model-value="props.typeSignature"
              @update:model-value="$emit('typeSignature', $event)"
            />
          </VCol>
        </VRow>
        <VRow justify="center">
          <VCol
            cols="9"
            class="text-center"
          >
            <VCheckbox
              label="Clause suspensive d’obtention de financement"
              :model-value="props.isClauseSuspensive"
              @input="$emit('isClauseSuspensive', $event.target.checked)"
            />
          </VCol>
        </VRow>
        <VRow justify="center">
          <VCol
            cols="9"
            class="text-center"
          >
            <VCheckbox
              class="font-weight-bold"
              label="Lu et approuvé*"
              v-model="isApproved"
            />
          </VCol>
        </VRow>
        <VRow
          v-if="props.isCustomerCertifiesOwnership || props.isAgreementBareOwner"
          justify="center"
        >
          <VCol cols="9">
            <div>
              <VIcon
                icon="typcn:tick"
                color="success"
              />
              {{
                props.isCustomerCertifiesOwnership
                  ? 'J’atteste être légalement propriétaire de l’Immeuble.'
                  : 'J’atteste être locataire de l’Immeuble et bénéficier d’une autorisation écrite du propriétaire.'
              }}
            </div>
          </VCol>
        </VRow>
        <VRow
          justify="center"
          class="mt-5"
        >
          <VCol>
            <canvas
              id="canvas"
              class="signature-canvas"
              @mousedown="start"
              @mouseup="stop"
              @mouseout="stop"
            />
          </VCol>
        </VRow>
        <VScrollYTransition mode="out-in">
          <VRow
            v-if="isParticularInfoNotCompleted"
            justify="center"
          >
            <VCol cols="9">
              <VAlert
                text="Merci de renseigner toutes les informations nécessaires"
                color="error"
                prominent
                icon="gala:file-error"
              />
            </VCol>
          </VRow>
        </VScrollYTransition>
        <VExpandTransition>
          <VRow
            v-if="!isApproved"
            align="center"
            justify="center"
            class="mb-5"
          >
            <VCol>
              <span
                class="text-body-2 d-block text-white bg-error font-weight-bold border border-error py-2 px-12 rounded-pill"
              >
                La validation de la signature ne peut être effectuée que si "Lu et approuvé" est cochée
              </span>
            </VCol>
          </VRow>
        </VExpandTransition>
        <VRow>
          <VCol>
            <VBtn
              prepend-icon="gg:erase"
              color="secondary"
              variant="outlined"
              text="Remise à zéro"
              :disabled="isSaving"
              @click.prevent="clear"
            />
            <VBtn
              prepend-icon="charm:square-tick"
              text="Enregistrer la signature"
              color="green-sunstack-darker"
              variant="elevated"
              class="ml-5"
              size="large"
              :loading="isSaving"
              :disabled="isParticularInfoNotCompleted || !isApproved"
              @click.prevent="exportSignature"
            />
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  </VContainer>
</template>

<style scoped lang="scss">
.signature-canvas {
  position: relative;
  border: 3px solid #333333;
  border-radius: 2% 6% 5% 4% / 1% 1% 2% 4%;
  background-color: #f0f0f0;
  touch-action: none;

  &::before {
    content: '';
    border: 2px solid #353535;
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0) scale(1.015) rotate(0.5deg);
    border-radius: 1% 1% 2% 4% / 2% 6% 5% 4%;
  }
}
</style>
