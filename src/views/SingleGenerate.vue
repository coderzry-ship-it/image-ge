<script setup>
import { provide } from 'vue'
import { ElSteps, ElStep } from 'element-plus'
import { useSingleStore } from '../stores/singleStore'
import SingleStepInput from '../components/SingleStepInput.vue'
import StepPrompts from '../components/StepPrompts.vue'
import StepGenerate from '../components/StepGenerate.vue'

const store = useSingleStore()
provide('pageStore', store)
</script>

<template>
  <div>
    <ElSteps :active="store.currentStep - 1" finish-status="success" align-center style="margin-bottom: 28px">
      <ElStep title="输入素材" @click.native="store.currentStep = 1" style="cursor:pointer" />
      <ElStep title="生成提示词" @click.native="store.prompts.length && (store.currentStep = 2)" style="cursor:pointer" />
      <ElStep title="批量生图" @click.native="store.results.length && (store.currentStep = 3)" style="cursor:pointer" />
    </ElSteps>

    <SingleStepInput v-if="store.currentStep === 1" />
    <StepPrompts v-else-if="store.currentStep === 2" />
    <StepGenerate v-else-if="store.currentStep === 3" />
  </div>
</template>
