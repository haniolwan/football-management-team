import Joi from "joi";

const getPlayers = {
  query: Joi.object().keys({
    name: Joi.string(),
    team_name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
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

export default {
  getPlayers,
  getPlayer,
  listPlayer,
};
