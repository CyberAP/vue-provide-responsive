const getWindow = () => typeof window === 'undefined' ? null : window;

type Responsive = { width: number } & Record<string, any>;
type Breakpoint = number | { value: number, ignoreScrollbar: boolean };
type Breakpoints = Record<string, Breakpoint>;

const install = (Vue: any, {
  breakpoints = {},
  defaultWidth = 1024,
  window = getWindow(),
  beforeProvide,
  onResize,
  name = 'responsive',
  ssr = false,
}: {
  breakpoints?: Breakpoints,
  defaultWidth?: number,
  window?: Window | null,
  beforeProvide?: (responsive: Responsive) => void,
  onResize?: (event: UIEvent, responsive: Responsive) => void,
  name?: string | symbol,
  ssr?: boolean,
} = {}) => {

  const scrollbarWidth = (() => {
    if (!window) return 0;
    return window.innerWidth - window.document.body.clientWidth;
  })();

  const helpers = Object.keys(breakpoints)
    .reduce((acc, key) => {
      const breakpoint = breakpoints[key];
      const name = 'is' + key.charAt(0).toUpperCase() + key.substring(1); // mobile → isMobile
      let value: number;
      if (typeof breakpoint === 'object') {
        value = breakpoint.value;
        if (!breakpoint.ignoreScrollbar) value -= scrollbarWidth;
      } else {
        value = breakpoint - scrollbarWidth;
      }
      Object.defineProperty(acc, name, {
        configurable: true,
        enumerable: true,
        get() {
          return this.width <= value;
        }
      });
      return acc;
    }, {});
  
  const nonReactiveResponsive = Object.assign(helpers, { width: getCurrentWidth() });
  
  if (beforeProvide) {
    beforeProvide(nonReactiveResponsive);
  }
  
  const responsive = Vue.observable(nonReactiveResponsive);

  function getCurrentWidth() {
    if (!window) return defaultWidth;
    return window.document.body.clientWidth;
  }

  if (window) {
    // do not break hydration in SSR
    if (ssr || '__NUXT__' in window) {
      responsive.width = defaultWidth;
      requestAnimationFrame(() => {
        responsive.width = getCurrentWidth();
      });
    }
    window.addEventListener('resize', (event: UIEvent) => {
      responsive.width = getCurrentWidth();
      if (onResize) onResize(event, responsive);
    });
  }

  Vue.mixin({
    provide: {
      [name]: responsive,
    }
  });
};

export default { install };
