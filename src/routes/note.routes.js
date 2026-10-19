import { Router } from "express";
import {
  createProjectNote,
  deleteProjectNote,
  getProjectNote,
  getProjectNotes,
  updateProjectNote,
} from "../controllers/note.controllers.js";
import {
  verifyJWT,
  validateProjectPermission,
} from "../middlewares/auth.middlewares.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/:projectId")
  .get(validateProjectPermission(AvailableUserRole), getProjectNotes)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    createProjectNote,
  );

router
  .route("/:projectId/n/:noteId")
  .get(validateProjectPermission(AvailableUserRole), getProjectNote)
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    updateProjectNote,
  )
  .delete(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteProjectNote,
  );

export default router;
