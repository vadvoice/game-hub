# Solitaire Game Integration Guide

## Overview
This guide provides instructions for integrating a React-based Solitaire game into your application. The game is based on an open-source project and can be integrated either by hosting it yourself or using the existing demo deployment.

## Source Repository
The game is available as an open-source project:
- Repository URL: https://github.com/ashish0910/React-Solitaire

## Local Development Setup
To run the game locally, follow these steps:
```bash
git clone https://github.com/ashish0910/React-Solitaire.git
cd React-Solitaire
npm install
npm start
```

## Integration Options

### Option 1: Using Demo Deployment
You can integrate the existing demo deployment available at:
- Demo URL: https://react-solitaire-57967.web.app/

### Option 2: Self-Hosted Deployment
You may fork the repository and deploy your own instance for complete control over the game environment.

## Implementation
To integrate the game into your application, use an iframe component as shown below:

```jsx
<iframe 
  src="https://react-solitaire-57967.web.app/"
  title="Solitaire Game"
  style={{
    width: '100%',
    height: '100vh',
    border: 'none',
  }}
/>
```

## Notes
- Ensure proper viewport sizing when implementing the iframe
- Consider adding loading states and error handling
- Test cross-browser compatibility