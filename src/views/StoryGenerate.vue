<script setup>
import { provide } from 'vue'
import { ElSteps, ElStep } from 'element-plus'
import { useStoryStore } from '../stores/storyStore'
import StoryStepInput from '../components/StoryStepInput.vue'
import StepPrompts from '../components/StepPrompts.vue'
import StepGenerate from '../components/StepGenerate.vue'

const store = useStoryStore()
provide('pageStore', store)
</script>

<template>
  <div>
    <ElSteps :active="store.currentStep - 1" finish-status="success" align-center style="margin-bottom: 28px">
      <ElStep title="输入故事" @click.native="store.currentStep = 1" style="cursor:pointer" />
      <ElStep title="生成提示词" @click.native="store.prompts.length && (store.currentStep = 2)" style="cursor:pointer" />
      <ElStep title="生成漫画" @click.native="store.results.length && (store.currentStep = 3)" style="cursor:pointer" />
    </ElSteps>

    <StoryStepInput v-if="store.currentStep === 1" />
    <StepPrompts v-else-if="store.currentStep === 2" />
    <StepGenerate v-else-if="store.currentStep === 3" />
  </div>
</template>
