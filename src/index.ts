const getWindow = () => typeof window === 'undefined' ? null : window;

type Responsive = { width: number } & Record<string, any>;
type Breakpoint = number | { value: number, ignoreScrollbar: boolean };
type Breakpoints = Record<string, Breakpoint>;
type ResponsiveHelper = (this: Responsive) => boolean;

const install = (Vue: any, {
  breakpoints = {},
  defaultWidth = 1024,
  window = getWindow(),
  beforeProvide,
  onResize,
  name = 'responsive',
}: {
  breakpoints?: Breakpoints,
  defaultWidth?: number,
  window?: Window | null,
  beforeProvide?: (responsive: Responsive) => void,
  onResize?: (event: UIEvent, responsive: Responsive) => void,
  name?: string | symbol,
} = {}) => {

  const scrollbarWidth = (() => {
    if (!window) return 0;
    return window.innerWidth - window.document.body.clientWidth;
  })();

  const helpers = Object.keys(breakpoints)
    .reduce((acc, key) => {
      const breakpoint = breakpoints[key];
      const name = 'is' + key.charAt(0).toUpperCase() + key.substring(1); // mobile → isMobile
      let value: number, ignoreScrollbar = false;
      if (typeof breakpoint === 'object') {
        value = breakpoint.value;
        ignoreScrollbar = breakpoint.ignoreScrollbar;
      } else {
        value = breakpoint;
      }
      const withScrollbar: ResponsiveHelper = function responsiveHelper() {
        return this.width + scrollbarWidth <= value;
      };
      const withoutScrollbar: ResponsiveHelper = function responsiveHelper() {
        return this.width <= value;
      };
      Object.defineProperty(acc, name, {
        configurable: true,
        enumerable: true,
        get: ignoreScrollbar ? withoutScrollbar : withScrollbar,
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
