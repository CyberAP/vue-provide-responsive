# Vue-provide-reponsive
A Vue plugin that provides responsive design helpers, based on breakpoints.

* **Performant**. All the data is retrieved in a single pass.
* **Zero collisions**. Uses Provide\Inject, accepts any string or a symbol as a provision name.
* **SSR\Nuxt Ready**. Has fallback width for server-side rendering.
* **Easy setup**. Nothing is required, minimal breakpoint configuration.
* **Fully customizable**. Execute any arbitrary code in the resize callback, provide your own helpers\values, customize existing helpers.
* **Human readable**. No manual equality checks, easy to understand helper names.


```html
<template>
  <div class="my-layout">
    <div class="my-layout__title">{{title}}</div>
    <div class="my-layout__mobile" v-if="responsive.isMobile">
      <slot />
    </div>
    <div class="my-layout__desktop" v-else>
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyLayout',
  inject: ['responsive'],
  computed: {
    title() {
      return this.responsive.isMobile ? 'Short title' : 'A very very long title';
    }
  }
}
</script>
```

## Usage

Install from npm

`npm i vue-provide-responsive`

Activate the plugin inside your app:

```js
import Vue from 'vue';
import VueResponsiveProvide from 'vue-provide-responsive';

Vue.use(VueResponsiveProvide, {
  breakpoints: {
    mobile: 768
    // will be converted to responsive.isMobile() helper
    // will be true if the viewport width is less or equals 768 pixels
  }
});
```

Use responsive helpers in any of your components:

```html
<template>
  <div>
    <div v-if="!responsive.isMobile">Is Desktop</div>
    <div v-if="responsive.isMobile">Is Mobile</div>
    <div>Current width: {{ responsive.width }}px</div>
  </div>
</template>

<script>
export default {
  name: 'MyComponent',
  inject: ['responsive'],
  // all the helpers are now available
  // on the component's context
  computed: {
    responsiveValue() {
      return this.responsive.isMobile ? 'Mobile' : 'Dekstop';
    }
  }
}
</script>
```