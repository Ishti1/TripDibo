"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Trip } from "@/store/useTripStore";

// Get user session securely on the server
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getUserTrips() {
  const userId = await getUserId();
  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return trips;
}

export async function createTripOnServer(tripData: Omit<Trip, "id"> & { id?: string }) {
  const userId = await getUserId();
  const trip = await prisma.trip.create({
    data: {
      id: tripData.id,
      userId,
      title: tripData.title,
      destination: tripData.destination,
      dates: tripData.dates,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      members: tripData.members,
      image: tripData.image,
      description: tripData.description,
      currency: tripData.currency,
      budget: tripData.budget,
      favorite: tripData.favorite || false,
    },
  });
  return trip;
}

export async function updateTripOnServer(id: string, updates: Partial<Trip>) {
  const userId = await getUserId();
  
  // Verify ownership
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw new Error("Unauthorized");

  const trip = await prisma.trip.update({
    where: { id },
    data: {
      title: updates.title,
      destination: updates.destination,
      dates: updates.dates,
      startDate: updates.startDate,
      endDate: updates.endDate,
      members: updates.members,
      image: updates.image,
      description: updates.description,
      currency: updates.currency,
      budget: updates.budget,
      favorite: updates.favorite,
    },
  });
  return trip;
}

export async function deleteTripOnServer(id: string) {
  const userId = await getUserId();
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw new Error("Unauthorized");
  
  await prisma.trip.delete({ where: { id } });
  return true;
}

export async function getSharedTrip(id: string) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) throw new Error("Trip not found");
  return trip;
}

export async function syncTripSharedStateOnServer(id: string, sharedState: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized"); // Must be logged in to edit
  
  const trip = await prisma.trip.update({
    where: { id },
    data: { sharedState },
  });
  return trip;
}
