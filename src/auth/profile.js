import { getCurrentUser } from '../api/authApi'
import { getMyProfile } from '../api/customerApi'

/**
 * Loads the signed-in person's details.
 * Customers: GET /api/customers/me (name, mobile, email, status, createdAt).
 * Staff:     GET /api/auth/me      (id, email, role).
 */
export async function fetchProfile(userType, token) {
  if (userType === 'CUSTOMER') {
    const { data } = await getMyProfile(token)
    return {
      customerId: data?.customerId ?? null,
      name: data?.name ?? null,
      email: data?.email || null,
      mobile: data?.mobile || null,
      status: data?.status ?? null,
      createdAt: data?.createdAt ?? null,
    }
  }
  const { data } = await getCurrentUser(token)
  return {
    id: data?.id ?? null,
    email: data?.email || null,
    role: data?.role ?? null,
  }
}
