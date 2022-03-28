Puppeteer must be installed to run this script as a Puppeteer test.

Our main entry point is the (async () => {})(); function call that covers the whole test code.

Puppeteer will launch the test in headless mode by default, in order for us to see how the browser runs the automated test we have to turn it off by adding the headless flag:

const browser = await puppeteer.launch({ headless: false });



The test itself is then represented by the following blocks within the main function:

```

// set the viewport of the page
    {
        const targetPage = page;
        await targetPage.setViewport({"width":1577,"height":944})
    }

// navigate to demo.applitools.com
    {
        const targetPage = page;
        const promises = [];
        promises.push(targetPage.waitForNavigation());
        await targetPage.goto('https://demo.applitools.com/');
        await Promise.all(promises);
    }

// click the Sign in button, which will lead to a new page
    {
        const targetPage = page;
        const promises = [];
        promises.push(targetPage.waitForNavigation());
        const element = await waitForSelectors([["aria/Sign in"],["#log-in"]], targetPage);
        await element.click({ offset: { x: 42.5, y: 7.828125} });
        await Promise.all(promises);
    }
```

Now that we understand the code it’s time to kick it up a notch by adding Applitools Eyes to the mix.
Applitools is a VisualAI Testing Automation tool that allows quickly and efficiently run visual tests. With Applitools Eyes we can speed up our testing using Visual Assertions.



Install Applitools Puppeteer SDK.
using npm: npm i -D @applitools/eyes-puppeteer

add the eyes-puppeteer dependency:
const {Eyes, Target, VisualGridRunner, BrowserType, DeviceName} = require('@applitools/eyes-puppeteer')
Eyes - the Eyes instance
Target - Eyes Fluent API
VisualGridRunner - using the UtraFastGrid with Eyes.
BrowserType - UFG browsers configuration
DeviceName - UFG devices configuration

inside the main function, initialize Eyes and set the desired configuration

add a call to Eyes in the desired test steps, we must first open Eyes

Perform visual validation with Eyes.

finally, after closing the browser we can close Eyes and gather the test results

to run the test, run the command:
node <path_to_test.js>




Step 2 - Dependencies: 


const { Eyes, Target, VisualGridRunner, BrowserType, DeviceName } = require('@applitools/eyes-puppeteer');





Step 3 - Instance and Configuration:



We define an eyes instance alongside a Visual Grid runner, which is used with Applitools Ultra Fast Grid. We can use the runner at the end of the test to gather all the test results. We defined them at the start of the main test function so we may use them later on.



We then create a function, setupEyes, that will set our configuration to Eyes before starting the test. This function will be called later on as a first step.   



  const runner = new VisualGridRunner({ testConcurrency: 5 });

  const eyes = new Eyes(runner);



    async function setupEyes() {

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



.

.

.



As a first step of the test, we are calling our setupEyes function, to set all the desired configuration parameters. 



    {

      setupEyes();

    }


Step 4 - Opening Eyes

In here we open Eyes right after setting the viewport to the page.



    {

        const targetPage = page;

        await targetPage.setViewport({"width":1577,"height":944})



        // start the visual test

        await eyes.open(page, "Puppeteer-GoggleRecorder", "My first Puppeteer test!")

    }



Step 5 - Visual Validation

By calling eyes.check(), we are telling Eyes to perform a visual validation. Using the Fluent API we can specify which target we would like to capture.



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





Step 5 - Close Eyes and Gather Results

We must close Eyes at the end of our test, not closing Eyes will result in an Applitools test running in endless loop. This is due the fact that when Eyes are open, you may perform any amount of visual validations you desire.



By using the eyes.abortAsync functionality, we essentially tell Eyes to abort the test in case that Eyes were not properly closed for some reason.



Finally, after Eyes and the browser are closed, we may gather the test results using the runner.



await browser.close();

    

    // finally close Eyes

    await eyes.closeAsync();



    // abort the test if Eyes were not properly closed

    await eyes.abortAsync();



    // Manage tests across multiple Eyes instances

    const testResultsSummary = await runner.getAllTestResults()

    for (const testResultContainer of testResultsSummary) {

      const testResults = testResultContainer.getTestResults();

      console.log(testResults);

    }

})();