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
  const company = await companyService.getCompany(req.params.id as string);
  res.status(200).json(new ApiResponse(200, company));
});

export const createCompany = asyncHandler<AuthedRequest>(async (req, res) => {
  // Only the fields the validator vetted — never the raw body.
  const { name, address, location, gst, contact } = req.body as {
    name: string;
    address?: string;
    location?: string;
    gst?: string;
    contact?: string;
  };

  const company = await companyService.createCompany(
    { name, address, location, gst, contact },
    req.user!._id as never
  );

  res.status(201).json(new ApiResponse(201, company, "Company added"));
});

export const updateCompany = asyncHandler<AuthedRequest>(async (req, res) => {
  const { name, address, location, gst, contact, isActive } = req.body as {
    name?: string;
    address?: string;
    location?: string;
    gst?: string;
    contact?: string;
    isActive?: boolean;
  };

  // Only forward what was sent — undefined means "leave alone".
  const patch: companyService.CompanyPatch = {};
  if (name !== undefined) patch.name = name;
  if (address !== undefined) patch.address = address;
  if (location !== undefined) patch.location = location;
  if (gst !== undefined) patch.gst = gst;
  if (contact !== undefined) patch.contact = contact;
  if (isActive !== undefined) patch.isActive = isActive;

  const company = await companyService.updateCompany(req.params.id as string, patch);

  res.status(200).json(new ApiResponse(200, company, "Company saved"));
});

export const deleteCompany = asyncHandler<AuthedRequest>(async (req, res) => {
  await companyService.deleteCompany(req.params.id as string);
  res.status(200).json(new ApiResponse(200, null, "Company deleted"));
});
