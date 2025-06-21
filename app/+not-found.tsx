import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { NotFoundError } from '@/components/blocks/errors';

export default function NotFoundScreen() {
  return (
    <Fragment>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <NotFoundError />
    </Fragment>
  );
}
