const getWindow = () => typeof window === 'undefined' ? null : window;

type Responsive = { width: number } & Record<string, any>;
type Breakpoint = number | { value: number, ignoreScrollbar: boolean };
type Breakpoints = Record<string, Breakpoint>;

const install = (Vue: any, {
  breakpoints = {},
  defaultWidth = 1024,
  window = getWindow(),
  onResize,
  name = 'responsive',
}: {
  breakpoints?: Breakpoints,
  defaultWidth?: number,
  window?: Window | null,
  onResize?: (event: UIEvent, responsive: Responsive) => void,
  name?: string | symbol,
} = {}) => {

  const scrollbarWidth = (() => {
    if (!window) return 0;
    return window.innerWidth - window.document.documentElement.clientWidth;
  })();

  const helpers = Object.keys(breakpoints)
    .reduce((acc, key) => {
      const breakpoint = breakpoints[key];
      const name = 'is' + key.charAt(0).toUpperCase() + key.substring(1); // mobile → isMobile
      let value, ignoreScrollbar = false;
      if (typeof breakpoint === 'object') {
        value = breakpoint.value;
        ignoreScrollbar = breakpoint.ignoreScrollbar;
      } else {
        value = breakpoint;
      }
      const withScrollbar = function responsiveHelper() {
        return this.width + scrollbarWidth <= value;
      };
      const withoutScrollbar = function responsiveHelper() {
        return this.width <= value;
      };
      Object.defineProperty(acc, name, {
        configurable: true,
        enumerable: true,
        get: ignoreScrollbar ? withoutScrollbar : withScrollbar,
      });
      return acc;
    }, {});
  
  const responsive = Vue.observable(
    Object.assign(helpers, {
      width: getCurrentWidth()
    })
  );

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
