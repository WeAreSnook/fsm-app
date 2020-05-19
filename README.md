# Free School Meal App

App for indicating eligibility for free school meal entitlement for pupils in North Lanarkshire Schools.

The app is a simple wrapper around the `fsm-processor` executable. It takes input spreadsheets and configuration options and passes them to `fsm-processor` for parsing in order to create the relevant output files.

*Do not commit any personal data into this repository*

## Building the App
To build a macOS app:

* Run `yarn`
* Run `yarn build-mac`
* Build written to `/release-builds`

To build a Windows exe:

* If on macOS install wine `brew install wine`
* Run `yarn`
* Run `yarn build-windows`
* Build exe written to `/release-builds`

To build a Windows installer:

* If on macOS install wine `brew install wine`
* Run `yarn`
* Run `yarn create-installer`
* Will automatically create a Windows build in `/release-builds`
* Installer exe written to `/release-builds/installers`

