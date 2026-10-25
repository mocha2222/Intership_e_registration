<template>
  <div
    class="logo-banner-wrapper"
    :class="{ 'edit-mode': isActive && mode === 'builder', 'public-mode': mode === 'public' }"
  >
    
    <template v-if="mode === 'builder'">
      
      <div
        class="banner-frame"
        :class="{ active: isActive, 'has-image': !!previewUrl }"
        @click="onFrameClick"
      >
        
        <div v-if="!previewUrl" class="banner-placeholder" :class="{ active: isActive }">
          <i class="bi bi-card-image banner-placeholder-icon"></i>
          <span v-if="isActive" class="banner-placeholder-text">Click to upload banner image</span>
          <span v-else class="banner-placeholder-text muted">Logo Banner (no image)</span>
        </div>

        <div
          v-else
          class="banner-image-pan-container"
          :style="responsiveStyle"
          @mousedown.prevent="startPan"
          @touchstart="startPanTouch"
        >
          <img
            ref="bannerImg"
            :src="$resolveImg(previewUrl)"
            class="banner-image"
            draggable="false"
            alt="Banner"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${panX}% ${panY}%`,
              display: 'block'
            }"
          />
          <div class="pan-hint" v-if="isActive"><i class="bi bi-arrows-move"></i> Drag to reposition</div>
        </div>
      </div>

      <input ref="bannerInput" type="file" accept="image/*" class="hidden-input" @change="onBannerChange" />

      <div v-if="isActive" class="banner-controls">
        <div class="controls-row">
          <div class="ctrl-group">
            <label class="ctrl-label">Width</label>
            <input v-model="localWidth" class="ctrl-input" @change="syncBuilderState" placeholder="100%" />
          </div>
          <div class="ctrl-group">
            <label class="ctrl-label">Height</label>
            <input v-model="localHeight" class="ctrl-input" @change="syncBuilderState" placeholder="160px" />
          </div>
          <button v-if="previewUrl" class="ctrl-remove-btn" @click.stop="removeBanner">
            <i class="bi bi-trash"></i> Remove
          </button>
        </div>
      </div>

      <div v-if="isActive" class="block-actions">
        <button class="action-btn delete-btn" title="Delete element" @click.stop="$emit('delete')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="publicUrl" class="banner-public-frame" :style="responsiveStyle">
        <img
          :src="$resolveImg(publicUrl)"
          class="banner-public-image"
          draggable="false"
          alt="Banner"
          :style="{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${typeof elSettings?.panX === 'number' && Math.abs(elSettings?.panX) <= 100 ? elSettings.panX : 50}% ${typeof elSettings?.panY === 'number' && Math.abs(elSettings?.panY) <= 100 ? elSettings.panY : 50}%`,
            display: 'block',
          }"
        />
      </div>
    </template>
  </div>
</template>

