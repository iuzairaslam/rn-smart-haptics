import { AppRegistry } from 'react-native';
import App from './src/App';
import { DebugErrorBoundary } from './src/DebugErrorBoundary';
import { name as appName } from './app.json';

if (__DEV__) {
  console.log('[RnSmartHaptics example] JS bundle executing');
}

function Root() {
  return (
    <DebugErrorBoundary>
      <App />
    </DebugErrorBoundary>
  );
}

AppRegistry.registerComponent(appName, () => Root);
