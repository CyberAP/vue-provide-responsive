const getWindow = () => typeof window === 'undefined' ? null : window;

type Responsive = { width: number } & Record<string, any>;
type Breakpoints = Record<string, number>;

const install = (Vue: any, {
  breakpoints = {},
  defaultWidth = 1024,
  window = getWindow(),
  onResize,
  name = 'responsive',
  respectScrollbarWidth = true,
}: {
  breakpoints?: Breakpoints,
  defaultWidth?: number,
  window?: Window | null,
  onResize?: (event: UIEvent, responsive: Responsive) => void,
  name?: string | symbol,
  respectScrollbarWidth?: boolean,
} = {}) => {

  const scrollbarWidth = (() => {
    if (!window || !respectScrollbarWidth) return 0;
    return window.innerWidth - window.document.documentElement.clientWidth;
  })();

  const helpers = Object.keys(breakpoints)
    .reduce((acc, key) => {
      const value = breakpoints[key];
      const name = 'is' + key.charAt(0).toUpperCase() + key.substring(1); // mobile → isMobile
      Object.defineProperty(acc, name, {
        configurable: true,
        enumerable: true,
        get() {
          return this.width + scrollbarWidth <= value;
        },
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
