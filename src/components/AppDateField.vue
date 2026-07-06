<template>
  <q-input
    :model-value="displayValue"
    :label="label"
    mask="##/##/####"
    outlined
    :dense="dense"
    :autofocus="autofocus"
    @update:model-value="onInput"
  >
    <template #append>
      <q-icon name="event" class="cursor-pointer" size="20px">
        <q-popup-proxy ref="proxyRef" cover transition-show="scale" transition-hide="scale">
          <q-date
            :model-value="modelValue || null"
            mask="YYYY-MM-DD"
            :first-day-of-week="1"
            :locale="localeES"
            @update:model-value="onDatePick"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label:      { type: String, default: '' },
  dense:      { type: Boolean, default: true },
  autofocus:  { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const proxyRef = ref(null)

const localeES = {
  days:        ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  daysShort:   ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  months:      ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
}

// YYYY-MM-DD → DD/MM/YYYY para mostrar en el input
const displayValue = computed(() => {
  if (!props.modelValue || props.modelValue.length < 10) return ''
  const [y, m, d] = props.modelValue.split('-')
  return `${d}/${m}/${y}`
})

// Escritura manual: DD/MM/YYYY → YYYY-MM-DD
function onInput(val) {
  if (!val || val.length < 10) {
    emit('update:modelValue', '')
    return
  }
  const d = val.slice(0, 2)
  const m = val.slice(3, 5)
  const y = val.slice(6, 10)
  if (y.length === 4) {
    emit('update:modelValue', `${y}-${m}-${d}`)
  }
}

// Selección en calendario: val es YYYY-MM-DD (mask de QDate)
function onDatePick(val) {
  emit('update:modelValue', val || '')
  proxyRef.value?.hide()
}
</script>
