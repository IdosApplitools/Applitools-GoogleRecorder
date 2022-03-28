const puppeteer = require('puppeteer');
const { Eyes, Target, VisualGridRunner, BrowserType, DeviceName } = require('@applitools/eyes-puppeteer');


(async () => {
  const browser = await puppeteer.launch({ headless: false});
  const page = await browser.newPage();
  
  const runner = new VisualGridRunner({ testConcurrency: 5 });
  const eyes = new Eyes(runner);

    async function setUpEyes() {
      eyes.setApiKey(process.env.APPLITOOLS_API_KEY);

      const configuration = eyes.getConfiguration();

      configuration.setBatch({
        name: "Puppeteer-Goggle-Recorder"
      })

      configuration.setStitchMode("CSS");

      configuration.addBrowser({ width: 1200, height: 800, name: BrowserType.CHROME });
      configuration.addBrowser({ width: 1200, height: 800, name: BrowserType.FIREFOX });
      configuration.addBrowser({ width: 1200, height: 800, name: BrowserType.SAFARI });
      configuration.addBrowser({ width: 1200, height: 800, name: BrowserType.EDGE_CHROMIUM });
      configuration.addBrowser({ width: 1200, height: 800, name: BrowserType.IE_11 });
      configuration.addBrowser({ deviceName: DeviceName.Pixel_2 });
      configuration.addBrowser({ deviceName: DeviceName.iPhone_X });

      eyes.setConfiguration(configuration);
    };

    async function waitForSelectors(selectors, frame) {
      for (const selector of selectors) {
        try {
          return await waitForSelector(selector, frame);
        } catch (err) {
          console.error(err);
        }
      }
      throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
    }

    async function waitForSelector(selector, frame) {
      if (selector instanceof Array) {
        let element = null;
        for (const part of selector) {
          if (!element) {
            element = await frame.waitForSelector(part);
          } else {
            element = await element.$(part);
          }
          if (!element) {
            throw new Error('Could not find element: ' + part);
          }
          element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
        }
        if (!element) {
          throw new Error('Could not find element: ' + selector.join('|'));
        }
        return element;
      }
      const element = await frame.waitForSelector(selector);
      if (!element) {
        throw new Error('Could not find element: ' + selector);
      }
      return element;
    }

    async function waitForElement(step, frame) {
      const count = step.count || 1;
      const operator = step.operator || '>=';
      const comp = {
        '==': (a, b) => a === b,
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
      };
      const compFn = comp[operator];
      await waitForFunction(async () => {
        const elements = await querySelectorsAll(step.selectors, frame);
        return compFn(elements.length, count);
      });
    }

    async function querySelectorsAll(selectors, frame) {
      for (const selector of selectors) {
        const result = await querySelectorAll(selector, frame);
        if (result.length) {
          return result;
        }
      }
      return [];
    }

    async function querySelectorAll(selector, frame) {
      if (selector instanceof Array) {
        let elements = [];
        let i = 0;
        for (const part of selector) {
          if (i === 0) {
            elements = await frame.$$(part);
          } else {
            const tmpElements = elements;
            elements = [];
            for (const el of tmpElements) {
              elements.push(...(await el.$$(part)));
            }
          }
          if (elements.length === 0) {
            return [];
          }
          const tmpElements = [];
          for (const el of elements) {
            const newEl = (await el.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
            if (newEl) {
              tmpElements.push(newEl);
            }
          }
          elements = tmpElements;
          i++;
        }
        return elements;
      }
      const element = await frame.$$(selector);
      if (!element) {
        throw new Error('Could not find element: ' + selector);
      }
      return element;
    }

    async function waitForFunction(fn) {
      let isActive = true;
      setTimeout(() => {
        isActive = false;
      }, 5000);
      while (isActive) {
        const result = await fn();
        if (result) {
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Timed out');
    }

    {
      setUpEyes();
    }

    {
        const targetPage = page;
        await targetPage.setViewport({"width":1577,"height":944})

        // start the visual test
        await eyes.open(page, "Puppeteer-GoggleRecorder", "My first Puppeteer test!")
    }

    {
        const targetPage = page;
        const promises = [];
        promises.push(targetPage.waitForNavigation());
        await targetPage.goto('https://demo.applitools.com/');
        await Promise.all(promises);

        // capture a full-page screenshot
        await eyes.check('demo page', Target.window().fully())
    }
    {
        const targetPage = page;
        const promises = [];
        promises.push(targetPage.waitForNavigation());
        const element = await waitForSelectors([["aria/Sign in"],["#log-in"]], targetPage);
        await element.click({ offset: { x: 42.5, y: 7.828125} });
        await Promise.all(promises);

        // capture viewport screenshot
        await eyes.check('demo page', Target.window().fully(false))
    }

    // finally close Eyes
    await eyes.closeAsync();
    
    await browser.close();

    // abort the test if Eyes were not properly closed
    await eyes.abortAsync();

    // Manage tests across multiple Eyes instances
    const testResultsSummary = await runner.getAllTestResults()
    for (const testResultContainer of testResultsSummary) {
      const testResults = testResultContainer.getTestResults();
      console.log(testResults);
    }
})();
