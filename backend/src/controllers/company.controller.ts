import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as companyService from "../services/company.service.js";

export const listCompanies = asyncHandler<AuthedRequest>(async (req, res) => {
  // Already coerced by the validator's .toInt(), hence the double assertion.
  const { search, page, limit } = req.query as unknown as {
    search?: string;
    page?: number;
    limit?: number;
  };

  const result = await companyService.listCompanies({ search, page, limit });

  res.status(200).json(new ApiResponse(200, result));
});

export const getCompany = asyncHandler<AuthedRequest>(async (req, res) => {
  const company = await companyService.getCompanyView(req.params.id as string);
  res.status(200).json(new ApiResponse(200, company));
});

/**
 * Drop rows the validator allows through but that carry nothing.
 *
 * The validator rejects a row with all three fields blank; this additionally
 * normalises whitespace so " " never reaches the database as a contact name.
 */
const cleanContacts = (
  contacts: Array<Record<string, unknown>> | undefined
): companyService.CompanyInput["contacts"] =>
  (contacts ?? []).map((c) => ({
    name: String(c?.name ?? "").trim(),
    phone: String(c?.phone ?? "").trim(),
    email: String(c?.email ?? "").trim(),
  }));

export const createCompany = asyncHandler<AuthedRequest>(async (req, res) => {
  // Only the fields the validator vetted — never the raw body.
  const { name, address, location, gst, contacts } = req.body as {
    name: string;
    address?: string;
    location?: string;
    gst?: string;
    contacts?: Array<Record<string, unknown>>;
  };

  const company = await companyService.createCompany(
    { name, address, location, gst, contacts: cleanContacts(contacts) },
    req.user!._id as never
  );

  res.status(201).json(new ApiResponse(201, company, "Company added"));
});

export const updateCompany = asyncHandler<AuthedRequest>(async (req, res) => {
  const { name, address, location, gst, contacts, isActive } = req.body as {
    name?: string;
    address?: string;
    location?: string;
    gst?: string;
    contacts?: Array<Record<string, unknown>>;
    isActive?: boolean;
  };

  // Only forward what was sent — undefined means "leave alone".
  const patch: companyService.CompanyPatch = {};
  if (name !== undefined) patch.name = name;
  if (address !== undefined) patch.address = address;
  if (location !== undefined) patch.location = location;
  if (gst !== undefined) patch.gst = gst;
  if (contacts !== undefined) patch.contacts = cleanContacts(contacts);
  if (isActive !== undefined) patch.isActive = isActive;

  const company = await companyService.updateCompany(req.params.id as string, patch);

  res.status(200).json(new ApiResponse(200, company, "Company saved"));
});

export const deleteCompany = asyncHandler<AuthedRequest>(async (req, res) => {
  await companyService.deleteCompany(req.params.id as string);
  res.status(200).json(new ApiResponse(200, null, "Company deleted"));
});
