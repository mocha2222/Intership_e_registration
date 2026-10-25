<template>
    <HeadingBlock
        v-if="el.type === 'heading'"
        :heading="el.text"
        :subheading="el.subtext"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:heading="v => {
            el.text = v;
            $emit('change');
        }"
        @update:subheading="v => {
            el.subtext = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <FullNameBlock
        v-else-if="el.type === 'fullname'"
        :label="el.label"
        :firstName="el.firstName"
        :lastName="el.lastName"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:firstName="v => {
            el.firstName = v;
            $emit('change');
        }"
        @update:lastName="v => {
            el.lastName = v;
            $emit('change');
        }"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <AddressBlock
        v-else-if="el.type === 'address'"
        :label="el.label"
        :address="el.address"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:address="v => {
            el.address = v;
            $emit('change');
        }"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <EmailBlock
        v-else-if="el.type === 'email'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <DropdownBlock
        v-else-if="el.type === 'dropdown'"
        :label="el.label"
        :initialOptions="el.options"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:options="v => {
            el.options = v;
            $emit('change');
        }"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
        @commit="$emit('commit')"
    />

    <ShortTextBlock
        v-else-if="el.type === 'shorttext'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <LongTextBlock
        v-else-if="el.type === 'longtext'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <ParagraphBlock
        v-else-if="el.type === 'paragraph'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <ScaleRatingBlock
        v-else-if="el.type === 'scalerating'"
        :label="el.label"
        :scaleMax="el.scaleMax"
        :minLabel="el.minLabel"
        :maxLabel="el.maxLabel"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <StarRatingBlock
        v-else-if="el.type === 'starrating'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <TableInputBlock
        v-else-if="el.type === 'tableinput'"
        :label="el.label"
        :initialColumns="el.columns"
        :initialRows="el.rows"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @update:columns="v => {
            el.columns = v;
            $emit('change');
        }"
        @update:rows="v => {
            el.rows = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <ImageBlock
        v-else-if="el.type === 'image'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <FileUploadBlock
        v-else-if="el.type === 'fileupload'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <PhoneNumberBlock
        v-else-if="el.type === 'phonenumber'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <DateBlock
        v-else-if="el.type === 'date'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <MultipleChoiceBlock
        v-else-if="el.type === 'multiplechoice'"
        :label="el.label"
        :initialOptions="el.options"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:options="v => {
            el.options = v;
            $emit('change');
        }"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <SingleChoiceBlock
        v-else-if="el.type === 'singlechoice'"
        :label="el.label"
        :initialOptions="el.options"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:options="v => {
            el.options = v;
            $emit('change');
        }"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <NumberBlock
        v-else-if="el.type === 'number'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />

    <LogoBannerBlock
        v-else-if="el.type === 'logobanner'"
        :label="el.label"
        :elSettings="el.settings"
        :isActive="isActive"
        @update:label="v => {
            el.label = v;
            $emit('change');
        }"
        @delete="$emit('delete')"
        @update:settings="v => {
            el.settings = v;
            $emit('change');
        }"
    />
</template>

<script>
import HeadingBlock from '@/components/fields/HeadingBlock.vue';
import FullNameBlock from '@/components/fields/NameField.vue';
import AddressBlock from '@/components/fields/AddressField.vue';
import EmailBlock from '@/components/fields/EmailField.vue';
import DropdownBlock from '@/components/fields/DropdownField.vue';
import NumberBlock from '@/components/fields/NumberField.vue';
import SingleChoiceBlock from '@/components/fields/RadioField.vue';
import MultipleChoiceBlock from '@/components/fields/CheckboxField.vue';
import ScaleRatingBlock from '@/components/fields/ScaleRatingField.vue';
import StarRatingBlock from '@/components/fields/RatingField.vue';
import TableInputBlock from '@/components/fields/TableField.vue';
import ImageBlock from '@/components/fields/ImageField.vue';
import FileUploadBlock from '@/components/fields/FileField.vue';
import ShortTextBlock from '@/components/fields/TextField.vue';
import LongTextBlock from '@/components/fields/TextareaField.vue';
import ParagraphBlock from '@/components/fields/ParagraphElement.vue';
import DateBlock from '@/components/fields/DateField.vue';
import PhoneNumberBlock from '@/components/fields/PhoneField.vue';
import LogoBannerBlock from '@/components/fields/BannerElement.vue';

export default {
    components: {
        HeadingBlock,
        FullNameBlock,
        AddressBlock,
        EmailBlock,
        DropdownBlock,
        NumberBlock,
        SingleChoiceBlock,
        MultipleChoiceBlock,
        ScaleRatingBlock,
        StarRatingBlock,
        TableInputBlock,
        ImageBlock,
        FileUploadBlock,
        ShortTextBlock,
        LongTextBlock,
        ParagraphBlock,
        DateBlock,
        PhoneNumberBlock,
        LogoBannerBlock,
    },

    props: {
        el: {
            type: Object,
            required: true,
        },
        isActive: Boolean,
    },

    emits: ['change', 'delete', 'commit'],
};
</script>