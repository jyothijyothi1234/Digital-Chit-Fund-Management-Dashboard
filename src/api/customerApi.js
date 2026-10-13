import { http, unwrap, withToken } from './client'

// /api/customers endpoints (CustomerController). Both need a signed-in CUSTOMER.

/** GET /api/customers/me – data { customerId, name, email, mobile, status, createdAt }. */
export async function getMyProfile(token) {
  return unwrap(await http.get('/api/customers/me', token ? withToken(token) : undefined))
}

/** PUT /api/customers/me – only the name can be changed for now. */
export async function updateMyProfile({ name }) {
  return unwrap(await http.put('/api/customers/me', { name: name.trim() }))
}