<script>
export default {
    name: 'LogoBannerBlock',
    emits: ['update:settings', 'delete', 'update:label'],
    props: {
        label: { type: String, default: '' },
        elSettings: { type: Object, default: () => ({}) },
        mode: { type: String, default: 'builder' },
        isActive: { type: Boolean, default: false },
    },
    data() {
        // Read pan offsets. If they look like pixel values (e.g. > 100), default them to 50% (centered)
        let initialPanX = this.elSettings?.panX ?? 50;
        let initialPanY = this.elSettings?.panY ?? 50;
        if (Math.abs(initialPanX) > 100)
            initialPanX = 50;
        if (Math.abs(initialPanY) > 100)
            initialPanY = 50;
        return {
            previewUrl: this.elSettings?.imageUrl || this.elSettings?.url || '',
            publicUrl: this.elSettings?.imageUrl || this.elSettings?.url || '',
            localWidth: this.elSettings?.width || '100%',
            localHeight: this.elSettings?.height || '160px',
            panX: initialPanX,
            panY: initialPanY,
            // pan drag state
            _isPanning: false,
            _hasPanned: false,
            _panStartX: 0,
            _panStartY: 0,
            _panOriginX: 50,
            _panOriginY: 50,
        };
    },
    computed: {
        computedWidth() { return this.localWidth || '100%'; },
        computedHeight() { return this.localHeight || '160px'; },
        responsiveStyle() {
            const style = {
                width: this.computedWidth,
                overflow: 'hidden',
                position: 'relative'
            };
            const height = this.computedHeight;
            if (height.endsWith('px')) {
                const pxVal = parseInt(height);
                if (!isNaN(pxVal) && pxVal > 0) {
                    style.height = 'auto';
                    style.aspectRatio = `800 / ${pxVal}`;
                }
                else {
                    style.height = height;
                }
            }
            else {
                style.height = height;
            }
            return style;
        }
    },
    watch: {
        'elSettings.imageUrl'(val) { this.previewUrl = val || ''; this.publicUrl = val || ''; },
        'elSettings.url'(val) { if (!this.elSettings?.imageUrl) {
            this.previewUrl = val || '';
            this.publicUrl = val || '';
        } },
        'elSettings.width'(val) { if (!this.isActive)
            this.localWidth = val || '100%'; },
        'elSettings.height'(val) { if (!this.isActive)
            this.localHeight = val || '160px'; },
        'elSettings.panX'(val) { if (!this.isActive)
            this.panX = (typeof val === 'number' && Math.abs(val) <= 100) ? val : 50; },
        'elSettings.panY'(val) { if (!this.isActive)
            this.panY = (typeof val === 'number' && Math.abs(val) <= 100) ? val : 50; },
        isActive(val) { if (!val)
            this.syncBuilderState(); },
    },
    methods: {
        syncBuilderState() {
            const s = { ...this.elSettings };
            delete s.labelKey;
            s.imageUrl = this.previewUrl;
            s.url = this.previewUrl;
            s.width = this.localWidth;
            s.height = this.localHeight;
            s.panX = this.panX;
            s.panY = this.panY;
            this.$emit('update:settings', s);
            this.$emit('update:label', this.label);
        },
        onBannerChange(e) {
            const file = e.target.files[0];
            if (!file)
                return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.previewUrl = ev.target.result;
                this.panX = 50;
                this.panY = 50;
                this.syncBuilderState();
            };
            reader.readAsDataURL(file);
            // reset so same file can be re-uploaded
            e.target.value = '';
        },
        removeBanner() {
            this.previewUrl = '';
            this.panX = 50;
            this.panY = 50;
            this.syncBuilderState();
        },
        onFrameClick() {
            // Only open file picker when active AND no image is present
            if (this.isActive && !this.previewUrl && !this._hasPanned) {
                this.$refs.bannerInput.click();
            }
            this._hasPanned = false;
        },
        // ── Mouse pan ──
        startPan(e) {
            if (!this.isActive)
                return;
            this._isPanning = true;
            this._hasPanned = false;
            this._panStartX = e.clientX;
            this._panStartY = e.clientY;
            this._panOriginX = this.panX;
            this._panOriginY = this.panY;
            window.addEventListener('mousemove', this.onPan);
            window.addEventListener('mouseup', this.endPan);
        },
        onPan(e) {
            if (!this._isPanning)
                return;
            const dx = e.clientX - this._panStartX;
            const dy = e.clientY - this._panStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3)
                this._hasPanned = true;
            // Update object-position percentage
            // Panning the image "down" (positive dy) shifts the focal point "up" (negative position adjustment)
            const sensitivity = 0.15; // adjust drag sensitivity
            this.panX = Math.max(0, Math.min(100, this._panOriginX - dx * sensitivity));
            this.panY = Math.max(0, Math.min(100, this._panOriginY - dy * sensitivity));
        },
        endPan() {
            this._isPanning = false;
            window.removeEventListener('mousemove', this.onPan);
            window.removeEventListener('mouseup', this.endPan);
            if (this._hasPanned)
                this.syncBuilderState();
        },
        // ── Touch pan ──
        startPanTouch(e) {
            if (!this.isActive)
                return;
            const t = e.touches[0];
            this._isPanning = true;
            this._hasPanned = false;
            this._panStartX = t.clientX;
            this._panStartY = t.clientY;
            this._panOriginX = this.panX;
            this._panOriginY = this.panY;
            window.addEventListener('touchmove', this.onPanTouch);
            window.addEventListener('touchend', this.endPanTouch);
        },
        onPanTouch(e) {
            if (!this._isPanning)
                return;
            const t = e.touches[0];
            const dx = t.clientX - this._panStartX;
            const dy = t.clientY - this._panStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3)
                this._hasPanned = true;
            const sensitivity = 0.15;
            this.panX = Math.max(0, Math.min(100, this._panOriginX - dx * sensitivity));
            this.panY = Math.max(0, Math.min(100, this._panOriginY - dy * sensitivity));
        },
        endPanTouch() {
            this._isPanning = false;
            window.removeEventListener('touchmove', this.onPanTouch);
            window.removeEventListener('touchend', this.endPanTouch);
            this.syncBuilderState();
        },
    },
    beforeUnmount() {
        window.removeEventListener('mousemove', this.onPan);
        window.removeEventListener('mouseup', this.endPan);
        window.removeEventListener('touchmove', this.onPanTouch);
        window.removeEventListener('touchend', this.endPanTouch);
    },
};
</script>

<style scoped src="@/assets/styles/components-fields-BannerElement.css"></style>
