# Vue-provide-reponsive
A Vue plugin that provides responsive design helpers, based on breakpoints.

[Demo](https://codesandbox.io/s/magical-shockley-wc287)

* **Performant**. All the data is retrieved in a single pass.
* **Zero collisions**. Uses [Provide\Inject](https://vuejs.org/v2/api/index.html#provide-inject), accepts any string or a symbol as a provision name.
* **[SSR\Nuxt Ready](#ssr)**. Has [fallback width](#defaultwidth) for server-side rendering.
* **Easy setup**. Nothing is required, minimal breakpoint configuration.
* **Fully customizable**. Execute any arbitrary code in the resize callback, [provide your own helpers\values](#beforeprovide), customize existing helpers.
* **Human readable**. No manual equality checks, easy to understand helper names.


```html
<template>
  <div class="my-layout">
    <div class="title">{{title}}</div>
    <div class="mobile" v-if="responsive.isMobile">
      <slot />
    </div>
    <div class="desktop" v-else>
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
    // will be converted to responsive.isMobile helper (works exactly like a computed)
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
      return this.responsive.isMobile ? 'Mobile' : 'Desktop';
    }
  }
}
</script>
```

## Plugin configuration

### **`breakpoints`**

An object listing resolution breakpoints that would be converted into responsive helpers.

Could be either a breakpoint value (`number`) or a breakpoint configuration: `{ value: number, ignoreScrollbar: boolean }`.

Breakpoints are Media Query\CSS compliant, in the sence that they do not include scrollbar width. So in result your breakpoint value will be redued by the scrollbar width (they same way as Media Queries work). You can disable that behaviour with `ingnoreScrollbar: true`.

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

Vue.use(VueProvideResponsive, {
  breakpoints: {
    mobile: 768,
    desktop: {
      value: 1024,
      ignoreScrollbar: true
    }
  }
});
```

#### breakpoint configuration

* `value`

  **Type**: `number`

  Maximum width

* `ignoreScrollbar`

  **Type**: `boolean`

  **Default**: `false`

  Controls whether scrollbar width should be included in the breakpoint calculation.
  If not set your breakpoint value would be substracted by the scrollbar width.

  Scrollbar width is always zero outside browser enviroment (SSR on nodejs for example).


### **`name`**

**Type**: `string` or `symbol`

**Default**: `responsive`

Used as a provision name.

```js
// constants.js
export const RESPONSIVE_SYMBOL = Symbol();
```

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';
import { RESPONSIVE_SYMBOL } from 'constants.js';

Vue.use(VueProvideResponsive, {
  name: RESPONSIVE_SYMBOL
});
```

```html
<script>
import { RESPONSIVE_SYMBOL } from 'constants.js';

export default {
  name: 'MyComponent',
  inject: {
    responsive: {
      from: RESPONSIVE_SYMBOL
    }
  }
}
</script>
```

### **`beforeProvide`**

**Type**: `function`

**Arguments**:

* `responsive`: Non-reactive responsive object

Callback to extend responsive object before it becomes reactive. Useful for adding your own helpers.

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

Vue.use(VueProvideResponsive, {
  beforeProvide(responsive) {
    // to behave like a computed we define a getter: responsive.isSmallHeight
    // you can define a function if you want and call it explicitly: responsive.myFunc()
    Object.defineProperty(responsive, 'isSmallHeight', {
      configurable: true,
      enumerable: true,
      // will become reactive on the component's context
      get() {
        return this.height < 500;
      }
    })
  },
});
```

You could also use this to create reactive properties in advance.

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

Vue.use(VueProvideResponsive, {
  beforeProvide(responsive) {
    // this will be useful if you want height to be reactive
    responsive.height = 0;
  },
});
```

### **`onResize`**

**Type**: `function`

**Arguments**:

* `event`: Resize UIEvent
* `responsive`: Reactive responsive object

Callback that's called on every resize event. Useful to update properties on the `responsive` object.

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

Vue.use(VueProvideResponsive, {
  onResize(event, responsive) {
    Vue.set(responsive, 'height', window.innerHeight);
  }
});
```

If you defined `height` beforehand then you don't need `Vue.set`:

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

Vue.use(VueProvideResponsive, {
  beforeProvide(responsive) {
    responsive.height = 0;
  },
  onResize(event, responsive) {
    responsive.height = window.innerHeight;
  }
});
```

### **`defaultWidth`**

**Type**: `number`

**Default**: `1024`

Width that will be used when `window` is not available.
SRR support relies on that value, so you can control what the default width will be when the exact device is unkown.

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

Vue.use(VueProvideResponsive, {
  breakpoints: {
    mobile: 768
  },
  defaultWidth: 768
  // responsive.isMobile will be true on SSR context
});
```

#### Predictive rendering
Could also be used with a prediction tool to determine layout in SSR context.

Nuxt.js example using [UAParser.js](https://github.com/faisalman/ua-parser-js):

```js
// plugins/responsive.js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

export default ({ req }) => {

  const breakpoints = {
    mobile: 768,
    tablet: 1024,
  }

  const devices = {
    wearable: breakpoints.mobile,
    mobile: breakpoints.mobile,
    tablet: breakpoints.tablet,
  }

  const config = {
    breakpoints,
    defaultWidth: 1920,
  }

  if (req) {
    const uaparser = require('ua-parser-js');
    const { device } = uaparser(req.headers['user-agent']);
    const width = devices[device.type];
    if (width) config.defaultWidth = width;
  }

  Vue.use({
    // forces plugin to install on every request
    install: VueProvideResponsive.install
  }, config);
}
```

### **`ssr`**

**Type**: `boolean`

Triggers supports for hydration on the client. Set this to `true` if you're using a custom SSR. Nuxt users will get this out of the box.

### **`window`**

**Type**: `window` instance

A `window` substitute, could be useful if you don't want to work with global window instance.


## Responsive object

### **`width`**

**Type**: `number`

Current viewport width, equals to `defaultWidth` outside browser context (for example in SSR).

```html
<template>
  <div v-if="responsive.width > 500">
    Your screen width is higher than 500.
  </div>
</template>

<script>
export default {
  name: "MyComponent",
  inject: ['responsive']
}
</script>
```

### **`is%Breakpoint%`**

**Type**: `boolean`

Reactive helper based on breakpoint value.

```js
import Vue from 'vue';
import VueProvideResponsive from 'vue-provide-responsive';

Vue.use(VueProvideResponsive, {
  breakpoints: {
    mobile: 768
  },
});
```

```html
<template>
  <div v-if="responsive.isMobile">
    Your viewport width is less than 768 px minus scrollbar width.
  </div>
</template>

<script>
export default {
  name: "MyComponent",
  inject: ['responsive']
}
</script>
```

#### Performance
`resize` is usually not a frequent event, but in case you have a lot of heavy resize handling in your app you could use `debounce` to reduce performance strain in your watchers or computeds.

```html
<script>
import debounce from 'debounce';
import myHeavyFunction from 'my-heavy-function';

export default {
  name: "MyComponent",
  data() {
    return {
      myDebouncedFn: debounce((width) => {
        this.value = myHeavyFunction(width);
      }, 500),
      value: null,
    }
  },
  watch: {
    'responsive.width': function(width) {
      this.myDeboucnedFn(width);
    }
  }
}
</script>
```


## Typescript support

You would need to declare typings yourself, since they can not be determined beforehand.

```ts
// main.ts or plugin.ts
declare module 'vue/types/vue' {
  interface Vue {
    responsive: {
      width: number,
      isMobile: boolean
      isTablet: boolean
    }
  }
}
```
