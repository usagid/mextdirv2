import { PrismaClient } from "@prisma/client";
import { demoSchools } from "../server/utils/demo-schools";

const prisma = new PrismaClient();

async function main() {
	await prisma.image.deleteMany();
	await prisma.school.deleteMany();

	for (const school of demoSchools) {
		const { id, images, createdAt, updatedAt, ...fields } = school;
		await prisma.school.create({
			data: {
				id,
				...fields,
				createdAt: new Date(createdAt),
				updatedAt: new Date(updatedAt),
				images: {
					create: images.map((image) => ({
						url: image.url,
						altText: image.altText,
						sortOrder: image.sortOrder,
						createdAt: new Date(image.createdAt),
					})),
				},
			},
		});
	}

	console.log(`Seeded ${demoSchools.length} schools.`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
