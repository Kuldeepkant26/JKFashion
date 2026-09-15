import type { Types } from "mongoose";
import { ProcessSection, type IProcessSection } from "../models/processSection.model.js";
import { PROCESS_DEFAULTS } from "../config/processDefaults.js";
import {
  uploadImage,
  uploadVideo,
  destroyImage,
  destroyVideo,
} from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

const SINGLETON = { key: "process" };

/**
 * The section content, creating the singleton on first read.
 *
 * Upsert-on-read for the same reason as the theme settings: a fresh database
 * serves a complete section rather than 404ing, so the public site works
 * before anyone has opened the settings tab and no seed step is required.
 */
export const getSection = async (): Promise<IProcessSection> =>
  ProcessSection.findOneAndUpdate(
    SINGLETON,
    { $setOnInsert: { ...PROCESS_DEFAULTS } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec() as Promise<IProcessSection>;

/**
 * Public view: only the rows the admin has left visible, in display order.
 *
 * Filtering here rather than in the component means a hidden row never reaches
 * the browser at all.
 */
export const getPublicSection = async (): Promise<Record<string, unknown>> => {
  const doc = (await getSection()).toObject() as Record<string, unknown> & {
    steps: Array<{ isActive: boolean; order: number }>;
    facilityPhotos: Array<{ isActive: boolean; order: number }>;
  };

  return {
    ...doc,
    steps: doc.steps.filter((s) => s.isActive).sort((a, b) => a.order - b.order),
    facilityPhotos: doc.facilityPhotos
      .filter((p) => p.isActive)
      .sort((a, b) => a.order - b.order),
  };
};

/** The text fields an admin may change in one call. Every field is optional. */
export interface SectionPatch {
  label?: string;
  title?: string;
  intro?: string;
  stepsHeading?: string;
  videoEnabled?: boolean;
  videoHeading?: string;
  videoBody?: string;
  facilityEnabled?: boolean;
  facilityHeading?: string;
  facilityBody?: string;
}

export const updateSection = async (
  patch: SectionPatch,
  updatedBy: Types.ObjectId
): Promise<IProcessSection> => {
  const doc = await getSection();

  Object.assign(doc, patch);
  doc.updatedBy = updatedBy;
  await doc.save();

  return doc;
};

/* ------------------------------------------------------------------ steps */

export interface StepInput {
  title: string;
  summary?: string;
  description?: string;
  icon?: string;
}

export const addStep = async (input: StepInput): Promise<IProcessSection> => {
  const doc = await getSection();

  /*
   * New rows go to the end. `order` is derived from the current maximum rather
   * than the array length, so a gap left by a deleted row cannot put two steps
   * on the same position.
   */
  const maxOrder = doc.steps.reduce((max, s) => Math.max(max, s.order), -1);

  doc.steps.push({
    title: input.title,
    summary: input.summary ?? "",
    description: input.description ?? "",
    // Omitted rather than defaulted here, so the schema's own default is the
    // single source of truth for what a new stage wears.
    ...(input.icon ? { icon: input.icon } : {}),
    order: maxOrder + 1,
    isActive: true,
  } as never);

  await doc.save();
  return doc;
};

export interface StepPatch {
  title?: string;
  summary?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
}

export const updateStep = async (
  stepId: string,
  patch: StepPatch
): Promise<IProcessSection> => {
  const doc = await getSection();
  const step = doc.steps.id(stepId);
  if (!step) throw new ApiError(404, "That step no longer exists");

  Object.assign(step, patch);
  await doc.save();
  return doc;
};

/** Stages carry no uploaded media, so removing one touches nothing external. */
export const deleteStep = async (stepId: string): Promise<IProcessSection> => {
  const doc = await getSection();
  const step = doc.steps.id(stepId);
  if (!step) throw new ApiError(404, "That step no longer exists");

  step.deleteOne();
  await doc.save();

  return doc;
};

/** Apply a new order in one pass — the whole list is sent, not a move. */
export const reorderSteps = async (ids: string[]): Promise<IProcessSection> => {
  const doc = await getSection();

  ids.forEach((id, index) => {
    const step = doc.steps.id(id);
    if (step) step.order = index;
  });

  await doc.save();
  return doc;
};

/* ------------------------------------------------------------------ video */

export const setVideo = async (
  buffer: Buffer,
  filename: string
): Promise<IProcessSection> => {
  const doc = await getSection();
  const previous = doc.video?.publicId;

  const uploaded = await uploadVideo(buffer, filename);
  doc.video = uploaded;
  await doc.save();

  if (previous && previous !== uploaded.publicId) await destroyVideo(previous);

  return doc;
};

export const clearVideo = async (): Promise<IProcessSection> => {
  const doc = await getSection();
  const publicId = doc.video?.publicId;

  doc.video = {};
  await doc.save();

  if (publicId) await destroyVideo(publicId);
  return doc;
};

/** The still shown before the video plays. An ordinary image, not a frame. */
export const setVideoPoster = async (
  buffer: Buffer,
  filename: string
): Promise<IProcessSection> => {
  const doc = await getSection();
  const previous = doc.videoPoster?.publicId;

  const uploaded = await uploadImage(buffer, filename);
  doc.videoPoster = uploaded;
  await doc.save();

  if (previous && previous !== uploaded.publicId) await destroyImage(previous);

  return doc;
};

/* --------------------------------------------------------------- facility */

export const addFacilityPhoto = async (
  buffer: Buffer,
  filename: string,
  caption: string
): Promise<IProcessSection> => {
  const doc = await getSection();
  const uploaded = await uploadImage(buffer, filename);

  const maxOrder = doc.facilityPhotos.reduce((max, p) => Math.max(max, p.order), -1);

  doc.facilityPhotos.push({
    caption,
    image: uploaded,
    order: maxOrder + 1,
    isActive: true,
  } as never);

  try {
    await doc.save();
  } catch (error) {
    // The file is already on Cloudinary but the row failed — remove it rather
    // than leaving an asset nothing points at.
    await destroyImage(uploaded.publicId);
    throw error;
  }

  return doc;
};

export interface FacilityPatch {
  caption?: string;
  isActive?: boolean;
}

export const updateFacilityPhoto = async (
  photoId: string,
  patch: FacilityPatch
): Promise<IProcessSection> => {
  const doc = await getSection();
  const photo = doc.facilityPhotos.id(photoId);
  if (!photo) throw new ApiError(404, "That photo no longer exists");

  Object.assign(photo, patch);
  await doc.save();
  return doc;
};

export const deleteFacilityPhoto = async (photoId: string): Promise<IProcessSection> => {
  const doc = await getSection();
  const photo = doc.facilityPhotos.id(photoId);
  if (!photo) throw new ApiError(404, "That photo no longer exists");

  const publicId = photo.image?.publicId;
  photo.deleteOne();
  await doc.save();

  if (publicId) await destroyImage(publicId);
  return doc;
};

export const reorderFacilityPhotos = async (ids: string[]): Promise<IProcessSection> => {
  const doc = await getSection();

  ids.forEach((id, index) => {
    const photo = doc.facilityPhotos.id(id);
    if (photo) photo.order = index;
  });

  await doc.save();
  return doc;
};
