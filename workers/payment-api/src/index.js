const SHIPPING_FEE = 99;
const TAX_RATE = 0.18;
let cachedGoogleToken;
let cachedGoogleTokenExpiresAt = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function encodeBase64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function encodeFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  throw new ApiError(500, 'Unsupported data type.');
}

function decodeValue(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return new Date(value.timestampValue);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {});
  return undefined;
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function documentName(env, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/${encodedPath}`;
}

function pemBytes(pem) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function googleAccessToken(env) {
  if (cachedGoogleToken && cachedGoogleTokenExpiresAt > Date.now() + 60_000) return cachedGoogleToken;

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch {
    throw new ApiError(500, 'Payment server Firebase credentials are not configured.');
  }
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new ApiError(500, 'Payment server Firebase credentials are invalid.');
  }

  const now = Math.floor(Date.now() / 1000);
  const unsignedToken = `${encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${encodeBase64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))}`;
  const signingKey = await crypto.subtle.importKey(
    'pkcs8', pemBytes(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signingKey, new TextEncoder().encode(unsignedToken));
  const assertion = `${unsignedToken}.${encodeBase64Url(signature)}`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    console.error('Firebase service token request failed', tokenResponse.status);
    throw new ApiError(500, 'Payment server could not connect to Firebase.');
  }
  cachedGoogleToken = tokenPayload.access_token;
  cachedGoogleTokenExpiresAt = Date.now() + Number(tokenPayload.expires_in ?? 3600) * 1000;
  return cachedGoogleToken;
}

async function firestoreRequest(env, path, init = {}) {
  const token = await googleAccessToken(env);
  const response = await fetch(`https://firestore.googleapis.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) return null;
    console.error('Firestore REST request failed', response.status, payload?.error?.status);
    throw new ApiError(500, 'Payment server could not access the order data.');
  }
  return payload;
}

async function getDocument(env, path) {
  const response = await firestoreRequest(env, documentName(env, path));
  if (!response) return null;
  return { name: response.name, updateTime: response.updateTime, data: decodeFields(response.fields) };
}

async function createDocument(env, collectionName, id, data) {
  const base = `projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/${collectionName}`;
  return firestoreRequest(env, `${base}?documentId=${encodeURIComponent(id)}`, {
    method: 'POST',
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
}

async function authenticate(request, env) {
  const authorization = request.headers.get('Authorization') ?? '';
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!idToken) throw new ApiError(401, 'Sign in before paying.');

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY ?? '')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const payload = await response.json().catch(() => ({}));
  const firebaseUser = payload.users?.[0];
  if (!response.ok || !firebaseUser?.localId || firebaseUser.disabled) {
    throw new ApiError(401, 'Your sign-in has expired. Sign in again before paying.');
  }
  return firebaseUser.localId;
}

async function razorpayRequest(env, path, method = 'GET', body) {
  const credentials = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Razorpay API request failed', response.status, payload?.error?.code);
    throw new ApiError(502, 'Payment service could not complete the request. Try again shortly.');
  }
  return payload;
}

