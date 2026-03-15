import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectCategoryService {
  // Holt alle definierten Kategorien
  public async getCategories() {
    return prisma.ProjectCategory.findMany({
      orderBy: { name: 'asc' }
    });
  }

  // Erstellt oder aktualisiert eine Kategorie
  public async saveCategory(data: { id?: number; name: string; color: string }) {
    if (data.id) {
      return prisma.ProjectCategory.update({
        where: { id: data.id },
        data: { name: data.name, color: data.color }
      });
    } else {
      return prisma.ProjectCategory.create({
        data: { name: data.name, color: data.color }
      });
    }
  }

  // Löscht eine Kategorie
  public async deleteCategory(categoryId: number) {
    return prisma.ProjectCategory.delete({
      where: { id: categoryId }
    });
  }
}
