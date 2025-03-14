// Script to seed initial team members
import { db } from '../server/db';
import { teamMembers } from '../shared/schema';

async function seedTeamMembers() {
  try {
    console.log("Starting to seed team members...");

    // Add team members
    await db.insert(teamMembers).values([
      {
        name: 'Aamir (AJ) Qadri',
        qualification: 'CDCM, CQM-C',
        designation: 'President',
        gender: 'male',
        photo: '/uploads/images/team/placeholder-person.jpg',
        active: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Nadia Khalid',
        qualification: 'MBA',
        designation: 'Vice President',
        gender: 'female',
        photo: '/uploads/images/team/placeholder-person.jpg',
        active: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Ahmad Mujtaba (AK)',
        qualification: 'BBA Business & Finance',
        designation: 'Admin & Project Manager',
        gender: 'male',
        photo: '/uploads/images/team/placeholder-person.jpg',
        active: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'M. Shehryar',
        qualification: 'B.Arch',
        designation: 'Architect & Interior designer',
        gender: 'male',
        photo: '/uploads/images/team/placeholder-person.jpg',
        active: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log("Team members seeded successfully!");
  } catch (error) {
    console.error("Error seeding team members:", error);
  } finally {
    process.exit(0);
  }
}

seedTeamMembers();