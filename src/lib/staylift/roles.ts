/**
 * Staff roles and what each may do. Shared by the server (enforcement) and the
 * hotel shell (which nav items to show). The server is the authority: hiding a
 * link is a convenience, never the check.
 */

export type Role = "owner" | "manager" | "front_desk";

export const ROLES: Role[] = ["owner", "manager", "front_desk"];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front desk",
};

export const ROLE_HINT: Record<Role, string> = {
  owner: "Everything, including team, contract, settings and the audit log.",
  manager: "Offers, recipes, guests, ROI and data requests. Can reveal guest contacts.",
  front_desk: "Reservations, orders, desk sales and the check-in tablet. Sees contacts masked.",
};

const RANK: Record<Role, number> = { front_desk: 1, manager: 2, owner: 3 };

export function isRole(value: string): value is Role {
  return value === "owner" || value === "manager" || value === "front_desk";
}

export function atLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

/** Minimum role per capability. */
export const CAN = {
  viewOverview: "front_desk",
  workReservations: "front_desk",
  workOrders: "front_desk",
  runDeskTablet: "front_desk",
  viewGuests: "front_desk",
  editOffers: "manager",
  editRecipes: "manager",
  viewAnalytics: "manager",
  viewRoi: "manager",
  revealContacts: "manager",
  handleDataRequests: "manager",
  mergeProfiles: "manager",
  editContract: "owner",
  manageTeam: "owner",
  editSettings: "owner",
  viewAudit: "owner",
} as const satisfies Record<string, Role>;

export type Capability = keyof typeof CAN;

export function can(role: Role, capability: Capability): boolean {
  return atLeast(role, CAN[capability]);
}
