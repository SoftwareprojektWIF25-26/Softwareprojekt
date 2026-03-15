import { Router, Request, Response, NextFunction } from 'express';
import { ProjectCategoryService } from '../services/project_categorie/project_categorie.ts';

const router = Router();
const categoryService = new ProjectCategoryService();

// GET /api/categories -> Alle Kategorien laden
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await categoryService.getCategories();
        res.json(categories);
    } catch (error) {
        next(error);
    }
});

// POST /api/categories -> Kategorie speichern (Neu oder Update)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await categoryService.saveCategory(req.body);
        res.json(category);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/categories/:id -> Kategorie löschen
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id, 10);
        await categoryService.deleteCategory(id);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
