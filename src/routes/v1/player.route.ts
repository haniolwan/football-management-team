import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import { playerValidation } from "../../validations";
import { playerController } from "../../controllers";
const router = express.Router();

router
  .route("/")
  .get(
    auth("getPlayers"),
    validate(playerValidation.getPlayers),
    playerController.getPlayers
  );

export default router;
/**
 * @swagger
 * tags:
 *   name: Players
 *   description: Player management and retrieval
 */

/**
 * @swagger
 * /players:
 *   get:
 *     summary: Get all players
 *     description: Fetch a list of players with optional filters.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by player name
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *           enum: [Goalkeeper, Defender, Midfielder, Attacker]
 *         description: Filter by player position
 *       - in: query
 *         name: nationality
 *         schema:
 *           type: string
 *         description: Filter by nationality
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field (e.g., value:asc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Player'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
