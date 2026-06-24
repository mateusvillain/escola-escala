import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  organizationMemberFindUnique: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organizationMember: { findUnique: mocks.organizationMemberFindUnique },
  },
}))

const { requireOrgOwner } = await import('../organization')

beforeEach(() => {
  mocks.organizationMemberFindUnique.mockReset()
})

describe('requireOrgOwner', () => {
  it('retorna a organização quando o usuário é owner', async () => {
    const organization = { id: 'org-1', name: 'Acme', slug: 'acme', seatLimit: 5 }
    mocks.organizationMemberFindUnique.mockResolvedValue({ role: 'owner', organization })

    const result = await requireOrgOwner('user-1')
    expect(result).toEqual({ organization })
  })

  // Cobre a acceptanceCriteria da TASK-166: member tentando convidar/remover (e, quando
  // existirem, checkout/portal — TASK-162/164, Grupos 6/7) deve receber 403 em todos os
  // casos. Como esses endpoints chamam requireOrgOwner antes de qualquer ação, testar o
  // helper aqui cobre os endpoints existentes e os futuros igualmente.
  it('retorna 403 quando o usuário é member (não owner)', async () => {
    mocks.organizationMemberFindUnique.mockResolvedValue({
      role: 'member',
      organization: { id: 'org-1', name: 'Acme', slug: 'acme', seatLimit: 5 },
    })

    const result = await requireOrgOwner('user-2')
    expect(result).not.toHaveProperty('organization')
    const response = result as Response
    expect(response.status).toBe(403)
  })

  it('retorna 403 quando o usuário não pertence a nenhuma organização', async () => {
    mocks.organizationMemberFindUnique.mockResolvedValue(null)

    const result = await requireOrgOwner('user-3')
    const response = result as Response
    expect(response.status).toBe(403)
  })
})
