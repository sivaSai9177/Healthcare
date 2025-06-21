// Test entry point to debug Metro bundler issue

import { AppRegistry , Text, View } from 'react-native';

function TestApp() {

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Test App</Text>
    </View>
  );
}

AppRegistry.registerComponent('main', () => TestApp);
