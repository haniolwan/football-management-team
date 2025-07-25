import express from "express";
import auth from "../../middlewares/auth";
import validate from "../../middlewares/validate";
import { playerValidation } from "../../validations";
import { playerController } from "../../controllers";
const router = express.Router();

router
  .route("/list/:id")
  .post(
    auth("listPlayer"),
    validate(playerValidation.listPlayer),
    playerController.listPlayer
  );

router
  .route("/unlist/:id")
  .post(
    auth("listPlayer"),
    validate(playerValidation.getPlayer),
    playerController.unListPlayer
  );

router
  .route("/:id")
  .get(
    auth("getPlayer"),
    validate(playerValidation.getPlayer),
    playerController.getPlayerById
  );

router
  .route("/")
  .get(
    auth("getPlayers"),
    validate(playerValidation.getPlayers),
    playerController.getPlayers
  );

router
  .route("/purchase/:teamId/:playerId")
  .post(
    auth("purchasePlayer"),
    validate(playerValidation.purchasePlayer),
    playerController.purchasePlayer
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
 *     summary: Get market all players
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
 *         name: team name
 *         schema:
 *           type: string
 *         description: Filter by team name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         example: askingPrice:asc
 *         description: Sort by fields [ Name, Price, Team ]
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

/**
 * @swagger
 * /players/{id}:
 *   get:
 *     summary: Get player
 *     description: Get player by id.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the player to list
 *     responses:
 *       200:
 *         description: Player retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Player not found
 */

/**
 * @swagger
 * /players/list/{id}:
 *   post:
 *     summary: List selected player
 *     description: List a player for market sale by setting an asking price. The price can be above or below the player's actual value.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the player to list
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - askingPrice
 *             properties:
 *               askingPrice:
 *                 type: number
 *                 description: Price to list the player for on the transfer market
 *             example:
 *               askingPrice: 50000
 *     responses:
 *       200:
 *         description: Player listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Player not found
 */

/**
 * @swagger
 * /players/unlist/{id}:
 *   post:
 *     summary: Un-list selected player
 *     description: Un-list player from market sale.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the player to un-list
 *     responses:
 *       200:
 *         description: Player un-listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Player not found
 */

/**
 * @swagger
 * /players/{teamId}/{playerId}:
 *   post:
 *     summary: Purchase selected player
 *     description: Purchase player from the selected team.
 *     tags: [Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         schema:
 *           type: string
 *         description: ID of the team from which to purchase the player
 *       - in: path
 *         name: playerId
 *         schema:
 *           type: string
 *         description: ID of the player to be purchased
 *     responses:
 *       200:
 *         description: Player bought successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Player not found
 */
