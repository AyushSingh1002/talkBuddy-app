// routes/characterRoutes.js
import express from "express";
import {
  getAllCharacters,
  getCharacterById,
  getCharacterByName,
} from "../controllers/character.controller.js";

const router = express.Router();

router.get("/", getAllCharacters);
router.get("/:id", getCharacterById);
router.get("/name/:name", getCharacterByName);

export default router;
