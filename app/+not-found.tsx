import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/universal/typography/Text';
import { Fragment } from 'react';

export default function NotFoundScreen() {
  return (
    <Fragment>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text size="2xl" weight="bold">This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text className="text-primary underline">Go to home screen!</Text>
        </Link>
      </View>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
