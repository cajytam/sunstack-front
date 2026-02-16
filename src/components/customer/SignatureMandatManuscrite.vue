<script setup lang="ts">
const props = defineProps({
  isSaving: { type: Boolean, default: false },
  isCustomerParticular: { type: Boolean, default: false },
  birthdayCustomer: { type: String, default: null },
  birthLocationCustomer: { type: String, default: null },
})

const emit = defineEmits<{
  (e: 'signatureBase64', value: string): void
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
  canvas.value = document.getElementById('canvas-mandat')
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

  const dataURL = canvas.value.toDataURL().split(';base64,')[1]

  emit('signatureBase64', dataURL)
}

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
</script>

<template>
  <VContainer>
    <VRow justify="center">
      <VCol
        cols="12"
        class="pb-0"
      >
        <VCardTitle class="text-h5 font-weight-bold"> Signature du mandat de représentation </VCardTitle>
      </VCol>
      <VCol
        v-if="isCustomerParticular"
        class="mt-5 pb-0"
        cols="9"
      >
        <VRow>
          <VCol
            cols="12"
            lg="3"
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
            lg="9"
          >
            <VTextField
              label="Ville de naissance"
              variant="filled"
              :model-value="props.birthLocationCustomer"
              @input="$emit('birthLocationCustomer', $event.target.value)"
            />
          </VCol>
        </VRow>
      </VCol>
      <VCol
        cols="9"
        class="text-center"
      >
        <VRow
          justify="center"
          class="mt-5"
        >
          <VCol>
            <canvas
              id="canvas-mandat"
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
        <VRow>
          <VCol>
            <VBtn
              prepend-icon="gg:erase"
              color="secondary"
              variant="outlined"
              text="Effacer"
              :disabled="isSaving"
              @click.prevent="clear"
            />
            <VBtn
              prepend-icon="charm:square-tick"
              text="Valider signature mandat"
              color="green-sunstack-darker"
              variant="elevated"
              class="ml-5"
              size="large"
              :loading="isSaving"
              :disabled="isParticularInfoNotCompleted"
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
