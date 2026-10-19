// src/middlewares/validate.js
// Valida y sanea datos con un esquema de Zod. El resultado se deja en
// req.validado[source] para no chocar con los getters propios de Express.
/**
 * @param {import('zod').ZodType} schema Esquema de Zod.
 * @param {'body'|'query'|'params'} source Parte de la petición a validar.
 */
export function validar(schema, source = 'body') {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[source]);

    if (!resultado.success) {
      // El errorHandler central traduce ZodError a 422 con el detalle.
      return next(resultado.error);
    }

    req.validado = { ...(req.validado || {}), [source]: resultado.data };
    return next();
  };
}

export default validar;
