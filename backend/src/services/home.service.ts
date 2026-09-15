import type { Types } from "mongoose";
import { HomeContent, type IHomeContent } from "../models/homeContent.model.js";
import { HOME_DEFAULTS } from "../config/homeDefaults.js";
import { uploadImage, destroyImage } from "../config/cloudinary.js";

const SINGLETON = { key: "home" };

/**
 * The hero content, creating the singleton on first read.
 *
 * Upsert-on-read for the same reason as the theme and process singletons: a
 * fresh database serves complete content rather than 404ing, so the public site
 * works before anyone has opened the settings tab and no seed step is required.
 */
export const getSection = async (): Promise<IHomeContent> =>
  HomeContent.findOneAndUpdate(
    SINGLETON,
    { $setOnInsert: { ...HOME_DEFAULTS } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec() as Promise<IHomeContent>;

/** The text fields an admin may change in one call. Every field is optional. */
export interface SectionPatch {
  hero?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    imageAlt?: string;
  };
}

/**
 * Save the text fields.
 *
 * Assigned leaf by leaf rather than with Object.assign, which is what the
 * process section does. The difference is that this document is NESTED: an
 * `Object.assign(doc, { hero: { title } })` would replace the whole `hero`
 * subtree, silently destroying the uploaded image. Only the leaves that were
 * actually sent may be touched.
 */
export const updateSection = async (
  patch: SectionPatch,
  updatedBy: Types.ObjectId
): Promise<IHomeContent> => {
  const doc = await getSection();

  if (patch.hero?.eyebrow !== undefined) doc.hero.eyebrow = patch.hero.eyebrow;
  if (patch.hero?.title !== undefined) doc.hero.title = patch.hero.title;
  if (patch.hero?.description !== undefined) doc.hero.description = patch.hero.description;
  if (patch.hero?.ctaLabel !== undefined) doc.hero.ctaLabel = patch.hero.ctaLabel;
  if (patch.hero?.imageAlt !== undefined) doc.hero.imageAlt = patch.hero.imageAlt;

  doc.updatedBy = updatedBy;
  await doc.save();

  return doc;
};

/* ------------------------------------------------------------------ image */

export const setHeroImage = async (
  buffer: Buffer,
  filename: string
): Promise<IHomeContent> => {
  const doc = await getSection();
  const previous = doc.hero.image?.publicId;

  const uploaded = await uploadImage(buffer, filename);
  doc.hero.image = uploaded;
  await doc.save();

  // Only after the new one is safely stored, and only if it really changed.
  if (previous && previous !== uploaded.publicId) await destroyImage(previous);

  return doc;
};

export const clearHeroImage = async (): Promise<IHomeContent> => {
  const doc = await getSection();
  const publicId = doc.hero.image?.publicId;

  doc.hero.image = {};
  await doc.save();

  if (publicId) await destroyImage(publicId);
  return doc;
};
