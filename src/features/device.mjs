import { timingSafeEqual } from 'node:crypto';

export function deviceInput(env) {
  const token = env.EXTENSION_DEVICE_TOKEN;
  if (!token || token.length < 32)
    throw new Error(
      'Device ingress requires a separate ID-specific DEVICE_TOKEN of at least 32 characters.'
    );
  const expected = Buffer.from(`Bearer ${token}`);
  return {
    authenticate(request) {
      // xangi replaces Authorization with the service bearer and forwards the
      // original device bearer in this header. Never accept the service token as a device token.
      const actual = Buffer.from(String(request.headers['x-xangi-device-authorization'] || ''));
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    },
    receive(body) {
      if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000)
        throw new Error('Device text must contain 1-4000 characters.');
      return { received: true, text: body.text };
    },
  };
}
