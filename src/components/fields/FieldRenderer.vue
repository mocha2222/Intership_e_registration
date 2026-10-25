<template>
  <div class="field-renderer">
    <component
        :is="getComponentFor(el.type)"
        v-if="getComponentFor(el.type)"
        :elSettings="el.settings"
        :label="el.label"
        :heading="el.text"
        :subheading="el.subtext || el.settings?.sublabel"
                :mode="mode"
        :answer="answers[`el_${el.id}`]"
        :answers="answers"
        :uid="el.id"
        :readonly="viewingAnswers"
        :hasError="hasFieldError(el.id)"
        :initialOptions="el.options"
        :initialRows="el.rows"
        :initialColumns="el.columns"
        :scaleMax="el.scaleMax"
        :minLabel="el.settings?.minLabel || el.minLabel"
        :maxLabel="el.settings?.maxLabel || el.maxLabel"
        :firstAnswer="answers[`el_${el.id}_first`]"
        :lastAnswer="answers[`el_${el.id}_last`]"
        :streetAnswer="answers[`el_${el.id}_street`]"
        :streetAnswer2="answers[`el_${el.id}_street2`]"
        :cityAnswer="answers[`el_${el.id}_city`]"
        :stateAnswer="answers[`el_${el.id}_state`]"
        :postalAnswer="answers[`el_${el.id}_postal`]"
        :fileName="answers[`el_${el.id}_name`]"
        :answerName="answers[`el_${el.id}_name`]"
        @update:answer="(val) => answers[`el_${el.id}`] = val"
        @update:firstAnswer="(val) => answers[`el_${el.id}_first`] = val"
        @update:lastAnswer="(val) => answers[`el_${el.id}_last`] = val"
        @update:streetAnswer="(val) => answers[`el_${el.id}_street`] = val"
        @update:streetAnswer2="(val) => answers[`el_${el.id}_street2`] = val"
        @update:cityAnswer="(val) => answers[`el_${el.id}_city`] = val"
        @update:stateAnswer="(val) => answers[`el_${el.id}_state`] = val"
        @update:postalAnswer="(val) => answers[`el_${el.id}_postal`] = val"
        @file-selected="(files) => handleFileUpload({ target: { files } }, el.id)"
        @remove-file="(index) => removeFile(index, el.id)"
      />

      <div v-else class="fill-input-group">
        <label class="fill-label">{{ el.label || el.type }}</label>
        <input type="text" class="fill-input" placeholder="Type your answer"
          v-model="answers[`el_${el.id}`]" :class="{ 'input-error': hasFieldError(el.id) }" />
      </div>
  </div>
</template>
<script>
import ParagraphBlock from '@/components/fields/ParagraphElement.vue';
import ImageBlock from '@/components/fields/ImageField.vue';
import TableInputBlock from '@/components/fields/TableField.vue';
import ShortTextBlock from '@/components/fields/TextField.vue';
import LongTextBlock from '@/components/fields/TextareaField.vue';
import PhoneNumberBlock from '@/components/fields/PhoneField.vue';
import EmailBlock from '@/components/fields/EmailField.vue';
import FullNameBlock from '@/components/fields/NameField.vue';
import AddressBlock from '@/components/fields/AddressField.vue';
import DateBlock from '@/components/fields/DateField.vue';
import NumberBlock from '@/components/fields/NumberField.vue';
import SingleChoiceBlock from '@/components/fields/RadioField.vue';
import MultipleChoiceBlock from '@/components/fields/CheckboxField.vue';
import DropdownBlock from '@/components/fields/DropdownField.vue';
import StarRatingBlock from '@/components/fields/RatingField.vue';
import ScaleRatingBlock from '@/components/fields/ScaleRatingField.vue';
import FileUploadBlock from '@/components/fields/FileField.vue';
import HeadingBlock from '@/components/fields/HeadingBlock.vue';
import LogoBannerBlock from '@/components/fields/BannerElement.vue';
import DropdownChildTreeField from '@/components/fields/DependentDropdownField.vue';
export default {
    components: { ParagraphBlock, ImageBlock, TableInputBlock, ShortTextBlock, LongTextBlock, PhoneNumberBlock, EmailBlock, FullNameBlock, AddressBlock, DateBlock, NumberBlock, SingleChoiceBlock, MultipleChoiceBlock, DropdownBlock, StarRatingBlock, ScaleRatingBlock, FileUploadBlock, HeadingBlock, LogoBannerBlock, DropdownChildTreeField },
    props: {
        el: { type: Object, required: true },
        answers: { type: Object, required: true },
        mode: { type: String, default: 'public' },
        viewingAnswers: Boolean,
        hasError: Boolean,
    },
    emits: ['file-selected', 'remove-file'],
    methods: {
      hasFieldError() { return this.hasError; },
        handleFileUpload(event, fieldId) {
            this.$emit('file-selected', event, fieldId);
        },
        removeFile(index, fieldId) {
          this.$emit('remove-file', index, fieldId);
        },
        getComponentFor(type) {
            const map = {
                'heading': 'HeadingBlock',
                'paragraph': 'ParagraphBlock',
                'image': 'ImageBlock',
                'shorttext': 'ShortTextBlock',
                'longtext': 'LongTextBlock',
                'email': 'EmailBlock',
                'phonenumber': 'PhoneNumberBlock',
                'date': 'DateBlock',
                'number': 'NumberBlock',
                'dropdown': 'DropdownBlock',
                'singlechoice': 'SingleChoiceBlock',
                'multiplechoice': 'MultipleChoiceBlock',
                'starrating': 'StarRatingBlock',
                'scalerating': 'ScaleRatingBlock',
                'fileupload': 'FileUploadBlock',
                'address': 'AddressBlock',
                'fullname': 'FullNameBlock',
                'tableinput': 'TableInputBlock',
                // logobanner excluded — rendered as the card header banner, not in the element loop
            };
            return map[type] || null;
        }
    },
};
</script>
<style scoped src="@/assets/styles/views-PublicFillForm.css"></style>
