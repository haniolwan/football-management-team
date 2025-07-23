import Joi from "joi";

const getPlayers = {
  query: Joi.object().keys({
    name: Joi.string().allow(""),
    teamId: Joi.string().allow(""),
    team_name: Joi.string().allow(""),
    isListed: Joi.boolean(),
    sortType: Joi.string().allow(""),
    sortBy: Joi.string().allow(""),
    limit: Joi.number().integer().allow(""),
    page: Joi.number().integer().allow(""),
  }),
};

const getPlayer = {
  params: Joi.object().keys({
    id: Joi.string(),
  }),
};

const listPlayer = {
  params: Joi.object().keys({
    id: Joi.string(),
  }),

  body: Joi.object().keys({
    askingPrice: Joi.number().required(),
  }),
};

const purchasePlayer = {
  params: Joi.object().keys({
    playerId: Joi.string(),
    teamId: Joi.string(),
  }),
};

export default {
  getPlayers,
  getPlayer,
  listPlayer,
  purchasePlayer,
};
