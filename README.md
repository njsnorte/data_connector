# Tabird

![tabird](tabird.png)

A web data connector for Tableau to help you connect with GitHub data. 

Quickly pull in GitHub information from different repositories such as:
- Issues
- Pull Requests
- Traffic Stats

An online version of the web data connector can be found here:
- [https://github-web-data-connector.herokuapp.com/](https://github-web-data-connector.herokuapp.com/)

## Quick Tutorial
1. Open Tableau, navigate to web data connector and enter the following url:
https://github-web-data-connector.herokuapp.com/github/

2. Authenticate with your GitHub account.
![step2](https://cloud.githubusercontent.com/assets/8611594/24785643/7b6b56ea-1b10-11e7-9919-45427a66e510.png)

3. Choose a data type and insert a valid url such as provided in the examples.
![step2](https://cloud.githubusercontent.com/assets/8611594/24622827/3d24face-185b-11e7-825e-e432e2719c3f.png)

4. Click get Data and choose your table and/or select the default connection to obtain all data.
![step3](https://cloud.githubusercontent.com/assets/8611594/24622849/529f2032-185b-11e7-9355-e0f301fd7826.png)


## Local development

### Dependencies
- NPM dependencies
  - `npm install`

### Build/Install
- Run `gulp` from the command line.
- Open Tableau and select Web Data Connector
- Browse to http://localhost:9001
- Fill in the required information and click 'Get Data'

### Deployment
- Set up a new OAuth application in [GitHub](https://github.com/settings/developers)
- Copy the necessary variables to a local .env file.  
