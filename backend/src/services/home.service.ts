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
export const getSection = async (): Promise<IHomeContent> => {
  /*
   * Backfill the contact group onto a row that predates it.
   *
   * `$setOnInsert` below only fires when the document is created, so the
   * already-deployed singleton would never receive these defaults — and the
   * public site, which hides a detail it has no value for, would show no phone
   * number at all until someone opened the settings tab.
   *
   * `$exists: false` is what makes this safe to run on every read: it matches
   * only the untouched pre-upgrade row, so an owner who deliberately clears a
   * detail is never overwritten. It has to be checked against the raw document
   * because a hydrated one always reports the subtree present — Mongoose fills
   * nested defaults on read, turning a missing group into empty strings.
   */
  await HomeContent.updateOne(
    { ...SINGLETON, contact: { $exists: false } },
    { $set: { contact: { ...HOME_DEFAULTS.contact } } }
  ).exec();

  return HomeContent.findOneAndUpdate(
    SINGLETON,
    { $setOnInsert: { ...HOME_DEFAULTS } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec() as Promise<IHomeContent>;
};

/** The text fields an admin may change in one call. Every field is optional. */
export interface SectionPatch {
  hero?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    imageAlt?: string;
  };
  contact?: {
    phone?: string;
    address?: string;
    email?: string;
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

  /*
   * Leaf by leaf for the same reason as the hero above, and additionally
   * because "" is a legitimate value here: an empty detail is how the owner
   * hides a line from the site, so it must be written, not skipped.
   *
   * The `?? {}` guards a document saved before this group existed — Mongoose
   * fills nested defaults on read for new documents, but an older row loaded
   * from the database can arrive without the subtree.
   */
  if (patch.contact) {
    doc.contact = doc.contact ?? ({} as typeof doc.contact);
    if (patch.contact.phone !== undefined) doc.contact.phone = patch.contact.phone;
    if (patch.contact.address !== undefined) doc.contact.address = patch.contact.address;
    if (patch.contact.email !== undefined) doc.contact.email = patch.contact.email;
  }

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
