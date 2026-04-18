// src/services/profileService.ts
import prisma from "../lib/prisma.js";
import { fetchAllApis } from "./externalApis.js";
import { uuidv7 } from "uuidv7";

// CREATE — or return existing if name already exists
export const createProfile = async (name: string) => {
  // Check if profile with this name already exists
  // This is the idempotency check
  const existing = await prisma.profile.findUnique({
    where: { name: name.toLowerCase() },
  });

  // If it exists — return it with a flag so the route knows
  if (existing) {
    return { profile: existing, alreadyExists: true };
  }

  // Doesn't exist — call the three external APIs
  const apiData = await fetchAllApis(name);

  // Save to database
  const profile = await prisma.profile.create({
    data: {
      id: uuidv7(), // UUID v7 — time-ordered unique ID
      name: name.toLowerCase(), // always store lowercase for consistency
      gender: apiData.gender,
      gender_probability: apiData.gender_probability,
      sample_size: apiData.sample_size,
      age: apiData.age,
      age_group: apiData.age_group,
      country_id: apiData.country_id,
      country_probability: apiData.country_probability,
      // created_at is handled automatically by Prisma @default(now())
    },
  });

  return { profile, alreadyExists: false };
};

// GET SINGLE — find by ID
export const getProfileById = async (id: string) => {
  const profile = await prisma.profile.findUnique({
    where: { id },
  });
  return profile; // returns null if not found
};

// GET ALL — with optional filters
export const getAllProfiles = async (filters: {
  gender?: string;
  country_id?: string;
  age_group?: string;
}) => {
  // Build the where clause dynamically
  // Only add a filter if it was actually provided
  // toLowerCase() makes filters case-insensitive as the task requires
  const where: any = {};

  if (filters.gender) {
    where.gender = filters.gender.toLowerCase();
  }
  if (filters.country_id) {
    where.country_id = filters.country_id.toUpperCase();
  }
  if (filters.age_group) {
    where.age_group = filters.age_group.toLowerCase();
  }

  const profiles = await prisma.profile.findMany({
    where,
    // Only return the fields the task specifies for the list view
    select: {
      id: true,
      name: true,
      gender: true,
      age: true,
      age_group: true,
      country_id: true,
    },
  });

  return profiles;
};

// DELETE — by ID
export const deleteProfile = async (id: string) => {
  // Check it exists first
  const existing = await prisma.profile.findUnique({
    where: { id },
  });

  if (!existing) return null;

  await prisma.profile.delete({
    where: { id },
  });

  return true;
};