async function createPaymentOrder(request, env) {
  const uid = await authenticate(request, env);
  const body = await request.json().catch(() => ({}));
  const { addressId, items, notes = '' } = body;
  if (typeof addressId !== 'string' || !addressId || !Array.isArray(items) || items.length < 1 || items.length > 20) {
    throw new ApiError(400, 'Choose a delivery address and add 1–20 products.');
  }
  if (typeof notes !== 'string' || notes.length > 500) throw new ApiError(400, 'Order notes must be 500 characters or fewer.');

  const quantities = new Map();
  for (const item of items) {
    if (!item || typeof item.productId !== 'string' || !/^[a-zA-Z0-9_-]{1,150}$/.test(item.productId)
        || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
      throw new ApiError(400, 'One or more cart items are invalid.');
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const userDoc = await getDocument(env, `users/${uid}`);
  if (!userDoc || userDoc.data.isActive === false) throw new ApiError(403, 'Your account is unavailable for checkout.');
  const user = userDoc.data;
  const address = (user.addresses ?? []).find((entry) => entry.id === addressId);
  if (!address) throw new ApiError(400, 'That delivery address is no longer available.');
  const isDealer = user.role === 'dealer' && user.dealerStatus === 'approved';

  const orderItems = await Promise.all([...quantities.entries()].map(async ([productId, quantity]) => {
    const productDoc = await getDocument(env, `products/${productId}`);
    const product = productDoc?.data;
    if (!product || product.isActive !== true) throw new ApiError(400, 'A product in your cart is no longer available.');
    if (Number.isFinite(product.stock) && product.stock < quantity) {
      throw new ApiError(400, `${product.name} does not have enough stock.`);
    }
    const dealerPriceDoc = isDealer ? await getDocument(env, `dealerPrices/${productId}`) : null;
    const unitPrice = Number(isDealer ? dealerPriceDoc?.data.price : product.retailPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new ApiError(400, `${product.name} has an invalid price.`);
    return {
      productId,
      productName: product.name,
      productImage: product.images?.[0] ?? '',
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
    };
  }));

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const totalAmount = subtotal + SHIPPING_FEE + tax;
  const amountPaise = Math.round(totalAmount * 100);
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) throw new ApiError(400, 'The checkout total is invalid.');

  const receipt = `cal_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const razorpayOrder = await razorpayRequest(env, 'orders', 'POST', {
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes: { firebaseUid: uid },
  });

  await createDocument(env, 'paymentIntents', razorpayOrder.id, {
    userId: uid,
    userEmail: user.email ?? '',
    userName: user.displayName ?? address.fullName ?? '',
    userPhone: user.phone ?? address.phone ?? '',
    razorpayOrderId: razorpayOrder.id,
    amountPaise,
    currency: 'INR',
    items: orderItems,
    shippingAddress: address,
    subtotal,
    shippingFee: SHIPPING_FEE,
    tax,
    totalAmount,
    isDealer,
    notes: notes.trim(),
    status: 'created',
    createdAt: new Date(),
  });

  return {
    keyId: env.RAZORPAY_KEY_ID,
    orderId: razorpayOrder.id,
    amount: amountPaise,
    currency: 'INR',
    totalAmount,
  };
}

async function verifyPayment(request, env) {
  const uid = await authenticate(request, env);
  const body = await request.json().catch(() => ({}));
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
  if (typeof razorpayOrderId !== 'string' || typeof razorpayPaymentId !== 'string'
      || typeof razorpaySignature !== 'string' || !/^[a-f\d]{64}$/i.test(razorpaySignature)) {
    throw new ApiError(400, 'Payment verification details are invalid.');
  }

  const intentPath = `paymentIntents/${razorpayOrderId}`;
  const intentDocument = await getDocument(env, intentPath);
  if (!intentDocument || intentDocument.data.userId !== uid) throw new ApiError(403, 'This payment does not belong to your account.');
  const intent = intentDocument.data;
  if (intent.status === 'paid' && intent.orderDocumentId) return { orderId: intent.orderDocumentId };

  const hmacKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.RAZORPAY_KEY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC', hmacKey, new TextEncoder().encode(`${intent.razorpayOrderId}|${razorpayPaymentId}`),
  );
  const expectedSignature = [...new Uint8Array(signatureBytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  let signatureDifference = expectedSignature.length ^ razorpaySignature.length;
  for (let index = 0; index < Math.min(expectedSignature.length, razorpaySignature.length); index += 1) {
    signatureDifference |= expectedSignature.charCodeAt(index) ^ razorpaySignature.toLowerCase().charCodeAt(index);
  }
  if (signatureDifference !== 0) throw new ApiError(403, 'The payment signature could not be verified.');

  let payment = await razorpayRequest(env, `payments/${encodeURIComponent(razorpayPaymentId)}`);
  if (payment.order_id !== intent.razorpayOrderId || payment.amount !== intent.amountPaise || payment.currency !== intent.currency) {
    throw new ApiError(400, 'The payment does not match this checkout. Contact support before retrying.');
  }
  if (payment.status === 'authorized') {
    payment = await razorpayRequest(env, `payments/${encodeURIComponent(razorpayPaymentId)}/capture`, 'POST', {
      amount: intent.amountPaise,
      currency: intent.currency,
    });
  }
  if (payment.status !== 'captured') throw new ApiError(409, 'Payment is not captured yet. Contact support before retrying.');

  const orderId = crypto.randomUUID().replace(/-/g, '');
  const orderNumber = `CAL-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  const now = new Date();
  const orderData = {
    orderNumber,
    userId: uid,
    userEmail: intent.userEmail,
    userName: intent.userName,
    userPhone: intent.userPhone,
    items: intent.items,
    shippingAddress: intent.shippingAddress,
    subtotal: intent.subtotal,
    shippingFee: intent.shippingFee,
    tax: intent.tax,
    totalAmount: intent.totalAmount,
    status: 'pending',
    payment: {
      provider: 'razorpay',
      orderId: intent.razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      status: 'paid',
      amount: intent.totalAmount,
      currency: intent.currency,
      method: payment.method ?? '',
      paidAt: now,
    },
    isDealer: intent.isDealer,
    notes: intent.notes,
    placedAt: now,
    updatedAt: now,
  };

  const basePath = `projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents`;
  const orderName = `${basePath}/orders/${orderId}`;
  const intentName = documentName(env, intentPath);
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents:commit`;
  const token = await googleAccessToken(env);
  const commit = await fetch(commitUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: [
      { update: { name: orderName, fields: encodeFields(orderData) }, currentDocument: { exists: false } },
      {
        update: { name: intentName, fields: encodeFields({ status: 'paid', paymentId: razorpayPaymentId, orderDocumentId: orderId, verifiedAt: now }) },
        updateMask: { fieldPaths: ['status', 'paymentId', 'orderDocumentId', 'verifiedAt'] },
        currentDocument: { updateTime: intentDocument.updateTime },
      },
    ] }),
  });
  if (!commit.ok) {
    const latestIntent = await getDocument(env, intentPath);
    if (latestIntent?.data.status === 'paid' && latestIntent.data.orderDocumentId) {
      return { orderId: latestIntent.data.orderDocumentId };
    }
    const errorBody = await commit.json().catch(() => ({}));
    console.error('Firestore payment commit failed', commit.status, errorBody?.error?.status);
    throw new ApiError(500, 'Payment was received but the order could not be finalized. Contact support; do not pay again.');
  }
  return { orderId };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

    try {
      const path = new URL(request.url).pathname.replace(/\/$/, '');
      if (path === '/create-razorpay-order') return json(await createPaymentOrder(request, env));
      if (path === '/verify-razorpay-payment') return json(await verifyPayment(request, env));
      return json({ error: 'Not found.' }, 404);
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error('Payment API error', error instanceof Error ? error.message : 'Unknown error');
      return json({ error: 'Payment service is temporarily unavailable.' }, 500);
    }
  },
};
